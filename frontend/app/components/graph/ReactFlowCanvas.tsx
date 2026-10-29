'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  useReactFlow,
} from '@xyflow/react';

import { ForensicNode } from './ForensicNode';
import { StainEdge } from './StainEdge';
import { GraphNodeData } from '@/lib/types';

function FitViewTrigger({ nodesLength }: { nodesLength: number }) {
  const { fitView } = useReactFlow();

  React.useEffect(() => {
    if (nodesLength > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.25, duration: 250 });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [nodesLength, fitView]);

  return null;
}

interface ReactFlowCanvasProps {
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
  onNodesChange?: OnNodesChange<Node<GraphNodeData>>;
  onEdgesChange?: OnEdgesChange;
  onNodeClick: (node: GraphNodeData) => void;
  selectedNodeId: string | null;
}

export function ReactFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  selectedNodeId,
}: ReactFlowCanvasProps) {
  const nodeTypes = useMemo(() => ({ forensicNode: ForensicNode }), []);
  const edgeTypes = useMemo(() => ({ stainEdge: StainEdge }), []);

  // Update selection status on nodes
  const decoratedNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      selected: n.id === selectedNodeId,
    }));
  }, [nodes, selectedNodeId]);

  // Update edges with directional arrow markers
  const decoratedEdges = useMemo(() => {
    return edges.map((e) => {
      const isContaminated = Boolean(e.data?.isContaminated);
      return {
        ...e,
        type: 'stainEdge',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isContaminated ? '#6A38F5' : '#CBD2CC',
          width: 14,
          height: 14,
        },
      };
    });
  }, [edges]);

  if (nodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-[var(--slate)] border border-[var(--hairline)] rounded-[10px] bg-[var(--paper)]">
        <div>
          <p className="font-medium text-[var(--ink)]">No graph nodes available</p>
          <p className="mt-1 text-xs">Run the demo scenario or ingest evidence to populate provenance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-h-[300px] flex-1 bg-[var(--chalk)] border border-[var(--hairline)] rounded-[10px] overflow-hidden">
      <ReactFlow
        nodes={decoratedNodes}
        edges={decoratedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          const rawData = (node.data as any)?.data || node.data;
          onNodeClick(rawData);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#CBD2CC" />
        <FitViewTrigger nodesLength={nodes.length} />
        <Controls
          showInteractive={false}
          className="!bg-[var(--paper)] !border-[var(--hairline)] !shadow-none !rounded-[6px] !m-3"
        />
      </ReactFlow>
    </div>
  );
}

