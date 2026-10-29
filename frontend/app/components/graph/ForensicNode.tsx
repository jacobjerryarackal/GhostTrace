'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileText, Brain, Scale, Lock, Check, ShieldAlert } from 'lucide-react';
import { GraphNodeData } from '@/lib/types';

export function ForensicNode({ data, selected }: NodeProps<{ data: GraphNodeData }>) {
  const node = (data as any)?.data || data;
  const { id, type, status, content, isConfirmedCausal } = node;

  const isEvidence = type === 'evidence';
  const isMemory = type === 'memory';
  const isDecision = type === 'decision';

  const isTrusted = status === 'trusted' || status === 'clean_reference';
  const isQuarantined = status === 'quarantined';
  const isRevoked = status === 'revoked' || status === 'invalidated';
  const isSuspect = !isTrusted && !isRevoked && !isQuarantined && !isConfirmedCausal;

  // Determine visual styling according to DESIGN.md section 2
  let containerStyle: React.CSSProperties = {
    background: 'var(--paper)',
    border: '1px solid var(--ink)',
    color: 'var(--ink)',
  };

  let badge = {
    label: isTrusted ? 'Trusted' : status,
    icon: <Check size={11} className="stroke-[2.5]" />,
  };

  if (isConfirmedCausal) {
    containerStyle = {
      background: 'var(--uv)',
      border: '1.5px solid var(--uv-deep)',
      color: '#ffffff',
    };
    badge = {
      label: 'Confirmed causal',
      icon: <ShieldAlert size={11} />,
    };
  } else if (isQuarantined) {
    containerStyle = {
      background: 'var(--uv-wash)',
      border: '1.5px dashed var(--uv)',
      color: 'var(--ink)',
    };
    badge = {
      label: 'Quarantined',
      icon: <Lock size={11} />,
    };
  } else if (isSuspect) {
    containerStyle = {
      background: 'var(--uv-wash)',
      border: '1.5px dashed var(--uv)',
      color: 'var(--ink)',
    };
    badge = {
      label: 'Suspect',
      icon: <ShieldAlert size={11} />,
    };
  } else if (isRevoked) {
    containerStyle = {
      background: 'transparent',
      border: '1px solid var(--hairline)',
      color: 'var(--slate)',
    };
    badge = {
      label: status === 'invalidated' ? 'Invalidated' : 'Revoked',
      icon: <span className="text-[10px] leading-none">✕</span>,
    };
  }

  // Selected state ring
  if (selected) {
    containerStyle.outline = '2px solid var(--uv-deep)';
    containerStyle.outlineOffset = '2px';
  }

  return (
    <div
      className="relative w-[250px] p-3 rounded-[6px] text-xs transition-colors duration-150 cursor-pointer shadow-none select-none"
      style={containerStyle}
    >
      {/* Handles for connections */}
      {!isEvidence && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !bg-[var(--ink)] !border-none"
          style={{
            background: isQuarantined || isSuspect || isConfirmedCausal ? 'var(--uv)' : 'var(--ink)',
          }}
        />
      )}
      {!isDecision && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2 !h-2 !bg-[var(--ink)] !border-none"
          style={{
            background: isQuarantined || isSuspect || isConfirmedCausal ? 'var(--uv)' : 'var(--ink)',
          }}
        />
      )}

      {/* Header: Type icon, ID (mono), State Indicator */}
      <div className="flex items-center justify-between pb-1.5 border-b border-inherit opacity-90">
        <div className="flex items-center gap-1.5">
          {isEvidence && <FileText size={12} />}
          {isMemory && <Brain size={12} />}
          {isDecision && <Scale size={12} />}
          <span className="font-mono text-[11px] font-normal tracking-tight">{id}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium">
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Content: Two-line truncated payload with strikethrough if revoked */}
      <div
        className={`mt-2 text-[11px] leading-snug line-clamp-2 ${isRevoked ? 'line-through opacity-70' : ''
          }`}
      >
        {content}
      </div>
    </div>
  );
}
