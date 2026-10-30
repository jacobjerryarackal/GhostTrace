import React, { useState } from 'react';
import { ReplayData, AuditEventData } from '@/lib/types';
import { ChevronUp, ChevronDown, Check, AlertOctagon, Clock, Info, ShieldCheck, Play } from 'lucide-react';

interface ComparisonDrawerProps {
  latestReplay: ReplayData | null;
  cleanReference: any;
  auditEvents: AuditEventData[];
  onRunReplay: () => void;
  isLoading: boolean;
  hasSuspects: boolean;
}

export function ComparisonDrawer({
  latestReplay,
  cleanReference,
  auditEvents,
  onRunReplay,
  isLoading,
  hasSuspects,
}: ComparisonDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'replay' | 'audit'>('replay');

  const baseline = latestReplay?.baseline_outcome;
  const counterfactual = latestReplay?.counterfactual_outcome;
  const cleanDest = cleanReference?.approved_destination || 'US89-ACME-CORP-9876543210';

  const isDivergent = Boolean(
    baseline && counterfactual && (
      baseline.target_destination !== counterfactual.target_destination ||
      baseline.action !== counterfactual.action
    )
  );
  const isRecovered = Boolean(counterfactual && counterfactual.target_destination === cleanDest);
  const isCleanBaselinePreserved = Boolean(
    baseline && counterfactual && !isDivergent && baseline.target_destination === cleanDest
  );
  const isDecisionRecoveryDemonstrated = Boolean(isDivergent && isRecovered);

  return (
    <div
      className="border-t bg-[var(--surface-raised)] transition-all duration-200 shadow-md"
      style={{
        borderColor: 'var(--hairline)',
        maxHeight: isOpen ? '380px' : '40px',
      }}
    >
      {/* Header bar / tab bar */}
      <div className="flex h-10 items-center justify-between px-4 border-b border-[var(--hairline)] bg-[var(--paper)]">
        <div className="flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('replay')}
            className="pb-1 transition-colors font-medium flex items-center gap-1.5"
            style={{
              color: activeTab === 'replay' ? 'var(--ink)' : 'var(--slate)',
              borderBottom: activeTab === 'replay' ? '2px solid var(--ink)' : '2px solid transparent',
            }}
          >
            <span>Interventional replay comparison</span>
            {latestReplay && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--uv)]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className="pb-1 transition-colors font-medium flex items-center gap-1.5"
            style={{
              color: activeTab === 'audit' ? 'var(--ink)' : 'var(--slate)',
              borderBottom: activeTab === 'audit' ? '2px solid var(--ink)' : '2px solid transparent',
            }}
          >
            <span>Audit trail</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--chalk)] text-[var(--slate)] font-mono border border-[var(--hairline)]">
              {auditEvents.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {latestReplay && activeTab === 'replay' && (
            <span className="text-[11px] text-[var(--slate)] font-mono flex items-center gap-1 bg-[var(--chalk)] px-2 py-0.5 rounded border border-[var(--hairline)]">
              <Clock size={11} />
              <span>{latestReplay.latency_ms}ms execution</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded hover:bg-[var(--chalk)] text-[var(--slate)] transition-colors"
            title={isOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      {isOpen && (
        <div className="p-4 overflow-y-auto" style={{ maxHeight: '330px' }}>
          {activeTab === 'replay' && (
            <div>
              {!latestReplay ? (
                <div className="p-6 text-center text-xs text-[var(--slate)] border border-dashed border-[var(--hairline)] rounded-[8px] bg-[var(--chalk)]">
                  <p className="font-semibold text-[var(--ink)]">No replay executed yet.</p>
                  <p className="mt-1 max-w-md mx-auto">
                    Execute an interventional replay test to evaluate whether decisions diverge when suspect evidence is surgically excised.
                  </p>
                  {hasSuspects && (
                    <button
                      type="button"
                      onClick={onRunReplay}
                      disabled={isLoading}
                      className="btn-press mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded border transition-all shadow-sm"
                      style={{
                        borderColor: 'var(--ink)',
                        background: 'var(--ink)',
                        color: '#ffffff',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <Play size={12} />
                      <span>Replay without suspect memories</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Verdict Banner */}
                  <div
                    className="p-3 rounded-[8px] border text-xs flex items-center justify-between shadow-sm"
                    style={{
                      background: isDecisionRecoveryDemonstrated
                        ? 'var(--uv-wash)'
                        : isCleanBaselinePreserved
                        ? 'var(--chalk)'
                        : 'var(--paper)',
                      borderColor: isDecisionRecoveryDemonstrated
                        ? 'var(--uv)'
                        : 'var(--hairline)',
                      color: isDecisionRecoveryDemonstrated
                        ? 'var(--uv-deep)'
                        : 'var(--ink)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {isDecisionRecoveryDemonstrated ? (
                        <AlertOctagon size={16} className="text-[var(--uv-deep)] shrink-0" />
                      ) : isCleanBaselinePreserved ? (
                        <ShieldCheck size={16} className="text-[var(--ink)] shrink-0" />
                      ) : (
                        <Info size={16} className="text-[var(--slate)] shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold">
                          {isDecisionRecoveryDemonstrated
                            ? 'Decision recovery demonstrated'
                            : isCleanBaselinePreserved
                            ? 'Clean baseline preserved (Causal influence inconclusive)'
                            : 'Causal influence inconclusive / independent'}
                        </span>
                        <span className="text-[11px] opacity-85 ml-2 font-normal">
                          &mdash; {latestReplay.consistency_assessment}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Columns: Baseline vs Counterfactual vs Reference */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Card 1: Baseline */}
                    <div
                      className="p-3.5 rounded-[8px] border text-xs bg-[var(--paper)] flex flex-col justify-between"
                      style={{
                        borderColor: isDecisionRecoveryDemonstrated ? 'var(--uv)' : 'var(--hairline)',
                        boxShadow: isDecisionRecoveryDemonstrated ? '0 2px 8px var(--uv-glow)' : 'none',
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-[var(--ink)]">
                            1. Baseline outcome
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--uv)] text-[var(--uv-deep)] bg-[var(--uv-wash)] font-medium">
                            Unfiltered
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--slate)] mb-1">
                          Action: <strong className="text-[var(--ink)]">{baseline?.action}</strong>
                        </div>
                        <div
                          className="p-2 rounded border font-mono text-[11px] font-semibold mb-2 break-all"
                          style={{
                            background: isDecisionRecoveryDemonstrated ? 'var(--uv-wash)' : 'var(--chalk)',
                            borderColor: isDecisionRecoveryDemonstrated ? 'var(--uv)' : 'var(--hairline)',
                            color: isDecisionRecoveryDemonstrated ? 'var(--uv-deep)' : 'var(--ink)',
                          }}
                        >
                          {baseline?.target_destination}
                        </div>
                      </div>
                      <p className="text-[11px] text-[var(--slate)] leading-snug line-clamp-3">
                        {baseline?.rationale}
                      </p>
                    </div>

                    {/* Card 2: Counterfactual */}
                    <div
                      className="p-3.5 rounded-[8px] border text-xs bg-[var(--paper)] flex flex-col justify-between"
                      style={{
                        borderColor: isDecisionRecoveryDemonstrated ? 'var(--ink)' : 'var(--hairline)',
                        borderWidth: isDecisionRecoveryDemonstrated ? '1.5px' : '1px',
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-[var(--ink)]">
                            2. Counterfactual replay
                          </span>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded border font-medium"
                            style={{
                              borderColor: isDecisionRecoveryDemonstrated ? 'var(--ink)' : 'var(--hairline)',
                              background: isDecisionRecoveryDemonstrated ? 'var(--ink)' : 'var(--chalk)',
                              color: isDecisionRecoveryDemonstrated ? '#ffffff' : 'var(--slate)',
                            }}
                          >
                            {isDecisionRecoveryDemonstrated
                              ? 'Excision recovered'
                              : isCleanBaselinePreserved
                              ? 'Clean preserved'
                              : 'Replay output'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--slate)] mb-1">
                          Action: <strong className="text-[var(--ink)]">{counterfactual?.action}</strong>
                        </div>
                        <div
                          className="p-2 rounded border font-mono text-[11px] font-semibold mb-2 break-all"
                          style={{
                            background: 'var(--chalk)',
                            borderColor: 'var(--ink)',
                            color: 'var(--ink)',
                          }}
                        >
                          {counterfactual?.target_destination}
                        </div>
                      </div>
                      <p className="text-[11px] text-[var(--slate)] leading-snug line-clamp-3">
                        {counterfactual?.rationale}
                      </p>
                    </div>

                    {/* Card 3: Reference Ground Truth */}
                    <div
                      className="p-3.5 rounded-[8px] border text-xs bg-[var(--paper)] flex flex-col justify-between"
                      style={{ borderColor: 'var(--hairline)' }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-[var(--slate)]">
                            3. Clean reference
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--hairline)] text-[var(--slate)] bg-[var(--chalk)]">
                            Ground truth
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--slate)] mb-1">
                          Action: <strong className="text-[var(--ink)]">APPROVE_PAYMENT</strong>
                        </div>
                        <div
                          className="p-2 rounded border font-mono text-[11px] font-semibold mb-2 break-all"
                          style={{
                            background: 'var(--chalk)',
                            borderColor: 'var(--hairline)',
                            color: 'var(--ink)',
                          }}
                        >
                          {cleanDest}
                        </div>
                      </div>
                      <p className="text-[11px] text-[var(--slate)] leading-snug">
                        Authorized payment destination according to corporate accounts payable treasury rule 4.1.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--hairline)] bg-[var(--chalk)] text-[var(--slate)] font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Operation</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Affected records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline)]">
                  {auditEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[var(--slate)]">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-[var(--chalk)] transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--slate)] whitespace-nowrap">
                          {evt.timestamp.replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[var(--ink)]">
                          {evt.operation}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className="px-2 py-0.5 rounded border text-[10px] font-medium inline-block"
                            style={{
                              borderColor:
                                evt.outcome === 'QUARANTINED' || evt.outcome === 'REVOKED'
                                  ? 'var(--uv)'
                                  : 'var(--hairline)',
                              color:
                                evt.outcome === 'QUARANTINED' || evt.outcome === 'REVOKED'
                                  ? 'var(--uv-deep)'
                                  : 'var(--ink)',
                              background:
                                evt.outcome === 'QUARANTINED' || evt.outcome === 'REVOKED'
                                  ? 'var(--uv-wash)'
                                  : 'var(--paper)',
                            }}
                          >
                            {evt.outcome}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--slate)]">
                          {evt.affected_records.join(', ') || 'None'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
