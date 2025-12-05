import { useMemo, useRef, useEffect } from 'react'
import { useAnimationStore } from '../../stores/animationStore'
import { useScenarioStore } from '../../stores/scenarioStore'
import { StepType } from '../../types'
import { Clock, Zap, ArrowRight, ArrowLeft, Activity } from 'lucide-react'

// Цвета по типу шага
const stepTypeColors: Record<StepType, { bg: string; border: string; text: string }> = {
  request: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  response: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  async: { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
}

// Иконка по типу
const StepIcon = ({ type }: { type: StepType }) => {
  switch (type) {
    case 'request':
      return <ArrowRight size={10} />
    case 'response':
      return <ArrowLeft size={10} />
    case 'async':
      return <Zap size={10} />
  }
}

export default function TimelinePanel() {
  const currentStepIndex = useAnimationStore((s) => s.currentStepIndex)
  const completedSteps = useAnimationStore((s) => s.completedSteps)
  const { setStep, setActiveEdge, setActiveNodes, setCurrentStepInfo } = useAnimationStore()

  const { getCurrentScenario, getCurrentStep } = useScenarioStore()
  const scenario = getCurrentScenario()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const currentStepRef = useRef<HTMLDivElement>(null)

  // Скроллим к текущему шагу
  useEffect(() => {
    if (currentStepRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const element = currentStepRef.current
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()

      // Скроллим если элемент вне видимости
      if (elementRect.left < containerRect.left || elementRect.right > containerRect.right) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentStepIndex])

  // Рассчитываем timeline данные (используем realLatency для отображения)
  const timelineData = useMemo(() => {
    if (!scenario) return { steps: [], totalLatency: 0, maxLatency: 0 }

    let cumulativeTime = 0
    const maxLatency = Math.max(...scenario.steps.map(s => s.realLatency))

    const steps = scenario.steps.map((step, index) => {
      const startTime = cumulativeTime
      cumulativeTime += step.realLatency
      return {
        ...step,
        index,
        startTime,
        endTime: cumulativeTime,
        heightPercent: (step.realLatency / maxLatency) * 100,
      }
    })

    return { steps, totalLatency: cumulativeTime, maxLatency }
  }, [scenario])

  const handleStepClick = (index: number) => {
    const step = getCurrentStep(index)
    if (step) {
      setStep(index)
      setActiveEdge(`e-${step.fromNode}-${step.toNode}`)
      setActiveNodes([step.fromNode, step.toNode])
      setCurrentStepInfo(step.type, null, step.realLatency)
    }
  }

  if (!scenario || timelineData.steps.length === 0) {
    return null
  }

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Timeline</span>
          <span className="text-xs text-gray-400">
            ({timelineData.steps.length} steps, ~{Math.round(timelineData.totalLatency)}ms total)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px]">
          {Object.entries(stepTypeColors).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
              />
              <span className="text-gray-500 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline content */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-hidden px-4 py-3"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex items-end gap-1 min-w-max" style={{ height: '100px' }}>
          {timelineData.steps.map((step, index) => {
            const colors = stepTypeColors[step.type]
            const isActive = index === currentStepIndex
            const isCompleted = completedSteps.includes(index)
            const isPast = index < currentStepIndex

            // Высота пропорциональна реальной латентности (мин 25, макс 75)
            const minHeight = 25
            const maxHeight = 75
            const height = minHeight + (step.heightPercent / 100) * (maxHeight - minHeight)

            return (
              <div
                key={step.id}
                ref={isActive ? currentStepRef : undefined}
                onClick={() => handleStepClick(index)}
                className={`
                  relative flex flex-col cursor-pointer transition-all duration-200
                  hover:scale-105 hover:z-10
                  ${isActive ? 'scale-110 z-20' : ''}
                `}
                style={{ minWidth: '40px', maxWidth: '120px' }}
              >
                {/* Step bar */}
                <div
                  className="rounded-t-md flex items-center justify-center transition-all duration-300"
                  style={{
                    height: `${height}px`,
                    width: '100%',
                    minWidth: '36px',
                    backgroundColor: isCompleted || isPast ? colors.bg : isActive ? colors.bg : '#f3f4f6',
                    borderTop: `3px solid ${isActive ? colors.border : isCompleted || isPast ? colors.border : '#d1d5db'}`,
                    borderLeft: `1px solid ${isCompleted || isPast ? colors.border : '#e5e7eb'}`,
                    borderRight: `1px solid ${isCompleted || isPast ? colors.border : '#e5e7eb'}`,
                    opacity: isPast && !isActive ? 0.7 : 1,
                    boxShadow: isActive ? `0 0 0 2px ${colors.border}` : undefined,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center"
                    style={{ color: isCompleted || isPast || isActive ? colors.text : '#9ca3af' }}
                  >
                    <StepIcon type={step.type} />
                  </div>
                </div>

                {/* Latency label */}
                <div
                  className={`
                    text-center py-1 rounded-b-md text-[9px] font-medium
                    border-l border-r border-b
                  `}
                  style={{
                    backgroundColor: isActive ? colors.bg : '#f9fafb',
                    borderColor: isActive ? colors.border : '#e5e7eb',
                    color: isActive ? colors.text : '#6b7280',
                  }}
                >
                  {step.realLatency < 1 ? `${step.realLatency}ms` : `${Math.round(step.realLatency)}ms`}
                </div>

                {/* Step number indicator */}
                <div
                  className={`
                    absolute -top-5 left-1/2 -translate-x-1/2
                    w-4 h-4 rounded-full text-[8px] font-bold
                    flex items-center justify-center
                    transition-all duration-200
                  `}
                  style={{
                    backgroundColor: isActive ? colors.border : isCompleted || isPast ? colors.bg : '#e5e7eb',
                    color: isActive ? 'white' : isCompleted || isPast ? colors.text : '#9ca3af',
                    border: isActive ? 'none' : `1px solid ${isCompleted || isPast ? colors.border : '#d1d5db'}`,
                  }}
                >
                  {index + 1}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 pointer-events-none transition-opacity group-hover:opacity-100 z-30">
                  <div
                    className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap"
                  >
                    <div className="font-semibold">{step.title}</div>
                    <div className="text-gray-300">{step.fromNode} → {step.toNode}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Time scale */}
        <div className="flex items-center justify-between mt-2 text-[9px] text-gray-400 px-1">
          <span>0ms</span>
          <span className="flex items-center gap-1">
            <Activity size={10} />
            Current: ~{Math.round(timelineData.steps[currentStepIndex]?.startTime || 0)}ms
          </span>
          <span>~{Math.round(timelineData.totalLatency)}ms</span>
        </div>
      </div>
    </div>
  )
}
