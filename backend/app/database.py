"""Persistent SQLite Database Layer for GhostTrace."""

import json
import sqlite3
import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.config import settings
from app.models import (
    AuditEvent,
    Decision,
    Evidence,
    Memory,
    MemoryStatus,
    ReplayResult,
    TrustLevel,
)

# Seeded Clean Policy & Reference Constants
SEEDED_EVIDENCE_ID = "ev-seed-corp-policy"
SEEDED_MEMORY_ID = "mem-seed-corp-routing"
SEEDED_CLEAN_DECISION_ID = "dec-clean-ref"
SEEDED_PAYMENT_DESTINATION = "US89-ACME-CORP-9876543210"
SEEDED_PAYMENT_AMOUNT = 14250.00
SEEDED_SCENARIO_NAME = "Corporate Vendor Invoice & Payment Routing: Acme Cloud Services Monthly Retainer"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS evidence (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            source TEXT NOT NULL,
            trust_level TEXT NOT NULL,
            created_at TEXT NOT NULL,
            metadata_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            status TEXT NOT NULL,
            source_evidence_ids TEXT NOT NULL DEFAULT '[]',
            parent_memory_ids TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            metadata_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS decisions (
            id TEXT PRIMARY KEY,
            scenario TEXT NOT NULL,
            action TEXT NOT NULL,
            target_destination TEXT NOT NULL,
            amount REAL NOT NULL,
            rationale TEXT NOT NULL,
            confidence REAL NOT NULL,
            evidence_ids TEXT NOT NULL DEFAULT '[]',
            memory_ids TEXT NOT NULL DEFAULT '[]',
            is_clean_reference INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            metadata_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS replays (
            id TEXT PRIMARY KEY,
            baseline_outcome TEXT NOT NULL,
            counterfactual_outcome TEXT NOT NULL,
            removed_ids TEXT NOT NULL,
            behavioral_dependence_detected INTEGER NOT NULL,
            consistency_assessment TEXT NOT NULL,
            latency_ms REAL NOT NULL,
            created_at TEXT NOT NULL,
            metadata_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS audit_events (
            id TEXT PRIMARY KEY,
            operation TEXT NOT NULL,
            affected_records TEXT NOT NULL DEFAULT '[]',
            outcome TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            details_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS edges (
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            relationship TEXT NOT NULL,
            PRIMARY KEY (source_id, target_id, relationship)
        );
    """)

    conn.commit()
    conn.close()

    # If evidence table is empty, seed demo dataset
    if not get_all_evidence():
        reset_demo_dataset()


def reset_demo_dataset() -> Dict[str, Any]:
    """Resets the demo state to a pristine seeded state with clean user payment policy and clean reference decision."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear tables
    cursor.execute("DELETE FROM evidence")
    cursor.execute("DELETE FROM memories")
    cursor.execute("DELETE FROM decisions")
    cursor.execute("DELETE FROM replays")
    cursor.execute("DELETE FROM edges")
    cursor.execute("DELETE FROM audit_events")
    conn.commit()

    now = datetime.utcnow().isoformat()
    reset_uid = uuid.uuid4().hex[:8]

    # 1. Seed Clean Policy Evidence
    seed_ev = Evidence(
        id=SEEDED_EVIDENCE_ID,
        content=(
            "Corporate Treasury AP Policy Rule 401.A: Authorized payment routing destination for "
            "vendor Acme Cloud Services is verified account US89-ACME-CORP-9876543210 (JPMorgan Chase Treasury). "
            "Any modification requires dual cryptographic executive authorization."
        ),
        source="corporate_treasury_policy",
        trust_level=TrustLevel.TRUSTED,
        created_at=now,
        metadata={"verified_by": "Treasury Compliance", "immutable_rule": True},
    )
    save_evidence(seed_ev, conn=conn)

    # 2. Seed Derived Trusted Memory
    seed_mem = Memory(
        id=SEEDED_MEMORY_ID,
        content=(
            f"Approved payment destination for vendor Acme Cloud Services is {SEEDED_PAYMENT_DESTINATION}. "
            "Verified against corporate treasury registry."
        ),
        status=MemoryStatus.TRUSTED,
        source_evidence_ids=[SEEDED_EVIDENCE_ID],
        parent_memory_ids=[],
        created_at=now,
        updated_at=now,
        metadata={"trust_score": 1.0, "source": "system_bootstrap"},
    )
    save_memory(seed_mem, conn=conn)

    # 3. Seed Clean Reference Decision
    seed_dec = Decision(
        id=SEEDED_CLEAN_DECISION_ID,
        scenario=SEEDED_SCENARIO_NAME,
        action="APPROVE_PAYMENT",
        target_destination=SEEDED_PAYMENT_DESTINATION,
        amount=SEEDED_PAYMENT_AMOUNT,
        rationale=(
            f"Authorized invoice payment of ${SEEDED_PAYMENT_AMOUNT:,.2f} routed to verified treasury account "
            f"{SEEDED_PAYMENT_DESTINATION} adhering to Rule 401.A."
        ),
        confidence=1.0,
        evidence_ids=[SEEDED_EVIDENCE_ID],
        memory_ids=[SEEDED_MEMORY_ID],
        is_clean_reference=True,
        created_at=now,
        metadata={"baseline_type": "ground_truth_clean_reference"},
    )
    save_decision(seed_dec, conn=conn)

    # 4. Explicit edges
    save_edge(SEEDED_EVIDENCE_ID, SEEDED_MEMORY_ID, "derives_from", conn=conn)
    save_edge(SEEDED_MEMORY_ID, SEEDED_CLEAN_DECISION_ID, "influences", conn=conn)
    save_edge(SEEDED_EVIDENCE_ID, SEEDED_CLEAN_DECISION_ID, "references", conn=conn)

    # 5. Audit Event
    audit_ev = AuditEvent(
        id=f"audit-reset-{reset_uid}",
        operation="DEMO_RESET",
        affected_records=[SEEDED_EVIDENCE_ID, SEEDED_MEMORY_ID, SEEDED_CLEAN_DECISION_ID],
        outcome="SUCCESS",
        timestamp=now,
        details={
            "description": "Seeded clean user payment policy and pristine reference decision",
            "reference_destination": SEEDED_PAYMENT_DESTINATION,
            "scenario": SEEDED_SCENARIO_NAME,
        },
    )
    save_audit_event(audit_ev, conn=conn)

    conn.commit()
    conn.close()

    return {
        "status": "reset_complete",
        "seeded_evidence_id": SEEDED_EVIDENCE_ID,
        "seeded_memory_id": SEEDED_MEMORY_ID,
        "seeded_clean_decision_id": SEEDED_CLEAN_DECISION_ID,
        "timestamp": now,
    }


# Persistence Helpers
def save_evidence(evidence: Evidence, conn: Optional[sqlite3.Connection] = None) -> None:
    close = False
    if conn is None:
        conn = get_db_connection()
        close = True
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO evidence (id, content, source, trust_level, created_at, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            evidence.id,
            evidence.content,
            evidence.source,
            evidence.trust_level.value,
            evidence.created_at,
            json.dumps(evidence.metadata),
        ),
    )
    if close:
        conn.commit()
        conn.close()


def get_evidence(evidence_id: str) -> Optional[Evidence]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evidence WHERE id = ?", (evidence_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return Evidence(
        id=row["id"],
        content=row["content"],
        source=row["source"],
        trust_level=TrustLevel(row["trust_level"]),
        created_at=row["created_at"],
        metadata=json.loads(row["metadata_json"]),
    )


def get_all_evidence() -> List[Evidence]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evidence ORDER BY created_at ASC")
    rows = cursor.fetchall()
    conn.close()
    return [
        Evidence(
            id=r["id"],
            content=r["content"],
            source=r["source"],
            trust_level=TrustLevel(r["trust_level"]),
            created_at=r["created_at"],
            metadata=json.loads(r["metadata_json"]),
        )
        for r in rows
    ]


def save_memory(memory: Memory, conn: Optional[sqlite3.Connection] = None) -> None:
    close = False
    if conn is None:
        conn = get_db_connection()
        close = True
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO memories 
        (id, content, status, source_evidence_ids, parent_memory_ids, created_at, updated_at, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            memory.id,
            memory.content,
            memory.status.value,
            json.dumps(memory.source_evidence_ids),
            json.dumps(memory.parent_memory_ids),
            memory.created_at,
            memory.updated_at,
            json.dumps(memory.metadata),
        ),
    )
    if close:
        conn.commit()
        conn.close()


def get_memory(memory_id: str) -> Optional[Memory]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM memories WHERE id = ?", (memory_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return Memory(
        id=row["id"],
        content=row["content"],
        status=MemoryStatus(row["status"]),
        source_evidence_ids=json.loads(row["source_evidence_ids"]),
        parent_memory_ids=json.loads(row["parent_memory_ids"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        metadata=json.loads(row["metadata_json"]),
    )


def get_all_memories() -> List[Memory]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM memories ORDER BY created_at ASC")
    rows = cursor.fetchall()
    conn.close()
    return [
        Memory(
            id=r["id"],
            content=r["content"],
            status=MemoryStatus(r["status"]),
            source_evidence_ids=json.loads(r["source_evidence_ids"]),
            parent_memory_ids=json.loads(r["parent_memory_ids"]),
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            metadata=json.loads(r["metadata_json"]),
        )
        for r in rows
    ]


def save_decision(decision: Decision, conn: Optional[sqlite3.Connection] = None) -> None:
    close = False
    if conn is None:
        conn = get_db_connection()
        close = True
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO decisions 
        (id, scenario, action, target_destination, amount, rationale, confidence, evidence_ids, memory_ids, is_clean_reference, created_at, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            decision.id,
            decision.scenario,
            decision.action,
            decision.target_destination,
            decision.amount,
            decision.rationale,
            decision.confidence,
            json.dumps(decision.evidence_ids),
            json.dumps(decision.memory_ids),
            1 if decision.is_clean_reference else 0,
            decision.created_at,
            json.dumps(decision.metadata),
        ),
    )
    if close:
        conn.commit()
        conn.close()


def get_decision(decision_id: str) -> Optional[Decision]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM decisions WHERE id = ?", (decision_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return Decision(
        id=row["id"],
        scenario=row["scenario"],
        action=row["action"],
        target_destination=row["target_destination"],
        amount=row["amount"],
        rationale=row["rationale"],
        confidence=row["confidence"],
        evidence_ids=json.loads(row["evidence_ids"]),
        memory_ids=json.loads(row["memory_ids"]),
        is_clean_reference=bool(row["is_clean_reference"]),
        created_at=row["created_at"],
        metadata=json.loads(row["metadata_json"]),
    )


