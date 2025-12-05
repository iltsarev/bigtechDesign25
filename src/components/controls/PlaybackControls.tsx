import { useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  ChevronLeft,
  ChevronRight,
  Focus,
} from 'lucide-react'
import { useAnimationStore } from '../../stores/animationStore'
import { useScenarioStore } from '../../stores/scenarioStore'
import { Step } from '../../types'

// Извлечь протокол из payload или описания шага
const extractProtocol = (step: Step): string | null => {
  const payload = step.payload as Record<string, unknown> | undefined
  if (payload?.protocol) return String(payload.protocol)
  if (payload?.method) return String(payload.method)

  // Определяем по типу и контексту
  if (step.title.toLowerCase().includes('kafka')) return 'Kafka'
  if (step.title.toLowerCase().includes('grpc')) return 'gRPC'
  if (step.title.toLowerCase().includes('redis')) return 'Redis'
  if (step.title.toLowerCase().includes('db') || step.title.toLowerCase().includes('postgres')) return 'SQL'
  if (step.type === 'async') return 'Async'

  return 'HTTP'
}

export default function PlaybackControls() {
  const {
    playbackState,
    currentStepIndex,
    speed,
    autoFocusEnabled,
    particleProgress,
    play,
    pause,
    stop,
    stepForward,
    stepBackward,
    setStep,
    setSpeed,
    setActiveEdge,
    setActiveNodes,
    setParticleProgress,
    setCurrentStepInfo,
    updateNodeStats,
    markStepCompleted,
    toggleAutoFocus,
  } = useAnimationStore()

  const { getCurrentScenario, getCurrentStep, getTotalSteps } = useScenarioStore()
  const animationRef = useRef<number | null>(null)
  const progressRef = useRef(0)
  const resumeProgressRef = useRef(0)

  // Сохраняем progress при паузе для resume
  const prevPlaybackStateRef = useRef(playbackState)
  if (prevPlaybackStateRef.current === 'playing' && playbackState === 'paused') {
    // Запоминаем progress при паузе
    resumeProgressRef.current = particleProgress
  } else if (prevPlaybackStateRef.current !== 'playing' && playbackState === 'playing') {
    // При начале воспроизведения используем сохранённый progress (если есть)
    // или 0 для нового воспроизведения
  }
  prevPlaybackStateRef.current = playbackState

  const totalSteps = getTotalSteps()
  const currentStep = getCurrentStep(currentStepIndex)
  getCurrentScenario() // needed to trigger re-render when scenario changes

  // Animation loop
  useEffect(() => {
    if (playbackState !== 'playing') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const step = getCurrentStep(currentStepIndex)
    if (!step) {
      stop()
      return
    }

    // Set active edge and nodes (используем edgeId из step или fallback)
    const edgeId = step.edgeId || `e-${step.fromNode}-${step.toNode}`
    setActiveEdge(edgeId, step.reverse || false)
    setActiveNodes([step.fromNode, step.toNode])

    // Set step info for visualization (используем realLatency для отображения)
    const protocol = extractProtocol(step)
    setCurrentStepInfo(step.type, protocol, step.realLatency)

    const duration = step.duration / speed
    // При resume используем сохранённый progress, иначе начинаем с 0
    const initialProgress = resumeProgressRef.current > 0 && resumeProgressRef.current < 1
      ? resumeProgressRef.current
      : 0
    resumeProgressRef.current = 0 // Сбрасываем после использования
    const startTime = performance.now()
    progressRef.current = initialProgress

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(initialProgress + (elapsed / duration), 1)
      progressRef.current = progress
      setParticleProgress(progress)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Update node stats when step completes (используем realLatency)
        updateNodeStats(step.toNode, step.realLatency)
        markStepCompleted(currentStepIndex)

        // Move to next step
        if (currentStepIndex < totalSteps - 1) {
          stepForward()
        } else {
          stop()
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [playbackState, currentStepIndex, speed, totalSteps, getCurrentStep, setActiveEdge, setActiveNodes, setCurrentStepInfo, setParticleProgress, updateNodeStats, markStepCompleted, stepForward, stop])

  // Clear active state when stopped
  useEffect(() => {
    if (playbackState === 'idle') {
      setActiveEdge(null)
      setActiveNodes([])
      setParticleProgress(0)
      setCurrentStepInfo(null, null, null)
    }
  }, [playbackState, setActiveEdge, setActiveNodes, setParticleProgress, setCurrentStepInfo])

  const handleStepForward = () => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1
      const step = getCurrentStep(nextIndex)
      if (step) {
        resumeProgressRef.current = 0 // Сбрасываем при ручном переходе
        stepForward()
        const edgeId = step.edgeId || `e-${step.fromNode}-${step.toNode}`
        setActiveEdge(edgeId, step.reverse || false)
        setActiveNodes([step.fromNode, step.toNode])
        const protocol = extractProtocol(step)
        setCurrentStepInfo(step.type, protocol, step.realLatency)
      }
    }
  }

  const handleStepBackward = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1
      const step = getCurrentStep(prevIndex)
      if (step) {
        resumeProgressRef.current = 0 // Сбрасываем при ручном переходе
        stepBackward()
        const edgeId = step.edgeId || `e-${step.fromNode}-${step.toNode}`
        setActiveEdge(edgeId, step.reverse || false)
        setActiveNodes([step.fromNode, step.toNode])
        const protocol = extractProtocol(step)
        setCurrentStepInfo(step.type, protocol, step.realLatency)
      }
    }
  }

  const handleJumpToStart = () => {
    const step = getCurrentStep(0)
    if (step) {
      resumeProgressRef.current = 0 // Сбрасываем при ручном переходе
      setStep(0)
      const edgeId = step.edgeId || `e-${step.fromNode}-${step.toNode}`
      setActiveEdge(edgeId, step.reverse || false)
      setActiveNodes([step.fromNode, step.toNode])
      const protocol = extractProtocol(step)
      setCurrentStepInfo(step.type, protocol, step.realLatency)
    }
  }

  const handleJumpToEnd = () => {
    const lastIndex = totalSteps - 1
    if (lastIndex >= 0) {
      const step = getCurrentStep(lastIndex)
      if (step) {
        resumeProgressRef.current = 0 // Сбрасываем при ручном переходе
        setStep(lastIndex)
        const edgeId = step.edgeId || `e-${step.fromNode}-${step.toNode}`
        setActiveEdge(edgeId, step.reverse || false)
        setActiveNodes([step.fromNode, step.toNode])
        const protocol = extractProtocol(step)
        setCurrentStepInfo(step.type, protocol, step.realLatency)
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Playback</h3>
        <span className="text-sm text-gray-500">
          Step {currentStepIndex + 1} / {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={stop}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Stop"
        >
          <Square size={20} className="text-gray-600" />
        </button>

        <button
          onClick={handleJumpToStart}
          disabled={currentStepIndex === 0}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
          title="Jump to Start"
        >
          <SkipBack size={20} className="text-gray-600" />
        </button>

        <button
          onClick={handleStepBackward}
          disabled={currentStepIndex === 0}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
          title="Step Back"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        {playbackState === 'playing' ? (
          <button
            onClick={pause}
            className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
            title="Pause"
          >
            <Pause size={24} className="text-white" />
          </button>
        ) : (
          <button
            onClick={play}
            className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
            title="Play"
          >
            <Play size={24} className="text-white" />
          </button>
        )}

        <button
          onClick={handleStepForward}
          disabled={currentStepIndex >= totalSteps - 1}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
          title="Step Forward"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>

        <button
          onClick={handleJumpToEnd}
          disabled={currentStepIndex >= totalSteps - 1}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
          title="Jump to End"
        >
          <SkipForward size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Speed:</span>
        <div className="flex gap-1">
          {[0.25, 0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                speed === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Auto-focus toggle */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={toggleAutoFocus}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            autoFocusEnabled
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Auto-zoom to active nodes"
        >
          <Focus size={16} />
          Auto-Focus
        </button>
        <span className="text-xs text-gray-400">
          {autoFocusEnabled ? 'On' : 'Off'}
        </span>
      </div>

      {/* Current step info */}
      {currentStep && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-800 text-sm">
            {currentStep.title}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentStep.fromNode} → {currentStep.toNode}
          </div>
        </div>
      )}
    </div>
  )
}
