"""Dependency and Provenance Graph Engine for GhostTrace."""

from typing import Dict, List, Set, Tuple
from collections import deque

from app.database import (
    get_all_edges,
    get_all_evidence,
    get_all_memories,
    get_all_decisions,
)
from app.models import (
    GraphEdge,
    GraphNode,
    NodeType,
    ProvenanceGraph,
    MemoryStatus,
    TrustLevel,
)


class GraphEngine:
    @staticmethod
    def build_provenance_graph() -> ProvenanceGraph:
        """Construct the complete forensic provenance graph across Evidence, Memories, and Decisions."""
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []

        # 1. Evidence Nodes
        for ev in get_all_evidence():
            nodes.append(
                GraphNode(
                    id=ev.id,
                    label=f"Evidence: {ev.id}",
                    type=NodeType.EVIDENCE,
                    status=ev.trust_level.value,
                    content=ev.content,
                    created_at=ev.created_at,
                    metadata={"source": ev.source, **ev.metadata},
                )
            )

        # 2. Memory Nodes
        for mem in get_all_memories():
            nodes.append(
                GraphNode(
                    id=mem.id,
                    label=f"Memory: {mem.id}",
                    type=NodeType.MEMORY,
                    status=mem.status.value,
                    content=mem.content,
                    created_at=mem.created_at,
                    metadata={
                        "source_evidence_ids": mem.source_evidence_ids,
                        "parent_memory_ids": mem.parent_memory_ids,
                        **mem.metadata,
                    },
                )
            )

        # 3. Decision Nodes
        for dec in get_all_decisions():
            status = "clean_reference" if dec.is_clean_reference else "evaluated"
            nodes.append(
                GraphNode(
                    id=dec.id,
                    label=f"Decision: {dec.action}",
                    type=NodeType.DECISION,
                    status=status,
                    content=f"{dec.action} -> {dec.target_destination} (${dec.amount:,.2f})",
                    created_at=dec.created_at,
                    metadata={
                        "target_destination": dec.target_destination,
                        "amount": dec.amount,
                        "rationale": dec.rationale,
                        "confidence": dec.confidence,
                        "is_clean_reference": dec.is_clean_reference,
                        **dec.metadata,
                    },
                )
            )

        # 4. Edges
        raw_edges = get_all_edges()
        for e in raw_edges:
            edges.append(
                GraphEdge(
                    source=e["source"],
                    target=e["target"],
                    relationship=e["relationship"],
                )
            )

        return ProvenanceGraph(nodes=nodes, edges=edges)

    @staticmethod
    def get_downstream_memory_dependents(start_id: str) -> List[str]:
        """Deterministic BFS traversal finding all memory nodes that depend on start_id
        (either directly or transitively).
        """
        raw_edges = get_all_edges()
        # Build adjacency map for forward traversal: source -> list of targets
        adj: Dict[str, List[str]] = {}
        for edge in raw_edges:
            src = edge["source"]
            tgt = edge["target"]
            adj.setdefault(src, []).append(tgt)

        all_memories = {m.id: m for m in get_all_memories()}

        visited: Set[str] = set()
        queue = deque([start_id])
        dependent_memories: List[str] = []

        while queue:
            curr = queue.popleft()
            for neighbor in adj.get(curr, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    if neighbor in all_memories:
                        dependent_memories.append(neighbor)
                    queue.append(neighbor)

        return dependent_memories

    @staticmethod
    def get_upstream_provenance(node_id: str) -> Dict[str, List[str]]:
        """Find all upstream evidence and parent memories that directly or transitively feed node_id."""
        raw_edges = get_all_edges()
        # Build reverse adjacency map: target -> list of sources
        rev_adj: Dict[str, List[Tuple[str, str]]] = {}
        for edge in raw_edges:
            rev_adj.setdefault(edge["target"], []).append((edge["source"], edge["relationship"]))

        all_evidence = {e.id: e for e in get_all_evidence()}
        all_memories = {m.id: m for m in get_all_memories()}

        visited: Set[str] = set()
        queue = deque([node_id])
        upstream_ev: Set[str] = set()
        upstream_mem: Set[str] = set()

        while queue:
            curr = queue.popleft()
            for src, _ in rev_adj.get(curr, []):
                if src not in visited:
                    visited.add(src)
                    if src in all_evidence:
                        upstream_ev.add(src)
                    if src in all_memories:
                        upstream_mem.add(src)
                    queue.append(src)

        return {
            "evidence_ids": sorted(list(upstream_ev)),
            "memory_ids": sorted(list(upstream_mem)),
        }


graph_engine = GraphEngine()

