import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-[1200px] w-full px-6 py-16 flex flex-col items-start gap-8">
      <div className="max-w-[720px]">
        <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-[var(--ink)] leading-[1.05]">
          Deleting a bad memory doesn&apos;t undo what it taught your agent.
        </h1>
        <p className="mt-4 text-lg text-[var(--slate)] leading-relaxed">
          GhostTrace provides behavioral dependency testing, explicit provenance tracking, and cascading DAG invalidation for autonomous AI agents.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/investigate"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded transition-colors text-white"
          style={{
            background: 'var(--ink)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Run the attack
        </Link>
        <Link
          href="/method"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border rounded transition-colors"
          style={{
            borderColor: 'var(--hairline)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Read the method
        </Link>
      </div>
    </div>
  );
}
