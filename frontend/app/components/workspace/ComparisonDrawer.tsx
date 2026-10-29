'use client';

import React, { useState } from 'react';
import { ReplayData, AuditEventData } from '@/lib/types';
import { ChevronUp, ChevronDown, Check, AlertOctagon, Clock } from 'lucide-react';

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
  const dependenceDetected = latestReplay?.behavioral_dependence_detected;

  const cleanDest = cleanReference?.approved_destination || 'US89-ACME-CORP-9876543210';
  const isDivergent = baseline && counterfactual && baseline.target_destination !== counterfactual.target_destination;
  const isRecovered = counterfactual && counterfactual.target_destination === cleanDest;

  return (
    <div
      className="border-t bg-[var(--paper)] transition-all duration-200"
      style={{
        borderColor: 'var(--hairline)',
        maxHeight: isOpen ? '360px' : '40px',
      }}
    >
      {/* Header bar / tab bar */}
      <div className="flex h-10 items-center justify-between px-4 border-b border-[var(--hairline)]">
        <div className="flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('replay')}
            className="pb-1 transition-colors font-medium"
            style={{
              color: activeTab === 'replay' ? 'var(--ink)' : 'var(--slate)',
              borderBottom: activeTab === 'replay' ? '1.5px solid var(--ink)' : '1.5px solid transparent',
            }}
          >
            Replay comparison
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className="pb-1 transition-colors font-medium flex items-center gap-1.5"
            style={{
              color: activeTab === 'audit' ? 'var(--ink)' : 'var(--slate)',
              borderBottom: activeTab === 'audit' ? '1.5px solid var(--ink)' : '1.5px solid transparent',
            }}
          >
            <span>Audit trail</span>
            <span className="text-[10px] px-1 rounded bg-[var(--chalk)] text-[var(--slate)] font-mono">
              {auditEvents.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {latestReplay && activeTab === 'replay' && (
            <span className="text-[11px] text-[var(--slate)] font-mono flex items-center gap-1">
              <Clock size={11} />
              <span>{latestReplay.latency_ms}ms</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded hover:bg-[var(--chalk)] text-[var(--slate)]"
            title={isOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      {isOpen && (
        <div className="p-4 overflow-y-auto" style={{ maxHeight: '310px' }}>
          {activeTab === 'replay' && (
            <div>
              {!latestReplay ? (
                <div className="p-6 text-center text-xs text-[var(--slate)] border border-dashed border-[var(--hairline)] rounded bg-[var(--chalk)]">
                  <p className="font-medium text-[var(--ink)]">No replay yet.</p>
                  <p className="mt-1">
                    Run one to see whether the decision changes when suspect provenance is excised.
                  </p>
                  {hasSuspects && (
                    <button
                      type="button"
                      onClick={onRunReplay}
                      disabled={isLoading}
                      className="mt-3 px-3 py-1.5 text-xs font-medium rounded border transition-colors"
                      style={{
                        borderColor: 'var(--ink)',
                        background: 'var(--ink)',
                        color: '#ffffff',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <span>Replay without suspect memories</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Verdict Banner */}
                  <div
                    className="p-2.5 rounded border text-xs flex items-center justify-between"
                    style={{
                      background: dependenceDetected ? 'var(--uv-wash)' : 'var(--paper)',
                      borderColor: dependenceDetected ? 'var(--uv)' : 'var(--hairline)',
                      color: dependenceDetected ? 'var(--uv-deep)' : 'var(--ink)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {dependenceDetected ? (
                        <AlertOctagon size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                      <span className="font-semibold">
                        {dependenceDetected
                          ? 'Behavioral dependence detected'
                          : 'Replay inconclusive or independent'}
                      </span>
                      <span className="text-[11px] opacity-80 font-normal">
                        — {latestReplay.consistency_assessment}
                      </span>
                    </div>
                  </div>

                  {/* 3 Columns: Baseline vs Counterfactual vs Reference */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Card 1: Baseline */}
                    <div
                      className="p-3 rounded border text-xs bg-[var(--paper)]"
                      style={{ borderColor: 'var(--uv)' }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-[var(--uv-deep)]">
                          1. Baseline outcome
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--uv)] text-[var(--uv-deep)] bg-[var(--uv-wash)]">
                          Unfiltered
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--slate)] mb-1">
                        Action: <strong className="text-[var(--ink)]">{baseline?.action}</strong>
                      </div>
                      <div
                        className="p-2 rounded border font-mono text-xs font-semibold mb-1.5 break-all"
                        style={{
                          background: 'var(--uv-wash)',
                          borderColor: 'var(--uv)',
                          color: 'var(--uv-deep)',
                        }}
                      >
                        {baseline?.target_destination}
                      </div>
                      <p className="text-[11px] text-[var(--slate)] leading-snug">
                        {baseline?.rationale}
                      </p>
                    </div>

                    {/* Card 2: Counterfactual */}
                    <div
                      className="p-3 rounded border text-xs bg-[var(--paper)]"
                      style={{
                        borderColor: isRecovered ? 'var(--ink)' : 'var(--hairline)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-[var(--ink)]">
                          2. Counterfactual replay
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--ink)] text-[var(--ink)] bg-[var(--chalk)]">
                          Excision
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--slate)] mb-1">
                        Action: <strong className="text-[var(--ink)]">{counterfactual?.action}</strong>
                      </div>
                      <div
                        className="p-2 rounded border font-mono text-xs font-semibold mb-1.5 break-all"
                        style={{
                          background: 'var(--chalk)',
                          borderColor: 'var(--ink)',
                          color: 'var(--ink)',
                        }}
                      >
                        {counterfactual?.target_destination}
                      </div>
                      <p className="text-[11px] text-[var(--slate)] leading-snug">
                        {counterfactual?.rationale}
                      </p>
                    </div>

                    {/* Card 3: Reference Ground Truth */}
                    <div
                      className="p-3 rounded border text-xs bg-[var(--paper)]"
                      style={{ borderColor: 'var(--hairline)' }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-[var(--slate)]">
                          3. Clean reference
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--hairline)] text-[var(--slate)] bg-[var(--chalk)]">
                          Ground truth
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--slate)] mb-1">
                        Action: <strong className="text-[var(--ink)]">APPROVE_PAYMENT</strong>
                      </div>
                      <div
                        className="p-2 rounded border font-mono text-xs font-semibold mb-1.5 break-all"
                        style={{
                          background: 'var(--chalk)',
                          borderColor: 'var(--hairline)',
                          color: 'var(--ink)',
                        }}
                      >
                        {cleanDest}
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
                  <tr className="border-b border-[var(--hairline)] text-[var(--slate)] font-semibold text-[11px]">
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Operation</th>
                    <th className="py-2 px-3">Outcome</th>
                    <th className="py-2 px-3">Affected records</th>
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
                        <td className="py-2 px-3 font-mono text-[11px] text-[var(--slate)] whitespace-nowrap">
                          {evt.timestamp.replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="py-2 px-3 font-semibold text-[var(--ink)]">
                          {evt.operation}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className="px-1.5 py-0.5 rounded border text-[10px] font-medium"
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
                        <td className="py-2 px-3 font-mono text-[11px] text-[var(--slate)]">
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

