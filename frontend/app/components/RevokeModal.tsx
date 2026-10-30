import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Trash2, X, GitFork, ArrowDownRight, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export interface RevokeModalProps {
  isOpen: boolean;
  targetId: string | null;
  onClose: () => void;
  onConfirm: (targetId: string, reason: string) => void;
  isLoading: boolean;
  graph?: { nodes: any[]; edges: any[] };
  cleanReference?: any;
  apiBaseUrl?: string;
}

interface ServerPreviewData {
  target_id: string;
  target_type: string;
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

export const RevokeModal: React.FC<RevokeModalProps> = ({
  isOpen,
  targetId,
  onClose,
  onConfirm,
  isLoading,
  graph,
  cleanReference,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
}) => {
  const [reason, setReason] = useState<string>('Forensic evidence of untrusted redirection');
  const [serverPreview, setServerPreview] = useState<ServerPreviewData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Keyboard accessibility: Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Fetch confirmed server preview when targetId opens
  useEffect(() => {
    if (!isOpen || !targetId) {
      setServerPreview(null);
      setPreviewError(null);
      return;
    }

    let isMounted = true;
    setIsPreviewLoading(true);
    setPreviewError(null);

    fetch(`${apiBaseUrl}/api/revoke/preview?target_id=${encodeURIComponent(targetId)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: ServerPreviewData) => {
        if (isMounted) {
          setServerPreview(data);
          setIsPreviewLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setPreviewError(err.message || 'Failed fetching server blast radius');
          setIsPreviewLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetId, apiBaseUrl]);

  // Client-side graph fallback calculation
  const clientGraphImpact = useMemo(() => {
    if (!targetId || !graph) {
      return {
        targetNode: null,
        descendantMemoryIds: [] as string[],
        affectedDecisionIds: [] as string[],
      };
    }

    const targetNode = graph.nodes.find((n) => n.id === targetId) || null;

    // Traverse downstream edges from targetId
    const queue = [targetId];
    const visited = new Set<string>([targetId]);
    const memIds: string[] = [];
    const decIds: string[] = [];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const edge of graph.edges) {
        if (edge.source === curr) {
          const tgt = edge.target;
          if (!visited.has(tgt)) {
            visited.add(tgt);
            const tgtNode = graph.nodes.find((n) => n.id === tgt);
            if (tgtNode?.type === 'memory') {
              memIds.push(tgt);
              queue.push(tgt);
            } else if (tgtNode?.type === 'decision' && !tgtNode.metadata?.is_clean_reference) {
              decIds.push(tgt);
            }
          }
        }
      }
    }

    return {
      targetNode,
      descendantMemoryIds: memIds,
      affectedDecisionIds: decIds,
    };
  }, [targetId, graph]);

  if (!isOpen || !targetId) return null;

  // Use server preview if confirmed; otherwise use client graph topology
  const targetNode =
    clientGraphImpact.targetNode || (serverPreview ? { id: serverPreview.target_id, type: serverPreview.target_type, status: serverPreview.target_status, content: serverPreview.target_content } : null);

  const invalidatedMemoryIds = serverPreview ? serverPreview.invalidated_memory_ids : clientGraphImpact.descendantMemoryIds;
  const affectedDecisionIds = serverPreview ? serverPreview.affected_decision_ids : clientGraphImpact.affectedDecisionIds;
  const recoveryDestination = serverPreview?.recovery_destination || cleanReference?.target_destination || 'US89-ACME-CORP-9876543210';
  const recoveryAction = serverPreview?.recovery_action || cleanReference?.action || 'APPROVE_PAYMENT';

  const isServerConfirmed = Boolean(serverPreview && !previewError);

  const getBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'trusted':
        return 'badge-trusted';
      case 'quarantined':
        return 'badge-quarantined';
      case 'revoked':
        return 'badge-revoked';
      case 'invalidated':
        return 'badge-invalidated';
      default:
        return 'badge';
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="revoke-modal-title"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={20} color="#ef4444" />
            <h2 id="revoke-modal-title" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ffffff' }}>
              Revocation Blast-Radius Preview
            </h2>
          </div>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isLoading}
            style={{ padding: '0.3rem' }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Node Summary */}
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              Target: {targetId}
            </span>
            {targetNode?.status && (
              <span className={`badge ${getBadgeClass(targetNode.status)}`}>
                {targetNode.status}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
            }}
          >
            {targetNode?.content || 'Loading node payload...'}
          </p>
        </div>

        {/* Real Blast Radius Enumeration */}
        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.4rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)' }}>
              1. DESCENDANT MEMORIES TO INVALIDATE ({invalidatedMemoryIds.length})
            </span>
            <span style={{ fontSize: '0.68rem', color: isServerConfirmed ? 'var(--color-trusted)' : 'var(--text-muted)' }}>
              {isServerConfirmed ? '● Confirmed by Server Engine' : isPreviewLoading ? 'Calculating...' : 'Local Graph Topology'}
            </span>
          </div>

          {invalidatedMemoryIds.length > 0 ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                padding: '0.6rem 0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                maxHeight: '130px',
                overflowY: 'auto',
              }}
            >
              {invalidatedMemoryIds.map((memId) => {
                const memNode = graph?.nodes.find((n) => n.id === memId);
                return (
                  <div key={memId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff', fontWeight: '700' }}>
                      [MEM] {memId}
                    </span>
                    <span style={{ color: '#f87171', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                      → Marked INVALIDATED
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.6rem 0.8rem',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
              }}
            >
              None (Leaf node — no downstream derived memories will be affected).
            </div>
          )}
        </div>

        {/* Downstream Decisions Affected */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', marginBottom: '0.4rem' }}>
            2. DOWNSTREAM DECISIONS IMPACTED ({affectedDecisionIds.length})
          </span>

          {affectedDecisionIds.length > 0 ? (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '6px',
                padding: '0.6rem 0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              {affectedDecisionIds.map((decId) => (
                <div key={decId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff', fontWeight: '700' }}>
                    [DEC] {decId}
                  </span>
                  <span style={{ color: '#fbbf24', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                    → Influence purged via re-evaluation
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.6rem 0.8rem',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
              }}
            >
              None (No decisions currently reference this node or its descendants).
            </div>
          )}
        </div>

        {/* Proposed Recovery Projection */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            padding: '0.75rem 0.85rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-trusted)', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.3rem' }}>
            <ShieldCheck size={15} />
            <span>PROPOSED RECOVERY PROJECTION</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Re-evaluation will re-bind pending invoice payments to the verified reference account:
            <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '0.2rem', fontWeight: '700' }}>
              {recoveryDestination} ({recoveryAction})
            </span>
          </div>
        </div>

        {/* Audited Reason Input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="revoke-reason-input"
            style={{
              display: 'block',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.35rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            REVOCATION REASON (RECORDED IN AUDIT TRAIL)
          </label>
          <input
            id="revoke-reason-input"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '0.6rem 0.75rem',
              color: '#ffffff',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onConfirm(targetId, reason)}
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
            <span>
              {isLoading
                ? 'Revoking...'
                : `Confirm Revocation (${1 + invalidatedMemoryIds.length} Nodes)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
