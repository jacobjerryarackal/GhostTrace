import React, { useState } from 'react';
import { GraphNodeData } from '@/lib/types';
import {
  ShieldAlert,
  Check,
  Lock,
  FileText,
  Brain,
  Scale,
  AlertTriangle,
  Copy,
  CheckCheck,
  ExternalLink,
  Activity,
  X,
} from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  if (!selectedNode) {
    return (
      <aside
        className="w-[360px] shrink-0 border-l h-full flex flex-col p-6 text-sm text-[var(--slate)]"
        style={{
          background: 'var(--paper)',
          borderColor: 'var(--hairline)',
        }}
      >
        <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[var(--chalk)] border border-[var(--hairline)] flex items-center justify-center text-[var(--slate)]">
            <Activity size={18} />
          </div>
          <p className="font-semibold text-sm text-[var(--ink)]">No node selected</p>
          <p className="text-xs text-[var(--slate)] max-w-[220px] leading-relaxed">
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
  const riskScore: number | undefined =
    typeof metadata?.risk_score === 'number'
      ? metadata.risk_score
      : typeof metadata?.extraction_risk === 'number'
      ? metadata.extraction_risk
      : undefined;

  const originSource = metadata?.source || (type === 'evidence' ? 'external_feed' : 'model_inference');

  const statusLabel =
    isRevoked ? 'Revocation verified' :
    isInvalidated ? 'Derived memory invalidated' :
    isQuarantined ? 'Quarantined' :
    status === 'clean_reference' ? 'Clean reference' :
    status;

  const handleCopyPayload = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <aside
      className="w-[360px] shrink-0 border-l h-full flex flex-col overflow-y-auto"
      style={{
        background: 'var(--paper)',
        borderColor: 'var(--hairline)',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--hairline)] bg-[var(--surface-raised)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--slate)] font-semibold">
            Forensic Inspector
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border"
            style={{
              borderColor: isQuarantined ? 'var(--uv)' : (isRevoked || isInvalidated) ? 'var(--hairline)' : 'var(--ink)',
              background: isQuarantined ? 'var(--uv-wash)' : (isRevoked || isInvalidated) ? 'var(--chalk)' : 'var(--paper)',
              color: isQuarantined ? 'var(--uv-deep)' : (isRevoked || isInvalidated) ? 'var(--slate)' : 'var(--ink)',
            }}
          >
            {isQuarantined && <Lock size={10} />}
            {(isRevoked || isInvalidated) && <X size={10} />}
            {!isQuarantined && !isRevoked && !isInvalidated && <Check size={10} className="stroke-[2.5]" />}
            <span>{statusLabel}</span>
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded border border-[var(--hairline)] bg-[var(--chalk)] flex items-center justify-center text-[var(--ink)]">
              {type === 'evidence' && <FileText size={14} />}
              {type === 'memory' && <Brain size={14} />}
              {type === 'decision' && <Scale size={14} />}
            </div>
            <div>
              <span className="font-mono text-xs font-semibold text-[var(--ink)] block">
                {id}
              </span>
              <span className="text-[10px] font-mono text-[var(--slate)] block">
                type: {type} · channel: {originSource}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs">
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
              <Check size={13} className="stroke-[2.5]" />
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
              <X size={13} className="stroke-[2.5]" />
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

        {/* Visual Risk Gauge */}
        {riskScore !== undefined && (
          <div className="p-3 rounded border bg-[var(--surface-raised)] border-[var(--hairline)]">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-semibold text-[var(--slate)]">Nemotron risk evaluation</span>
              <span
                className="font-mono font-bold text-xs"
                style={{
                  color: riskScore >= 0.7 ? 'var(--alert)' : riskScore >= 0.4 ? 'var(--uv-deep)' : 'var(--ink)',
                }}
              >
                {(riskScore * 100).toFixed(0)}% ({riskScore.toFixed(2)})
              </span>
            </div>
            {/* Horizontal progress bar */}
            <div className="w-full h-2 rounded-full bg-[var(--chalk)] border border-[var(--hairline)] overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, riskScore * 100))}%`,
                  background:
                    riskScore >= 0.7
                      ? 'var(--alert)'
                      : riskScore >= 0.4
                      ? 'var(--uv)'
                      : 'var(--ink)',
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-[var(--slate)] mt-1">
              <span>0.00 Clean</span>
              <span>0.50 Suspect</span>
              <span>1.00 Severe</span>
            </div>
          </div>
        )}

        {/* Full unclipped payload */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-[var(--slate)]">
              Recorded payload
            </label>
            <button
              type="button"
              onClick={handleCopyPayload}
              className="inline-flex items-center gap-1 text-[10px] text-[var(--slate)] hover:text-[var(--ink)] font-mono transition-colors"
              title="Copy payload text"
            >
              {copied ? (
                <>
                  <CheckCheck size={11} className="text-[var(--uv-deep)]" />
                  <span className="text-[var(--uv-deep)]">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div
            className="p-3 rounded border font-mono text-[11px] leading-relaxed break-words max-w-[66ch]"
            style={{
              background: 'var(--chalk)',
              borderColor: 'var(--hairline)',
              color: 'var(--ink)',
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            {content}
          </div>
        </div>

        {/* Trust & Screening Evaluation */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--slate)] mb-1.5">
            Screening markers & reasons
          </label>
          <div
            className="p-3 rounded border text-[11px] space-y-1.5"
            style={{
              background: 'var(--paper)',
              borderColor: 'var(--hairline)',
            }}
          >
            {quarantineReasons.length > 0 ? (
              <div>
                <span className="text-[var(--slate)] block mb-1">Quarantine flags:</span>
                <ul className="list-disc pl-4 space-y-1 text-[var(--slate)]">
                  {quarantineReasons.map((r: string, idx: number) => (
                    <li key={idx} className="leading-snug">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[var(--ink)]">
                <Check size={12} className="stroke-[2.5]" />
                <span>Passed corporate policy screening</span>
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
                        color: 'var(--ink)',
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
                        color: 'var(--ink)',
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
              className="btn-press w-full py-2 px-3 text-xs font-semibold rounded border transition-all flex items-center justify-center gap-1.5 shadow-sm"
              style={{
                borderColor: 'var(--uv)',
                background: 'var(--uv-wash)',
                color: 'var(--uv-deep)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Lock size={12} />
              <span>Preview revocation blast-radius</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
