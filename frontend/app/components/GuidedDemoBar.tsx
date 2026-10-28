import React from 'react';
import { Play, ArrowRight, ShieldCheck, AlertTriangle, GitFork, RefreshCcw, CheckCircle } from 'lucide-react';

export interface GuidedDemoBarProps {
  currentStep: number;
  onRunStep: (stepNumber: number) => void;
  isLoading: boolean;
}

export const GuidedDemoBar: React.FC<GuidedDemoBarProps> = ({
  currentStep,
  onRunStep,
  isLoading,
}) => {
  const steps = [
    {
      num: 1,
      title: 'Clean Reference',
      desc: 'Inspect pristine user payment policy & reference destination',
      icon: ShieldCheck,
      action: 'Inspect Clean State',
    },
    {
      num: 2,
      title: 'Ingest Phish Attack',
      desc: 'Simulate malicious invoice redirection via untrusted webhook',
      icon: AlertTriangle,
      action: 'Inject Attack Payload',
    },
    {
      num: 3,
      title: 'Trace & Quarantine',
      desc: 'Nemotron extraction & deterministic policy isolation in graph',
      icon: GitFork,
      action: 'Inspect Quarantine',
    },
    {
      num: 4,
      title: 'Interventional Replay',
      desc: 'Behavioral dependency testing: compare decision with & without suspect memory',
      icon: RefreshCcw,
      action: 'Run Replay Test',
    },
    {
      num: 5,
      title: 'Deterministic Revoke',
      desc: 'Revoke suspect evidence and recursively invalidate all derived memories',
      icon: AlertTriangle,
      action: 'Execute Revocation',
    },
    {
      num: 6,
      title: 'Prove Recovery',
      desc: 'Re-evaluate decision and verify empirical recovery against clean reference',
      icon: CheckCircle,
      action: 'Verify Proof',
    },
  ];

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.85rem 1.75rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.65rem',
        flexWrap: 'wrap',
        gap: '0.6rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            background: 'rgba(56, 189, 248, 0.2)',
            color: 'var(--color-cyan)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: '700',
            fontFamily: 'var(--font-mono)',
          }}>
            GUIDED FORENSIC WALKTHROUGH
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Follow the 6-step lifecycle from contamination to verified recovery
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
            onClick={() => onRunStep(currentStep)}
            disabled={isLoading}
          >
            <Play size={13} />
            <span>{isLoading ? 'Executing...' : `Run Step ${currentStep}: ${steps[currentStep - 1]?.action}`}</span>
          </button>
        </div>
      </div>

      {/* Step Pills */}
      <div
        className="guided-step-pills"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(130px, 1fr))',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          const isCompleted = currentStep > s.num;

          return (
            <div
              key={s.num}
              onClick={() => onRunStep(s.num)}
              style={{
                background: isActive
                  ? 'rgba(56, 189, 248, 0.12)'
                  : isCompleted
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'var(--bg-secondary)',
                border: isActive
                  ? '1px solid var(--color-cyan)'
                  : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.55rem 0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  color: isActive ? 'var(--color-cyan)' : isCompleted ? 'var(--color-trusted)' : 'var(--text-muted)',
                }}>
                  STEP 0{s.num}
                </span>
                <Icon size={13} color={isActive ? 'var(--color-cyan)' : isCompleted ? 'var(--color-trusted)' : 'var(--text-muted)'} />
              </div>
              <div style={{
                fontSize: '0.78rem',
                fontWeight: '600',
                color: isActive ? '#ffffff' : 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {s.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

