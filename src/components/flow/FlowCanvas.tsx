import { useCallback, useMemo, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { nodeTypes } from './nodes'
import { edgeTypes } from './edges'
import { allNodes, allEdges } from '../../data/architecture'
import { useAnimationStore } from '../../stores/animationStore'
import { useNodeInfoStore } from '../../stores/nodeInfoStore'
import { NodeType } from '../../types'

// Компонент для автофокуса на активные ноды
function AutoFocusController() {
  const { fitView, getNodes } = useReactFlow()
  const activeNodeIds = useAnimationStore((s) => s.activeNodeIds)
  const autoFocusEnabled = useAnimationStore((s) => s.autoFocusEnabled)

  useEffect(() => {
    if (!autoFocusEnabled || activeNodeIds.length === 0) return

    // Небольшая задержка для плавности
    const timer = setTimeout(() => {
      const nodes = getNodes()
      const activeNodes = nodes.filter(n => activeNodeIds.includes(n.id))

      if (activeNodes.length > 0) {
        fitView({
          nodes: activeNodes,
          duration: 500,
          padding: 0.5,
          maxZoom: 1.2,
        })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [activeNodeIds, autoFocusEnabled, fitView, getNodes])

  return null
}

function FlowCanvasInner() {
  // Все ноды и edges сразу - плоская архитектура
  const initialNodes = useMemo(() => allNodes, [])
  const initialEdges = useMemo(() =>
    allEdges.map((edge) => ({ ...edge, type: 'animated' })),
    []
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const selectNode = useNodeInfoStore((s) => s.selectNode)

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    selectNode({
      id: node.id,
      type: node.type as NodeType,
      data: node.data,
    })
  }, [selectNode])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'animated',
        }}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls className="!bg-white !shadow-lg !rounded-lg !border !border-gray-200" />
        <MiniMap
          className="!bg-white !shadow-lg !rounded-lg !border !border-gray-200"
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              client: '#3B82F6',
              dns: '#8B5CF6',
              cdn: '#F59E0B',
              globalLb: '#10B981',
              datacenter: '#64748B',
              regionalLb: '#059669',
              apiGateway: '#6366F1',
              authService: '#14B8A6',
              rateLimiter: '#F97316',
              k8sCluster: '#3B82F6',
              service: '#EC4899',
              ingress: '#8B5CF6',
              pod: '#A855F7',
              sidecar: '#06B6D4',
              cache: '#EF4444',
              database: '#0EA5E9',
              messageQueue: '#F97316',
            }
            return colors[node.type || ''] || '#94a3b8'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <AutoFocusController />
      </ReactFlow>
    </div>
  )
}

// ReactFlowProvider уже есть в App.tsx
export default function FlowCanvas() {
  return <FlowCanvasInner />
}
