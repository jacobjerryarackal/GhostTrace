'use client';

import React, { useEffect, useState } from 'react';
import { RevokePreviewData } from '@/lib/types';
import { fetchRevokePreview } from '@/lib/api';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface RevokeDialogProps {
  targetId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRevoke: (targetId: string) => Promise<void>;
  isRevoking: boolean;
}

export function RevokeDialog({
  targetId,
  isOpen,
  onClose,
  onConfirmRevoke,
  isRevoking,
}: RevokeDialogProps) {
  const [preview, setPreview] = useState<RevokePreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !targetId) {
      setPreview(null);
      setError(null);
      return;
    }

    let active = true;
    setIsLoadingPreview(true);
    setError(null);

    fetchRevokePreview(targetId)
      .then((data) => {
        if (active) setPreview(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load blast-radius preview');
      })
      .finally(() => {
        if (active) setIsLoadingPreview(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, targetId]);

  if (!isOpen || !targetId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={() => !isRevoking && onClose()}
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
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--uv-deep)]" />
            <h2 className="text-sm font-semibold tracking-tight">
              Revocation blast-radius preview
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRevoking}
            className="p-1 rounded text-[var(--slate)] hover:text-[var(--ink)]"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        {isLoadingPreview ? (
          <div className="py-8 text-center text-xs text-[var(--slate)]">
            Calculating downstream graph dependency impact...
          </div>
        ) : error ? (
          <div className="p-3 text-xs border rounded text-[var(--alert)] bg-[var(--chalk)] border-[var(--alert)]">
            {error}
          </div>
        ) : preview ? (
          <div className="space-y-3.5 text-xs">
            {/* Target Node */}
            <div>
              <span className="text-[11px] font-semibold text-[var(--slate)] block mb-1">
                Target node to revoke:
              </span>
              <div
                className="p-2.5 rounded border font-mono text-xs leading-relaxed"
                style={{
                  background: 'var(--chalk)',
                  borderColor: 'var(--hairline)',
                }}
              >
                <div className="font-semibold text-[var(--ink)] mb-1">
                  [{preview.target_type}] {preview.target_id}
                </div>
                <div className="text-[11px] text-[var(--slate)] line-clamp-2">
                  {preview.target_content}
                </div>
              </div>
            </div>

            {/* Invalidation cascade list */}
            <div>
              <span className="text-[11px] font-semibold text-[var(--slate)] block mb-1">
                Derived memories to be invalidated:
              </span>
              {preview.invalidated_memory_ids.length > 0 ? (
                <div className="p-2.5 rounded border bg-[var(--chalk)] border-[var(--hairline)] space-y-1.5 max-h-32 overflow-y-auto font-mono text-[11px]">
                  {preview.downstream_memories.map((m) => (
                    <div key={m.id} className="flex items-start gap-1.5 text-[var(--slate)]">
                      <span className="text-[var(--uv-deep)] font-semibold">-</span>
                      <div>
                        <strong className="text-[var(--ink)]">{m.id}</strong>: {m.content.substring(0, 80)}...
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 rounded border bg-[var(--chalk)] border-[var(--hairline)] text-[11px] text-[var(--slate)] italic">
                  No downstream memories depend on this node.
                </div>
              )}
            </div>

            {/* Projected recovery destination */}
            <div
              className="p-3 rounded border text-xs"
              style={{
                background: 'var(--paper)',
                borderColor: 'var(--ink)',
              }}
            >
              <span className="text-[11px] text-[var(--slate)] block mb-1 font-semibold">
                Projected post-revocation destination:
              </span>
              <div className="font-mono text-xs font-semibold text-[var(--ink)]">
                {preview.recovery_destination}
              </div>
              <p className="mt-1 text-[11px] text-[var(--slate)]">
                Excision of this branch restores or preserves automated routing to verified corporate treasury.
              </p>
            </div>
          </div>
        ) : null}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--hairline)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isRevoking}
            className="px-3 py-1.5 text-xs font-medium border rounded transition-colors text-[var(--slate)] border-[var(--hairline)] bg-[var(--paper)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirmRevoke(targetId)}
            disabled={isRevoking || isLoadingPreview}
            className="px-3.5 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 text-white"
            style={{
              background: 'var(--ink)',
              borderColor: 'var(--ink)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {isRevoking ? <RotateCcw size={12} className="animate-spin" /> : null}
            <span>Revoke and re-decide</span>
          </button>
        </div>
      </div>
    </div>
  );
}

