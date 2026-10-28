import React, { useState } from 'react';
import { History, Shield, AlertTriangle, XCircle, Trash2, GitCommit, FileText, Brain } from 'lucide-react';

interface TimelineProps {
  evidence: any[];
  memories: any[];
  onRevokeTarget: (targetId: string) => void;
}

export const TimelineView: React.FC<TimelineProps> = ({
  evidence,
  memories,
  onRevokeTarget,
}) => {
  const [filter, setFilter] = useState<string>('all');

  // Merge items into chronological stream
  const items = [
    ...evidence.map((e) => ({ ...e, itemType: 'evidence' })),
    ...memories.map((m) => ({ ...m, itemType: 'memory' })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    const status = (item.status || item.trust_level || '').toLowerCase();
    return status === filter;
  });

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header with filter tabs */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <History size={16} color="var(--color-cyan)" />
          <h2 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Provenance Timeline
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ({filteredItems.length} records)
          </span>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['all', 'trusted', 'quarantined', 'revoked', 'invalidated'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: filter === f ? 'var(--color-cyan)' : 'var(--text-secondary)',
                border: `1px solid ${filter === f ? 'var(--color-cyan)' : 'var(--border-subtle)'}`,
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stream list */}
      <div style={{
        padding: '1rem',
        maxHeight: '380px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No records matching status filter &quot;{filter}&quot;.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isEvidence = item.itemType === 'evidence';
            const status = (item.status || item.trust_level || 'trusted').toLowerCase();
            const isRevoked = status === 'revoked';
            const isInvalidated = status === 'invalidated';
            const isQuarantined = status === 'quarantined';

            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${
                    isQuarantined
                      ? 'rgba(245, 158, 11, 0.4)'
                      : isRevoked
                      ? 'rgba(239, 68, 68, 0.4)'
                      : isInvalidated
                      ? 'rgba(236, 72, 153, 0.4)'
                      : 'var(--border-subtle)'
                  }`,
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                  <div style={{
                    marginTop: '2px',
                    padding: '0.35rem',
                    borderRadius: '4px',
                    background: isEvidence ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                    color: isEvidence ? 'var(--color-cyan)' : '#c084fc',
                  }}>
                    {isEvidence ? <FileText size={14} /> : <Brain size={14} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)',
                        color: '#ffffff',
                      }}>
                        {item.id}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        [{isEvidence ? 'EVIDENCE' : 'MEMORY'}]
                      </span>
                      <span className={`badge badge-${status}`}>
                        {status}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '0.78rem',
                      color: isRevoked || isInvalidated ? 'var(--text-muted)' : 'var(--text-primary)',
                      lineHeight: 1.4,
                      textDecoration: isRevoked || isInvalidated ? 'line-through' : 'none',
                    }}>
                      {item.content}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span>Origin: {item.source || 'derived'}</span>
                      <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                      {item.source_evidence_ids?.length > 0 && (
                        <span>Derived from: {item.source_evidence_ids.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {!isRevoked && !isInvalidated && (
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}
                    onClick={() => onRevokeTarget(item.id)}
                    title={`Revoke ${item.id} and invalidate all its descendants`}
                  >
                    <Trash2 size={12} />
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

