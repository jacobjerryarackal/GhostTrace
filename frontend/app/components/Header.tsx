import React, { useState, useEffect } from 'react';
import { Shield, Activity, RefreshCw, BarChart2, PlusCircle, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

interface HeaderProps {
  systemHealth: any;
  onResetDemo: () => void;
  onOpenBenchmark: () => void;
  onOpenIngest: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  systemHealth,
  onResetDemo,
  onOpenBenchmark,
  onOpenIngest,
  isResetting,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const isHealthy = systemHealth?.status === 'healthy';
  const nebiusConfigured = systemHealth?.nebius_integration?.configured;
  const modelId = systemHealth?.nebius_integration?.model_id || 'nvidia/nemotron-3-super-120b-a12b';

  // Support Escape to cancel confirmation dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConfirmOpen && !isResetting) {
        setIsConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmOpen, isResetting]);

  const handleConfirmReset = () => {
    setIsConfirmOpen(false);
    onResetDemo();
  };

  return (
    <header
      className="gt-header"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexWrap: 'wrap',
        gap: '0.75rem',
        maxWidth: '100%',
      }}
    >
      {/* Brand & Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
          flexShrink: 0,
        }}>
          <Shield size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
              GhostTrace
            </h1>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--color-cyan)',
              fontSize: '0.68rem',
              fontWeight: '700',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontFamily: 'var(--font-mono)',
            }}>
              Nebius x NVIDIA
            </span>
            <span style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--color-trusted)',
              fontSize: '0.68rem',
              fontWeight: '600',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
            }}>
              Personal AI Track
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Find the bad memory. Trace its influence. Prove the recovery.
          </p>
        </div>
      </div>

      {/* Runtimes & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        {/* Backend & Nebius Model Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'var(--bg-primary)',
          padding: '0.4rem 0.75rem',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isHealthy ? '#10b981' : '#ef4444',
              boxShadow: isHealthy ? '0 0 8px #10b981' : 'none',
            }} />
            <span style={{ color: isHealthy ? 'var(--text-primary)' : '#ef4444' }}>
              {isHealthy ? 'Backend: Online' : 'Backend: Offline'}
            </span>
          </div>
          <span style={{ color: 'var(--border-accent)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Activity size={12} color="var(--color-cyan)" />
            <span style={{ color: 'var(--text-secondary)' }} title={modelId}>
              Nemotron-3-Super
            </span>
            {nebiusConfigured ? (
              <span className="badge badge-trusted" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                Live Key
              </span>
            ) : (
              <span className="badge badge-quarantined" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }} title="Running with local deterministic fallback; configure NEBIUS_API_KEY for live Nemotron inference">
                Simulated Key
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <button
          className="btn btn-ghost"
          onClick={onOpenBenchmark}
          title="View reproducible 12-scenario benchmark evaluation"
        >
          <BarChart2 size={15} />
          <span>Benchmark Suite</span>
        </button>

        <button
          className="btn btn-ghost"
          onClick={onOpenIngest}
          title="Ingest custom evidence"
        >
          <PlusCircle size={15} />
          <span>Ingest Evidence</span>
        </button>

        <button
          className="btn btn-ghost"
          style={{
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          onClick={() => setIsConfirmOpen(true)}
          disabled={isResetting}
          title="Reset demo back to clean policy and reference decision"
          aria-haspopup="dialog"
          aria-expanded={isConfirmOpen}
        >
          <RotateCcw size={14} className={isResetting ? 'spin' : ''} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
        </button>
      </div>

      {/* Reset Confirmation Dialog */}
      {isConfirmOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          onClick={() => !isResetting && setIsConfirmOpen(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <RotateCcw size={18} color="var(--color-cyan)" />
                <h2 id="reset-dialog-title" style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
                  Reset Demo Environment?
                </h2>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isResetting}
                style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              This action resets the demo scenario and clears all current investigation and counterfactual replay state.
              The environment will be restored to the seeded baseline corporate policy.
            </p>

            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1.25rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              <div><strong>Cleared Records:</strong> Ingested attack payloads, derived memories, replay tests</div>
              <div style={{ marginTop: '0.3rem' }}><strong>Restored State:</strong> Rule 401.A active | JPMorgan US89-ACME-CORP</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmReset}
                disabled={isResetting}
              >
                {isResetting ? <RefreshCw size={13} className="spin" /> : <RotateCcw size={13} />}
                <span>{isResetting ? 'Resetting...' : 'Confirm Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

