import { create } from 'zustand'
import { NodeType, NodeData } from '../types'

interface SelectedNode {
  id: string
  type: NodeType
  data: NodeData
}

interface NodeInfoStore {
  selectedNode: SelectedNode | null
  selectNode: (node: SelectedNode) => void
  clearSelection: () => void
}

export const useNodeInfoStore = create<NodeInfoStore>((set) => ({
  selectedNode: null,

  selectNode: (node) => set({ selectedNode: node }),

  clearSelection: () => set({ selectedNode: null }),
}))
