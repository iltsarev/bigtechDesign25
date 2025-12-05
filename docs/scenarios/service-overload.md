# Сценарий: Service Overload (Rate Limit + Circuit Breaker)

[← Назад к README](../../README.md) | [Открыть визуализатор](https://iltsarev.github.io/bigtechDesign25/)

## Обзор

Чёрная пятница: нагрузка в 10 раз превышает обычную. Этот сценарий демонстрирует как система защищает себя от перегрузки, сохраняя работоспособность для части пользователей вместо полного отказа для всех.

## Контекст

**Обычная нагрузка:** 1,000 RPS
**Текущая нагрузка:** 10,000 RPS

Без защитных механизмов:
- Все сервисы перегружены
- Очереди переполняются
- Каскадный отказ
- 100% пользователей получают ошибки

С защитными механизмами:
- 70% запросов обрабатываются успешно
- 30% получают 429/503, но могут retry
- Система остаётся стабильной

## Уровни защиты

### Уровень 1: CDN Edge

```
Client → CDN (первая линия защиты)
```

**Механизмы:**
- **DDoS Protection** — фильтрация аномального трафика
- **Bot Detection** — блокировка автоматизированных запросов
- **Edge Rate Limiting** — 1000 req/sec per IP

**Результат:** Отсекается ~20% нелегитимного трафика

### Уровень 2: Load Balancer Rate Limiting

```
Regional LB → Rate Limiter → Redis
```

**Алгоритм: Token Bucket**

```
┌─────────────────┐
│  Token Bucket   │
│                 │
│  Capacity: 100  │
│  Rate: 100/min  │
│  Current: 15    │
└─────────────────┘
         │
         ▼
   Request arrives
         │
         ▼
   Tokens > 0? ──No──→ 429 Too Many Requests
         │
        Yes
         │
         ▼
   Tokens -= 1
   Process request
```

**Конфигурация лимитов:**

| Тип | Лимит | Окно |
|-----|-------|------|
| Per User | 100 req | 1 min |
| Per IP | 1000 req | 1 min |
| Per Endpoint | 10000 req | 1 min |
| Global | 50000 req | 1 sec |

**Ответ при превышении:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699531200
```

### Уровень 3: Circuit Breaker

```
Service A → Circuit Breaker → Service B
```

**Состояния Circuit Breaker:**

```
         ┌──────────────────────────────────────┐
         │                                      │
         ▼                                      │
    ┌─────────┐     failures > threshold   ┌────┴────┐
    │ CLOSED  │ ─────────────────────────→ │  OPEN   │
    │(normal) │                            │ (fail)  │
    └─────────┘                            └────┬────┘
         ▲                                      │
         │                              timeout │
         │     ┌───────────┐                    │
         │     │HALF-OPEN  │ ←─────────────────┘
         │     │  (test)   │
         │     └─────┬─────┘
         │           │
         │    success│
         └───────────┘
```

**Параметры:**
- **Failure Threshold:** 50% ошибок за последние 10 запросов
- **Open Duration:** 30 секунд
- **Half-Open Max Requests:** 3 тестовых запроса

**Когда Circuit Breaker открыт:**
```http
HTTP/1.1 503 Service Unavailable
Retry-After: 30
X-Circuit-State: open
X-Circuit-Reset: 1699531230
```

### Уровень 4: Backpressure

```
Kafka Consumer → Processing → Kafka (с ограниченной скоростью)
```

**Механизмы:**
- **Consumer Lag Monitoring** — отслеживание отставания
- **Adaptive Batch Size** — уменьшение размера batch при перегрузке
- **Pause/Resume** — остановка чтения при переполнении очередей

## Graceful Degradation

Когда система перегружена, отключаются некритичные функции:

| Приоритет | Функция | Статус при перегрузке |
|-----------|---------|----------------------|
| P0 | Оформление заказа | Работает |
| P0 | Оплата | Работает |
| P1 | Поиск товаров | Работает (кэш) |
| P2 | Рекомендации | Отключены |
| P2 | Персонализация | Отключены |
| P3 | Аналитика | Отключена |

**Feature Flags:**
```yaml
degradation:
  recommendations: false
  personalization: false
  analytics: false
  search_suggest: false
```

## Load Shedding стратегии

### 1. LIFO (Last-In-First-Out)
Новые запросы отбрасываются первыми. Справедливо к тем, кто уже ждёт.

### 2. Priority-based
Запросы с высоким приоритетом обрабатываются первыми:
- Premium пользователи
- Критичные endpoints (checkout, payment)
- Запросы с retry (они уже ждали)

### 3. Deadline-based
Запросы с истекающим deadline отбрасываются:
```
if (deadline - now) < processingTime:
    drop request
```

## Метрики и алерты

### Key Metrics

| Метрика | Warning | Critical |
|---------|---------|----------|
| Request Rate | > 8000 RPS | > 10000 RPS |
| Error Rate (5xx) | > 1% | > 5% |
| P99 Latency | > 500ms | > 1000ms |
| Circuit Breaker Opens | > 0 | > 3 |
| Rate Limit Hits | > 10% | > 30% |

### Alerting

```yaml
- alert: HighErrorRate
  expr: rate(http_errors_total[5m]) > 0.05
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Error rate > 5%"

- alert: CircuitBreakerOpen
  expr: circuit_breaker_state == 1
  for: 0m
  labels:
    severity: warning
  annotations:
    summary: "Circuit breaker is open"
```

## Auto-scaling

При высокой нагрузке автоматически добавляются ресурсы:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 3
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

**Время масштабирования:**
- Scale-up: ~30 секунд (aggressive)
- Scale-down: ~5 минут (conservative)

## Связанные сценарии

- [Создание заказа](create-order.md) — нормальный путь запроса
- [DC Failover](dc-failover.md) — отказоустойчивость датацентров
