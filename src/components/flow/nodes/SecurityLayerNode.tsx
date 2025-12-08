import { memo } from 'react'
import { NodeProps } from 'reactflow'
import { ShieldCheck } from 'lucide-react'
import { BaseNode } from './BaseNode'
import { NodeData } from '../../../types'

export const SecurityLayerNode = memo(({ id, data }: NodeProps<NodeData>) => {
  return (
    <BaseNode
      id={id}
      data={data}
      icon={<ShieldCheck size={20} />}
      color="#F97316"
    />
  )
})

SecurityLayerNode.displayName = 'SecurityLayerNode'
