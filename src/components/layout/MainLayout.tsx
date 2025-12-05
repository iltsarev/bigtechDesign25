import { useState, useEffect } from 'react'
import FlowCanvas from '../flow/FlowCanvas'
import PlaybackControls from '../controls/PlaybackControls'
import ScenarioSelector from '../controls/ScenarioSelector'
import InfoPanel from '../panels/InfoPanel'
import LegendPanel from '../panels/LegendPanel'
import TimelinePanel from '../panels/TimelinePanel'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useAnimationStore } from '../../stores/animationStore'
import { useScenarioStore } from '../../stores/scenarioStore'

export default function MainLayout() {
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true)

  const {
    playbackState,
    currentStepIndex,
    play,
    pause,
    stepForward,
    stepBackward,
    setStep,
    setActiveEdge,
    setActiveNodes,
    setCurrentStepInfo,
  } = useAnimationStore()

  const { getCurrentStep, getTotalSteps } = useScenarioStore()
  const totalSteps = getTotalSteps()

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорируем если фокус в input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          if (currentStepIndex < totalSteps - 1) {
            const nextIndex = currentStepIndex + 1
            stepForward()
            const step = getCurrentStep(nextIndex)
            if (step) {
              setActiveEdge(`e-${step.fromNode}-${step.toNode}`)
              setActiveNodes([step.fromNode, step.toNode])
              setCurrentStepInfo(step.type, null, step.realLatency)
            }
          }
          break

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          if (currentStepIndex > 0) {
            const prevIndex = currentStepIndex - 1
            stepBackward()
            const step = getCurrentStep(prevIndex)
            if (step) {
              setActiveEdge(`e-${step.fromNode}-${step.toNode}`)
              setActiveNodes([step.fromNode, step.toNode])
              setCurrentStepInfo(step.type, null, step.realLatency)
            }
          }
          break

        case ' ': // Space
          e.preventDefault()
          if (playbackState === 'playing') {
            pause()
          } else {
            play()
          }
          break

        case 'Home':
          e.preventDefault()
          setStep(0)
          const firstStep = getCurrentStep(0)
          if (firstStep) {
            setActiveEdge(`e-${firstStep.fromNode}-${firstStep.toNode}`)
            setActiveNodes([firstStep.fromNode, firstStep.toNode])
            setCurrentStepInfo(firstStep.type, null, firstStep.realLatency)
          }
          break

        case 'End':
          e.preventDefault()
          const lastIndex = totalSteps - 1
          setStep(lastIndex)
          const lastStep = getCurrentStep(lastIndex)
          if (lastStep) {
            setActiveEdge(`e-${lastStep.fromNode}-${lastStep.toNode}`)
            setActiveNodes([lastStep.fromNode, lastStep.toNode])
            setCurrentStepInfo(lastStep.type, null, lastStep.realLatency)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStepIndex, totalSteps, playbackState, play, pause, stepForward, stepBackward, setStep, setActiveEdge, setActiveNodes, setCurrentStepInfo, getCurrentStep])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Distributed System Visualizer
            </h1>
            <p className="text-sm text-gray-500">
              Полная архитектура современного бекенда: от мобилки до БД и межсервисного взаимодействия
            </p>
          </div>

          {/* Legend + Keyboard hints */}
          <div className="flex items-center gap-4">
            {/* Type legend */}
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                Request
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                Response
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                Async
              </span>
            </div>

            {/* Keyboard hints */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400 border-l pl-4">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-gray-500">←→</kbd>
              <span>nav</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-gray-500">Space</kbd>
              <span>play</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-4">
            <ScenarioSelector />
            <PlaybackControls />
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 relative flex flex-col">
          <div className="flex-1">
            <FlowCanvas />
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="w-96 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-4">
            <InfoPanel />
            <LegendPanel />
          </div>
        </aside>
      </div>

      {/* Timeline Panel (Bottom) */}
      <div className="relative">
        {/* Toggle button */}
        <button
          onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
          className="absolute -top-8 left-1/2 -translate-x-1/2 z-10
                     bg-white border border-gray-200 rounded-t-lg px-4 py-1
                     flex items-center gap-1 text-xs text-gray-500
                     hover:bg-gray-50 transition-colors shadow-sm"
        >
          {isTimelineExpanded ? (
            <>
              <ChevronDown size={14} />
              Hide Timeline
            </>
          ) : (
            <>
              <ChevronUp size={14} />
              Show Timeline
            </>
          )}
        </button>

        {/* Timeline */}
        <div
          className={`
            transition-all duration-300 overflow-hidden
            ${isTimelineExpanded ? 'max-h-[180px]' : 'max-h-0'}
          `}
        >
          <TimelinePanel />
        </div>
      </div>
    </div>
  )
}
