'use client';

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

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
      actionLabel: 'Inspect',
    },
    {
      num: 2,
      title: 'Ingest attack payload',
      desc: 'Untrusted invoice webhook injecting redirection directive.',
      isDone: hasAttackIngested,
      actionLabel: hasAttackIngested ? 'Ingested' : 'Run attack',
    },
    {
      num: 3,
      title: 'Derived belief',
      desc: 'Model extracts unverified first-party belief into memory.',
      isDone: hasAttackIngested,
      actionLabel: 'Inspect',
    },
    {
      num: 4,
      title: 'Interventional replay',
      desc: 'Compare baseline vs counterfactual decision to evaluate causal influence.',
      isDone: hasReplayRun,
      actionLabel: hasReplayRun ? 'Re-run replay' : 'Run replay',
    },
    {
      num: 5,
      title: 'Preview blast radius',
      desc: 'Trace all descendant memories and decisions that will be invalidated.',
      isDone: hasRevoked,
      actionLabel: 'Preview',
    },
    {
      num: 6,
      title: 'Revoke and re-decide',
      desc: 'Cascade deterministic invalidation and re-evaluate decision under clean policy.',
      isDone: hasRevoked,
      actionLabel: hasRevoked ? 'Revocation verified' : 'Revoke',
    },
  ];

  return (
    <aside
      className="w-[240px] shrink-0 flex flex-col border-r h-full overflow-y-auto"
      style={{
        background: 'var(--paper)',
        borderColor: 'var(--hairline)',
      }}
    >
      <div className="p-3.5 border-b border-[var(--hairline)]">
        <h2 className="text-xs font-semibold text-[var(--slate)] font-sans">
          Investigation sequence
        </h2>
        <p className="mt-1 text-[11px] text-[var(--slate)] leading-relaxed">
          Follow the 6 steps to trace and recover the agent.
        </p>
      </div>

      <div className="flex-1 p-2 space-y-1.5">
        {steps.map((step) => {
          const isActive = currentStep === step.num;
          return (
            <div
              key={step.num}
              onClick={() => onSelectStep(step.num)}
              className="p-2.5 rounded-[6px] border transition-colors cursor-pointer text-left"
              style={{
                borderColor: isActive ? 'var(--ink)' : 'transparent',
                background: isActive ? 'var(--chalk)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--ink)]">
                  {step.num}. {step.title}
                </span>
                {step.isDone && (
                  <span className="text-[var(--ink)]" title="Step completed">
                    <Check size={12} className="stroke-[2.5]" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-[var(--slate)] line-clamp-2 leading-snug">
                {step.desc}
              </p>

              {isActive && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    onExecuteStepAction(step.num);
                  }}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-medium rounded border transition-colors"
                  style={{
                    background: 'var(--ink)',
                    color: '#ffffff',
                    borderColor: 'var(--ink)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

