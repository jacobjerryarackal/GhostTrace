'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';

import {
  fetchGraph,
  fetchScenario,
  fetchAudit,
  ingestEvidence,
  runReplay,
  executeRevoke,
  resetDemo,
} from '@/lib/api';
import {
  GraphNodeData,
  ScenarioData,
  ReplayData,
  AuditEventData,
} from '@/lib/types';
import { getLayoutedElements } from '@/lib/dagreLayout';

import { ReactFlowCanvas } from '../components/graph/ReactFlowCanvas';
import { CaseRail } from '../components/workspace/CaseRail';
import { GraphToolbar } from '../components/workspace/GraphToolbar';
import { Inspector } from '../components/workspace/Inspector';
import { ComparisonDrawer } from '../components/workspace/ComparisonDrawer';
import { RevokeDialog } from '../components/modals/RevokeDialog';
import { ResetDialog } from '../components/modals/ResetDialog';
import { IngestDialog } from '../components/modals/IngestDialog';
import { AskDialog } from '../components/modals/AskDialog';

export default function InvestigatePage() {
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [rawNodes, setRawNodes] = useState<GraphNodeData[]>([]);
  const [rawEdges, setRawEdges] = useState<{ source: string; target: string; relationship: string }[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEventData[]>([]);
  const [latestReplay, setLatestReplay] = useState<ReplayData | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'rail' | 'inspector'>('none');
  const [revokeSummary, setRevokeSummary] = useState<{
    revokedId: string;
    invalidatedCount: number;
    recoveryStatus: string;
    recoveredDestination: string;
  } | null>(null);

  // Dialog states
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isAskOpen, setIsAskOpen] = useState(false);

  // Load backend data and calculate layout
  const loadWorkspaceData = useCallback(async () => {
    try {
      const [scenData, graphData, auditData] = await Promise.all([
        fetchScenario().catch(() => null),
        fetchGraph().catch(() => ({ nodes: [], edges: [] })),
        fetchAudit(30).catch(() => []),
      ]);

      if (scenData) setScenario(scenData);
      if (auditData) setAuditEvents(auditData);

      const gNodes: GraphNodeData[] = graphData.nodes || [];
      const gEdges = graphData.edges || [];
      setRawNodes(gNodes);
      setRawEdges(gEdges);

      // Convert to React Flow node & edge structures
      const rfNodes: Node<GraphNodeData>[] = gNodes.map((n) => ({
        id: n.id,
        type: 'forensicNode',
        data: n,
        position: { x: 0, y: 0 },
      }));

      // Check which edges are contaminated (connected from suspect/quarantined nodes)
      const contaminatedSourceIds = new Set(
        gNodes.filter((n) => n.status === 'quarantined' || n.status === 'suspect').map((n) => n.id)
      );

      const rfEdges: Edge[] = gEdges.map((e, idx) => ({
        id: `e-${e.source}-${e.target}-${idx}`,
        source: e.source,
        target: e.target,
        type: 'stainEdge',
        data: {
          isContaminated: contaminatedSourceIds.has(e.source),
          relationship: e.relationship,
        },
      }));

      const layouted = getLayoutedElements(rfNodes, rfEdges, 'LR');
      setNodes(layouted.nodes);
      setEdges(layouted.edges);

      // Auto-select first node if none selected
      if (gNodes.length > 0 && !selectedNode) {
        setSelectedNode(gNodes[0]);
      } else if (selectedNode) {
        // Refresh selected node state
        const updated = gNodes.find((n) => n.id === selectedNode.id);
        if (updated) setSelectedNode(updated);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  }, [selectedNode, setNodes, setEdges]);

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // Compute upstream sources and downstream dependents for selected node
  const { upstreamIds, downstreamIds } = useMemo(() => {
    if (!selectedNode) return { upstreamIds: [], downstreamIds: [] };
    const up = rawEdges.filter((e) => e.target === selectedNode.id).map((e) => e.source);
    const down = rawEdges.filter((e) => e.source === selectedNode.id).map((e) => e.target);
    return { upstreamIds: up, downstreamIds: down };
  }, [selectedNode, rawEdges]);

  // Derived flags
  const suspectNodes = useMemo(() => {
    return rawNodes.filter((n) => n.status === 'quarantined' || n.status === 'suspect');
  }, [rawNodes]);

  const hasAttackIngested = useMemo(() => {
    return rawNodes.some((n) => n.id.startsWith('ev-') && n.id !== 'ev-seed-corp-policy');
  }, [rawNodes]);

  const hasRevoked = useMemo(() => {
    return rawNodes.some((n) => n.status === 'revoked' || n.status === 'invalidated');
  }, [rawNodes]);

  // Handler for triggering replay testing
  const handleRunReplay = async () => {
    if (suspectNodes.length === 0) return;
    setIsLoading(true);
    try {
      const suspectIds = suspectNodes.map((n) => n.id);
      const replay = await runReplay(suspectIds);
      setLatestReplay(replay);
      setCurrentStep(4);
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Replay test error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for confirmed revocation
  const handleConfirmRevoke = async (targetId: string) => {
    setIsRevoking(true);
    try {
      const res = await executeRevoke(targetId, 'Revoked via forensic workspace interface');
      setIsRevokeOpen(false);
      setRevokeTargetId(null);
      setCurrentStep(6);
      setRevokeSummary({
        revokedId: res.revoked_id,
        invalidatedCount: res.invalidated_memory_ids?.length || 0,
        recoveryStatus: res.clean_reference_comparison?.recovery_status || 'CLEAN_BASELINE_PRESERVED',
        recoveredDestination: res.clean_reference_comparison?.recovered_destination || 'US89-ACME-CORP-9876543210',
      });
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    } finally {
      setIsRevoking(false);
    }
  };

  // Handler for confirmed reset
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetDemo();
      setLatestReplay(null);
      setSelectedNode(null);
      setRevokeSummary(null);
      setCurrentStep(1);
      setIsResetOpen(false);
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Handler for case rail step execution
  const handleExecuteStepAction = async (stepNumber: number) => {
    setCurrentStep(stepNumber);

    if (stepNumber === 1) {
      const baseNode = rawNodes.find((n) => n.id === 'ev-seed-corp-policy');
      if (baseNode) setSelectedNode(baseNode);
    } else if (stepNumber === 2) {
      // Ingest attack payload if not yet ingested
      if (!hasAttackIngested && scenario?.sample_attack_payload) {
        setIsLoading(true);
        try {
          await ingestEvidence({
            source: scenario.sample_attack_payload.source,
            content: scenario.sample_attack_payload.content,
          });
          await loadWorkspaceData();
          setCurrentStep(3);
        } finally {
          setIsLoading(false);
        }
      } else {
        const attackEv = rawNodes.find((n) => n.id.startsWith('ev-') && n.id !== 'ev-seed-corp-policy');
        if (attackEv) setSelectedNode(attackEv);
      }
    } else if (stepNumber === 3) {
      const derivedMem = rawNodes.find((n) => n.type === 'memory' && n.status === 'quarantined');
      if (derivedMem) setSelectedNode(derivedMem);
    } else if (stepNumber === 4) {
      await handleRunReplay();
    } else if (stepNumber === 5) {
      const target = suspectNodes[0];
      if (target) {
        setRevokeTargetId(target.id);
        setIsRevokeOpen(true);
      }
    } else if (stepNumber === 6) {
      const target = suspectNodes[0];
      if (target) {
        setRevokeTargetId(target.id);
        setIsRevokeOpen(true);
      }
    }
  };

  // Export trace as markdown
  const handleExportTrace = () => {
    const lines = [
      '# GhostTrace Forensic Audit & Provenance Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Provenance Graph Nodes',
      ...rawNodes.map((n) => `- [${n.type.toUpperCase()}] **${n.id}** (${n.status}): ${n.content}`),
      '',
      '## Graph Dependencies',
      ...rawEdges.map((e) => `- ${e.source} --(${e.relationship})--> ${e.target}`),
      '',
    ];

    if (latestReplay) {
      lines.push(
        '## Interventional Replay Outcome',
        `- Behavioral Dependence: ${latestReplay.behavioral_dependence_detected}`,
        `- Removed Nodes: ${latestReplay.removed_ids.join(', ')}`,
        `- Baseline Destination: ${latestReplay.baseline_outcome.target_destination}`,
        `- Counterfactual Destination: ${latestReplay.counterfactual_outcome.target_destination}`,
        `- Assessment: ${latestReplay.consistency_assessment}`,
        ''
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghosttrace-audit-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[var(--chalk)]">
      {/* Action Toolbar */}
      <GraphToolbar
        onOpenIngest={() => setIsIngestOpen(true)}
        onOpenAsk={() => setIsAskOpen(true)}
        onRunReplay={handleRunReplay}
        onOpenReset={() => setIsResetOpen(true)}
        onExportTrace={handleExportTrace}
        isLoading={isLoading}
        hasSuspects={suspectNodes.length > 0}
      />

      {/* Revocation & Invalidation Outcome Banner */}
      {revokeSummary && (
        <div
          className="mx-3 my-2 p-2.5 rounded border text-xs flex items-center justify-between shrink-0 transition-all"
          style={{
            background: 'var(--paper)',
            borderColor: 'var(--ink)',
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[var(--ink)]">Revocation verified</span>
            <span className="text-[var(--slate)] font-mono text-[11px]">({revokeSummary.revokedId})</span>
            <span className="text-[var(--slate)]">·</span>
            <span className="text-[var(--slate)] font-medium">
              Derived memory invalidated ({revokeSummary.invalidatedCount} {revokeSummary.invalidatedCount === 1 ? 'record' : 'records'})
            </span>
            <span className="text-[var(--slate)]">·</span>
            <span className="text-[var(--ink)] font-semibold">
              {revokeSummary.recoveryStatus === 'RECOVERY_PROVED'
                ? 'Decision recovery demonstrated'
                : 'Clean baseline preserved'}
            </span>
            <span className="text-[var(--slate)] font-mono text-[11px]">
              → {revokeSummary.recoveredDestination}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRevokeSummary(null)}
            className="text-xs text-[var(--slate)] hover:text-[var(--ink)] px-1.5 py-0.5 ml-2 rounded hover:bg-[var(--chalk)]"
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile view toggles */}
      <div
        className="lg:hidden flex items-center justify-between px-3 py-1.5 border-b bg-[var(--paper)] text-xs shrink-0"
        style={{ borderColor: 'var(--hairline)' }}
      >
        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === 'rail' ? 'none' : 'rail')}
          className="px-2.5 py-1 rounded border text-[11px] font-medium"
          style={{ borderColor: 'var(--hairline)', background: mobileDrawer === 'rail' ? 'var(--chalk)' : 'transparent' }}
        >
          Steps (1-6) {mobileDrawer === 'rail' ? '▲' : '▼'}
        </button>
        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === 'inspector' ? 'none' : 'inspector')}
          className="px-2.5 py-1 rounded border text-[11px] font-medium"
          style={{ borderColor: 'var(--hairline)', background: mobileDrawer === 'inspector' ? 'var(--chalk)' : 'transparent' }}
        >
          Inspect {selectedNode ? `(${selectedNode.id})` : ''} {mobileDrawer === 'inspector' ? '▲' : '▼'}
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden relative">
        {/* Case Rail: desktop visible */}
        <div className="hidden lg:block h-full">
          <CaseRail
            currentStep={currentStep}
            onSelectStep={(num) => setCurrentStep(num)}
            onExecuteStepAction={handleExecuteStepAction}
            isLoading={isLoading}
            hasAttackIngested={hasAttackIngested}
            hasReplayRun={Boolean(latestReplay)}
            hasRevoked={hasRevoked}
          />
        </div>

        {/* Mobile Case Rail overlay drawer */}
        {mobileDrawer === 'rail' && (
          <div className="lg:hidden absolute inset-0 z-40 bg-black/30 backdrop-blur-sm flex">
            <div className="w-[260px] bg-[var(--paper)] h-full shadow-xl flex flex-col">
              <div className="flex justify-between items-center p-2.5 border-b border-[var(--hairline)]">
                <span className="text-xs font-semibold">Investigation steps</span>
                <button
                  onClick={() => setMobileDrawer('none')}
                  className="text-xs px-2 py-0.5 rounded border border-[var(--hairline)]"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <CaseRail
                  currentStep={currentStep}
                  onSelectStep={(num) => {
                    setCurrentStep(num);
                    setMobileDrawer('none');
                  }}
                  onExecuteStepAction={(num) => {
                    handleExecuteStepAction(num);
                    setMobileDrawer('none');
                  }}
                  isLoading={isLoading}
                  hasAttackIngested={hasAttackIngested}
                  hasReplayRun={Boolean(latestReplay)}
                  hasRevoked={hasRevoked}
                />
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileDrawer('none')} />
          </div>
        )}

        {/* Center Graph Canvas */}
        <main className="flex-1 h-full min-h-0 min-w-0 p-2 sm:p-2.5 overflow-hidden flex flex-col">
          <ReactFlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(node) => setSelectedNode(node)}
            selectedNodeId={selectedNode?.id || null}
          />
        </main>

        {/* Inspector: desktop visible */}
        <div className="hidden lg:block h-full">
          <Inspector
            selectedNode={selectedNode}
            upstreamIds={upstreamIds}
            downstreamIds={downstreamIds}
            onPreviewRevoke={(nodeId) => {
              setRevokeTargetId(nodeId);
              setIsRevokeOpen(true);
            }}
          />
        </div>

        {/* Mobile Inspector overlay drawer */}
        {mobileDrawer === 'inspector' && (
          <div className="lg:hidden absolute inset-0 z-40 bg-black/30 backdrop-blur-sm flex justify-end">
            <div className="flex-1" onClick={() => setMobileDrawer('none')} />
            <div className="w-[300px] bg-[var(--paper)] h-full shadow-xl flex flex-col">
              <div className="flex justify-between items-center p-2.5 border-b border-[var(--hairline)]">
                <span className="text-xs font-semibold">Node details</span>
                <button
                  onClick={() => setMobileDrawer('none')}
                  className="text-xs px-2 py-0.5 rounded border border-[var(--hairline)]"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Inspector
                  selectedNode={selectedNode}
                  upstreamIds={upstreamIds}
                  downstreamIds={downstreamIds}
                  onPreviewRevoke={(nodeId) => {
                    setRevokeTargetId(nodeId);
                    setIsRevokeOpen(true);
                    setMobileDrawer('none');
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Collapsible Drawer: Replay Comparison & Audit Trail */}
      <ComparisonDrawer
        latestReplay={latestReplay}
        cleanReference={scenario?.clean_reference}
        auditEvents={auditEvents}
        onRunReplay={handleRunReplay}
        isLoading={isLoading}
        hasSuspects={suspectNodes.length > 0}
      />

      {/* Modals */}
      <RevokeDialog
        isOpen={isRevokeOpen}
        targetId={revokeTargetId}
        onClose={() => {
          setIsRevokeOpen(false);
          setRevokeTargetId(null);
        }}
        onConfirmRevoke={handleConfirmRevoke}
        isRevoking={isRevoking}
      />

      <ResetDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirmReset={handleConfirmReset}
        isResetting={isResetting}
      />

      <IngestDialog
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onIngestComplete={loadWorkspaceData}
        samplePayload={scenario?.sample_attack_payload}
      />

      <AskDialog
        isOpen={isAskOpen}
        onClose={() => setIsAskOpen(false)}
        cleanDestination={scenario?.clean_reference?.approved_destination || 'US89-ACME-CORP-9876543210'}
      />
    </div>
  );
}
