'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FileText, Brain, Scale, RotateCcw, Check, Lock, ShieldAlert, ArrowRight } from 'lucide-react';

export function HeroGraph() {
  const shouldReduceMotion = useReducedMotion();
  const [animStage, setAnimStage] = useState<number>(shouldReduceMotion ? 4 : 0);
  const [isReplaying, setIsReplaying] = useState(false);

  // Auto-play sequence on mount if motion is enabled
  useEffect(() => {
    if (shouldReduceMotion) return;

    let timers: NodeJS.Timeout[] = [];
    const runSequence = () => {
      setAnimStage(0); // Clean state
      timers.push(setTimeout(() => setAnimStage(1), 1000));  // Evidence arrives (tainted)
      timers.push(setTimeout(() => setAnimStage(2), 2200));  // Stain spreads to memory
      timers.push(setTimeout(() => setAnimStage(3), 3400));  // Decision flips to bad account
      timers.push(setTimeout(() => setAnimStage(4), 5000));  // Revoke & Drain back to clean
    };

    runSequence();

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isReplaying, shouldReduceMotion]);

  const handleManualReplay = () => {
    setIsReplaying((prev) => !prev);
  };

  // Determine stage flags
  const isAttackActive = animStage >= 1 && animStage < 4;
  const isMemoryTainted = animStage >= 2 && animStage < 4;
  const isDecisionPoisoned = animStage === 3;
  const isDrained = animStage >= 4;

  const stageDescriptions = [
    'Stage 1 — Baseline policy: Ground-truth AP rule routes payment to verified treasury 4471-0092.',
    'Stage 2 — Untrusted input: Unverified phish email injects unauthorized remittance 8830-1175.',
    'Stage 3 — Synthesis hazard: Naive architectures store unverified facts into persistent memory.',
    'Stage 4 — Action divergence: Unscreened agent executes payment to unauthorized destination.',
    'Stage 5 — Invalidation: GhostTrace excises suspect belief and preserves verified baseline.',
  ];

  return (
    <div
      className="relative w-full rounded-[10px] border p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-sm"
      style={{
        background: 'var(--paper)',
        borderColor: 'var(--hairline)',
        minHeight: '380px',
      }}
    >
      {/* Top Header bar inside Hero Graph card */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)] text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[var(--ink)]">Conceptual governance lifecycle</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--hairline)] bg-[var(--chalk)] text-[var(--slate)] font-medium">
            Illustrative scenario · 7 nodes
          </span>
        </div>

        <button
          type="button"
          onClick={handleManualReplay}
          className="btn-press inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border rounded transition-all shadow-xs"
          style={{
            borderColor: 'var(--hairline)',
            background: 'var(--chalk)',
            color: 'var(--ink)',
            borderRadius: 'var(--radius-sm)',
          }}
          title="Re-run illustrative sequence"
        >
          <RotateCcw size={11} className={isReplaying ? 'rotate-180 transition-transform duration-300' : ''} />
          <span>Replay sequence</span>
        </button>
      </div>

      {/* SVG Container for Connectors and Nodes */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="relative w-[620px] mx-auto my-3 flex items-center justify-between" style={{ height: '230px' }}>
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 620 230"
          >
            <defs>
              <marker
                id="arrow-ink"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#111714" />
              </marker>
              <marker
                id="arrow-uv"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#6A38F5" />
              </marker>
              <marker
                id="arrow-hairline"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#CBD2CC" />
              </marker>
            </defs>

            {/* Clean Path 1: ev-policy -> mem-clean */}
            <path
              d="M 170 48 C 195 48, 195 48, 220 48"
              fill="none"
              stroke="#111714"
              strokeWidth="1.5"
              markerEnd="url(#arrow-ink)"
            />

            {/* Clean Path 2: mem-clean -> dec-payout */}
            <path
              d="M 400 48 C 425 48, 425 115, 450 115"
              fill="none"
              stroke="#111714"
              strokeWidth="1.5"
              markerEnd="url(#arrow-ink)"
            />

            {/* Benign Path 1: ev-benign -> mem-benign */}
            <path
              d="M 170 182 C 195 182, 195 182, 220 182"
              fill="none"
              stroke="#CBD2CC"
              strokeWidth="1.5"
              markerEnd="url(#arrow-hairline)"
            />

            {/* Attack Path 1: ev-email -> mem-derived */}
            <motion.path
              d="M 170 115 C 195 115, 195 115, 220 115"
              fill="none"
              stroke={isAttackActive ? '#6A38F5' : '#CBD2CC'}
              strokeWidth={isAttackActive ? 2 : 1.5}
              strokeDasharray={isAttackActive ? '6 4' : 'none'}
              markerEnd={isAttackActive ? 'url(#arrow-uv)' : 'url(#arrow-hairline)'}
              className={isAttackActive ? 'animate-stain-dash' : ''}
              animate={{
                stroke: isAttackActive ? '#6A38F5' : '#CBD2CC',
                strokeWidth: isAttackActive ? 2 : 1.5,
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* Attack Path 2: mem-derived -> dec-payout */}
            <motion.path
              d="M 400 115 C 425 115, 425 115, 450 115"
              fill="none"
              stroke={isMemoryTainted ? '#6A38F5' : '#CBD2CC'}
              strokeWidth={isMemoryTainted ? 2 : 1.5}
              strokeDasharray={isMemoryTainted ? '6 4' : 'none'}
              markerEnd={isMemoryTainted ? 'url(#arrow-uv)' : 'url(#arrow-hairline)'}
              className={isMemoryTainted ? 'animate-stain-dash' : ''}
              animate={{
                stroke: isMemoryTainted ? '#6A38F5' : '#CBD2CC',
                strokeWidth: isMemoryTainted ? 2 : 1.5,
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>

          {/* Node Layout: Exact 3 Columns */}
          <div className="w-full flex items-center justify-between text-[11px] relative z-10">
            {/* Column 1: Evidence Tiers (width: 170px) */}
            <div className="w-[170px] flex flex-col gap-2.5">
              {/* 1. Policy Evidence (Clean) */}
              <div
                className="p-2.5 rounded-[6px] border bg-[var(--surface-raised)] text-[var(--ink)] border-[var(--ink)] shadow-xs"
              >
                <div className="flex items-center justify-between font-mono text-[10px] pb-1 border-b border-[var(--hairline)]">
                  <span className="flex items-center gap-1 font-sans font-semibold">
                    <FileText size={10} /> Policy 4.1
                  </span>
                  <span className="flex items-center gap-0.5 text-[var(--ink)] font-medium">
                    <Check size={9} className="stroke-[2.5]" /> Clean
                  </span>
                </div>
                <p className="mt-1 text-[10px] truncate text-[var(--slate)]">
                  Payee updates need approval.
                </p>
              </div>

              {/* 2. Untrusted Email (Attack / Drain) */}
              <motion.div
                animate={{
                  background: isAttackActive ? '#ECE6FE' : isDrained ? 'transparent' : 'var(--surface-raised)',
                  borderColor: isAttackActive ? '#6A38F5' : '#CBD2CC',
                  color: isDrained ? '#55625C' : '#111714',
                }}
                transition={{ duration: 0.28 }}
                className={`p-2.5 rounded-[6px] border text-[var(--ink)] shadow-xs ${
                  isDrained ? 'line-through opacity-70' : ''
                }`}
                style={{
                  borderStyle: isAttackActive ? 'dashed' : 'solid',
                  borderWidth: isAttackActive ? '1.5px' : '1px',
                }}
              >
                <div className="flex items-center justify-between font-mono text-[10px] pb-1 border-b border-inherit">
                  <span className="flex items-center gap-1 font-sans font-semibold">
                    <FileText size={10} /> Phish email
                  </span>
                  <span className="flex items-center gap-0.5 text-[9px] font-sans font-medium">
                    {isAttackActive ? (
                      <span className="text-[var(--uv-deep)] flex items-center gap-0.5">
                        <Lock size={9} /> Suspect
                      </span>
                    ) : isDrained ? (
                      <span>✕ Revoked</span>
                    ) : (
                      <span className="text-[var(--slate)]">Untrusted</span>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-[10px] truncate font-mono">
                  Remit to 8830-1175
                </p>
              </motion.div>

              {/* 3. Benign Untrusted Evidence */}
              <div
                className="p-2.5 rounded-[6px] border bg-[var(--surface-raised)] text-[var(--slate)] border-[var(--hairline)]"
              >
                <div className="flex items-center justify-between font-mono text-[10px] pb-1 border-b border-[var(--hairline)]">
                  <span className="flex items-center gap-1 font-sans font-medium">
                    <FileText size={10} /> Web notice
                  </span>
                  <span className="text-[9px] font-sans font-medium">Untrusted</span>
                </div>
                <p className="mt-1 text-[10px] truncate">
                  Support: 09:00–17:00 UTC
                </p>
              </div>
            </div>

            {/* Column 2: Derived Memories (width: 180px) */}
            <div className="w-[180px] flex flex-col gap-2.5">
              {/* 4. Trusted Memory */}
              <div
                className="p-2.5 rounded-[6px] border bg-[var(--surface-raised)] text-[var(--ink)] border-[var(--ink)] shadow-xs"
              >
                <div className="flex items-center justify-between font-mono text-[10px] pb-1 border-b border-[var(--hairline)]">
                  <span className="flex items-center gap-1 font-sans font-semibold">
                    <Brain size={10} /> Halcyon AP
                  </span>
                  <span className="flex items-center gap-0.5 text-[var(--ink)] font-medium">
                    <Check size={9} className="stroke-[2.5]" /> Verified
                  </span>
                </div>
                <p className="mt-1 text-[10px] truncate font-mono">
                  Payee is 4471-0092
                </p>
              </div>

              {/* 5. Contaminated Derived Memory */}
              <motion.div
                animate={{
                  background: isMemoryTainted ? '#6A38F5' : isDrained ? 'transparent' : 'var(--surface-raised)',
                  borderColor: isMemoryTainted ? '#4A1FD1' : '#CBD2CC',
                  color: isMemoryTainted ? '#ffffff' : isDrained ? '#55625C' : '#111714',
                }}
                transition={{ duration: 0.28 }}
                className={`p-2.5 rounded-[6px] border shadow-xs ${isDrained ? 'line-through opacity-70' : ''}`}
                style={{
                  borderStyle: isAttackActive ? 'dashed' : 'solid',
                  borderWidth: isAttackActive ? '1.5px' : '1px',
                }}
              >
                <div className="flex items-center justify-between font-mono text-[10px] pb-1 border-b border-inherit">
                  <span className="flex items-center gap-1 font-sans font-semibold">
                    <Brain size={10} /> Laundered
                  </span>
                  <span className="flex items-center gap-0.5 text-[9px] font-sans font-medium">
                    {isMemoryTainted ? (
                      <span className="text-white flex items-center gap-0.5">
                        <ShieldAlert size={9} /> Contaminated
                      </span>
                    ) : isDrained ? (
                      <span>✕ Invalidated</span>
                    ) : (
                      <span className="text-[var(--slate)]">Quarantined</span>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-[10px] truncate font-mono">
                  Now use 8830-1175
                </p>
              </motion.div>

              {/* 6. Benign Memory */}
              <div
                className="p-2.5 rounded-[6px] border bg-[var(--surface-raised)] text-[var(--slate)] border-[var(--hairline)]"
              >
                <div className="flex items-center justify-between font-mono text-[10px] pb-1 border-b border-[var(--hairline)]">
                  <span className="flex items-center gap-1 font-sans font-medium">
                    <Brain size={10} /> Profile
                  </span>
                  <span className="text-[9px] font-sans font-medium">Harmless</span>
                </div>
                <p className="mt-1 text-[10px] line-clamp-1">
                  Hours: 09:00–17:00
                </p>
              </div>
            </div>

            {/* Column 3: Decision Outcome (width: 170px) */}
            <div className="w-[170px] flex flex-col justify-center">
              {/* 7. Decision Node */}
              <motion.div
                animate={{
                  background: isDecisionPoisoned ? '#ECE6FE' : 'var(--surface-raised)',
                  borderColor: isDecisionPoisoned ? '#6A38F5' : 'var(--ink)',
                }}
                transition={{ duration: 0.24 }}
                className="p-3 rounded-[6px] border text-[var(--ink)] shadow-xs"
                style={{
                  borderWidth: isDecisionPoisoned ? '1.5px' : '1px',
                }}
              >
                <div className="flex items-center justify-between font-mono text-[10px] pb-1 border-b border-[var(--hairline)]">
                  <span className="flex items-center gap-1 font-sans font-bold">
                    <Scale size={11} /> INV-2291
                  </span>
                  <span className="font-sans text-[10px]">
                    {isDecisionPoisoned ? (
                      <span className="text-[var(--uv-deep)] font-semibold">Poisoned</span>
                    ) : (
                      <span className="text-[var(--ink)] font-semibold flex items-center gap-0.5">
                        <Check size={9} className="stroke-[2.5]" /> Verified
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-2 font-mono text-[10px]">
                  <span className="text-[var(--slate)]">Pay $14,250 to:</span>
                  <div
                    className="font-bold text-xs mt-0.5 font-mono"
                    style={{
                      color: isDecisionPoisoned ? 'var(--uv-deep)' : 'var(--ink)',
                    }}
                  >
                    {isDecisionPoisoned ? '8830-1175' : '4471-0092'}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status line & interactive stage pills */}
      <div className="pt-3 border-t border-[var(--hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[var(--slate)]">
        <div className="font-medium">
          {stageDescriptions[animStage]}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {[0, 1, 2, 3, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setAnimStage(s)}
              className="w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] transition-all"
              style={{
                background: animStage === s ? 'var(--ink)' : 'var(--chalk)',
                color: animStage === s ? '#ffffff' : 'var(--slate)',
                border: '1px solid var(--hairline)',
              }}
              title={`Jump to step ${s + 1}`}
            >
              {s + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
