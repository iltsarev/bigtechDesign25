import {
  Smartphone,
  Globe,
  Zap,
  GitBranch,
  Building2,
  Router,
  Shield,
  ShieldCheck,
  Container,
  Boxes,
  Box,
  Network,
  Database,
  HardDrive,
  MessageSquare,
} from 'lucide-react'

const legendItems = [
  { icon: Smartphone, label: 'Client', color: '#3B82F6' },
  { icon: Globe, label: 'DNS', color: '#8B5CF6' },
  { icon: Zap, label: 'CDN / Edge', color: '#F59E0B' },
  { icon: GitBranch, label: 'Load Balancer', color: '#10B981' },
  { icon: Building2, label: 'Data Center', color: '#64748B' },
  { icon: Router, label: 'API Gateway', color: '#6366F1' },
  { icon: Shield, label: 'Auth Service', color: '#14B8A6' },
  { icon: ShieldCheck, label: 'Security Layer', color: '#F97316' },
  { icon: Container, label: 'Compute Cluster', color: '#3B82F6' },
  { icon: Boxes, label: 'Service', color: '#EC4899' },
  { icon: Box, label: 'Pod', color: '#A855F7' },
  { icon: Network, label: 'Sidecar Proxy', color: '#06B6D4' },
  { icon: Database, label: 'Cache', color: '#EF4444' },
  { icon: HardDrive, label: 'Database', color: '#0EA5E9' },
  { icon: MessageSquare, label: 'Message Queue', color: '#F97316' },
]

export default function LegendPanel() {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-700 mb-3">Legend</h3>
      <div className="grid grid-cols-2 gap-2">
        {legendItems.map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="p-1.5 rounded"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Icon size={14} />
            </div>
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
