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
      description: 'Identity Provider — аутентификация и авторизация',
      technology: 'OAuth 2.0 / JWT',
      viewLevel: 'datacenter',
    },
  },
  {
    id: 'dc-eu-session',
    type: 'cache',
    position: { x: 1750, y: -100 },
    data: {
      label: 'Token Blacklist',
      description: 'JWT Blacklist — отозванные токены (logout/revoke)',
      technology: 'Redis Set + TTL',
      viewLevel: 'datacenter',
    },
  },
  {
    id: 'dc-eu-ingress',
    type: 'ingress',
    position: { x: 1750, y: 50 },
    data: {
      label: 'K8s Ingress',
      description: 'Ingress Controller — L7 роутинг в Kubernetes',
      technology: 'NGINX',
      viewLevel: 'cluster',
    },
  },
  // EU Services
  {
    id: 'dc-eu-user-svc',
    type: 'service',
    position: { x: 2020, y: -120 },
    data: {
      label: 'User Service',
      description: 'Microservice — бизнес-логика пользователей',
      technology: 'Go / gRPC',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-user-pod',
    type: 'pod',
    position: { x: 2300, y: -120 },
    data: {
      label: 'User Pod',
      description: 'Pod с Envoy Sidecar — app + proxy в одном network namespace',
      technology: 'Go + Envoy',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-order-svc',
    type: 'service',
    position: { x: 2020, y: 20 },
    data: {
      label: 'Order Service',
      description: 'Microservice — бизнес-логика заказов (SAGA orchestrator)',
      technology: 'Java / Spring',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-order-pod',
    type: 'pod',
    position: { x: 2300, y: 20 },
    data: {
      label: 'Order Pod',
      description: 'Pod с Envoy Sidecar — app + proxy в одном network namespace',
      technology: 'Java + Envoy',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-payment-svc',
    type: 'service',
    position: { x: 2020, y: 160 },
    data: {
      label: 'Payment Service',
      description: 'Microservice — интеграция с платёжными провайдерами',
      technology: 'Node.js',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-payment-pod',
    type: 'pod',
    position: { x: 2300, y: 160 },
    data: {
      label: 'Payment Pod',
      description: 'Pod с Envoy Sidecar — app + proxy в одном network namespace',
      technology: 'Node.js + Envoy',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-inventory-svc',
    type: 'service',
    position: { x: 2020, y: 300 },
    data: {
      label: 'Inventory Service',
      description: 'Microservice — управление складскими остатками',
      technology: 'Python / FastAPI',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-inventory-pod',
    type: 'pod',
    position: { x: 2300, y: 300 },
    data: {
      label: 'Inventory Pod',
      description: 'Pod с Envoy Sidecar — app + proxy в одном network namespace',
      technology: 'Python + Envoy',
      viewLevel: 'cluster',
    },
  },
  // EU Storage - Database per Service
  {
    id: 'dc-eu-user-db',
    type: 'database',
    position: { x: 2550, y: -120 },
    data: {
      label: 'User DB',
      description: 'Database per Service — изолированная БД User сервиса',
      technology: 'PostgreSQL',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-order-db',
    type: 'database',
    position: { x: 2550, y: 20 },
    data: {
      label: 'Order DB',
      description: 'Database per Service — изолированная БД Order сервиса',
      technology: 'PostgreSQL',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-payment-db',
    type: 'database',
    position: { x: 2550, y: 160 },
    data: {
      label: 'Payment DB',
      description: 'Database per Service — изолированная БД Payment сервиса',
      technology: 'PostgreSQL',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-inventory-db',
    type: 'database',
    position: { x: 2550, y: 300 },
    data: {
      label: 'Inventory DB',
      description: 'Database per Service — изолированная БД Inventory сервиса',
      technology: 'PostgreSQL',
      viewLevel: 'cluster',
    },
  },
  // EU Cache
  {
    id: 'dc-eu-cache',
    type: 'cache',
    position: { x: 2550, y: 440 },
    data: {
      label: 'Redis Cluster',
      description: 'Distributed Cache — кэширование + Rate Limit counters',
      technology: 'Redis Cluster',
      viewLevel: 'cluster',
    },
  },
  // EU Kafka + Schema Registry + DLQ
  {
    id: 'dc-eu-kafka',
    type: 'messageQueue',
    position: { x: 2800, y: 90 },
    data: {
      label: 'Kafka Cluster',
      description: 'Event Bus — domain topics: orders.*, payments.*, inventory.*',
      technology: 'Apache Kafka (3 brokers)',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-schema-registry',
    type: 'service',
    position: { x: 3050, y: 90 },
    data: {
      label: 'Schema Registry',
      description: 'Avro/Protobuf schema validation — контракты событий',
      technology: 'Confluent Schema Registry',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-dlq',
    type: 'messageQueue',
    position: { x: 2800, y: 230 },
    data: {
      label: 'Dead Letter Queue',
      description: 'DLQ topics: *.dlq — failed messages после 3 retry',
      technology: 'Kafka DLQ Topics',
      viewLevel: 'cluster',
    },
  },
  // EU Rate Limiter
  {
    id: 'dc-eu-ratelimit',
    type: 'rateLimiter',
    position: { x: 1250, y: 180 },
    data: {
      label: 'Rate Limiter',
      description: 'Distributed Rate Limiting — защита от перегрузки',
      technology: 'Redis + Token Bucket',
      viewLevel: 'datacenter',
    },
  },
  // EU Observability Stack
  {
    id: 'dc-eu-prometheus',
    type: 'service',
    position: { x: 2800, y: -120 },
    data: {
      label: 'Prometheus',
      description: 'Metrics Collection — сбор метрик со всех сервисов',
      technology: 'Prometheus + VictoriaMetrics',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-eu-jaeger',
    type: 'service',
    position: { x: 2800, y: 370 },
    data: {
      label: 'Jaeger',
      description: 'Distributed Tracing — отслеживание запросов',
      technology: 'Jaeger / Zipkin',
      viewLevel: 'cluster',
    },
  },
  // Istio Control Plane
  {
    id: 'dc-eu-istiod',
    type: 'service',
    position: { x: 1750, y: 180 },
    data: {
      label: 'Istiod',
      description: 'Service Mesh Control Plane — управление Envoy sidecar',
      technology: 'Istio',
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
      label: 'K8s Ingress',
      description: 'Ingress Controller — L7 роутинг в Kubernetes',
      technology: 'NGINX',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-us-order-svc',
    type: 'service',
    position: { x: 2020, y: 620 },
    data: {
      label: 'Order Service',
      description: 'Microservice Replica — только чтение заказов',
      technology: 'Java / Spring',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-us-order-pod',
    type: 'pod',
    position: { x: 2270, y: 620 },
    data: {
      label: 'Order Pod',
      description: 'Pod — минимальная единица деплоя в K8s',
      technology: 'Docker Container',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-us-user-svc',
    type: 'service',
    position: { x: 2020, y: 760 },
    data: {
      label: 'User Service',
      description: 'Microservice Replica — только чтение пользователей',
      technology: 'Go / gRPC',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-us-user-pod',
    type: 'pod',
    position: { x: 2270, y: 760 },
    data: {
      label: 'User Pod',
      description: 'Pod — минимальная единица деплоя в K8s',
      technology: 'Docker Container',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-us-cache',
    type: 'cache',
    position: { x: 2550, y: 620 },
    data: {
      label: 'Local Cache',
      description: 'Cache-Aside — локальный кэш для снижения latency',
      technology: 'Redis',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-us-db',
    type: 'database',
    position: { x: 2550, y: 760 },
    data: {
      label: 'Read Replica',
      description: 'Read Replica — только чтение, async replication',
      technology: 'PostgreSQL',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-us-cdc',
    type: 'service',
    position: { x: 2550, y: 880 },
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
      label: 'K8s Ingress',
      description: 'Ingress Controller — L7 роутинг в Kubernetes',
      technology: 'NGINX',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-asia-order-svc',
    type: 'service',
    position: { x: 2020, y: 1120 },
    data: {
      label: 'Order Service',
      description: 'Microservice Replica — только чтение заказов',
      technology: 'Java / Spring',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-asia-order-pod',
    type: 'pod',
    position: { x: 2270, y: 1120 },
    data: {
      label: 'Order Pod',
      description: 'Pod — минимальная единица деплоя в K8s',
      technology: 'Docker Container',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-asia-user-svc',
    type: 'service',
    position: { x: 2020, y: 1260 },
    data: {
      label: 'User Service',
      description: 'Microservice Replica — только чтение пользователей',
      technology: 'Go / gRPC',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-asia-user-pod',
    type: 'pod',
    position: { x: 2270, y: 1260 },
    data: {
      label: 'User Pod',
      description: 'Pod — минимальная единица деплоя в K8s',
      technology: 'Docker Container',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-asia-cache',
    type: 'cache',
    position: { x: 2550, y: 1120 },
    data: {
      label: 'Local Cache',
      description: 'Cache-Aside — локальный кэш для снижения latency',
      technology: 'Redis',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-asia-db',
    type: 'database',
    position: { x: 2550, y: 1260 },
    data: {
      label: 'Read Replica',
      description: 'Read Replica — только чтение, async replication',
      technology: 'PostgreSQL',
      viewLevel: 'cluster',
    },
  },
  {
    id: 'dc-asia-cdc',
    type: 'service',
    position: { x: 2550, y: 1380 },
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
      label: 'Cross-DC Kafka',
      description: 'Event Replication — репликация событий между регионами',
      technology: 'MirrorMaker 2',
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
  { id: 'e-dc-eu-auth-session', source: 'dc-eu-auth', target: 'dc-eu-session' },
  { id: 'e-dc-eu-lb-ratelimit', source: 'dc-eu-lb', target: 'dc-eu-ratelimit' },
  { id: 'e-dc-eu-ratelimit-cache', source: 'dc-eu-ratelimit', target: 'dc-eu-cache', style: { strokeDasharray: '4,4' } },
  { id: 'e-dc-eu-gw-ingress', source: 'dc-eu-gw', target: 'dc-eu-ingress' },

  // Istio Control Plane (управление sidecar) - пунктирная линия
  { id: 'e-dc-eu-istiod-user', source: 'dc-eu-istiod', target: 'dc-eu-user-pod', style: { strokeDasharray: '3,3', stroke: '#8B5CF6' } },
  { id: 'e-dc-eu-istiod-order', source: 'dc-eu-istiod', target: 'dc-eu-order-pod', style: { strokeDasharray: '3,3', stroke: '#8B5CF6' } },
  { id: 'e-dc-eu-istiod-payment', source: 'dc-eu-istiod', target: 'dc-eu-payment-pod', style: { strokeDasharray: '3,3', stroke: '#8B5CF6' } },
  { id: 'e-dc-eu-istiod-inventory', source: 'dc-eu-istiod', target: 'dc-eu-inventory-pod', style: { strokeDasharray: '3,3', stroke: '#8B5CF6' } },

  // Ingress → Services (одна линия на связь)
  { id: 'e-dc-eu-ingress-user-svc', source: 'dc-eu-ingress', target: 'dc-eu-user-svc' },
  { id: 'e-dc-eu-ingress-order-svc', source: 'dc-eu-ingress', target: 'dc-eu-order-svc' },
  { id: 'e-dc-eu-ingress-payment-svc', source: 'dc-eu-ingress', target: 'dc-eu-payment-svc' },
  { id: 'e-dc-eu-ingress-inventory-svc', source: 'dc-eu-ingress', target: 'dc-eu-inventory-svc' },

  // Services → Pods
  { id: 'e-dc-eu-user-svc-pod', source: 'dc-eu-user-svc', target: 'dc-eu-user-pod' },
  { id: 'e-dc-eu-order-svc-pod', source: 'dc-eu-order-svc', target: 'dc-eu-order-pod' },
  { id: 'e-dc-eu-payment-svc-pod', source: 'dc-eu-payment-svc', target: 'dc-eu-payment-pod' },
  { id: 'e-dc-eu-inventory-svc-pod', source: 'dc-eu-inventory-svc', target: 'dc-eu-inventory-pod' },

  // Pods → DBs (Database per Service)
  { id: 'e-dc-eu-user-pod-db', source: 'dc-eu-user-pod', target: 'dc-eu-user-db' },
  { id: 'e-dc-eu-order-pod-db', source: 'dc-eu-order-pod', target: 'dc-eu-order-db' },
  { id: 'e-dc-eu-payment-pod-db', source: 'dc-eu-payment-pod', target: 'dc-eu-payment-db' },
  { id: 'e-dc-eu-inventory-pod-db', source: 'dc-eu-inventory-pod', target: 'dc-eu-inventory-db' },

  // Pods → Cache
  { id: 'e-dc-eu-user-pod-cache', source: 'dc-eu-user-pod', target: 'dc-eu-cache' },
  { id: 'e-dc-eu-order-pod-cache', source: 'dc-eu-order-pod', target: 'dc-eu-cache' },

  // Pods ↔ Kafka (одна линия, bidirectional animation)
  { id: 'e-dc-eu-order-pod-kafka', source: 'dc-eu-order-pod', target: 'dc-eu-kafka' },
  { id: 'e-dc-eu-payment-pod-kafka', source: 'dc-eu-payment-pod', target: 'dc-eu-kafka' },
  { id: 'e-dc-eu-inventory-pod-kafka', source: 'dc-eu-inventory-pod', target: 'dc-eu-kafka' },

  // Kafka infrastructure
  { id: 'e-dc-eu-kafka-schema', source: 'dc-eu-kafka', target: 'dc-eu-schema-registry', style: { strokeDasharray: '3,3', stroke: '#10B981' } },
  { id: 'e-dc-eu-kafka-dlq', source: 'dc-eu-kafka', target: 'dc-eu-dlq', style: { strokeDasharray: '4,4', stroke: '#EF4444' } },

  // Inter-service mesh (Order ↔ User)
  { id: 'e-dc-eu-order-user-mesh', source: 'dc-eu-order-pod', target: 'dc-eu-user-pod', style: { strokeDasharray: '2,2', stroke: '#06B6D4' } },

  // Observability
  { id: 'e-dc-eu-pods-prometheus', source: 'dc-eu-order-pod', target: 'dc-eu-prometheus', style: { strokeDasharray: '2,2', stroke: '#F59E0B' } },
  { id: 'e-dc-eu-pods-jaeger', source: 'dc-eu-order-pod', target: 'dc-eu-jaeger', style: { strokeDasharray: '2,2', stroke: '#F59E0B' } },

  // ============ DC US ============
  { id: 'e-dc-us-lb', source: 'dc-us', target: 'dc-us-lb' },
  { id: 'e-dc-us-lb-gw', source: 'dc-us-lb', target: 'dc-us-gw' },
  { id: 'e-dc-us-gw-ingress', source: 'dc-us-gw', target: 'dc-us-ingress' },
  { id: 'e-dc-us-ingress-order', source: 'dc-us-ingress', target: 'dc-us-order-svc' },
  { id: 'e-dc-us-ingress-user', source: 'dc-us-ingress', target: 'dc-us-user-svc' },
  { id: 'e-dc-us-order-svc-pod', source: 'dc-us-order-svc', target: 'dc-us-order-pod' },
  { id: 'e-dc-us-user-svc-pod', source: 'dc-us-user-svc', target: 'dc-us-user-pod' },
  { id: 'e-dc-us-order-pod-cache', source: 'dc-us-order-pod', target: 'dc-us-cache' },
  { id: 'e-dc-us-user-pod-cache', source: 'dc-us-user-pod', target: 'dc-us-cache' },
  { id: 'e-dc-us-order-pod-db', source: 'dc-us-order-pod', target: 'dc-us-db' },
  { id: 'e-dc-us-user-pod-db', source: 'dc-us-user-pod', target: 'dc-us-db' },

  // ============ DC ASIA ============
  { id: 'e-dc-asia-lb', source: 'dc-asia', target: 'dc-asia-lb' },
  { id: 'e-dc-asia-lb-gw', source: 'dc-asia-lb', target: 'dc-asia-gw' },
  { id: 'e-dc-asia-gw-ingress', source: 'dc-asia-gw', target: 'dc-asia-ingress' },
  { id: 'e-dc-asia-ingress-order', source: 'dc-asia-ingress', target: 'dc-asia-order-svc' },
  { id: 'e-dc-asia-ingress-user', source: 'dc-asia-ingress', target: 'dc-asia-user-svc' },
  { id: 'e-dc-asia-order-svc-pod', source: 'dc-asia-order-svc', target: 'dc-asia-order-pod' },
  { id: 'e-dc-asia-user-svc-pod', source: 'dc-asia-user-svc', target: 'dc-asia-user-pod' },
  { id: 'e-dc-asia-order-pod-cache', source: 'dc-asia-order-pod', target: 'dc-asia-cache' },
  { id: 'e-dc-asia-user-pod-cache', source: 'dc-asia-user-pod', target: 'dc-asia-cache' },
  { id: 'e-dc-asia-order-pod-db', source: 'dc-asia-order-pod', target: 'dc-asia-db' },
  { id: 'e-dc-asia-user-pod-db', source: 'dc-asia-user-pod', target: 'dc-asia-db' },

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
