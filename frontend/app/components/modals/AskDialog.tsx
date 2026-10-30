'use client';

import React, { useState } from 'react';
import { HelpCircle, X, Shield, AlertOctagon } from 'lucide-react';

interface AskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cleanDestination: string;
}

export function AskDialog({ isOpen, onClose, cleanDestination }: AskDialogProps) {
  const [question, setQuestion] = useState('Where should pending Acme Cloud Services payment $14,250 be routed?');
  const [hasEvaluated, setHasEvaluated] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[10px] border p-5 shadow-2xl space-y-4"
        style={{
          background: 'var(--paper)',
          borderColor: 'var(--hairline)',
          color: 'var(--ink)',
          boxShadow: '0 8px 30px rgba(17, 23, 20, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-[var(--ink)]" />
            <h2 className="text-sm font-semibold tracking-tight">
              Ask the agent
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--slate)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-[var(--slate)] text-[11px] block mb-1">
              Payment query prompt
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-2.5 border rounded font-mono text-xs bg-[var(--chalk)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink)]"
              style={{ borderColor: 'var(--hairline)' }}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setHasEvaluated(true)}
              className="btn-press px-3.5 py-1.5 text-xs font-semibold rounded border transition-colors text-white"
              style={{
                background: 'var(--ink)',
                borderColor: 'var(--ink)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Evaluate responses
            </button>
          </div>

          {hasEvaluated && (
            <div className="space-y-2.5 pt-2 border-t border-[var(--hairline)]">
              {/* Protected Agent */}
              <div
                className="p-3 rounded border text-xs"
                style={{
                  background: 'var(--paper)',
                  borderColor: 'var(--ink)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                    <Shield size={12} />
                    <span>GhostTrace Protected Context</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--chalk)] text-[var(--ink)] border border-[var(--hairline)] font-medium">
                    Protected
                  </span>
                </div>
                <div className="font-mono text-xs font-semibold text-[var(--ink)]">
                  {cleanDestination}
                </div>
                <p className="mt-1 text-[11px] text-[var(--slate)]">
                  Ground truth corporate treasury destination. Contaminated memory excluded from LLM inference context.
                </p>
              </div>

              {/* Unprotected Agent */}
              <div
                className="p-3 rounded border text-xs"
                style={{
                  background: 'var(--uv-wash)',
                  borderColor: 'var(--uv)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[var(--uv-deep)] flex items-center gap-1.5">
                    <AlertOctagon size={12} />
                    <span>Unprotected Naive Context</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--uv)] text-white font-medium">
                    Vulnerable
                  </span>
                </div>
                <div className="font-mono text-xs font-semibold text-[var(--uv-deep)]">
                  KY11-VAULT-ATTACKER-133742
                </div>
                <p className="mt-1 text-[11px] text-[var(--slate)]">
                  Adversarial destination injected via unverified webhook. Retrieved and executed blindly without provenance validation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
