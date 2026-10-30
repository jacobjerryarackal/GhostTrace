import React from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { FileText, Brain, Scale, Lock, Check, ShieldAlert, X } from 'lucide-react';
import { GraphNodeData } from '@/lib/types';

export type ForensicNodeType = Node<GraphNodeData, 'forensicNode'>;

export function ForensicNode({ data, selected }: NodeProps<ForensicNodeType>) {
  const { id, type, status, content, isConfirmedCausal } = data;

  const isEvidence = type === 'evidence';
  const isMemory = type === 'memory';
  const isDecision = type === 'decision';

  const isTrusted = status === 'trusted' || status === 'clean_reference';
  const isQuarantined = status === 'quarantined';
  const isRevoked = status === 'revoked' || status === 'invalidated';
  const isSuspect = !isTrusted && !isRevoked && !isQuarantined && !isConfirmedCausal;

  // Determine visual styling according to DESIGN.md black-light forensic tokens
  let containerStyle: React.CSSProperties = {
    background: 'var(--surface-raised)',
    border: '1px solid var(--hairline)',
    color: 'var(--ink)',
  };

  let badge = {
    label: isTrusted ? 'Trusted' : status,
    icon: <Check size={10} className="stroke-[2.5]" />,
    className: 'text-[var(--ink)] bg-[var(--chalk)] border-[var(--hairline)]',
  };

  if (isConfirmedCausal) {
    containerStyle = {
      background: 'var(--uv)',
      border: '1.5px solid var(--uv-deep)',
      color: '#ffffff',
      boxShadow: '0 4px 14px var(--uv-glow)',
    };
    badge = {
      label: 'Confirmed causal',
      icon: <ShieldAlert size={10} />,
      className: 'text-white bg-[var(--uv-deep)] border-[var(--uv-deep)]',
    };
  } else if (isQuarantined) {
    containerStyle = {
      background: 'var(--uv-wash)',
      border: '1.5px dashed var(--uv)',
      color: 'var(--ink)',
    };
    badge = {
      label: 'Quarantined',
      icon: <Lock size={10} />,
      className: 'text-[var(--uv-deep)] bg-white/70 border-[var(--uv)]',
    };
  } else if (isSuspect) {
    containerStyle = {
      background: 'var(--uv-wash)',
      border: '1.5px dashed var(--uv)',
      color: 'var(--ink)',
    };
    badge = {
      label: 'Suspect',
      icon: <ShieldAlert size={10} />,
      className: 'text-[var(--uv-deep)] bg-white/70 border-[var(--uv)]',
    };
  } else if (isRevoked) {
    containerStyle = {
      background: 'var(--chalk)',
      border: '1px dashed var(--hairline)',
      color: 'var(--slate)',
      opacity: 0.75,
    };
    badge = {
      label: status === 'invalidated' ? 'Invalidated' : 'Revoked',
      icon: <X size={10} className="stroke-[2.5]" />,
      className: 'text-[var(--slate)] bg-transparent border-[var(--hairline)]',
    };
  }

  // Selected state ring
  if (selected) {
    containerStyle.outline = '2px solid var(--uv-deep)';
    containerStyle.outlineOffset = '2px';
  }

  const typeLabel = isEvidence ? 'EVIDENCE' : isMemory ? 'MEMORY' : 'DECISION';

  return (
    <div
      className="relative w-[260px] p-3 rounded-[8px] text-xs transition-all duration-150 cursor-pointer select-none group hover:scale-[1.01]"
      style={containerStyle}
    >
      {/* Handles for connections */}
      {!isEvidence && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2.5 !h-2.5 !border-2 !border-[var(--paper)] transition-transform group-hover:scale-110"
          style={{
            background: isQuarantined || isSuspect || isConfirmedCausal ? 'var(--uv)' : 'var(--ink)',
          }}
        />
      )}
      {!isDecision && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2.5 !h-2.5 !border-2 !border-[var(--paper)] transition-transform group-hover:scale-110"
          style={{
            background: isQuarantined || isSuspect || isConfirmedCausal ? 'var(--uv)' : 'var(--ink)',
          }}
        />
      )}

      {/* Micro-header: Type pill, Monospace ID chip, State badge */}
      <div className="flex items-center justify-between pb-2 border-b border-inherit/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border"
            style={{
              borderColor: isConfirmedCausal ? 'rgba(255,255,255,0.4)' : 'var(--hairline)',
              background: isConfirmedCausal ? 'rgba(255,255,255,0.15)' : 'var(--chalk)',
              color: isConfirmedCausal ? '#ffffff' : 'var(--slate)',
            }}
          >
            {isEvidence && <FileText size={9} />}
            {isMemory && <Brain size={9} />}
            {isDecision && <Scale size={9} />}
            <span>{typeLabel}</span>
          </span>
          <span
            className="font-mono text-[11px] font-medium tracking-tight truncate max-w-[100px]"
            title={id}
          >
            {id}
          </span>
        </div>

        <div
          className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${badge.className}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Content: Two-line truncated payload with strikethrough if revoked */}
      <div
        className={`mt-2 text-[11px] leading-relaxed line-clamp-2 ${
          isRevoked ? 'line-through opacity-75' : ''
        }`}
        style={{
          color: isConfirmedCausal ? '#ffffff' : isRevoked ? 'var(--slate)' : 'var(--ink)',
        }}
      >
        {content}
      </div>
    </div>
  );
}
