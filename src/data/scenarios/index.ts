import { Scenario } from '../../types'

export const scenarios: Scenario[] = [
  {
    id: 'create-order',
    name: 'Создание заказа (полный путь + SAGA)',
    description: 'Запрос в EU DC: авторизация, SAGA через Event Bus, репликация в другие ДЦ',
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
3. TTL=30-300 сек — время кэширования зависит от критичности сервиса

ПАТТЕРН: Anycast — один IP адрес анонсируется из множества локаций.
Снижает latency на 50-200ms за счёт географической близости.

⚠️ TRADE-OFF TTL: Короткий TTL (30-60 сек) = быстрый failover, но больше DNS запросов.
Длинный TTL (5 мин) = меньше нагрузки на DNS, но медленнее failover.
Критичные сервисы используют короткий TTL или динамический TTL.`,
        duration: 3200,
        realLatency: 5,
        payload: { ip: '104.16.123.96', ttl: '30-60', location: 'Frankfurt Edge' },
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

      // ========== RATE LIMITING ==========
      {
        id: 'step-7',
        fromNode: 'dc-eu-lb',
        toNode: 'dc-eu-ratelimit',
        edgeId: 'e-dc-eu-lb-ratelimit',
        type: 'request',
        title: 'Security Check (WAF + Rate Limit)',
        description: 'Security Layer проверяет безопасность и лимиты',
        detailedInfo: `ЗАЧЕМ: Защита от атак (WAF) и перегрузки (Rate Limiting).

ЧТО ПРОИСХОДИТ:
1. WAF проверяет запрос на SQL injection, XSS, OWASP Top 10
2. Проверяется IP reputation и geo-blocking
3. Adaptive sliding window: 46/100 req/min → OK
4. Добавляются headers: X-RateLimit-Remaining: 54

ПАТТЕРН: Adaptive Rate Limiting — лимиты меняются в зависимости от нагрузки системы.
При низкой нагрузке лимиты выше, при высокой — ужесточаются (graceful degradation).`,
        duration: 400,
        realLatency: 1,
        payload: { userId: 'user_123', endpoint: '/api/v1/orders', currentRate: 46, limit: 100 },
      },
      {
        id: 'step-8',
        fromNode: 'dc-eu-ratelimit',
        toNode: 'dc-eu-lb',
        edgeId: 'e-dc-eu-lb-ratelimit',
        reverse: true,
        type: 'response',
        title: 'Security Check Passed',
        description: 'Security Layer разрешает запрос',
        detailedInfo: `РЕЗУЛЬТАТ: Все проверки пройдены.

• WAF: no threats detected
• Rate limit: 46/100 (OK)
• Headers: X-RateLimit-Remaining: 54`,
        duration: 160,
        realLatency: 0.5,
        payload: { status: 'allowed' },
      },
      {
        id: 'step-9',
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
        id: 'step-10',
        fromNode: 'dc-eu-gw',
        toNode: 'dc-eu-auth',
        edgeId: 'e-dc-eu-gw-auth',
        type: 'request',
        title: 'JWT Token Validation',
        description: 'Auth Service валидирует короткоживущий JWT (15 мин)',
        detailedInfo: `ЗАЧЕМ: Убедиться что запрос от авторизованного пользователя.

ЧТО ПРОИСХОДИТ:
1. Подпись RS256 проверяется публичным ключом
2. Expiration (exp), Issuer (iss), Audience (aud)
3. Короткое время жизни токена (15 мин) делает revocation менее критичным

ПАТТЕРН: Short-lived JWT + Refresh Token flow.
Вместо blacklist используем короткоживущие токены — при logout пользователь просто не получит новый refresh token.`,
        duration: 400,
        realLatency: 1,
        payload: { token: 'eyJhbGciOiJSUzI1NiIs...', checks: ['signature', 'expiration', 'issuer'], ttl: '15min' },
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

      // ========== CLUSTER ROUTING ==========
      {
        id: 'step-16',
        fromNode: 'dc-eu-gw',
        toNode: 'dc-eu-ingress',
        edgeId: 'e-dc-eu-gw-ingress',
        type: 'request',
        title: 'Route to Compute Cluster',
        description: 'API Gateway маршрутизирует в Compute Cluster',
        detailedInfo: `ЗАЧЕМ: API Gateway — точка входа, Compute Cluster — среда выполнения сервисов.

ЧТО ПРОИСХОДИТ:
1. API Gateway определяет target service по path (/api/v1/orders → Order Service)
2. Добавляет headers: X-User-Id, X-Request-Id, X-Trace-Id
3. Проксирует в Internal Router

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
        title: 'Router → Order Service',
        description: 'Internal Router роутит на Service по правилам',
        detailedInfo: `ЗАЧЕМ: Internal Router — L7 роутер внутри Compute Cluster.

ЧТО ПРОИСХОДИТ:
1. Router сопоставляет path с routing rule
2. Правило: /api/v1/orders/* → order-service:8080
3. Направляет на внутренний Service endpoint

ПАТТЕРН: Internal L7 Router — маршрутизация к сервисам кластера.`,
        duration: 800,
        realLatency: 1,
        payload: { ingressRule: 'orders-ingress', path: '/api/v1/orders', targetPort: 8080 },
      },
      {
        id: 'step-18',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-ingress-order-svc',
        type: 'request',
        title: 'Service Discovery → Pod',
        description: 'Service выбирает здоровый Pod',
        detailedInfo: `ЗАЧЕМ: Service Discovery — абстракция над множеством Pod реплик.

ЧТО ПРОИСХОДИТ:
1. Service Discovery endpoint получает запрос
2. Load Balancer выбирает Pod по алгоритму (round-robin)
3. Проверяет health check — Pod должен быть Ready

ПАТТЕРН: Service Discovery внутри Compute Cluster.`,
        duration: 400,
        realLatency: 0.5,
        payload: { selectedPod: 'order-pod-7b4f9-x2k4n', replicas: 3, readyReplicas: 3 },
      },

      // ========== ORDER SERVICE LOGIC ==========
      {
        id: 'step-19',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-order-db',
        edgeId: 'e-dc-eu-order-svc-db',
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
Статус PENDING — заказ создан, но не подтверждён.

⚠️ COMPENSATION: При ошибке на любом следующем шаге — Order Service установит статус CANCELLED.`,
        duration: 1600,
        realLatency: 25,
        payload: { orderId: 'order_789', status: 'PENDING', items: [{ productId: 'prod_456', qty: 2, price: 49.99 }], total: 99.98 },
      },
      {
        id: 'step-20',
        fromNode: 'dc-eu-order-db',
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-order-svc-db',
        reverse: true,
        type: 'response',
        title: 'Order Persisted',
        description: 'Database подтверждает сохранение',
        detailedInfo: `ЗАЧЕМ: Гарантировать что заказ сохранён перед продолжением.

ЧТО ПРОИСХОДИТ:
1. Database выполняет INSERT в транзакции
2. WAL (Write-Ahead Log) фиксирует изменение
3. fsync на диск — данные durable
4. Возвращает подтверждение с orderId

ПАТТЕРН: ACID транзакция.`,
        duration: 1200,
        realLatency: 20,
        payload: { success: true, orderId: 'order_789', createdAt: '2024-01-15T10:30:00Z' },
      },

      // ========== SAGA: PUBLISH TO EVENT BUS ==========
      {
        id: 'step-21',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-kafka',
        edgeId: 'e-dc-eu-order-svc-kafka',
        type: 'async',
        title: 'Publish OrderCreated Event',
        description: 'Событие в domain topic orders.created',
        detailedInfo: `ЗАЧЕМ: Запустить асинхронную обработку другими сервисами.

ЧТО ПРОИСХОДИТ:
1. Order Service публикует событие в topic: orders.created
2. Key: order_789 (партиционирование по orderId)
3. acks=all — запись на все реплики перед подтверждением

ПАТТЕРН: Event-Driven Architecture — коммуникация через события.
SAGA Choreography — сервисы подписаны на нужные topics.

⚠️ ВАЖНО: Каждый сервис должен иметь compensating transaction:
• Order: cancelOrder() — отменить заказ
• Inventory: releaseReservation() — вернуть товар на склад
• Payment: refundPayment() — вернуть деньги`,
        duration: 800,
        realLatency: 5,
        payload: { topic: 'orders.created', key: 'order_789', partition: 3 },
      },

      // ========== SAGA: INVENTORY ==========
      {
        id: 'step-22',
        fromNode: 'dc-eu-kafka',
        toNode: 'dc-eu-inventory-svc',
        edgeId: 'e-dc-eu-inventory-svc-kafka',
        reverse: true,
        type: 'async',
        title: 'Inventory Consumes Event',
        description: 'Consumer group читает из orders.created topic',
        detailedInfo: `ЗАЧЕМ: Проверить и зарезервировать товар на складе.

ЧТО ПРОИСХОДИТ:
1. Consumer group "inventory-orders-consumer" подписан на orders.created
2. Event Bus доставляет событие одному consumer в группе
3. Idempotency key (orderId) предотвращает дублирование

ПАТТЕРН: Consumer Group — параллельная обработка партиций.`,
        duration: 1200,
        realLatency: 10,
        payload: { consumerGroup: 'inventory-orders-consumer', topic: 'orders.created' },
      },
      {
        id: 'step-23',
        fromNode: 'dc-eu-inventory-svc',
        toNode: 'dc-eu-inventory-db',
        edgeId: 'e-dc-eu-inventory-svc-db',
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
        toNode: 'dc-eu-inventory-svc',
        edgeId: 'e-dc-eu-inventory-svc-db',
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
        fromNode: 'dc-eu-inventory-svc',
        toNode: 'dc-eu-kafka',
        edgeId: 'e-dc-eu-inventory-svc-kafka',
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
        toNode: 'dc-eu-payment-svc',
        edgeId: 'e-dc-eu-payment-svc-kafka',
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
        fromNode: 'dc-eu-payment-svc',
        toNode: 'dc-eu-payment-db',
        edgeId: 'e-dc-eu-payment-svc-db',
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
        toNode: 'dc-eu-payment-svc',
        edgeId: 'e-dc-eu-payment-svc-db',
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
        fromNode: 'dc-eu-payment-svc',
        toNode: 'dc-eu-kafka',
        edgeId: 'e-dc-eu-payment-svc-kafka',
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
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-order-svc-kafka',
        reverse: true,
        type: 'async',
        title: 'Order Service Receives Payment Event',
        description: 'Consumer читает из payments.completed topic',
        detailedInfo: `ЗАЧЕМ: Финализировать заказ после успешной оплаты.

ЧТО ПРОИСХОДИТ:
1. Consumer group "order-payments-consumer" подписан на payments.completed
2. Все шаги SAGA успешны: order ✓, inventory ✓, payment ✓
3. Статус меняется на CONFIRMED

ПАТТЕРН: SAGA Completion — все participants подтвердили.

⚠️ А ЕСЛИ PAYMENT УПАЛ? При ошибке Payment публикует payments.failed:
1. Order Service получает событие → статус PAYMENT_FAILED
2. Inventory Service получает событие → releaseReservation()
Это и есть Compensating Transactions — откат всех успешных шагов.`,
        duration: 800,
        realLatency: 10,
        payload: { consumerGroup: 'order-payments-consumer', topic: 'payments.completed' },
      },
      {
        id: 'step-31',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-order-db',
        edgeId: 'e-dc-eu-order-svc-db',
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
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-order-svc-db',
        reverse: true,
        type: 'response',
        title: 'Order Status Updated',
        description: 'Database подтверждает обновление статуса',
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
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-user-svc',
        edgeId: 'e-dc-eu-order-user-mesh',
        type: 'request',
        title: 'Order Pod → User Pod (Service Mesh)',
        description: 'Межсервисный вызов через Sidecar proxies',
        detailedInfo: `ЗАЧЕМ: Получить данные пользователя для email уведомления.

ЧТО ПРОИСХОДИТ:
1. Order Pod делает gRPC вызов GetUser
2. Sidecar proxy перехватывает трафик
3. mTLS: взаимная аутентификация через SPIFFE IDs
4. Circuit Breaker защищает от каскадных отказов

ПАТТЕРН: Service Mesh — Pod-to-Pod через sidecar proxies.`,
        duration: 640,
        realLatency: 3,
        payload: { protocol: 'gRPC', method: 'GetUser', mtls: true },
      },
      {
        id: 'step-34',
        fromNode: 'dc-eu-user-svc',
        toNode: 'dc-eu-cache',
        edgeId: 'e-dc-eu-user-svc-cache',
        type: 'request',
        title: 'User Pod → Cache',
        description: 'Проверка кэша',
        detailedInfo: `ЗАЧЕМ: Избежать запроса в БД если данные в кэше.

ЧТО ПРОИСХОДИТ:
1. Cache: GET user:user_123
2. TTL: 1 час — баланс между свежестью и нагрузкой на БД

ПАТТЕРН: Cache-Aside (Lazy Loading).`,
        duration: 400,
        realLatency: 0.5,
        payload: { key: 'v1:user:user_123', operation: 'GET' },
      },
      {
        id: 'step-35',
        fromNode: 'dc-eu-cache',
        toNode: 'dc-eu-user-svc',
        edgeId: 'e-dc-eu-user-svc-cache',
        reverse: true,
        type: 'response',
        title: 'Cache HIT',
        description: 'Cache: данные найдены в кэше',
        detailedInfo: `ЗАЧЕМ: Быстро получить данные без обращения к БД.

ЧТО ПРОИСХОДИТ:
1. Cache вернул данные пользователя
2. User Service десериализует
3. Ответ готов за ~2ms (vs ~50ms из БД)

ПАТТЕРН: Cache-Aside — кэш прогрет.`,
        duration: 80,
        realLatency: 0.5,
        payload: { hit: true, userId: 'user_123', email: 'john@example.com' },
      },
      {
        id: 'step-36',
        fromNode: 'dc-eu-user-svc',
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-order-user-mesh',
        reverse: true,
        type: 'response',
        title: 'User Pod → Order Pod (Response)',
        description: 'User данные возвращаются в Order Service',
        detailedInfo: `ЗАЧЕМ: Order Service получил данные для email уведомления.

ЧТО ПРОИСХОДИТ:
1. User Pod формирует gRPC response
2. Sidecar proxy отправляет ответ через mesh
3. Order Service может отправить email уведомление

РЕЗУЛЬТАТ: User данные получены за ~5ms (cache hit).`,
        duration: 400,
        realLatency: 2,
        payload: { email: 'john@example.com', name: 'John Doe' },
      },

      // ========== OBSERVABILITY ==========
      {
        id: 'step-36a',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-jaeger',
        edgeId: 'e-dc-eu-pods-jaeger',
        type: 'async',
        title: 'Report Trace Spans',
        description: 'Sidecar proxy отправляет trace spans в Tracing',
        detailedInfo: `ЗАЧЕМ: Distributed Tracing — отслеживание запроса через все сервисы.

ЧТО ПРОИСХОДИТ:
1. Каждый sidecar собирает spans: start_time, duration, status
2. Spans связаны через traceId (X-Trace-Id из headers)
3. Батчами отправляются в Tracing collector
4. Tracing система строит полную картину запроса

ПАТТЕРН: Distributed Tracing (OpenTelemetry).
Позволяет найти bottlenecks и понять latency breakdown.

TRACE SPANS В ЭТОМ ЗАПРОСЕ:
• API Gateway: 2ms
• Auth Service: 1.5ms
• Order Service: 1200ms (DB + Event Bus)
• User Service: 5ms (cache hit)
Total: ~1.5s`,
        duration: 200,
        realLatency: 1,
        payload: { traceId: 'trace_abc123', totalSpans: 12, services: ['api-gw', 'auth', 'order', 'user', 'inventory', 'payment'] },
      },
      {
        id: 'step-36b',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-prometheus',
        edgeId: 'e-dc-eu-pods-prometheus',
        type: 'async',
        title: 'Export Metrics',
        description: 'Metrics Collector собирает метрики с /metrics endpoint',
        detailedInfo: `ЗАЧЕМ: Мониторинг и alerting — SRE должны видеть здоровье системы.

ЧТО ПРОИСХОДИТ:
1. Sidecar proxy экспортирует метрики на :15090/stats/metrics
2. Metrics Collector каждые 15 сек собирает данные со всех pods
3. Метрики записываются в time-series DB

КЛЮЧЕВЫЕ МЕТРИКИ:
• request_duration_seconds{service="order"} = 1.2
• request_total{service="order", status="201"} ++
• eventbus_producer_messages_total{topic="orders.created"} ++
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
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-ingress-order-svc',
        reverse: true,
        type: 'response',
        title: 'Order Pod → Service Discovery',
        description: 'Response начинает обратный путь',
        detailedInfo: `ЗАЧЕМ: Response должен пройти обратно через всю инфраструктуру.

ЧТО ПРОИСХОДИТ:
1. Order Pod формирует HTTP response
2. Sidecar proxy добавляет response headers
3. Response идёт на Service Discovery endpoint

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
        title: 'Service → Router',
        description: 'Response проходит через Internal Router',
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
        title: 'Router → API Gateway',
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
• API Gateway • JWT Auth • Security Layer (WAF + Rate Limiting)
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
        description: 'Event Replicator реплицирует события в другие регионы',
        detailedInfo: `ЗАЧЕМ: Синхронизировать данные между датацентрами.

ЧТО ПРОИСХОДИТ:
1. Event Replicator работает как consumer+producer
2. Читает события из EU Event Bus
3. Публикует в US и Asia Event Bus кластеры

ПАТТЕРН: Multi-Region Replication — geo-distributed система.
Eventual Consistency между регионами (~100ms lag).`,
        duration: 2400,
        realLatency: 80,
        payload: { replication: 'async', sourceCluster: 'eu-eventbus', targetClusters: ['us-eventbus', 'asia-eventbus'] },
      },
      {
        id: 'step-46',
        fromNode: 'cross-dc-kafka',
        toNode: 'dc-us-cdc',
        edgeId: 'e-crossdc-us-cdc',
        type: 'async',
        title: 'US CDC Consumer receives event',
        description: 'CDC Consumer в US DC получает событие из Event Bus',
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
Eventual Consistency — данные появятся через ~100ms.

⚠️ RPO > 0: При аварии EU DC данные за последние ~100ms могут быть потеряны!
Для нулевых потерь нужна синхронная репликация (но +latency).`,
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
        description: 'CDC Consumer в Asia DC получает событие из Event Bus',
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
Trade-off: consistency vs latency.

⚠️ RPO ~200ms: При аварии EU DC последние транзакции могут не доехать до Asia.
Это цена асинхронной репликации — нулевых потерь не бывает без синхронной записи.`,
        duration: 1600,
        realLatency: 50,
        payload: { targetRegion: 'ap-southeast-1', totalLag: '~200ms', distance: '~10000km' },
      },

    ],
  },

  // ==================== SCENARIO 2: DC FAILOVER ====================
  {
    id: 'dc-failover',
    name: 'DC Failover (EU недоступен)',
    description: 'EU DC не отвечает, Global LB переключает трафик на US DC',
    initialViewLevel: 'global',
    steps: [
      // ========== ПУТЬ ДО GLOBAL LB ==========
      {
        id: 'fail-1',
        fromNode: 'client',
        toNode: 'dns',
        edgeId: 'e-client-dns',
        type: 'request',
        title: 'DNS Lookup',
        description: 'Резолвинг доменного имени',
        detailedInfo: `ЗАЧЕМ: Получить IP адрес для подключения.

ЧТО ПРОИСХОДИТ:
1. Клиент запрашивает api.store.com
2. DNS возвращает Anycast IP балансировщика
3. Клиент не знает о проблемах в EU DC

ПАТТЕРН: DNS-based Discovery — первый уровень отказоустойчивости.`,
        duration: 2400,
        realLatency: 25,
        payload: { query: 'api.store.com', type: 'A' },
      },
      {
        id: 'fail-2',
        fromNode: 'dns',
        toNode: 'client',
        edgeId: 'e-client-dns',
        reverse: true,
        type: 'response',
        title: 'DNS Response',
        description: 'IP адрес получен',
        detailedInfo: `ЧТО ПРОИСХОДИТ:
1. DNS вернул Anycast IP Global Load Balancer
2. Этот IP не привязан к конкретному ДЦ
3. Failover будет на уровне GLB, не DNS

ПАТТЕРН: Anycast — один IP, много локаций.`,
        duration: 1600,
        realLatency: 5,
        payload: { ip: '104.16.123.96', ttl: 300 },
      },
      {
        id: 'fail-3',
        fromNode: 'client',
        toNode: 'cdn',
        edgeId: 'e-client-cdn',
        type: 'request',
        title: 'Client → CDN',
        description: 'Запрос на CDN Edge',
        detailedInfo: `ЧТО ПРОИСХОДИТ:
1. HTTPS соединение с CDN edge
2. TLS termination
3. WAF проверки пройдены

CDN не знает о состоянии backend ДЦ.`,
        duration: 2000,
        realLatency: 8,
        payload: { method: 'GET', path: '/api/v1/orders/123' },
      },
      {
        id: 'fail-4',
        fromNode: 'cdn',
        toNode: 'global-lb',
        edgeId: 'e-cdn-global-lb',
        type: 'request',
        title: 'CDN → Global LB',
        description: 'Запрос на origin',
        detailedInfo: `ЧТО ПРОИСХОДИТ:
1. CDN cache miss (или динамический запрос)
2. Проксирование на Global Load Balancer
3. GLB выберет ДЦ на основе health checks

ПАТТЕРН: CDN как первый уровень защиты.`,
        duration: 1600,
        realLatency: 3,
        payload: { cached: false },
      },

      // ========== FAILOVER: EU → US ==========
      {
        id: 'fail-5',
        fromNode: 'global-lb',
        toNode: 'dc-eu',
        edgeId: 'e-global-lb-dc-eu',
        type: 'request',
        title: '❌ Попытка #1: EU DC',
        description: 'GLB пытается направить в primary DC',
        detailedInfo: `ЗАЧЕМ: EU DC — primary, обычно самый близкий для EU клиентов.

ЧТО ПРОИСХОДИТ:
1. GLB отправляет health check probe
2. EU DC не отвечает уже 30 секунд
3. Health status: UNHEALTHY

⚠️ ПРОБЛЕМА: EU DC недоступен!
Причины могут быть:
• Сетевой сбой (fiber cut)
• Авария в дата-центре
• DDoS атака
• Плановое обслуживание`,
        duration: 4000,
        realLatency: 3000,
        payload: { targetDC: 'eu-central-1', healthCheck: 'FAILED', lastHealthy: '30s ago' },
      },
      {
        id: 'fail-6',
        fromNode: 'dc-eu',
        toNode: 'global-lb',
        edgeId: 'e-global-lb-dc-eu',
        reverse: true,
        type: 'response',
        title: '❌ EU DC: TIMEOUT',
        description: 'Нет ответа от EU DC',
        detailedInfo: `ЧТО ПРОИЗОШЛО:
1. Connection timeout после 3 секунд
2. Или TCP RST (connection refused)
3. Или HTTP 503 от border router

GLB РЕАКЦИЯ:
1. Помечает EU DC как unhealthy
2. Исключает из rotation на 30 сек
3. Немедленно пробует следующий ДЦ

ПАТТЕРН: Fast Failover — переключение за миллисекунды.
Клиент не видит ошибку, только небольшую задержку.`,
        duration: 800,
        realLatency: 50,
        payload: { error: 'CONNECTION_TIMEOUT', statusCode: null, action: 'FAILOVER' },
      },
      {
        id: 'fail-7',
        fromNode: 'global-lb',
        toNode: 'dc-us',
        edgeId: 'e-global-lb-dc-us',
        type: 'request',
        title: '✅ Failover → US DC',
        description: 'GLB переключается на резервный ДЦ',
        detailedInfo: `ЗАЧЕМ: Обеспечить доступность несмотря на сбой primary.

ЧТО ПРОИСХОДИТ:
1. GLB выбирает следующий по приоритету ДЦ
2. US DC healthy, latency 85ms от клиента
3. Asia DC тоже healthy, но дальше (150ms)
4. Выбран US DC

ПАТТЕРН: Active-Active Multi-DC
Все ДЦ готовы принять трафик в любой момент.

⏱️ ВРЕМЯ FAILOVER для НОВЫХ запросов: ~50ms на уровне GLB.
⚠️ НО: Клиенты с кэшированным DNS будут пытаться подключиться к EU
до истечения TTL! Поэтому критичные сервисы используют короткий TTL (30-60 сек).`,
        duration: 2400,
        realLatency: 85,
        payload: { targetDC: 'us-east-1', reason: 'failover_from_eu', latency: '85ms' },
      },

      // ========== US DC: ОБРАБОТКА ЗАПРОСА ==========
      {
        id: 'fail-8',
        fromNode: 'dc-us',
        toNode: 'dc-us-lb',
        edgeId: 'e-dc-us-lb',
        type: 'request',
        title: 'US DC → Regional LB',
        description: 'Запрос входит в US датацентр',
        detailedInfo: `ЧТО ПРОИСХОДИТ:
1. Трафик проходит через US border router
2. Firewall проверки
3. Regional LB принимает соединение

US DC работает как обычно, не знает о проблемах EU.`,
        duration: 800,
        realLatency: 1,
        payload: { datacenter: 'us-east-1' },
      },
      {
        id: 'fail-9',
        fromNode: 'dc-us-lb',
        toNode: 'dc-us-gw',
        edgeId: 'e-dc-us-lb-gw',
        type: 'request',
        title: 'Regional LB → API Gateway',
        description: 'Балансировка на API Gateway',
        detailedInfo: `ЧТО ПРОИСХОДИТ:
1. HAProxy выбирает здоровый инстанс API Gateway
2. Least connections алгоритм
3. US DC имеет меньше инстансов чем EU (read replica)

ВАЖНО: US DC — read replica, только GET запросы!`,
        duration: 800,
        realLatency: 2,
        payload: { algorithm: 'least_connections' },
      },
      {
        id: 'fail-10',
        fromNode: 'dc-us-gw',
        toNode: 'dc-us-ingress',
        edgeId: 'e-dc-us-gw-ingress',
        type: 'request',
        title: 'API Gateway → Router',
        description: 'Маршрутизация в Compute Cluster',
        detailedInfo: `ЧТО ПРОИСХОДИТ:
1. API Gateway проверяет JWT (локально)
2. Rate limiting (отдельные лимиты для US DC)
3. Роутинг на Internal Router

⚠️ Если бы это был POST (создание заказа):
US DC вернул бы 307 Redirect на EU DC
или 503 "Primary DC unavailable"`,
        duration: 800,
        realLatency: 2,
        payload: { method: 'GET', canHandle: true },
      },
      {
        id: 'fail-11',
        fromNode: 'dc-us-ingress',
        toNode: 'dc-us-order-svc',
        edgeId: 'e-dc-us-ingress-order',
        type: 'request',
        title: 'Router → Order Service',
        description: 'NGINX роутит на сервис',
        detailedInfo: `ЧТО ПРОИСХОДИТ:
1. Ingress rule: /api/v1/orders/* → order-service
2. ClusterIP Service получает запрос
3. Order Service в US — read-only replica

ПАТТЕРН: Read Replica — только чтение данных.`,
        duration: 600,
        realLatency: 1,
        payload: { path: '/api/v1/orders/123' },
      },
      {
        id: 'fail-12',
        fromNode: 'dc-us-order-svc',
        toNode: 'dc-us-order-pod',
        edgeId: 'e-dc-us-order-svc-pod',
        type: 'request',
        title: 'Service → Order Pod',
        description: 'Service Discovery выбирает Pod',
        detailedInfo: `ЧТО ПРОИСХОДИТ:
1. Load balancer выбирает healthy pod
2. Round-robin между репликами
3. Pod готов обработать GET запрос`,
        duration: 400,
        realLatency: 0.5,
        payload: { selectedPod: 'order-pod-us-7x9k2' },
      },
      {
        id: 'fail-13',
        fromNode: 'dc-us-order-pod',
        toNode: 'dc-us-cache',
        edgeId: 'e-dc-us-order-pod-cache',
        type: 'request',
        title: 'Order Pod → Cache',
        description: 'Проверка локального кэша',
        detailedInfo: `ЗАЧЕМ: Избежать похода в БД.

ЧТО ПРОИСХОДИТ:
1. Cache GET order:123
2. Локальный кэш US DC
3. Данные реплицированы из EU через CDC

⚠️ EVENTUAL CONSISTENCY:
Данные могут отставать на ~100-500ms от EU.`,
        duration: 400,
        realLatency: 0.5,
        payload: { key: 'order:123', operation: 'GET' },
      },
      {
        id: 'fail-14',
        fromNode: 'dc-us-cache',
        toNode: 'dc-us-order-pod',
        edgeId: 'e-dc-us-order-pod-cache',
        reverse: true,
        type: 'response',
        title: 'Cache HIT',
        description: 'Данные найдены в кэше',
        detailedInfo: `РЕЗУЛЬТАТ: Cache HIT!

ЧТО ВЕРНУЛОСЬ:
1. Order данные из локального Cache
2. Данные были реплицированы 50ms назад
3. Consistent read не гарантирован

ПАТТЕРН: Cache-Aside с eventual consistency.
Для критичных данных можно форсировать read from primary.`,
        duration: 200,
        realLatency: 0.5,
        payload: { hit: true, orderId: 'order_123', replicaLag: '50ms' },
      },

      // ========== RESPONSE PATH ==========
      {
        id: 'fail-15',
        fromNode: 'dc-us-order-pod',
        toNode: 'dc-us-order-svc',
        edgeId: 'e-dc-us-order-svc-pod',
        reverse: true,
        type: 'response',
        title: 'Order Pod → Service',
        description: 'Response начинает обратный путь',
        detailedInfo: `ЧТО ПРОИСХОДИТ:
1. Order Pod формирует JSON response
2. Добавляет header: X-Served-By: us-east-1
3. Добавляет header: X-Data-Freshness: 50ms

Клиент может увидеть из какого ДЦ пришёл ответ.`,
        duration: 200,
        realLatency: 0.5,
        payload: { servedBy: 'us-east-1' },
      },
      {
        id: 'fail-16',
        fromNode: 'dc-us-order-svc',
        toNode: 'dc-us-ingress',
        edgeId: 'e-dc-us-ingress-order',
        reverse: true,
        type: 'response',
        title: 'Service → Router',
        description: 'Response через Ingress',
        detailedInfo: `Ingress логирует response и передаёт дальше.`,
        duration: 200,
        realLatency: 0.5,
        payload: {},
      },
      {
        id: 'fail-17',
        fromNode: 'dc-us-ingress',
        toNode: 'dc-us-gw',
        edgeId: 'e-dc-us-gw-ingress',
        reverse: true,
        type: 'response',
        title: 'Router → API Gateway',
        description: 'Response через API Gateway',
        detailedInfo: `API Gateway добавляет стандартные headers.`,
        duration: 200,
        realLatency: 1,
        payload: {},
      },
      {
        id: 'fail-18',
        fromNode: 'dc-us-gw',
        toNode: 'dc-us-lb',
        edgeId: 'e-dc-us-lb-gw',
        reverse: true,
        type: 'response',
        title: 'API Gateway → Regional LB',
        description: 'Response через LB',
        detailedInfo: `HAProxy записывает метрики успешного запроса.`,
        duration: 200,
        realLatency: 0.5,
        payload: {},
      },
      {
        id: 'fail-19',
        fromNode: 'dc-us-lb',
        toNode: 'dc-us',
        edgeId: 'e-dc-us-lb',
        reverse: true,
        type: 'response',
        title: 'Regional LB → DC Border',
        description: 'Response выходит из DC',
        detailedInfo: `Трафик покидает US датацентр.`,
        duration: 200,
        realLatency: 0.5,
        payload: {},
      },
      {
        id: 'fail-20',
        fromNode: 'dc-us',
        toNode: 'global-lb',
        edgeId: 'e-global-lb-dc-us',
        reverse: true,
        type: 'response',
        title: 'US DC → Global LB',
        description: 'Response на Global LB',
        detailedInfo: `GLB видит успешный ответ от US DC.

МЕТРИКИ ОБНОВЛЕНЫ:
• eu-central-1: UNHEALTHY (0% success)
• us-east-1: HEALTHY (100% success)
• ap-southeast-1: HEALTHY (standby)`,
        duration: 400,
        realLatency: 1,
        payload: { successfulDC: 'us-east-1' },
      },
      {
        id: 'fail-21',
        fromNode: 'global-lb',
        toNode: 'cdn',
        edgeId: 'e-cdn-global-lb',
        reverse: true,
        type: 'response',
        title: 'Global LB → CDN',
        description: 'Response на CDN edge',
        detailedInfo: `CDN получает ответ от origin.

Для GET запросов CDN может закэшировать ответ,
уменьшая нагрузку на backend при повторных запросах.`,
        duration: 400,
        realLatency: 3,
        payload: { cacheable: true },
      },
      {
        id: 'fail-22',
        fromNode: 'cdn',
        toNode: 'client',
        edgeId: 'e-client-cdn',
        reverse: true,
        type: 'response',
        title: '✅ Response → Client',
        description: 'Клиент получает ответ (degraded mode)',
        detailedInfo: `РЕЗУЛЬТАТ: Запрос успешно обработан!

✅ ЧТО ПОЛУЧИЛ КЛИЕНТ:
• HTTP 200 OK
• Order данные (возможно с небольшим lag)
• Header: X-Served-By: us-east-1

⏱️ ОБЩЕЕ ВРЕМЯ: ~180ms (vs ~80ms при healthy EU)
• DNS: 30ms
• Failover attempt: 50ms (timeout)
• US DC processing: 100ms

📊 ИТОГО:
• Клиент получил данные
• Задержка +100ms из-за failover
• Данные eventual consistent (lag ~50-500ms)

ПАТТЕРН: Graceful Degradation
Система работает, но с ограничениями:
• Только READ операции
• Возможен stale data
• Увеличенная latency`,
        duration: 1200,
        realLatency: 10,
        payload: {
          status: 200,
          servedBy: 'us-east-1',
          degradedMode: true,
          totalLatency: '180ms',
          dataFreshness: 'eventual_consistency'
        },
      },
    ],
  },

  // ==================== SCENARIO 3: SERVICE OVERLOAD ====================
  {
    id: 'service-overload',
    name: 'Service Overload (Security Layer + Circuit Breaker)',
    description: 'Чёрная пятница: Security Layer отсекает избыточный трафик, Circuit Breaker защищает сервисы',
    initialViewLevel: 'global',
    steps: [
      // ========== ПУТЬ ДО API GATEWAY ==========
      {
        id: 'over-1',
        fromNode: 'client',
        toNode: 'dns',
        edgeId: 'e-client-dns',
        type: 'request',
        title: 'DNS Lookup',
        description: 'Начало запроса в час пик',
        detailedInfo: `КОНТЕКСТ: Чёрная пятница, 10x обычного трафика.

ЧТО ПРОИСХОДИТ:
1. Тысячи клиентов одновременно
2. DNS справляется (stateless, легко масштабируется)
3. Проблемы начнутся дальше...

ТЕКУЩАЯ НАГРУЗКА:
• Обычно: 1,000 RPS
• Сейчас: 10,000 RPS`,
        duration: 2400,
        realLatency: 25,
        payload: { query: 'api.store.com', currentLoad: '10x normal' },
      },
      {
        id: 'over-2',
        fromNode: 'dns',
        toNode: 'client',
        edgeId: 'e-client-dns',
        reverse: true,
        type: 'response',
        title: 'DNS Response',
        description: 'IP получен',
        detailedInfo: `DNS отвечает как обычно.`,
        duration: 1600,
        realLatency: 5,
        payload: { ip: '104.16.123.96' },
      },
      {
        id: 'over-3',
        fromNode: 'client',
        toNode: 'cdn',
        edgeId: 'e-client-cdn',
        type: 'request',
        title: 'Client → CDN',
        description: 'Запрос на создание заказа',
        detailedInfo: `ЧТО ПРОИСХОДИТ:
1. POST /api/v1/orders — не кэшируется
2. CDN пропускает на origin
3. WAF отсекает явные атаки, но легитимный трафик проходит

CDN DDoS Protection активна, но это не атака — это реальные пользователи.`,
        duration: 2000,
        realLatency: 8,
        payload: { method: 'POST', path: '/api/v1/orders' },
      },
      {
        id: 'over-4',
        fromNode: 'cdn',
        toNode: 'global-lb',
        edgeId: 'e-cdn-global-lb',
        type: 'request',
        title: 'CDN → Global LB',
        description: 'Трафик идёт на origin',
        detailedInfo: `Global LB видит 10x нагрузку.

ВСЕ ДЦ ПЕРЕГРУЖЕНЫ:
• EU DC: 85% capacity
• US DC: 70% capacity
• Asia DC: 60% capacity

GLB распределяет по весам, но все ДЦ под давлением.`,
        duration: 1600,
        realLatency: 3,
        payload: { loadDistribution: { eu: '85%', us: '70%', asia: '60%' } },
      },
      {
        id: 'over-5',
        fromNode: 'global-lb',
        toNode: 'dc-eu',
        edgeId: 'e-global-lb-dc-eu',
        type: 'request',
        title: 'Global LB → EU DC',
        description: 'Запрос направлен в primary DC',
        detailedInfo: `EU DC выбран как primary для POST запросов.

⚠️ НАГРУЗКА КРИТИЧЕСКАЯ:
• CPU: 85%
• Memory: 78%
• Network: 70%
• Active connections: 50,000`,
        duration: 1600,
        realLatency: 2,
        payload: { targetDC: 'eu-central-1', load: 'critical' },
      },
      {
        id: 'over-6',
        fromNode: 'dc-eu',
        toNode: 'dc-eu-lb',
        edgeId: 'e-dc-eu-lb',
        type: 'request',
        title: 'DC → Regional LB',
        description: 'Вход в датацентр',
        detailedInfo: `Regional LB под высокой нагрузкой.

HAProxy метрики:
• Queue depth: 500 requests
• Avg response time: 2s (обычно 100ms)
• Backend health: DEGRADED`,
        duration: 800,
        realLatency: 1,
        payload: { queueDepth: 500 },
      },
      // ========== SECURITY LAYER — ОТКАЗ ==========
      {
        id: 'over-7',
        fromNode: 'dc-eu-lb',
        toNode: 'dc-eu-ratelimit',
        edgeId: 'e-dc-eu-lb-ratelimit',
        type: 'request',
        title: '⚠️ Security Check',
        description: 'Security Layer проверяет безопасность и лимиты',
        detailedInfo: `ЗАЧЕМ: Защитить backend от атак и перегрузки ДО того как запрос дойдёт до сервисов.

Security Layer (WAF + Rate Limiting) — первая линия защиты!

ADAPTIVE RATE LIMITING для user_456:
• Базовый лимит POST /orders: 10 req/min
• Premium users: 100 req/min
• При высокой нагрузке системы лимиты снижаются на 30-50%

Token bucket check (adaptive):
• Current tokens: 0
• Base limit: 10, adjusted: 7 (система под нагрузкой)
• 0 tokens → ПРЕВЫШЕН!

РЕШЕНИЕ: Отклонить с 429 + Retry-After header.
В продакшене используются token bucket / leaky bucket с graceful degradation.`,
        duration: 400,
        realLatency: 1,
        payload: { userId: 'user_456', endpoint: 'POST /orders', currentCount: 11, limit: 10 },
      },
      {
        id: 'over-8',
        fromNode: 'dc-eu-ratelimit',
        toNode: 'dc-eu-lb',
        edgeId: 'e-dc-eu-lb-ratelimit',
        reverse: true,
        type: 'response',
        title: '❌ 429 Too Many Requests',
        description: 'Security Layer отклоняет запрос',
        detailedInfo: `ОТВЕТ SECURITY LAYER:
{
  "error": "rate_limit_exceeded",
  "limit": 10,
  "remaining": 0,
  "reset": 45,
  "retryAfter": 45
}

HEADERS:
• X-RateLimit-Limit: 10
• X-RateLimit-Remaining: 0
• X-RateLimit-Reset: 1699999999
• Retry-After: 45

ПАТТЕРН: Backpressure
Система явно сообщает клиенту "подожди".

ВАЖНО: Запрос НЕ дошёл до API Gateway и Auth!
Security Layer экономит ресурсы всей системы.`,
        duration: 200,
        realLatency: 0.5,
        payload: { status: 429, retryAfter: 45 },
      },

      // ========== ERROR RESPONSE PATH ==========
      {
        id: 'over-11',
        fromNode: 'dc-eu-lb',
        toNode: 'dc-eu',
        edgeId: 'e-dc-eu-lb',
        reverse: true,
        type: 'response',
        title: 'Error → DC Exit',
        description: '429 идёт обратно',
        detailedInfo: `LB формирует error response напрямую.

ВАЖНО: Запрос был отклонён на уровне LB!
• Не нагрузили API Gateway
• Не нагрузили Auth Service
• Не нагрузили Compute Cluster сервисы

МЕТРИКИ ОБНОВЛЕНЫ:
• rate_limited_requests_total{user="user_456"} ++
• Это попадёт в Grafana dashboard`,
        duration: 200,
        realLatency: 0.5,
        payload: { statusCode: 429 },
      },
      {
        id: 'over-12',
        fromNode: 'dc-eu',
        toNode: 'global-lb',
        edgeId: 'e-global-lb-dc-eu',
        reverse: true,
        type: 'response',
        title: 'DC → Global LB',
        description: 'Error на Global LB',
        detailedInfo: `GLB видит 429 — это НЕ ошибка сервера!

429 НЕ влияет на health check:
• Сервер работает, просто отклоняет избыточный трафик
• Это ожидаемое поведение под нагрузкой`,
        duration: 400,
        realLatency: 1,
        payload: { healthImpact: 'none' },
      },
      {
        id: 'over-13',
        fromNode: 'global-lb',
        toNode: 'cdn',
        edgeId: 'e-cdn-global-lb',
        reverse: true,
        type: 'response',
        title: 'Global LB → CDN',
        description: 'Error на CDN',
        detailedInfo: `CDN НЕ кэширует 429 ответы.

Каждый запрос будет проверяться индивидуально.`,
        duration: 400,
        realLatency: 3,
        payload: { cached: false },
      },
      {
        id: 'over-14',
        fromNode: 'cdn',
        toNode: 'client',
        edgeId: 'e-client-cdn',
        reverse: true,
        type: 'response',
        title: '❌ 429 → Client',
        description: 'Клиент получает отказ',
        detailedInfo: `КЛИЕНТ ПОЛУЧАЕТ:

HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0

{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please retry after 45 seconds.",
  "retryAfter": 45
}

📱 ЧТО ДОЛЖЕН СДЕЛАТЬ КЛИЕНТ:
1. Показать пользователю сообщение
2. Реализовать exponential backoff
3. Retry через Retry-After секунд

⏱️ ВРЕМЯ ОТВЕТА: ~50ms
(Быстро! Не тратили ресурсы backend)`,
        duration: 1200,
        realLatency: 10,
        payload: { status: 429, message: 'Rate limit exceeded', retryAfter: 45 },
      },

      // ========== ВТОРОЙ ЗАПРОС: CIRCUIT BREAKER ==========
      {
        id: 'over-15',
        fromNode: 'client',
        toNode: 'cdn',
        edgeId: 'e-client-cdn',
        type: 'request',
        title: '🔄 Новый запрос (другой user)',
        description: 'Premium пользователь с высоким лимитом',
        detailedInfo: `НОВЫЙ КЛИЕНТ: user_789 (Premium)

У premium пользователей лимит выше:
• POST /orders: 100 req/min
• Текущий count: 5
• Rate limit: OK ✓

Но сервисы всё ещё перегружены...`,
        duration: 2000,
        realLatency: 8,
        payload: { userId: 'user_789', tier: 'premium', rateLimit: 'OK' },
      },
      {
        id: 'over-16',
        fromNode: 'cdn',
        toNode: 'global-lb',
        edgeId: 'e-cdn-global-lb',
        type: 'request',
        title: 'CDN → Global LB',
        description: 'Запрос на origin',
        detailedInfo: `Запрос проходит через CDN без изменений.`,
        duration: 1600,
        realLatency: 3,
        payload: {},
      },
      {
        id: 'over-17',
        fromNode: 'global-lb',
        toNode: 'dc-eu',
        edgeId: 'e-global-lb-dc-eu',
        type: 'request',
        title: 'Global LB → EU DC',
        description: 'Направлен в EU DC',
        detailedInfo: `EU DC по-прежнему primary для POST.`,
        duration: 1600,
        realLatency: 2,
        payload: {},
      },
      {
        id: 'over-18',
        fromNode: 'dc-eu',
        toNode: 'dc-eu-lb',
        edgeId: 'e-dc-eu-lb',
        type: 'request',
        title: 'DC → Regional LB',
        description: 'Вход в DC',
        detailedInfo: `Regional LB принимает запрос.`,
        duration: 800,
        realLatency: 1,
        payload: {},
      },
      {
        id: 'over-19',
        fromNode: 'dc-eu-lb',
        toNode: 'dc-eu-ratelimit',
        edgeId: 'e-dc-eu-lb-ratelimit',
        type: 'request',
        title: 'Security Check',
        description: 'Security Layer проверяет лимиты',
        detailedInfo: `Premium user: лимит 100 req/min
Текущий count: 6
WAF: OK ✓ Rate Limit: OK ✓`,
        duration: 400,
        realLatency: 1,
        payload: { userId: 'user_789', current: 6, limit: 100 },
      },
      {
        id: 'over-20',
        fromNode: 'dc-eu-ratelimit',
        toNode: 'dc-eu-lb',
        edgeId: 'e-dc-eu-lb-ratelimit',
        reverse: true,
        type: 'response',
        title: '✅ Security Check OK',
        description: 'Проверки безопасности пройдены',
        detailedInfo: `Premium пользователь проходит Security Layer.

Но впереди ещё Circuit Breaker...`,
        duration: 200,
        realLatency: 0.5,
        payload: { allowed: true, remaining: 94 },
      },
      {
        id: 'over-21',
        fromNode: 'dc-eu-lb',
        toNode: 'dc-eu-gw',
        edgeId: 'e-dc-eu-lb-gw',
        type: 'request',
        title: 'LB → API Gateway',
        description: 'На API Gateway',
        detailedInfo: `После прохождения Security Layer запрос идёт на API Gateway.`,
        duration: 1000,
        realLatency: 2,
        payload: {},
      },
      {
        id: 'over-22',
        fromNode: 'dc-eu-gw',
        toNode: 'dc-eu-ingress',
        edgeId: 'e-dc-eu-gw-ingress',
        type: 'request',
        title: 'API GW → Router',
        description: 'Маршрутизация в Compute Cluster',
        detailedInfo: `Запрос идёт в Compute Cluster.

Кластер тоже под нагрузкой:
• Pod CPU: 90%
• Pending pods в очереди
• Autoscaler масштабирует, но не успевает`,
        duration: 800,
        realLatency: 2,
        payload: { clusterLoad: 'high' },
      },
      {
        id: 'over-23',
        fromNode: 'dc-eu-ingress',
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-ingress-order-svc',
        type: 'request',
        title: 'Router → Order Service',
        description: 'Роутинг на Order Service',
        detailedInfo: `NGINX Ingress направляет на Order Service.

ORDER SERVICE СТАТУС:
• Replicas: 10 (scaled up from 3)
• Ready: 7 (3 ещё стартуют)
• Error rate: 45% (высокий!)`,
        duration: 600,
        realLatency: 1,
        payload: { replicas: 10, ready: 7, errorRate: '45%' },
      },
      {
        id: 'over-24',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-ingress-order-svc',
        type: 'request',
        title: 'Service → Order Pod (Sidecar)',
        description: 'Запрос идёт через Sidecar proxy',
        detailedInfo: `⚠️ CIRCUIT BREAKER АКТИВЕН!

SIDECAR PROXY ВИДИТ:
• Error rate за 10 сек: 52%
• Threshold: 50%
• Circuit state: OPEN 🔴

CIRCUIT BREAKER КОНФИГУРАЦИЯ:
• consecutive5xxResponses: 5
• interval: 10s
• baseEjectionTime: 30s
• maxEjectionPercent: 50%

Когда error rate > 50%, Sidecar proxy прекращает
отправлять запросы на перегруженные pods.`,
        duration: 400,
        realLatency: 0.5,
        payload: { circuitState: 'OPEN', errorRate: '52%', threshold: '50%' },
      },
      {
        id: 'over-25',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-istiod',
        edgeId: 'e-dc-eu-istiod-order',
        reverse: true,
        type: 'request',
        title: '🔴 Circuit Breaker CHECK',
        description: 'Sidecar proxy проверяет состояние circuit',
        detailedInfo: `SIDECAR PROXY РЕШАЕТ:

1. Проверяет локальный circuit state
2. State = OPEN (открыт из-за высокого error rate)
3. Последний успешный запрос: 15 сек назад
4. Cooldown: ещё 15 сек до half-open

РЕШЕНИЕ: Немедленно вернуть 503
БЕЗ отправки запроса в Order Service!

ПАТТЕРН: Circuit Breaker (Service Mesh)
Защищает от cascade failures.`,
        duration: 200,
        realLatency: 0.1,
        payload: { circuitState: 'OPEN', action: 'REJECT', reason: 'circuit_open' },
      },
      {
        id: 'over-26',
        fromNode: 'dc-eu-istiod',
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-istiod-order',
        type: 'response',
        title: '🔴 Circuit OPEN',
        description: 'Запрос отклонён без вызова сервиса',
        detailedInfo: `MESH CONTROL PLANE:

Circuit Breaker в состоянии OPEN.
Запрос НЕ будет отправлен в Order Service!

ПОЧЕМУ ЭТО ХОРОШО:
• Не добавляем нагрузку на умирающий сервис
• Быстрый ответ клиенту (~1ms vs ~30s timeout)
• Даём сервису время восстановиться

СОСТОЯНИЯ CIRCUIT BREAKER:
🟢 CLOSED: всё ОК, запросы идут
🟡 HALF-OPEN: пробуем 1 запрос
🔴 OPEN: все запросы отклоняются`,
        duration: 100,
        realLatency: 0.1,
        payload: { circuitState: 'OPEN', nextRetry: '15s' },
      },
      {
        id: 'over-27',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-order-svc',
        edgeId: 'e-dc-eu-ingress-order-svc',
        reverse: true,
        type: 'response',
        title: '❌ 503 Service Unavailable',
        description: 'Sidecar proxy возвращает ошибку',
        detailedInfo: `SIDECAR RESPONSE:

HTTP/1.1 503 Service Unavailable
x-proxy-overloaded: true
x-circuit-state: open

{
  "error": "service_unavailable",
  "reason": "circuit_breaker_open",
  "retryAfter": 15
}

Это НЕ timeout — это быстрый отказ!`,
        duration: 200,
        realLatency: 0.5,
        payload: { status: 503, reason: 'circuit_breaker_open' },
      },

      // ========== OBSERVABILITY ==========
      {
        id: 'over-28',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-prometheus',
        edgeId: 'e-dc-eu-pods-prometheus',
        type: 'async',
        title: '📊 Metrics Export',
        description: 'Метрики Circuit Breaker в Metrics Collector',
        detailedInfo: `МЕТРИКИ ОТПРАВЛЕНЫ:

proxy_cluster_circuit_breakers_open{cluster="order-service"} 1
proxy_cluster_upstream_rq_503{cluster="order-service"} ++
order_service_requests_total{status="503"} ++
order_service_circuit_breaker_state{state="open"} 1

АЛЕРТЫ СРАБОТАЛИ:
🚨 CircuitBreakerOpen - Order Service
🚨 HighErrorRate - Order Service > 50%
🚨 ServiceDegraded - EU DC

PagerDuty уведомил on-call инженера.`,
        duration: 200,
        realLatency: 1,
        payload: { circuitBreakerOpen: true, alerts: ['CircuitBreakerOpen', 'HighErrorRate'] },
      },
      {
        id: 'over-29',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-jaeger',
        edgeId: 'e-dc-eu-pods-jaeger',
        type: 'async',
        title: '📊 Failed Trace',
        description: 'Trace span с ошибкой в Tracing',
        detailedInfo: `TRACE ЗАПИСАН:

{
  "traceId": "abc123",
  "spanId": "xyz789",
  "operationName": "order-service.createOrder",
  "status": "ERROR",
  "error": true,
  "tags": {
    "http.status_code": 503,
    "error.type": "circuit_breaker_open",
    "proxy.circuit_state": "open"
  },
  "duration": "2ms"
}

Инженер может найти этот trace и понять причину.`,
        duration: 200,
        realLatency: 1,
        payload: { traceId: 'abc123', error: true, duration: '2ms' },
      },

      // ========== ERROR RESPONSE PATH ==========
      {
        id: 'over-30',
        fromNode: 'dc-eu-order-svc',
        toNode: 'dc-eu-ingress',
        edgeId: 'e-dc-eu-ingress-order-svc',
        reverse: true,
        type: 'response',
        title: 'Error → Router',
        description: '503 идёт обратно',
        detailedInfo: `NGINX Ingress логирует 503.`,
        duration: 200,
        realLatency: 0.5,
        payload: { statusCode: 503 },
      },
      {
        id: 'over-31',
        fromNode: 'dc-eu-ingress',
        toNode: 'dc-eu-gw',
        edgeId: 'e-dc-eu-gw-ingress',
        reverse: true,
        type: 'response',
        title: 'Router → API Gateway',
        description: '503 через API Gateway',
        detailedInfo: `API Gateway видит 503 от backend.

Может добавить:
• Retry-After header
• Fallback response (если есть)`,
        duration: 200,
        realLatency: 1,
        payload: {},
      },
      {
        id: 'over-32',
        fromNode: 'dc-eu-gw',
        toNode: 'dc-eu-lb',
        edgeId: 'e-dc-eu-lb-gw',
        reverse: true,
        type: 'response',
        title: 'API GW → Regional LB',
        description: '503 через LB',
        detailedInfo: `HAProxy видит 503 — сервис degraded.`,
        duration: 200,
        realLatency: 0.5,
        payload: {},
      },
      {
        id: 'over-33',
        fromNode: 'dc-eu-lb',
        toNode: 'dc-eu',
        edgeId: 'e-dc-eu-lb',
        reverse: true,
        type: 'response',
        title: 'LB → DC Border',
        description: '503 выходит из DC',
        detailedInfo: `Ошибка покидает датацентр.`,
        duration: 200,
        realLatency: 0.5,
        payload: {},
      },
      {
        id: 'over-34',
        fromNode: 'dc-eu',
        toNode: 'global-lb',
        edgeId: 'e-global-lb-dc-eu',
        reverse: true,
        type: 'response',
        title: 'DC → Global LB',
        description: '503 на Global LB',
        detailedInfo: `GLB видит 503 от EU DC.

⚠️ Много 503 = health degradation
GLB может начать отводить трафик на другие ДЦ.`,
        duration: 400,
        realLatency: 1,
        payload: { dcHealth: 'degraded' },
      },
      {
        id: 'over-35',
        fromNode: 'global-lb',
        toNode: 'cdn',
        edgeId: 'e-cdn-global-lb',
        reverse: true,
        type: 'response',
        title: 'Global LB → CDN',
        description: '503 на CDN',
        detailedInfo: `CDN не кэширует 503 ответы.`,
        duration: 400,
        realLatency: 3,
        payload: {},
      },
      {
        id: 'over-36',
        fromNode: 'cdn',
        toNode: 'client',
        edgeId: 'e-client-cdn',
        reverse: true,
        type: 'response',
        title: '❌ 503 → Client',
        description: 'Клиент получает ошибку сервиса',
        detailedInfo: `КЛИЕНТ ПОЛУЧАЕТ:

HTTP/1.1 503 Service Unavailable
Retry-After: 15
x-proxy-overloaded: true

{
  "error": "service_unavailable",
  "message": "Service is temporarily overloaded. Please retry.",
  "retryAfter": 15
}

📱 ЧТО ДОЛЖЕН СДЕЛАТЬ КЛИЕНТ:
1. Показать "Сервис перегружен, попробуйте позже"
2. Exponential backoff: 1s, 2s, 4s, 8s...
3. Может предложить оффлайн-режим

⏱️ ВРЕМЯ ОТВЕТА: ~80ms
(Быстро благодаря Circuit Breaker!)

БЕЗ Circuit Breaker:
• Запрос висел бы 30 секунд
• Потом timeout
• Пользователь уже ушёл

📊 ИТОГИ СЦЕНАРИЯ:
1. Security Layer защитил от abuse (429)
2. Circuit Breaker защитил от cascade failure (503)
3. Observability: метрики, трейсы, алерты
4. Быстрые ответы: 50-80ms вместо 30s timeout`,
        duration: 1200,
        realLatency: 10,
        payload: {
          status: 503,
          message: 'Service temporarily overloaded',
          retryAfter: 15,
          patterns: ['Rate Limiting', 'Circuit Breaker', 'Backpressure', 'Fast Fail']
        },
      },
    ],
  },
]
