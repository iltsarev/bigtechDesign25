import { ArchNode, ArchEdge } from '../types'

// Полная архитектура с несколькими ДЦ
// Layout: Client → Internet → [DC Europe (primary)] + [DC US, DC Asia (replicas)]
// Увеличенные расстояния между элементами

export const allNodes: ArchNode[] = [
  // ============ КЛИЕНТ ============
  {
    id: 'client',
    type: 'client',
    position: { x: 0, y: 600 },
    data: {
      label: 'Mobile App',
      description: 'Клиент — точка входа пользователя в систему',
      technology: 'iOS/Android',
      viewLevel: 'global',
    },
  },

  // ============ ИНТЕРНЕТ СЛОЙ ============
  {
    id: 'dns',
    type: 'dns',
    position: { x: 250, y: 500 },
    data: {
      label: 'DNS',
      description: 'Service Discovery — разрешение доменных имён с геобалансировкой',
      technology: 'Route 53',
      viewLevel: 'global',
    },
  },
  {
    id: 'cdn',
    type: 'cdn',
    position: { x: 500, y: 600 },
    data: {
      label: 'CDN / Edge',
      description: 'Edge Computing — кэширование контента ближе к пользователю',
      technology: 'CloudFlare',
      viewLevel: 'global',
    },
  },
  {
    id: 'global-lb',
    type: 'globalLb',
    position: { x: 750, y: 600 },
    data: {
      label: 'Global LB',
      description: 'Global Load Balancer — распределение трафика между ДЦ',
      technology: 'Anycast',
      viewLevel: 'global',
    },
  },

  // ============ DC EUROPE (PRIMARY) - верхняя часть ============
  {
    id: 'dc-eu',
    type: 'datacenter',
    position: { x: 1000, y: 50 },
    data: {
      label: 'DC Europe',
      description: 'Data Center — физический кластер серверов (Primary)',
      technology: 'AWS eu-central-1',
      viewLevel: 'global',
    },
  },
  {
    id: 'dc-eu-lb',
    type: 'regionalLb',
    position: { x: 1250, y: 50 },
    data: {
      label: 'Regional LB',
      description: 'Load Balancer L4/L7 — балансировка + rate limiting',
      technology: 'HAProxy',
      viewLevel: 'datacenter',
    },
  },
  {
    id: 'dc-eu-gw',
    type: 'apiGateway',
    position: { x: 1500, y: 50 },
    data: {
      label: 'API Gateway',
      description: 'API Gateway — единая точка входа, auth, routing',
      technology: 'Kong',
      viewLevel: 'datacenter',
    },
  },
  {
    id: 'dc-eu-auth',
    type: 'authService',
    position: { x: 1500, y: -100 },
    data: {
      label: 'Auth Service',
      description: 'Identity Provider — auth + token blacklist (in-memory TTL)',
      technology: 'OAuth 2.0 / JWT',
      viewLevel: 'datacenter',
    },
  },
  {
    id: 'dc-eu-ingress',
    type: 'ingress',
    position: { x: 1750, y: 50 },
    data: {
      label: 'Internal Router',
      description: 'L7 Router — маршрутизация к сервисам внутри кластера',
      technology: 'e.g. Envoy, NGINX',
      viewLevel: 'cluster',
    },
  },
  // EU Services (Groups with Pods inside)
  {
    id: 'dc-eu-user-svc',
    type: 'serviceGroup',
    position: { x: 2020, y: -140 },
    data: {
      label: 'User Service',
      description: 'Microservice — бизнес-логика пользователей',
      technology: 'Go / gRPC',
      viewLevel: 'cluster',
      width: 260,
      height: 110,
    },
  },
  {
    id: 'dc-eu-user-pod',
    type: 'pod',
    position: { x: 15, y: 35 },
    parentNode: 'dc-eu-user-svc',
    extent: 'parent',
    data: {
      label: 'User Pod',
      description: 'Pod с Sidecar',
      technology: 'Go',
      viewLevel: 'cluster',
      parentId: 'dc-eu-user-svc',
    },
  },
  {
    id: 'dc-eu-user-pod-2',
    type: 'pod',
    position: { x: 135, y: 35 },
    parentNode: 'dc-eu-user-svc',
    extent: 'parent',
    data: {
      label: 'User Pod',
      description: 'Pod с Sidecar (replica)',
      technology: 'Go',
      viewLevel: 'cluster',
      parentId: 'dc-eu-user-svc',
    },
  },
  {
    id: 'dc-eu-order-svc',
    type: 'serviceGroup',
    position: { x: 2020, y: 20 },
    data: {
      label: 'Order Service',
      description: 'Microservice — SAGA orchestrator',
      technology: 'Java / Spring',
      viewLevel: 'cluster',
      width: 260,
      height: 110,
    },
  },
  {
    id: 'dc-eu-order-pod',
    type: 'pod',
    position: { x: 15, y: 35 },
    parentNode: 'dc-eu-order-svc',
    extent: 'parent',
    data: {
      label: 'Order Pod',
      description: 'Pod с Sidecar',
      technology: 'Java',
      viewLevel: 'cluster',
      parentId: 'dc-eu-order-svc',
    },
  },
  {
    id: 'dc-eu-order-pod-2',
    type: 'pod',
    position: { x: 135, y: 35 },
    parentNode: 'dc-eu-order-svc',
    extent: 'parent',
    data: {
      label: 'Order Pod',
      description: 'Pod с Sidecar (replica)',
      technology: 'Java',
      viewLevel: 'cluster',
      parentId: 'dc-eu-order-svc',
    },
  },
  {
    id: 'dc-eu-payment-svc',
    type: 'serviceGroup',
    position: { x: 2020, y: 180 },
    data: {
      label: 'Payment Service',
      description: 'Microservice — платежи',
      technology: 'Node.js',
      viewLevel: 'cluster',
      width: 260,
      height: 110,
    },
  },
  {
    id: 'dc-eu-payment-pod',
    type: 'pod',
    position: { x: 15, y: 35 },
    parentNode: 'dc-eu-payment-svc',
    extent: 'parent',
    data: {
      label: 'Payment Pod',
      description: 'Pod с Sidecar',
      technology: 'Node.js',
      viewLevel: 'cluster',
      parentId: 'dc-eu-payment-svc',
    },
  },
  {
    id: 'dc-eu-payment-pod-2',
    type: 'pod',
    position: { x: 135, y: 35 },
    parentNode: 'dc-eu-payment-svc',
    extent: 'parent',
    data: {
      label: 'Payment Pod',
      description: 'Pod с Sidecar (replica)',
      technology: 'Node.js',
      viewLevel: 'cluster',
      parentId: 'dc-eu-payment-svc',
    },
  },
  {
    id: 'dc-eu-inventory-svc',
    type: 'serviceGroup',
    position: { x: 2020, y: 340 },
    data: {
      label: 'Inventory Service',
      description: 'Microservice — склад',
      technology: 'Python / FastAPI',
      viewLevel: 'cluster',
      width: 260,
      height: 110,
    },
  },
  {
    id: 'dc-eu-inventory-pod',
    type: 'pod',
    position: { x: 15, y: 35 },
    parentNode: 'dc-eu-inventory-svc',
    extent: 'parent',
    data: {
      label: 'Inventory Pod',
      description: 'Pod с Sidecar',
      technology: 'Python',
      viewLevel: 'cluster',
      parentId: 'dc-eu-inventory-svc',
    },
  },
  {
    id: 'dc-eu-inventory-pod-2',
    type: 'pod',
    position: { x: 135, y: 35 },
    parentNode: 'dc-eu-inventory-svc',
    extent: 'parent',
    data: {
      label: 'Inventory Pod',
      description: 'Pod с Sidecar (replica)',
      technology: 'Python',
      viewLevel: 'cluster',
      parentId: 'dc-eu-inventory-svc',
    },
  },
  // EU Storage - Database per Service
  {
    id: 'dc-eu-user-db',
    type: 'database',
    position: { x: 2300, y: -120 },
    data: {
      label: 'User DB',
      description: 'Database per Service — изолированная БД',
      technology: 'e.g. PostgreSQL',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-order-db',
    type: 'database',
    position: { x: 2300, y: 40 },
    data: {
      label: 'Order DB',
      description: 'Database per Service — изолированная БД',
      technology: 'e.g. Spanner',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-payment-db',
    type: 'database',
    position: { x: 2300, y: 200 },
    data: {
      label: 'Payment DB',
      description: 'Database per Service — изолированная БД',
      technology: 'e.g. PostgreSQL',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-inventory-db',
    type: 'database',
    position: { x: 2300, y: 360 },
    data: {
      label: 'Inventory DB',
      description: 'Database per Service — изолированная БД',
      technology: 'e.g. PostgreSQL',
      viewLevel: 'cluster',
    },
  },
  // EU Cache
  {
    id: 'dc-eu-cache',
    type: 'cache',
    position: { x: 2550, y: 500 },
    data: {
      label: 'Distributed Cache',
      description: 'Distributed Cache — кэширование + Rate Limit counters',
      technology: 'e.g. Redis, Memcached',
      viewLevel: 'cluster',
    },
  },
  // EU Event Bus (includes Schema Registry + DLQ internally)
  {
    id: 'dc-eu-kafka',
    type: 'messageQueue',
    position: { x: 2800, y: 180 },
    data: {
      label: 'Event Bus',
      description: 'Event Streaming + Schema Registry + DLQ внутри',
      technology: 'e.g. Kafka, Wormhole',
      viewLevel: 'cluster',
    },
  },
  // EU Security Layer (WAF + Rate Limiter with in-memory counters)
  {
    id: 'dc-eu-ratelimit',
    type: 'securityLayer',
    position: { x: 1250, y: 180 },
    data: {
      label: 'Security Layer',
      description: 'WAF + Rate Limiting (in-memory sliding window)',
      technology: 'WAF + Token Bucket',
      viewLevel: 'datacenter',
    },
  },
  // EU Observability Stack
  {
    id: 'dc-eu-prometheus',
    type: 'service',
    position: { x: 2800, y: -120 },
    data: {
      label: 'Metrics Collector',
      description: 'Metrics Collection — сбор метрик со всех сервисов',
      technology: 'e.g. Prometheus, Monarch',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-jaeger',
    type: 'service',
    position: { x: 2800, y: 450 },
    data: {
      label: 'Distributed Tracing',
      description: 'Distributed Tracing — отслеживание запросов через систему',
      technology: 'e.g. Jaeger, Dapper',
      viewLevel: 'cluster',
    },
  },
  // Service Mesh Control Plane
  {
    id: 'dc-eu-istiod',
    type: 'service',
    position: { x: 1750, y: 260 },
    data: {
      label: 'Mesh Control Plane',
      description: 'Service Mesh Control Plane — управление sidecar proxies',
      technology: 'e.g. Istio, Linkerd',
      viewLevel: 'cluster',
    },
  },

  // ============ DC US-EAST (REPLICA) - средняя часть ============
  {
    id: 'dc-us',
    type: 'datacenter',
    position: { x: 1000, y: 700 },
    data: {
      label: 'DC US-East',
      description: 'Data Center — реплика для снижения latency в US',
      technology: 'AWS us-east-1',
      viewLevel: 'global',
    },
  },
  {
    id: 'dc-us-lb',
    type: 'regionalLb',
    position: { x: 1250, y: 700 },
    data: {
      label: 'Regional LB',
      description: 'Load Balancer L4/L7 — балансировка + rate limiting',
      technology: 'HAProxy',
      viewLevel: 'datacenter',
    },
  },
  {
    id: 'dc-us-gw',
    type: 'apiGateway',
    position: { x: 1500, y: 700 },
    data: {
      label: 'API Gateway',
      description: 'API Gateway — единая точка входа',
      technology: 'Kong',
      viewLevel: 'datacenter',
    },
  },
  {
    id: 'dc-us-ingress',
    type: 'ingress',
    position: { x: 1750, y: 700 },
    data: {
      label: 'Internal Router',
      description: 'L7 Router — маршрутизация к сервисам внутри кластера',
      technology: 'e.g. Envoy, NGINX',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-us-order-svc',
    type: 'serviceGroup',
    position: { x: 2020, y: 620 },
    data: {
      label: 'Order Service',
      description: 'Read Replica — только чтение',
      technology: 'Java / Spring',
      viewLevel: 'cluster',
      width: 260,
      height: 110,
    },
  },
  {
    id: 'dc-us-order-pod',
    type: 'pod',
    position: { x: 15, y: 35 },
    parentNode: 'dc-us-order-svc',
    extent: 'parent',
    data: {
      label: 'Order Pod',
      description: 'Pod с Sidecar',
      technology: 'Java',
      viewLevel: 'cluster',
      parentId: 'dc-us-order-svc',
    },
  },
  {
    id: 'dc-us-order-pod-2',
    type: 'pod',
    position: { x: 135, y: 35 },
    parentNode: 'dc-us-order-svc',
    extent: 'parent',
    data: {
      label: 'Order Pod',
      description: 'Pod с Sidecar (replica)',
      technology: 'Java',
      viewLevel: 'cluster',
      parentId: 'dc-us-order-svc',
    },
  },
  {
    id: 'dc-us-user-svc',
    type: 'serviceGroup',
    position: { x: 2020, y: 780 },
    data: {
      label: 'User Service',
      description: 'Read Replica — только чтение',
      technology: 'Go / gRPC',
      viewLevel: 'cluster',
      width: 260,
      height: 110,
    },
  },
  {
    id: 'dc-us-user-pod',
    type: 'pod',
    position: { x: 15, y: 35 },
    parentNode: 'dc-us-user-svc',
    extent: 'parent',
    data: {
      label: 'User Pod',
      description: 'Pod с Sidecar',
      technology: 'Go',
      viewLevel: 'cluster',
      parentId: 'dc-us-user-svc',
    },
  },
  {
    id: 'dc-us-user-pod-2',
    type: 'pod',
    position: { x: 135, y: 35 },
    parentNode: 'dc-us-user-svc',
    extent: 'parent',
    data: {
      label: 'User Pod',
      description: 'Pod с Sidecar (replica)',
      technology: 'Go',
      viewLevel: 'cluster',
      parentId: 'dc-us-user-svc',
    },
  },
  {
    id: 'dc-us-cache',
    type: 'cache',
    position: { x: 2550, y: 680 },
    data: {
      label: 'Local Cache',
      description: 'Cache-Aside — локальный кэш для снижения latency',
      technology: 'e.g. Redis, Memcached',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-us-db',
    type: 'database',
    position: { x: 2550, y: 820 },
    data: {
      label: 'Read Replica',
      description: 'Read Replica — только чтение, async replication',
      technology: 'e.g. PostgreSQL replica',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-us-cdc',
    type: 'service',
    position: { x: 2550, y: 960 },
    data: {
      label: 'CDC Consumer',
      description: 'Change Data Capture — применяет события к локальной БД',
      technology: 'Debezium Consumer',
      viewLevel: 'cluster',
    },
  },

  // ============ DC ASIA (REPLICA) - нижняя часть ============
  {
    id: 'dc-asia',
    type: 'datacenter',
    position: { x: 1000, y: 1200 },
    data: {
      label: 'DC Asia',
      description: 'Data Center — реплика для снижения latency в Asia',
      technology: 'AWS ap-southeast-1',
      viewLevel: 'global',
    },
  },
  {
    id: 'dc-asia-lb',
    type: 'regionalLb',
    position: { x: 1250, y: 1200 },
    data: {
      label: 'Regional LB',
      description: 'Load Balancer L4/L7 — балансировка + rate limiting',
      technology: 'HAProxy',
      viewLevel: 'datacenter',
    },
  },
  {
    id: 'dc-asia-gw',
    type: 'apiGateway',
    position: { x: 1500, y: 1200 },
    data: {
      label: 'API Gateway',
      description: 'API Gateway — единая точка входа',
      technology: 'Kong',
      viewLevel: 'datacenter',
    },
  },
  {
    id: 'dc-asia-ingress',
    type: 'ingress',
    position: { x: 1750, y: 1200 },
    data: {
      label: 'Internal Router',
      description: 'L7 Router — маршрутизация к сервисам внутри кластера',
      technology: 'e.g. Envoy, NGINX',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-asia-order-svc',
    type: 'serviceGroup',
    position: { x: 2020, y: 1120 },
    data: {
      label: 'Order Service',
      description: 'Read Replica — только чтение',
      technology: 'Java / Spring',
      viewLevel: 'cluster',
      width: 260,
      height: 110,
    },
  },
  {
    id: 'dc-asia-order-pod',
    type: 'pod',
    position: { x: 15, y: 35 },
    parentNode: 'dc-asia-order-svc',
    extent: 'parent',
    data: {
      label: 'Order Pod',
      description: 'Pod с Sidecar',
      technology: 'Java',
      viewLevel: 'cluster',
      parentId: 'dc-asia-order-svc',
    },
  },
  {
    id: 'dc-asia-order-pod-2',
    type: 'pod',
    position: { x: 135, y: 35 },
    parentNode: 'dc-asia-order-svc',
    extent: 'parent',
    data: {
      label: 'Order Pod',
      description: 'Pod с Sidecar (replica)',
      technology: 'Java',
      viewLevel: 'cluster',
      parentId: 'dc-asia-order-svc',
    },
  },
  {
    id: 'dc-asia-user-svc',
    type: 'serviceGroup',
    position: { x: 2020, y: 1280 },
    data: {
      label: 'User Service',
      description: 'Read Replica — только чтение',
      technology: 'Go / gRPC',
      viewLevel: 'cluster',
      width: 260,
      height: 110,
    },
  },
  {
    id: 'dc-asia-user-pod',
    type: 'pod',
    position: { x: 15, y: 35 },
    parentNode: 'dc-asia-user-svc',
    extent: 'parent',
    data: {
      label: 'User Pod',
      description: 'Pod с Sidecar',
      technology: 'Go',
      viewLevel: 'cluster',
      parentId: 'dc-asia-user-svc',
    },
  },
  {
    id: 'dc-asia-user-pod-2',
    type: 'pod',
    position: { x: 135, y: 35 },
    parentNode: 'dc-asia-user-svc',
    extent: 'parent',
    data: {
      label: 'User Pod',
      description: 'Pod с Sidecar (replica)',
      technology: 'Go',
      viewLevel: 'cluster',
      parentId: 'dc-asia-user-svc',
    },
  },
  {
    id: 'dc-asia-cache',
    type: 'cache',
    position: { x: 2550, y: 1180 },
    data: {
      label: 'Local Cache',
      description: 'Cache-Aside — локальный кэш для снижения latency',
      technology: 'e.g. Redis, Memcached',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-asia-db',
    type: 'database',
    position: { x: 2550, y: 1320 },
    data: {
      label: 'Read Replica',
      description: 'Read Replica — только чтение, async replication',
      technology: 'e.g. PostgreSQL replica',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-asia-cdc',
    type: 'service',
    position: { x: 2550, y: 1460 },
    data: {
      label: 'CDC Consumer',
      description: 'Change Data Capture — применяет события к локальной БД',
      technology: 'Debezium Consumer',
      viewLevel: 'cluster',
    },
  },

  // ============ CROSS-DC REPLICATION ============
  {
    id: 'cross-dc-kafka',
    type: 'messageQueue',
    position: { x: 3050, y: 700 },
    data: {
      label: 'Cross-DC Event Bus',
      description: 'Event Replication — репликация событий между регионами',
      technology: 'e.g. MirrorMaker, Wormhole',
      viewLevel: 'global',
    },
  },
]

export const allEdges: ArchEdge[] = [
  // ============ GLOBAL LAYER ============
  // Одна линия на связь, анимация меняет направление
  { id: 'e-client-dns', source: 'client', target: 'dns' },
  { id: 'e-client-cdn', source: 'client', target: 'cdn' },  // После DNS клиент идёт в CDN
  { id: 'e-cdn-global-lb', source: 'cdn', target: 'global-lb' },

  // Global LB → DCs
  { id: 'e-global-lb-dc-eu', source: 'global-lb', target: 'dc-eu' },
  { id: 'e-global-lb-dc-us', source: 'global-lb', target: 'dc-us' },
  { id: 'e-global-lb-dc-asia', source: 'global-lb', target: 'dc-asia' },

  // ============ DC EUROPE ============
  // Main request path (одна линия)
  { id: 'e-dc-eu-lb', source: 'dc-eu', target: 'dc-eu-lb' },
  { id: 'e-dc-eu-lb-gw', source: 'dc-eu-lb', target: 'dc-eu-gw' },
  { id: 'e-dc-eu-gw-auth', source: 'dc-eu-gw', target: 'dc-eu-auth' },
  { id: 'e-dc-eu-lb-ratelimit', source: 'dc-eu-lb', target: 'dc-eu-ratelimit' },
  { id: 'e-dc-eu-gw-ingress', source: 'dc-eu-gw', target: 'dc-eu-ingress' },

  // Mesh Control Plane (управление sidecar proxies) - пунктирная линия
  { id: 'e-dc-eu-istiod-user', source: 'dc-eu-istiod', target: 'dc-eu-user-svc', style: { strokeDasharray: '3,3', stroke: '#8B5CF6' } },
  { id: 'e-dc-eu-istiod-order', source: 'dc-eu-istiod', target: 'dc-eu-order-svc', style: { strokeDasharray: '3,3', stroke: '#8B5CF6' } },
  { id: 'e-dc-eu-istiod-payment', source: 'dc-eu-istiod', target: 'dc-eu-payment-svc', style: { strokeDasharray: '3,3', stroke: '#8B5CF6' } },
  { id: 'e-dc-eu-istiod-inventory', source: 'dc-eu-istiod', target: 'dc-eu-inventory-svc', style: { strokeDasharray: '3,3', stroke: '#8B5CF6' } },

  // Ingress → Services (одна линия на связь)
  { id: 'e-dc-eu-ingress-user-svc', source: 'dc-eu-ingress', target: 'dc-eu-user-svc' },
  { id: 'e-dc-eu-ingress-order-svc', source: 'dc-eu-ingress', target: 'dc-eu-order-svc' },
  { id: 'e-dc-eu-ingress-payment-svc', source: 'dc-eu-ingress', target: 'dc-eu-payment-svc' },
  { id: 'e-dc-eu-ingress-inventory-svc', source: 'dc-eu-ingress', target: 'dc-eu-inventory-svc' },

  // Services → DBs (Database per Service)
  { id: 'e-dc-eu-user-svc-db', source: 'dc-eu-user-svc', target: 'dc-eu-user-db' },
  { id: 'e-dc-eu-order-svc-db', source: 'dc-eu-order-svc', target: 'dc-eu-order-db' },
  { id: 'e-dc-eu-payment-svc-db', source: 'dc-eu-payment-svc', target: 'dc-eu-payment-db' },
  { id: 'e-dc-eu-inventory-svc-db', source: 'dc-eu-inventory-svc', target: 'dc-eu-inventory-db' },

  // Services → Cache
  { id: 'e-dc-eu-user-svc-cache', source: 'dc-eu-user-svc', target: 'dc-eu-cache' },
  { id: 'e-dc-eu-order-svc-cache', source: 'dc-eu-order-svc', target: 'dc-eu-cache' },

  // Services ↔ Event Bus
  { id: 'e-dc-eu-order-svc-kafka', source: 'dc-eu-order-svc', target: 'dc-eu-kafka' },
  { id: 'e-dc-eu-payment-svc-kafka', source: 'dc-eu-payment-svc', target: 'dc-eu-kafka' },
  { id: 'e-dc-eu-inventory-svc-kafka', source: 'dc-eu-inventory-svc', target: 'dc-eu-kafka' },

  // Inter-service mesh (Order ↔ User)
  { id: 'e-dc-eu-order-user-mesh', source: 'dc-eu-order-svc', target: 'dc-eu-user-svc', style: { strokeDasharray: '2,2', stroke: '#06B6D4' } },

  // Observability
  { id: 'e-dc-eu-svc-prometheus', source: 'dc-eu-order-svc', target: 'dc-eu-prometheus', style: { strokeDasharray: '2,2', stroke: '#F59E0B' } },
  { id: 'e-dc-eu-svc-jaeger', source: 'dc-eu-order-svc', target: 'dc-eu-jaeger', style: { strokeDasharray: '2,2', stroke: '#F59E0B' } },

  // ============ DC US ============
  { id: 'e-dc-us-lb', source: 'dc-us', target: 'dc-us-lb' },
  { id: 'e-dc-us-lb-gw', source: 'dc-us-lb', target: 'dc-us-gw' },
  { id: 'e-dc-us-gw-ingress', source: 'dc-us-gw', target: 'dc-us-ingress' },
  { id: 'e-dc-us-ingress-order', source: 'dc-us-ingress', target: 'dc-us-order-svc' },
  { id: 'e-dc-us-ingress-user', source: 'dc-us-ingress', target: 'dc-us-user-svc' },
  { id: 'e-dc-us-order-svc-cache', source: 'dc-us-order-svc', target: 'dc-us-cache' },
  { id: 'e-dc-us-user-svc-cache', source: 'dc-us-user-svc', target: 'dc-us-cache' },
  { id: 'e-dc-us-order-svc-db', source: 'dc-us-order-svc', target: 'dc-us-db' },
  { id: 'e-dc-us-user-svc-db', source: 'dc-us-user-svc', target: 'dc-us-db' },

  // ============ DC ASIA ============
  { id: 'e-dc-asia-lb', source: 'dc-asia', target: 'dc-asia-lb' },
  { id: 'e-dc-asia-lb-gw', source: 'dc-asia-lb', target: 'dc-asia-gw' },
  { id: 'e-dc-asia-gw-ingress', source: 'dc-asia-gw', target: 'dc-asia-ingress' },
  { id: 'e-dc-asia-ingress-order', source: 'dc-asia-ingress', target: 'dc-asia-order-svc' },
  { id: 'e-dc-asia-ingress-user', source: 'dc-asia-ingress', target: 'dc-asia-user-svc' },
  { id: 'e-dc-asia-order-svc-cache', source: 'dc-asia-order-svc', target: 'dc-asia-cache' },
  { id: 'e-dc-asia-user-svc-cache', source: 'dc-asia-user-svc', target: 'dc-asia-cache' },
  { id: 'e-dc-asia-order-svc-db', source: 'dc-asia-order-svc', target: 'dc-asia-db' },
  { id: 'e-dc-asia-user-svc-db', source: 'dc-asia-user-svc', target: 'dc-asia-db' },

  // ============ CROSS-DC REPLICATION ============
  // Event-driven replication: Kafka → CDC Consumer → DB
  { id: 'e-dc-eu-kafka-crossdc', source: 'dc-eu-kafka', target: 'cross-dc-kafka' },
  // US: Cross-DC Kafka → CDC Consumer → Read Replica
  { id: 'e-crossdc-us-cdc', source: 'cross-dc-kafka', target: 'dc-us-cdc', style: { strokeDasharray: '6,3', stroke: '#6366F1' } },
  { id: 'e-us-cdc-db', source: 'dc-us-cdc', target: 'dc-us-db', style: { strokeDasharray: '4,4', stroke: '#6366F1' } },
  // Asia: Cross-DC Kafka → CDC Consumer → Read Replica
  { id: 'e-crossdc-asia-cdc', source: 'cross-dc-kafka', target: 'dc-asia-cdc', style: { strokeDasharray: '6,3', stroke: '#6366F1' } },
  { id: 'e-asia-cdc-db', source: 'dc-asia-cdc', target: 'dc-asia-db', style: { strokeDasharray: '4,4', stroke: '#6366F1' } },
]

// Для обратной совместимости
export const globalNodes = allNodes
export const globalEdges = allEdges
export const getDatacenterNodes = () => []
export const getDatacenterEdges = () => []
export const getClusterNodes = () => []
export const getClusterEdges = () => []
