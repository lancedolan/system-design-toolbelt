// Mermaid diagram source, one per pattern id. See data.js for the patterns.
const DIAGRAMS = {
  "asynchronous-request-reply": `sequenceDiagram
  participant Client
  participant API
  participant DB
  participant Queue
  participant Worker
  Client->>API: POST job
  API->>DB: save job 7 as Pending
  API->>Queue: enqueue job 7
  API-->>Client: 202 Accepted, Location status url, Retry-After
  Queue-->>Worker: job 7
  Worker->>DB: job 7 Running
  Client->>API: GET status url
  API-->>Client: 200 Running
  Worker->>DB: job 7 Succeeded with result
  Client->>API: GET status url
  API-->>Client: 303 See Other to result url`,

  "queue-based-load-leveling": `flowchart LR
  client[Client] -->|bursty writes| api[API]
  api -->|enqueue| queue[[Queue]]
  queue -.->|steady pull| worker[Worker]
  worker -->|writes row| db[(DB)]`,

  "competing-consumers": `flowchart LR
  producer[API] -->|enqueue| queue[[Queue]]
  queue -.-> w1[Worker 1]
  queue -.-> w2[Worker 2]
  queue -.-> w3[Worker 3]
  w1 --> db[(DB)]
  w2 --> db
  w3 --> db`,

  "priority-queue": `flowchart LR
  sender[Service A] --> router{priority label}
  router -->|high| hq[[High Queue]]
  router -->|low| lq[[Low Queue]]
  hq -.-> hw["High Workers (scale up to 10)"]
  lq -.-> lw["Low Workers (2 always reserved)"]`,

  "claim-check": `flowchart LR
  producer[Service A] -->|upload payload| store[(Store)]
  producer -->|send small token| broker[[Broker]]
  broker -.->|token| consumer[Service B]
  consumer -->|fetch payload| store`,

  "dead-letter-queue": `flowchart LR
  queue[[Queue]] -.->|deliver| worker[Worker]
  worker -.->|fails, message not deleted| queue
  queue -->|receive count hits max| dlq[[Dead Letter Queue]]
  dlq -.->|message count above 0| alarm[Alarm]
  alarm -.-> ops[Operator]`,

  "idempotency-key": `sequenceDiagram
  participant Client
  participant API
  participant Store
  Client->>API: POST charge with key abc
  API->>Store: reserve key abc
  API-->>Client: 201 charge created
  Client->>API: retry POST with key abc
  API->>Store: key abc already used
  API-->>Client: 201 same result no new charge`,

  "valet-key": `flowchart LR
  client[Client] -->|ask to write file 42| api["API (checks caller)"]
  api -->|token: file 42 only, write only, expires in 5 min| client
  client -->|upload bytes with token| store[(Store)]`,

  "api-gateway": `flowchart LR
  client[Client] --> gateway[Gateway]
  gateway --> svcA[Service A]
  gateway --> svcB[Service B]
  gateway --> svcC[Service C]`,

  "backends-for-frontends": `flowchart LR
  mobile[Mobile Client] --> bffm["BFF (mobile)"]
  web[Web Client] --> bffw["BFF (web)"]
  bffm --> svcA[Service A]
  bffm --> svcB[Service B]
  bffw --> svcA
  bffw --> svcB`,

  "gateway-aggregation": `sequenceDiagram
  participant Client
  participant Gateway
  participant ServiceA as Service A
  participant ServiceB as Service B
  Client->>Gateway: one request
  Gateway->>ServiceA: fetch profile
  Gateway->>ServiceB: fetch orders
  ServiceA-->>Gateway: profile
  ServiceB-->>Gateway: orders
  Gateway-->>Client: one combined response`,

  "cache-aside": `sequenceDiagram
  participant API
  participant Cache
  participant DB
  Note over API,DB: read
  API->>Cache: get key user 42
  Cache-->>API: miss
  API->>DB: read row 42
  DB-->>API: row
  API->>Cache: set key user 42 with expiry
  Note over API,DB: write
  API->>DB: update row 42
  API->>Cache: then delete key user 42`,

  "sharding": `flowchart LR
  client[Client] --> api[API]
  api --> router{shard key}
  router -->|users a to h| s1[(Shard 1)]
  router -->|users i to p| s2[(Shard 2)]
  router -->|users q to z| s3[(Shard 3)]`,

  "materialized-view": `flowchart LR
  source[(Source DB)] -.->|precompute joins| builder[Worker]
  builder -->|writes rows| view[(Materialized View)]
  client[Client] --> api[API]
  api -->|fast read| view`,

  "index-table": `flowchart LR
  client[Client] -->|find by email| api[API]
  api -->|lookup email| idx[(Index Table)]
  idx -->|returns user id| api
  api -->|read by id| db[(DB)]`,

  "cqrs": `flowchart LR
  client[Client] --> cmd[Write API]
  client --> qry[Read API]
  cmd -->|writes row| wdb[(Write DB)]
  wdb -.->|publish changes| sync[Worker]
  sync -->|update projection| rdb[(Read DB)]
  qry -->|reads| rdb`,

  "event-sourcing": `flowchart LR
  client[Client] --> api[API]
  api -->|append event| log[(Event Store)]
  log -.->|replay events| proj[Worker]
  proj -->|rebuild state| view[(Current State)]
  api -->|reads| view`,

  "database-per-service": `flowchart LR
  client[Client] --> gateway[Gateway]
  subgraph Orders
    svcA[Service A] --> dbA[(Orders DB)]
  end
  subgraph Billing
    svcB[Service B] --> dbB[(Billing DB)]
  end
  gateway --> svcA
  gateway --> svcB
  svcA -.->|api call only| svcB`,

  "change-data-capture": `flowchart LR
  app[Service A] -->|writes row| db[(DB)]
  db -.->|transaction log| cdc[CDC Connector]
  cdc -.->|change events| broker[[Broker]]
  broker -.-> search[Search Index]
  broker -.-> warehouse[(Warehouse)]`,

  "transactional-outbox": `flowchart LR
  api[API] -->|one transaction| db
  subgraph db[DB]
    orders[(orders table)]
    outbox[(outbox table)]
  end
  outbox -.->|poll unsent rows| relay[Worker]
  relay -.->|publish| broker[[Broker]]`,

  "saga": `sequenceDiagram
  participant Orchestrator
  participant Orders as Service A
  participant Payments as Service B
  participant Shipping as Service C
  Orchestrator->>Orders: create order
  Orchestrator->>Payments: take payment
  Orchestrator->>Shipping: reserve stock
  Shipping-->>Orchestrator: failed
  Orchestrator->>Payments: refund payment
  Orchestrator->>Orders: cancel order`,

  "compensating-transaction": `sequenceDiagram
  participant Client
  participant API
  participant ServiceA as Service A
  participant ServiceB as Service B
  Client->>API: book trip
  API->>ServiceA: book flight ok
  API->>ServiceB: book hotel failed
  API->>ServiceA: cancel flight
  API-->>Client: booking rolled back`,

  "circuit-breaker": `stateDiagram-v2
  [*] --> Closed
  Closed --> Open: failure threshold hit
  Open --> HalfOpen: cooldown elapsed
  HalfOpen --> Closed: trial call succeeds
  HalfOpen --> Open: trial call fails
  note right of Open
    calls fail fast
  end note`,

  "retry-with-backoff-and-jitter": `sequenceDiagram
  participant Client
  participant ServiceA as Service A
  Client->>ServiceA: attempt 1
  ServiceA-->>Client: 503
  Note over Client: wait random 0 to min(cap, base x 2)
  Client->>ServiceA: attempt 2
  ServiceA-->>Client: 503
  Note over Client: wait random 0 to min(cap, base x 4)
  Client->>ServiceA: attempt 3
  ServiceA-->>Client: 503
  Note over Client: max attempts reached, stop and return error`,

  "bulkhead": `flowchart LR
  client[Client] --> api[API]
  subgraph PoolA
    p1["Pool A (10 threads)"] --> svcA[Service A]
  end
  subgraph PoolB
    p2["Pool B (10 threads)"] --> svcB[Service B]
  end
  api --> p1
  api --> p2`,

  "rate-limiting": `flowchart LR
  svcA[Service A] -->|enqueue all records| queue[[Queue]]
  queue -.->|20 every 200ms| w1[Worker 1]
  queue -.->|20 every 200ms| w2[Worker 2]
  w1 -->|lease locks| locks[(Lock Store)]
  w2 -->|lease locks| locks
  w1 -->|send only what locks allow| api[Downstream API]
  w2 -->|send only what locks allow| api
  w1 -.->|rejected, requeue after random wait| queue`,

  "throttling": `flowchart LR
  client[Client] -->|API key| api[API]
  api -->|count request| counter[(Counter per caller)]
  api --> quota{caller over limit}
  quota -->|yes| reject["429 with Retry-After"]
  quota -->|no| load{in-flight load near cap}
  load -->|yes, reject a growing share| reject
  load -->|no| svcA[Service A]`,

  "shuffle-sharding": `flowchart LR
  t1[Tenant 1] --> n1[Node 1]
  t1 --> n2[Node 2]
  t2[Tenant 2] --> n2
  t2 --> n3[Node 3]
  t3[Tenant 3] --> n1
  t3 --> n4[Node 4]`,

  "leader-election": `flowchart LR
  i1[Instance 1] -->|wins lock| registry[Registry]
  i2[Instance 2] -->|lock taken| registry
  i3[Instance 3] -->|lock taken| registry
  registry -->|is leader| i1
  i1 -.->|runs scheduled job| db[(DB)]`,

  "scheduler-agent-supervisor": `flowchart LR
  scheduler[Scheduler] -->|record step| store[(State Store)]
  scheduler --> agent[Agent]
  agent -->|calls| svcA[Service A]
  agent -->|update status| store
  supervisor[Supervisor] -.->|scan for stalled| store
  supervisor -.->|retry or undo| scheduler`,

  "deployment-stamps": `flowchart LR
  client[Client] --> router[Traffic Router]
  subgraph Stamp1
    api1[API] --> db1[(DB)]
  end
  subgraph Stamp2
    api2[API] --> db2[(DB)]
  end
  router -->|tenants a to m| api1
  router -->|tenants n to z| api2`,

  "geodes": `flowchart LR
  eu[EU Client] --> glb[Global Load Balancer]
  us[US Client] --> glb
  glb -->|EU users, nearest geode| apiEU
  glb -->|US users, nearest geode| apiUS
  glb -.->|US users, if Geode US is down| apiEU
  subgraph GeodeEU[Geode EU]
    apiEU[API] -->|reads and writes| dbEU[(DB)]
  end
  subgraph GeodeUS[Geode US]
    apiUS[API] -->|reads and writes| dbUS[(DB)]
  end
  dbEU <-.->|replicate writes both ways| dbUS`,

  "sidecar": `flowchart LR
  client[Client] --> sc1[Sidecar]
  subgraph PodA
    sc1 -->|localhost| app[Service A]
  end
  sc1 -.->|metrics and traces| telemetry[Telemetry]
  sc1 -.->|reads config| registry[Registry]`,

  "service-discovery": `flowchart LR
  a1[Service A instance] -.->|register on start| registry[Registry]
  a2[Service A instance] -.->|register on start| registry
  client[Service B] -->|lookup service a| registry
  registry -->|healthy addresses| client
  client -->|calls| a1`,

  "publisher-subscriber": `flowchart LR
  pub[Service A] -->|publish event| broker[[Broker]]
  broker -.-> subA[Email Service]
  broker -.-> subB[Search Indexer]
  broker -.-> subC[Analytics]`,

  "canary-release": `flowchart LR
  client[Client] --> router{split traffic}
  router -->|95 percent| stable["API (v1)"]
  router -->|5 percent| canary["API (v2)"]
  canary -.->|error rate| metrics[Metrics]
  metrics -.->|rollback or promote| router`,

  "blue-green-deployment": `flowchart LR
  client[Client] --> router[Router]
  router -->|live traffic| blue["API (blue v1)"]
  router -.->|idle standby| green["API (green v2)"]
  green -.->|smoke tests pass| router
  blue --> db[(DB)]
  green --> db`,

  "feature-toggles": `flowchart LR
  client[Client] --> api[API]
  api -->|read flag| flags[(Flag Store)]
  api --> gate{flag on}
  gate -->|yes| newpath[New code path]
  gate -->|no| oldpath[Old code path]
  admin[Operator] -.->|flip flag| flags`,

  "strangler-fig": `flowchart LR
  client[Client] --> facade[Gateway]
  facade -->|migrated routes| newsvc[Service A]
  facade -->|remaining routes| legacy[Legacy System]
  newsvc --> db[(DB)]
  legacy --> legacydb[(Legacy DB)]`,

  "anti-corruption-layer": `flowchart LR
  domain[Service A] --> acl["Anti-Corruption Layer"]
  acl -->|translates model| legacy[Legacy System]
  legacy -->|legacy response| acl
  acl -->|clean domain object| domain`,

  "gatekeeper": `flowchart LR
  client[Untrusted Client] --> gk[Gatekeeper]
  gk --> valid{request valid}
  valid -->|no| drop[Reject]
  valid -->|yes| trusted[Service A]
  trusted --> db[(DB)]`,

  "federated-identity": `sequenceDiagram
  participant Client
  participant API
  participant IdP as Identity Provider
  Client->>API: request page, no session
  API-->>Client: redirect to IdP
  Client->>IdP: sign in with password and second factor
  IdP-->>Client: redirect back with short code
  Client->>API: send code
  API->>IdP: trade code for token
  IdP-->>API: signed token with user id and roles
  API-->>Client: session holding token
  Client->>API: later request with token
  API->>API: check signature, read roles
  API-->>Client: 200 ok`,

  "distributed-tracing": `flowchart LR
  client[Client] -->|trace id abc| gateway[Gateway]
  gateway -->|same trace id| svcA[Service A]
  svcA -->|same trace id| svcB[Service B]
  gateway -.->|span| collector[Trace Collector]
  svcA -.->|span| collector
  svcB -.->|span| collector`,
};
