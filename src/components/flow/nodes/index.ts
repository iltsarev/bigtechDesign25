import { NodeTypes } from 'reactflow'
import { ClientNode } from './ClientNode'
import { DNSNode } from './DNSNode'
import { CDNNode } from './CDNNode'
import { GlobalLbNode, RegionalLbNode } from './LoadBalancerNode'
import { DataCenterNode } from './DataCenterNode'
import { ApiGatewayNode } from './ApiGatewayNode'
import { AuthServiceNode } from './AuthServiceNode'
import { SecurityLayerNode } from './SecurityLayerNode'
import { ContainerOrchestrationNode } from './ContainerOrchestrationNode'
import { ServiceNode, IngressNode } from './ServiceNode'
import { PodNode } from './PodNode'
import { SidecarNode } from './SidecarNode'
import { CacheNode } from './CacheNode'
import { DatabaseNode } from './DatabaseNode'
import { MessageQueueNode } from './MessageQueueNode'

export const nodeTypes: NodeTypes = {
  client: ClientNode,
  dns: DNSNode,
  cdn: CDNNode,
  globalLb: GlobalLbNode,
  regionalLb: RegionalLbNode,
  datacenter: DataCenterNode,
  apiGateway: ApiGatewayNode,
  authService: AuthServiceNode,
  securityLayer: SecurityLayerNode,
  containerOrchestration: ContainerOrchestrationNode,
  service: ServiceNode,
  ingress: IngressNode,
  pod: PodNode,
  sidecar: SidecarNode,
  cache: CacheNode,
  database: DatabaseNode,
  messageQueue: MessageQueueNode,
}
