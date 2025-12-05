import { Scenario } from '../../types'

export const scenarios: Scenario[] = [
  {
    id: 'create-order',
    name: 'Создание заказа (полный путь + SAGA)',
    description: 'Запрос в EU DC: авторизация, SAGA через Kafka, репликация в другие ДЦ',
    initialViewLevel: 'global',
    steps: [
      // ========== ПУТЬ ЗАПРОСА ОТ КЛИЕНТА ==========
      {
        id: 'step-1',
        fromNode: 'client',
        toNode: 'dns',
        edgeId: 'e-client-dns',
        type: 'request',
        title: 'DNS Lookup',
        description: 'Резолвинг доменного имени в IP адрес',
        detailedInfo: `ЗАЧЕМ: Браузер/приложение не знает IP адрес сервера, только домен api.store.com.

ЧТО ПРОИСХОДИТ:
1. Приложение отправляет DNS запрос
2. DNS сервер (Route 53) проверяет геолокацию клиента по IP
3. Возвращает IP ближайшего edge-сервера (CDN)

ПАТТЕРН: Service Discovery — автоматическое определение адреса сервиса.
Geo-DNS позволяет направлять пользователей в ближайший ДЦ.`,
        duration: 4800,
        realLatency: 25,
        payload: { query: 'api.store.com', type: 'A', clientIP: '203.0.113.50' },
      },
      {
        id: 'step-2',
        fromNode: 'dns',
        toNode: 'client',
        edgeId: 'e-client-dns',
        reverse: true,
        type: 'response',
        title: 'DNS Response → Client',
        description: 'Клиент получил IP ближайшего CDN edge-сервера',
        detailedInfo: `ЗАЧЕМ: Направить трафик на ближайшую к пользователю точку присутствия.

ЧТО ПРОИСХОДИТ:
1. DNS возвращает Anycast IP (один IP, но много серверов)
2. Сеть автоматически маршрутизирует на ближайший сервер
3. TTL=300 сек — клиент будет кэшировать ответ 5 минут

ПАТТЕРН: Anycast — один IP адрес анонсируется из множества локаций.
Снижает latency на 50-200ms за счёт географической близости.`,
        duration: 3200,
        realLatency: 5,
        payload: { ip: '104.16.123.96', ttl: 300, location: 'Frankfurt Edge' },
      },
      {
        id: 'step-3',
        fromNode: 'client',
        toNode: 'cdn',
        edgeId: 'e-client-cdn',
        type: 'request',
        title: 'Client → CDN Edge',
        description: 'Клиент подключается к CDN по полученному IP',
        detailedInfo: `ЗАЧЕМ: CDN кэширует статику и защищает origin от DDoS.

ЧТО ПРОИСХОДИТ:
1. Клиент открывает HTTPS соединение с CDN edge
2. TLS termination на edge (экономит латентность)
3. CDN проверяет кэш — для POST запросов всегда cache miss
4. Добавляет заголовки: CF-Ray (трейсинг), CF-IPCountry (геолокация)

ПАТТЕРН: Edge Computing — обработка ближе к пользователю.
WAF (Web Application Firewall) фильтрует вредоносные запросы.`,
        duration: 4000,
        realLatency: 8,
        payload: { method: 'POST', path: '/api/v1/orders', headers: { 'CF-Ray': '8a1b2c3d', 'CF-IPCountry': 'DE' } },
      },
      {
        id: 'step-4',
        fromNode: 'cdn',
        toNode: 'global-lb',
        edgeId: 'e-cdn-global-lb',
        type: 'request',
        title: 'CDN → Global Load Balancer',
        description: 'CDN проксирует запрос на origin',
        detailedInfo: `ЗАЧЕМ: CDN не может обработать POST — нужен origin сервер.

ЧТО ПРОИСХОДИТ:
1. CDN определяет что это динамический запрос
2. Проксирует на Global Load Balancer
3. GLB выберет оптимальный датацентр

ПАТТЕРН: CDN как reverse proxy для динамических запросов.`,
        duration: 2400,
        realLatency: 3,
        payload: { cached: false, forwarded: true },
      },
      {
        id: 'step-5',
        fromNode: 'global-lb',
        toNode: 'dc-eu',
        edgeId: 'e-global-lb-dc-eu',
        type: 'request',
        title: 'Выбор Data Center',
        description: 'Global LB выбирает оптимальный датацентр',
        detailedInfo: `ЗАЧЕМ: Распределить нагрузку между ДЦ и обеспечить отказоустойчивость.

ЧТО ПРОИСХОДИТ:
1. GLB проверяет health check всех ДЦ (каждые 10 сек)
2. Анализирует метрики: latency, load, capacity
3. Учитывает геолокацию клиента (из CF-IPCountry)
4. Выбирает EU DC как ближайший и здоровый

ПАТТЕРН: Global Load Balancing — распределение между регионами.
Active-Active — все ДЦ обслуживают трафик (vs Active-Passive).`,
        duration: 2400,
        realLatency: 2,
        payload: { selectedDC: 'eu-central-1', reason: 'lowest_latency', latency: '12ms', health: 'healthy' },
      },
      {
        id: 'step-6',
        fromNode: 'dc-eu',
        toNode: 'dc-eu-lb',
        edgeId: 'e-dc-eu-lb',
        type: 'request',
        title: 'Вход в Data Center',
        description: 'Запрос попадает на региональный балансировщик',
        detailedInfo: `ЗАЧЕМ: Распределить нагрузку внутри ДЦ между инстансами.

ЧТО ПРОИСХОДИТ:
1. Трафик проходит через Border Router
2. Firewall проверяет IP whitelist и базовые правила
3. Regional LB принимает TCP соединение

ПАТТЕРН: Perimeter Security — защита на границе сети.
DMZ (Demilitarized Zone) — буферная зона между интернетом и внутренней сетью.`,
        duration: 800,
        realLatency: 1,
      },
      {
        id: 'step-7',
        fromNode: 'dc-eu-lb',
        toNode: 'dc-eu-gw',
        edgeId: 'e-dc-eu-lb-gw',
        type: 'request',
        title: 'Regional LB → API Gateway',
        description: 'Балансировка на один из инстансов API Gateway',
        detailedInfo: `ЗАЧЕМ: Равномерно распределить нагрузку между API Gateway инстансами.

ЧТО ПРОИСХОДИТ:
1. HAProxy применяет алгоритм Least Connections
2. Выбирает инстанс с минимальным числом активных соединений
3. Поддерживает connection pooling для эффективности
4. Health check отключает нездоровые инстансы

ПАТТЕРН: L7 Load Balancing — балансировка на уровне HTTP.
Sticky Sessions не используются — stateless архитектура.`,
        duration: 1200,
        realLatency: 2,
        payload: { algorithm: 'least_connections', targetInstance: 'api-gw-03', activeConnections: 127 },
      },

      // ========== АВТОРИЗАЦИЯ ==========
      {
        id: 'step-8',
        fromNode: 'dc-eu-gw',
        toNode: 'dc-eu-auth',
        edgeId: 'e-dc-eu-gw-auth',
        type: 'request',
        title: 'JWT Token Validation',
        description: 'API Gateway валидирует токен локально + проверяет blacklist',
        detailedInfo: `ЗАЧЕМ: Убедиться что запрос от авторизованного пользователя.

ЧТО ПРОИСХОДИТ:
1. API Gateway извлекает Bearer token из Authorization header
2. ЛОКАЛЬНАЯ проверка (без сети, ~1ms):
   - Подпись RS256 проверяется публичным ключом (cached)
   - Expiration (exp) — не истёк ли токен
   - Issuer (iss), Audience (aud) — валидность claims
3. Если подпись OK → проверяем blacklist в Auth Service

ПАТТЕРН: Token-based Authentication — stateless аутентификация.
В BigTech 99% запросов валидируются локально без похода в Auth Service.`,
        duration: 400,
        realLatency: 1,
        payload: { token: 'eyJhbGciOiJSUzI1NiIs...', localChecks: ['signature', 'expiration', 'issuer'] },
      },
      {
        id: 'step-9',
        fromNode: 'dc-eu-auth',
        toNode: 'dc-eu-session',
        edgeId: 'e-dc-eu-auth-session',
        type: 'request',
        title: 'Token Blacklist Check (Redis)',
        description: 'Проверка что токен не был отозван (logout/security)',
        detailedInfo: `ЗАЧЕМ: JWT нельзя инвалидировать без blacklist (токен валиден до exp).

ЧТО ПРОИСХОДИТ:
1. SISMEMBER blacklist:tokens <jti> — проверка в Set (~0.1ms)
2. Если токен в blacklist → 401 Unauthorized
3. Bloom Filter может использоваться для оптимизации

ПАТТЕРН: Token Blacklisting — единственный способ отзыва JWT.
Redis Set с TTL = max token lifetime (обычно 24h).`,
        duration: 240,
        realLatency: 0.5,
        payload: { operation: 'SISMEMBER', key: 'blacklist:tokens', jti: 'abc123-xyz789' },
      },
      {
        id: 'step-10',
        fromNode: 'dc-eu-session',
        toNode: 'dc-eu-auth',
        edgeId: 'e-dc-eu-auth-session',
        reverse: true,
        type: 'response',
        title: 'Token NOT in Blacklist',
        description: 'Redis: токен не отозван, всё OK',
        detailedInfo: `ЗАЧЕМ: Подтвердить что токен не был отозван.

ЧТО ПРОИСХОДИТ:
1. SISMEMBER вернул 0 → токен НЕ в blacklist
2. Это значит пользователь не делал logout
3. Токен валиден — можно продолжать

РЕЗУЛЬТАТ: Аутентификация завершена.`,
        duration: 160,
        realLatency: 0.1,
        payload: { inBlacklist: false, responseTime: '0.1ms' },
      },
      {
        id: 'step-11',
        fromNode: 'dc-eu-auth',
        toNode: 'dc-eu-gw',
        edgeId: 'e-dc-eu-gw-auth',
        reverse: true,
        type: 'response',
        title: 'Auth OK + JWT Claims Extracted',
        description: 'User context извлечён из JWT claims (stateless)',
        detailedInfo: `ЗАЧЕМ: Передать информацию о пользователе downstream сервисам.

ЧТО ПРОИСХОДИТ:
1. User context извлекается из JWT claims (НЕ из БД!)
2. Claims содержат: sub (userId), roles, permissions, tenant
3. API Gateway добавляет в headers: X-User-Id, X-Roles, X-Permissions

ПАТТЕРН: Claims-based Identity — все данные в токене.
Zero Trust: внутри mesh сервисы проверяют mTLS + headers.`,
        duration: 240,
        realLatency: 1,
        payload: { userId: 'user_123', permissions: ['orders:create', 'orders:read'] },
      },

      // ========== RATE LIMITING ==========
      {
        id: 'step-12',
        fromNode: 'dc-eu-gw',
        toNode: 'dc-eu-ratelimit',
        edgeId: 'e-dc-eu-gw-ratelimit',
        type: 'request',
        title: 'Rate Limit Check',
        description: 'API Gateway проверяет лимиты запросов',
        detailedInfo: `ЗАЧЕМ: Защита от перегрузки и DDoS, fair usage между пользователями.

ЧТО ПРОИСХОДИТ:
1. Rate Limiter получает запрос с X-User-Id
2. Проверяет Redis: текущий счётчик для user_123
3. Применяет Token Bucket алгоритм
4. Лимиты: 100 req/min для обычных пользователей

ПАТТЕРН: Distributed Rate Limiting — единый счётчик для всех инстансов.`,
        duration: 400,
        realLatency: 1,
        payload: { userId: 'user_123', endpoint: '/api/v1/orders', currentRate: 45, limit: 100 },
      },
      {
        id: 'step-13',
        fromNode: 'dc-eu-ratelimit',
        toNode: 'dc-eu-cache',
        edgeId: 'e-dc-eu-ratelimit-cache',
        type: 'request',
        title: 'Rate Limiter → Redis',
        description: 'Проверка и инкремент счётчика в Redis',
        detailedInfo: `ЗАЧЕМ: Централизованное хранение счётчиков для всех API Gateway инстансов.

ЧТО ПРОИСХОДИТ:
1. INCR rate:user_123:orders (атомарный инкремент)
2. EXPIRE устанавливает TTL=60 сек (sliding window)
3. Если счётчик > limit → возврат 429 Too Many Requests

ПАТТЕРН: Sliding Window Rate Limiting в Redis.`,
        duration: 240,
        realLatency: 0.5,
        payload: { key: 'rate:user_123:orders', operation: 'INCR', ttl: 60 },
      },
      {
        id: 'step-14',
        fromNode: 'dc-eu-cache',
        toNode: 'dc-eu-ratelimit',
        edgeId: 'e-dc-eu-ratelimit-cache',
        reverse: true,
        type: 'response',
        title: 'Rate Limit OK',
        description: 'Redis подтверждает что лимит не превышен',
        detailedInfo: `ЗАЧЕМ: Разрешить или заблокировать запрос.

ЧТО ПРОИСХОДИТ:
1. Redis вернул текущее значение счётчика: 46
2. 46 < 100 (лимит) → запрос разрешён
3. Добавляются headers: X-RateLimit-Remaining: 54

РЕЗУЛЬТАТ: Запрос прошёл rate limiting.`,
        duration: 160,
        realLatency: 0.1,
        payload: { allowed: true, current: 46, limit: 100, remaining: 54 },
      },
      {
        id: 'step-15',
        fromNode: 'dc-eu-ratelimit',
        toNode: 'dc-eu-gw',
        edgeId: 'e-dc-eu-gw-ratelimit',
        reverse: true,
        type: 'response',
        title: 'Rate Limit Passed',
        description: 'Rate Limiter разрешает запрос',
        detailedInfo: `ЗАЧЕМ: API Gateway должен знать результат проверки.

ЧТО ПРОИСХОДИТ:
1. Rate Limiter возвращает OK
2. API Gateway добавляет rate limit headers в response
3. Запрос продолжает путь в Kubernetes

ПАТТЕРН: API Gateway как Policy Enforcement Point.`,
        duration: 160,
        realLatency: 0.5,
        payload: { status: 'allowed' },
      },

      // ========== K8S ROUTING ==========
      {
        id: 'step-16',
        fromNode: 'dc-eu-gw',
        toNode: 'dc-eu-ingress',
        edgeId: 'e-dc-eu-gw-ingress',
        type: 'request',
        title: 'Route to Kubernetes',
        description: 'API Gateway маршрутизирует в K8s кластер',
        detailedInfo: `ЗАЧЕМ: API Gateway — точка входа, K8s — среда выполнения сервисов.

ЧТО ПРОИСХОДИТ:
1. API Gateway определяет target service по path (/api/v1/orders → Order Service)
2. Добавляет headers: X-User-Id, X-Request-Id, X-Trace-Id
3. Проксирует в K8s Ingress Controller

ПАТТЕРН: API Gateway Pattern — единая точка входа.`,
        duration: 1200,
        realLatency: 2,
        payload: { targetService: 'order-service', headers: { 'X-User-Id': 'user_123', 'X-Trace-Id': 'trace_abc123' } },
      },
      {
        id: 'step-17',
        fromNode: 'dc-eu-ingress',
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-ingress-order-svc',
        type: 'request',
        title: 'K8s Ingress → Order Service',
        description: 'NGINX Ingress роутит на Service по правилам',
        detailedInfo: `ЗАЧЕМ: Ingress — L7 роутер внутри Kubernetes.

ЧТО ПРОИСХОДИТ:
1. NGINX Ingress сопоставляет path с Ingress Rule
2. Правило: /api/v1/orders/* → order-service:8080
3. Направляет на ClusterIP Service

ПАТТЕРН: Ingress Controller — внешний доступ к сервисам K8s.`,
        duration: 800,
        realLatency: 1,
        payload: { ingressRule: 'orders-ingress', path: '/api/v1/orders', targetPort: 8080 },
      },
      {
        id: 'step-18',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-order-pod',
        edgeId: 'e-dc-eu-order-svc-pod',
        type: 'request',
        title: 'K8s Service → Pod',
        description: 'Service выбирает здоровый Pod',
        detailedInfo: `ЗАЧЕМ: Service — абстракция над множеством Pod реплик.

ЧТО ПРОИСХОДИТ:
1. K8s Service (ClusterIP) получает запрос
2. kube-proxy выбирает Pod по алгоритму (round-robin)
3. Проверяет readiness probe — Pod должен быть Ready

ПАТТЕРН: Service Discovery внутри K8s.`,
        duration: 400,
        realLatency: 0.5,
        payload: { selectedPod: 'order-pod-7b4f9-x2k4n', replicas: 3, readyReplicas: 3 },
      },

      // ========== ORDER SERVICE LOGIC ==========
      {
        id: 'step-19',
        fromNode: 'dc-eu-order-pod',
        toNode: 'dc-eu-order-db',
        edgeId: 'e-dc-eu-order-pod-db',
        type: 'request',
        title: 'Create Order (PENDING)',
        description: 'Сохранение заказа в БД со статусом PENDING',
        detailedInfo: `ЗАЧЕМ: Зафиксировать намерение создать заказ до начала SAGA.

ЧТО ПРОИСХОДИТ:
1. Валидация входных данных (items, quantities, prices)
2. Расчёт total amount
3. INSERT в orders таблицу со статусом PENDING
4. Генерация orderId (UUID v4)

ПАТТЕРН: SAGA Pattern начинается — это первый шаг.
Статус PENDING — заказ создан, но не подтверждён.`,
        duration: 1600,
        realLatency: 25,
        payload: { orderId: 'order_789', status: 'PENDING', items: [{ productId: 'prod_456', qty: 2, price: 49.99 }], total: 99.98 },
      },
      {
        id: 'step-20',
        fromNode: 'dc-eu-order-db',
        toNode: 'dc-eu-order-pod',
        edgeId: 'e-dc-eu-order-pod-db',
        reverse: true,
        type: 'response',
        title: 'Order Persisted',
        description: 'PostgreSQL подтверждает сохранение',
        detailedInfo: `ЗАЧЕМ: Гарантировать что заказ сохранён перед продолжением.

ЧТО ПРОИСХОДИТ:
1. PostgreSQL выполняет INSERT в транзакции
2. WAL (Write-Ahead Log) фиксирует изменение
3. fsync на диск — данные durable
4. Возвращает подтверждение с orderId

ПАТТЕРН: ACID транзакция.`,
        duration: 1200,
        realLatency: 20,
        payload: { success: true, orderId: 'order_789', createdAt: '2024-01-15T10:30:00Z' },
      },

      // ========== SAGA: PUBLISH TO KAFKA ==========
      {
        id: 'step-21',
        fromNode: 'dc-eu-order-pod',
        toNode: 'dc-eu-kafka',
        edgeId: 'e-dc-eu-order-pod-kafka',
        type: 'async',
        title: 'Publish OrderCreated Event',
        description: 'Событие в domain topic orders.created',
        detailedInfo: `ЗАЧЕМ: Запустить асинхронную обработку другими сервисами.

ЧТО ПРОИСХОДИТ:
1. Order Service публикует событие в topic: orders.created
2. Key: order_789 (партиционирование по orderId)
3. acks=all — запись на все реплики перед подтверждением

ПАТТЕРН: Event-Driven Architecture — коммуникация через события.
SAGA Choreography — сервисы подписаны на нужные topics.`,
        duration: 800,
        realLatency: 5,
        payload: { topic: 'orders.created', key: 'order_789', partition: 3 },
      },

      // ========== SCHEMA VALIDATION ==========
      {
        id: 'step-21a',
        fromNode: 'dc-eu-kafka',
        toNode: 'dc-eu-schema-registry',
        edgeId: 'e-dc-eu-kafka-schema',
        type: 'request',
        title: 'Schema Validation',
        description: 'Kafka проверяет схему события в Schema Registry',
        detailedInfo: `ЗАЧЕМ: Гарантировать что все producers и consumers используют совместимые схемы.

ЧТО ПРОИСХОДИТ:
1. Producer сериализует событие в Avro/Protobuf формат
2. Kafka отправляет schema fingerprint в Schema Registry
3. Registry проверяет: существует ли схема? совместима ли с предыдущими версиями?
4. Если схема новая — регистрирует с новым schema_id

ПАТТЕРН: Schema Registry — централизованное управление контрактами.
Backward/Forward Compatibility — защита от breaking changes.`,
        duration: 400,
        realLatency: 2,
        payload: { schemaType: 'AVRO', subject: 'orders.created-value', action: 'validate' },
      },
      {
        id: 'step-21b',
        fromNode: 'dc-eu-schema-registry',
        toNode: 'dc-eu-kafka',
        edgeId: 'e-dc-eu-kafka-schema',
        reverse: true,
        type: 'response',
        title: 'Schema Valid (ID: 42)',
        description: 'Schema Registry подтверждает валидность схемы',
        detailedInfo: `ЗАЧЕМ: Разрешить запись сообщения в topic.

ЧТО ПРОИСХОДИТ:
1. Schema Registry вернул schema_id=42
2. Этот ID записывается в header сообщения
3. Consumers используют schema_id для десериализации
4. Сообщение записано в partition 3

ПАТТЕРН: Schema Evolution — версионирование схем.
Consumers могут читать старые сообщения новой схемой (и наоборот).`,
        duration: 200,
        realLatency: 1,
        payload: { schemaId: 42, version: 3, compatible: true },
      },

      // ========== SAGA: INVENTORY ==========
      {
        id: 'step-22',
        fromNode: 'dc-eu-kafka',
        toNode: 'dc-eu-inventory-pod',
        edgeId: 'e-dc-eu-inventory-pod-kafka',
        reverse: true,
        type: 'async',
        title: 'Inventory Consumes Event',
        description: 'Consumer group читает из orders.created topic',
        detailedInfo: `ЗАЧЕМ: Проверить и зарезервировать товар на складе.

ЧТО ПРОИСХОДИТ:
1. Consumer group "inventory-orders-consumer" подписан на orders.created
2. Kafka доставляет событие одному consumer в группе
3. Idempotency key (orderId) предотвращает дублирование

ПАТТЕРН: Consumer Group — параллельная обработка партиций.`,
        duration: 1200,
        realLatency: 10,
        payload: { consumerGroup: 'inventory-orders-consumer', topic: 'orders.created' },
      },
      {
        id: 'step-23',
        fromNode: 'dc-eu-inventory-pod',
        toNode: 'dc-eu-inventory-db',
        edgeId: 'e-dc-eu-inventory-pod-db',
        type: 'request',
        title: 'Reserve Stock',
        description: 'Резервирование товара с блокировкой',
        detailedInfo: `ЗАЧЕМ: Гарантировать что товар не будет продан дважды.

ЧТО ПРОИСХОДИТ:
1. SELECT FOR UPDATE — блокировка строки товара
2. Проверка: available_qty >= requested_qty
3. UPDATE: available_qty -= 2, reserved_qty += 2

ПАТТЕРН: Pessimistic Locking — блокировка на время операции.
Reservation Pattern — резервирование ресурса до подтверждения.`,
        duration: 1600,
        realLatency: 30,
        payload: { productId: 'prod_456', requestedQty: 2, action: 'reserve' },
      },
      {
        id: 'step-24',
        fromNode: 'dc-eu-inventory-db',
        toNode: 'dc-eu-inventory-pod',
        edgeId: 'e-dc-eu-inventory-pod-db',
        reverse: true,
        type: 'response',
        title: 'Stock Reserved Successfully',
        description: 'Товар зарезервирован, остаток обновлён',
        detailedInfo: `ЗАЧЕМ: Подтвердить резервацию для продолжения SAGA.

ЧТО ПРОИСХОДИТ:
1. Транзакция успешно завершена (COMMIT)
2. available_qty уменьшен на 2
3. reserved_qty увеличен на 2

РЕЗУЛЬТАТ: Товар заблокирован для этого заказа.`,
        duration: 800,
        realLatency: 15,
        payload: { reserved: true, productId: 'prod_456', newAvailable: 48 },
      },
      {
        id: 'step-25',
        fromNode: 'dc-eu-inventory-pod',
        toNode: 'dc-eu-kafka',
        edgeId: 'e-dc-eu-inventory-pod-kafka',
        type: 'async',
        title: 'Publish InventoryReserved',
        description: 'Событие в topic inventory.reserved',
        detailedInfo: `ЗАЧЕМ: Уведомить другие сервисы что inventory step выполнен.

ЧТО ПРОИСХОДИТ:
1. Публикация в topic: inventory.reserved
2. Payment consumer group подписан на этот topic
3. Correlation ID (orderId) связывает все события SAGA

ПАТТЕРН: Domain Events — inventory.reserved, inventory.released.`,
        duration: 800,
        realLatency: 5,
        payload: { topic: 'inventory.reserved', key: 'order_789' },
      },

      // ========== SAGA: PAYMENT ==========
      {
        id: 'step-26',
        fromNode: 'dc-eu-kafka',
        toNode: 'dc-eu-payment-pod',
        edgeId: 'e-dc-eu-payment-pod-kafka',
        reverse: true,
        type: 'async',
        title: 'Payment Service Consumes',
        description: 'Consumer читает из inventory.reserved topic',
        detailedInfo: `ЗАЧЕМ: Начать обработку платежа после успешной резервации.

ЧТО ПРОИСХОДИТ:
1. Consumer group "payment-inventory-consumer" подписан на inventory.reserved
2. Event содержит orderId, amount, correlationId
3. Payment Service начинает процесс оплаты

ПАТТЕРН: SAGA продолжается — inventory OK, теперь payment.`,
        duration: 1200,
        realLatency: 10,
        payload: { consumerGroup: 'payment-inventory-consumer', topic: 'inventory.reserved', amountToPay: 99.98 },
      },
      {
        id: 'step-27',
        fromNode: 'dc-eu-payment-pod',
        toNode: 'dc-eu-payment-db',
        edgeId: 'e-dc-eu-payment-pod-db',
        type: 'request',
        title: 'Save Payment Transaction',
        description: 'Запись транзакции в Payment DB перед вызовом Stripe',
        detailedInfo: `ЗАЧЕМ: Audit trail — все платёжные операции должны логироваться.

ЧТО ПРОИСХОДИТ:
1. INSERT в transactions: orderId, amount, status='PENDING'
2. Idempotency key сохраняется для защиты от дублей
3. Только после записи — вызов Stripe API

ПАТТЕРН: Write-Ahead Logging для платежей.`,
        duration: 800,
        realLatency: 15,
        payload: { orderId: 'order_789', amount: 99.98, status: 'PENDING' },
      },
      {
        id: 'step-28',
        fromNode: 'dc-eu-payment-db',
        toNode: 'dc-eu-payment-pod',
        edgeId: 'e-dc-eu-payment-pod-db',
        reverse: true,
        type: 'response',
        title: 'Transaction Logged + Stripe OK',
        description: 'Payment DB подтвердила, Stripe авторизовал',
        detailedInfo: `ЗАЧЕМ: Зафиксировать результат вызова Stripe API.

ЧТО ПРОИСХОДИТ:
1. Stripe API вызван (authorize) — ~500ms
2. Stripe вернул transactionId и status
3. UPDATE transactions SET stripe_id, status='AUTHORIZED'

ПАТТЕРН: External Service Integration.`,
        duration: 4000,
        realLatency: 350,
        payload: { stripeTransactionId: 'pi_3abc123', status: 'AUTHORIZED' },
      },
      {
        id: 'step-29',
        fromNode: 'dc-eu-payment-pod',
        toNode: 'dc-eu-kafka',
        edgeId: 'e-dc-eu-payment-pod-kafka',
        type: 'async',
        title: 'Publish PaymentCompleted',
        description: 'Событие в topic payments.completed',
        detailedInfo: `ЗАЧЕМ: Уведомить другие сервисы об успешной оплате.

ЧТО ПРОИСХОДИТ:
1. Payment транзакция сохранена в БД ✓
2. Stripe авторизовал платёж ✓
3. Публикуем событие в topic: payments.completed

ПАТТЕРН: Transactional Outbox — сначала БД, потом событие.`,
        duration: 800,
        realLatency: 5,
        payload: { topic: 'payments.completed', key: 'order_789', amount: 99.98 },
      },

      // ========== SAGA: COMPLETE ORDER ==========
      {
        id: 'step-30',
        fromNode: 'dc-eu-kafka',
        toNode: 'dc-eu-order-pod',
        edgeId: 'e-dc-eu-order-pod-kafka',
        reverse: true,
        type: 'async',
        title: 'Order Service Receives Payment Event',
        description: 'Consumer читает из payments.completed topic',
        detailedInfo: `ЗАЧЕМ: Финализировать заказ после успешной оплаты.

ЧТО ПРОИСХОДИТ:
1. Consumer group "order-payments-consumer" подписан на payments.completed
2. Все шаги SAGA успешны: order ✓, inventory ✓, payment ✓
3. Статус меняется на CONFIRMED

ПАТТЕРН: SAGA Completion — все participants подтвердили.`,
        duration: 800,
        realLatency: 10,
        payload: { consumerGroup: 'order-payments-consumer', topic: 'payments.completed' },
      },
      {
        id: 'step-31',
        fromNode: 'dc-eu-order-pod',
        toNode: 'dc-eu-order-db',
        edgeId: 'e-dc-eu-order-pod-db',
        type: 'request',
        title: 'Update Order → CONFIRMED',
        description: 'Финальное обновление статуса заказа',
        detailedInfo: `ЗАЧЕМ: Зафиксировать успешное завершение SAGA.

ЧТО ПРОИСХОДИТ:
1. UPDATE orders SET status = 'CONFIRMED' WHERE id = order_789
2. Добавление payment_transaction_id
3. Установка confirmed_at timestamp

ПАТТЕРН: State Machine — PENDING → CONFIRMED.
SAGA успешно завершена!`,
        duration: 1200,
        realLatency: 20,
        payload: { orderId: 'order_789', newStatus: 'CONFIRMED' },
      },
      {
        id: 'step-32',
        fromNode: 'dc-eu-order-db',
        toNode: 'dc-eu-order-pod',
        edgeId: 'e-dc-eu-order-pod-db',
        reverse: true,
        type: 'response',
        title: 'Order Status Updated',
        description: 'PostgreSQL подтверждает обновление статуса',
        detailedInfo: `ЗАЧЕМ: Подтвердить что статус заказа изменён.

ЧТО ПРОИСХОДИТ:
1. UPDATE завершён успешно (1 row affected)
2. Транзакция закоммичена
3. Order Service готов формировать response

РЕЗУЛЬТАТ: Заказ в статусе CONFIRMED.`,
        duration: 400,
        realLatency: 5,
        payload: { rowsAffected: 1, newStatus: 'CONFIRMED' },
      },

      // ========== INTER-SERVICE CALL ==========
      {
        id: 'step-33',
        fromNode: 'dc-eu-order-pod',
        toNode: 'dc-eu-user-pod',
        edgeId: 'e-dc-eu-order-user-mesh',
        type: 'request',
        title: 'Order Pod → User Pod (Service Mesh)',
        description: 'Межсервисный вызов через Envoy sidecar proxies',
        detailedInfo: `ЗАЧЕМ: Получить данные пользователя для email уведомления.

ЧТО ПРОИСХОДИТ:
1. Order Pod делает gRPC вызов GetUser
2. Envoy sidecar перехватывает трафик
3. mTLS: взаимная аутентификация через SPIFFE IDs
4. Circuit Breaker защищает от каскадных отказов

ПАТТЕРН: Service Mesh — Pod-to-Pod через sidecar proxies.`,
        duration: 640,
        realLatency: 3,
        payload: { protocol: 'gRPC', method: 'GetUser', mtls: true },
      },
      {
        id: 'step-34',
        fromNode: 'dc-eu-user-pod',
        toNode: 'dc-eu-cache',
        edgeId: 'e-dc-eu-user-pod-cache',
        type: 'request',
        title: 'User Pod → Redis Cache',
        description: 'Проверка кэша',
        detailedInfo: `ЗАЧЕМ: Избежать запроса в БД если данные в кэше.

ЧТО ПРОИСХОДИТ:
1. Redis: GET user:user_123
2. TTL: 1 час — баланс между свежестью и нагрузкой на БД

ПАТТЕРН: Cache-Aside (Lazy Loading).`,
        duration: 400,
        realLatency: 0.5,
        payload: { key: 'v1:user:user_123', operation: 'GET' },
      },
      {
        id: 'step-35',
        fromNode: 'dc-eu-cache',
        toNode: 'dc-eu-user-pod',
        edgeId: 'e-dc-eu-user-pod-cache',
        reverse: true,
        type: 'response',
        title: 'Cache HIT',
        description: 'Redis: данные найдены в кэше',
        detailedInfo: `ЗАЧЕМ: Быстро получить данные без обращения к БД.

ЧТО ПРОИСХОДИТ:
1. Redis вернул данные пользователя
2. User Service десериализует
3. Ответ готов за ~2ms (vs ~50ms из БД)

ПАТТЕРН: Cache-Aside — кэш прогрет.`,
        duration: 80,
        realLatency: 0.5,
        payload: { hit: true, userId: 'user_123', email: 'john@example.com' },
      },
      {
        id: 'step-36',
        fromNode: 'dc-eu-user-pod',
        toNode: 'dc-eu-order-pod',
        edgeId: 'e-dc-eu-order-user-mesh',
        reverse: true,
        type: 'response',
        title: 'User Pod → Order Pod (Response)',
        description: 'User данные возвращаются в Order Service',
        detailedInfo: `ЗАЧЕМ: Order Service получил данные для email уведомления.

ЧТО ПРОИСХОДИТ:
1. User Pod формирует gRPC response
2. Envoy sidecar отправляет ответ через mesh
3. Order Service может отправить email уведомление

РЕЗУЛЬТАТ: User данные получены за ~5ms (cache hit).`,
        duration: 400,
        realLatency: 2,
        payload: { email: 'john@example.com', name: 'John Doe' },
      },

      // ========== OBSERVABILITY ==========
      {
        id: 'step-36a',
        fromNode: 'dc-eu-order-pod',
        toNode: 'dc-eu-jaeger',
        edgeId: 'e-dc-eu-pods-jaeger',
        type: 'async',
        title: 'Report Trace Spans',
        description: 'Envoy sidecar отправляет trace spans в Jaeger',
        detailedInfo: `ЗАЧЕМ: Distributed Tracing — отслеживание запроса через все сервисы.

ЧТО ПРОИСХОДИТ:
1. Каждый sidecar собирает spans: start_time, duration, status
2. Spans связаны через traceId (X-Trace-Id из headers)
3. Батчами отправляются в Jaeger collector
4. Jaeger строит полную картину запроса

ПАТТЕРН: Distributed Tracing (OpenTelemetry/Jaeger).
Позволяет найти bottlenecks и понять latency breakdown.

TRACE SPANS В ЭТОМ ЗАПРОСЕ:
• API Gateway: 2ms
• Auth Service: 1.5ms
• Order Service: 1200ms (DB + Kafka)
• User Service: 5ms (cache hit)
Total: ~1.5s`,
        duration: 200,
        realLatency: 1,
        payload: { traceId: 'trace_abc123', totalSpans: 12, services: ['api-gw', 'auth', 'order', 'user', 'inventory', 'payment'] },
      },
      {
        id: 'step-36b',
        fromNode: 'dc-eu-order-pod',
        toNode: 'dc-eu-prometheus',
        edgeId: 'e-dc-eu-pods-prometheus',
        type: 'async',
        title: 'Export Metrics',
        description: 'Prometheus scrapes метрики с /metrics endpoint',
        detailedInfo: `ЗАЧЕМ: Мониторинг и alerting — SRE должны видеть здоровье системы.

ЧТО ПРОИСХОДИТ:
1. Envoy sidecar экспортирует метрики на :15090/stats/prometheus
2. Prometheus каждые 15 сек делает scrape всех pods
3. Метрики записываются в time-series DB

КЛЮЧЕВЫЕ МЕТРИКИ:
• request_duration_seconds{service="order"} = 1.2
• request_total{service="order", status="201"} ++
• kafka_producer_messages_total{topic="orders.created"} ++
• db_query_duration_seconds{query="insert_order"} = 0.025

ПАТТЕРН: RED Metrics (Rate, Errors, Duration).
SLO: 99.9% запросов < 2 сек, error rate < 0.1%`,
        duration: 100,
        realLatency: 0,
        payload: { metricsExported: ['request_duration', 'request_total', 'error_rate'], scrapeInterval: '15s' },
      },

      // ========== RESPONSE TO CLIENT (обратный путь) ==========
      {
        id: 'step-37',
        fromNode: 'dc-eu-order-pod',
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-order-svc-pod',
        reverse: true,
        type: 'response',
        title: 'Order Pod → K8s Service',
        description: 'Response начинает обратный путь',
        detailedInfo: `ЗАЧЕМ: Response должен пройти обратно через всю инфраструктуру.

ЧТО ПРОИСХОДИТ:
1. Order Pod формирует HTTP response
2. Envoy sidecar добавляет response headers
3. Response идёт на K8s Service endpoint

ПАТТЕРН: Response проходит тот же путь что и request.`,
        duration: 240,
        realLatency: 0.5,
        payload: { orderId: 'order_789', status: 'CONFIRMED', responseCode: 201 },
      },
      {
        id: 'step-38',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-ingress',
        edgeId: 'e-dc-eu-ingress-order-svc',
        reverse: true,
        type: 'response',
        title: 'K8s Service → Ingress',
        description: 'Response проходит через Ingress Controller',
        detailedInfo: `ЗАЧЕМ: Ingress собирает метрики и логи response.

ЧТО ПРОИСХОДИТ:
1. NGINX Ingress получает response от upstream
2. Логирует: response_time, status_code
3. Передаёт на API Gateway

ПАТТЕРН: Observability на каждом уровне.`,
        duration: 160,
        realLatency: 0.5,
        payload: { upstreamResponseTime: '1.2s', statusCode: 201 },
      },
      {
        id: 'step-39',
        fromNode: 'dc-eu-ingress',
        toNode: 'dc-eu-gw',
        edgeId: 'e-dc-eu-gw-ingress',
        reverse: true,
        type: 'response',
        title: 'Ingress → API Gateway',
        description: 'API Gateway добавляет финальные headers',
        detailedInfo: `ЗАЧЕМ: API Gateway — последняя точка обработки перед выходом из ДЦ.

ЧТО ПРОИСХОДИТ:
1. API Gateway получает response
2. Добавляет headers: X-Request-Id, X-Response-Time
3. Rate limit headers: X-RateLimit-Remaining

ПАТТЕРН: Response Enrichment.`,
        duration: 240,
        realLatency: 1,
        payload: { headers: { 'X-Request-Id': 'req_abc123', 'X-Response-Time': '1.3s' } },
      },
      {
        id: 'step-40',
        fromNode: 'dc-eu-gw',
        toNode: 'dc-eu-lb',
        edgeId: 'e-dc-eu-lb-gw',
        reverse: true,
        type: 'response',
        title: 'API Gateway → Regional LB',
        description: 'Response выходит из API слоя',
        detailedInfo: `ЗАЧЕМ: LB записывает метрики успешности backend.

ЧТО ПРОИСХОДИТ:
1. HAProxy получает response
2. Обновляет статистику backend (success rate)
3. Передаёт на DC border

ПАТТЕРН: Health monitoring через response codes.`,
        duration: 160,
        realLatency: 0.5,
        payload: { backendResponseTime: '1.35s' },
      },
      {
        id: 'step-41',
        fromNode: 'dc-eu-lb',
        toNode: 'dc-eu',
        edgeId: 'e-dc-eu-lb',
        reverse: true,
        type: 'response',
        title: 'Regional LB → DC Border',
        description: 'Response выходит из внутренней сети ДЦ',
        detailedInfo: `ЗАЧЕМ: Трафик проходит через border router ДЦ.

ЧТО ПРОИСХОДИТ:
1. Regional LB отправляет response
2. Border router маршрутизирует наружу

ПАТТЕРН: Network boundary — выход из private network.`,
        duration: 80,
        realLatency: 0.5,
        payload: { direction: 'egress' },
      },
      {
        id: 'step-42',
        fromNode: 'dc-eu',
        toNode: 'global-lb',
        edgeId: 'e-global-lb-dc-eu',
        reverse: true,
        type: 'response',
        title: 'DC → Global LB',
        description: 'Response возвращается на Global Load Balancer',
        detailedInfo: `ЗАЧЕМ: GLB отслеживает latency каждого ДЦ.

ЧТО ПРОИСХОДИТ:
1. Global LB получает response от EU DC
2. Записывает метрику: response_time для health scoring
3. Передаёт response дальше к CDN

ПАТТЕРН: Response metrics для адаптивной балансировки.`,
        duration: 160,
        realLatency: 1,
        payload: { dcResponseTime: '1.4s', dcHealth: 'healthy' },
      },
      {
        id: 'step-43',
        fromNode: 'global-lb',
        toNode: 'cdn',
        edgeId: 'e-cdn-global-lb',
        reverse: true,
        type: 'response',
        title: 'Global LB → CDN Edge',
        description: 'Response достигает CDN edge server',
        detailedInfo: `ЗАЧЕМ: CDN может кэшировать GET responses.

ЧТО ПРОИСХОДИТ:
1. CDN получает response от origin через GLB
2. Для POST — не кэшируется (Cache-Control: no-store)
3. Сжимает response (gzip/brotli)

ПАТТЕРН: Edge optimization.`,
        duration: 400,
        realLatency: 3,
        payload: { cached: false, compressed: true },
      },
      {
        id: 'step-44',
        fromNode: 'cdn',
        toNode: 'client',
        edgeId: 'e-client-cdn',
        reverse: true,
        type: 'response',
        title: 'CDN → Client (Final Response)',
        description: 'Клиент получает подтверждение заказа',
        detailedInfo: `ЗАЧЕМ: Завершить HTTP request/response cycle.

ЧТО ПРОИСХОДИТ:
1. CDN отправляет response клиенту
2. TLS encryption до клиента
3. HTTP/2 или HTTP/3 (QUIC) для скорости
4. Клиент получает JSON с orderId

РЕЗУЛЬТАТ: Полный цикл ~2-3 секунды.

ИТОГО ПАТТЕРНЫ В ЗАПРОСЕ:
• API Gateway • JWT Auth • Rate Limiting
• SAGA • Event Sourcing • Cache-Aside
• Service Mesh • Multi-DC Architecture`,
        duration: 800,
        realLatency: 10,
        payload: {
          orderId: 'order_789',
          status: 'CONFIRMED',
          total: 99.98,
          message: 'Order placed successfully!'
        },
      },

      // ========== CROSS-DC REPLICATION ==========
      {
        id: 'step-45',
        fromNode: 'dc-eu-kafka',
        toNode: 'cross-dc-kafka',
        edgeId: 'e-dc-eu-kafka-crossdc',
        type: 'async',
        title: 'Cross-DC Event Replication',
        description: 'MirrorMaker реплицирует события в другие регионы',
        detailedInfo: `ЗАЧЕМ: Синхронизировать данные между датацентрами.

ЧТО ПРОИСХОДИТ:
1. Kafka MirrorMaker 2 работает как consumer+producer
2. Читает события из EU Kafka
3. Публикует в US и Asia Kafka кластеры

ПАТТЕРН: Multi-Region Replication — geo-distributed система.
Eventual Consistency между регионами (~100ms lag).`,
        duration: 2400,
        realLatency: 80,
        payload: { replication: 'async', sourceCluster: 'eu-kafka', targetClusters: ['us-kafka', 'asia-kafka'] },
      },
      {
        id: 'step-46',
        fromNode: 'cross-dc-kafka',
        toNode: 'dc-us-cdc',
        edgeId: 'e-crossdc-us-cdc',
        type: 'async',
        title: 'US CDC Consumer receives event',
        description: 'CDC Consumer в US DC получает событие из Kafka',
        detailedInfo: `ЗАЧЕМ: Обработать событие и применить изменения к локальной БД.

ЧТО ПРОИСХОДИТ:
1. CDC Consumer (Debezium) подписан на cross-dc topic
2. Получает OrderCreated/OrderUpdated событие
3. Десериализует и валидирует по схеме

ПАТТЕРН: Change Data Capture — захват изменений данных.`,
        duration: 1600,
        realLatency: 50,
        payload: { consumer: 'us-cdc-consumer', topic: 'cross-dc.orders' },
      },
      {
        id: 'step-47',
        fromNode: 'dc-us-cdc',
        toNode: 'dc-us-db',
        edgeId: 'e-us-cdc-db',
        type: 'async',
        title: 'CDC → US Read Replica',
        description: 'CDC Consumer применяет изменения к БД',
        detailedInfo: `ЗАЧЕМ: Синхронизировать данные в US регионе.

ЧТО ПРОИСХОДИТ:
1. CDC Consumer формирует SQL: INSERT/UPDATE
2. Применяет к локальной Read Replica
3. US пользователи видят данные с ~100ms задержкой

ПАТТЕРН: Event-Driven Replication.
Eventual Consistency — данные появятся через ~100ms.`,
        duration: 1600,
        realLatency: 50,
        payload: { targetRegion: 'us-east-1', totalLag: '~100ms' },
      },
      {
        id: 'step-48',
        fromNode: 'cross-dc-kafka',
        toNode: 'dc-asia-cdc',
        edgeId: 'e-crossdc-asia-cdc',
        type: 'async',
        title: 'Asia CDC Consumer receives event',
        description: 'CDC Consumer в Asia DC получает событие из Kafka',
        detailedInfo: `ЗАЧЕМ: Обработать событие и применить изменения к локальной БД.

ЧТО ПРОИСХОДИТ:
1. CDC Consumer (Debezium) подписан на cross-dc topic
2. Больше network latency из-за расстояния (~150ms)
3. Получает то же событие что и US

ПАТТЕРН: Geo-Distributed Event Processing.`,
        duration: 2400,
        realLatency: 150,
        payload: { consumer: 'asia-cdc-consumer', topic: 'cross-dc.orders', networkLatency: '~150ms' },
      },
      {
        id: 'step-49',
        fromNode: 'dc-asia-cdc',
        toNode: 'dc-asia-db',
        edgeId: 'e-asia-cdc-db',
        type: 'async',
        title: 'CDC → Asia Read Replica',
        description: 'CDC Consumer применяет изменения к БД',
        detailedInfo: `ЗАЧЕМ: Синхронизировать данные в Asia регионе.

ЧТО ПРОИСХОДИТ:
1. CDC Consumer формирует SQL: INSERT/UPDATE
2. Применяет к локальной Read Replica
3. Asia пользователи видят данные с ~200ms задержкой

ПАТТЕРН: Geo-Distributed Database.
Trade-off: consistency vs latency.`,
        duration: 1600,
        realLatency: 50,
        payload: { targetRegion: 'ap-southeast-1', totalLag: '~200ms', distance: '~10000km' },
      },

      // ========== ERROR HANDLING: DLQ ==========
      {
        id: 'step-50',
        fromNode: 'dc-eu-kafka',
        toNode: 'dc-eu-dlq',
        edgeId: 'e-dc-eu-kafka-dlq',
        type: 'async',
        title: '[Error Path] Dead Letter Queue',
        description: 'Что происходит при ошибке обработки сообщения',
        detailedInfo: `ЗАЧЕМ: Не потерять сообщения при ошибках обработки.

⚠️ ЭТО ERROR PATH — в успешном сценарии не происходит!

КОГДА СРАБАТЫВАЕТ:
1. Consumer не смог обработать сообщение (exception)
2. Retry policy: 3 попытки с exponential backoff (1s, 2s, 4s)
3. После 3 failed retries → сообщение идёт в DLQ

ЧТО ПРОИСХОДИТ:
1. Kafka перемещает сообщение в topic: orders.created.dlq
2. Alert в PagerDuty: "DLQ message count > 0"
3. On-call engineer разбирается с причиной
4. После fix — replay сообщений из DLQ

ТИПИЧНЫЕ ПРИЧИНЫ ОШИБОК:
• Невалидные данные (schema mismatch)
• Timeout при обращении к внешнему сервису
• Database constraint violation
• Bug в consumer коде

ПАТТЕРН: Dead Letter Queue — изоляция проблемных сообщений.
Позволяет системе продолжать работу несмотря на ошибки.`,
        duration: 400,
        realLatency: 5,
        payload: {
          dlqTopic: 'orders.created.dlq',
          retryPolicy: { maxRetries: 3, backoff: 'exponential' },
          alertChannel: 'pagerduty',
          note: 'This step only occurs on processing failures'
        },
      },
    ],
  },
]
