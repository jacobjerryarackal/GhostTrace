"""Behavioral Dependency Testing and Interventional Replay Engine for GhostTrace."""

from datetime import datetime
import time
from typing import Any, Dict, List, Optional
import uuid

from app.database import (
    get_all_evidence,
    get_all_memories,
    save_audit_event,
    save_replay,
    SEEDED_PAYMENT_DESTINATION,
    SEEDED_PAYMENT_AMOUNT,
    SEEDED_SCENARIO_NAME,
)
from app.graph import graph_engine
from app.models import (
    AuditEvent,
    ReplayResult,
)
from app.trust_engine import trust_engine


class ReplayEngine:
    @staticmethod
    def run_replay(suspect_ids: List[str]) -> ReplayResult:
        """Execute behavioral dependency testing (interventional replay) by comparing
        the baseline decision against the counterfactual decision with suspect nodes removed.
        """
        start_time = time.perf_counter()
        now = datetime.utcnow().isoformat()
        replay_id = f"replay-{uuid.uuid4().hex[:8]}"

        # 1. Expand suspect IDs to include all transitively derived downstream memories
        all_removed_ids: set = set(suspect_ids)
        for s_id in suspect_ids:
            deps = graph_engine.get_downstream_memory_dependents(s_id)
            all_removed_ids.update(deps)

        removed_list = sorted(list(all_removed_ids))

        # 2. Compute Baseline Decision (Simulating un-intervened context where suspect evidence was accepted)
        # Note: Unfiltered mode demonstrates what happens when the suspect evidence was allowed to influence the agent
        baseline_dec = trust_engine.evaluate_decision(
            scenario=SEEDED_SCENARIO_NAME,
            unfiltered_mode=True,
            excluded_ids=[],
        )

        # 3. Compute Counterfactual Decision (With suspect provenance nodes surgically removed)
        counterfactual_dec = trust_engine.evaluate_decision(
            scenario=SEEDED_SCENARIO_NAME,
            unfiltered_mode=False,
            excluded_ids=removed_list,
        )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        baseline_outcome = {
            "decision_id": baseline_dec.id,
            "action": baseline_dec.action,
            "target_destination": baseline_dec.target_destination,
            "amount": baseline_dec.amount,
            "confidence": baseline_dec.confidence,
            "rationale": baseline_dec.rationale,
            "context_memory_ids": baseline_dec.memory_ids,
        }

        counterfactual_outcome = {
            "decision_id": counterfactual_dec.id,
            "action": counterfactual_dec.action,
            "target_destination": counterfactual_dec.target_destination,
            "amount": counterfactual_dec.amount,
            "confidence": counterfactual_dec.confidence,
            "rationale": counterfactual_dec.rationale,
            "context_memory_ids": counterfactual_dec.memory_ids,
        }

        # 4. Assess Behavioral Dependence
        destination_changed = (
            baseline_outcome["target_destination"] != counterfactual_outcome["target_destination"]
        )
        action_changed = baseline_outcome["action"] != counterfactual_outcome["action"]

        if destination_changed or action_changed:
            dependence_detected = True
            assessment = (
                f"BEHAVIORAL_DEPENDENCE_CONFIRMED: Removing suspect nodes {removed_list} altered target destination "
                f"from '{baseline_outcome['target_destination']}' to '{counterfactual_outcome['target_destination']}'. "
                "The agent's decision exhibited empirical dependence on the suspect evidence."
            )
        else:
            dependence_detected = False
            assessment = (
                "INCONCLUSIVE_OR_INDEPENDENT: No outcome shift was observed under this single intervention. "
                "Note: Inconclusive replay results provide evidence of behavioral invariance under test conditions, "
                "but DO NOT constitute a security guarantee."
            )

        replay_result = ReplayResult(
            id=replay_id,
            baseline_outcome=baseline_outcome,
            counterfactual_outcome=counterfactual_outcome,
            removed_ids=removed_list,
            behavioral_dependence_detected=dependence_detected,
            consistency_assessment=assessment,
            latency_ms=elapsed_ms,
            created_at=now,
            metadata={
                "suspect_inputs": suspect_ids,
                "transitively_removed_count": len(removed_list),
                "destination_divergence": destination_changed,
            },
        )

        save_replay(replay_result)

        # 5. Record Audit Event
        save_audit_event(
            AuditEvent(
                id=f"audit-replay-{uuid.uuid4().hex[:8]}",
                operation="INTERVENTIONAL_REPLAY_TEST",
                affected_records=removed_list,
                outcome="DEPENDENCE_CONFIRMED" if dependence_detected else "INCONCLUSIVE",
                timestamp=now,
                details={
                    "replay_id": replay_id,
                    "removed_ids": removed_list,
                    "latency_ms": elapsed_ms,
                    "dependence_detected": dependence_detected,
                    "baseline_destination": baseline_outcome["target_destination"],
                    "counterfactual_destination": counterfactual_outcome["target_destination"],
                },
            )
        )

        return replay_result


replay_engine = ReplayEngine()

