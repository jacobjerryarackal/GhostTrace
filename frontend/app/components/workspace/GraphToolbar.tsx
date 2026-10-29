'use client';

import React from 'react';
import { Plus, HelpCircle, RotateCcw, Download, Play } from 'lucide-react';

interface GraphToolbarProps {
  onOpenIngest: () => void;
  onOpenAsk: () => void;
  onRunReplay: () => void;
  onOpenReset: () => void;
  onExportTrace: () => void;
  isLoading: boolean;
  hasSuspects: boolean;
}

export function GraphToolbar({
  onOpenIngest,
  onOpenAsk,
  onRunReplay,
  onOpenReset,
  onExportTrace,
  isLoading,
  hasSuspects,
}: GraphToolbarProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-3.5 py-2 border-b bg-[var(--paper)] overflow-x-auto whitespace-nowrap"
      style={{ borderColor: 'var(--hairline)' }}
    >
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenIngest}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded transition-colors"
          style={{
            borderColor: 'var(--hairline)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            borderRadius: 'var(--radius-sm)',
          }}
          title="Ingest custom evidence with live screening"
        >
          <Plus size={13} />
          <span>Ingest evidence</span>
        </button>

        <button
          type="button"
          onClick={onOpenAsk}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded transition-colors"
          style={{
            borderColor: 'var(--hairline)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            borderRadius: 'var(--radius-sm)',
          }}
          title="Query the agent to compare protected vs unprotected response"
        >
          <HelpCircle size={13} />
          <span>Ask agent</span>
        </button>

        <button
          type="button"
          onClick={onRunReplay}
          disabled={isLoading || !hasSuspects}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded transition-colors"
          style={{
            borderColor: hasSuspects ? 'var(--uv)' : 'var(--hairline)',
            background: hasSuspects ? 'var(--uv-wash)' : 'var(--paper)',
            color: hasSuspects ? 'var(--uv-deep)' : 'var(--slate)',
            borderRadius: 'var(--radius-sm)',
          }}
          title={hasSuspects ? 'Examine decision shift when suspect provenance is removed' : 'Ingest an attack first to enable replay testing'}
        >
          <Play size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Replay without suspect memories</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportTrace}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded transition-colors"
          style={{
            borderColor: 'var(--hairline)',
            background: 'var(--paper)',
            color: 'var(--slate)',
            borderRadius: 'var(--radius-sm)',
          }}
          title="Download forensic trace as markdown"
        >
          <Download size={12} />
          <span>Export trace</span>
        </button>

        <button
          type="button"
          onClick={onOpenReset}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded transition-colors"
          style={{
            borderColor: 'var(--hairline)',
            background: 'var(--paper)',
            color: 'var(--slate)',
            borderRadius: 'var(--radius-sm)',
          }}
          title="Reset demo back to clean policy baseline"
        >
          <RotateCcw size={12} />
          <span>Reset demo</span>
        </button>
      </div>
    </div>
  );
}

