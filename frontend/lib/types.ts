export type TrustLevel = 'trusted' | 'quarantined' | 'revoked';
export type MemoryStatus = 'trusted' | 'quarantined' | 'revoked' | 'invalidated';
export type NodeType = 'evidence' | 'memory' | 'decision';

export interface GraphNodeData {
  [key: string]: unknown;
  id: string;
  label: string;
  type: NodeType;
  status: string;
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
  isConfirmedCausal?: boolean;
}

export interface GraphEdgeData {
  source: string;
  target: string;
  relationship: string;
  isContaminated?: boolean;
}

export interface ScenarioData {
  scenario_id: string;
  title: string;
  description: string;
  clean_reference: {
    evidence_id: string;
    memory_id: string;
    decision_id: string;
    approved_destination: string;
    amount: number;
  };
  sample_attack_payload: {
    title: string;
    source: string;
    content: string;
  };
}

export interface ReplayOutcome {
  decision_id: string;
  action: string;
  target_destination: string;
  amount: number;
  confidence: number;
  rationale: string;
  context_memory_ids: string[];
}

export interface ReplayData {
  id: string;
  baseline_outcome: ReplayOutcome;
  counterfactual_outcome: ReplayOutcome;
  removed_ids: string[];
  behavioral_dependence_detected: boolean;
  consistency_assessment: string;
  latency_ms: number;
  created_at: string;
}

export interface RevokePreviewData {
  target_id: string;
  target_type: 'evidence' | 'memory';
  target_status: string;
  target_content: string;
  invalidated_memory_ids: string[];
  affected_decision_ids: string[];
  downstream_memories: Array<{
    id: string;
    status: string;
    content: string;
    will_invalidate: boolean;
  }>;
  recovery_destination: string;
  recovery_action: string;
  will_reevaluate: boolean;
}

export interface AuditEventData {
  id: string;
  operation: string;
  affected_records: string[];
  outcome: string;
  timestamp: string;
  details: Record<string, any>;
}

