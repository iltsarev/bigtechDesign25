# Сценарий: Создание заказа (полный путь + SAGA)

[← Назад к README](../../README.md) | [Открыть визуализатор](https://iltsarev.github.io/bigtechDesign25/)

## Обзор

Этот сценарий демонстрирует полный путь запроса на создание заказа в e-commerce системе — от нажатия кнопки "Оформить заказ" в мобильном приложении до сохранения данных в базе и репликации между датацентрами.

## Фазы запроса

### Фаза 1: Маршрутизация к датацентру

```
Client → DNS → CDN → Global LB → Data Center
```

**Ключевые паттерны:**
- **Geo-DNS** — направление пользователя в ближайший датацентр по геолокации
- **Anycast** — один IP адрес, множество серверов по всему миру
- **Edge Computing** — TLS termination и WAF на CDN edge

**Реальные задержки:**
| Компонент | Latency |
|-----------|---------|
| DNS Lookup | ~25ms |
| CDN Edge | ~8ms |
| Global LB → DC | ~3ms |

### Фаза 2: Авторизация

```
API Gateway → Auth Service → Redis (Session Store)
```

**Ключевые паттерны:**
- **JWT Token Validation** — локальная проверка подписи без обращения к БД
- **Token Blacklisting** — проверка отзыва токена в Redis
- **Claims-based Identity** — вся информация о пользователе в токене

**Важно:** 99% запросов валидируются локально. Обращение к Auth Service только для проверки blacklist.

### Фаза 3: Rate Limiting

```
Regional LB → Rate Limiter → Redis (Counters)
```

**Ключевые паттерны:**
- **Token Bucket** — алгоритм ограничения запросов
- **Distributed Rate Limiting** — единый счётчик для всех инстансов балансировщика
- **Sliding Window** — окно 60 секунд с атомарным INCR в Redis

**Лимиты:**
- Обычный пользователь: 100 req/min
- Premium: 500 req/min

### Фаза 4: Kubernetes Cluster

```
Ingress → Order Service Pod → Sidecar (Envoy)
```

**Ключевые паттерны:**
- **Service Mesh** — sidecar proxy для каждого pod
- **mTLS** — шифрование трафика между сервисами
- **Observability** — автоматический сбор метрик, логов, traces

### Фаза 5: SAGA Pattern

```
Order Service → Kafka → [Inventory, Payment, Notification Services]
```

**Почему SAGA, а не распределённая транзакция:**
- 2PC (Two-Phase Commit) блокирует ресурсы и плохо масштабируется
- SAGA — последовательность локальных транзакций с компенсациями
- Kafka гарантирует доставку событий (at-least-once)

**Последовательность событий:**
1. `OrderCreated` → Order Service создаёт заказ в статусе PENDING
2. `ReserveInventory` → Inventory Service резервирует товары
3. `ProcessPayment` → Payment Service списывает средства
4. `SendNotification` → Notification Service отправляет email

**Компенсации (при ошибке):**
- Payment failed → `ReleaseInventory` → `CancelOrder`

### Фаза 6: Репликация между ДЦ

```
EU DC → Kafka (Cross-DC) → US DC, Asia DC
```

**Ключевые паттерны:**
- **Async Replication** — eventual consistency между регионами
- **Conflict Resolution** — Last-Write-Wins или vector clocks
- **Read-Your-Writes** — sticky sessions для консистентности чтения

## Компоненты

| Компонент | Роль | Технологии |
|-----------|------|------------|
| DNS | Service Discovery | Route 53, Cloudflare |
| CDN | Edge Caching, WAF | Cloudflare, Fastly |
| Global LB | Geo-routing | Google Cloud LB, AWS GLB |
| Regional LB | Rate Limit, Load Balancing | HAProxy, Envoy |
| API Gateway | Auth, Routing | Kong, Envoy |
| Kubernetes | Container Orchestration | K8s, EKS, GKE |
| Kafka | Event Streaming | Apache Kafka, Confluent |
| Redis | Session, Cache, Rate Limit | Redis Cluster |
| PostgreSQL | Primary Database | CockroachDB, Spanner |

## Метрики успеха

- **P99 Latency** < 200ms (для запроса на создание заказа)
- **Availability** > 99.99%
- **Throughput** > 10,000 orders/sec

## Связанные паттерны

- [Circuit Breaker](service-overload.md) — защита от каскадных отказов
- [DC Failover](dc-failover.md) — отказоустойчивость на уровне датацентров