def get_all_decisions() -> List[Decision]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM decisions ORDER BY created_at ASC")
    rows = cursor.fetchall()
    conn.close()
    return [
        Decision(
            id=r["id"],
            scenario=r["scenario"],
            action=r["action"],
            target_destination=r["target_destination"],
            amount=r["amount"],
            rationale=r["rationale"],
            confidence=r["confidence"],
            evidence_ids=json.loads(r["evidence_ids"]),
            memory_ids=json.loads(r["memory_ids"]),
            is_clean_reference=bool(r["is_clean_reference"]),
            created_at=r["created_at"],
            metadata=json.loads(r["metadata_json"]),
        )
        for r in rows
    ]


def save_replay(replay: ReplayResult) -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO replays
        (id, baseline_outcome, counterfactual_outcome, removed_ids, behavioral_dependence_detected, consistency_assessment, latency_ms, created_at, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            replay.id,
            json.dumps(replay.baseline_outcome),
            json.dumps(replay.counterfactual_outcome),
            json.dumps(replay.removed_ids),
            1 if replay.behavioral_dependence_detected else 0,
            replay.consistency_assessment,
            replay.latency_ms,
            replay.created_at,
            json.dumps(replay.metadata),
        ),
    )
    conn.commit()
    conn.close()


def get_latest_replay() -> Optional[ReplayResult]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM replays ORDER BY created_at DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return ReplayResult(
        id=row["id"],
        baseline_outcome=json.loads(row["baseline_outcome"]),
        counterfactual_outcome=json.loads(row["counterfactual_outcome"]),
        removed_ids=json.loads(row["removed_ids"]),
        behavioral_dependence_detected=bool(row["behavioral_dependence_detected"]),
        consistency_assessment=row["consistency_assessment"],
        latency_ms=row["latency_ms"],
        created_at=row["created_at"],
        metadata=json.loads(row["metadata_json"]),
    )


