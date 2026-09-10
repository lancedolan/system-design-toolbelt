# System Design Patterns — Trigger Reference

## Request handling / API

| Pattern | Trigger | URL |
|---|---|---|
| Asynchronous Request-Reply | Work takes longer than a caller is willing to hold a connection open for. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/async-request-reply) |
| Queue-Based Load Leveling | Service is hit by intermittent heavy loads that may overwhelm it. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling) |
| Competing Consumers | A single worker can't keep up with the backlog and processing needs to scale horizontally. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/competing-consumers) |
| Priority Queue | Some requests must be serviced ahead of others rather than strictly in arrival order. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/priority-queue) |
| Claim-Check | Messages carry payloads too large for the message bus to handle efficiently. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/claim-check) |
| Dead-Letter Queue | Poison messages keep failing and would otherwise block or endlessly recycle through the queue. | [amazon.com](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html) |
| Idempotency Key | Clients retry writes and a duplicate would cause real damage, like double-charging. | [stripe.com](https://docs.stripe.com/api/idempotent_requests) |
| Valet Key | Bulk data transfer would otherwise flow through your application servers as a bottleneck. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/valet-key) |
| API Gateway | Clients would otherwise need to know about and call many individual services directly. | [microservices.io](https://microservices.io/patterns/apigateway.html) |
| Backends for Frontends | A shared API is being pulled in conflicting directions by mobile, web, and partner clients. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends) |
| Gateway Aggregation | A single client action requires many backend round trips over a slow network. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/gateway-aggregation) |

## Data

| Pattern | Trigger | URL |
|---|---|---|
| Cache-Aside | Reads repeatedly hit the same expensive data and read volume dominates writes. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside) |
| Sharding | Data volume or write throughput exceeds what one database instance can hold or serve. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding) |
| Materialized View | Query-time joins or aggregations are too slow against the normalized source schema. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/materialized-view) |
| Index Table | Queries need to filter on a field that isn't the shard or partition key. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/index-table) |
| CQRS | Read and write workloads have such different shapes and scale that one model serves neither well. | [martinfowler.com](https://martinfowler.com/bliki/CQRS.html) |
| Event Sourcing | You need full history, audit, or replay rather than just the current state. | [martinfowler.com](https://martinfowler.com/eaaDev/EventSourcing.html) |
| Database per Service | Services are coupled through a shared schema and can't deploy or scale independently. | [microservices.io](https://microservices.io/patterns/data/database-per-service.html) |
| Change Data Capture | Downstream systems need to react to database changes without the source app publishing events. | [confluent.io](https://www.confluent.io/learn/change-data-capture/) |
| Transactional Outbox | A write and its event publish must both happen or neither, across two systems. | [microservices.io](https://microservices.io/patterns/data/transactional-outbox.html) |
| Saga | A business transaction spans multiple services and distributed ACID isn't available. | [microservices.io](https://microservices.io/patterns/data/saga.html) |
| Compensating Transaction | A multi-step operation fails partway and already-completed steps must be undone. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction) |

## Resilience / control

| Pattern | Trigger | URL |
|---|---|---|
| Circuit Breaker | A failing dependency is being hammered with doomed calls, wasting resources and slowing everything down. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) |
| Retry with Backoff and Jitter | Failures are transient, but naive retries risk synchronized retry storms. | [amazon.com](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) |
| Bulkhead | One misbehaving workload or tenant can exhaust shared pools and take down unrelated functionality. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) |
| Rate Limiting | Your own callers or jobs must be paced to stay within a downstream service's limits. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern) |
| Throttling | Demand can exceed capacity and you'd rather shed or slow load than fail entirely. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/throttling) |
| Shuffle Sharding | A single abusive tenant in a shared fleet would otherwise degrade a large fraction of customers. | [amazon.com](https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/) |
| Leader Election | Exactly one instance in a cluster must coordinate or own a task at a time. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/leader-election) |
| Scheduler Agent Supervisor | Long-running distributed workflows need something to detect and recover stalled or failed steps. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/scheduler-agent-supervisor) |

## Topology / deployment

| Pattern | Trigger | URL |
|---|---|---|
| Deployment Stamps | You need to cap blast radius and scale by cloning independent units rather than growing one stack. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/deployment-stamp) |
| Geodes | Users are globally distributed and need low-latency reads and writes from any region. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/geodes) |
| Sidecar | Cross-cutting concerns like TLS, telemetry, or config must be added without touching app code. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/sidecar) |
| Service Discovery | Service instances come and go dynamically, so endpoints can't be hardcoded. | [microservices.io](https://microservices.io/patterns/service-registry.html) |
| Publisher-Subscriber | One event needs to reach many consumers whose identities the producer shouldn't know. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/publisher-subscriber) |
| Canary Release | A risky change needs real production traffic on a small slice before full rollout. | [martinfowler.com](https://martinfowler.com/bliki/CanaryRelease.html) |
| Blue-Green Deployment | Deploys need near-zero downtime and instant rollback. | [martinfowler.com](https://martinfowler.com/bliki/BlueGreenDeployment.html) |
| Feature Toggles | Release timing must be decoupled from deploy timing, or behavior toggled without a redeploy. | [martinfowler.com](https://martinfowler.com/articles/feature-toggles.html) |

## Migration / boundaries

| Pattern | Trigger | URL |
|---|---|---|
| Strangler Fig | A legacy system must be replaced incrementally because a big-bang rewrite is too risky. | [martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html) |
| Anti-Corruption Layer | A legacy or third-party model would otherwise leak its concepts into your clean domain. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer) |
| Gatekeeper | Untrusted external traffic needs validation and sanitization before it can touch sensitive systems. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/gatekeeper) |
| Federated Identity | Authentication should be delegated to an external identity provider instead of managing credentials. | [microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/federated-identity) |
| Distributed Tracing | A request crosses many services and you can't tell where latency or failures originate. | [microservices.io](https://microservices.io/patterns/observability/distributed-tracing.html) |
