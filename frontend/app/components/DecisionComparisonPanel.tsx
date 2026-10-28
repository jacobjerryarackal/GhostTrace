import React from 'react';
import { CheckCircle2, AlertOctagon, ArrowRight, ShieldCheck, Scale, Clock, RefreshCw } from 'lucide-react';

interface DecisionComparisonProps {
  latestReplay: any;
  cleanReference: any;
  onRunReplay: () => void;
  isLoading: boolean;
  hasSuspectNodes: boolean;
}

export const DecisionComparisonPanel: React.FC<DecisionComparisonProps> = ({
  latestReplay,
  cleanReference,
  onRunReplay,
  isLoading,
  hasSuspectNodes,
}) => {
  const baseline = latestReplay?.baseline_outcome;
  const counterfactual = latestReplay?.counterfactual_outcome;
  const dependenceDetected = latestReplay?.behavioral_dependence_detected;

  const isDivergent = baseline && counterfactual && baseline.target_destination !== counterfactual.target_destination;
  const isRecovered = counterfactual && cleanReference && counterfactual.target_destination === cleanReference.approved_destination;

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
          <Scale size={16} color="var(--color-cyan)" />
          <h2 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Decision Interventional Comparison: Baseline vs. Replay
          </h2>
        </div>

        <button
          className="btn btn-warning"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          onClick={onRunReplay}
          disabled={isLoading || !hasSuspectNodes}
          title="Run counterfactual interventional replay testing"
        >
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
          <span>{isLoading ? 'Testing Replay...' : 'Run Replay Test'}</span>
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem' }}>
        {!latestReplay ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            background: 'var(--bg-primary)',
            borderRadius: '6px',
            border: '1px dashed var(--border-subtle)',
          }}>
            <p style={{ marginBottom: '0.5rem' }}>No interventional replay executed yet.</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Click <strong>&quot;Run Replay Test&quot;</strong> or follow the Guided Demo to compare baseline decision vs counterfactual state.
            </p>
          </div>
        ) : (
          <div>
            {/* Status Banner */}
            <div style={{
              background: dependenceDetected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${dependenceDetected ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {dependenceDetected ? (
                  <AlertOctagon size={18} color="#ef4444" />
                ) : (
                  <CheckCircle2 size={18} color="#f59e0b" />
                )}
                <div>
                  <div style={{
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    color: dependenceDetected ? '#f87171' : '#fbbf24',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {dependenceDetected ? 'BEHAVIORAL DEPENDENCE CONFIRMED' : 'REPLAY INCONCLUSIVE / INDEPENDENT'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {latestReplay.consistency_assessment}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <Clock size={12} />
                <span>Latency: {latestReplay.latency_ms}ms</span>
              </div>
            </div>

            {/* Side-by-side comparison grid */}
            <div
              className="comparison-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1rem',
              }}
            >
              {/* Card 1: Baseline (Unfiltered Attack Influence) */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                    1. BASELINE OUTCOME
                  </span>
                  <span className="badge badge-revoked">Unfiltered</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Action: <strong>{baseline?.action}</strong>
                </div>
                <div style={{
                  background: 'var(--bg-primary)',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: isDivergent ? '#f87171' : 'var(--text-primary)',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-all',
                }}>
                  {baseline?.target_destination}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {baseline?.rationale}
                </p>
              </div>

              {/* Card 2: Counterfactual Outcome (Replay with suspect removed) */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '6px',
                padding: '1rem',
                boxShadow: isRecovered ? '0 0 15px rgba(16, 185, 129, 0.15)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--color-trusted)' }}>
                    2. COUNTERFACTUAL REPLAY
                  </span>
                  <span className="badge badge-trusted">Surgically Excluded</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Action: <strong>{counterfactual?.action}</strong>
                </div>
                <div style={{
                  background: 'var(--bg-primary)',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: 'var(--color-trusted)',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-all',
                }}>
                  {counterfactual?.target_destination}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {counterfactual?.rationale}
                </p>
              </div>

              {/* Card 3: Ground Truth Reference */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '6px',
                padding: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--color-reference)' }}>
                    3. CLEAN GROUND TRUTH
                  </span>
                  <span className="badge badge-reference">Verified Policy</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Approved Amount: <strong>${cleanReference?.amount?.toLocaleString()}</strong>
                </div>
                <div style={{
                  background: 'var(--bg-primary)',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: 'var(--color-reference)',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-all',
                }}>
                  {cleanReference?.approved_destination}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Immutable JPMorgan Chase Treasury registry routing established under Corporate Rule 401.A.
                </p>
              </div>
            </div>

            {/* Recovery Proof Footer */}
            {isRecovered && (
              <div style={{
                marginTop: '1rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '0.65rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.78rem',
                color: 'var(--color-trusted)',
              }}>
                <ShieldCheck size={16} />
                <span>
                  <strong>RECOVERY PROVED:</strong> Counterfactual routing destination perfectly matches verified Corporate Treasury reference ({cleanReference?.approved_destination}).
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