def save_audit_event(event: AuditEvent, conn: Optional[sqlite3.Connection] = None) -> None:
    close = False
    if conn is None:
        conn = get_db_connection()
        close = True
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO audit_events (id, operation, affected_records, outcome, timestamp, details_json)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            event.id,
            event.operation,
            json.dumps(event.affected_records),
            event.outcome,
            event.timestamp,
            json.dumps(event.details),
        ),
    )
    if close:
        conn.commit()
        conn.close()


def get_audit_trail(limit: int = 50) -> List[AuditEvent]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [
        AuditEvent(
            id=r["id"],
            operation=r["operation"],
            affected_records=json.loads(r["affected_records"]),
            outcome=r["outcome"],
            timestamp=r["timestamp"],
            details=json.loads(r["details_json"]),
        )
        for r in rows
    ]


def save_edge(source_id: str, target_id: str, relationship: str, conn: Optional[sqlite3.Connection] = None) -> None:
    close = False
    if conn is None:
        conn = get_db_connection()
        close = True
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR IGNORE INTO edges (source_id, target_id, relationship)
        VALUES (?, ?, ?)
        """,
        (source_id, target_id, relationship),
    )
    if close:
        conn.commit()
        conn.close()


def get_all_edges() -> List[Dict[str, str]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT source_id, target_id, relationship FROM edges")
    rows = cursor.fetchall()
    conn.close()
    return [{"source": r["source_id"], "target": r["target_id"], "relationship": r["relationship"]} for r in rows]
