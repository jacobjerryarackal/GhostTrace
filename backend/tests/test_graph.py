"""Tests for dependency graph integrity and traversal."""

from app.database import (
    SEEDED_EVIDENCE_ID,
    SEEDED_MEMORY_ID,
    SEEDED_CLEAN_DECISION_ID,
    save_edge,
    save_evidence,
    save_memory,
)
from app.graph import graph_engine
from app.models import Evidence, Memory, MemoryStatus, TrustLevel


def test_graph_integrity_seeded_nodes():
    """Verify that seeded nodes and edges form a valid provenance graph."""
    graph = graph_engine.build_provenance_graph()
    node_ids = {n.id for n in graph.nodes}

    assert SEEDED_EVIDENCE_ID in node_ids
    assert SEEDED_MEMORY_ID in node_ids
    assert SEEDED_CLEAN_DECISION_ID in node_ids

    # Verify edge connectivity
    edges = [(e.source, e.target, e.relationship) for e in graph.edges]
    assert (SEEDED_EVIDENCE_ID, SEEDED_MEMORY_ID, "derives_from") in edges
    assert (SEEDED_MEMORY_ID, SEEDED_CLEAN_DECISION_ID, "influences") in edges


def test_downstream_dependency_traversal():
    """Verify BFS traversal discovers direct and transitive dependent memories."""
    # Create multi-hop dependency: ev1 -> mem1 -> mem2 -> mem3
    ev1 = Evidence(id="ev-test-1", content="New root policy", source="web_crawl", trust_level=TrustLevel.QUARANTINED)
    mem1 = Memory(id="mem-test-1", content="Derived fact 1", status=MemoryStatus.QUARANTINED, source_evidence_ids=["ev-test-1"])
    mem2 = Memory(id="mem-test-2", content="Derived fact 2", status=MemoryStatus.QUARANTINED, parent_memory_ids=["mem-test-1"])
    mem3 = Memory(id="mem-test-3", content="Derived fact 3", status=MemoryStatus.QUARANTINED, parent_memory_ids=["mem-test-2"])

    save_evidence(ev1)
    save_memory(mem1)
    save_memory(mem2)
    save_memory(mem3)

    save_edge("ev-test-1", "mem-test-1", "derives_from")
    save_edge("mem-test-1", "mem-test-2", "parent_memory")
    save_edge("mem-test-2", "mem-test-3", "parent_memory")

    # Traverse from root evidence
    dependents = graph_engine.get_downstream_memory_dependents("ev-test-1")
    assert "mem-test-1" in dependents
    assert "mem-test-2" in dependents
    assert "mem-test-3" in dependents

    # Traverse from middle node
    mid_dependents = graph_engine.get_downstream_memory_dependents("mem-test-2")
    assert "mem-test-3" in mid_dependents
    assert "mem-test-1" not in mid_dependents


def test_upstream_provenance_lookup():
    """Verify upstream provenance resolution tracks origin evidence and memories."""
    ev = Evidence(id="ev-src", content="Origin memo", source="corporate_treasury_policy")
    mem_p = Memory(id="mem-parent", content="Parent rule", source_evidence_ids=["ev-src"])
    mem_c = Memory(id="mem-child", content="Child action", parent_memory_ids=["mem-parent"])

    save_evidence(ev)
    save_memory(mem_p)
    save_memory(mem_c)

    save_edge("ev-src", "mem-parent", "derives_from")
    save_edge("mem-parent", "mem-child", "parent_memory")

    prov = graph_engine.get_upstream_provenance("mem-child")
    assert "ev-src" in prov["evidence_ids"]
    assert "mem-parent" in prov["memory_ids"]

