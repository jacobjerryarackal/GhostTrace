'use client';

import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export function StainEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isTainted = Boolean(data?.isContaminated);

  return (
    <>
      {isTainted && (
        <path
          d={edgePath}
          fill="none"
          stroke="var(--uv-wash)"
          strokeWidth={6}
          strokeLinecap="round"
          className="pointer-events-none opacity-60"
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={isTainted ? 'animate-stain-dash' : ''}
        style={{
          stroke: isTainted ? 'var(--uv)' : 'var(--hairline)',
          strokeWidth: isTainted ? 2 : 1.5,
          strokeDasharray: isTainted ? '6 4' : 'none',
          transition: 'stroke 0.25s ease, stroke-width 0.25s ease',
        }}
      />
    </>
  );
}
