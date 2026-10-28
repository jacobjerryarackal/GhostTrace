import React from 'react';
import { Terminal, Shield, RefreshCw } from 'lucide-react';

interface AuditTrailProps {
  auditEvents: any[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  auditEvents,
  onRefresh,
  isLoading,
}) => {
  const getOutcomeColor = (outcome: string) => {
    switch (outcome?.toUpperCase()) {
      case 'SUCCESS':
        return 'var(--color-trusted)';
      case 'QUARANTINED':
      case 'INCONCLUSIVE':
        return 'var(--color-quarantined)';
      case 'DEPENDENCE_CONFIRMED':
      case 'REVOKED':
        return '#f87171';
      default:
        return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Terminal size={16} color="var(--color-cyan)" />
          <h2 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Cryptographic Forensic Audit Trail
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ({auditEvents.length} events logged)
          </span>
        </div>

        <button
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh audit trail"
        >
          <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table */}
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
        }}>
          <thead>
            <tr style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-subtle)',
              textAlign: 'left',
            }}>
              <th style={{ padding: '0.5rem 1rem' }}>TIMESTAMP</th>
              <th style={{ padding: '0.5rem 1rem' }}>OPERATION</th>
              <th style={{ padding: '0.5rem 1rem' }}>OUTCOME</th>
              <th style={{ padding: '0.5rem 1rem' }}>AFFECTED RECORDS</th>
              <th style={{ padding: '0.5rem 1rem' }}>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {auditEvents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit events recorded yet.
                </td>
              </tr>
            ) : (
              auditEvents.map((e) => (
                <tr
                  key={e.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.1s',
                  }}
                >
                  <td style={{ padding: '0.55rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '0.55rem 1rem', fontWeight: '600', color: '#ffffff' }}>
                    {e.operation}
                  </td>
                  <td style={{ padding: '0.55rem 1rem' }}>
                    <span style={{
                      color: getOutcomeColor(e.outcome),
                      fontWeight: '700',
                    }}>
                      {e.outcome}
                    </span>
                  </td>
                  <td style={{ padding: '0.55rem 1rem', color: 'var(--color-cyan)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.affected_records?.join(', ') || '-'}
                  </td>
                  <td style={{ padding: '0.55rem 1rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeof e.details === 'object' ? JSON.stringify(e.details) : String(e.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

