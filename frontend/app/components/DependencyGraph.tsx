import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  GitFork,
  Shield,
  AlertTriangle,
  XCircle,
  CheckCircle,
  ArrowRight,
  Eye,
  Trash2,
  Info,
  CornerDownRight,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
} from 'lucide-react';

export interface GraphNode {
  id: string;
  label: string;
  type: 'evidence' | 'memory' | 'decision';
  status: string;
  content: string;
  created_at: string;
  metadata: any;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface DependencyGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (node: GraphNode | null) => void;
  onRevokeTarget: (targetId: string) => void;
}

interface ComputedEdge {
  key: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  path: string;
  midX: number;
  midY: number;
  isActive: boolean;
  statusColor: string;
  markerId: string;
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onRevokeTarget,
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const nodeCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [svgDimensions, setSvgDimensions] = useState({ width: 900, height: 600 });
  const [computedEdges, setComputedEdges] = useState<ComputedEdge[]>([]);

  // Node Map for rapid lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const node of nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [nodes]);

  // Separate nodes into 3 architectural tiers
  const evidenceNodes = useMemo(() => nodes.filter((n) => n.type === 'evidence'), [nodes]);
  const memoryNodes = useMemo(() => nodes.filter((n) => n.type === 'memory'), [nodes]);
  const decisionNodes = useMemo(() => nodes.filter((n) => n.type === 'decision'), [nodes]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodeMap.get(selectedNodeId) || null : null),
    [selectedNodeId, nodeMap]
  );

  // Status Color Resolver
  const getStatusColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'trusted':
        return 'var(--color-trusted)';
      case 'quarantined':
        return 'var(--color-quarantined)';
      case 'revoked':
        return 'var(--color-revoked)';
      case 'invalidated':
        return 'var(--color-invalidated)';
      case 'clean_reference':
        return 'var(--color-reference)';
      default:
        return 'var(--text-secondary)';
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'trusted':
        return <span className="badge badge-trusted">Trusted</span>;
      case 'quarantined':
        return <span className="badge badge-quarantined">Quarantined</span>;
      case 'revoked':
        return <span className="badge badge-revoked">Revoked</span>;
      case 'invalidated':
        return <span className="badge badge-invalidated">Invalidated</span>;
      case 'clean_reference':
        return <span className="badge badge-reference">Clean Reference</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  }, []);

  // Compute upstream ancestors and downstream dependents via BFS
  const { upstreamNodeIds, downstreamNodeIds, activeEdgeKeys } = useMemo(() => {
    if (!selectedNodeId) {
      return {
        upstreamNodeIds: new Set<string>(),
        downstreamNodeIds: new Set<string>(),
        activeEdgeKeys: new Set<string>(),
      };
    }

    const upNodes = new Set<string>();
    const downNodes = new Set<string>();
    const activeEdges = new Set<string>();

    // Reverse adjacency: target -> sources
    const upAdj = new Map<string, string[]>();
    // Forward adjacency: source -> targets
    const downAdj = new Map<string, string[]>();

    for (const edge of edges) {
      if (!upAdj.has(edge.target)) upAdj.set(edge.target, []);
      upAdj.get(edge.target)!.push(edge.source);

      if (!downAdj.has(edge.source)) downAdj.set(edge.source, []);
      downAdj.get(edge.source)!.push(edge.target);
    }

    // Upstream BFS traversal (ancestors influencing selected node)
    const upQueue: string[] = [selectedNodeId];
    while (upQueue.length > 0) {
      const curr = upQueue.shift()!;
      const parents = upAdj.get(curr) || [];
      for (const parentId of parents) {
        activeEdges.add(`${parentId}->${curr}`);
        if (!upNodes.has(parentId)) {
          upNodes.add(parentId);
          upQueue.push(parentId);
        }
      }
    }

    // Downstream BFS traversal (dependents influenced by selected node)
    const downQueue: string[] = [selectedNodeId];
    while (downQueue.length > 0) {
      const curr = downQueue.shift()!;
      const children = downAdj.get(curr) || [];
      for (const childId of children) {
        activeEdges.add(`${curr}->${childId}`);
        if (!downNodes.has(childId)) {
          downNodes.add(childId);
          downQueue.push(childId);
        }
      }
    }

    return {
      upstreamNodeIds: upNodes,
      downstreamNodeIds: downNodes,
      activeEdgeKeys: activeEdges,
    };
  }, [selectedNodeId, edges]);

  // Compute precise SVG cubic Bézier connector paths
  const recomputeEdgePositions = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    // Synchronize SVG canvas bounds with container scroll space
    const canvasWidth = Math.max(container.scrollWidth, container.clientWidth);
    const canvasHeight = Math.max(container.scrollHeight, container.clientHeight);

    setSvgDimensions((prev) => {
      if (prev.width !== canvasWidth || prev.height !== canvasHeight) {
        return { width: canvasWidth, height: canvasHeight };
      }
      return prev;
    });

    const computed: ComputedEdge[] = [];

    for (const edge of edges) {
      const srcEl = nodeCardRefs.current.get(edge.source);
      const tgtEl = nodeCardRefs.current.get(edge.target);

      // Handle missing endpoints safely (Requirement 2)
      if (!srcEl || !tgtEl) continue;

      const srcRect = srcEl.getBoundingClientRect();
      const tgtRect = tgtEl.getBoundingClientRect();

      // Convert to container-relative coordinate system
      const srcX = srcRect.left - containerRect.left + scrollLeft;
      const srcY = srcRect.top - containerRect.top + scrollTop;
      const srcW = srcRect.width;
      const srcH = srcRect.height;

      const tgtX = tgtRect.left - containerRect.left + scrollLeft;
      const tgtY = tgtRect.top - containerRect.top + scrollTop;
      const tgtW = tgtRect.width;
      const tgtH = tgtRect.height;

      let x1 = 0;
      let y1 = 0;
      let x2 = 0;
      let y2 = 0;
      let pathString = '';
      let midX = 0;
      let midY = 0;

      if (tgtX > srcX + 30) {
        // Standard forward flow: right anchor of source to left anchor of target
        x1 = srcX + srcW;
        y1 = srcY + srcH / 2;
        x2 = tgtX;
        y2 = tgtY + tgtH / 2;

        const dx = Math.max((x2 - x1) * 0.45, 25);
        pathString = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        midX = (x1 + x2) / 2;
        midY = (y1 + y2) / 2;
      } else if (Math.abs(tgtX - srcX) <= 30) {
        // Same column flow (e.g. parent memory relationship)
        if (tgtY >= srcY) {
          x1 = srcX + srcW / 2;
          y1 = srcY + srcH;
          x2 = tgtX + tgtW / 2;
          y2 = tgtY;
          const dy = Math.max((y2 - y1) * 0.35, 15);
          pathString = `M ${x1} ${y1} C ${x1 + 35} ${y1 + dy}, ${x2 + 35} ${y2 - dy}, ${x2} ${y2}`;
          midX = (x1 + x2) / 2 + 35;
          midY = (y1 + y2) / 2;
        } else {
          x1 = srcX + srcW / 2;
          y1 = srcY;
          x2 = tgtX + tgtW / 2;
          y2 = tgtY + tgtH;
          const dy = Math.max((srcY - tgtY) * 0.35, 15);
          pathString = `M ${x1} ${y1} C ${x1 + 35} ${y1 - dy}, ${x2 + 35} ${y2 + dy}, ${x2} ${y2}`;
          midX = (x1 + x2) / 2 + 35;
          midY = (y1 + y2) / 2;
        }
      } else {
        // Reverse flow (target is left of source)
        x1 = srcX;
        y1 = srcY + srcH / 2;
        x2 = tgtX + tgtW;
        y2 = tgtY + tgtH / 2;

        const dx = Math.max((x1 - x2) * 0.45, 25);
        pathString = `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 + dx} ${y2}, ${x2} ${y2}`;
        midX = (x1 + x2) / 2;
        midY = (y1 + y2) / 2;
      }

      const edgeKey = `${edge.source}->${edge.target}`;
      const isActive = activeEdgeKeys.has(edgeKey);

      // Determine status color and marker
      const srcNode = nodeMap.get(edge.source);
      const tgtNode = nodeMap.get(edge.target);

      let statusColor = 'var(--color-cyan)';
      let markerId = 'gt-arrow-active';

      if (tgtNode?.status === 'revoked' || srcNode?.status === 'revoked') {
        statusColor = 'var(--color-revoked)';
        markerId = 'gt-arrow-revoked';
      } else if (tgtNode?.status === 'invalidated' || srcNode?.status === 'invalidated') {
        statusColor = 'var(--color-invalidated)';
        markerId = 'gt-arrow-invalidated';
      } else if (tgtNode?.status === 'quarantined' || srcNode?.status === 'quarantined') {
        statusColor = 'var(--color-quarantined)';
        markerId = 'gt-arrow-quarantined';
      } else if (tgtNode?.status === 'clean_reference' || srcNode?.status === 'clean_reference') {
        statusColor = 'var(--color-reference)';
        markerId = 'gt-arrow-reference';
      } else if (tgtNode?.status === 'trusted') {
        statusColor = 'var(--color-trusted)';
        markerId = 'gt-arrow-trusted';
      }

      computed.push({
        key: edgeKey,
        sourceId: edge.source,
        targetId: edge.target,
        relationship: edge.relationship,
        path: pathString,
        midX,
        midY,
        isActive,
        statusColor,
        markerId: isActive ? markerId : 'gt-arrow-default',
      });
    }

    setComputedEdges(computed);
  }, [edges, activeEdgeKeys, nodeMap]);

  // Keep connectors dynamically aligned during mounts, resizes, and content updates
  useEffect(() => {
    recomputeEdgePositions();

    const frameId = requestAnimationFrame(recomputeEdgePositions);
    const timer = setTimeout(recomputeEdgePositions, 60);

    const container = canvasContainerRef.current;
    let resizeObserver: ResizeObserver | null = null;

    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        recomputeEdgePositions();
      });
      resizeObserver.observe(container);
    }

    const handleWindowResize = () => {
      recomputeEdgePositions();
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [recomputeEdgePositions, nodes, edges, selectedNodeId]);

  // Keyboard accessibility: Escape to dismiss inspector selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNodeId) {
        onSelectNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, onSelectNode]);

  const isAnyNodeSelected = Boolean(selectedNodeId);

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        maxWidth: '100%',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <GitFork size={16} color="var(--color-cyan)" />
          <h2 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Provenance & Dependency Graph
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ({nodes.length} nodes, {edges.length} edges)
          </span>
          {isAnyNodeSelected && (
            <button
              onClick={() => onSelectNode(null)}
              className="btn btn-ghost"
              style={{
                fontSize: '0.72rem',
                padding: '0.15rem 0.5rem',
                height: 'auto',
                marginLeft: '0.4rem',
              }}
              title="Clear selection (Esc)"
            >
              Clear Selection ✕
            </button>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-trusted)' }}>
            ● Trusted
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-quarantined)' }}>
            ▲ Quarantined
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-revoked)' }}>
            ✕ Revoked
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-invalidated)' }}>
            ⊘ Invalidated
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-reference)' }}>
            ★ Clean Reference
          </span>
        </div>
      </div>

      {/* Empty State Banner if no edges exist (Requirement 7) */}
      {edges.length === 0 && (
        <div
          style={{
            margin: '0.65rem 1rem 0',
            padding: '0.6rem 0.9rem',
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px dashed var(--border-accent)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          <Info size={14} color="var(--color-cyan)" />
          <span>
            No active dependency edges recorded yet. Ingest evidence or trigger counterfactual replay to establish
            provenance connections.
          </span>
        </div>
      )}

      {/* Main Graph Area */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Scrollable Graph Canvas Workspace */}
        <div
          ref={canvasContainerRef}
          onScroll={recomputeEdgePositions}
          style={{
            flex: 1,
            position: 'relative',
            overflowX: 'auto',
            overflowY: 'auto',
            background: 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.45) 0%, rgba(8, 11, 17, 0.95) 100%)',
          }}
        >
          {/* SVG Connector Overlay (Requirement 1 & 6: behind cards, pointer-events none) */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${svgDimensions.width}px`,
              height: `${svgDimensions.height}px`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <defs>
              {/* Default Inactive Marker */}
              <marker
                id="gt-arrow-default"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(100, 116, 139, 0.45)" />
              </marker>

              {/* Active Cyan Marker */}
              <marker
                id="gt-arrow-active"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>

              {/* Trusted Green Marker */}
              <marker
                id="gt-arrow-trusted"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>

              {/* Quarantined Amber Marker */}
              <marker
                id="gt-arrow-quarantined"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
              </marker>

              {/* Revoked Crimson Marker */}
              <marker
                id="gt-arrow-revoked"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
              </marker>

              {/* Invalidated Pink Marker */}
              <marker
                id="gt-arrow-invalidated"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ec4899" />
              </marker>

              {/* Clean Reference Cyan Marker */}
              <marker
                id="gt-arrow-reference"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4" />
              </marker>

              {/* Active Path Glow Filter */}
              <filter id="gt-active-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.75" />
              </filter>
            </defs>

            {/* Render Connectors */}
            <g className="graph-connectors">
              {computedEdges.map((edge) => {
                const isEdgeActive = edge.isActive;
                const shouldDim = isAnyNodeSelected && !isEdgeActive;

                return (
                  <g key={edge.key}>
                    {/* Shadow / Glow layer for active path */}
                    {isEdgeActive && (
                      <path
                        d={edge.path}
                        fill="none"
                        stroke={edge.statusColor}
                        strokeWidth={5}
                        strokeOpacity={0.25}
                        strokeLinecap="round"
                      />
                    )}

                    {/* Main Bézier Connector Curve */}
                    <path
                      d={edge.path}
                      fill="none"
                      stroke={
                        isEdgeActive
                          ? edge.statusColor
                          : shouldDim
                          ? 'rgba(71, 85, 105, 0.15)'
                          : 'rgba(100, 116, 139, 0.38)'
                      }
                      strokeWidth={isEdgeActive ? 2.5 : 1.5}
                      strokeLinecap="round"
                      markerEnd={`url(#${edge.markerId})`}
                      className={isEdgeActive ? 'graph-edge-active' : ''}
                      style={{
                        transition: 'stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease',
                      }}
                    />

                    {/* Relationship Badge for active connections */}
                    {isEdgeActive && edge.midX > 0 && edge.midY > 0 && (
                      <g transform={`translate(${edge.midX}, ${edge.midY})`}>
                        <rect
                          x={-34}
                          y={-8}
                          width={68}
                          height={16}
                          rx={3}
                          fill="#0f172a"
                          stroke={edge.statusColor}
                          strokeWidth={1}
                          opacity={0.95}
                        />
                        <text
                          textAnchor="middle"
                          y={3.5}
                          fill={edge.statusColor}
                          fontSize="8.5"
                          fontFamily="var(--font-mono)"
                          fontWeight="700"
                          letterSpacing="0.02em"
                        >
                          {edge.relationship.replace('_', ' ')}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* 3 Tier Columns Layout (Requirement 1, 5, 6) */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(240px, 1fr))',
              gap: '2.5rem',
              padding: '1.5rem',
              minWidth: '760px',
            }}
          >
            {/* Column 1: Evidence Sources */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-cyan)',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>1. EVIDENCE SOURCES</span>
                <span style={{ color: 'var(--text-muted)' }}>{evidenceNodes.length}</span>
              </div>

              {evidenceNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isUpstream = upstreamNodeIds.has(node.id);
                const isDownstream = downstreamNodeIds.has(node.id);
                const isOnPath = isSelected || isUpstream || isDownstream;
                const shouldDim = isAnyNodeSelected && !isOnPath;
                const color = getStatusColor(node.status);

                return (
                  <div
                    key={node.id}
                    ref={(el) => {
                      if (el) nodeCardRefs.current.set(node.id, el);
                      else nodeCardRefs.current.delete(node.id);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`Evidence node ${node.id}, status: ${node.status}`}
                    onClick={() => onSelectNode(isSelected ? null : node)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectNode(isSelected ? null : node);
                      }
                    }}
                    className="graph-node-card"
                    style={{
                      background: isSelected
                        ? 'var(--bg-card-hover)'
                        : isOnPath
                        ? 'rgba(28, 37, 61, 0.95)'
                        : 'var(--bg-card)',
                      border: isSelected
                        ? '2px solid var(--color-cyan)'
                        : isOnPath
                        ? `2px solid ${color}`
                        : `1.5px solid ${color}`,
                      borderRadius: '6px',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? '0 0 16px rgba(56, 189, 248, 0.45)'
                        : isOnPath
                        ? '0 0 10px rgba(56, 189, 248, 0.2)'
                        : 'none',
                      opacity: shouldDim ? 0.32 : 1,
                      transform: isSelected ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#ffffff' }}>
                        [EV] {node.id}
                      </span>
                      {getStatusBadge(node.status)}
                    </div>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {node.content}
                    </p>
                    <div
                      style={{
                        marginTop: '0.5rem',
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>Src: {node.metadata?.source || 'unknown'}</span>
                      {isDownstream && (
                        <span style={{ color: 'var(--color-cyan)', fontSize: '0.65rem', fontWeight: '700' }}>
                          ↓ Dependent
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Column 2: Derived Memories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-cyan)',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>2. DERIVED MEMORIES</span>
                <span style={{ color: 'var(--text-muted)' }}>{memoryNodes.length}</span>
              </div>

              {memoryNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isUpstream = upstreamNodeIds.has(node.id);
                const isDownstream = downstreamNodeIds.has(node.id);
                const isOnPath = isSelected || isUpstream || isDownstream;
                const shouldDim = isAnyNodeSelected && !isOnPath;
                const color = getStatusColor(node.status);
                const isInvalid = node.status === 'invalidated' || node.status === 'revoked';

                return (
                  <div
                    key={node.id}
                    ref={(el) => {
                      if (el) nodeCardRefs.current.set(node.id, el);
                      else nodeCardRefs.current.delete(node.id);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`Memory node ${node.id}, status: ${node.status}`}
                    onClick={() => onSelectNode(isSelected ? null : node)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectNode(isSelected ? null : node);
                      }
                    }}
                    className="graph-node-card"
                    style={{
                      background: isSelected
                        ? 'var(--bg-card-hover)'
                        : isOnPath
                        ? 'rgba(28, 37, 61, 0.95)'
                        : 'var(--bg-card)',
                      border: isSelected
                        ? '2px solid var(--color-cyan)'
                        : isOnPath
                        ? `2px solid ${color}`
                        : `1.5px solid ${color}`,
                      borderRadius: '6px',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? '0 0 16px rgba(56, 189, 248, 0.45)'
                        : isOnPath
                        ? '0 0 10px rgba(56, 189, 248, 0.2)'
                        : 'none',
                      opacity: shouldDim ? 0.32 : isInvalid ? 0.7 : 1,
                      transform: isSelected ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          color: '#ffffff',
                          textDecoration: isInvalid ? 'line-through' : 'none',
                        }}
                      >
                        [MEM] {node.id}
                      </span>
                      {getStatusBadge(node.status)}
                    </div>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        textDecoration: isInvalid ? 'line-through' : 'none',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {node.content}
                    </p>
                    <div
                      style={{
                        marginTop: '0.45rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {node.metadata?.risk_score !== undefined ? (
                        <span style={{ color: node.metadata.risk_score > 0.35 ? '#fbbf24' : '#10b981' }}>
                          Risk: {node.metadata.risk_score.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Verified</span>
                      )}
                      {isUpstream && (
                        <span style={{ color: 'var(--color-cyan)', fontWeight: '700' }}>↑ Upstream</span>
                      )}
                      {isDownstream && (
                        <span style={{ color: 'var(--color-cyan)', fontWeight: '700' }}>↓ Dependent</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Column 3: Decision Outcomes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-cyan)',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>3. DECISION OUTCOMES</span>
                <span style={{ color: 'var(--text-muted)' }}>{decisionNodes.length}</span>
              </div>

              {decisionNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isUpstream = upstreamNodeIds.has(node.id);
                const isDownstream = downstreamNodeIds.has(node.id);
                const isOnPath = isSelected || isUpstream || isDownstream;
                const shouldDim = isAnyNodeSelected && !isOnPath;
                const isClean = node.metadata?.is_clean_reference;
                const color = isClean ? 'var(--color-reference)' : 'var(--color-trusted)';

                return (
                  <div
                    key={node.id}
                    ref={(el) => {
                      if (el) nodeCardRefs.current.set(node.id, el);
                      else nodeCardRefs.current.delete(node.id);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`Decision node ${node.id}, status: ${node.status}`}
                    onClick={() => onSelectNode(isSelected ? null : node)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectNode(isSelected ? null : node);
                      }
                    }}
                    className="graph-node-card"
                    style={{
                      background: isSelected
                        ? 'var(--bg-card-hover)'
                        : isOnPath
                        ? 'rgba(28, 37, 61, 0.95)'
                        : 'var(--bg-card)',
                      border: isSelected
                        ? '2px solid var(--color-cyan)'
                        : isOnPath
                        ? `2px solid ${color}`
                        : `1.5px solid ${color}`,
                      borderRadius: '6px',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? '0 0 16px rgba(56, 189, 248, 0.45)'
                        : isOnPath
                        ? '0 0 10px rgba(56, 189, 248, 0.2)'
                        : 'none',
                      opacity: shouldDim ? 0.32 : 1,
                      transform: isSelected ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#ffffff' }}>
                        [DEC] {node.id}
                      </span>
                      {getStatusBadge(node.status)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        color: isClean ? 'var(--color-reference)' : 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: '0.35rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      {node.metadata?.target_destination || node.label}
                    </div>
                    <p
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {node.metadata?.rationale || node.content}
                    </p>
                    <div
                      style={{
                        marginTop: '0.45rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>
                        {node.metadata?.amount ? `$${Number(node.metadata.amount).toLocaleString()}` : 'Protected Policy'}
                      </span>
                      {isUpstream && (
                        <span style={{ color: 'var(--color-cyan)', fontWeight: '700' }}>↑ Upstream</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Forensic Detail Drawer (Requirement 8: Preserved inspector behavior) */}
        {selectedNode && (
          <div
            className="forensic-inspector-drawer"
            style={{
              width: '330px',
              borderLeft: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Compass size={14} />
                <span>FORENSIC INSPECTOR</span>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                onClick={() => onSelectNode(null)}
                aria-label="Close inspector drawer"
              >
                ✕
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.id}
                </span>
                {getStatusBadge(selectedNode.status)}
              </div>
              <span className="badge" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                Type: {selectedNode.type.toUpperCase()}
              </span>
            </div>

            {/* Lineage Summary */}
            <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
                LINEAGE SUMMARY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ArrowUpRight size={12} color="var(--color-cyan)" />
                  <span style={{ color: 'var(--text-secondary)' }}>Upstream Roots:</span>
                  <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{upstreamNodeIds.size}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ArrowDownRight size={12} color="var(--color-cyan)" />
                  <span style={{ color: 'var(--text-secondary)' }}>Downstream Impacted:</span>
                  <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{downstreamNodeIds.size}</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                CONTENT PAYLOAD
              </div>
              <div
                style={{
                  background: 'var(--bg-primary)',
                  padding: '0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  lineHeight: 1.45,
                }}
              >
                {selectedNode.content}
              </div>
            </div>

            {selectedNode.metadata && (
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  METADATA & TRUST ATTRIBUTES
                </div>
                <pre
                  style={{
                    background: 'var(--bg-primary)',
                    padding: '0.65rem',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    border: '1px solid var(--border-subtle)',
                    overflowX: 'auto',
                    color: 'var(--text-secondary)',
                    maxHeight: '160px',
                  }}
                >
                  {JSON.stringify(selectedNode.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Direct Revocation Action */}
            {selectedNode.status !== 'revoked' && selectedNode.status !== 'invalidated' && (
              <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => onRevokeTarget(selectedNode.id)}
                >
                  <Trash2 size={14} />
                  <span>Revoke & Invalidate Dependents</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
