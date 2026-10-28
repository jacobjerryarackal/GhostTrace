# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Enterprise AI Security, Compliance, and Incident Response Engineers charged with overseeing autonomous enterprise agents (such as automated Accounts Payable routing, customer workflows, and operational decision agents).

These operators work in high-stakes environments where untrusted evidence (e.g., fraudulent vendor invoices, poisoned web crawls, prompt injection webhooks) can contaminate persistent agent memory. Their job is to:
1. Detect when derived memories originate from suspect or untrusted provenance.
2. Intervene and test whether downstream automated decisions actually depend on contaminated memories.
3. Surgically revoke corrupt evidence, cascade invalidation across all derived beliefs, and empirically prove that agent behavior restores to verified corporate policy.

Secondary users include AI Agent Researchers and Developers seeking reproducible benchmarks and audit mechanisms for memory architectures.

## Product Purpose

GhostTrace exists to eliminate the silent hazard of derived memory contamination in autonomous AI systems.

When an AI agent forms a belief from untrusted data, simply deleting the original source evidence leaves behind derived memories that continue poisoning downstream actions. GhostTrace solves this by maintaining an explicit directed acyclic provenance graph (DAG) across evidence, memories, and decisions.

Success means:
- Zero unauthorized decisions executing from poisoned or untrusted provenance (0% attack success rate).
- Instant, deterministic quarantine of suspect evidence and its derived memories.
- Verifiable behavioral recovery back to clean ground-truth reference policies.
- An immutable, cryptographic forensic audit trail capturing every ingestion, replay, revocation, and decision state.

## Positioning

GhostTrace is framed on **behavioral dependency testing** and **deterministic DAG invalidation**.

Unlike speculative interpretability tools that claim to discover internal neural causal mechanisms within black-box model weights, GhostTrace enforces empirical, observable behavioral guarantees:
- **Interventional Replay**: Surgically excludes suspect provenance nodes from the decision context and compares the counterfactual outcome against baseline behavior.
- **Deterministic Application-Layer Trust**: Trust policies and quarantine gates are enforced deterministically by software logic—never delegated to the language model alone.
- **Cascading Invalidation**: Downstream memory invalidation is mathematically guaranteed via deterministic graph traversal (BFS/DFS).

## Operating Context

- **Environment**: Web-based Cyber-Forensic Investigation Workspace operating in high-security, low-light Security Operations Center (SOC) environments.
- **Decision Scenarios**: Mission-critical enterprise workflows (e.g., Accounts Payable payment routing authorizing $14,250 wire disbursements to JPMorgan Chase Treasury accounts).
- **Inference Integration**: Nebius Token Factory OpenAI-compatible API utilizing NVIDIA Nemotron (`nvidia/nemotron-3-super-120b-a12b`) for structured memory extraction and decision evaluation.
- **Runtime Stack**: Next.js 14 App Router (TypeScript, custom cyber-forensic CSS) paired with a FastAPI backend (Python 3.11, SQLite persistent database, Pydantic data models).

## Capabilities and Constraints

### Capabilities
- **Provenance DAG**: Interactive 3-tier dependency visualization (Evidence Sources -> Derived Memories -> Decision Outcomes).
- **Deterministic Quarantine**: Automated quarantine isolation for untrusted sources, prompt injection markers, and payment redirection directives.
- **Interventional Replay**: Side-by-side comparative analysis of Baseline (unfiltered), Counterfactual Replay (surgically excluded), and Clean Ground Truth Reference.
- **Recursive Revocation**: One-click deterministic revocation of root evidence that recursively cascades `invalidated` status to all descendant memories.
- **Empirical Recovery Verification**: Automated validation proving counterfactual decisions match clean reference policies.
- **Audit Logging**: Structured chronological audit event trail recording every lifecycle operation.
- **Reproducible Evaluation Benchmark**: Built-in 12-scenario evaluation harness measuring Attack Success Rate (ASR), Precision, Recall, False Quarantine Rate, and Recovery Rate.

### Technical Constraints & Terminology
- Strict terminology: Use "behavioral dependency testing" or "interventional replay"; never claim internal neural causal transparency.
- Node statuses: Evidence (`trusted`, `quarantined`, `revoked`); Memory (`trusted`, `quarantined`, `revoked`, `invalidated`); Decision (`clean_reference`, `evaluated`).
- Replay results provide evidence of behavioral dependence/invariance under test, but do not constitute an absolute security guarantee without deterministic revocation.
- Zero local models; live inference relies on Nebius Token Factory with strict server-side credential isolation.

## Brand Commitments

- **Name**: GhostTrace
- **Tagline**: *Find the bad memory. Trace its influence. Prove the recovery.*
- **Visual Identity**: Dark forensic cybersecurity aesthetic with deep slate/charcoal backgrounds (`#080b11`, `#0f1523`), cyan cyber accents (`#06b6d4`, `#38bdf8`), emerald for trusted states (`#10b981`), amber for quarantine (`#f59e0b`), and crimson for revoked/invalidated records (`#ef4444`, `#ec4899`).
- **Tone & Voice**: Authoritative, forensic, disciplined, precise, non-hype. Speaks the language of systems security, cryptographic auditability, and empirical verification.

## Evidence on Hand

- **Automated Pytest Suite**: 27 passing tests (`backend/tests/`) validating graph integrity, deterministic trust propagation, state machine transitions, recursive invalidation, and REST APIs.
- **12-Scenario Reproducible Benchmark**: Real measured metrics on 12 distinct scenarios across clean, stale, contradictory, direct poisoning, derived poisoning, and benign untrusted evidence:
  - Attack Success Rate: 0.0% (vs. 100.0% simple baseline).
  - Detection Recall & Precision: 100.0% / 100.0%.
  - Clean Policy False Quarantine Rate: 0.0%.
  - Recovery Against Clean Reference: 100.0% (vs. 41.7% simple baseline).
- **Seeded Reference Data**: Ground truth payment policy Rule 401.A for Acme Cloud Services ($14,250 retainer to `US89-ACME-CORP-9876543210`).
- **Live Build Artifacts**: Fully compiling Next.js 14 frontend and FastAPI backend.

## Product Principles

1. **Deterministic Authority Over Model Discretion**: Never rely on language models to self-police their own memories; trust propagation, quarantine boundaries, and revocations are enforced deterministically by application logic.
2. **Provenance is Non-Negotiable**: No memory exists without an explicit link to its evidence or parent belief; deleting root evidence without cascading invalidation is treated as an integrity failure.
3. **Intervention Before Action**: Behavioral dependence must be empirically testable before irrevocable operations take effect.
4. **Verifiable Ground Truth**: Every recovery claim must be mathematically compared against an immutable reference policy.
5. **Radical Auditability**: Every ingestion, risk assessment, replay test, and revocation must produce an immutable audit event.

## Accessibility & Inclusion

- High-contrast color choices meeting WCAG AA standards against deep dark backgrounds.
- Monospace font styling for identifiers, hashes, account numbers, and status badges to prevent transcription errors.
- Visual status indicators pairing distinct geometric glyphs and textual labels with color (not relying on color alone).

