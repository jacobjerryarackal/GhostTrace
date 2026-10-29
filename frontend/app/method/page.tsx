'use client';

import React from 'react';
import Link from 'next/link';
import {
  GitFork,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Cpu,
  Lock,
  Scale,
  FileCode,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function MethodPage() {
  return (
    <div className="w-full min-h-[calc(100vh-49px)] pb-16" style={{ background: 'var(--chalk)' }}>
      {/* Editorial Header */}
      <section className="border-b border-[var(--hairline)]" style={{ background: 'var(--paper)' }}>
        <div className="mx-auto max-w-[1200px] w-full px-4 sm:px-6 py-8 sm:py-10">
          <div className="max-w-[760px]">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-3 text-[11px] font-mono rounded border border-[var(--hairline)] bg-[var(--chalk)] text-[var(--slate)]">
              <span>Architecture & limits</span>
              <span>·</span>
              <span>Formal method</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-[var(--ink)] leading-tight">
              Explicit provenance, counterfactual replay, and cascading invalidation
            </h1>
            <p className="mt-3 text-base text-[var(--slate)] leading-relaxed">
              Why deleting poisoned evidence leaves persistent agent beliefs intact, and how GhostTrace
              uses interventional counterfactual replay to establish empirical behavioral dependence.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-auto max-w-[1200px] w-full px-4 sm:px-6 pt-8 space-y-10">
        {/* Section 1: The Three Pillars */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold font-display text-[var(--ink)]">
              The three technical pillars of GhostTrace
            </h2>
            <p className="mt-1 text-xs text-[var(--slate)]">
              A principled alternative to prompt-level guardrails and opaque vector similarity search.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div
              className="p-5 rounded border flex flex-col justify-between"
              style={{
                background: 'var(--paper)',
                borderColor: 'var(--hairline)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div className="w-8 h-8 rounded flex items-center justify-center bg-[var(--chalk)] border border-[var(--hairline)] text-[var(--ink)] mb-3">
                  <GitFork size={16} />
                </div>
                <div className="font-mono text-[11px] text-[var(--slate)]">Pillar 1</div>
                <h3 className="font-semibold text-base text-[var(--ink)] mt-0.5">
                  Explicit provenance DAG
                </h3>
                <p className="mt-2 text-xs text-[var(--slate)] leading-relaxed">
                  Incoming documents, scraped web data, and user messages are inscribed as immutable
                  evidence nodes with cryptographic hashes, ingestion timestamps, author signatures,
                  and origin channels.
                </p>
                <p className="mt-2 text-xs text-[var(--slate)] leading-relaxed">
                  When a memory extraction model synthesizes facts into persistent memory, it must emit
                  explicit pointer edges back to root evidence. If a belief cannot prove its lineage,
                  it cannot enter the trusted memory tier.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--hairline)] text-[11px] font-mono text-[var(--slate)] flex items-center justify-between">
                <span>Data model: Directed Acyclic Graph</span>
                <span className="font-semibold text-[var(--ink)]">SQLite + JSONB</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div
              className="p-5 rounded border flex flex-col justify-between"
              style={{
                background: 'var(--paper)',
                borderColor: 'var(--hairline)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div className="w-8 h-8 rounded flex items-center justify-center bg-[var(--chalk)] border border-[var(--hairline)] text-[var(--ink)] mb-3">
                  <RotateCcw size={16} />
                </div>
                <div className="font-mono text-[11px] text-[var(--slate)]">Pillar 2</div>
                <h3 className="font-semibold text-base text-[var(--ink)] mt-0.5">
                  Interventional counterfactual replay
                </h3>
                <p className="mt-2 text-xs text-[var(--slate)] leading-relaxed">
                  Taint tracking alone produces false positives because an agent may ingest a suspect
                  email without actually relying on it for its subsequent decisions.
                </p>
                <p className="mt-2 text-xs text-[var(--slate)] leading-relaxed">
                  GhostTrace adapts Judea Pearl’s do-calculus: when an action is proposed, we run an
                  interventional replay with the suspect memory surgically excised, keeping all clean
                  policies and environment state frozen at temperature 0.0. If the action changes,
                  empirical causal dependence is proven.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--hairline)] text-[11px] font-mono text-[var(--slate)] flex items-center justify-between">
                <span>Formal test: P(Action | do(Memory = ∅))</span>
                <span className="font-semibold text-[var(--ink)]">T = 0.00</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div
              className="p-5 rounded border flex flex-col justify-between"
              style={{
                background: 'var(--paper)',
                borderColor: 'var(--hairline)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div
                  className="w-8 h-8 rounded flex items-center justify-center border mb-3"
                  style={{
                    background: 'var(--uv-wash)',
                    borderColor: 'var(--uv)',
                    color: 'var(--uv-deep)',
                  }}
                >
                  <ShieldAlert size={16} />
                </div>
                <div className="font-mono text-[11px] text-[var(--slate)]">Pillar 3</div>
                <h3 className="font-semibold text-base text-[var(--ink)] mt-0.5">
                  Deterministic cascading invalidation
                </h3>
                <p className="mt-2 text-xs text-[var(--slate)] leading-relaxed">
                  Deleting a phishing email from an inbox does not delete what the agent learned from it.
                  Language models summarize inputs into persistent agent beliefs.
                </p>
                <p className="mt-2 text-xs text-[var(--slate)] leading-relaxed">
                  When an administrator revokes a root evidence node in GhostTrace, the system walks the
                  DAG downstream and invalidates every derived belief, synthetic profile, and planned
                  action that inherited from it, restoring verified baseline policies deterministically.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--hairline)] text-[11px] font-mono text-[var(--slate)] flex items-center justify-between">
                <span>Revocation blast radius: Exact subtree</span>
                <span className="font-semibold text-[var(--ink)]">100% cascade</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Architecture Lifecycle Flowchart */}
        <section
          className="p-5 sm:p-6 rounded border"
          style={{
            background: 'var(--paper)',
            borderColor: 'var(--hairline)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div className="pb-4 border-b border-[var(--hairline)]">
            <h2 className="text-xl font-bold font-display text-[var(--ink)]">
              End-to-end governance lifecycle
            </h2>
            <p className="mt-1 text-xs text-[var(--slate)]">
              How untrusted evidence moves through provenance tracking, replay verification, and excision.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="w-[840px] mx-auto flex items-stretch justify-between gap-3 text-xs relative">
              {/* Step 1 */}
              <div className="w-[260px] p-4 rounded border bg-[var(--chalk)] border-[var(--hairline)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--hairline)]">
                    <span className="font-mono text-[10px] text-[var(--slate)]">Phase 1</span>
                    <span className="text-[10px] font-semibold text-[var(--ink)]">Ingestion</span>
                  </div>
                  <div className="font-semibold text-xs text-[var(--ink)]">Screening & Inscription</div>
                  <p className="mt-2 text-[11px] text-[var(--slate)] leading-relaxed">
                    Raw evidence arrives from webhook or email. Screening model extracts facts with structured
                    JSON schema. Origin channel risk determines whether node starts in clean or quarantined state.
                  </p>
                </div>
                <div className="mt-4 p-2 rounded bg-[var(--paper)] border border-[var(--hairline)] font-mono text-[10px] text-[var(--slate)]">
                  DAG.insert_node(evidence, channel, hash)
                </div>
              </div>

              {/* Arrow 1 */}
              <div className="flex items-center justify-center text-[var(--slate)]">
                <ArrowRight size={18} />
              </div>

              {/* Step 2 */}
              <div className="w-[260px] p-4 rounded border bg-[var(--chalk)] border-[var(--hairline)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--hairline)]">
                    <span className="font-mono text-[10px] text-[var(--slate)]">Phase 2</span>
                    <span className="text-[10px] font-semibold text-[var(--ink)]">Execution</span>
                  </div>
                  <div className="font-semibold text-xs text-[var(--ink)]">Eligible Memory Assembly</div>
                  <p className="mt-2 text-[11px] text-[var(--slate)] leading-relaxed">
                    Decision model receives only verified nodes. If a quarantined candidate exists, it is
                    staged for shadow execution to evaluate potential compromise.
                  </p>
                </div>
                <div className="mt-4 p-2 rounded bg-[var(--paper)] border border-[var(--hairline)] font-mono text-[10px] text-[var(--slate)]">
                  prompt = assemble(trusted_nodes)
                </div>
              </div>

              {/* Arrow 2 */}
              <div className="flex items-center justify-center text-[var(--slate)]">
                <ArrowRight size={18} />
              </div>

              {/* Step 3 */}
              <div className="w-[260px] p-4 rounded border bg-[var(--chalk)] border-[var(--hairline)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--hairline)]">
                    <span className="font-mono text-[10px] text-[var(--slate)]">Phase 3</span>
                    <span className="text-[10px] font-semibold text-[var(--ink)]">Verification</span>
                  </div>
                  <div className="font-semibold text-xs text-[var(--ink)]">Surgical Excision Replay</div>
                  <p className="mt-2 text-[11px] text-[var(--slate)] leading-relaxed">
                    The suspect node is excised. Replay evaluates whether output reverts to verified treasury
                    routing. On confirmed recovery, cascading revocation purges descendants.
                  </p>
                </div>
                <div className="mt-4 p-2 rounded bg-[var(--paper)] border border-[var(--hairline)] font-mono text-[10px] text-[var(--slate)]">
                  replay(without_target) == baseline
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: What Replay Cannot Prove (Scientific Bounds & Limitations) */}
        <section
          className="p-5 sm:p-6 rounded border"
          style={{
            background: 'var(--paper)',
            borderColor: 'var(--hairline)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div className="pb-4 border-b border-[var(--hairline)]">
            <div className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[var(--alert)] mb-1">
              <AlertTriangle size={13} />
              <span>Scientific boundaries</span>
            </div>
            <h2 className="text-xl font-bold font-display text-[var(--ink)]">
              What replay cannot prove
            </h2>
            <p className="mt-1 text-xs text-[var(--slate)]">
              Counterfactual replay is an empirical test under controlled conditions. We explicitly document
              four scenarios where replay cannot provide absolute guarantees.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Limitation 1 */}
            <div
              className="p-4 rounded border"
              style={{
                background: 'var(--chalk)',
                borderColor: 'var(--hairline)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div className="font-semibold text-sm text-[var(--ink)] flex items-center justify-between">
                <span>1. Nondeterministic inference jitter</span>
                <span className="font-mono text-[10px] text-[var(--slate)]">GPU kernels</span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--slate)] leading-relaxed">
                Even with greedy decoding (<code className="font-mono text-[10px]">temperature = 0.0</code>),
                floating-point non-associativity across distributed tensor-parallel GPU clusters can
                occasionally alter token selection in borderline prompts.
              </p>
              <div className="mt-3 p-2 rounded bg-[var(--paper)] border border-[var(--hairline)] text-[10px] text-[var(--slate)]">
                <strong>Mitigation:</strong> GhostTrace forces deterministic seed pinning and executes dual-run
                verification passes before confirming an excision verdict.
              </div>
            </div>

            {/* Limitation 2 */}
            <div
              className="p-4 rounded border"
              style={{
                background: 'var(--chalk)',
                borderColor: 'var(--hairline)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div className="font-semibold text-sm text-[var(--ink)] flex items-center justify-between">
                <span>2. Interacting and colluding memories</span>
                <span className="font-mono text-[10px] text-[var(--slate)]">Sybil attacks</span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--slate)] leading-relaxed">
                If an adversary splits an attack across three distinct, seemingly benign memories (e.g.,
                memory A supplies a routing rule, memory B changes priority, memory C supplies the account),
                excising any single memory may leave the decision poisoned if two are sufficient.
              </p>
              <div className="mt-3 p-2 rounded bg-[var(--paper)] border border-[var(--hairline)] text-[10px] text-[var(--slate)]">
                <strong>Mitigation:</strong> GhostTrace performs power-set subset excision up to depth 2
                when multi-memory contamination is suspected.
              </div>
            </div>

            {/* Limitation 3 */}
            <div
              className="p-4 rounded border"
              style={{
                background: 'var(--chalk)',
                borderColor: 'var(--hairline)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div className="font-semibold text-sm text-[var(--ink)] flex items-center justify-between">
                <span>3. Overdetermined autonomous actions</span>
                <span className="font-mono text-[10px] text-[var(--slate)]">Coincidental agreement</span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--slate)] leading-relaxed">
                If a legitimate treasury policy and a malicious injection happen to recommend the exact same
                action (e.g. paying an emergency invoice to an escrow clearinghouse), counterfactual excision
                will observe zero output divergence, masking the latent contamination.
              </p>
              <div className="mt-3 p-2 rounded bg-[var(--paper)] border border-[var(--hairline)] text-[10px] text-[var(--slate)]">
                <strong>Mitigation:</strong> Lineage tracing flags tainted inputs regardless of behavioral
                divergence, marking nodes for administrative review.
              </div>
            </div>

            {/* Limitation 4 */}
            <div
              className="p-4 rounded border"
              style={{
                background: 'var(--chalk)',
                borderColor: 'var(--hairline)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div className="font-semibold text-sm text-[var(--ink)] flex items-center justify-between">
                <span>4. Irreversible external side-effects</span>
                <span className="font-mono text-[10px] text-[var(--slate)]">Financial execution</span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--slate)] leading-relaxed">
                Replay can only reconstruct what the agent would have done without the memory; it cannot
                claw back an ACH wire or external API mutation that has already executed on third-party rails.
              </p>
              <div className="mt-3 p-2 rounded bg-[var(--paper)] border border-[var(--hairline)] text-[10px] text-[var(--slate)]">
                <strong>Mitigation:</strong> High-risk tool calls require asynchronous human confirmation or
                cryptographic escrow hold periods while provenance is validated.
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Model Routing Table */}
        <section
          className="rounded border overflow-hidden"
          style={{
            background: 'var(--paper)',
            borderColor: 'var(--hairline)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div className="p-4 sm:p-5 border-b border-[var(--hairline)]">
            <h2 className="text-lg font-bold font-display text-[var(--ink)]">
              Model routing & temperature configuration
            </h2>
            <p className="text-xs text-[var(--slate)] mt-0.5">
              Production deployment of NVIDIA Nemotron-3-Super on Nebius Token Factory.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--hairline)] bg-[var(--chalk)] text-[var(--slate)] font-mono text-[11px]">
                  <th className="py-2.5 px-4 font-medium">Stage</th>
                  <th className="py-2.5 px-4 font-medium">Model ID</th>
                  <th className="py-2.5 px-4 font-medium">Temperature</th>
                  <th className="py-2.5 px-4 font-medium">Latency budget</th>
                  <th className="py-2.5 px-4 font-medium">Governance role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
                <tr>
                  <td className="py-3 px-4 font-semibold text-[var(--ink)]">Memory screening</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--slate)]">
                    nvidia/nemotron-3-super-120b
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--ink)]">0.10</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--slate)]">450 ms</td>
                  <td className="py-3 px-4 text-[var(--slate)]">
                    Extracts structured facts, flags urgency imperatives, and assigns initial quarantine risk.
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-[var(--ink)]">Decision execution</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--slate)]">
                    nvidia/nemotron-3-super-120b
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--ink)]">0.00</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--slate)]">600 ms</td>
                  <td className="py-3 px-4 text-[var(--slate)]">
                    Evaluates payment authorization prompts using strictly eligible, trusted graph nodes.
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-[var(--ink)]">Counterfactual verification</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--slate)]">
                    nvidia/nemotron-3-super-120b
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--ink)]">0.00</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--slate)]">750 ms</td>
                  <td className="py-3 px-4 text-[var(--slate)]">
                    Re-runs execution under surgical memory excision to calculate empirical causal diff.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Explore Callouts */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded border bg-[var(--paper)] border-[var(--hairline)]">
          <div>
            <h3 className="font-semibold text-sm text-[var(--ink)]">
              Ready to test counterfactual replay yourself?
            </h3>
            <p className="text-xs text-[var(--slate)] mt-0.5">
              Open the interactive workspace to run a live memory injection, preview blast-radius, and revoke.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/investigate"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] transition-colors"
            >
              <span>Launch workspace</span>
              <ArrowRight size={12} />
            </Link>
            <Link
              href="/benchmark"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--hairline)] bg-[var(--chalk)] text-[var(--ink)] hover:bg-[var(--paper)] transition-colors"
            >
              <span>View benchmark</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
