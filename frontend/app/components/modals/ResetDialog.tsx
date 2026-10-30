import React from 'react';
import { RotateCcw, X } from 'lucide-react';

interface ResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
  isResetting: boolean;
}

export function ResetDialog({
  isOpen,
  onClose,
  onConfirmReset,
  isResetting,
}: ResetDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={() => !isResetting && onClose()}
    >
      <div
        className="modal-content w-full max-w-md rounded-[10px] border p-5 shadow-2xl space-y-4"
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
            <RotateCcw size={15} className="text-[var(--ink)]" />
            <h2 id="reset-dialog-title" className="text-sm font-semibold tracking-tight">
              Reset demo scenario
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="p-1 rounded text-[var(--slate)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-2 text-xs text-[var(--slate)] leading-relaxed">
          <p>
            This action resets the demo environment and purges all custom ingested evidence, derived beliefs, and counterfactual replay test records.
          </p>
          <div className="p-2.5 rounded border bg-[var(--chalk)] border-[var(--hairline)] font-mono text-[11px] text-[var(--ink)]">
            Restored state: Corporate policy Rule 401.A active | JPMorgan Chase routing US89-ACME-CORP-9876543210
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--hairline)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="btn-press px-3 py-1.5 text-xs font-medium border rounded transition-colors text-[var(--slate)] border-[var(--hairline)] bg-[var(--paper)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmReset}
            disabled={isResetting}
            className="btn-press px-3.5 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5 text-white"
            style={{
              background: 'var(--ink)',
              borderColor: 'var(--ink)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {isResetting ? <RotateCcw size={12} className="animate-spin" /> : null}
            <span>Reset demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
