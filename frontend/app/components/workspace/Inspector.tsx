'use client';

import React from 'react';
import { GraphNodeData } from '@/lib/types';
import { ShieldAlert, Check, Lock, FileText, Brain, Scale, AlertTriangle } from 'lucide-react';

interface InspectorProps {
  selectedNode: GraphNodeData | null;
  onPreviewRevoke: (nodeId: string) => void;
  upstreamIds: string[];
  downstreamIds: string[];
}

export function Inspector({
  selectedNode,
  onPreviewRevoke,
  upstreamIds,
  downstreamIds,
}: InspectorProps) {
  if (!selectedNode) {
    return (
      <aside
        className="w-[360px] shrink-0 border-l h-full flex flex-col p-6 text-sm text-[var(--slate)]"
        style={{
          background: 'var(--paper)',
          borderColor: 'var(--hairline)',
        }}
      >
        <div className="h-full flex flex-col items-center justify-center text-center">
          <p className="font-medium text-[var(--ink)]">No node selected</p>
          <p className="mt-1 text-xs text-[var(--slate)] max-w-[220px]">
            Click any node on the graph canvas to inspect its provenance, trust evaluation, and write impact.
          </p>
        </div>
      </aside>
    );
  }

  const { id, type, status, content, metadata } = selectedNode;
  const isRevoked = status === 'revoked';
  const isInvalidated = status === 'invalidated';
  const isQuarantined = status === 'quarantined';
  const isClean = status === 'clean_reference' || status === 'trusted';
  const quarantineReasons = metadata?.quarantine_reasons || metadata?.trust_reasons || [];
  const riskScore = metadata?.risk_score ?? metadata?.extraction_risk;

  const statusLabel =
    isRevoked ? 'Revocation verified' :
    isInvalidated ? 'Derived memory invalidated' :
    isQuarantined ? 'Quarantined' :
    status === 'clean_reference' ? 'Clean reference' :
    status;

  return (
    <aside
      className="w-[360px] shrink-0 border-l h-full flex flex-col overflow-y-auto"
      style={{
        background: 'var(--paper)',
        borderColor: 'var(--hairline)',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--hairline)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--slate)] font-sans">
            Node inspector
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded border"
            style={{
              borderColor: isQuarantined ? 'var(--uv)' : (isRevoked || isInvalidated) ? 'var(--hairline)' : 'var(--ink)',
              background: isQuarantined ? 'var(--uv-wash)' : (isRevoked || isInvalidated) ? 'var(--chalk)' : 'var(--paper)',
              color: isQuarantined ? 'var(--uv-deep)' : (isRevoked || isInvalidated) ? 'var(--slate)' : 'var(--ink)',
            }}
          >
            {isQuarantined && <Lock size={10} />}
            {(isRevoked || isInvalidated) && <span className="text-[10px]">✕</span>}
            {!isQuarantined && !isRevoked && !isInvalidated && <Check size={10} />}
            <span>{statusLabel}</span>
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {type === 'evidence' && <FileText size={16} className="text-[var(--ink)]" />}
          {type === 'memory' && <Brain size={16} className="text-[var(--ink)]" />}
          {type === 'decision' && <Scale size={16} className="text-[var(--ink)]" />}
          <span className="font-mono text-sm font-medium text-[var(--ink)]">{id}</span>
        </div>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* Revocation Verified Alert */}
        {isRevoked && (
          <div
            className="p-3 rounded border text-xs leading-relaxed"
            style={{
              background: 'var(--chalk)',
              borderColor: 'var(--hairline)',
              color: 'var(--ink)',
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[var(--ink)] mb-1">
              <Check size={13} />
              <span>Revocation verified</span>
            </div>
            <p className="text-[11px] text-[var(--slate)]">
              This evidence node has been permanently revoked. It is excluded from all downstream decision generation.
            </p>
          </div>
        )}

        {/* Derived Memory Invalidated Alert */}
        {isInvalidated && (
          <div
            className="p-3 rounded border text-xs leading-relaxed"
            style={{
              background: 'var(--chalk)',
              borderColor: 'var(--hairline)',
              color: 'var(--ink)',
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[var(--ink)] mb-1">
              <span className="text-[11px] font-mono">✕</span>
              <span>Derived memory invalidated</span>
            </div>
            <p className="text-[11px] text-[var(--slate)]">
              Cascading DAG invalidation: this derived belief was automatically purged because its upstream source was revoked.
            </p>
          </div>
        )}

        {/* Write-impact alert for suspect or quarantined nodes */}
        {isQuarantined && (
          <div
            className="p-3 rounded border text-xs leading-relaxed"
            style={{
              background: 'var(--uv-wash)',
              borderColor: 'var(--uv)',
              color: 'var(--ink)',
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[var(--uv-deep)] mb-1">
              <AlertTriangle size={13} />
              <span>Contamination quarantined</span>
            </div>
            <p className="text-[11px] text-[var(--slate)]">
              This belief originated from untrusted evidence. It is isolated from protected decision contexts to prevent downstream poisoning.
            </p>
          </div>
        )}

        {/* Full unclipped payload */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--slate)] mb-1.5">
            Full payload
          </label>
          <div
            className="p-3 rounded border font-mono text-[11px] leading-relaxed break-words max-w-[66ch]"
            style={{
              background: 'var(--chalk)',
              borderColor: 'var(--hairline)',
              color: 'var(--ink)',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            {content}
          </div>
        </div>

        {/* Trust & Screening Evaluation */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--slate)] mb-1.5">
            Trust & screening evaluation
          </label>
          <div
            className="p-3 rounded border text-[11px] space-y-1.5"
            style={{
              background: 'var(--paper)',
              borderColor: 'var(--hairline)',
            }}
          >
            {riskScore !== undefined && (
              <div className="flex items-center justify-between pb-1 border-b border-[var(--hairline)]">
                <span className="text-[var(--slate)]">Model risk score:</span>
                <span className="font-mono font-medium text-[var(--ink)]">
                  {typeof riskScore === 'number' ? riskScore.toFixed(2) : riskScore}
                </span>
              </div>
            )}

            {quarantineReasons.length > 0 ? (
              <div>
                <span className="text-[var(--slate)] block mb-1">Quarantine flags:</span>
                <ul className="list-disc pl-4 space-y-1 text-[var(--slate)]">
                  {quarantineReasons.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[var(--ink)]">
                <Check size={12} />
                <span>Passed corporate policy validation</span>
              </div>
            )}
          </div>
        </div>

        {/* Provenance Lineage */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--slate)] mb-1.5">
            Provenance lineage
          </label>
          <div
            className="p-3 rounded border text-[11px] space-y-2"
            style={{
              background: 'var(--paper)',
              borderColor: 'var(--hairline)',
            }}
          >
            <div>
              <span className="text-[var(--slate)] block mb-1">Upstream sources:</span>
              {upstreamIds.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {upstreamIds.map((uid) => (
                    <span
                      key={uid}
                      className="font-mono px-1.5 py-0.5 rounded border text-[10px]"
                      style={{
                        background: 'var(--chalk)',
                        borderColor: 'var(--hairline)',
                      }}
                    >
                      {uid}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[var(--slate)] italic">None (root source)</span>
              )}
            </div>

            <div className="pt-1.5 border-t border-[var(--hairline)]">
              <span className="text-[var(--slate)] block mb-1">Downstream dependents:</span>
              {downstreamIds.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {downstreamIds.map((did) => (
                    <span
                      key={did}
                      className="font-mono px-1.5 py-0.5 rounded border text-[10px]"
                      style={{
                        background: 'var(--chalk)',
                        borderColor: 'var(--hairline)',
                      }}
                    >
                      {did}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[var(--slate)] italic">None (terminal node)</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {type !== 'decision' && !isRevoked && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onPreviewRevoke(id)}
              className="w-full py-2 px-3 text-xs font-medium rounded border transition-colors flex items-center justify-center gap-1.5"
              style={{
                borderColor: 'var(--uv)',
                background: 'var(--uv-wash)',
                color: 'var(--uv-deep)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span>Preview revoke</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

