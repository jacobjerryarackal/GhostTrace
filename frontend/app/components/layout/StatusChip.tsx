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
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded transition-colors cursor-default"
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
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded transition-colors cursor-default"
        style={{
          borderColor: 'var(--ink)',
          color: 'var(--ink)',
          background: 'var(--paper)',
        }}
        title={`Live model call verified (${nebius.latency_ms ? `${nebius.latency_ms}ms` : 'active'})`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--ink)' }}
        />
        <span>Live</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded transition-colors cursor-default"
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

