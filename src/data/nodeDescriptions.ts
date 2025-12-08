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

  securityLayer: {
    title: 'Security Layer (WAF + Rate Limiter)',
    purpose: 'Защита от атак и ограничение количества запросов',
    keyFeatures: [
      'WAF — фильтрация SQL injection, XSS, OWASP Top 10',
      'Rate Limiting — Token bucket / Sliding window',
      'Per-user, per-IP и per-endpoint лимиты',
      'Geo-blocking и IP reputation',
      'Bot detection и CAPTCHA интеграция',
      'DDoS mitigation',
    ],
    whyNeeded: 'Централизованный слой безопасности защищает от вредоносных запросов (WAF) и перегрузки (Rate Limiting). Объединение позволяет принимать решения на основе обоих факторов — подозрительный трафик получает более жёсткие лимиты.',
    realWorldExample: 'Cloudflare WAF + Rate Limiting, AWS WAF + Shield, Google Cloud Armor. BigTech компании используют собственные решения с ML для детекции аномалий',
    technologies: ['Custom solutions (Google, Meta)', 'Cloudflare', 'AWS WAF', 'ModSecurity', 'Envoy + Lua'],
  },

  containerOrchestration: {
    title: 'Container Orchestration',
    purpose: 'Оркестрация контейнеров и управление workloads',
    keyFeatures: [
      'Автоматический scheduling контейнеров',
      'Self-healing (restart failed containers)',
      'Horizontal autoscaling',
      'Rolling deployments',
    ],
    whyNeeded: 'Абстрагирует управление контейнерами. Декларативно описываем желаемое состояние, оркестратор обеспечивает его поддержание.',
    realWorldExample: 'Google использует Borg для миллионов контейнеров, Meta — Twine. Как OSS альтернатива — Kubernetes (Spotify 2000+ сервисов)',
    technologies: ['Borg (Google)', 'Twine (Meta)', 'Kubernetes', 'Mesos', 'Nomad'],
  },

  ingress: {
    title: 'Ingress Controller',
    purpose: 'HTTP routing внутри кластера оркестрации',
    keyFeatures: [
      'Path-based и host-based routing',
      'TLS termination',
      'Load balancing к сервисам',
      'Canary deployments',
    ],
    whyNeeded: 'Единая точка входа в кластер. Маршрутизирует внешний трафик к нужным сервисам по правилам.',
    realWorldExample: 'Google использует GFE (Google Front End), как OSS — Nginx Ingress направляет api.example.com/v1/* на v1 сервис',
    technologies: ['GFE (Google)', 'Nginx Ingress', 'Traefik', 'Envoy', 'HAProxy'],
  },

  service: {
    title: 'Service Discovery',
    purpose: 'Абстракция для доступа к группе инстансов сервиса',
    keyFeatures: [
      'Stable DNS name и IP',
      'Load balancing между инстансами',
      'Service discovery',
      'Health checking',
    ],
    whyNeeded: 'Инстансы эфемерны — их IP меняются. Service discovery предоставляет стабильный endpoint для обращения к группе инстансов.',
    realWorldExample: 'Google использует BNS (Borg Naming Service), Meta — SMC. OSS: Consul, etcd, Kubernetes Services',
    technologies: ['BNS (Google)', 'SMC (Meta)', 'Consul', 'etcd', 'ZooKeeper'],
  },

  pod: {
    title: 'Pod (with Sidecar)',
    purpose: 'Минимальная единица деплоя с service mesh proxy',
    keyFeatures: [
      'Один или несколько контейнеров/процессов',
      'Shared network namespace',
      'Sidecar proxy для mesh функций',
      'Lifecycle hooks',
    ],
    whyNeeded: 'Pod группирует процессы, которые должны работать вместе. Sidecar proxy добавляет observability, security и traffic management без изменения кода приложения.',
    realWorldExample: 'Pod с Python app + Sidecar proxy + log collector',
    technologies: ['Docker', 'containerd', 'Borg (Google)', 'Twine (Meta)'],
  },

  sidecar: {
    title: 'Sidecar Proxy',
    purpose: 'Прозрачный proxy для service mesh функциональности',
    keyFeatures: [
      'mTLS между сервисами (zero-trust security)',
      'Automatic retry и circuit breaking',
      'Distributed tracing (spans)',
      'Metrics export',
      'Load balancing (round-robin, least-conn)',
      'Traffic mirroring и canary routing',
    ],
    whyNeeded: `Sidecar proxy решает проблемы распределённых систем БЕЗ изменения кода приложений:

• SECURITY: mTLS шифрует весь трафик между сервисами. Без sidecar каждый сервис должен сам реализовывать TLS.

• OBSERVABILITY: Proxy автоматически собирает метрики (latency, error rate, RPS) и трейсы. Приложению не нужно инструментировать каждый вызов.

• RESILIENCE: Circuit breaker, retry, timeout — proxy реализует паттерны отказоустойчивости. При 50% ошибок он прекращает отправку запросов, давая сервису восстановиться.

• TRAFFIC MANAGEMENT: Canary deployments, A/B testing, traffic mirroring — всё через конфигурацию, без кода.

Без sidecar каждая команда реализовывала бы эти функции по-своему, с багами и inconsistency.`,
    realWorldExample: 'Google и Meta используют собственные mesh-решения. OSS: Envoy (Lyft) используется в Uber, Airbnb, eBay',
    technologies: ['Custom (Google/Meta)', 'Envoy', 'Linkerd', 'Consul Connect'],
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
    realWorldExample: 'Meta использует TAO для кэширования графа, Netflix — EVCache. OSS: Redis, Memcached',
    technologies: ['TAO (Meta)', 'EVCache (Netflix)', 'Redis', 'Memcached', 'Hazelcast'],
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
    realWorldExample: 'Google использует Spanner, Meta — MyRocks/MySQL. OSS: PostgreSQL с sharding (Instagram 2B+ users)',
    technologies: ['Spanner (Google)', 'MyRocks (Meta)', 'PostgreSQL', 'MySQL', 'CockroachDB'],
  },

  messageQueue: {
    title: 'Event Bus / Message Queue',
    purpose: 'Асинхронная коммуникация между сервисами',
    keyFeatures: [
      'Decoupling producers и consumers',
      'Guaranteed delivery',
      'Event sourcing support',
      'Horizontal scaling consumers',
    ],
    whyNeeded: 'Синхронные вызовы создают coupling и каскадные отказы. Event Bus позволяет сервисам общаться асинхронно, обеспечивая resilience и масштабируемость.',
    realWorldExample: 'Meta использует Wormhole, LinkedIn — Kafka (7+ трлн сообщений/день), Google — Pub/Sub',
    technologies: ['Wormhole (Meta)', 'Kafka', 'Google Pub/Sub', 'AWS SQS', 'NATS'],
  },
}
