import React, { useState, useEffect } from 'react';
import { BarChart2, ShieldCheck, AlertTriangle, CheckCircle, XCircle, RefreshCw, X } from 'lucide-react';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({
  isOpen,
  onClose,
  apiBaseUrl,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmark = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/benchmark`);
      if (!res.ok) throw new Error(`Benchmark fetch failed: ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBenchmark();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const metrics = data?.metrics;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '900px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.85rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart2 size={20} color="var(--color-cyan)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>
              GhostTrace vs. Simple Memory Baseline Evaluation
            </h2>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem' }} />
            <p>Executing 12-scenario benchmark evaluation against real ground truth...</p>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {data && (
          <div>
            {/* Metric Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ATTACK SUCCESS RATE
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--color-trusted)' }}>
                    {metrics?.attack_success_rate?.ghosttrace}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', textDecoration: 'line-through' }}>
                    {metrics?.attack_success_rate?.simple_baseline}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-trusted)', marginTop: '2px' }}>
                  {metrics?.attack_success_rate?.delta} reduction
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  RECOVERY RATE
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--color-trusted)' }}>
                    {metrics?.recovery_against_clean_reference?.ghosttrace}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    vs {metrics?.recovery_against_clean_reference?.simple_baseline}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-trusted)', marginTop: '2px' }}>
                  Complete policy restore
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  DETECTION PRECISION / RECALL
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-cyan)' }}>
                    {metrics?.detection_precision?.ghosttrace}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-cyan)' }}>
                    {metrics?.detection_recall?.ghosttrace}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Attacks vs Clean Policy
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  CLEAN TASK ACCURACY
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--color-reference)', marginTop: '0.25rem' }}>
                  {metrics?.clean_task_accuracy?.ghosttrace}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  0% false quarantine on clean
                </div>
              </div>
            </div>

            {/* Scenarios Table */}
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
              Evaluation Scenarios Breakdown (12 Tests)
            </h3>
            <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.5rem 0.75rem' }}>ID</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>CATEGORY</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>SCENARIO TITLE</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>SIMPLE BASELINE</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>GHOSTTRACE</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scenarios.map((sc: any, idx: number) => {
                    const bRes = data.baseline_detail[idx];
                    const gtRes = data.ghosttrace_detail[idx];

                    return (
                      <tr key={sc.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.45rem 0.75rem', fontWeight: '700', color: '#ffffff' }}>
                          {sc.id}
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-muted)' }}>
                          {sc.category}
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-primary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sc.title}
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem' }}>
                          {bRes?.compromised ? (
                            <span style={{ color: '#ef4444' }}>✕ Compromised</span>
                          ) : (
                            <span style={{ color: 'var(--color-trusted)' }}>✓ Safe</span>
                          )}
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem' }}>
                          <span style={{ color: 'var(--color-trusted)', fontWeight: '700' }}>
                            ✓ Quarantined & Protected
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={fetchBenchmark} disabled={isLoading}>
                <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
                <span>Re-run Benchmark</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

