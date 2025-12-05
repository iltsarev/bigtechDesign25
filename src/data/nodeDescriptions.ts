import { NodeType } from '../types'

export interface NodeDescription {
  title: string
  purpose: string
  keyFeatures: string[]
  whyNeeded: string
  realWorldExample: string
  technologies: string[]
}

export const nodeDescriptions: Record<NodeType, NodeDescription> = {
  client: {
    title: 'Client Application',
    purpose: 'Точка входа пользователя в систему',
    keyFeatures: [
      'Отправляет HTTP/HTTPS запросы',
      'Кэширует данные локально',
      'Обрабатывает ошибки и retry логику',
      'Отображает UI пользователю',
    ],
    whyNeeded: 'Клиент — это интерфейс между пользователем и backend. Он абстрагирует сложность распределённой системы, предоставляя простой UI.',
    realWorldExample: 'iOS/Android приложение Uber, веб-интерфейс Gmail, Slack desktop app',
    technologies: ['React Native', 'Swift', 'Kotlin', 'Flutter', 'React', 'Vue'],
  },

  dns: {
    title: 'DNS (Domain Name System)',
    purpose: 'Преобразование доменных имён в IP-адреса',
    keyFeatures: [
      'Иерархическая система резолвинга',
      'TTL-based кэширование',
      'GeoDNS для географической маршрутизации',
      'Health checks для failover',
    ],
    whyNeeded: 'Пользователи запоминают домены (google.com), а не IP-адреса. DNS также позволяет балансировать нагрузку на уровне DNS и направлять пользователей к ближайшему дата-центру.',
    realWorldExample: 'Route 53 направляет европейских пользователей на EU сервера, а американских — на US',
    technologies: ['AWS Route 53', 'Cloudflare DNS', 'Google Cloud DNS', 'BIND'],
  },

  cdn: {
    title: 'CDN (Content Delivery Network)',
    purpose: 'Кэширование и доставка статического контента с edge-серверов',
    keyFeatures: [
      'Edge-серверы по всему миру',
      'Кэширование статики (JS, CSS, images)',
      'DDoS защита',
      'TLS termination на edge',
    ],
    whyNeeded: 'Снижает latency доставки контента — пользователь получает данные с ближайшего сервера, а не из основного дата-центра. Также разгружает origin серверы.',
    realWorldExample: 'Netflix использует свою CDN (Open Connect) для стриминга видео с серверов у провайдеров',
    technologies: ['Cloudflare', 'Akamai', 'AWS CloudFront', 'Fastly'],
  },

  globalLb: {
    title: 'Global Load Balancer',
    purpose: 'Распределение трафика между дата-центрами',
    keyFeatures: [
      'Geo-based routing',
      'Health monitoring дата-центров',
      'Failover при отказе региона',
      'Latency-based routing',
    ],
    whyNeeded: 'Направляет пользователей к оптимальному дата-центру по географии или latency. При отказе одного региона переключает трафик на другой.',
    realWorldExample: 'Google Global Load Balancer направляет запрос к ближайшему дата-центру с учётом загрузки',
    technologies: ['AWS Global Accelerator', 'Google Cloud GLB', 'Azure Traffic Manager'],
  },

  datacenter: {
    title: 'Data Center',
    purpose: 'Физическая инфраструктура для размещения серверов',
    keyFeatures: [
      'Redundant power и cooling',
      'Физическая безопасность',
      'Сетевая связность с другими DC',
      'Compliance (SOC2, GDPR locality)',
    ],
    whyNeeded: 'Обеспечивает физическую основу для всей инфраструктуры. Multi-region deployment нужен для disaster recovery и низкой latency в разных регионах.',
    realWorldExample: 'AWS имеет 30+ регионов, каждый с несколькими Availability Zones',
    technologies: ['AWS Regions', 'Google Cloud Regions', 'Azure Regions', 'Colocation'],
  },

  regionalLb: {
    title: 'Regional Load Balancer',
    purpose: 'Балансировка нагрузки внутри дата-центра',
    keyFeatures: [
      'L4 (TCP/UDP) и L7 (HTTP) балансировка',
      'Health checks backend серверов',
      'Connection draining',
      'Rate limiting на входе',
    ],
    whyNeeded: 'Распределяет входящий трафик между серверами, обеспечивает отказоустойчивость — при падении сервера трафик перенаправляется на здоровые.',
    realWorldExample: 'HAProxy перед кластером API серверов, AWS ALB перед ECS сервисами',
    technologies: ['HAProxy', 'Nginx', 'AWS ALB/NLB', 'Envoy', 'Traefik'],
  },

  apiGateway: {
    title: 'API Gateway',
    purpose: 'Единая точка входа для всех API запросов',
    keyFeatures: [
      'Request routing по path/header',
      'Authentication и Authorization',
      'Request/Response transformation',
      'API versioning',
    ],
    whyNeeded: 'Централизует cross-cutting concerns: auth, logging, rate limiting. Клиенту не нужно знать о внутренней структуре микросервисов.',
    realWorldExample: 'Kong Gateway маршрутизирует /users/* на User Service, /orders/* на Order Service',
    technologies: ['Kong', 'AWS API Gateway', 'Apigee', 'Tyk', 'KrakenD'],
  },

  authService: {
    title: 'Auth Service',
    purpose: 'Аутентификация и авторизация пользователей',
    keyFeatures: [
      'JWT/OAuth2 token выдача и валидация',
      'Session management',
      'RBAC/ABAC authorization',
      'SSO интеграция',
    ],
    whyNeeded: 'Централизованный сервис безопасности. Все сервисы делегируют проверку токенов ему, не дублируя логику аутентификации.',
    realWorldExample: 'Okta/Auth0 как managed auth service, или собственный сервис с Redis для сессий',
    technologies: ['OAuth2', 'OpenID Connect', 'JWT', 'Keycloak', 'Auth0'],
  },

  rateLimiter: {
    title: 'Rate Limiter',
    purpose: 'Ограничение количества запросов от клиентов',
    keyFeatures: [
      'Token bucket / Sliding window алгоритмы',
      'Per-user и per-IP лимиты',
      'Distributed rate limiting (Redis)',
      'Graceful degradation',
    ],
    whyNeeded: 'Защищает систему от abuse и DDoS. Обеспечивает fair usage — один клиент не может забрать все ресурсы.',
    realWorldExample: 'Twitter API: 300 requests/15 min для timeline, GitHub API: 5000 req/hour',
    technologies: ['Redis + Lua scripts', 'Envoy rate limiting', 'Kong rate limiting plugin'],
  },

  k8sCluster: {
    title: 'Kubernetes Cluster',
    purpose: 'Оркестрация контейнеров и управление workloads',
    keyFeatures: [
      'Автоматический scheduling подов',
      'Self-healing (restart failed pods)',
      'Horizontal autoscaling',
      'Rolling deployments',
    ],
    whyNeeded: 'Абстрагирует управление контейнерами. Декларативно описываем желаемое состояние, K8s обеспечивает его поддержание.',
    realWorldExample: 'Spotify запускает 2000+ микросервисов в K8s, Airbnb мигрировал 1000+ сервисов',
    technologies: ['Kubernetes', 'EKS', 'GKE', 'AKS', 'OpenShift'],
  },

  ingress: {
    title: 'Ingress Controller',
    purpose: 'HTTP routing внутри Kubernetes кластера',
    keyFeatures: [
      'Path-based и host-based routing',
      'TLS termination',
      'Load balancing к сервисам',
      'Canary deployments',
    ],
    whyNeeded: 'Единая точка входа в кластер. Маршрутизирует внешний трафик к нужным сервисам по правилам.',
    realWorldExample: 'Nginx Ingress направляет api.example.com/v1/* на v1 сервис, /v2/* на v2',
    technologies: ['Nginx Ingress', 'Traefik', 'Istio Gateway', 'AWS ALB Ingress'],
  },

  service: {
    title: 'Kubernetes Service',
    purpose: 'Абстракция для доступа к группе подов',
    keyFeatures: [
      'Stable DNS name и IP',
      'Load balancing между подами',
      'Service discovery',
      'Port mapping',
    ],
    whyNeeded: 'Поды эфемерны — их IP меняются. Service предоставляет стабильный endpoint для обращения к группе подов.',
    realWorldExample: 'order-service.default.svc.cluster.local всегда резолвится к здоровым подам Order Service',
    technologies: ['ClusterIP', 'NodePort', 'LoadBalancer', 'Headless Service'],
  },

  pod: {
    title: 'Pod (with Envoy Sidecar)',
    purpose: 'Минимальная единица деплоя в Kubernetes с service mesh proxy',
    keyFeatures: [
      'Один или несколько контейнеров',
      'Shared network namespace',
      'Envoy sidecar для mesh функций',
      'Lifecycle hooks',
    ],
    whyNeeded: 'Pod группирует контейнеры, которые должны работать вместе. Envoy sidecar добавляет observability, security и traffic management без изменения кода приложения.',
    realWorldExample: 'Pod с Python app + Envoy sidecar + log collector контейнером',
    technologies: ['Docker', 'containerd', 'Envoy', 'Istio proxy'],
  },

  sidecar: {
    title: 'Envoy Sidecar Proxy',
    purpose: 'Прозрачный proxy для service mesh функциональности',
    keyFeatures: [
      'mTLS между сервисами (zero-trust security)',
      'Automatic retry и circuit breaking',
      'Distributed tracing (spans)',
      'Metrics export (Prometheus)',
      'Load balancing (round-robin, least-conn)',
      'Traffic mirroring и canary routing',
    ],
    whyNeeded: `Envoy решает проблемы распределённых систем БЕЗ изменения кода приложений:

• SECURITY: mTLS шифрует весь трафик между сервисами. Без Envoy каждый сервис должен сам реализовывать TLS.

• OBSERVABILITY: Envoy автоматически собирает метрики (latency, error rate, RPS) и трейсы. Приложению не нужно инструментировать каждый вызов.

• RESILIENCE: Circuit breaker, retry, timeout — Envoy реализует паттерны отказоустойчивости. При 50% ошибок он прекращает отправку запросов, давая сервису восстановиться.

• TRAFFIC MANAGEMENT: Canary deployments, A/B testing, traffic mirroring — всё через конфигурацию, без кода.

Без Envoy каждая команда реализовывала бы эти функции по-своему, с багами и inconsistency.`,
    realWorldExample: 'Lyft (создатели Envoy) используют его для 10,000+ сервисов. Uber, Airbnb, eBay — все используют Envoy в production.',
    technologies: ['Envoy Proxy', 'Istio', 'Linkerd', 'Consul Connect'],
  },

  cache: {
    title: 'Distributed Cache',
    purpose: 'Быстрое хранилище для часто запрашиваемых данных',
    keyFeatures: [
      'In-memory storage (микросекунды latency)',
      'TTL-based expiration',
      'Cache invalidation strategies',
      'Clustering и replication',
    ],
    whyNeeded: 'БД медленная (миллисекунды), кэш быстрый (микросекунды). Кэширование снижает нагрузку на БД и уменьшает latency для hot data.',
    realWorldExample: 'Twitter кэширует timeline в Redis — 300M+ пользователей не могут каждый раз ходить в БД',
    technologies: ['Redis', 'Memcached', 'Hazelcast', 'Apache Ignite'],
  },

  database: {
    title: 'Database',
    purpose: 'Персистентное хранение данных',
    keyFeatures: [
      'ACID транзакции',
      'Replication для отказоустойчивости',
      'Sharding для масштабирования',
      'Backup и point-in-time recovery',
    ],
    whyNeeded: 'Source of truth для данных. Кэш может потеряться, но данные в БД сохраняются. Обеспечивает консистентность и durability.',
    realWorldExample: 'Instagram использует PostgreSQL с sharding по user_id для 2B+ пользователей',
    technologies: ['PostgreSQL', 'MySQL', 'MongoDB', 'CockroachDB', 'Cassandra'],
  },

  messageQueue: {
    title: 'Message Queue / Event Bus',
    purpose: 'Асинхронная коммуникация между сервисами',
    keyFeatures: [
      'Decoupling producers и consumers',
      'Guaranteed delivery',
      'Event sourcing support',
      'Horizontal scaling consumers',
    ],
    whyNeeded: 'Синхронные вызовы создают coupling и каскадные отказы. Queue позволяет сервисам общаться асинхронно, обеспечивая resilience и масштабируемость.',
    realWorldExample: 'LinkedIn использует Kafka для 7+ триллионов сообщений в день между сервисами',
    technologies: ['Apache Kafka', 'RabbitMQ', 'AWS SQS', 'Google Pub/Sub', 'NATS'],
  },
}
