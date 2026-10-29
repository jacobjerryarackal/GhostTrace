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
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isTainted ? 'var(--uv)' : 'var(--hairline)',
          strokeWidth: isTainted ? 2 : 1.5,
          strokeDasharray: isTainted ? '4 3' : 'none',
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
        }}
      />
    </>
  );
}

