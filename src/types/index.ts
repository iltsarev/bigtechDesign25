import { Node, Edge } from 'reactflow'

export type NodeType =
  | 'client'
  | 'dns'
  | 'cdn'
  | 'globalLb'
  | 'datacenter'
  | 'regionalLb'
  | 'apiGateway'
  | 'authService'
  | 'securityLayer'
  | 'containerOrchestration'
  | 'ingress'
  | 'service'
  | 'pod'
  | 'sidecar'
  | 'cache'
  | 'database'
  | 'messageQueue'

export type ViewLevel = 'global' | 'datacenter' | 'cluster'

export interface NodeData {
  label: string
  description: string
  technology?: string
  icon?: string
  isActive?: boolean
  viewLevel: ViewLevel
  parentId?: string
  dcId?: string
}

export type ArchNode = Node<NodeData>
export type ArchEdge = Edge

export type StepType = 'request' | 'response' | 'async'

export interface Step {
  id: string
  fromNode: string
  toNode: string
  edgeId: string             // ID edge для анимации
  reverse?: boolean          // true = анимация в обратном направлении (от target к source)
  type: StepType
  title: string
  description: string
  detailedInfo: string
  duration: number           // Длительность анимации (ms) - для плавного просмотра
  realLatency: number        // Реальная латентность операции (ms) - для отображения
  payload?: Record<string, unknown>
}

export interface Scenario {
  id: string
  name: string
  description: string
  steps: Step[]
  initialViewLevel: ViewLevel
}

export type PlaybackState = 'idle' | 'playing' | 'paused'

export interface AnimationState {
  playbackState: PlaybackState
  currentStepIndex: number
  speed: number
  activeEdgeId: string | null
  activeNodeId: string | null
  particleProgress: number
}

export interface NavigationState {
  viewLevel: ViewLevel
  focusedDcId: string | null
  focusedClusterId: string | null
}
