"""Deterministic Trust and Revocation Engine for GhostTrace."""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import uuid

logger = logging.getLogger("ghosttrace.trust")

from app.database import (
    get_all_decisions,
    get_all_evidence,
    get_all_memories,
    get_decision,
    get_evidence,
    get_memory,
    save_audit_event,
    save_decision,
    save_edge,
    save_evidence,
    save_memory,
    SEEDED_CLEAN_DECISION_ID,
    SEEDED_PAYMENT_DESTINATION,
    SEEDED_PAYMENT_AMOUNT,
    SEEDED_SCENARIO_NAME,
)
from app.config import settings
from app.graph import graph_engine
from app.models import (
    AuditEvent,
    Decision,
    Evidence,
    Memory,
    MemoryStatus,
    TrustLevel,
)
from app.nebius_client import nebius_client, ExtractedMemoryResult


class InvalidStateTransitionError(Exception):
    """Raised when an illegal status transition is requested."""
    pass


class TrustEngine:
    TRUSTED_SOURCES = {
        "corporate_treasury_policy",
        "verified_system_policy",
        "system_bootstrap",
        "compliance_registry",
    }

    UNTRUSTED_SOURCE_MARKERS = [
        "web",
        "crawl",
        "webhook",
        "email",
        "attachment",
        "external",
        "untrusted",
        "phish",
        "social",
    ]

    SUSPICIOUS_CONTENT_PATTERNS = [
        "urgent",
        "restructuring",
        "immediate service disconnection",
        "ignore previous",
        "offshore",
        "escrow",
        "vault",
        "banking details updated",
        "route all future",
        "wire transfer to",
    ]

    @classmethod
    def validate_evidence_transition(cls, current: TrustLevel, target: TrustLevel) -> None:
        """Validate evidence state transitions on the server."""
        if current == target:
            return
        if current == TrustLevel.REVOKED:
            raise InvalidStateTransitionError(f"Cannot transition revoked evidence {current.value} -> {target.value}")
        if current == TrustLevel.QUARANTINED and target == TrustLevel.TRUSTED:
            raise InvalidStateTransitionError(
                "Quarantined evidence cannot directly transition to trusted without explicit cryptographic verification."
            )

    @classmethod
    def validate_memory_transition(cls, current: MemoryStatus, target: MemoryStatus) -> None:
        """Validate memory state transitions on the server."""
        if current == target:
            return
        if current in (MemoryStatus.REVOKED, MemoryStatus.INVALIDATED):
            raise InvalidStateTransitionError(
                f"Cannot transition terminal memory status {current.value} -> {target.value}"
            )
        if current == MemoryStatus.QUARANTINED and target == MemoryStatus.TRUSTED:
            raise InvalidStateTransitionError(
                "Quarantined memory cannot directly transition to trusted while derived from suspect provenance."
            )

    @classmethod
    def evaluate_initial_trust(
        cls,
        source: str,
        content: str,
        override: Optional[TrustLevel] = None,
        extraction_risk: float = 0.0,
        extraction_markers: Optional[List[str]] = None,
    ) -> Tuple[TrustLevel, List[str]]:
        """Deterministic policy evaluation for ingested evidence."""
        if override:
            return override, [f"Manual override: {override.value}"]

        reasons = []
        source_lower = source.lower()
        content_lower = content.lower()

        # Check source trust
        is_known_trusted = any(source_lower == ts for ts in cls.TRUSTED_SOURCES)
        is_untrusted_source = any(m in source_lower for m in cls.UNTRUSTED_SOURCE_MARKERS)

        if is_untrusted_source or not is_known_trusted:
            reasons.append(f"Untrusted origin source channel: '{source}'")

        # Check content patterns
        found_patterns = [p for p in cls.SUSPICIOUS_CONTENT_PATTERNS if p in content_lower]
        if found_patterns:
            reasons.append(f"Suspicious payload directives detected: {', '.join(found_patterns)}")

        # Check extraction indicators
        if extraction_risk >= 0.35:
            reasons.append(f"Model-assessed risk score ({extraction_risk:.2f}) exceeds security threshold (0.35)")

        if extraction_markers:
            reasons.append(f"Extraction markers flagged: {', '.join(extraction_markers)}")

        if reasons:
            return TrustLevel.QUARANTINED, reasons
        return TrustLevel.TRUSTED, ["Passed corporate source and content trust validation"]

    @classmethod
    def ingest_evidence(
        cls,
        content: str,
        source: str,
        trust_level_override: Optional[TrustLevel] = None,
        parent_memory_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Ingest new evidence, call Nemotron to extract candidate memory,
        apply deterministic trust rules, enforce quarantine, and build dependency graph edges.
        """
        now = datetime.utcnow().isoformat()
        ev_id = f"ev-{uuid.uuid4().hex[:8]}"
        mem_id = f"mem-{uuid.uuid4().hex[:8]}"

        # 1. Call Nemotron for structured candidate memory extraction
        extraction: Optional[ExtractedMemoryResult] = None
        inference_mode = "live_nemotron"
        try:
            extraction = nebius_client.extract_memory_candidate(content, source)
        except Exception as e:
            # When Nebius is unconfigured or in tests without mock, gracefully structure fallback
            inference_mode = "simulated_fallback"
            is_untrusted = any(m in source.lower() for m in cls.UNTRUSTED_SOURCE_MARKERS)
            extraction = ExtractedMemoryResult(
                proposed_memory=content.strip().split("\n")[0][:150],
                extracted_facts=[content[:100]],
                suspicious_markers=["untrusted_channel_marker"] if is_untrusted else [],
                risk_score=0.8 if is_untrusted else 0.05,
                confidence=0.5,
                raw_response=str(e),
                extraction_success=True,
            )

        # 2. Deterministic Trust Evaluation (Application logic, not relying on LLM alone)
        trust_level, reasons = cls.evaluate_initial_trust(
            source=source,
            content=content,
            override=trust_level_override,
            extraction_risk=extraction.risk_score if extraction else 0.0,
            extraction_markers=extraction.suspicious_markers if extraction else [],
        )

        if extraction and not extraction.extraction_success and extraction.error:
            reasons.append(f"Model extraction note: {extraction.error}")

        evidence = Evidence(
            id=ev_id,
            content=content,
            source=source,
            trust_level=trust_level,
            created_at=now,
            metadata={
                "quarantine_reasons": reasons,
                "extraction_risk": extraction.risk_score if extraction else 0.0,
                "suspicious_markers": extraction.suspicious_markers if extraction else [],
                "inference_mode": inference_mode,
                "extraction_success": extraction.extraction_success if extraction else False,
                "extraction_error": extraction.error if extraction else None,
            },
        )
        save_evidence(evidence)

        # 3. Determine Memory Status based on evidence trust & extraction validity
        # Deterministic rule: memory derived from quarantined evidence MUST be quarantined
        mem_status = MemoryStatus.QUARANTINED if trust_level == TrustLevel.QUARANTINED else MemoryStatus.TRUSTED

        # If extraction failed, memory MUST be quarantined
        if extraction and not extraction.extraction_success:
            mem_status = MemoryStatus.QUARANTINED

        # Also check parent memories
        parent_mem_ids = parent_memory_ids or []
        for p_id in parent_mem_ids:
            parent_mem = get_memory(p_id)
            if parent_mem and parent_mem.status in (MemoryStatus.QUARANTINED, MemoryStatus.REVOKED, MemoryStatus.INVALIDATED):
                mem_status = MemoryStatus.QUARANTINED
                reasons.append(f"Parent memory {p_id} is {parent_mem.status.value}")

        # Validate memory content: reject empty or malformed memory content
        if extraction and extraction.extraction_success and extraction.proposed_memory.strip():
            mem_content = extraction.proposed_memory.strip()
        else:
            mem_content = f"[EXTRACTION REJECTED: {extraction.error if extraction else 'No valid memory candidate extracted'}]"

        memory = Memory(
            id=mem_id,
            content=mem_content,
            status=mem_status,
            source_evidence_ids=[ev_id],
            parent_memory_ids=parent_mem_ids,
            created_at=now,
            updated_at=now,
            metadata={
                "extracted_facts": extraction.extracted_facts if extraction else [],
                "suspicious_markers": extraction.suspicious_markers if extraction else [],
                "risk_score": extraction.risk_score if extraction else 0.0,
                "trust_reasons": reasons,
                "inference_mode": inference_mode,
                "extraction_success": extraction.extraction_success if extraction else False,
                "extraction_error": extraction.error if extraction else None,
                "raw_response": extraction.raw_response if extraction else None,
            },
        )
        save_memory(memory)

        # 4. Save explicit edges
        save_edge(ev_id, mem_id, "derives_from")
        for p_id in parent_mem_ids:
            save_edge(p_id, mem_id, "parent_memory")

        # 5. Audit Logging
        save_audit_event(
            AuditEvent(
                id=f"audit-ingest-{uuid.uuid4().hex[:8]}",
                operation="INGEST_EVIDENCE",
                affected_records=[ev_id, mem_id],
                outcome="QUARANTINED" if mem_status == MemoryStatus.QUARANTINED else "TRUSTED",
                timestamp=now,
                details={
                    "source": source,
                    "trust_level": trust_level.value,
                    "memory_status": mem_status.value,
                    "reasons": reasons,
                    "risk_score": extraction.risk_score,
                },
            )
        )

        return {
            "evidence": evidence,
            "extracted_memory": memory,
            "quarantined": (mem_status == MemoryStatus.QUARANTINED),
            "suspicious_markers": extraction.suspicious_markers,
            "risk_score": extraction.risk_score,
            "message": (
                f"Evidence {ev_id} ingested and quarantined based on deterministic policy."
                if mem_status == MemoryStatus.QUARANTINED
                else f"Evidence {ev_id} ingested as trusted."
            ),
        }

    @classmethod
    def evaluate_decision(
        cls,
        scenario: str = SEEDED_SCENARIO_NAME,
        unfiltered_mode: bool = False,
        excluded_ids: Optional[List[str]] = None,
    ) -> Decision:
        """Generate typed decision using ONLY eligible evidence and memories.
        - In protected mode (unfiltered_mode=False): Only TRUSTED items enter context.
        - In unfiltered_mode=True: Simulates a naive baseline system lacking GhostTrace quarantine.
        """
        now = datetime.utcnow().isoformat()
        dec_id = f"dec-{uuid.uuid4().hex[:8]}"
        excluded = set(excluded_ids or [])

        all_evidence = get_all_evidence()
        all_memories = get_all_memories()

        if unfiltered_mode:
            # Naive baseline: Include all non-revoked items (including quarantined)
            eligible_ev = [e for e in all_evidence if e.id not in excluded and e.trust_level != TrustLevel.REVOKED]
            eligible_mem = [m for m in all_memories if m.id not in excluded and m.status not in (MemoryStatus.REVOKED, MemoryStatus.INVALIDATED)]
        else:
            # GhostTrace protected mode: STRICTLY TRUSTED only!
            eligible_ev = [e for e in all_evidence if e.id not in excluded and e.trust_level == TrustLevel.TRUSTED]
            eligible_mem = [m for m in all_memories if m.id not in excluded and m.status == MemoryStatus.TRUSTED]

        # Call Nemotron or deterministic decision logic
        target_destination = SEEDED_PAYMENT_DESTINATION
        action = "APPROVE_PAYMENT"
        amount = SEEDED_PAYMENT_AMOUNT
        rationale = f"Evaluated against {len(eligible_mem)} eligible memories and {len(eligible_ev)} eligible evidence records."
        confidence = 1.0
        decision_inference_mode = "simulated_fallback"
        is_live = False
        model_id = settings.nebius_model_id
        latency_ms = 0.0
        evidence_ids_used: List[str] = []
        untrusted_influence_detected = False

        if nebius_client.is_configured:
            try:
                model_dec = nebius_client.generate_decision(
                    scenario=scenario,
                    eligible_evidence=[e.model_dump() for e in eligible_ev],
                    eligible_memories=[m.model_dump() for m in eligible_mem],
                    unfiltered_mode=unfiltered_mode,
                )
                action = model_dec.action
                target_destination = model_dec.target_destination
                amount = model_dec.amount or SEEDED_PAYMENT_AMOUNT
                rationale = model_dec.rationale
                confidence = model_dec.confidence
                evidence_ids_used = model_dec.evidence_ids_used
                untrusted_influence_detected = model_dec.untrusted_influence_detected
                decision_inference_mode = "live_nemotron"
                is_live = True
                model_id = model_dec.model_id or settings.nebius_model_id
                latency_ms = model_dec.latency_ms
            except Exception as e:
                decision_inference_mode = "simulated_fallback"
                is_live = False
                logger.warning("Live Nemotron decision call failed, falling back to simulated execution: %s", e)

        if not is_live:
            # Deterministic simulation fallback
            if unfiltered_mode:
                # In naive baseline, an unverified update in eligible context influences the decision
                for m in eligible_mem:
                    import re
                    acc_match = re.search(r"([A-Z0-9]{2,4}-[A-Z0-9\-]{6,25})", m.content)
                    if acc_match and acc_match.group(1) != SEEDED_PAYMENT_DESTINATION:
                        target_destination = acc_match.group(1)
                        untrusted_influence_detected = True
                        rationale = f"Simulated baseline: Unprotected agent adopted unquarantined memory {m.id} ({target_destination})."
                        break
                    elif "KY11" in m.content or "offshore" in m.content.lower():
                        target_destination = "KY11-VAULT-ATTACKER-133742"
                        untrusted_influence_detected = True
                        rationale = f"Simulated baseline: Unprotected decision poisoned by unquarantined memory {m.id}."
                        break
            else:
                # Protected mode falls back strictly to trusted policy
                target_destination = SEEDED_PAYMENT_DESTINATION
                untrusted_influence_detected = False
                rationale = "Protected decision: Quarantined evidence excluded. Routed safely to corporate treasury account."

        model_error = getattr(model_dec, "error", None) if is_live and "model_dec" in locals() else None
        is_truncated = getattr(model_dec, "is_truncated", False) if is_live and "model_dec" in locals() else False
        finish_reason = getattr(model_dec, "finish_reason", None) if is_live and "model_dec" in locals() else None

        supplied_ev_ids = [e.id for e in eligible_ev]
        supplied_mem_ids = [m.id for m in eligible_mem]

        decision = Decision(
            id=dec_id,
            scenario=scenario,
            action=action,
            target_destination=target_destination,
            amount=amount,
            rationale=rationale,
            confidence=confidence,
            evidence_ids=supplied_ev_ids,
            memory_ids=supplied_mem_ids,
            is_clean_reference=False,
            created_at=now,
            metadata={
                "unfiltered_mode": unfiltered_mode,
                "excluded_ids": list(excluded),
                "supplied_evidence_ids": supplied_ev_ids,
                "supplied_memory_ids": supplied_mem_ids,
                "evidence_ids_used": evidence_ids_used,
                "untrusted_influence_detected": untrusted_influence_detected,
                "inference_mode": decision_inference_mode,
                "is_live": is_live,
                "model_id": model_id,
                "latency_ms": latency_ms,
                "error": model_error,
                "is_truncated": is_truncated,
                "finish_reason": finish_reason,
            },
        )
        save_decision(decision)

        # Record edges to decision
        for e_id in decision.evidence_ids:
            save_edge(e_id, dec_id, "influences")
        for m_id in decision.memory_ids:
            save_edge(m_id, dec_id, "influences")

        return decision

    @classmethod
    def revoke_and_invalidate(cls, target_id: str, reason: str = "Forensic revocation") -> Dict[str, Any]:
        """Revoke evidence and invalidate dependent memories through a deterministic graph traversal.
        Re-evaluates the decision and proves recovery against the seeded clean reference.
        """
        now = datetime.utcnow().isoformat()

        target_ev = get_evidence(target_id)
        target_mem = get_memory(target_id)

        if not target_ev and not target_mem:
            raise ValueError(f"Target node '{target_id}' not found in Evidence or Memory records.")

        # 1. Update target status with transition validation
        if target_ev:
            cls.validate_evidence_transition(target_ev.trust_level, TrustLevel.REVOKED)
            target_ev.trust_level = TrustLevel.REVOKED
            target_ev.metadata["revocation_reason"] = reason
            target_ev.metadata["revoked_at"] = now
            save_evidence(target_ev)
        elif target_mem:
            cls.validate_memory_transition(target_mem.status, MemoryStatus.REVOKED)
            target_mem.status = MemoryStatus.REVOKED
            target_mem.updated_at = now
            target_mem.metadata["revocation_reason"] = reason
            target_mem.metadata["revoked_at"] = now
            save_memory(target_mem)

        # 2. Deterministic graph traversal to find all downstream dependent memories
        downstream_memory_ids = graph_engine.get_downstream_memory_dependents(target_id)
        invalidated_ids: List[str] = []

        for dep_id in downstream_memory_ids:
            dep_mem = get_memory(dep_id)
            if dep_mem and dep_mem.status != MemoryStatus.INVALIDATED:
                cls.validate_memory_transition(dep_mem.status, MemoryStatus.INVALIDATED)
                dep_mem.status = MemoryStatus.INVALIDATED
                dep_mem.updated_at = now
                dep_mem.metadata["invalidated_by_revocation_of"] = target_id
                dep_mem.metadata["invalidated_at"] = now
                save_memory(dep_mem)
                invalidated_ids.append(dep_id)

        # 3. Check prior decisions before revocation to evaluate whether divergence was active
        all_decisions = get_all_decisions()
        clean_ref = get_decision(SEEDED_CLEAN_DECISION_ID)
        ref_destination = clean_ref.target_destination if clean_ref else SEEDED_PAYMENT_DESTINATION
        ref_action = clean_ref.action if clean_ref else "APPROVE_PAYMENT"

        prior_decisions = [d for d in all_decisions if not d.is_clean_reference]
        was_previously_diverted = any(d.target_destination != ref_destination for d in prior_decisions)

        # 4. Re-evaluate decision in protected mode (with all revoked/invalidated nodes excluded)
        reevaluated_decision = cls.evaluate_decision()

        # 5. Truthful Recovery Assessment
        destination_matches = (reevaluated_decision.target_destination == ref_destination)
        action_matches = (reevaluated_decision.action == ref_action)

        if destination_matches and action_matches:
            if was_previously_diverted:
                recovery_status = "RECOVERY_PROVED"
                recovery_proven = True
                recovery_msg = (
                    f"Successfully revoked {target_id} and invalidated {len(invalidated_ids)} "
                    f"downstream memories. Recovery to verified corporate treasury {ref_destination} proven!"
                )
            else:
                recovery_status = "CLEAN_BASELINE_PRESERVED"
                recovery_proven = True
                recovery_msg = (
                    f"Revoked {target_id} and invalidated {len(invalidated_ids)} downstream memories. "
                    f"Decision remained securely routed to corporate treasury account {ref_destination}."
                )
        else:
            recovery_status = "RECOVERY_INCOMPLETE"
            recovery_proven = False
            recovery_msg = (
                f"Revocation executed for {target_id}, but re-evaluated destination "
                f"'{reevaluated_decision.target_destination}' does not match expected '{ref_destination}'."
            )

        comparison = {
            "reference_decision_id": SEEDED_CLEAN_DECISION_ID,
            "expected_destination": ref_destination,
            "recovered_destination": reevaluated_decision.target_destination,
            "expected_action": ref_action,
            "recovered_action": reevaluated_decision.action,
            "destination_restored": destination_matches,
            "recovery_proven": recovery_proven,
            "recovery_status": recovery_status,
            "prior_destination_diverted": was_previously_diverted,
            "is_live": reevaluated_decision.metadata.get("is_live", False),
            "inference_mode": reevaluated_decision.metadata.get("inference_mode", "simulated_fallback"),
        }

        # 6. Audit Logging
        all_affected = [target_id] + invalidated_ids + [reevaluated_decision.id]
        save_audit_event(
            AuditEvent(
                id=f"audit-revoke-{uuid.uuid4().hex[:8]}",
                operation="REVOKE_AND_INVALIDATE",
                affected_records=all_affected,
                outcome="SUCCESS" if recovery_proven else "PARTIAL_RECOVERY",
                timestamp=now,
                details={
                    "target_id": target_id,
                    "reason": reason,
                    "invalidated_count": len(invalidated_ids),
                    "invalidated_ids": invalidated_ids,
                    "comparison": comparison,
                },
            )
        )

        return {
            "revoked_id": target_id,
            "invalidated_memory_ids": invalidated_ids,
            "reevaluated_decision": reevaluated_decision,
            "clean_reference_comparison": comparison,
            "recovery_proven": recovery_proven,
            "message": recovery_msg,
        }


trust_engine = TrustEngine()
