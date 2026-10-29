import React from 'react';

export default function BenchmarkPage() {
  return (
    <div className="mx-auto max-w-[1200px] w-full px-6 py-8">
      <h1 className="text-2xl font-bold font-display tracking-tight text-[var(--ink)]">
        Benchmark evaluation suite
      </h1>
      <p className="mt-2 text-sm text-[var(--slate)]">
        Reproducible 12-scenario evaluation comparing naive memory against GhostTrace governance.
      </p>
    </div>
  );
}

