# BigTech Architecture Visualizer

Интерактивный образовательный визуализатор архитектуры распределённых систем уровня BigTech. Показывает полный путь запроса от мобильного клиента через DNS, CDN, балансировщики нагрузки, API Gateway, container orchestration, микросервисы, кэши, базы данных и очереди сообщений.

**[Открыть демо](https://iltsarev.github.io/bigtechDesign25/)**

![Architecture Visualizer](docs/preview.png)

## Возможности

- Анимированная визуализация потока запросов через инфраструктуру
- Три уровня детализации: Global → Datacenter → Cluster
- Подробные объяснения каждого шага с паттернами и best practices
- Несколько сценариев для изучения разных аспектов системы

## Сценарии

### 1. Создание заказа (полный путь + SAGA)
Полный путь запроса от клиента до базы данных с SAGA паттерном для распределённых транзакций.

**Что показывает:**
- DNS Lookup и Geo-routing
- CDN как edge proxy и WAF
- Global и Regional Load Balancing
- JWT авторизация с blacklist в distributed cache
- Rate Limiting (Token Bucket)
- Service Mesh с sidecar proxies
- SAGA паттерн через Event Bus
- Репликация между датацентрами

[Подробное описание →](docs/scenarios/create-order.md)

### 2. DC Failover (EU недоступен)
Демонстрация отказоустойчивости при недоступности целого датацентра.

**Что показывает:**
- Health checks на уровне Global LB
- Автоматическое переключение трафика
- Прозрачность failover для клиента
- Active-Active архитектура

[Подробное описание →](docs/scenarios/dc-failover.md)

### 3. Service Overload (Rate Limit + Circuit Breaker)
Чёрная пятница: защита системы от перегрузки при 10x трафике.

**Что показывает:**
- Rate Limiting на разных уровнях
- Circuit Breaker паттерн
- Graceful degradation
- Backpressure механизмы

[Подробное описание →](docs/scenarios/service-overload.md)

## Архитектура визуализатора

```
src/
├── components/
│   ├── flow/           # React Flow компоненты
│   │   ├── nodes/      # Кастомные ноды (Client, DNS, CDN, LB, DC, etc.)
│   │   └── edges/      # AnimatedEdge для визуализации запросов
│   ├── controls/       # Управление воспроизведением, выбор сценария
│   └── panels/         # Информационная панель, легенда
├── data/
│   ├── architecture.ts # Определения нод/связей для каждого уровня
│   └── scenarios/      # Определения шагов анимации
├── stores/             # Zustand stores
└── types/              # TypeScript интерфейсы
```

## Технологии

- **React 18** + **TypeScript** + **Vite**
- **React Flow** — визуализация графов
- **Zustand** — управление состоянием
- **Tailwind CSS** — стилизация
- **Lucide React** — иконки

## Запуск локально

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Продакшен сборка
npm run build
```

## Уровни визуализации

### Global Level
Клиент → DNS → CDN → Global LB → Data Centers (EU, US, Asia)

### Datacenter Level
Regional LB → Rate Limiter → API Gateway → Auth → Compute Cluster

### Cluster Level
Ingress → Services → Pods → Sidecars → Cache/DB/Event Bus

## Лицензия

MIT
