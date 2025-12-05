import { create } from 'zustand'
import { PlaybackState, StepType } from '../types'

// Статистика для каждой ноды
export interface NodeStats {
  requestCount: number
  lastLatency: number | null
  totalLatency: number
  isProcessing: boolean
}

interface AnimationStore {
  playbackState: PlaybackState
  currentStepIndex: number
  speed: number
  activeEdgeId: string | null
  activeNodeIds: string[]
  particleProgress: number
  isReverse: boolean           // Направление анимации (true = от target к source)

  // Новые поля для улучшенной визуализации
  currentStepType: StepType | null
  currentProtocol: string | null
  currentDuration: number | null
  nodeStats: Record<string, NodeStats>
  completedSteps: number[]

  // Автофокус на активные ноды
  autoFocusEnabled: boolean

  play: () => void
  pause: () => void
  stop: () => void
  stepForward: () => void
  stepBackward: () => void
  setStep: (index: number) => void
  setSpeed: (speed: number) => void
  setActiveEdge: (edgeId: string | null, reverse?: boolean) => void
  setActiveNodes: (nodeIds: string[]) => void
  setParticleProgress: (progress: number) => void
  setCurrentStepInfo: (type: StepType | null, protocol: string | null, duration: number | null) => void
  updateNodeStats: (nodeId: string, latency: number) => void
  markStepCompleted: (stepIndex: number) => void
  toggleAutoFocus: () => void
  reset: () => void
}

export const useAnimationStore = create<AnimationStore>((set) => ({
  playbackState: 'idle',
  currentStepIndex: 0,
  speed: 0.5,
  activeEdgeId: null,
  activeNodeIds: [],
  particleProgress: 0,
  isReverse: false,
  currentStepType: null,
  currentProtocol: null,
  currentDuration: null,
  nodeStats: {},
  completedSteps: [],
  autoFocusEnabled: true,

  play: () => set({ playbackState: 'playing' }),
  pause: () => set({ playbackState: 'paused' }),
  stop: () => set({
    playbackState: 'idle',
    currentStepIndex: 0,
    particleProgress: 0,
    isReverse: false,
    nodeStats: {},
    completedSteps: [],
    currentStepType: null,
    currentProtocol: null,
    currentDuration: null,
  }),

  stepForward: () => set((state) => ({
    currentStepIndex: state.currentStepIndex + 1,
    particleProgress: 0
  })),

  stepBackward: () => set((state) => ({
    currentStepIndex: Math.max(0, state.currentStepIndex - 1),
    particleProgress: 0
  })),

  setStep: (index) => set({ currentStepIndex: index, particleProgress: 0 }),
  setSpeed: (speed) => set({ speed }),
  setActiveEdge: (edgeId, reverse = false) => set({ activeEdgeId: edgeId, isReverse: reverse }),
  setActiveNodes: (nodeIds) => set({ activeNodeIds: nodeIds }),
  setParticleProgress: (progress) => set({ particleProgress: progress }),

  setCurrentStepInfo: (type, protocol, duration) => set({
    currentStepType: type,
    currentProtocol: protocol,
    currentDuration: duration,
  }),

  updateNodeStats: (nodeId, latency) => set((state) => {
    const existing = state.nodeStats[nodeId] || {
      requestCount: 0,
      lastLatency: null,
      totalLatency: 0,
      isProcessing: false
    }
    return {
      nodeStats: {
        ...state.nodeStats,
        [nodeId]: {
          requestCount: existing.requestCount + 1,
          lastLatency: latency,
          totalLatency: existing.totalLatency + latency,
          isProcessing: false,
        }
      }
    }
  }),

  markStepCompleted: (stepIndex) => set((state) => ({
    completedSteps: [...state.completedSteps, stepIndex]
  })),

  toggleAutoFocus: () => set((state) => ({
    autoFocusEnabled: !state.autoFocusEnabled
  })),

  reset: () => set({
    playbackState: 'idle',
    currentStepIndex: 0,
    activeEdgeId: null,
    activeNodeIds: [],
    particleProgress: 0,
    isReverse: false,
    currentStepType: null,
    currentProtocol: null,
    currentDuration: null,
    nodeStats: {},
    completedSteps: [],
    // autoFocusEnabled не сбрасываем - это пользовательская настройка
  }),
}))
