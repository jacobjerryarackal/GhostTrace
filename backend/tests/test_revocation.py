"""Tests for recursive revocation, dependent memory invalidation, and recovery verification."""

from app.database import (
    get_all_memories,
    get_evidence,
    get_memory,
    save_edge,
    save_evidence,
    save_memory,
    SEEDED_PAYMENT_DESTINATION,
)
from app.models import Evidence, Memory, MemoryStatus, TrustLevel
from app.trust_engine import trust_engine


def test_recursive_revocation_of_evidence():
    """Verify revoking root evidence transitively invalidates all child memories."""
    # Build tree: ev_bad -> mem_bad_1 -> mem_bad_2
    ev_bad = Evidence(id="ev-bad-root", content="Fraudulent notice", source="untrusted_webhook", trust_level=TrustLevel.QUARANTINED)
    mem_bad_1 = Memory(id="mem-bad-1", content="Update bank rule", status=MemoryStatus.QUARANTINED, source_evidence_ids=["ev-bad-root"])
    mem_bad_2 = Memory(id="mem-bad-2", content="Derived routing instruction", status=MemoryStatus.QUARANTINED, parent_memory_ids=["mem-bad-1"])

    save_evidence(ev_bad)
    save_memory(mem_bad_1)
    save_memory(mem_bad_2)

    save_edge("ev-bad-root", "mem-bad-1", "derives_from")
    save_edge("mem-bad-1", "mem-bad-2", "parent_memory")

    # Perform revocation
    res = trust_engine.revoke_and_invalidate("ev-bad-root", reason="Confirmed phishing attack")

    # Verify root evidence status
    updated_ev = get_evidence("ev-bad-root")
    assert updated_ev.trust_level == TrustLevel.REVOKED

    # Verify both child memories are INVALIDATED
    assert "mem-bad-1" in res["invalidated_memory_ids"]
    assert "mem-bad-2" in res["invalidated_memory_ids"]

    assert get_memory("mem-bad-1").status == MemoryStatus.INVALIDATED
    assert get_memory("mem-bad-2").status == MemoryStatus.INVALIDATED

    # Verify recovery against clean reference
    assert res["recovery_proven"] is True
    assert res["clean_reference_comparison"]["destination_restored"] is True
    assert res["clean_reference_comparison"]["recovered_destination"] == SEEDED_PAYMENT_DESTINATION


def test_revocation_of_intermediate_memory():
    """Verify revoking a specific memory invalidates its children while leaving unrelated nodes intact."""
    ev = Evidence(id="ev-mix", content="Mixed report", source="corporate_treasury_policy")
    mem_a = Memory(id="mem-branch-a", content="Branch A", source_evidence_ids=["ev-mix"])
    mem_b = Memory(id="mem-branch-b", content="Branch B", parent_memory_ids=["mem-branch-a"])
    mem_c = Memory(id="mem-branch-c", content="Branch C (independent)", source_evidence_ids=["ev-mix"])

    save_evidence(ev)
    save_memory(mem_a)
    save_memory(mem_b)
    save_memory(mem_c)

    save_edge("ev-mix", "mem-a", "derives_from")
    save_edge("mem-branch-a", "mem-branch-b", "parent_memory")
    save_edge("ev-mix", "mem-c", "derives_from")

    # Revoke mem-branch-a
    res = trust_engine.revoke_and_invalidate("mem-branch-a", reason="Targeted memory purge")

    assert get_memory("mem-branch-a").status == MemoryStatus.REVOKED
    assert get_memory("mem-branch-b").status == MemoryStatus.INVALIDATED
    # mem_c should remain TRUSTED
    assert get_memory("mem-branch-c").status == MemoryStatus.TRUSTED


def test_revocation_preview_does_not_mutate_state():
    """Verify that calling preview returns accurate blast radius without altering database records."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    # Build chain: ev-prev -> mem-prev-1 -> mem-prev-2
    ev = Evidence(id="ev-prev", content="Preview test evidence", source="untrusted_webhook", trust_level=TrustLevel.QUARANTINED)
    mem1 = Memory(id="mem-prev-1", content="Preview memory 1", status=MemoryStatus.QUARANTINED, source_evidence_ids=["ev-prev"])
    mem2 = Memory(id="mem-prev-2", content="Preview memory 2", status=MemoryStatus.QUARANTINED, parent_memory_ids=["mem-prev-1"])

    save_evidence(ev)
    save_memory(mem1)
    save_memory(mem2)
    save_edge("ev-prev", "mem-prev-1", "derives_from")
    save_edge("mem-prev-1", "mem-prev-2", "parent_memory")

    # Call preview endpoint
    res = client.get("/api/revoke/preview?target_id=ev-prev")
    assert res.status_code == 200
    data = res.json()

    assert data["target_id"] == "ev-prev"
    assert data["target_type"] == "evidence"
    assert data["target_status"] == "quarantined"
    assert "mem-prev-1" in data["invalidated_memory_ids"]
    assert "mem-prev-2" in data["invalidated_memory_ids"]
    assert data["recovery_destination"] == SEEDED_PAYMENT_DESTINATION
    assert data["will_reevaluate"] is True

    # Critical check: State in DB is completely UNCHANGED
    assert get_evidence("ev-prev").trust_level == TrustLevel.QUARANTINED
    assert get_memory("mem-prev-1").status == MemoryStatus.QUARANTINED
    assert get_memory("mem-prev-2").status == MemoryStatus.QUARANTINED

    # Test unknown node returns 404
    res_404 = client.get("/api/revoke/preview?target_id=non-existent-node")
    assert res_404.status_code == 404


