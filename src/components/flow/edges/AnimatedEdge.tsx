import { memo, useMemo, useRef } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'
import { useAnimationStore } from '../../../stores/animationStore'
import { StepType } from '../../../types'

// Конфигурация цветов по типу запроса
const stepTypeConfig: Record<StepType, {
  color: string
  bgColor: string
  glowColor: string
  icon: string
  dashSpeed: number
}> = {
  request: {
    color: '#3b82f6',      // синий
    bgColor: '#dbeafe',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    icon: '→',
    dashSpeed: 0.4,
  },
  response: {
    color: '#22c55e',      // зелёный
    bgColor: '#dcfce7',
    glowColor: 'rgba(34, 197, 94, 0.6)',
    icon: '←',
    dashSpeed: 0.3,
  },
  async: {
    color: '#f97316',      // оранжевый
    bgColor: '#fed7aa',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    icon: '⚡',
    dashSpeed: 0.6,
  },
}

// Получить цвет по латентности
const getLatencyColor = (duration: number | null): string => {
  if (!duration) return '#94a3b8'
  if (duration <= 50) return '#22c55e'   // зелёный - быстро
  if (duration <= 200) return '#eab308'  // жёлтый - средне
  if (duration <= 500) return '#f97316'  // оранжевый - медленно
  return '#ef4444'                        // красный - очень медленно
}

const AnimatedEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const pathRef = useRef<SVGPathElement>(null)
  const activeEdgeId = useAnimationStore((s) => s.activeEdgeId)
  const particleProgress = useAnimationStore((s) => s.particleProgress)
  const currentStepType = useAnimationStore((s) => s.currentStepType)
  const currentProtocol = useAnimationStore((s) => s.currentProtocol)
  const currentDuration = useAnimationStore((s) => s.currentDuration)
  const isActive = activeEdgeId === id

  const config = currentStepType ? stepTypeConfig[currentStepType] : stepTypeConfig.request
  const latencyColor = getLatencyColor(currentDuration)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Вычисляем позиции для trail эффекта (5 точек с затуханием)
  const trailPositions = useMemo(() => {
    if (!isActive || particleProgress <= 0 || !pathRef.current) return []

    const positions = []
    const trailLength = 5
    const trailSpacing = 0.06
    const pathLength = pathRef.current.getTotalLength()

    for (let i = 0; i < trailLength; i++) {
      const progress = particleProgress - (i * trailSpacing)
      if (progress > 0 && progress < 1) {
        const point = pathRef.current.getPointAtLength(progress * pathLength)
        positions.push({
          x: point.x,
          y: point.y,
          opacity: 1 - (i * 0.2),
          scale: 1 - (i * 0.15),
        })
      }
    }
    return positions
  }, [isActive, particleProgress])

  // Основная позиция частицы на кривой Безье
  const particlePosition = useMemo(() => {
    if (!pathRef.current || particleProgress <= 0 || particleProgress >= 1) return null
    const pathLength = pathRef.current.getTotalLength()
    const point = pathRef.current.getPointAtLength(particleProgress * pathLength)
    return { x: point.x, y: point.y }
  }, [particleProgress])

  return (
    <>
      {/* Background edge - цвет по латентности когда активно */}
      <path
        ref={pathRef}
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          ...style,
          stroke: isActive ? latencyColor : '#94a3b8',
          strokeWidth: isActive ? 3 : 2,
          transition: 'stroke 0.3s, stroke-width 0.3s',
          filter: isActive ? `drop-shadow(0 0 4px ${config.glowColor})` : 'none',
        }}
        markerEnd={markerEnd}
      />

      {/* Animated dashed line when active - цвет по типу */}
      {isActive && (
        <path
          d={edgePath}
          style={{
            fill: 'none',
            stroke: config.color,
            strokeWidth: 3,
            strokeDasharray: currentStepType === 'async' ? '5,10' : '10,5',
            animation: `dash ${config.dashSpeed}s linear infinite`,
          }}
        />
      )}

      {/* Trail effect - затухающий хвост */}
      {isActive && trailPositions.map((pos, i) => (
        <EdgeLabelRenderer key={`trail-${i}`}>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${pos.scale})`,
              pointerEvents: 'none',
              opacity: pos.opacity * 0.6,
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: 12,
                height: 12,
                backgroundColor: config.color,
                boxShadow: `0 0 8px ${config.glowColor}`,
              }}
            />
          </div>
        </EdgeLabelRenderer>
      ))}

      {/* Main Particle (flying request) */}
      {isActive && particlePosition && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${particlePosition.x}px, ${particlePosition.y}px)`,
              pointerEvents: 'none',
            }}
            className="request-particle"
          >
            {/* Внешнее свечение */}
            <div
              className="absolute -inset-2 rounded-full animate-ping"
              style={{
                backgroundColor: config.color,
                opacity: 0.3,
              }}
            />
            {/* Основная частица */}
            <div
              className="relative rounded-full flex items-center justify-center"
              style={{
                width: 20,
                height: 20,
                backgroundColor: config.color,
                boxShadow: `0 0 12px ${config.glowColor}, 0 0 24px ${config.glowColor}`,
              }}
            >
              <span className="text-white text-xs font-bold">{config.icon}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Protocol label at midpoint when active */}
      {isActive && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 20}px)`,
              pointerEvents: 'none',
            }}
          >
            <div
              className="px-2 py-1 text-xs font-bold rounded shadow-lg flex items-center gap-1"
              style={{
                backgroundColor: config.bgColor,
                color: config.color,
                border: `1px solid ${config.color}`,
              }}
            >
              {currentProtocol && (
                <span className="opacity-80">{currentProtocol}</span>
              )}
              {currentDuration !== null && (
                <span className="text-[10px] opacity-70">
                  {currentDuration < 1 ? `${currentDuration}ms` : `~${Math.round(currentDuration)}ms`}
                </span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})

AnimatedEdge.displayName = 'AnimatedEdge'

export default AnimatedEdge
