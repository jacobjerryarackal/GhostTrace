'use client';

import React, { useEffect, useState } from 'react';
import { fetchHealth } from '@/lib/api';

interface NebiusStatus {
  status?: 'connected' | 'unconfigured' | 'authentication_failed' | 'unavailable';
  configured?: boolean;
  available?: boolean;
  model_id?: string;
  latency_ms?: number;
  message?: string;
}

export function StatusChip() {
  const [nebius, setNebius] = useState<NebiusStatus | null>(null);
  const [hasLiveCallSucceeded, setHasLiveCallSucceeded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const data = await fetchHealth();
        if (mounted && data?.nebius_integration) {
          setNebius(data.nebius_integration);
          if (data.nebius_integration.status === 'connected') {
            setHasLiveCallSucceeded(true);
          } else {
            setHasLiveCallSucceeded(false);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setNebius({
            status: 'unavailable',
            message: err?.message || 'Backend service unreachable',
            configured: false,
            available: false,
          });
          setHasLiveCallSucceeded(false);
        }
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Strict honesty rules from DESIGN.md:
  // 1. "Live" only after a successful model call
  // 2. Otherwise "Scripted demo"
  // 3. "Inference unavailable" if credentials fail or API errors out
  // Never show a model name as if live when simulated
  if (nebius?.status === 'authentication_failed' || nebius?.status === 'unavailable') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border rounded-[5px] transition-colors cursor-default select-none shadow-none"
        style={{
          borderColor: 'var(--alert)',
          color: 'var(--alert)',
          background: 'var(--paper)',
        }}
        title={nebius.message || 'Inference call failed'}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--alert)' }}
        />
        <span>Inference unavailable</span>
      </div>
    );
  }

  if (hasLiveCallSucceeded && nebius?.status === 'connected') {
    return (
      <div
        className="inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-medium border rounded-[5px] transition-colors cursor-default select-none shadow-none"
        style={{
          borderColor: 'var(--ink)',
          color: 'var(--ink)',
          background: 'var(--paper)',
        }}
        title={`Live model call verified: nvidia/nemotron-3-super-120b-a12b (${nebius.latency_ms ? `${Math.round(nebius.latency_ms)}ms` : 'active'})`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: 'var(--ink)' }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: 'var(--ink)' }}
          />
        </span>
        <span className="font-semibold">Live</span>
        {Boolean(nebius.latency_ms) && (
          <span
            className="font-mono text-[10px] pl-1.5 border-l"
            style={{
              borderColor: 'var(--hairline)',
              color: 'var(--slate)',
            }}
          >
            {Math.round(nebius.latency_ms!)}ms
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border rounded-[5px] transition-colors cursor-default select-none shadow-none"
      style={{
        borderColor: 'var(--hairline)',
        color: 'var(--slate)',
        background: 'var(--paper)',
      }}
      title="Deterministic script fallback active. Configure NEBIUS_API_KEY in backend/.env for live inference."
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: 'var(--slate)' }}
      />
      <span>Scripted demo</span>
    </div>
  );
}

