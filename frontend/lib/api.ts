import {
  ScenarioData,
  ReplayData,
  RevokePreviewData,
  AuditEventData,
} from './types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? ''
    : 'http://127.0.0.1:8000');

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchScenario(): Promise<ScenarioData> {
  const res = await fetch(`${API_BASE}/api/scenario`);
  if (!res.ok) throw new Error(`Failed to fetch scenario: ${res.statusText}`);
  return res.json();
}

export async function fetchGraph(): Promise<{ nodes: any[]; edges: any[] }> {
  const res = await fetch(`${API_BASE}/api/graph`);
  if (!res.ok) throw new Error(`Failed to fetch graph: ${res.statusText}`);
  return res.json();
}

export async function fetchMemories(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/memories`);
  if (!res.ok) throw new Error(`Failed to fetch memories: ${res.statusText}`);
  return res.json();
}

export async function fetchAudit(limit = 30): Promise<AuditEventData[]> {
  const res = await fetch(`${API_BASE}/api/audit?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch audit: ${res.statusText}`);
  return res.json();
}

export async function ingestEvidence(payload: {
  content: string;
  source: string;
  trust_level_override?: string;
  parent_memory_ids?: string[];
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Ingest failed: ${res.statusText}`);
  return res.json();
}

export async function runReplay(suspectIds: string[]): Promise<ReplayData> {
  const res = await fetch(`${API_BASE}/api/replay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suspect_ids: suspectIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Replay failed');
  }
  return res.json();
}

export async function fetchRevokePreview(targetId: string): Promise<RevokePreviewData> {
  const res = await fetch(`${API_BASE}/api/revoke/preview?target_id=${encodeURIComponent(targetId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch revoke preview');
  }
  return res.json();
}

export async function executeRevoke(targetId: string, reason = 'Revoked via forensic interface'): Promise<any> {
  const res = await fetch(`${API_BASE}/api/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_id: targetId, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Revocation failed');
  }
  return res.json();
}

export async function resetDemo(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/demo/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Demo reset failed: ${res.statusText}`);
  return res.json();
}

export async function fetchBenchmark(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/benchmark`);
  if (!res.ok) throw new Error(`Failed to fetch benchmark: ${res.statusText}`);
  return res.json();
}

