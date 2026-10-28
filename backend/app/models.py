"""Pydantic data models for GhostTrace."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TrustLevel(str, Enum):
    TRUSTED = "trusted"
    QUARANTINED = "quarantined"
    REVOKED = "revoked"


class MemoryStatus(str, Enum):
    TRUSTED = "trusted"
    QUARANTINED = "quarantined"
    REVOKED = "revoked"
    INVALIDATED = "invalidated"


class NodeType(str, Enum):
    EVIDENCE = "evidence"
    MEMORY = "memory"
    DECISION = "decision"


class Evidence(BaseModel):
    id: str
    content: str
    source: str = Field(..., description="Origin of evidence: e.g. system_policy, web_crawl, email, webhook")
    trust_level: TrustLevel = Field(default=TrustLevel.TRUSTED)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Memory(BaseModel):
    id: str
    content: str
    status: MemoryStatus = Field(default=MemoryStatus.TRUSTED)
    source_evidence_ids: List[str] = Field(default_factory=list)
    parent_memory_ids: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Decision(BaseModel):
    id: str
    scenario: str
    action: str = Field(..., description="Action e.g. APPROVE_PAYMENT, HOLD_REVIEW, REJECT")
    target_destination: str = Field(..., description="Destination account or target system")
    amount: float = Field(default=0.0)
    rationale: str = Field(default="")
    confidence: float = Field(default=1.0)
    evidence_ids: List[str] = Field(default_factory=list)
    memory_ids: List[str] = Field(default_factory=list)
    is_clean_reference: bool = Field(default=False)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ReplayResult(BaseModel):
    id: str
    baseline_outcome: Dict[str, Any]
    counterfactual_outcome: Dict[str, Any]
    removed_ids: List[str]
    behavioral_dependence_detected: bool
    consistency_assessment: str
    latency_ms: float
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AuditEvent(BaseModel):
    id: str
    operation: str
    affected_records: List[str] = Field(default_factory=list)
    outcome: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    details: Dict[str, Any] = Field(default_factory=dict)


class GraphNode(BaseModel):
    id: str
    label: str
    type: NodeType
    status: str
    content: str
    created_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str = Field(default="derives_from")  # derives_from, references, influences


class ProvenanceGraph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


# Request and response models
class IngestRequest(BaseModel):
    content: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    trust_level_override: Optional[TrustLevel] = None
    parent_memory_ids: Optional[List[str]] = None


class IngestResponse(BaseModel):
    evidence: Evidence
    extracted_memory: Memory
    quarantined: bool
    suspicious_markers: List[str]
    risk_score: float
    message: str


class ReplayRequest(BaseModel):
    suspect_ids: List[str] = Field(default_factory=list, description="IDs of evidence or memories to remove")


class RevokeRequest(BaseModel):
    target_id: str = Field(..., description="ID of evidence or memory to revoke")
    reason: Optional[str] = "Detected untrusted or malicious content"


class RevokePreviewResponse(BaseModel):
    target_id: str
    target_type: str
    target_status: str
    target_content: str
    invalidated_memory_ids: List[str]
    affected_decision_ids: List[str]
    downstream_memories: List[Dict[str, Any]]
    recovery_destination: str
    recovery_action: str
    will_reevaluate: bool


class RevokeResponse(BaseModel):
    revoked_id: str
    invalidated_memory_ids: List[str]
    reevaluated_decision: Decision
    clean_reference_comparison: Dict[str, Any]
    recovery_proven: bool
    message: str

