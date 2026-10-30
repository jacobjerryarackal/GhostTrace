'use client';

import React from 'react';
import { ArrowRight, Check, Play, Eye, RotateCcw } from 'lucide-react';

interface CaseRailProps {
  currentStep: number;
  onSelectStep: (stepNumber: number) => void;
  onExecuteStepAction: (stepNumber: number) => void;
  isLoading: boolean;
  hasAttackIngested: boolean;
  hasReplayRun: boolean;
  hasRevoked: boolean;
}

export function CaseRail({
  currentStep,
  onSelectStep,
  onExecuteStepAction,
  isLoading,
  hasAttackIngested,
  hasReplayRun,
  hasRevoked,
}: CaseRailProps) {
  const steps = [
    {
      num: 1,
      title: 'Baseline policy',
      desc: 'Corporate AP rule 4.1 routes $14,250 to verified treasury.',
      isDone: true,
      actionLabel: 'Inspect baseline',
      icon: <Eye size={12} />,
    },
    {
      num: 2,
      title: 'Ingest attack payload',
      desc: 'Untrusted invoice webhook injecting redirection directive.',
      isDone: hasAttackIngested,
      actionLabel: hasAttackIngested ? 'Ingested' : 'Run attack payload',
      icon: <Play size={12} />,
    },
    {
      num: 3,
      title: 'Derived belief',
      desc: 'Model extracts unverified first-party belief into memory.',
      isDone: hasAttackIngested,
      actionLabel: 'Inspect belief',
      icon: <Eye size={12} />,
    },
    {
      num: 4,
      title: 'Interventional replay',
      desc: 'Compare baseline vs counterfactual decision to evaluate causal influence.',
      isDone: hasReplayRun,
      actionLabel: hasReplayRun ? 'Re-run replay' : 'Run replay test',
      icon: <Play size={12} />,
    },
    {
      num: 5,
      title: 'Preview blast radius',
      desc: 'Trace all descendant memories and decisions that will be invalidated.',
      isDone: hasRevoked,
      actionLabel: 'Preview blast radius',
      icon: <Eye size={12} />,
    },
    {
      num: 6,
      title: 'Revoke and re-decide',
      desc: 'Cascade deterministic invalidation and re-evaluate decision under clean policy.',
      isDone: hasRevoked,
      actionLabel: hasRevoked ? 'Revocation verified' : 'Revoke node',
      icon: <RotateCcw size={12} />,
    },
  ];

  return (
    <aside
      className="w-[260px] shrink-0 flex flex-col border-r h-full overflow-y-auto"
      style={{
        background: 'var(--paper)',
        borderColor: 'var(--hairline)',
      }}
    >
      {/* Rail Header */}
      <div className="p-3.5 border-b border-[var(--hairline)]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[var(--ink)] font-sans tracking-tight">
            Investigation sequence
          </h2>
          <span className="font-mono text-[10px] text-[var(--slate)] bg-[var(--chalk)] px-1.5 py-0.5 rounded border border-[var(--hairline)]">
            Step {currentStep}/6
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[var(--slate)] leading-relaxed">
          Six-phase forensic protocol to trace, test, and excise tainted memory.
        </p>
      </div>

      {/* Step Sequence with Timeline Line */}
      <div className="flex-1 p-3 space-y-3 relative">
        {/* Continuous vertical timeline connector */}
        <div
          className="absolute left-[23px] top-6 bottom-8 w-[1.5px] bg-[var(--hairline)] pointer-events-none z-0"
          aria-hidden="true"
        />

        {steps.map((step) => {
          const isActive = currentStep === step.num;
          return (
            <div
              key={step.num}
              onClick={() => onSelectStep(step.num)}
              className="relative z-10 flex gap-2.5 p-2 rounded-[8px] transition-all cursor-pointer group text-left"
              style={{
                borderColor: isActive ? 'var(--ink)' : 'transparent',
                background: isActive ? 'var(--chalk)' : 'transparent',
              }}
            >
              {/* Step indicator node on timeline */}
              <div className="shrink-0 mt-0.5">
                {step.isDone ? (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{ background: 'var(--ink)' }}
                    title="Step verified"
                  >
                    <Check size={11} className="stroke-[2.5]" />
                  </div>
                ) : isActive ? (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center border-2"
                    style={{
                      background: 'var(--paper)',
                      borderColor: 'var(--uv)',
                      boxShadow: '0 0 0 3px var(--uv-wash)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--uv-deep)] animate-pulse" />
                  </div>
                ) : (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center border bg-[var(--chalk)] text-[var(--slate)] font-mono text-[10px]"
                    style={{ borderColor: 'var(--hairline)' }}
                  >
                    {step.num}
                  </div>
                )}
              </div>

              {/* Step body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold leading-tight ${
                      isActive ? 'text-[var(--ink)]' : 'text-[var(--slate)] group-hover:text-[var(--ink)]'
                    }`}
                  >
                    {step.num}. {step.title}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--slate)] leading-snug line-clamp-2">
                  {step.desc}
                </p>

                {/* Primary Step Action Button */}
                {isActive && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      onExecuteStepAction(step.num);
                    }}
                    className="btn-press mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-[11px] font-medium rounded border transition-all shadow-sm"
                    style={{
                      background: 'var(--ink)',
                      color: '#ffffff',
                      borderColor: 'var(--ink)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {step.icon}
                    <span>{step.actionLabel}</span>
                    <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
