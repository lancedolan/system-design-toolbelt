// Mermaid source for the "before" diagram of a quiz scenario, keyed by scenario id.
// Each one shows the architecture described in the scenario while the problem is
// still present. Scenarios missing from this map render with no diagram.
const SCENARIO_DIAGRAMS = {
  "asynchronous-request-reply-1": `flowchart TD
  creator["Creator browser"] -->|"POST 900 MB source file"| lb["Load balancer · kills connection idle over 60s"]
  creator -.->|"re-uploads same file 3 to 4 times"| lb
  lb -->|"HTTP connection held open"| api["Upload API"]
  api -->|"stores source"| store[("Object store")]
  api -->|"blocks 3 to 9 min"| tc["Transcoder · 6 renditions"]
  tc -->|"writes renditions"| store
  api -->|"video row"| db[("Video metadata DB")]
  store -.-> cdn["CDN"]
  cdn -.-> viewer["Viewers"]`,

  "asynchronous-request-reply-2": `flowchart TD
  pacs["Hospital imaging archive"] --> intsrv["Vendor integration server · gives up at 120s"]
  intsrv -->|"outbound HTTPS only"| fw["Hospital firewall · no inbound connections"]
  fw -->|"POST /studies/analyze"| gw["API gateway"]
  gw -->|"request held open"| api["Scoring API"]
  api -->|"waits 2 to 6 min per study"| gpu["GPU worker · model inference"]
  gpu -->|"writes report"| reports[("Report store")]
  api -->|"study row"| db[("Study DB")]`,

  "asynchronous-request-reply-3": `flowchart TD
  browser["Customer browser · tab spins with no progress"] -->|"click Generate Year-End Statements"| cdn["CDN · returns 504 at 100s"]
  cdn -->|"HTTP request held open"| app["Payroll app"]
  app -->|"blocks 90s to 4 min"| gen["Statement generator"]
  gen -->|"reads 40,000 employee rows"| db[("Payroll DB")]
  gen -->|"writes PDF bundle"| store[("Object store")]
  db -.-> cache[("Read cache")]
  cache -.-> app`,

  "asynchronous-request-reply-4": `flowchart TD
  partner["Partner Java client · drops socket at 30s"] -->|"POST route with 350 stops"| fw["Partner firewall · no inbound port for callbacks"]
  fw --> gw["API gateway"]
  gw --> api["Route API · web threads blocked while waiting"]
  api -->|"waits 2 to 11 min"| solver["Solver fleet · background machines"]
  solver -->|"lookups"| matrix[("Distance matrix cache")]
  solver -->|"writes solved route"| db[("Route DB")]`,

  "asynchronous-request-reply-5": `flowchart TD
  agency["Agency script · calls endpoint in a loop"] -->|"request audience export"| gw["API gateway · caps response at 29s"]
  gw -->|"504 after 29s"| agency
  gw -->|"request held open"| api["Export API"]
  api -->|"starts duplicate exports"| job["Export job"]
  job -->|"scans 400 million rows over 5 to 20 min"| warehouse[("Audience warehouse")]
  job -->|"writes finished file"| store[("Export storage · no link back to caller")]`,

  "queue-based-load-leveling-1": `flowchart TD
  meters["40,000 smart meters · all report at the top of the hour"] -->|"12,000 writes/s for 90s, then idle 58 min"| lb["Load balancer"]
  lb --> ingest["Meter ingest service"]
  ingest -->|"direct writes"| appliance[("Vendor appliance · 500 writes/s, connection pool fills")]
  appliance --> billing["Billing and reporting app"]
  billing --> cache[("Read cache")]
  ops["Operations dashboard"] --> billing`,

  "queue-based-load-leveling-2": `flowchart TD
  clients["200,000 game clients · finish matches in a 2 minute wave"] --> gs["Game servers"]
  gs -->|"direct write per match, then waits"| stats["Stats service · handles 800 writes/s, falls over near 3,000"]
  clients -.->|"timeouts trigger client retries"| gs
  stats --> db[("Stats DB")]
  profile["Career stats API"] --> cache[("Stats cache")]
  cache --> db
  clients --> profile`,

  "queue-based-load-leveling-3": `flowchart TD
  pos["Store POS terminals"] --> lb["Load Balancer"]
  web["Web storefront"] --> lb
  lb --> svc["Store Service · 60 instances"]
  svc --> cache[("Catalog Cache")]
  svc --> db[("Inventory DB")]
  svc -->|"20 calls/s normal · 900 calls/s in a flash sale"| soap["WMS SOAP endpoint · vendor appliance, no added servers"]
  soap --> wms[("Warehouse Management DB")]`,

  "queue-based-load-leveling-4": `flowchart TD
  cron["4,000 merchant cron jobs · all fire at 00:00 UTC"] -->|"4,000 uploads in 30 s, then nothing for 23 h"| gw["Upload API Gateway"]
  gw --> proc["File Processing Service · fixed hardware sized for 3 files/s"]
  proc --> cache[("Merchant Config Cache")]
  proc --> files[("Settlement File Store")]
  proc --> db[("Payments DB")]
  proc -.->|"restarts at midnight, 1 h manual recovery"| oncall["On-call engineer"]`,

  "queue-based-load-leveling-5": `flowchart TD
  mobile["Mobile app users"] --> lb["Load Balancer"]
  web["Web users"] --> lb
  lb --> api["Upload API · waits for the resize to finish"]
  api -->|"original bytes"| blob[("Photo Object Store")]
  api --> meta[("Photo Metadata DB")]
  api -->|"50 images/s normal · 4,000 images/s when a large account posts"| img["Image Resize Service · fixed thread pool, kept at peak size, idle 95% of the day"]
  img --> thumbs[("Thumbnail Store")]
  thumbs --> cdn["CDN"]`,

  "competing-consumers-1": `flowchart TD
  portal["Policyholder portal"] --> api["Claims API"]
  agents["Agent desktop"] --> api
  api --> db[("Claims DB")]
  api --> cache[("Policy Lookup Cache")]
  api -->|"~10 claims/s during business hours"| queue[["Claims Queue · 300,000 messages, oldest is 9 h old"]]
  queue -.->|"one message at a time"| worker["Enrichment Worker · 1 process, 4 s per claim, box at 6% CPU"]
  worker -->|"mostly network waiting"| ext["External enrichment APIs"]
  worker --> db`,

  "competing-consumers-2": `flowchart TD
  creators["Creators"] --> api["Upload API"]
  api --> blob[("Clip Object Store")]
  api -->|"5 uploads/s · backlog grows ~300,000 clips/day"| queue[["Moderation Queue"]]
  queue -.->|"one message at a time"| proc["Moderation Process · 1 container, 2 vCPU, 12 s per clip"]
  proc -->|"downloads clip"| blob
  proc --> clf["Classifier · not CPU bound"]
  proc --> db[("Moderation Results DB")]
  db -->|"new uploads unreviewed for 6 h"| feed["Feed Service"]
  viewers["Viewers"] --> feed`,

  "competing-consumers-3": `flowchart TD
  product["Product services"] -->|"password reset emails"| api["Notification API"]
  marketing["Marketing tool"] -->|"500,000 messages in 10 min"| api
  api --> queue[["Email Queue · one queue for transactional and marketing mail"]]
  queue -.->|"one message at a time"| sender["Sender Process · 1 process, 300 ms per send, ~3 messages/s"]
  cache[("Template Cache")] --> sender
  sender -->|"reset mail now arrives 40 min late"| provider["Mail Provider · accepts 2,000 requests/s"]
  sender --> db[("Send Results DB")]`,

  "competing-consumers-4": `flowchart TD
  seq["Sequencers · 400 samples/day"] --> intake["Sample Intake Service"]
  intake --> raw[("Raw Read Store")]
  intake -->|"one message per sample"| queue[["Sample Queue · two week backlog"]]
  queue -.->|"one message at a time"| proc["Analysis Process · 1 process, 6 min pipeline, 10 samples/h"]
  cluster["Compute Cluster · 200 cores idle"] -.->|"runs"| proc
  proc -->|"reads raw data"| raw
  proc --> results[("Results DB")]
  results --> portal["Lab Portal"]`,

  "competing-consumers-5": `flowchart TD
  wh["Warehouses"] -->|"90,000 label requests in 20 min"| api["Shipping API"]
  api -->|enqueue| queue[["Label Queue · durable · 90,000 waiting"]]
  api --> db[("Label Store")]
  queue -.->|"one message at a time · 20 h to drain"| gen["Label Generator · 1 process"]
  gen -->|"800 ms per label"| carrier["Carrier API · accepts 500 req/s"]
  gen -->|"write label"| db
  db --> pick["Truck Loading Screen · 4 PM cutoff"]`,

  "priority-queue-1": `flowchart TD
  analyzers["Lab Analyzers"] -->|"stat troponin at 2:05 AM"| ingest["Lab Result Service"]
  batch["Overnight Batch Job"] -->|"20,000 routine results at 2 AM"| ingest
  ingest -->|enqueue| stream[["Result Stream · single, arrival order"]]
  stream -.->|arrival order| w1["Result Worker 1"]
  stream -.->|arrival order| w2["Result Worker 2"]
  stream -.->|arrival order| w3["Result Worker 3"]
  w1 --> chart[("Patient Chart DB")]
  w2 --> chart
  w3 --> chart
  chart -->|"stat result posted 40 min later"| view["Clinician Chart · 2 min rule"]`,

  "priority-queue-2": `flowchart TD
  pos["Card Terminals"] -->|"live authorization · under 3 s"| auth["Authorization Service"]
  auth -->|submit review job| queue[["Review Job Stream · single, arrival order"]]
  risk["Overnight Risk Job"] -->|"150,000 re-scoring jobs at 9 PM"| queue
  queue -.->|arrival order| w1["Review Worker 1"]
  queue -.->|arrival order| w2["Review Worker 2"]
  queue -.->|arrival order| w3["Review Worker 3"]
  w1 --> db[("Review Results DB")]
  w2 --> db
  w3 --> db
  db -->|"authorization waits 8 min, declined by timeout"| auth`,

  "priority-queue-3": `flowchart TD
  subs["Paying Subscribers · 15 min promise"] -->|"filed reports wait 6 h"| api["Support Intake API"]
  free["Free Accounts · 48 h promise"] --> api
  bots["Bot Wave"] -->|"90,000 free-account reports in 1 hour"| api
  api -->|enqueue| queue[["Report Work Stream · single, arrival order"]]
  queue -.->|arrival order| h1["Report Handler 1"]
  queue -.->|arrival order| h2["Report Handler 2"]
  queue -.->|arrival order| h3["Report Handler 3"]
  h1 --> db[("Ticket DB")]
  h2 --> db
  h3 --> db`,

  "priority-queue-4": `flowchart TD
  sensors["30,000 Factory Sensors"] -->|"routine readings every 10 s · 60,000/min at shift start"| gw["Ingest Gateway"]
  alarms["Equipment Fault Alarms"] -->|"raised 6:02 AM · 5 s target"| gw
  gw -->|append| stream[["Event Stream · single, in order"]]
  stream -.->|"in order · 400,000 routine readings ahead"| proc["Stream Processor"]
  proc --> tsdb[("Time Series DB")]
  proc -->|"alarm shown 6:09 AM"| hmi["Plant Operator Screen"]`,

  "priority-queue-5": `flowchart TD
  ent["Enterprise Customers · 5 min promise · seeing 3 h"] --> api["Job Intake API"]
  self["Self-Serve Customers"] -->|"300,000 page bulk import at 8 AM"| api
  api -->|enqueue| queue[["Job Stream · single, oldest first"]]
  api --> jobs[("Job DB")]
  queue -.->|oldest first| w1["Doc Worker 1"]
  queue -.->|oldest first| w2["Doc Worker 2"]
  queue -.->|oldest first| w3["Doc Worker 3"]
  w1 --> store[("Processed Doc Store")]
  w2 --> store
  w3 --> store`,

  "claim-check-1": `flowchart TD
  scanner["CT Scanners"] -->|"chest CT study up to 180 MB"| ingest["Ingest Service"]
  ingest -->|"writes DICOM series"| store[("Object Storage")]
  ingest -->|"study split into 700 chunk messages · 256 KB per message limit"| broker[["Message Broker · CPU 90%"]]
  other["Other Services"] -->|"other queues on same cluster"| broker
  broker -.->|"reassembles 700 chunks"| proc["Scan Processing Worker"]
  broker -.->|"delivery latency 40 ms to 6 s"| oc["Other Consumers"]
  proc --> results[("Study Results DB")]`,

  "claim-check-2": `flowchart TD
  drones["Drone fleet"] -->|flight images| upload["Upload service"]
  upload -->|"writes 400 MB bundle"| bucket[("Image bucket")]
  upload -->|"publish message, 400 MB body"| topic[["Flight topic · 300 msg/s, was 20,000 · 9,000 dollars/mo storage"]]
  topic -.->|"400 MB copy"| stitch["Stitching · opens images"]
  topic -.->|"400 MB copy"| defect["Defect detection · opens images"]
  topic -.->|"400 MB copy"| billing["Billing"]
  topic -.->|"400 MB copy"| archive["Archive"]
  stitch --> survey[(Survey DB)]
  defect --> survey
  billing --> survey`,

  "claim-check-3": `flowchart TD
  lawyer["Lawyer browser"] -->|"attach scans and video"| api["Intake API"]
  api --> meta[(Case metadata DB)]
  api -->|"publish 30 MB body"| bus[["Message bus · fails over 100 MB · end to end 45 s, was 2 s"]]
  bus -.->|"30 MB"| s1["Service 1 · decrypt, re-encrypt, re-serialize"]
  s1 -->|"30 MB"| bus
  bus -.->|"30 MB"| mid["Services 2 to 5 · each decrypt, re-encrypt, re-serialize"]
  mid -->|"30 MB"| bus
  bus -.->|"30 MB"| review["Service 6 review · only service that opens the files"]
  review --> docs[("Evidence store")]`,

  "claim-check-4": `flowchart TD
  calls["Call platform"] -->|finished recording| rec["Recorder service"]
  rec -->|"writes WAV, in audit scope"| bucket[("Encrypted bucket")]
  rec -->|"enqueue 22 MB avg, 180 MB peak WAV body"| queue[["Transcription queue · billed per 64 KB unit · 14,000 dollars/mo"]]
  queue --> brokerstore[("Broker storage · holds audio bytes · outside encrypted-at-rest audit scope")]
  queue -.->|"full audio body"| workers["Transcription workers"]
  workers --> transcripts[(Transcript DB)]
  agents["Support agents"] --> ui["Analytics UI"]
  ui --> transcripts`,

  "claim-check-5": `flowchart TD
  turbines["4,000 turbines"] -->|"8 MB waveform per 10 min"| gw["Site gateway"]
  gw -->|"publish 8 MB record · 30 percent rejected"| topic[["Ingest topic · 1 MB per record limit · replication over 10 Gbps link"]]
  topic -.->|"8 MB record"| score["Anomaly scoring service"]
  score -->|"waveform read only when score crosses threshold"| waves[("Waveform store")]
  score --> alerts["Alerting service"]
  topic -.-> archiver["Archive writer"]
  archiver --> waves
  ops["Operations dashboard"] --> api["Turbine API"]
  api --> waves`,

  "dead-letter-queue-1": `flowchart TD
  partner["Partner systems"] -->|"12 orders with malformed country code"| api["Order API"]
  storefront["Storefront"] --> api
  api -->|enqueue| queue[["Order queue · backlog 90 min"]]
  queue -.->|redelivers| consumer["Order consumer · 40 percent of capacity on the same 12 messages"]
  consumer -->|"parse error, never acknowledged"| queue
  consumer -->|"orders that parse"| wms["Warehouse system"]
  consumer -->|"400,000 failed attempts"| logs[("Error logs")]
  wms --> orders[(Order DB)]`,

  "dead-letter-queue-2": `flowchart TD
  hospital["Hospital HL7 feed"] -->|messages| queue[["Feed queue · keeps messages 24 h"]]
  queue -.-> consumer["Integration consumer"]
  consumer -->|"look up patient"| emr[(Patient record DB)]
  consumer -->|"0.3 percent throw, never acknowledged, redelivered"| queue
  consumer -->|"messages that match a patient"| clinical[(Clinical data store)]
  consumer --> logs[("Error logs")]
  consumer --> monitor["Error rate alert"]
  monitor -->|nightly page| oncall["On-call engineer"]
  team["Integration team · compliance review"] --> logs`,

  "dead-letter-queue-3": `flowchart TD
  apps["Rider and driver apps"] --> trip["Trip service"]
  trip --> trips[(Trip DB)]
  trip -->|"publish completed trip"| queue[["Settlement queue · 2,100 messages in the old field layout"]]
  queue -.->|"redelivered every 30 s"| fleet["Settlement worker fleet"]
  fleet -->|"cannot deserialize, never acknowledged"| queue
  fleet -->|"trips that deserialize"| ledger[(Settlement DB)]
  fleet --> payouts["Payout provider"]
  fleet --> logs[("Error logs")]
  eng["Engineering · converter is two days out"] --> logs`,

  "dead-letter-queue-4": `flowchart TD
  players["Game clients"] -->|purchase receipt| api["Purchase API"]
  jail["Jailbroken clients"] -->|receipt with bad signature| api
  api -->|enqueue| queue[["Receipt queue · 8,000 bad messages"]]
  queue -.-> worker["Receipt consumer"]
  worker --> check{"signature valid"}
  check -->|yes| db[("Entitlement DB")]
  check -->|no, retried again| queue
  queue -->|depth| alarm["Queue depth alarm"]
  support["Support team"] -.->|looks up a player| db`,

  "dead-letter-queue-5": `flowchart TD
  partners["Shipping partners"] -->|shipment events| api["Events API"]
  api -->|enqueue| queue[["Shipment queue · 4 day retention"]]
  queue -.-> svc["Customs filing service"]
  svc -->|tariff code| broker["Customs broker"]
  broker -->|accepted| db[("Filings DB")]
  broker -->|rejected · 40 per day| drop["Error caught, message dropped"]
  compliance["Compliance team"] -.->|wants 14 day replay| db`,

  "idempotency-key-1": `sequenceDiagram
  participant App as Mobile app · 10s client timeout
  participant LB as Load balancer
  participant API as Payments API
  participant DB as Charges DB · slowdown
  participant Card as Card network
  App->>LB: POST /charges
  LB->>API: POST /charges
  API->>DB: insert charge row
  API->>Card: authorize card
  Note over API,DB: call takes 14s
  App->>App: 10s timeout fires
  App->>LB: POST /charges again, identical body
  LB->>API: POST /charges
  API->>DB: insert second charge row
  API->>Card: authorize card again`,

  "idempotency-key-2": `sequenceDiagram
  participant Job as Batch job
  participant VPN as VPN link · drops 1 in 500
  participant API as Internal transfer service
  participant Ledger as Ledger DB
  Job->>VPN: POST transfer
  VPN->>API: POST transfer
  API->>Ledger: insert ledger entry, money moves
  Ledger-->>API: committed
  API-->>VPN: 201 created
  VPN--xJob: connection drops mid-response
  Job->>VPN: POST transfer again, same amount and account
  VPN->>API: POST transfer
  API->>Ledger: insert second ledger entry, money moves`,

  "idempotency-key-3": `sequenceDiagram
  participant Fan as Browser
  participant LB as Load balancer
  participant API as Reservation API
  participant Inv as Inventory DB
  Fan->>LB: POST /reservations
  LB->>API: POST /reservations
  API->>Inv: decrement seat count, insert reservation row
  LB-->>Fan: 502
  Fan->>LB: POST /reservations, browser auto retry or double tap
  LB->>API: POST /reservations
  API->>Inv: decrement seat count, insert reservation row
  Inv-->>API: seat count for the block goes negative`,

  "idempotency-key-4": `sequenceDiagram
  participant Cust as Customer integration
  participant API as Payroll API
  participant DB as Batches DB
  participant Bank as Bank deposit file
  Cust->>API: POST direct deposit batch · 4,300 employees
  API->>DB: insert batch row with new batch id
  API->>Bank: submit deposits
  API-->>Cust: response with batch id
  Note over Cust: crashes before recording the response
  Cust->>API: POST the same batch again on restart
  API->>DB: insert second batch row with new batch id
  API->>Bank: submit deposits again`,

  "idempotency-key-5": `flowchart TD
  tablet["Restaurant tablet"] --> lib["Partner client library · retries 3x on network error"]
  lib -->|POST refund| gw["API gateway"]
  lib -.->|retry 2| gw
  lib -.->|retry 3| gw
  gw --> api["Refund service"]
  api -->|look up order| orders[("Orders DB")]
  api -->|new refund row per call| db[("Refunds DB")]
  api -->|move money| psp["Payment processor"]`,

  "valet-key-1": `flowchart TD
  creators["Creators · authenticated in app"] -->|"POST 4 GB source file"| lb[Load Balancer]
  lb -->|"bursts of 200 concurrent uploads"| pods["Upload API · 60 pods · 95% of CPU copying bytes"]
  pods -->|"check creator identity"| auth[(Auth Store)]
  pods -->|"write video record"| db[(Metadata DB)]
  pods -->|"every byte copied through · $21k per month"| store[(Object Storage)]`,

  "valet-key-2": `flowchart TD
  patients["Patients · logged into portal"] -->|"request study download"| lb[Load Balancer]
  lb --> web["Web Tier · 8 app servers · each pinned at 1 Gbps"]
  web -->|"check session"| sess[(Session Store)]
  web -->|"look up study record"| meta[(Study Metadata DB)]
  web -->|"read file 500 MB to 3 GB · cross region"| store[("Study Storage (other region)")]
  web -->|"stream bytes · 11 min per download"| patients`,

  "valet-key-3": `flowchart TD
  field["12,000 contractors · personal devices on LTE"] -->|"send 200 MB photo bundle"| lb[Load Balancer]
  lb -->|"4 pm rush · timeouts"| api["Inspection API · 30 instances absorbing transfers"]
  api -->|"authenticate contractor"| auth[(Auth Store)]
  api -->|"write bundle record"| db[(Inspection DB)]
  api -->|"forwards every byte"| store[(Object Storage)]`,

  "valet-key-4": `flowchart TD
  nodes["Institution cluster nodes · untrusted machines"] -->|"request 40 GB FASTQ file"| api["Genomics API"]
  api -->|"check customer and purchase"| db[(Customer + Order DB)]
  api --> proxy["Download Proxy · Python · one worker per transfer · out of file descriptors at 50 concurrent"]
  proxy -->|"read bytes cross region · $8k per month"| store[(Result File Storage)]
  proxy -->|"stream 40 GB back"| nodes`,

  "valet-key-5": `flowchart TD
  fleet["80,000 vehicles · physically accessible to owners"] -->|"send 1.5 GB incident clip"| lb[Load Balancer]
  lb --> ingest["Upload Servers · receive and forward bytes only · $45k per month"]
  ingest -->|"check vehicle credential"| cred[(Device Credential Store)]
  ingest -->|"write clip record"| db[(Incident DB)]
  ingest -->|"two extra network hops"| store[(Clip Storage)]`,

  "api-gateway-1": `flowchart LR
  ios["iOS app · 17 hostnames hardcoded"] --> rides
  ios --> wallet
  ios --> settle
  ios --> rest
  android["Android app · 17 hostnames hardcoded"] --> rides
  android --> wallet
  android --> settle
  android --> rest
  rides["Rides service · own token validation"] --> ridesdb[(Rides DB)]
  wallet["Wallet service · own token validation"] --> paydb[(Payments DB)]
  settle["Settlement service · own token validation"] --> paydb
  rest["14 other services · own token validation · 3 are two versions behind on the auth library"] --> otherdb[(Service DBs)]`,

  "api-gateway-2": `flowchart LR
  browser["Browser app · 9 hostnames hardcoded"] --> catalog
  browser --> search
  browser --> cart
  browser --> rest
  catalog["Catalog service · own CORS list, TLS cert, JWT check"] --> cache[(Catalog Cache)]
  catalog --> catdb[(Catalog DB)]
  search["Search service · moved to a new address last sprint"] --> idx[(Search Index)]
  cart["Cart service · own CORS list, TLS cert, JWT check · expired token returns 403"] --> cartdb[(Cart DB)]
  rest["6 other services · own CORS list, TLS cert, JWT check · expired token returns 401"] --> dbs[(Service DBs)]`,

  "api-gateway-3": `flowchart LR
  vendors["40 clinic vendor systems<br/>each holds 6 service addresses"]
  vendors -->|"own auth handshake"| appt["Appointments service"]
  vendors -->|"own auth handshake"| prov["Providers service"]
  vendors -->|"own auth handshake"| rooms["Rooms service"]
  vendors -->|"own auth handshake"| ins["Insurance check service"]
  vendors -->|"own auth handshake"| rest["2 more internal services"]
  appt --> db[("Scheduling DB")]
  prov --> db
  rooms --> db
  ins --> db
  rest --> db`,

  "api-gateway-4": `flowchart LR
  game["Game client<br/>protocol adapters in every build"]
  phone["Companion phone app<br/>protocol adapters in every build"]
  game -->|gRPC| mm["Matchmaking<br/>gRPC only"]
  game -->|gRPC| inv["Inventory<br/>gRPC only"]
  game -->|"custom binary over raw TCP"| pres["Presence<br/>custom binary protocol"]
  game -->|SOAP| old["2 older services<br/>SOAP"]
  phone -->|gRPC| mm
  phone -->|gRPC| inv
  phone -->|"custom binary over raw TCP"| pres
  phone -->|SOAP| old
  rest["7 other backend services"]
  mm --> db[("Game DB")]
  inv --> db
  pres --> db
  old --> db
  rest --> db`,

  "api-gateway-5": `flowchart TD
  web["Web app<br/>config file of feature to service URL"]
  atm["ATM fleet software<br/>config file of feature to service URL"]
  web --> lb1["Public load balancer 1"]
  web --> lb2["Public load balancer 2"]
  atm --> lb1
  atm --> lb2
  lb1 --> s1["Service 1<br/>own copy of token validation"]
  lb2 --> s2["Service 2<br/>own copy of token validation"]
  rest["20 more services, each with its own public load balancer<br/>and its own copy of token validation"]
  s1 --> db[("Bank data stores")]
  s2 --> db
  rest --> db`,

  "backends-for-frontends-1": `flowchart TD
  tv["Smart TV app<br/>uses 8 fields per title"] -->|"fields=tv_minimal"| api
  ios["iOS app<br/>wants its own page size"] -->|"page size flag"| api
  web["Desktop browser app<br/>uses all 60 fields plus editorial copy"] -->|"layout=web2"| api
  api["Shared API<br/>60 field payload<br/>14 client specific query flags"]
  api --> cache[("Catalog cache")]
  cache --> titles[("Titles DB")]
  api --> ed[("Editorial copy store")]`,

  "backends-for-frontends-2": `flowchart TD
  driver["Driver Android app<br/>rural cellular<br/>1 active stop at a time"] --> lb["Load balancer"]
  disp["Dispatcher web console<br/>500 stops per screen"] --> lb
  lb --> api["Shared API service<br/>one response shape for both clients"]
  api --> cache[("Route cache")]
  api --> stops[("Stops DB")]
  api --> hist[("Address history store")]`,

  "backends-for-frontends-3": `flowchart TD
  mobile["Mobile shopping app<br/>Kotlin"] --> edge["Shared entry layer<br/>token check and rate limits"]
  term["In-store associate terminal<br/>C#35;"] --> edge
  edge --> api["Shared API<br/>Java monolith<br/>client-type header if-blocks in 30 endpoints<br/>45 minute test suite"]
  api --> cache[("Catalog cache")]
  api --> prod[("Product DB")]
  api --> price[("Pricing DB")]`,

  "backends-for-frontends-4": `flowchart TD
  clin["Clinician web workstation<br/>full chart history, 200 rows at a time"] --> lb["Load balancer"]
  pat["Patient phone app<br/>next appointment plus 5 recent results<br/>filters provider notes client-side"] --> lb
  lb --> api["Shared API<br/>one response object for both audiences"]
  api --> charts[("Chart DB")]
  api --> labs[("Lab results DB")]
  api --> notes[("Provider notes store")]`,

  "backends-for-frontends-5": `flowchart TD
  dash["Advertiser dashboard in browser · wants 10,000 rows raw"] --> edge["Shared front layer · login checks and request logging"]
  tablet["Rep tablet app · wants 20 rows by 6 columns pre-rounded"] --> edge
  edge --> api["Shared reporting API · per-client branching 3 paths deep"]
  api --> cache[(Report cache)]
  api --> db[(Reporting DB)]
  dash -.->|"screen change request"| tq["Owning team ticket queue · 3 weeks"]
  tablet -.->|"screen change request"| tq
  tq -.->|"edits land here"| api`,

  "gateway-aggregation-1": `flowchart LR
  app["Insurance mobile app · claim detail screen fills in 2.7 s · 3 percent of sessions miss one response"]
  app -->|"call 1 · 380 ms cellular"| claim["Claim service · under 30 ms"]
  app -->|"call 2 · 380 ms"| policy["Policy service · under 30 ms"]
  app -->|"call 3 · 380 ms"| adj["Adjuster service · under 30 ms"]
  app -->|"call 4 · 380 ms"| photos["Photos service · under 30 ms"]
  app -->|"call 5 · 380 ms"| pay["Payment status service · under 30 ms"]
  app -->|"call 6 · 380 ms"| shop["Repair shop service · under 30 ms"]
  app -->|"call 7 · 380 ms"| msg["Messages service · under 30 ms"]
  claim --> db[("Data center stores")]
  policy --> db
  adj --> db
  photos --> db
  pay --> db
  shop --> db
  msg --> db`,

  "gateway-aggregation-2": `flowchart TD
  tablet["Field technician tablet · satellite 700 ms round trip · status page waits 8.4 s · 2 to 3 of 12 panels fail on a bad link"]
  tablet -->|"request 1 · 700 ms"| hours["Engine hours service · 15 ms"]
  tablet -->|"request 2 · 700 ms"| faults["Fault code service · 15 ms"]
  tablet -->|"request 3 · 700 ms"| fw["Firmware version service · 15 ms"]
  tablet -->|"request 4 · 700 ms"| warranty["Warranty service · 15 ms"]
  tablet -->|"request 5 · 700 ms"| parts["Parts service · 15 ms"]
  tablet -->|"requests 6 to 12 · 700 ms each"| rest["7 more machine status services · 15 ms each"]
  hours --> db[("Equipment telemetry and reference stores")]
  faults --> db
  fw --> db
  warranty --> db
  parts --> db
  rest --> db`,

  "gateway-aggregation-3": `flowchart TD
  phone["Order tracking screen · 40,000 active orders at dinner peak · polls every 5 s"]
  phone -->|"connection 1 of 5 per poll"| order["Order service · under 20 ms"]
  phone -->|"connection 2 of 5"| courier["Courier location service · under 20 ms"]
  phone -->|"connection 3 of 5"| rest["Restaurant service · under 20 ms"]
  phone -->|"connection 4 of 5"| eta["ETA service · under 20 ms"]
  phone -->|"connection 5 of 5"| promo["Promotions service · under 20 ms"]
  order --> db[("Order and courier stores · 200,000 requests every 5 s reach this tier")]
  courier --> db
  rest --> db
  eta --> db
  promo --> db`,

  "gateway-aggregation-4": `flowchart LR
  kiosk["Airport check-in kiosk · 250 ms round trip · about 3 s of spinner before the first field"]
  kiosk -->|"call 1 · 250 ms"| res["Reservation service"]
  kiosk -->|"call 2 · 250 ms"| pax["Passenger service"]
  kiosk -->|"call 3 · 250 ms"| seat["Seat map service"]
  kiosk -->|"call 4 · 250 ms"| bags["Bag rules service"]
  kiosk -->|"call 5 · 250 ms"| visa["Visa check service"]
  kiosk -->|"call 6 · 250 ms"| loyal["Loyalty service"]
  kiosk -->|"call 7 · 250 ms"| upg["Upgrade offer service"]
  kiosk -->|"call 8 · 250 ms"| token["Payment token service"]
  kiosk -->|"call 9 · 250 ms"| bp["Boarding pass eligibility service"]
  res --> db[("Colocated data center stores · services answer fast")]
  pax --> db
  seat --> db
  bags --> db
  visa --> db
  loyal --> db
  upg --> db
  token --> db
  bp --> db`,

  "gateway-aggregation-5": `flowchart LR
  phone["Banking app home screen · 6 requests in parallel · 1.9 s to paint on 3G · 4 percent of loads leave a blank tile"]
  phone -->|"request 1 · 3G round trip"| bal["Balance service · 10 to 25 ms"]
  phone -->|"request 2"| txn["Recent transaction service · 10 to 25 ms"]
  phone -->|"request 3"| card["Card status service · 10 to 25 ms"]
  phone -->|"request 4"| rewards["Rewards points service · 10 to 25 ms"]
  phone -->|"request 5"| alerts["Alert service · 10 to 25 ms"]
  phone -->|"request 6"| xfer["Pending transfer service · 10 to 25 ms"]
  bal --> cache[(Read cache)]
  txn --> cache
  card --> cache
  rewards --> cache
  alerts --> cache
  xfer --> cache
  cache --> core[("Core banking store")]`,

  "circuit-breaker-1": `flowchart TD
  shopper["Shoppers"] -->|"purchase"| lb["Load balancer"]
  lb --> checkout["Checkout service · web pool of 200 threads, all waiting"]
  checkout -->|"1,200 fraud score calls/s · 5 s timeout · every call hangs in a 25 min outage"| fraud["Fraud scoring vendor API"]
  lb -->|"order history"| checkout
  lb -->|"address lookup"| checkout
  checkout --> orders[("Orders DB")]`,

  "circuit-breaker-2": `flowchart TD
  apps["Viewer apps"] -->|"open home screen"| home["Home screen API · p99 went from 120 ms to 9 s"]
  home -->|"8,000 calls/s · each holds 1 of 500 pool connections · 3 s to fail"| recs["Recommendations service · out of memory, 100 percent errors for 18 min"]
  home -->|"rest of the page"| cache[("Page cache · healthy")]
  recs --> pods["Recommendations pods · crash-looping under constant traffic"]
  recs --> model[("Recommendation model store")]`,

  "circuit-breaker-3": `flowchart TD
  meters["400,000 smart meters"] --> lb["Load balancer · pulls nodes that fail health checks"]
  lb --> ingest["Ingest nodes · device-facing HTTP endpoint"]
  lb -.->|"health checks time out"| ingest
  ingest --> workers["Ingest worker pool · empties during compaction"]
  workers -->|"every write attempted · blocks for the 10 s timeout"| tsdb[("Time series DB · compaction 10 to 30 min weekly, rejects writes")]
  tsdb --> dash["Dashboards and billing"]`,

  "circuit-breaker-4": `flowchart TD
  app["Bank mobile app"] --> api["Mobile API · p99 over 20 s on every endpoint"]
  api -->|"balance calls keep coming in the nightly window"| gw["Mainframe gateway · 60 concurrent sessions, all used up"]
  api -->|"transfers"| gw
  api -->|"bill pay"| gw
  gw --> bal["Mainframe balance service · errors for 40 min nightly"]
  gw --> core["Mainframe transfer and bill pay programs"]`,

  "circuit-breaker-5": `flowchart TD
  pub["Publisher page"] -->|"ad request · must answer under 100 ms"| ads["Ad server · misses the deadline, loses bids from healthy exchanges"]
  ads -->|"parallel bid request"| exA["Exchange A · healthy"]
  ads -->|"parallel bid request"| exB["Exchange B · healthy"]
  ads -->|"30,000 calls/s · waits the full 100 ms · sockets held"| exC["Exchange C · dark 5 to 15 min, accepts TCP, never responds"]
  ads --> floors[("Campaign and floor price cache")]`,

  "retry-with-backoff-and-jitter-1": `flowchart TD
  phones["60,000 driver phones · location update every 4 s"] --> lb["Load balancer"]
  lb --> n1["Ingest API node 1 · restarting"]
  lb --> n2["Ingest API nodes 2 to N · fail under the spike"]
  phones -.->|"connection error, all retry after exactly 1 s · 60,000 requests in one 50 ms slice"| lb
  n2 --> stream[["Location stream"]]
  stream --> db[("Driver location store")]`,

  "retry-with-backoff-and-jitter-2": `flowchart TD
  sched["Nightly scheduler"] --> job["Batch job · 2 million rows · 3 h instead of 40 min"]
  job --> workers["200 workers"]
  workers -->|"writes · unique key per row"| kv[("Managed key-value store · 0.3 percent brief capacity errors")]
  workers -.->|"retry at once in a tight loop · 5x request spike"| kv
  kv --> dash["Store dashboard · sawtooth of errors and spikes"]
  src[("Source data warehouse")] --> job`,

  "retry-with-backoff-and-jitter-3": `flowchart TD
  merchants["8,000 merchant servers · payments SDK"] -->|"POST authorize · unique operation ID"| lb["Load balancer · 3 s network blip in one zone"]
  lb --> auth["Authorization endpoint · sized for 5,000 req/s · degraded 11 min"]
  merchants -.->|"re-send at once, then again 100 ms later · 400,000 requests in 2 s"| lb
  auth -->|"dedupe by operation ID"| dedupe[("Operation ID store")]
  auth --> networks["Card networks"]`,

  "retry-with-backoff-and-jitter-4": `flowchart TD
  players["250,000 game clients"] -->|"websocket"| gw["Websocket gateway · runs out of file descriptors"]
  gw --> mm["Matchmaking service · 2 s deploy drops all sockets"]
  players -.->|"reconnect the moment the socket closes · 250,000 handshakes in 1 s"| gw
  gw -.->|"rejects most handshakes, rejected clients reconnect in lockstep"| players
  mm --> pool[("Player queue store")]`,

  "retry-with-backoff-and-jitter-5": `flowchart TD
  upper["Calling layer · retries the whole batch 3 times"] -->|"sync batch"| sync["Sync service · 50 parallel readers"]
  sync -->|"reads · about 400 requests normally"| fhir["Vendor FHIR API · 503 on 1 in 200 calls"]
  sync -.->|"retry each 503 at once, up to 10 times, no wait"| fhir
  fhir -.->|"90,000 requests in a 10 s hiccup · API key blocked 1 h"| sync
  sync --> records[("Hospital records DB")]`,

  "bulkhead-1": `flowchart TD
  shopper["Shoppers"] -->|"purchase, including gift cards"| web["Checkout page"]
  web --> checkout["Checkout service · page returns 500s"]
  checkout --> pool["One shared pool · 200 worker threads · all 200 parked on tax"]
  pool -->|"fraud check"| fraud["Fraud scoring vendor · gets no threads"]
  pool -->|"tax lookup"| tax["Sales tax vendor · 90 ms average slowed to 9 s, no errors"]
  pool -->|"address check"| addr["Address cleanup vendor · gets no threads"]
  checkout --> orders[("Orders DB")]
  checkout --> payments["Payment processor"]`,

  "bulkhead-2": `flowchart TD
  clin["Clinicians · chart lookups need under 400 ms"] --> ehr["Records app"]
  ehr -->|"chart lookups queue and time out for 20 min"| pool["One connection pool · 60 connections"]
  export["Research bulk export · moved to 7 am by mistake"] -->|"holds 55 long-running connections"| pool
  pool --> db[("Records DB · CPU headroom the whole time")]
  research["Research team"] --> export
  ehr --> audit[("Audit log")]`,

  "bulkhead-3": `flowchart TD
  exchange["Ad exchanges"] -->|"bid callback · must answer in 80 ms"| lb["Load balancer"]
  adv["Advertisers"] -->|"14-month report across 400 campaigns"| lb
  lb --> proc["One server process · 64 request handlers · one 8 GB heap · report holds 60 handlers"]
  proc -->|"bid lookups"| budget[("Campaign budget cache")]
  proc -->|"scans months of data"| warehouse[("Reporting data store")]
  proc -.->|"bid callbacks time out · about 3 million bids lost"| exchange`,

  "bulkhead-4": `flowchart TD
  biz["Business customers · statements promised within 5 s by contract"] --> api["Statement generation service"]
  retail["Retail customers · 95 percent of volume · no delivery promise"] --> api
  api -->|"enqueue job"| queue[["One shared queue of in-flight jobs"]]
  queue -.->|"any worker takes any job"| pool["One fleet · 40 workers · all 40 filled for 40 minutes on the first of the month"]
  pool --> acct[(Account and transaction DB)]
  pool --> files[(Generated statement store)]`,

  "cache-aside-1": `flowchart TD
  shoppers["Shoppers · 12,000 page views/s, 92% land on the same 4,000 SKUs"] --> lb["Load Balancer"]
  lb --> web["Product Page Service"]
  web -->|"single-row read by SKU on every view · 6 ms each"| db[("Product DB · 88% CPU · reads outnumber writes 900 to 1")]
  admin["Admin Tool"] -->|"price and title edits a few times a day"| db
  web --> search["Search Service"]
  web -.-> cdn["CDN · product images"]`,

  "cache-aside-2": `flowchart TD
  clients["Game clients · 10 players per match"] --> match["Match Service"]
  match -->|"about 45,000 single-row reads/s by item id · 4 ms each"| db[("Item Definitions DB · 8,000 rows, 2 KB each · biggest bill line")]
  designers["Designer Tool"] -->|"edits about twice a week"| db
  match --> mm["Matchmaking Service"]
  match --> history[("Match History DB")]`,

  "cache-aside-3": `flowchart TD
  exchange["Ad exchange · 200,000 bid requests/s"] -->|"80 ms total to respond"| bid["Bidding Service"]
  bid -->|"read targeting by campaign id · 3 ms average, 40 ms under load"| db[("Campaign DB · 3,500 active campaigns")]
  advertisers["Advertiser Console"] -->|"a few hundred edits/hour"| db
  bid --> model["Bid Pricing Model"]
  bid -.->|"timeouts when the lookup takes 40 ms"| exchange
  bid --> events[["Bid Events Stream"]]`,

  "cache-aside-4": `flowchart TD
  desk["Front desk staff · checks the same patient 4 to 5 times a visit"] --> billing["Clinic Billing System"]
  billing -->|"60,000 calls/day for 14,000 patients · 800 ms and 2 cents each"| payer["Payer Eligibility API · external"]
  billing --> db[("Billing DB")]
  billing --> sched["Scheduling Service"]`,

  "cache-aside-5": `flowchart TD
  apps["Streaming apps · 30,000 reads/s, 5% of titles get 80% of reads"] --> gw["API Gateway"]
  gw --> catalog["Catalog Service"]
  catalog -->|"key lookup by title id · 5 ms"| db[("Catalog DB · near its connection limit")]
  db -.-> replicas[("Read Replicas · already maxed")]
  content["Content Team Tool"] -->|"artwork and description updates"| db
  catalog --> rec["Recommendations Service"]`,

  "sharding-1": `flowchart TD
  merchants["Merchant card terminals"] --> auth["Authorization Service"]
  auth -->|"38,000 inserts/s at peak · nearly every query scoped to one merchant"| pg[("PostgreSQL primary · 11 TB, grows 900 GB/month, largest instance sold")]
  pg -.-> replica[("Read Replicas · no help for writes or disk")]
  auth --> fraud["Fraud Scoring"]
  dashboard["Merchant Dashboard"] --> pg`,

  "sharding-2": `flowchart TD
  devices["2.4 million devices"] -->|"60,000 inserts/s"| ingest["Ingest Service"]
  ingest --> tsdb[("Time-series DB server · 94% disk, CPU pegged every morning shift, top instance size")]
  dash["Plant Dashboards · one device's readings per query"] --> tsdb
  ingest --> alerts["Alerting Service"]
  ingest -.-> archive[("Cold Archive · last year's readings")]`,

  "sharding-3": `flowchart TD
  users["HR users at 14,000 companies"] --> app["HR App"]
  imports["Bulk imports from 3 enterprise customers"] --> app
  app -->|"every query carries a company id"| mysql[("One MySQL DB · 8 TB · 3 customers hold 60% · imports slow everyone")]
  mysql -->|"backup takes 9 h, restore misses recovery target"| backup[("Backup Store")]
  app --> login["Login Service"]`,

  "sharding-4": `flowchart TD
  players["90 million player accounts"] --> gs["Game Servers"]
  gs -->|"inventory read or write for one player · p99 write 340 ms"| docdb[("Document DB primary · 768 GB RAM, working set no longer fits, disk thrashing")]
  docdb -.-> secondary[("Secondary · failover")]
  gs --> match["Matchmaking Service"]
  shop["In-game Store"] --> gs`,

  "sharding-5": `flowchart TD
  scanners["Parcel scanners"] -->|"scan events"| ingest["Tracking Ingest Service"]
  ingest --> db[("Tracking DB · 6.2 billion rows, grows 1.5 TB/week, vendor maximum size")]
  web["Customer tracking page · one tracking number at a time"] --> api["Tracking API"]
  api --> db
  db -.->|"nightly vacuum runs into the morning peak"| vacuum["Vacuum Job"]
  api --> notify["Notification Service"]`,

  "materialized-view-1": `flowchart TD
  nurses["Charge nurses · about 200 opens/hour"] --> dash["Ward Dashboard"]
  dash -->|"join 7 tables, group by over 40 million rows · 38 s"| clin[("Clinical DB · normalized tables")]
  ehr["Clinical system"] -->|"writes admissions, transfers, discharges"| clin
  dash --> sso["Hospital Sign-in"]`,

  "materialized-view-2": `flowchart TD
  advertisers["Advertisers · reload the page constantly"] --> portal["Advertiser Portal"]
  portal -->|"scan 900 million rows per advertiser · 22 s"| imp[("Impression table · raw rows audited by finance")]
  portal -->|"join"| rates[("Campaigns and Billing Rates DB")]
  adservers["Ad Servers"] -->|"append impressions"| imp
  finance["Finance Audit"] --> imp`,

  "materialized-view-3": `flowchart TD
  creators["Creators · load the page many times a day"] --> page["Channel Analytics Page"]
  page -->|"join and aggregate 28 days · 45 s, page times out"| events[("View Events table")]
  page --> subs[("Subscriptions table")]
  page --> meta[("Video Metadata table")]
  player["Video Player"] -->|"view events"| events
  page -.-> cdn["CDN · thumbnails"]`,

  "materialized-view-4": `flowchart TD
  managers["Relationship managers · about 3,000 overviews/day"] --> overview["Customer Overview App"]
  overview -->|"query 5 tables in different schemas · 14 s"| core[("Core Banking DB · checking, savings, loans, cards")]
  corebank["Core banking system"] -->|"owns and writes the source tables"| core
  overview --> kyc["KYC Service"]`,

  "materialized-view-5": `flowchart TD
  shoppers["Shoppers · 4,000 category page hits/min"] --> lb["Load Balancer"]
  lb --> browse["Category Browse Service"]
  browse -->|"join 30 million rows · 18 s per category"| products[("Products DB")]
  browse --> prices[("Prices DB")]
  browse --> stock[("Warehouse Stock DB · changes constantly")]
  wms["Warehouse System"] -->|"stock updates"| stock
  browse -.-> images["Image CDN"]`,

  "index-table-1": `flowchart TD
  agents["Support agents"] -->|"all orders for a customer email"| support["Support tool"]
  customers["Customers"] -->|"900 orders/s"| orders["Order service"]
  orders -->|"put by order ID"| kv[("Order store · key is order ID · 400 million items · no other query")]
  support -->|"full scan of 400 million items · takes minutes, burns read budget"| kv
  orders --> pay["Payment service"]
  kv -.-> cache[("Order status cache")]`,

  "index-table-2": `flowchart TD
  riders["Rider app"] --> api["Trip API"]
  api -->|"find nearby driver"| match["Matching service"]
  match -->|"read by driver ID"| drivers[("Driver store · partitioned by hash of driver ID · 64 partitions · no secondary index")]
  onboard["Driver onboarding"] -->|"write driver record"| drivers
  compliance["Compliance tool"] -->|"drivers by license state · fans out to all 64 partitions · 30 s"| drivers
  match --> geo[("Driver location cache")]`,

  "index-table-3": `flowchart TD
  listeners["Listener app"] --> api["Catalog API"]
  api -->|"read album by album ID"| store[("Catalog store · wide-column · key is album ID · 120 million track rows")]
  api -->|"tracks featuring a performer · 5,000/min · scans 120 million rows"| store
  labels["Label ingest job"] -->|"catalog changes a few times a day"| store
  api --> art["Cover art CDN"]
  api --> plays[("Play count store")]`,

  "index-table-4": `flowchart TD
  billing["Billing staff"] -->|"has insurance member number"| billapp["Billing app"]
  clinic["Clinic staff"] --> ehr["Records service"]
  ehr -->|"read and write by patient ID"| docs[("Patient document store · key is patient ID · 12 million documents · no secondary index")]
  billapp -->|"scan for member number · 40 s · 600 lookups/hour"| docs
  billapp --> claims[("Claims DB")]
  ehr --> audit[("Access audit log")]`,

  "index-table-5": `flowchart TD
  staff["Floor staff handheld scanner"] -->|"scan pallet barcode"| inv["Inventory service"]
  inv -->|"walks all 8 million item records · 25 s"| items[("Item store · key is SKU · no other query")]
  erp["Purchasing system"] -->|"item changes about twice a day"| items
  inv --> locs[("Bin location DB")]
  inv --> picks["Pick list service"]`,

  "cqrs-1": `flowchart TD
  traders["Trader app"] -->|"place order · 400 writes/s"| oms["Order service · one set of order classes · margin, position limits, eligibility rules plus dozens of display-only fields"]
  blotter["Blotter screens"] -->|"60,000 reads/s"| oms
  oms --> db[("Orders DB · one shape for both")]
  mkt["Market data feed"] -->|"prices"| oms
  oms -->|"route order"| exch["Exchange gateway"]`,

  "cqrs-2": `flowchart TD
  adjusters["Adjusters"] -->|"claim updates · 30/s"| claims["Claims service · one set of domain objects · validation, coverage rules, state transitions"]
  customers["Customer status page"] -->|"12,000 views/s · 900 ms each"| claims
  claims -->|"loads full object graph"| db[("Claims DB · one set of indexes")]
  claims --> docs[("Claim documents store")]
  claims -->|"approved payout"| pay["Payments system"]`,

  "cqrs-3": `flowchart TD
  guests["Guest web and app"] -->|"book · 200/s"| svc["Booking service · one model · overlapping stays, rate plans, cancellation windows, plus display fields for every screen"]
  guests -->|"availability and reservation lists · 80,000 reads/s"| svc
  svc --> db[("Reservations DB")]
  svc -->|"rates"| rates[("Rate plan cache")]
  svc -->|"confirmation email"| mail["Email service"]`,

  "cqrs-4": `flowchart TD
  scanners["Movement scanners"] -->|"stock movements · 150/s"| wms["Warehouse service · shared entities · allocation and lot tracking plus 40 display fields and mapping helpers"]
  dash["Picker dashboards"] -->|"25,000 reads/s"| wms
  wms --> db[("Stock DB · one shape for both")]
  wms -->|"shipment ready"| carrier["Carrier integration"]
  erp["ERP"] -->|"purchase orders"| wms`,

  "cqrs-5": `flowchart TD
  stores["Retail stores and call center"] -->|"activate service"| prov["Provisioning service · shared objects · SIM, plan, network rules plus portal fields"]
  portal["Customer portal · 200 times activation traffic"] -->|"loads full objects"| prov
  prov --> db[("Subscriber DB · sized for activation")]
  prov -->|"activate"| net["Network provisioning system"]
  prov --> billing["Billing system"]
  dev["Portal developers"] -.->|"new portal field edits the activation rules class · 2 outages"| prov`,

  "event-sourcing-1": `flowchart TD
  app["Mobile banking app"] -->|"deposits and transfers"| ledger["Ledger service"]
  fees["Fee batch job"] -->|"monthly fees"| ledger
  ledger -->|"UPDATE balance column in place"| accts[("Accounts table · one row per account, current balance only")]
  accts -.->|"backup at midnight"| backup[("Nightly backup")]
  support["Support team · balance at 2:14pm three months ago?"] -->|"only midnight copies to look at"| backup
  ledger --> fraud["Fraud scoring"]`,

  "event-sourcing-2": `flowchart TD
  doctor["Doctors · change dose"] --> ord["Medication ordering module"]
  pharm["Pharmacists · adjust frequency"] --> ord
  nurse["Nurses · mark hold"] --> ord
  ord -->|"UPDATE prescription row in place · 11 columns"| rx[("Prescriptions table · current values only")]
  rx -.->|"copies 3 of 11 columns · silently broken for 6 months"| shadow[("Shadow history table")]
  ord --> mar["Medication administration record"]
  auditors["Auditors · dose at 3:00pm, who changed it in the 20 min before?"] -->|"answer not in the database"| shadow`,

  "event-sourcing-3": `flowchart TD
  players["900,000 daily players"] --> gs["Game servers"]
  gs -->|"pickups, trades, crafts"| inv["Inventory service · craft ran twice for about 4,000 accounts"]
  inv -->|"UPDATE item quantity in place"| items[("Item rows · final quantity only")]
  gs --> match["Matchmaking service"]
  team["Inventory team · which accounts were hit?"] -.->|"no sequence kept"| items
  staging["Staging environment · cannot reproduce a player"] -.->|"no sequence kept"| items`,

  "event-sourcing-4": `flowchart TD
  adjusters["Adjusters · how did this claim reach its status?"] --> app["Claims platform"]
  app -->|"UPDATE status · submitted, assigned, estimated, approved, paid"| claims[("Claims table · current status and payout only")]
  night["Nightly update job"] -->|"overwrites previous values, no trace"| claims
  claims --> pay["Payments system"]
  legal["Legal team · recompute 18 months of payouts under a corrected rule"] -.->|"only final numbers survive"| claims
  app --> docs[("Photo and document store")]`,

  "event-sourcing-5": `flowchart TD
  sites["42 warehouse sites"] -->|"receipts, picks, cycle counts, damage write-offs"| stock["Stock service"]
  stock -->|"increment or decrement on_hand in place · 3 million updates/day"| onhand[("on_hand table · per SKU per site")]
  deploy["Bad deploy · double-decremented for 90 min"] -.-> stock
  onhand -.->|"wrong counts"| recount["Physical recount at 11 sites"]
  finance["Finance · on hand at midnight, each of the last 90 days?"] -.->|"nobody can produce it"| onhand
  stock --> orders["Order routing service"]`,

  "database-per-service-1": `flowchart TD
  clients["Web and mobile clients"] --> gw["API gateway"]
  gw --> orders["Orders service"]
  gw --> cust["Customers service"]
  gw --> other["Four other services · billing, shipping, catalog, notifications"]
  orders -->|"shared credentials"| pg[("One Postgres instance · every table, no owner")]
  cust -->|"shared credentials"| pg
  other -->|"SELECT and UPDATE any table · 4 services query orders directly"| pg
  release["Thursday night joint release"] -.->|"one service's migration can break another"| pg`,

  "database-per-service-2": `flowchart TD
  viewers["Viewers"] --> catalog["Catalog service"]
  catalog -->|"nested title metadata across eleven join tables"| sql[("Normalized catalog SQL tables")]
  recs["Recommendations service"] -->|"own SQL joins"| sql
  search["Search indexer"] -->|"own SQL joins"| sql
  billing["Billing entitlement service"] -->|"own SQL joins"| sql
  catalog -.->|"move blocked for a year"| doc[("Document store · planned")]`,

  "database-per-service-3": `flowchart TD
  driverapp["Driver app"] --> dsvc["Driver service · validation rules"]
  riderapp["Rider app"] --> psvc["Pricing service"]
  dsvc -->|"INSERT and UPDATE rights on every column"| table[("Shared drivers table · 1,200 rows with a status nobody allows")]
  psvc -->|"writes directly, skips validation"| table
  psvc --> surge[("Surge pricing cache")]
  dsvc --> docs[("Driver documents store")]`,

  "database-per-service-4": `flowchart TD
  users["HR customers"] --> lb["Load balancer"]
  lb --> login["Login service"]
  lb --> payroll["Payroll service"]
  lb --> others["Six other services"]
  reporting["Reporting service · opened 400 connections"] -->|"same DB user, full rights on all schemas"| mysql[("One shared MySQL server · one connection limit for all")]
  login -->|"starved of connections"| mysql
  payroll -->|"migration locks a large table for 4 min, all 9 services down"| mysql
  others -->|"same DB user, full rights on all schemas"| mysql
  lb --> reporting`,

  "database-per-service-5": `flowchart TD
  advertisers["Advertisers"] --> campaign["Campaign service"]
  campaign -->|"one write touches tables of all three teams"| db[("Shared ad database · campaign, targeting, billing tables")]
  targeting["Targeting service · adds a required column"] -->|"schema change"| db
  billing["Billing service"] -->|"SELECT star join across 7 tables of the other two teams"| db
  bidder["Ad exchange bidder"] --> targeting
  billing --> invoices[("Invoice PDF store")]`,

  "change-data-capture-1": `flowchart TD
  shoppers["Shoppers"] --> store["Storefront"]
  store --> search[("Search index")]
  store --> pickup["Store-pickup availability page"]
  vendor["Vendor inventory app on Oracle · no source code, contract forbids changes"] -->|"inserts, updates, deletes"| oracle[("Oracle inventory DB")]
  oracle -->|"CSV export at 2am · up to 18 h stale"| csv["Nightly CSV job"]
  csv --> search
  csv --> pickup
  poll["last_modified polling job · added load, missed deleted items"] -.->|"tried and dropped"| oracle
  store --> cache[("Product image cache")]`,

  "change-data-capture-2": `flowchart TD
  staff["Ward staff"] -->|"admissions, discharges, transfers"| emr["Clinical records product · contract bars any changes"]
  emr --> sql[("SQL Server patient stay table")]
  reload["Full reload job · every 30 min, 12 min per run"] -->|"reads the whole table, loads production"| sql
  reload --> beds["Bed management dashboard · clinicians need status in 5 s"]
  reload --> wh[("Analytics warehouse")]
  clinicians["Clinicians"] --> beds
  analysts["Analysts"] --> bi["BI reports"]
  bi --> wh`,

  "change-data-capture-3": `flowchart TD
  channels["Branches and online banking"] --> mf["Mainframe core account app · one vendor release a year"]
  mf --> db[("Core account DB")]
  db -->|"nightly batch file"| batch["Batch file transfer · data up to 22 h old"]
  batch --> fraud["Fraud scoring service · needs changes within 2 s"]
  batch --> wh[("Data warehouse")]
  batch -.->|"no feed yet"| search["New search service · needs the same freshness"]
  cards["Card network"] --> fraud
  mfteam["Mainframe team"] -.->|"publishing calls quoted at 14 months, rejected"| mf`,

  "change-data-capture-4": `flowchart TD
  planners["Planners"] --> erp["Licensed ERP suite · closed source, no triggers or schema changes allowed"]
  erp --> pg[("ERP Postgres · work orders, bills of material")]
  floor["Shop-floor display"] -->|"query every 60 s"| pg
  portal["Supplier portal"] -->|"query every 60 s"| pg
  ml["Demand model"] -->|"query every 60 s"| pg
  pg -.->|"polling adds 30% load and never returns deleted rows"| floor
  portal --> suppliers["Suppliers"]
  ml --> fs[("Feature store")]`,

  "change-data-capture-5": `flowchart TD
  advertisers["Advertisers"] --> crm["In-house CRM · PHP, frozen until a replacement two years out"]
  crm --> db[("CRM advertiser DB")]
  poll["Timestamp polling job · every minute, never sees deleted rows"] -->|"rows with a newer timestamp"| db
  poll --> fs[("Feature store · stale budget caps cost 40,000 dollars")]
  fs --> serving["Ad serving · closed accounts keep serving"]
  serving --> exchange["Ad exchanges"]
  serving --> logs[("Impression log")]`,

  "transactional-outbox-1": `flowchart TD
  support["Support agents"] --> api["Refunds service"]
  api -->|"1. commit refund row"| pg[("Refunds Postgres")]
  api -->|"2. publish refund message · pod killed in between, 63 never sent"| broker[["Message broker"]]
  broker --> settle["Settlement"]
  broker --> notify["Notifications"]
  broker --> acct["Accounting"]
  api -.->|"publish succeeds, then the transaction rolls back"| broker
  pg --> reports["Finance reports"]`,

  "transactional-outbox-2": `flowchart TD
  customers["Customers"] --> order["Order service · 900 orders/s"]
  order -->|"1. save order"| mysql[("Orders MySQL")]
  order -->|"2. publish order message"| broker[["Message broker · 90 s outage at dinner rush"]]
  broker --> dispatch["Courier dispatch"]
  broker --> terminal["Restaurant terminals · never saw 2,400 orders"]
  order -.->|"two-phase commit tried · dropped to 120 orders/s"| broker
  order --> pay["Payment provider"]`,

  "transactional-outbox-3": `flowchart TD
  retail["Retail stores and app"] --> act["Line activation service"]
  act -->|"1. publish activation first"| broker[["Message broker"]]
  act -->|"2. write 4 rows · fails about 200 times a day"| db[("Activation DB")]
  broker --> prov["Provisioning"]
  broker --> billing["Billing · charges for lines never activated"]
  broker --> sms["SMS welcome"]
  prov --> hlr[("Network subscriber register")]`,

  "transactional-outbox-4": `flowchart TD
  scanners["Package scanners"] --> lb["Load balancer"]
  lb --> ship["Shipment service · autoscales down, instances terminated mid-request"]
  ship -->|"1. update shipment row"| db[("Shipment DB")]
  ship -->|"2. publish scan, retried in handler · 0.4% never sent, about 4,000 a day"| broker[["Message broker"]]
  broker --> tracking["Customer tracking page"]
  broker --> recon["Carrier reconciliation job"]
  db --> reports["Operations reports"]`,

  "transactional-outbox-5": `flowchart TD
  subscribers["Subscribers"] --> apps["Web and TV apps"]
  apps -->|"upgrade plan"| sub["Subscription service"]
  sub -->|"1. commit plan row"| db[("Subscriptions DB")]
  sub -->|"2. publish after commit · out of order under load, lost on crash"| broker[["Message broker"]]
  broker --> ent["Entitlement service · 11 accounts disagree with stored plan"]
  broker --> inv["Invoicing service"]
  audit["Auditors"] -.-> db`,

  "saga-1": `flowchart TD
  customer["Customer app"] -->|"place order"| api["Order Service · one wrapping transaction around all three calls"]
  api -->|"reserve items"| inv["Restaurant Inventory Service"]
  api -->|"charge card"| pay["Payments Service"]
  pay -->|"card charged, cannot be rolled back"| psp["Payment provider"]
  api -->|"assign courier"| courier["Courier Dispatch Service"]
  api --> odb[("Orders Postgres")]
  inv --> idb[("Inventory Postgres")]
  pay --> pdb[("Payments Postgres")]
  courier --> cdb[("Courier Postgres")]
  api -.->|"about 900 orders a day charged with no courier"| support["Support team · fixes orders by hand"]
  menu["Menu API"] --> cache[("Menu Cache")]
  customer --> menu`,

  "saga-2": `flowchart TD
  store["Retail store and carrier app"] -->|"activate line"| act["Activation code · calls four services in a row over HTTP"]
  act -->|"1. create account"| acct["Customer Account Service"]
  act -->|"2. assign phone number"| num["Number Inventory Service"]
  act -->|"3. turn line on · 8 to 40 s"| net["Network Provisioning Service"]
  act -->|"4. start monthly charge"| bill["Billing Service"]
  acct --> adb[("Account DB")]
  num --> ndb[("Number DB")]
  net --> core["Network core"]
  bill --> bdb[("Billing DB")]
  act -.->|"gives up wherever it breaks"| half["Half-activated lines"]
  store --> plans["Plan Catalog API"]
  plans --> pcache[("Plan Cache")]`,

  "saga-3": `flowchart TD
  agent["Agent portal"] -->|"one API call: issue policy"| api["Policy API · expects one atomic write"]
  api --> uw["Underwriting Service"]
  api --> doc["Document Service"]
  api --> pay["Payments Service"]
  api --> claims["Claims Service"]
  uw --> uwdb[("Underwriting DB · accepted risk")]
  doc --> docdb[("Contract store · signed contract")]
  pay --> paydb[("Payments DB · first premium")]
  claims --> cdb[("Claims DB · coverage record")]
  api -.->|"two-phase commit not enabled"| dba["DBA team"]
  pay -.->|"premium rejected, policy stays live"| live["Live policy with no premium"]
  agent --> quote["Quote Service"]
  quote --> rates[("Rate tables")]`,

  "saga-4": `flowchart TD
  shipper["Shipper portal"] -->|"book shipment"| api["Booking API · calls services one after another"]
  api -->|"hold truck slot"| cap["Capacity Service · region A"]
  api -->|"file paperwork · 80 to 200 ms away"| customs["Customs Service · region B"]
  api -->|"create receivable · 80 to 200 ms away"| inv["Invoicing Service · region C"]
  cap --> capdb[("Capacity DB")]
  customs -->|"file with broker"| broker["Customs broker"]
  customs --> cudb[("Customs DB")]
  inv --> ardb[("Accounts receivable DB")]
  customs -.->|"about 2 percent of bookings fail here"| api
  capdb -.->|"truck slot held forever, no invoice"| stuck["Stuck truck slots"]
  shipper --> track["Tracking Service"]
  track --> gps[("GPS ping store")]`,

  "saga-5": `flowchart TD
  doctor["Referring doctor"] -->|"create referral"| ref["Referral API · nothing holds the four writes together since the split"]
  ref --> sched["Scheduling Service"]
  ref --> clinic["Specialist Clinic Service"]
  ref --> ben["Benefits Service"]
  ref --> rec["Records Service"]
  sched --> sdb[("Scheduling DB")]
  clinic --> cdb[("Clinic DB · slot held")]
  ben --> bdb[("Benefits DB")]
  rec --> rdb[("Records DB")]
  ref -.->|"fails halfway about 40 times a week"| orphan["Clinic slot held for a patient with no appointment"]
  monolith["Old monolith DB · one transaction, retired"] -.-> ref
  doctor --> directory["Provider directory"]`,

  "compensating-transaction-1": `flowchart TD
  traveler["Traveler app"] -->|"book trip"| orch["Booking orchestrator · runs steps in order"]
  orch -->|"1. book flight"| flight["Flight supplier API"]
  orch -->|"2. book rental car"| car["Car supplier API"]
  orch -->|"3. book hotel"| hotel["Hotel supplier API"]
  hotel -.->|"fails after retries are exhausted"| orch
  orch --> log[("Workflow log")]
  log -->|"read by hand, about 30 times a week"| oncall["On-call engineer"]
  oncall -->|"cancel by hand · 15 percent fee"| flight
  oncall -->|"cancel by hand · deposit back, booking fee kept"| car
  orch --> pay["Payments Service"]
  traveler --> search["Trip Search Service"]`,

  "compensating-transaction-2": `flowchart TD
  cycle["Monthly pay cycle workflow"] -->|"send payments"| ach["Bank ACH file · 4,200 payments sent"]
  cycle -->|"deduct premiums"| benefits["Benefits vendor"]
  cycle -->|"step 4 · file taxes"| tax["Tax filing vendor"]
  tax -.->|"rejects the batch"| cycle
  cycle -.->|"later steps"| k401["401k provider"]
  cycle -.->|"later steps"| gl["General ledger"]
  cycle -.->|"later steps"| email["Email notifier"]
  cycle -.->|"stops, nothing reversed"| finance["Finance team · 2 days reversing by hand"]
  finance -->|"ACH return entries by hand"| ach
  finance -->|"adjusting credits by hand"| benefits
  hr["HR system"] -->|"employee changes"| cycle`,

  "compensating-transaction-3": `flowchart TD
  orders["Order Service"] --> flow["Fulfillment workflow"]
  flow -->|"1. pick · stock decremented"| stock[("Stock counts DB · also changed by other orders")]
  flow -->|"2. pack · pallet staged"| floor[["Floor crew task queue"]]
  flow -->|"3. buy label · $8.40"| carrierapi["Carrier label API"]
  flow -->|"4. hand off to carrier"| handoff["Carrier handoff"]
  handoff -.->|"address undeliverable · about 700 a day"| flow
  flow -.->|"gives up, nothing undone · about $5,000 lost a week"| loss["Paid labels, missing stock, staged pallets"]
  slotting["Slotting Service"] --> stock
  flow --> tracking[("Shipment tracking DB")]`,

  "compensating-transaction-4": `flowchart TD
  player["Player"] -->|"buy bundle"| purchase["Bundle purchase process · five steps"]
  purchase -->|"charge card · settled"| pay["Payments Service"]
  purchase -->|"grant base game"| ent["Entitlement Service"]
  purchase -->|"credit 500 in-game currency"| wallet[("Currency balance · player may have spent it")]
  purchase -->|"grant two add-ons"| ent
  ent -.->|"add-on 2 rejected · region restriction"| purchase
  purchase -->|"post achievement"| achievements["Achievement Service"]
  other["Other purchases"] --> wallet
  purchase -.->|"gives up, finished steps left in place"| partial["Charged player with a partial bundle"]
  player --> catalog["Store catalog"]`,

  "compensating-transaction-5": `flowchart TD
  officer["Loan officer"] --> flow["Mortgage approval flow"]
  flow -->|"1. pull credit"| credit["Credit bureau"]
  flow -->|"2. order appraisal · $600"| appraisal["Appraisal vendor"]
  flow -->|"3. lock rate · held 45 days"| desk["Funding desk API"]
  flow -->|"4. reserve funds"| funds["Funds reservation service"]
  funds -.->|"fails after all retries · about 120 files a month"| flow
  flow -.->|"dead files copied out"| sheet["Ops spreadsheet"]
  sheet -->|"release rate lock by hand · misses 1 in 8"| desk
  sheet -->|"cancel appraisal by hand"| appraisal
  flow --> loanfile[("Loan file DB")]
  officer --> uploads["Document upload portal"]`,
  "bulkhead-5": `flowchart TD
  trucks["12,000 trucks · device messages"] -->|"5 message kinds"| ingest["Device gateway"]
  ingest --> queue[["One queue · GPS, temperature, door, check-in, firmware confirmations"]]
  queue -.->|"any consumer takes any kind"| group["One consumer group · 24 processes · all 24 stuck on firmware"]
  group -->|"firmware handler hangs 30 s per message"| blob[("Blob storage")]
  group -->|"GPS pings 45 min behind"| tracking["Live tracking"]
  group --> telemetry[("Telemetry DB")]
  dispatch["Dispatchers"] --> tracking`,

  "rate-limiting-1": `flowchart TD
  warehouse["Analytics warehouse"] --> events[("Day's conversion events")]
  sched["Nightly scheduler"] --> job["Nightly upload job · 200 parallel workers · about 4,000 writes/s"]
  events --> job
  job -->|"push as fast as possible · back off per failed call"| api["Ad partner API · 500 writes/s per account"]
  api -.->|"HTTP 429 on 68 percent of calls"| job
  job -.->|"resend rejected records · run takes 5 h, was 2.5 h"| api`,

  "rate-limiting-2": `flowchart TD
  appts[("Day's appointments · 90,000 checks")] --> batch["6 am batch job"]
  batch --> pool["Worker pool · fires as threads free up · about 300 requests/s"]
  pool -->|"eligibility checks at 300/s"| vendor["Insurance eligibility vendor · contract allows 20 requests/s per key"]
  vendor -.->|"rejects the excess · written warning of key suspension"| pool
  pool --> results[("Eligibility results")]
  staff["Front desk staff"] --> app["Clinic scheduling app"]
  app --> results`,

  "rate-limiting-3": `flowchart TD
  cron["Hourly timer · wakes at the top of the hour"] --> poller["Tracking poller"]
  shipments[("Open shipments")] --> poller
  poller -->|"all 10,000 calls in the first 4 min"| carrier["Carrier tracking API · 10,000 calls per hour per customer · fixed hourly window"]
  carrier -.->|"every call refused for the next 56 min"| poller
  poller --> status[("Tracking status DB · 58 min stale by 2:59 pm")]
  customers["Customers and support"] --> portal["Tracking page"]
  portal --> status`,

  "rate-limiting-4": `flowchart TD
  file[("Nightly file · 10 million transaction rows")] --> loader["Loader · writes as fast as it reads"]
  loader -->|"far above 2,000 rows/s"| docdb[("Document DB · 20,000 units/s · 10 units per row · 2,000 rows/s")]
  docdb -.->|"most writes refused"| loader
  loader -.->|"resend · each row sent about 3 times"| docdb
  loader --> logs[("Error logs · 40 GB a night")]
  app["Fintech app · reads"] --> docdb`,

  "rate-limiting-5": `flowchart TD
  players[("2 million player push tokens")] --> sender["Push sender · 50 connections · sends until refused"]
  launch["Launch-day campaign"] --> sender
  sender -->|"pushes nonstop"| vendor["Push vendor · plan allows 600 messages/s"]
  vendor -.->|"about 40 percent rejected"| sender
  sender -.->|"resends · nearly 3 times the needed volume"| vendor
  vendor --> devices["Player phones"]`,

  "throttling-1": `flowchart TD
  tenants["About 900 tenants · 3 to 8 requests/s each"] --> lb["Load balancer"]
  script["One tenant's script · 150 requests/s for 40 min"] --> lb
  lb --> api["Analytics API servers · CPU at 96%"]
  api --> query["Query engine"]
  query --> store[("Analytics store")]
  api -.->|"p99 goes from 120 ms to 4.2 s for every tenant · 500 ms promise broken"| tenants
  scaler["Autoscaler · adds servers after about 6 min"] -.-> api`,

  "throttling-2": `flowchart TD
  viewers["2.1 million concurrent viewers · capacity sized for 1.2 million"] --> edge["Delivery edge · stream stutters for everyone"]
  edge -->|"full quality video"| origin["Stream origin"]
  origin --> enc["Encoding fleet · no hardware can be added mid-match"]
  viewers --> app["Player backend"]
  app --> recs["Personalized recommendation panel"]
  app --> stats["Live stats overlay"]
  recs -->|"with stats, about 18% of backend capacity"| shared[("Shared backend cluster")]
  stats --> shared`,

  "throttling-3": `flowchart TD
  riders["Transit app riders"] --> lb["Load balancer"]
  scrapers["2 scrapers · 22,000 requests/s combined · unique query strings"] --> lb
  lb --> cache[("Response cache · most scraper calls miss")]
  cache -->|"miss"| api["Open-data API servers · sized for 4,000 requests/s · saturated"]
  api --> feed[("Bus arrivals DB")]
  api -.->|"timeouts"| riders
  gps["Bus GPS feed"] --> feed`,

  "throttling-4": `flowchart TD
  players["400,000 players · all try within 2 min at 6pm"] --> lb["Load balancer"]
  lb -->|"every request accepted"| queue[["Login queue · no limit"]]
  queue --> auth["Auth servers · 90,000 sign-ins/min max · thrashing"]
  auth -->|"full password hash check, even for refusals"| users[("Account DB")]
  auth -->|"session token"| sessions[("Session store")]
  auth -.->|"average sign-in 90 s · nobody gets in"| players
  players -.->|"after login"| game["Game servers"]`,

  "throttling-5": `flowchart TD
  meters["2 million meters · firmware now reports every 10 s instead of every 5 min"] -->|"200,000 messages/s · was 6,600"| gw["Device gateway"]
  gw --> ingest["Ingest tier · handles 25,000 messages/s · overloaded"]
  ingest -->|"200 ms write promise missed"| tsdb[("Time-series DB")]
  tsdb --> reports["Usage and billing reports"]`,

  "shuffle-sharding-1": `flowchart TD
  customers["8,999 other customers"] --> lb["Load balancer · spreads every customer across all 26 nodes"]
  bad["One customer · request pattern pegs node CPU"] --> lb
  lb -->|"bad traffic"| n1["Node 1 · CPU pegged"]
  lb -->|"bad traffic"| n2["Node 2 · CPU pegged"]
  lb -->|"bad traffic"| n3["Nodes 3 to 26 · CPU pegged"]
  n1 --> db[("Customer data store")]
  n2 --> db
  n3 --> db
  lb -.->|"errors for all 9,000 customers"| customers`,

  "shuffle-sharding-2": `flowchart TD
  platform["Commerce platform · events for 12,000 merchants"] --> queue[["Shared delivery queue · any sender takes any merchant"]]
  queue --> s1["Sender 1"]
  queue --> s2["Sender 2"]
  queue --> s3["Senders 3 to 40"]
  s1 -->|"waits 30 s timeout"| slow["One merchant's endpoint · holds every connection 30 s"]
  s2 -->|"waits 30 s timeout"| slow
  s3 -->|"waits 30 s timeout"| slow
  s3 -.->|"every merchant's webhooks 20 min late"| others["Other merchants' endpoints"]
  s1 --> log[("Delivery attempt log")]`,

  "shuffle-sharding-3": `flowchart TD
  clients["60,000 API clients"] --> lb["Load balancer · any request can go to any of 100 nodes"]
  bad["One client · malformed request sent in a loop"] --> lb
  lb -->|"attempt 1"| g1["Gateway node 1 · crashed"]
  lb -->|"retry lands on a new node"| g2["Gateway node 2 · crashed"]
  lb -->|"more retries, new node each time"| g3["Gateway nodes 3 to 100 · most crashed in under 3 min"]
  g1 --> pay["Payment services"]
  g2 --> pay
  g3 --> pay
  pay --> ledger[("Ledger DB")]
  lb -.->|"all 60,000 clients down"| clients`,

  "shuffle-sharding-4": `flowchart TD
  guilds["30,000 guilds · chat clients"] --> lb["Chat load balancer · spreads every guild across all 64 relays"]
  bot["One guild's bot · 5,000 messages/s"] --> lb
  lb -->|"bot traffic"| r1["Relay 1 · saturated"]
  lb -->|"bot traffic"| r2["Relay 2 · saturated"]
  lb -->|"bot traffic"| r3["Relays 3 to 64 · saturated"]
  r1 --> hist[("Chat history store")]
  r2 --> hist
  r3 --> hist
  lb -.->|"chat down for all 30,000 guilds for 11 min"| guilds`,

  "shuffle-sharding-5": `flowchart TD
  fleets["10,000 customer device fleets"] --> ep["Broker endpoint · any device can connect to any of 30 brokers"]
  storm["One customer's 40,000 devices · reconnect loop after bad certificate rollout"] --> ep
  ep -->|"reconnects"| b1["Broker 1 · overloaded"]
  ep -->|"reconnects"| b2["Broker 2 · overloaded"]
  ep -->|"reconnects"| b3["Broker 3 · overloaded"]
  ep -->|"reconnects"| b4["Brokers 4 to 30 · overloaded"]
  b1 --> tel[("Telemetry store")]
  b2 --> tel
  b3 --> tel
  b4 --> tel
  ep -.->|"every fleet's telemetry stalled for 30 min"| fleets`,

  "leader-election-1": `flowchart TD
  meters["90,000 smart water meters"] --> ingest["Reading ingest"]
  ingest --> readings[("Readings table")]
  asg["Autoscaler"] --> c1["Rollup container 1 · 60 s sweep timer"]
  asg --> c2["Rollup container 2 · 60 s sweep timer"]
  asg --> c12["Rollup containers 3 to 12 · same 60 s sweep timer"]
  c1 -->|"sweeps new readings"| readings
  c2 -->|"sweeps the same readings"| readings
  c12 -->|"sweep the same readings"| readings
  c1 -->|"writes hourly totals"| totals[("Hourly totals table · each total written 12 times")]
  c2 -->|"writes the same totals again"| totals
  c12 -->|"write the same totals again"| totals
  billing["Billing app"] --> totals`,

  "leader-election-2": `flowchart TD
  clients["Banking apps"] --> lb["Load balancer"]
  lb --> s0["Account service copy 0 · crashed Tuesday night"]
  lb --> s1["Account service copies 1 to 5"]
  s0 -->|"daily interest job · 2.1 million accounts · nothing posts while copy 0 is down"| db[("Accounts DB")]
  s1 -->|"requests only"| db
  cfg["Deploy config · env variable turns the job on only for copy 0"] -.-> s0
  cfg -.-> s1`,

  "leader-election-3": `flowchart TD
  players["Players waiting for a match"] --> api["Matchmaking API"]
  api --> i1["Matchmaking instance 1 · sweeps every 2 s"]
  api --> i2["Matchmaking instances 2 to 8 · each sweeps every 2 s"]
  i1 -->|"reads the whole waiting pool"| pool[("Waiting player pool")]
  i2 -->|"read the same pool at the same instant"| pool
  i1 -->|"assigns 5-player matches"| gs["Game server fleet"]
  i2 -->|"assign the same player to another match"| gs
  gs --> clients["Game clients · crash when a player is in two matches"]`,

  "leader-election-4": `flowchart TD
  c1["Consumer instance 1"] -->|"opens feed session"| carrier["Carrier scan event feed · one open session per account"]
  c2["Consumer instances 2 to 5"] -->|"open sessions with the same credentials · kick each other off"| carrier
  carrier -.->|"30 s gaps of lost scan events all day"| c1
  c1 --> events[("Package scan events DB")]
  c2 --> events
  events --> tracking["Tracking page and API"]`,

  "leader-election-5": `flowchart TD
  rA["Rebalancer replica · zone A"] -->|"reads queue depths"| metrics[("Fleet queue depth metrics")]
  rB["Rebalancer replica · zone B"] -->|"reads queue depths"| metrics
  rC["2 rebalancer replicas · zone C"] -->|"read queue depths"| metrics
  rA -->|"move encoder 7 to EU"| ctl["Encoder control API"]
  rB -->|"move encoder 7 to US · conflicts"| ctl
  rC -->|"more reassignment commands"| ctl
  ctl --> enc["Encoder fleet · flaps between regions · 6 min extra encode delay"]
  enc --> metrics`,

  "scheduler-agent-supervisor-1": `flowchart TD
  portal["Provider claim submissions · 4,000 a day"] --> api["Claims API"]
  api -->|"writes claim row"| db[("Claims DB")]
  api -->|"enqueue claim"| q[["Claim work queue"]]
  q --> worker["Claim worker · runs all 6 steps in one process · sometimes crashes"]
  worker -->|"step 2 eligibility check · sometimes hangs"| elig["Eligibility system"]
  worker -->|"step 5 payment authorization · sometimes hangs"| pay["Payment authorization system"]
  worker -->|"sets status processing"| db
  worker -->|"step 3 provider lookup"| prov[("Provider directory")]
  eng["Engineer · runs UPDATE statements by hand 3 weeks later"] -->|"about 60 claims a day stuck in processing"| db`,

  "scheduler-agent-supervisor-2": `flowchart TD
  app["Retail store activation app"] --> api["Activation API"]
  api -->|"activation row marked in progress"| db[("Activations DB")]
  api --> worker["Activation worker · 90 s timeout, dies on a slow vendor call"]
  worker -->|"1. reserve number"| num["Number reservation vendor"]
  worker -->|"2. register SIM"| sim["SIM registration vendor"]
  worker -->|"3. set up billing account"| bill["Billing vendor"]
  worker -->|"4. provision network"| net["Network provisioning vendor"]
  worker -.->|"dies · row left in progress with no owner · about 3 percent"| db
  support["Support team · morning spreadsheet of stuck line numbers"] -->|"replay by hand"| api
  undo["Undo commands for each step · written, never run automatically"] -.-> worker`,

  "scheduler-agent-supervisor-3": `flowchart TD
  signup["Customer signup"] --> api["Provisioning API"]
  api --> wf["Workflow process · 9 steps · 12 to 20 min"]
  wf -->|"reserve subdomain"| dns["DNS provider"]
  wf -->|"issue certificate"| ca["Certificate authority"]
  wf -->|"create containers"| cp["Container platform"]
  wf -->|"create subscription"| billing["Billing system"]
  wf -->|"run state"| db[("Environments DB · 140 half-built, some 5 months old")]
  drain["Node drain"] -.->|"terminates the process mid-run · run just stops"| wf`,

  "scheduler-agent-supervisor-4": `flowchart TD
  cron["Nightly payout batch"] --> worker["Payout worker · runs 5 steps · redeployed mid-batch"]
  worker -->|"steps 1 and 2 · compute and hold balance"| ledger[("Seller balance ledger")]
  worker -->|"step 3 transfer · usually 800 ms, hung over 10 min twice"| bank["Bank transfer API"]
  worker -->|"state SENDING · no owner, no timeout"| db[("Payouts DB · 312 rows stuck last month")]
  worker -->|"steps 4 and 5 · mark paid, email seller"| notify["Seller notification service"]
  deploy["Deploy pipeline"] -.->|"kills worker mid-batch"| worker
  db --> report["Finance payout report"]`,

  "scheduler-agent-supervisor-5": `flowchart TD
  am["Account manager"] -->|"launch campaign"| api["Campaign API"]
  api --> worker["Launch worker · recycled after exchange timeouts"]
  worker -->|"steps 1 to 5 · create campaign on each exchange"| ex["5 ad exchange APIs · calls sometimes time out"]
  worker -->|"step 6 · approve creative"| creative["Creative approval service"]
  worker -->|"step 7 · set budget"| budget["Budget service"]
  worker --> db[("Campaigns DB · 1 in 30 launches live on 3 exchanges, missing on 2")]
  am -.->|"spots half-applied launches by eye, re-runs them, sometimes creates duplicates"| api`,

};

// Mermaid source for the "solved" diagram of a quiz scenario, keyed by scenario
// id. Shown after the correct pattern is picked. Same architecture as the
// "before" diagram, with green for anything added or changed and red for
// anything removed. Scenarios missing from this map keep showing their "before"
// diagram.
const SOLVED_SCENARIO_DIAGRAMS = {
  "asynchronous-request-reply-1": `flowchart TD
  creator["Creator browser"] -->|"POST 900 MB source file"| lb["Load balancer · kills connection idle over 60s"]
  creator -.->|"no more re-uploads, the answer arrives in under 1 s"| lb
  lb -->|"connection closes right away"| api["Upload API"]
  api -->|"202 Accepted · Location /jobs/id · Retry-After 10"| creator
  creator -->|"GET /jobs/id every 10 s, then 303 to the result"| api
  api -->|"writes job row"| jobs[("Job DB · Running, Succeeded, Failed")]
  api -->|"stores source"| store[("Object store")]
  api -->|"enqueue transcode job"| queue[["Transcode queue"]]
  queue --> tc["Transcoder · 6 renditions · 3 to 9 min, nobody waiting"]
  tc -->|"updates job state and result"| jobs
  tc -->|"writes renditions"| store
  api -->|"video row"| db[("Video metadata DB")]
  store -.-> cdn["CDN"]
  cdn -.-> viewer["Viewers"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class jobs,queue,tc added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;`,

  "asynchronous-request-reply-2": `flowchart TD
  pacs["Hospital imaging archive"] --> intsrv["Vendor integration server · gives up at 120s"]
  intsrv -->|"outbound HTTPS only"| fw["Hospital firewall · no inbound connections"]
  fw -->|"POST /studies/analyze"| gw["API gateway"]
  gw -->|"answers in well under 120 s"| api["Scoring API"]
  api -->|"202 Accepted · Location /studies/id/status · Retry-After 30"| gw
  intsrv -->|"GET status every 30 s, then 303 to the report"| fw
  api -->|"writes job row"| jobs[("Job DB · Running, Succeeded, Failed")]
  api -->|"enqueue scoring job"| queue[["Scoring queue"]]
  queue --> gpu["GPU worker · 2 to 6 min per study, nobody waiting"]
  gpu -->|"updates job state"| jobs
  gpu -->|"writes report"| reports[("Report store")]
  api -->|"study row"| db[("Study DB")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class jobs,queue,gpu added;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;`,

  "asynchronous-request-reply-3": `flowchart TD
  browser["Customer browser · shows the run state"] -->|"click Generate Year-End Statements"| cdn["CDN · returns 504 at 100s"]
  cdn -->|"request returns in about a second"| app["Payroll app"]
  app -->|"202 Accepted · Location /runs/id · Retry-After 15"| browser
  browser -->|"GET /runs/id every 15 s, then 303 to the bundle"| app
  app -->|"writes run row"| jobs[("Run DB · Running, Succeeded, Failed")]
  app -->|"enqueue statement run"| queue[["Statement queue"]]
  queue --> gen["Statement generator · 90 s to 4 min, nobody waiting"]
  gen -->|"updates run state"| jobs
  gen -->|"reads 40,000 employee rows"| db[("Payroll DB")]
  gen -->|"writes PDF bundle"| store[("Object store")]
  db -.-> cache[("Read cache")]
  cache -.-> app

  classDef added stroke:#16a34a,stroke-width:3px;
  class jobs,queue,gen added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;`,

  "asynchronous-request-reply-4": `flowchart TD
  partner["Partner Java client · drops socket at 30s"] -->|"POST route with 350 stops"| fw["Partner firewall · no inbound port for callbacks"]
  fw --> gw["API gateway"]
  gw --> api["Route API · web threads freed right away"]
  api -->|"202 Accepted · Location /routes/id · Retry-After 20"| gw
  partner -->|"GET /routes/id every 20 s, then 303 to the solved route"| fw
  api -->|"writes job row"| jobs[("Job DB · Running, Succeeded, Failed")]
  api -->|"enqueue solve job"| queue[["Solver queue"]]
  queue --> solver["Solver fleet · 2 to 11 min, nobody waiting"]
  solver -->|"updates job state"| jobs
  solver -->|"lookups"| matrix[("Distance matrix cache")]
  solver -->|"writes solved route"| db[("Route DB")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class jobs,queue,api added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "asynchronous-request-reply-5": `flowchart TD
  agency["Agency script · one call per export, no loop"] -->|"request audience export"| gw["API gateway · caps response at 29s"]
  gw -.->|"no more 504 at 29 s"| agency
  gw -->|"request returns in about a second"| api["Export API"]
  api -->|"202 Accepted · Location /exports/id · Retry-After 60"| agency
  agency -->|"GET /exports/id every 60 s, then 303 to the file"| api
  api -->|"writes job row"| jobs[("Job DB · Running, Succeeded, Failed")]
  api -->|"enqueue export job, one per request"| queue[["Export queue"]]
  queue --> job["Export job · 5 to 20 min, nobody waiting"]
  job -->|"scans 400 million rows"| warehouse[("Audience warehouse")]
  job -->|"writes finished file and records its URL"| store[("Export storage · linked to the job id")]
  job --> jobs

  classDef added stroke:#16a34a,stroke-width:3px;
  class jobs,queue,store added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;`,

  "queue-based-load-leveling-1": `flowchart TD
  meters["40,000 smart meters · all report at the top of the hour"] -->|"12,000 writes/s for 90s, then idle 58 min"| lb["Load balancer"]
  lb --> ingest["Meter ingest service · writes a message and moves on"]
  ingest -->|"enqueue reading"| queue[["Reading queue · durable, holds the 90 s burst"]]
  queue --> worker["Ingest workers · capped count, safe to rerun a message"]
  worker -->|"steady 450 writes/s"| appliance[("Vendor appliance · 500 writes/s")]
  ingest -.->|"no longer writes straight through"| appliance
  queue -->|"waiting message count"| alarm["Backlog alarm"]
  appliance --> billing["Billing and reporting app"]
  billing --> cache[("Read cache")]
  ops["Operations dashboard"] --> billing

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,worker,alarm added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "queue-based-load-leveling-2": `flowchart TD
  clients["200,000 game clients · finish matches in a 2 minute wave"] --> gs["Game servers · hand off and move on"]
  gs -->|"enqueue match record"| queue[["Match queue · durable, absorbs the wave"]]
  queue --> worker["Stats workers · capped count, safe to rerun a message"]
  worker -->|"steady 800 writes/s"| stats["Stats service · stays under its limit"]
  gs -.->|"no longer writes and waits, so no client retries"| stats
  stats --> db[("Stats DB")]
  profile["Career stats API"] --> cache[("Stats cache")]
  cache --> db
  clients --> profile

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,worker,stats added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "queue-based-load-leveling-3": `flowchart TD
  pos["Store POS terminals"] --> lb["Load Balancer"]
  web["Web storefront"] --> lb
  lb --> svc["Store Service · 60 instances"]
  svc --> cache[("Catalog Cache")]
  svc --> db[("Inventory DB")]
  svc -->|"enqueue inventory change"| queue[["Inventory sync queue · durable, nothing is lost"]]
  queue --> worker["Sync workers · capped count, safe to rerun a message"]
  worker -->|"steady 20 calls/s, about 30 s behind"| soap["WMS SOAP endpoint · vendor appliance"]
  svc -.->|"no longer calls it directly at 900 calls/s"| soap
  soap --> wms[("Warehouse Management DB")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,worker added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#dc2626,stroke-width:3px;`,

  "queue-based-load-leveling-4": `flowchart TD
  cron["4,000 merchant cron jobs · all fire at 00:00 UTC"] -->|"4,000 uploads in 30 s, then nothing for 23 h"| gw["Upload API Gateway"]
  gw -->|"store the file, enqueue one message per file"| queue[["File queue · durable, holds the midnight burst"]]
  queue --> proc["File Processing Service · same hardware, steady 3 files/s, drains within the hour"]
  gw -.->|"no longer pushed 4,000 files at once"| proc
  proc --> cache[("Merchant Config Cache")]
  proc --> files[("Settlement File Store")]
  proc --> db[("Payments DB")]
  proc -.->|"no midnight restart, no manual recovery"| oncall["On-call engineer"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,proc added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "queue-based-load-leveling-5": `flowchart TD
  mobile["Mobile app users"] --> lb["Load Balancer"]
  web["Web users"] --> lb
  lb --> api["Upload API · answers once the original is stored"]
  api -->|"original bytes"| blob[("Photo Object Store")]
  api --> meta[("Photo Metadata DB")]
  api -->|"enqueue resize job"| queue[["Resize queue · absorbs the 4,000/s spike"]]
  queue --> img["Image Resize Service · steady rate, sized near the 50/s average"]
  api -.->|"no longer calls and waits, so a spike cannot 500 the upload path"| img
  img --> thumbs[("Thumbnail Store")]
  thumbs --> cdn["CDN"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,img added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "competing-consumers-1": `flowchart TD
  portal["Policyholder portal"] --> api["Claims API"]
  agents["Agent desktop"] --> api
  api --> db[("Claims DB")]
  api --> cache[("Policy Lookup Cache")]
  api -->|"~10 claims/s during business hours"| queue[["Claims Queue · locks a message while one worker holds it"]]
  queue -->|"locked for this worker only"| w1["Enrichment Worker 1 · safe to run twice on a claim"]
  queue -->|"locked for this worker only"| w2["Enrichment Worker 2 · safe to run twice on a claim"]
  queue -->|"locked for this worker only"| w3["Enrichment Workers 3 to 60 · added until the backlog drains"]
  w1 -->|"acknowledge, message deleted; lock expiry returns a crashed worker's claim"| queue
  w1 -->|"mostly network waiting"| ext["External enrichment APIs"]
  w2 --> ext
  w3 --> ext
  w1 --> db
  w2 --> db
  w3 --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,w1,w2,w3 added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;`,

  "competing-consumers-2": `flowchart TD
  creators["Creators"] --> api["Upload API"]
  api --> blob[("Clip Object Store")]
  api -->|"5 uploads/s"| queue[["Moderation Queue · locks a message while one container holds it"]]
  queue -->|"locked for this container only"| p1["Moderation Container 1 · 12 s per clip"]
  queue -->|"locked for this container only"| p2["Moderation Container 2 · 12 s per clip"]
  queue -->|"locked for this container only"| p3["Moderation Containers 3 to 80 · added until the backlog drains"]
  p1 -->|"acknowledge, message deleted; a crash returns the clip to the queue"| queue
  p1 -->|"downloads clip"| blob
  p2 --> blob
  p3 --> blob
  p1 --> clf["Classifier · not CPU bound"]
  p2 --> clf
  p3 --> clf
  p1 --> db[("Moderation Results DB")]
  p2 --> db
  p3 --> db
  db -->|"new uploads reviewed within minutes"| feed["Feed Service"]
  viewers["Viewers"] --> feed

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,p1,p2,p3 added;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;
  linkStyle 16 stroke:#16a34a,stroke-width:3px;`,

  "competing-consumers-3": `flowchart TD
  product["Product services"] -->|"password reset emails"| api["Notification API"]
  marketing["Marketing tool"] -->|"500,000 messages in 10 min"| api
  api --> queue[["Email Queue · locks a message while one sender holds it"]]
  queue -->|"locked for this sender only"| s1["Sender Process 1 · 300 ms per send"]
  queue -->|"locked for this sender only"| s2["Sender Process 2 · 300 ms per send"]
  queue -->|"locked for this sender only"| s3["Sender Processes 3 to 300 · sends are already safe to repeat"]
  s1 -->|"acknowledge, message deleted; a crash returns the send to the queue"| queue
  cache[("Template Cache")] --> s1
  cache --> s2
  cache --> s3
  s1 -->|"fleet sends up to 1,000/s, inside the provider's 2,000/s"| provider["Mail Provider · accepts 2,000 requests/s"]
  s2 --> provider
  s3 --> provider
  s1 --> db[("Send Results DB")]
  s2 --> db
  s3 --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,s1,s2,s3 added;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;`,

  "competing-consumers-4": `flowchart TD
  seq["Sequencers · 400 samples/day"] --> intake["Sample Intake Service"]
  intake --> raw[("Raw Read Store")]
  intake -->|"one message per sample"| queue[["Sample Queue · locks a message while one process holds it"]]
  queue -->|"locked for this process only"| a1["Analysis Process 1 · 6 min pipeline"]
  queue -->|"locked for this process only"| a2["Analysis Process 2 · 6 min pipeline"]
  queue -->|"locked for this process only"| a3["Analysis Processes 3 to 200 · one per idle core"]
  a1 -->|"acknowledge, message deleted; a dead machine's lock expires and the sample comes back"| queue
  cluster["Compute Cluster · 200 cores"] -.->|"runs"| a1
  cluster -.-> a2
  cluster -.-> a3
  a1 -->|"reads raw data"| raw
  a2 --> raw
  a3 --> raw
  a1 --> results[("Results DB")]
  a2 --> results
  a3 --> results
  results --> portal["Lab Portal"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,a1,a2,a3 added;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;`,

  "competing-consumers-5": `flowchart TD
  wh["Warehouses"] -->|"90,000 label requests in 20 min"| api["Shipping API"]
  api -->|enqueue| queue[["Label Queue · locks a message while one generator holds it"]]
  api --> db[("Label Store")]
  queue -->|"locked for this generator only"| g1["Label Generator 1 · 800 ms per label"]
  queue -->|"locked for this generator only"| g2["Label Generator 2 · 800 ms per label"]
  queue -->|"locked for this generator only"| g3["Label Generators 3 to 300 · drain before the 4 PM cutoff"]
  g1 -->|"acknowledge, message deleted; a dead machine's label comes back"| queue
  g1 -->|"fleet stays inside the carrier's 500 req/s"| carrier["Carrier API · accepts 500 req/s"]
  g2 --> carrier
  g3 --> carrier
  g1 -->|"write label"| db
  g2 --> db
  g3 --> db
  db --> pick["Truck Loading Screen · 4 PM cutoff"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,g1,g2,g3 added;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;`,

  "priority-queue-1": `flowchart TD
  analyzers["Lab Analyzers"] -->|"stat troponin at 2:05 AM, labelled High"| ingest["Lab Result Service · labels every result High or Routine"]
  batch["Overnight Batch Job"] -->|"20,000 results at 2 AM, labelled Routine"| ingest
  ingest -->|"High"| stat[["Stat Result Queue"]]
  ingest -->|"Routine"| routine[["Routine Result Queue"]]
  ingest -.->|"no single arrival-order stream"| stream[["Result Stream"]]
  stat --> sw1["Stat Worker 1 · group grows on demand"]
  stat --> sw2["Stat Worker 2 · group grows on demand"]
  routine --> rw1["Routine Workers · reserved so the batch still drains by 5 AM"]
  sw1 --> chart[("Patient Chart DB")]
  sw2 --> chart
  rw1 --> chart
  chart -->|"stat result posted within 2 min"| view["Clinician Chart · 2 min rule"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class stat,routine,sw1,sw2,rw1 added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class stream removed;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "priority-queue-2": `flowchart TD
  pos["Card Terminals"] -->|"live authorization · under 3 s"| auth["Authorization Service"]
  auth -->|"submit review job labelled High"| live[["Live Authorization Queue"]]
  risk["Overnight Risk Job"] -->|"150,000 jobs at 9 PM, labelled Low"| batchq[["Re-scoring Queue"]]
  auth -.->|"no single arrival-order stream"| queue[["Review Job Stream"]]
  live --> lw1["Review Worker 1 · live group"]
  live --> lw2["Review Worker 2 · live group, grows on demand"]
  batchq --> bw1["Re-scoring Workers · reserved group, finish by morning"]
  lw1 --> db[("Review Results DB")]
  lw2 --> db
  bw1 --> db
  db -->|"authorization cleared inside 3 s"| auth

  classDef added stroke:#16a34a,stroke-width:3px;
  class live,batchq,lw1,lw2,bw1 added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class queue removed;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "priority-queue-3": `flowchart TD
  subs["Paying Subscribers · 15 min promise"] --> api["Support Intake API · labels each report by account type"]
  free["Free Accounts · 48 h promise"] --> api
  bots["Bot Wave"] -->|"90,000 free-account reports in 1 hour"| api
  api -->|"High"| paid[["Subscriber Report Queue"]]
  api -->|"Low"| freeq[["Free Report Queue"]]
  api -.->|"no single arrival-order stream"| queue[["Report Work Stream"]]
  paid --> p1["Report Handler 1 · subscriber group"]
  paid --> p2["Report Handler 2 · subscriber group, grows on demand"]
  freeq --> f1["Free-account Handlers · reserved group, so the wave still drains"]
  p1 --> db[("Ticket DB")]
  p2 --> db
  f1 --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class paid,freeq,p1,p2,f1 added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class queue removed;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "priority-queue-4": `flowchart TD
  sensors["30,000 Factory Sensors"] -->|"routine readings, labelled Low"| gw["Ingest Gateway · labels alarms High, readings Low"]
  alarms["Equipment Fault Alarms"] -->|"raised 6:02 AM, labelled High"| gw
  gw -->|"High"| alarmq[["Alarm Stream"]]
  gw -->|"Low"| routineq[["Routine Reading Stream"]]
  gw -.->|"no single in-order stream"| stream[["Event Stream"]]
  alarmq --> ap["Alarm Processor · never queued behind readings"]
  routineq --> rp["Reading Processor · reserved capacity, readings still land"]
  rp --> tsdb[("Time Series DB")]
  ap --> tsdb
  ap -->|"alarm shown 6:02 AM, inside 5 s"| hmi["Plant Operator Screen"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class alarmq,routineq,ap,rp added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class stream removed;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "priority-queue-5": `flowchart TD
  ent["Enterprise Customers · 5 min promise"] --> api["Job Intake API · labels each job by contract"]
  self["Self-Serve Customers"] -->|"300,000 page bulk import at 8 AM"| api
  api -->|"High"| entq[["Enterprise Job Queue"]]
  api -->|"Low"| bulkq[["Bulk Job Queue"]]
  api -.->|"no single oldest-first stream"| queue[["Job Stream"]]
  api --> jobs[("Job DB")]
  entq --> e1["Doc Worker 1 · enterprise group"]
  entq --> e2["Doc Worker 2 · enterprise group, grows on demand"]
  bulkq --> b1["Bulk Workers · reserved group, so the import still finishes"]
  age["Aging job · raises a bulk job that has waited too long"] --> entq
  age --> bulkq
  e1 --> store[("Processed Doc Store")]
  e2 --> store
  b1 --> store

  classDef added stroke:#16a34a,stroke-width:3px;
  class entq,bulkq,e1,e2,b1,age added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class queue removed;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "claim-check-1": `flowchart TD
  scanner["CT Scanners"] -->|"chest CT study up to 180 MB"| ingest["Ingest Service"]
  ingest -->|"writes DICOM series, gets back an id"| store[("Object Storage")]
  ingest -->|"publishes the id only, a few hundred bytes"| broker[["Message Broker · CPU back to normal"]]
  ingest -.->|"no more 700 chunk messages per study"| broker
  other["Other Services"] -->|"other queues on same cluster"| broker
  broker --> proc["Scan Processing Worker · reads the id"]
  proc -->|"fetches the study by id"| store
  broker -->|"delivery latency back to 40 ms"| oc["Other Consumers"]
  proc --> results[("Study Results DB")]
  cleanup["Cleanup job · deletes the message and the stored study once processed"] --> store

  classDef added stroke:#16a34a,stroke-width:3px;
  class broker,proc,cleanup added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "claim-check-2": `flowchart TD
  drones["Drone fleet"] -->|flight images| upload["Upload service"]
  upload -->|"writes 400 MB bundle, gets back an id"| bucket[("Image bucket")]
  upload -->|"publish message carrying the id only"| topic[["Flight topic · back to 20,000 msg/s · broker storage cost near zero"]]
  topic -->|"id"| stitch["Stitching · fetches the bundle by id"]
  topic -->|"id"| defect["Defect detection · fetches the bundle by id"]
  topic -->|"id"| billing["Billing · never opens the images"]
  topic -->|"id"| archive["Archive · never opens the images"]
  stitch -->|"reads bundle"| bucket
  defect -->|"reads bundle"| bucket
  stitch --> survey[(Survey DB)]
  defect --> survey
  billing --> survey

  classDef added stroke:#16a34a,stroke-width:3px;
  class topic,stitch,defect added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "claim-check-3": `flowchart TD
  lawyer["Lawyer browser"] -->|"attach scans and video"| api["Intake API"]
  api -->|"writes attachments, gets back an id"| docs[("Evidence store")]
  api --> meta[(Case metadata DB)]
  api -->|"publish routing data plus the id, a few hundred bytes"| bus[["Message bus · end to end back near 2 s"]]
  bus -->|"id"| s1["Service 1 · never touches the attachments"]
  s1 -->|"id"| bus
  bus -->|"id"| mid["Services 2 to 5 · never touch the attachments"]
  mid -->|"id"| bus
  bus -->|"id"| review["Service 6 review · the only service that fetches the files"]
  review -->|"fetches attachments by id"| docs

  classDef added stroke:#16a34a,stroke-width:3px;
  class bus,s1,mid,review added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;`,

  "claim-check-4": `flowchart TD
  calls["Call platform"] -->|finished recording| rec["Recorder service"]
  rec -->|"writes WAV, gets back an id, stays in audit scope"| bucket[("Encrypted bucket")]
  rec -->|"enqueue the id only, one 64 KB billing unit"| queue[["Transcription queue · bill drops to a fraction"]]
  queue -.->|"no audio bytes in broker storage, nothing outside audit scope"| brokerstore[("Broker storage")]
  queue -->|"id"| workers["Transcription workers"]
  workers -->|"fetch audio by id"| bucket
  workers --> transcripts[(Transcript DB)]
  cleanup["Cleanup job · deletes the message and the recording once transcribed"] --> bucket
  agents["Support agents"] --> ui["Analytics UI"]
  ui --> transcripts

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,workers,cleanup added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class brokerstore removed;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "claim-check-5": `flowchart TD
  turbines["4,000 turbines"] -->|"8 MB waveform per 10 min"| gw["Site gateway"]
  gw -->|"writes the waveform, gets back an id"| waves[("Waveform store")]
  gw -->|"publish the id and anomaly metadata, well under 1 MB"| topic[["Ingest topic · nothing rejected · replication traffic tiny"]]
  topic -->|"id"| score["Anomaly scoring service"]
  score -->|"fetches the waveform by id only when the score crosses the threshold"| waves
  score --> alerts["Alerting service"]
  topic -.-> archiver["Archive writer"]
  archiver --> waves
  ops["Operations dashboard"] --> api["Turbine API"]
  api --> waves

  classDef added stroke:#16a34a,stroke-width:3px;
  class topic,score,waves added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;`,

  "dead-letter-queue-1": `flowchart TD
  partner["Partner systems"] -->|"12 orders with malformed country code"| api["Order API"]
  storefront["Storefront"] --> api
  api -->|enqueue| queue[["Order queue · backlog drains, fresh orders move"]]
  queue -->|delivers| consumer["Order consumer · full capacity on fresh orders"]
  consumer -.->|"no longer redelivered forever"| queue
  consumer -->|"still fails after 3 attempts, move message"| dlq[["Dead letter queue · keeps body and headers"]]
  consumer -->|"orders that parse"| wms["Warehouse system"]
  consumer -->|"12 parse errors, logged once each"| logs[("Error logs")]
  wms --> orders[(Order DB)]
  dlq --> team["Partner integration team · inspects each order"]
  team -->|"resubmit once country code is fixed"| api

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,consumer,dlq,team added;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "dead-letter-queue-2": `flowchart TD
  hospital["Hospital HL7 feed"] -->|messages| queue[["Feed queue · keeps messages 24 h · max receive count 3"]]
  queue --> consumer["Integration consumer · error rate clears"]
  consumer -->|"look up patient"| emr[(Patient record DB)]
  consumer -->|"0.3 percent still fail after 3 attempts"| dlq[["Dead letter queue · keeps messages 30 days"]]
  consumer -.->|"no longer redelivered forever"| queue
  consumer -->|"messages that match a patient"| clinical[(Clinical data store)]
  consumer --> logs[("Error logs")]
  dlq -->|"message count"| alarm["Dead letter alarm"]
  monitor["Error rate alert"] --> oncall["On-call engineer · no nightly page"]
  alarm --> team["Integration team · compliance review"]
  dlq --> team
  consumer --> monitor

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,dlq,consumer,alarm added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "dead-letter-queue-3": `flowchart TD
  apps["Rider and driver apps"] --> trip["Trip service"]
  trip --> trips[(Trip DB)]
  trip -->|"publish completed trip"| queue[["Settlement queue · max receive count 3"]]
  queue --> fleet["Settlement worker fleet · back on trips it can process"]
  fleet -->|"2,100 old-layout messages move after 3 failed attempts"| dlq[["Dead letter queue · keeps the exact bodies for 14 days"]]
  fleet -.->|"no longer redelivered every 30 s"| queue
  fleet -->|"trips that deserialize"| ledger[(Settlement DB)]
  fleet --> payouts["Payout provider"]
  fleet --> logs[("Error logs")]
  dlq -->|"message count"| alarm["Dead letter alarm"]
  eng["Engineering · replays the 2,100 messages when the converter ships"] --> dlq

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,dlq,fleet,alarm added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "dead-letter-queue-4": `flowchart TD
  players["Game clients"] -->|purchase receipt| api["Purchase API"]
  jail["Jailbroken clients"] -->|receipt with bad signature| api
  api -->|enqueue| queue[["Receipt queue · max receive count 3 · depth means what it says again"]]
  queue -.-> worker["Receipt consumer"]
  worker --> check{"signature valid"}
  check -->|yes| db[("Entitlement DB")]
  check -->|"no, moved after 3 attempts"| dlq[["Dead letter queue · keeps the 8,000 bad receipts"]]
  check -.->|"no longer retried forever"| queue
  queue -->|depth| alarm["Queue depth alarm · quiet unless real work is backing up"]
  dlq -->|"message count"| dlqalarm["Dead letter alarm"]
  support["Support team · looks up a player's bad receipt"] --> dlq
  support --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,dlq,alarm,support added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "dead-letter-queue-5": `flowchart TD
  partners["Shipping partners"] -->|shipment events| api["Events API"]
  api -->|enqueue| queue[["Shipment queue · 4 day retention · max receive count 3"]]
  queue --> svc["Customs filing service · no longer drops anything"]
  svc -->|tariff code| broker["Customs broker"]
  broker -->|accepted| db[("Filings DB")]
  broker -->|"rejected · 40 per day"| svc
  svc -->|"moved with its original body and headers"| dlq[["Dead letter queue · 30 day retention"]]
  svc -.->|"errors are no longer caught and dropped"| drop["Message dropped"]
  dlq -->|"message count"| alarm["Dead letter alarm"]
  compliance["Compliance team · replays events after the tariff table is fixed"] --> dlq

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,dlq,svc,alarm added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class drop removed;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "idempotency-key-1": `sequenceDiagram
  participant App as Mobile app · 10s client timeout
  participant LB as Load balancer
  participant API as Payments API
  participant Keys as Idempotency store · new
  participant DB as Charges DB · slowdown
  participant Card as Card network
  rect rgba(22, 163, 74, 0.18)
    App->>App: make a random Idempotency-Key for this purchase
    App->>LB: POST /charges with Idempotency-Key
  end
  LB->>API: POST /charges
  rect rgba(22, 163, 74, 0.18)
    API->>Keys: key not seen before, claim it
  end
  API->>DB: insert charge row
  API->>Card: authorize card
  rect rgba(22, 163, 74, 0.18)
    API->>Keys: save status code and body under the key
  end
  Note over API,DB: call takes 14s
  App->>App: 10s timeout fires
  rect rgba(22, 163, 74, 0.18)
    App->>LB: POST /charges again with the same Idempotency-Key
    LB->>API: POST /charges
    API->>Keys: key already has a saved response
    Keys-->>API: first response
    API-->>App: same charge id, card not charged again
  end
  rect rgba(220, 38, 38, 0.18)
    API--xDB: no second charge row
    API--xCard: no second authorization
  end
  Note over Keys: a real second purchase carries a new key · saved keys are deleted after 24 h`,

  "idempotency-key-2": `sequenceDiagram
  participant Job as Batch job
  participant VPN as VPN link · drops 1 in 500
  participant API as Internal transfer service
  participant Keys as Idempotency store · new
  participant Ledger as Ledger DB
  rect rgba(22, 163, 74, 0.18)
    Job->>Job: make a random Idempotency-Key for this transfer
    Job->>VPN: POST transfer with Idempotency-Key
  end
  VPN->>API: POST transfer
  rect rgba(22, 163, 74, 0.18)
    API->>Keys: key not seen before, claim it
  end
  API->>Ledger: insert ledger entry, money moves
  Ledger-->>API: committed
  rect rgba(22, 163, 74, 0.18)
    API->>Keys: save 201 and body under the key
  end
  API-->>VPN: 201 created
  VPN--xJob: connection drops mid-response
  rect rgba(22, 163, 74, 0.18)
    Job->>VPN: POST transfer again with the same Idempotency-Key
    VPN->>API: POST transfer
    API->>Keys: key already has a saved response
    Keys-->>API: first response
    API-->>Job: same 201 and transfer id
  end
  rect rgba(220, 38, 38, 0.18)
    API--xLedger: no second ledger entry, money does not move again
  end
  Note over Keys: a genuine repeat transfer carries a new key · saved keys are deleted after 24 h`,

  "idempotency-key-3": `sequenceDiagram
  participant Fan as Browser
  participant LB as Load balancer
  participant API as Reservation API
  participant Keys as Idempotency store · new
  participant Inv as Inventory DB
  rect rgba(22, 163, 74, 0.18)
    Fan->>Fan: make a random Idempotency-Key when the buy button is first pressed
    Fan->>LB: POST /reservations with Idempotency-Key
  end
  LB->>API: POST /reservations
  rect rgba(22, 163, 74, 0.18)
    API->>Keys: key not seen before, claim it
  end
  API->>Inv: decrement seat count, insert reservation row
  rect rgba(22, 163, 74, 0.18)
    API->>Keys: save status code and body under the key
  end
  LB-->>Fan: 502
  rect rgba(22, 163, 74, 0.18)
    Fan->>LB: double tap or browser retry sends the same Idempotency-Key
    LB->>API: POST /reservations
    API->>Keys: key already has a saved response
    Keys-->>API: first response
    API-->>Fan: same reservation, one seat block held
  end
  rect rgba(220, 38, 38, 0.18)
    API--xInv: no second decrement, seat count cannot go negative
  end
  Note over Keys: buying a second reservation on purpose sends a new key · saved keys are deleted after 24 h`,

  "idempotency-key-4": `sequenceDiagram
  participant Cust as Customer integration
  participant API as Payroll API
  participant Keys as Idempotency store · new
  participant DB as Batches DB
  participant Bank as Bank deposit file
  rect rgba(22, 163, 74, 0.18)
    Cust->>Cust: make a random Idempotency-Key and write it down before sending
    Cust->>API: POST direct deposit batch with Idempotency-Key · 4,300 employees
    API->>Keys: key not seen before, claim it
  end
  API->>DB: insert batch row with new batch id
  API->>Bank: submit deposits
  rect rgba(22, 163, 74, 0.18)
    API->>Keys: save status code and body, including a 500, under the key
  end
  API-->>Cust: response with batch id
  Note over Cust: crashes before recording the response
  rect rgba(22, 163, 74, 0.18)
    Cust->>API: replays the same batch with the same Idempotency-Key
    API->>Keys: key already has a saved response
    Keys-->>API: first response
    API-->>Cust: original batch id and status code
  end
  rect rgba(220, 38, 38, 0.18)
    API--xDB: no second batch row
    API--xBank: deposits are not submitted again
  end
  Note over Keys: a second payroll run on purpose carries a new key · a replay with a different body is rejected · saved keys are deleted after 24 h`,

  "idempotency-key-5": `flowchart TD
  tablet["Restaurant tablet"] --> lib["Partner client library · still retries 3x on network error"]
  lib -->|"POST refund with Idempotency-Key, same key on every retry"| gw["API gateway"]
  lib -.->|"retry 2, same key"| gw
  lib -.->|"retry 3, same key"| gw
  gw --> api["Refund service · looks up the key before doing any work"]
  api -->|"first call: save status code and body under the key · repeat call: return the saved response"| keys[("Idempotency store · keys expire after 24 h")]
  api -->|look up order| orders[("Orders DB")]
  api -->|"one refund row per key, not per call"| db[("Refunds DB")]
  api -->|"money moves once"| psp["Payment processor"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,api,keys added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "valet-key-1": `flowchart TD
  creators["Creators · authenticated in app"] -->|"ask for permission to upload one file"| lb[Load Balancer]
  lb --> api["Upload API · a few pods, no file bytes pass through"]
  api -->|"check creator identity"| auth[(Auth Store)]
  api --> tokensvc["Signs a token: this one object key, write only, expires in 5 min"]
  tokensvc -->|"token plus storage address"| creators
  api -->|"write video record"| db[(Metadata DB)]
  creators -->|"PUT 4 GB straight to storage over HTTPS"| store[(Object Storage)]
  api -.->|"no longer copies every byte, cost and memory pressure gone"| store
  store -->|"upload logged, file scanned before use"| api

  classDef added stroke:#16a34a,stroke-width:3px;
  class api,tokensvc,creators,store added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "valet-key-2": `flowchart TD
  patients["Patients · logged into portal"] -->|"request study download"| lb[Load Balancer]
  lb --> web["Web Tier · a few servers, no file bytes pass through"]
  web -->|"check session"| sess[(Session Store)]
  web -->|"look up study record"| meta[(Study Metadata DB)]
  web -->|"signs a token: this one study, read only, expires in 15 min"| patients
  patients -->|"downloads straight from storage, no app hop"| store[("Study Storage (other region)")]
  web -.->|"no longer reads and streams the file"| store
  store -->|"download logged"| web

  classDef added stroke:#16a34a,stroke-width:3px;
  class web,patients,store added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "valet-key-3": `flowchart TD
  field["12,000 contractors · personal devices on LTE"] -->|"ask for permission to send one bundle"| lb[Load Balancer]
  lb --> api["Inspection API · a few instances, no bundle bytes pass through"]
  api -->|"authenticate contractor"| auth[(Auth Store)]
  api -->|"write bundle record"| db[(Inspection DB)]
  api -->|"signs a token: this one bundle key, write only, expires in 3 min · no long-lived credential on the device"| field
  field -->|"PUT 200 MB straight to storage over HTTPS"| store[(Object Storage)]
  api -.->|"no longer forwards every byte"| store
  store -->|"upload logged, bundle checked before use"| api

  classDef added stroke:#16a34a,stroke-width:3px;
  class api,field,store added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "valet-key-4": `flowchart TD
  nodes["Institution cluster nodes · untrusted machines"] -->|"ask for permission to read one result file"| api["Genomics API"]
  api -->|"check customer and purchase"| db[(Customer + Order DB)]
  api -->|"signs a token: only the files they paid for, read only, expires in 60 min"| nodes
  nodes -->|"reads 40 GB straight from storage over HTTPS"| store[(Result File Storage)]
  api -.->|"download proxy removed, no worker per transfer, no cross-region proxy bill"| proxy["Download Proxy"]
  store -->|"read logged"| api

  classDef added stroke:#16a34a,stroke-width:3px;
  class api,nodes,store added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class proxy removed;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "valet-key-5": `flowchart TD
  fleet["80,000 vehicles · physically accessible to owners"] -->|"ask for permission to send one clip"| lb[Load Balancer]
  lb --> ingest["Clip Permission Service · signs tokens only, no clip bytes pass through"]
  ingest -->|"check vehicle credential"| cred[(Device Credential Store)]
  ingest -->|"write clip record"| db[(Incident DB)]
  ingest -->|"signs a token: this one new clip key, write only, expires in 5 min · no permanent credential on the vehicle"| fleet
  fleet -->|"PUT 1.5 GB straight to storage, no extra hops"| store[(Clip Storage)]
  ingest -.->|"upload server fleet removed"| store
  store -->|"write logged, existing clips cannot be overwritten"| ingest

  classDef added stroke:#16a34a,stroke-width:3px;
  class ingest,fleet,store added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "api-gateway-1": `flowchart LR
  ios["iOS app · one address"] --> gw
  android["Android app · one address"] --> gw
  gw["API gateway · routing table maps /payments, /wallet, /settlement to the right service · checks the token once · asks the service registry for current addresses"] --> rides
  ios -.->|"apps no longer hold 17 hostnames"| rides
  gw --> wallet
  gw --> settle
  gw --> rest
  reg["Service registry · current address per service"] --> gw
  rides["Rides service · no token validation code"] --> ridesdb[(Rides DB)]
  wallet["Wallet service · split behind the gateway, no app release"] --> paydb[(Payments DB)]
  settle["Settlement service · split behind the gateway, no app release"] --> paydb
  rest["14 other services · no token validation code"] --> otherdb[(Service DBs)]

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,ios,android,rides,wallet,settle,rest added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "api-gateway-2": `flowchart LR
  browser["Browser app · one hostname, one set of paths"] --> gw
  gw["API gateway · one TLS cert, one CORS list, one JWT check · expired token always returns 401"] --> catalog
  browser -.->|"the browser no longer holds 9 hostnames"| catalog
  gw --> search
  gw --> cart
  gw --> rest
  catalog["Catalog service · no CORS list, cert, or JWT check of its own"] --> cache[(Catalog Cache)]
  catalog --> catdb[(Catalog DB)]
  search["Search service · moved without touching the browser app"] --> idx[(Search Index)]
  cart["Cart service · no CORS list, cert, or JWT check of its own"] --> cartdb[(Cart DB)]
  rest["6 other services · no CORS list, cert, or JWT check of their own"] --> dbs[(Service DBs)]

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,browser,catalog,search,cart,rest added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "api-gateway-3": `flowchart LR
  vendors["40 clinic vendor systems<br/>one published entry point"] --> gw
  gw["API gateway · one auth handshake · rate limit applied in one place · routing table hides which service owns what"] --> appt["Appointments service"]
  vendors -.->|"vendors no longer hold 6 service addresses"| appt
  gw --> prov["Providers service"]
  gw --> rooms["Rooms service"]
  gw --> ins["Insurance check service"]
  gw --> rest["2 more internal services · ownership can move without emailing vendors"]
  appt --> db[("Scheduling DB")]
  prov --> db
  rooms --> db
  ins --> db
  rest --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,vendors added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "api-gateway-4": `flowchart LR
  game["Game client<br/>plain HTTP, no protocol adapters"] --> gw
  phone["Companion phone app<br/>plain HTTP, no protocol adapters"] --> gw
  gw["API gateway · speaks HTTP to clients · translates to gRPC, the custom TCP format, and SOAP · a wire format change stops here"] -->|gRPC| mm["Matchmaking<br/>gRPC only"]
  game -.->|"clients no longer speak gRPC, raw TCP, or SOAP"| mm
  gw -->|gRPC| inv["Inventory<br/>gRPC only"]
  gw -->|"custom binary over raw TCP"| pres["Presence<br/>custom binary protocol"]
  gw -->|SOAP| old["2 older services<br/>SOAP"]
  gw --> rest["7 other backend services"]
  mm --> db[("Game DB")]
  inv --> db
  pres --> db
  old --> db
  rest --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,game,phone added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "api-gateway-5": `flowchart TD
  web["Web app<br/>one address, no feature-to-URL map"] --> gw
  atm["ATM fleet software<br/>one address, no feature-to-URL map"] --> gw
  gw["API gateway · the only internet-facing entry point · access token checked once here · one request log format"] --> s1
  gw --> s2
  gw --> rest
  lb1["Public load balancer 1 · removed"] -.-> s1
  lb2["Public load balancer 2 · removed, along with the other 20"] -.-> s2
  s1["Service 1<br/>no token validation code, not reachable from the internet"] --> db[("Bank data stores")]
  s2["Service 2<br/>no token validation code, not reachable from the internet"] --> db
  rest["20 more services<br/>no token validation code, not reachable from the internet"] --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,web,atm,s1,s2,rest added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class lb1,lb2 removed;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "backends-for-frontends-1": `flowchart TD
  tv["Smart TV app"] --> tvbff["TV backend · returns the 8 fields the TV runtime can handle · TV team ships it"]
  ios["iOS app"] --> iosbff["iOS backend · its own page size · iOS team ships it"]
  web["Desktop browser app"] --> webbff["Web backend · all 60 fields plus editorial copy · web team ships it"]
  tvbff --> api["Titles API · no client specific query flags"]
  iosbff --> api
  webbff --> api
  api --> cache[("Catalog cache")]
  cache --> titles[("Titles DB")]
  webbff --> ed[("Editorial copy store")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class tvbff,iosbff,webbff,api added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "backends-for-frontends-2": `flowchart TD
  driver["Driver Android app<br/>rural cellular"] --> lb["Load balancer"]
  disp["Dispatcher web console"] --> lb
  lb --> driverbff["Driver backend · one active stop, tiny payload · driver team ships it"]
  lb --> dispbff["Dispatcher backend · 500 stops with full address history · dispatcher team ships it"]
  driverbff --> api["Stops API · one response shape per client, set by that client's team"]
  dispbff --> api
  api --> cache[("Route cache")]
  api --> stops[("Stops DB")]
  dispbff --> hist[("Address history store")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class driverbff,dispbff,api added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "backends-for-frontends-3": `flowchart TD
  mobile["Mobile shopping app<br/>Kotlin"] --> edge["Shared entry layer<br/>token check and rate limits stay here"]
  term["In-store associate terminal<br/>C#35;"] --> edge
  edge --> mobilebff["Mobile backend · Kotlin · mobile team ships on its own schedule"]
  edge --> termbff["Terminal backend · C#35; · terminal team ships on its own schedule"]
  mobilebff --> api["Product and pricing services · no client-type if-blocks, short test suite"]
  termbff --> api
  api --> cache[("Catalog cache")]
  api --> prod[("Product DB")]
  api --> price[("Pricing DB")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class mobilebff,termbff,api added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;`,

  "backends-for-frontends-4": `flowchart TD
  clin["Clinician web workstation"] --> lb["Load balancer"]
  pat["Patient phone app"] --> lb
  lb -.->|"no shared response object holding provider notes"| api["Shared API"]
  lb --> clinbff["Clinician backend · full chart history, 200 rows, lab values and provider notes"]
  lb --> patbff["Patient backend · next appointment and 5 recent results · its response type has no notes field at all"]
  clinbff --> charts[("Chart DB")]
  patbff --> charts
  clinbff --> labs[("Lab results DB")]
  patbff --> labs
  clinbff --> notes[("Provider notes store · only the clinician backend can read it")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class clinbff,patbff,notes added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class api removed;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "backends-for-frontends-5": `flowchart TD
  dash["Advertiser dashboard in browser"] --> edge["Shared front layer · login checks and request logging stay here"]
  tablet["Rep tablet app"] --> edge
  edge --> dashbff["Dashboard backend · 10,000 rows raw · dashboard team ships it"]
  edge --> tabletbff["Tablet backend · 20 rows by 6 columns, pre-rounded · tablet team ships it"]
  dashbff --> api["Reporting service · no per-client branching"]
  tabletbff --> api
  api --> cache[(Report cache)]
  api --> db[(Reporting DB)]

  classDef added stroke:#16a34a,stroke-width:3px;
  class dashbff,tabletbff,api added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;`,

  "gateway-aggregation-1": `flowchart LR
  app["Insurance mobile app · claim detail screen in one call, about 400 ms"] -->|"1 cellular round trip · 380 ms"| gw
  gw["Aggregation gateway · deployed next to the services · calls all 7 at once · own timeout per call · drops a missing part instead of a half-empty screen · passes a correlation ID"] --> claim["Claim service · under 30 ms"]
  app -.->|"no more 7 round trips from the phone"| claim
  gw --> policy["Policy service · under 30 ms"]
  gw --> adj["Adjuster service · under 30 ms"]
  gw --> photos["Photos service · under 30 ms"]
  gw --> pay["Payment status service · under 30 ms"]
  gw --> shop["Repair shop service · under 30 ms"]
  gw --> msg["Messages service · under 30 ms"]
  gw -->|"one merged JSON body"| app
  claim --> db[("Data center stores")]
  policy --> db
  adj --> db
  photos --> db
  pay --> db
  shop --> db
  msg --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,app added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "gateway-aggregation-2": `flowchart TD
  tablet["Field technician tablet · status page in one call, about 750 ms"] -->|"1 satellite round trip · 700 ms"| gw
  gw["Aggregation gateway · deployed next to the services · calls all 12 at once · own timeout per call · leaves out a panel that fails instead of failing the page"] --> hours["Engine hours service · 15 ms"]
  tablet -.->|"no more 12 satellite round trips"| hours
  gw --> faults["Fault code service · 15 ms"]
  gw --> fw["Firmware version service · 15 ms"]
  gw --> warranty["Warranty service · 15 ms"]
  gw --> parts["Parts service · 15 ms"]
  gw --> rest["7 more machine status services · 15 ms each"]
  gw -->|"one merged JSON body"| tablet
  hours --> db[("Equipment telemetry and reference stores")]
  faults --> db
  fw --> db
  warranty --> db
  parts --> db
  rest --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,tablet added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "gateway-aggregation-3": `flowchart TD
  phone["Order tracking screen · still refreshes every 5 s · 1 connection per poll instead of 5"] -->|"40,000 requests every 5 s"| gw
  gw["Aggregation gateway · calls all 5 at once · own timeout per call · promotions over its timeout is left out of the body"] --> order["Order service · under 20 ms"]
  phone -.->|"no more 5 connections per poll"| order
  gw --> courier["Courier location service · under 20 ms"]
  gw --> rest["Restaurant service · under 20 ms"]
  gw --> eta["ETA service · under 20 ms"]
  gw --> promo["Promotions service · under 20 ms"]
  gw -->|"one merged JSON body"| phone
  order --> db[("Order and courier stores")]
  courier --> db
  rest --> db
  eta --> db
  promo --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,phone added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "gateway-aggregation-4": `flowchart LR
  kiosk["Airport check-in kiosk · fields appear in about 300 ms"] -->|"1 round trip · 250 ms"| gw
  gw["Aggregation gateway · in the data center · calls all 9 at once instead of in sequence · own timeout per call · correlation ID on each call shows which one was slow"] --> res["Reservation service"]
  kiosk -.->|"no more 9 sequential round trips"| res
  gw --> pax["Passenger service"]
  gw --> seat["Seat map service"]
  gw --> bags["Bag rules service"]
  gw --> visa["Visa check service"]
  gw --> loyal["Loyalty service"]
  gw --> upg["Upgrade offer service"]
  gw --> token["Payment token service"]
  gw --> bp["Boarding pass eligibility service"]
  gw -->|"one merged response"| kiosk
  res --> db[("Colocated data center stores")]
  pax --> db
  seat --> db
  bags --> db
  visa --> db
  loyal --> db
  upg --> db
  token --> db
  bp --> db

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,kiosk added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "gateway-aggregation-5": `flowchart LR
  phone["Banking app home screen · one request, no blank tiles"] -->|"1 mobile round trip"| gw
  gw["Aggregation gateway · in the cluster · calls all 6 at once · rewards gets a 200 ms timeout and is left out when it is slow"] --> bal["Balance service · 10 to 25 ms"]
  phone -.->|"no more 6 round trips from the phone"| bal
  gw --> txn["Recent transaction service · 10 to 25 ms"]
  gw --> card["Card status service · 10 to 25 ms"]
  gw -->|"200 ms timeout"| rewards["Rewards points service · 10 to 25 ms"]
  gw --> alerts["Alert service · 10 to 25 ms"]
  gw --> xfer["Pending transfer service · 10 to 25 ms"]
  gw -->|"one merged JSON body"| phone
  bal --> cache[(Read cache)]
  txn --> cache
  card --> cache
  rewards --> cache
  alerts --> cache
  xfer --> cache
  cache --> core[("Core banking store")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class gw,phone added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "circuit-breaker-1": `flowchart TD
  shopper["Shoppers"] -->|"purchase"| lb["Load balancer"]
  lb --> checkout["Checkout service · web pool of 200 threads, free for other endpoints"]
  checkout -->|"every fraud call"| breaker["Fraud circuit breaker · closed, open, half-open · opens when failures pass the limit in a time window"]
  breaker -->|"closed: call goes through · 5 s timeout"| fraud["Fraud scoring vendor API"]
  breaker -.->|"open: low-risk default returned right away, no thread held · 30 s timer"| checkout
  breaker -.->|"half-open after timer: a few test calls, close if they succeed, open again if one fails"| fraud
  checkout -.->|"1,200 calls/s straight at a dead vendor"| fraud
  lb -->|"order history"| checkout
  lb -->|"address lookup"| checkout
  checkout --> orders[("Orders DB")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class breaker,checkout added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "circuit-breaker-2": `flowchart TD
  apps["Viewer apps"] -->|"open home screen"| home["Home screen API"]
  home -->|"rest of the page"| cache[("Page cache · healthy")]
  recs["Recommendations service · out of memory"] --> pods["Recommendations pods · restart with no traffic while the breaker is open"]
  recs --> model[("Recommendation model store")]
  home -->|"every recommendations call"| breaker["Recommendations circuit breaker · closed, open, half-open · stays open 60 s"]
  breaker -->|"closed: call goes through"| recs
  breaker -.->|"open: fail right away, no pool connection used"| generic[("Cached generic row list")]
  generic -.->|"served immediately"| home
  breaker -.->|"half-open after 60 s: a few test calls, close if they succeed"| recs
  home -.->|"8,000 direct calls/s · 3 s each to fail"| recs

  classDef added stroke:#16a34a,stroke-width:3px;
  class breaker,generic,pods added;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#dc2626,stroke-width:3px;`,

  "circuit-breaker-3": `flowchart TD
  meters["400,000 smart meters"] --> lb["Load balancer"]
  lb --> ingest["Ingest nodes · device-facing HTTP endpoint"]
  lb -.->|"health checks answered"| ingest
  ingest --> workers["Ingest worker pool · stays free during compaction"]
  tsdb[("Time series DB · compaction 10 to 30 min weekly")] --> dash["Dashboards and billing"]
  workers -->|"each write"| breaker["Write circuit breaker · closed, open, half-open · opens when write failures pass the limit · 30 s timer"]
  breaker -->|"closed: write with 10 s timeout"| tsdb
  breaker -.->|"open: skip the network, write to local disk right away"| spool[("Local disk spool")]
  breaker -.->|"half-open after timer: a few test writes, close if they succeed"| tsdb
  spool -.->|"replay after the breaker closes"| tsdb
  workers -.->|"doomed write, blocks 10 s"| tsdb

  classDef added stroke:#16a34a,stroke-width:3px;
  class breaker,spool,workers added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#dc2626,stroke-width:3px;`,

  "circuit-breaker-4": `flowchart TD
  app["Bank mobile app"] --> api["Mobile API"]
  api -->|"transfers"| gw["Mainframe gateway · 60 concurrent sessions"]
  api -->|"bill pay"| gw
  gw --> bal["Mainframe balance service · errors for 40 min nightly"]
  gw --> core["Mainframe transfer and bill pay programs"]
  api -->|"balance calls"| breaker["Balance circuit breaker · closed, open, half-open · 5 min timer"]
  breaker -->|"closed: call uses a session"| gw
  breaker -.->|"open: balance unavailable right away, no session used"| api
  breaker -.->|"half-open after timer: one test call, close if it succeeds"| gw
  api -.->|"doomed balance calls holding sessions"| gw

  classDef added stroke:#16a34a,stroke-width:3px;
  class breaker added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#dc2626,stroke-width:3px;`,

  "circuit-breaker-5": `flowchart TD
  pub["Publisher page"] -->|"ad request · must answer under 100 ms"| ads["Ad server · answers in time with bids from A and B"]
  ads -->|"parallel bid request"| exA["Exchange A · healthy"]
  ads -->|"parallel bid request"| exB["Exchange B · healthy"]
  ads --> floors[("Campaign and floor price cache")]
  ads -->|"Exchange C calls"| breaker["Circuit breaker, one per exchange, shown for C · opens when timeouts pass the limit · 60 s timer"]
  breaker -->|"closed: bid request"| exC["Exchange C · dark 5 to 15 min"]
  breaker -.->|"open: skip right away, 0 ms spent"| ads
  breaker -.->|"half-open after timer: a few test requests, close if they answer"| exC
  ads -.->|"30,000 calls/s each waiting 100 ms"| exC

  classDef added stroke:#16a34a,stroke-width:3px;
  class breaker,ads added;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#dc2626,stroke-width:3px;`,

  "retry-with-backoff-and-jitter-1": `flowchart TD
  phones["60,000 driver phones · location update every 4 s"] --> lb["Load balancer"]
  lb --> n1["Ingest API node 1 · restarting"]
  lb --> n2["Ingest API nodes 2 to N"]
  n2 --> stream[["Location stream"]]
  stream --> db[("Driver location store")]
  phones -->|"on connection error"| policy["Retry policy in the app · base 500 ms, cap 8 s, max 4 attempts"]
  policy -.->|"wait random 0 to min(8 s, 500 ms x 2 to the attempt) · retries spread over seconds"| lb
  phones -.->|"all retry after exactly 1 s"| lb

  classDef added stroke:#16a34a,stroke-width:3px;
  class policy added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "retry-with-backoff-and-jitter-2": `flowchart TD
  sched["Nightly scheduler"] --> job["Batch job · 2 million rows"]
  job --> workers["200 workers"]
  workers -->|"writes · unique key per row, safe to repeat"| kv[("Managed key-value store · 0.3 percent brief capacity errors")]
  kv --> dash["Store dashboard"]
  src[("Source data warehouse")] --> job
  workers -->|"on capacity error"| policy["Retry policy per worker · base 50 ms, cap 2 s, max 5 attempts"]
  policy -.->|"wait random 0 to min(cap, base x 2 to the attempt), then write again"| kv
  policy -.->|"out of attempts, record the row"| failed[("Failed row list")]
  workers -.->|"tight loop retries"| kv

  classDef added stroke:#16a34a,stroke-width:3px;
  class policy,failed added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#dc2626,stroke-width:3px;`,

  "retry-with-backoff-and-jitter-3": `flowchart TD
  merchants["8,000 merchant servers · payments SDK"] -->|"POST authorize · unique operation ID"| lb["Load balancer · 3 s network blip in one zone"]
  lb --> auth["Authorization endpoint · sized for 5,000 req/s"]
  auth -->|"dedupe by operation ID"| dedupe[("Operation ID store")]
  auth --> networks["Card networks"]
  merchants -->|"on failure"| policy["SDK retry policy · base 200 ms, cap 10 s, max 5 attempts"]
  policy -.->|"wait random 0 to min(cap, base x 2 to the attempt), resend same operation ID"| lb
  merchants -.->|"instant re-send, then again after 100 ms"| lb

  classDef added stroke:#16a34a,stroke-width:3px;
  class policy added;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "retry-with-backoff-and-jitter-4": `flowchart TD
  players["250,000 game clients"] -->|"websocket"| gw["Websocket gateway · handshakes arrive spread out"]
  gw --> mm["Matchmaking service · 2 s deploy drops all sockets"]
  gw -.->|"rejects handshakes over capacity"| players
  mm --> pool[("Player queue store")]
  players -->|"on socket close or rejection"| policy["Reconnect policy in the client · base 1 s, cap 30 s, max 10 attempts"]
  policy -.->|"wait random 0 to min(cap, base x 2 to the attempt), longer after each rejection"| gw
  policy -.->|"out of attempts"| button["Reconnect button in the client"]
  players -.->|"instant reconnect in lockstep"| gw

  classDef added stroke:#16a34a,stroke-width:3px;
  class policy,button,gw added;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "retry-with-backoff-and-jitter-5": `flowchart TD
  upper["Calling layer · no retries, reports failed records"] -->|"sync batch"| sync["Sync service · 50 parallel readers"]
  sync -->|"reads · about 400 requests normally"| fhir["Vendor FHIR API · 503 on 1 in 200 calls"]
  sync --> records[("Hospital records DB")]
  sync -->|"on 503"| policy["Reader retry policy · the only layer that retries · base 200 ms, cap 5 s, max 4 attempts"]
  policy -.->|"wait random 0 to min(cap, base x 2 to the attempt)"| fhir
  policy -.->|"out of attempts, mark record for the next sync"| failed[("Failed read list")]
  sync -.->|"10 instant retries per 503"| fhir
  upper -.->|"whole batch retried 3 times"| sync

  classDef added stroke:#16a34a,stroke-width:3px;
  class policy,failed,upper added;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "bulkhead-1": `flowchart TD
  shopper["Shoppers"] -->|"purchase, including gift cards"| web["Checkout page"]
  web --> checkout["Checkout service · gift card purchases never wait on tax"]
  checkout -.->|"no single shared pool"| pool["One shared pool · 200 worker threads"]
  checkout -->|"fraud calls only"| fpool["Fraud pool · 70 threads"]
  checkout -->|"tax calls only"| tpool["Tax pool · 70 threads · when full, new tax calls fail right away"]
  checkout -->|"address calls only"| apool["Address pool · 60 threads"]
  fpool --> fraud["Fraud scoring vendor"]
  tpool --> tax["Sales tax vendor · 90 ms average slowed to 9 s, no errors"]
  apool --> addr["Address cleanup vendor"]
  checkout --> orders[("Orders DB")]
  checkout --> payments["Payment processor"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class fpool,tpool,apool added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class pool removed;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "bulkhead-2": `flowchart TD
  clin["Clinicians · chart lookups need under 400 ms"] --> ehr["Records app"]
  ehr -->|"chart lookups only"| cpool["Chart pool · 45 connections · export can never take these"]
  export["Research bulk export · moved to 7 am by mistake"] -->|"export only"| epool["Export pool · 15 connections · export waits here when full"]
  ehr -.->|"no single shared pool"| pool["One connection pool · 60 connections"]
  export -.-> pool
  cpool --> db[("Records DB · CPU headroom the whole time")]
  epool --> db
  research["Research team"] --> export
  ehr --> audit[("Audit log")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class cpool,epool added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class pool removed;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "bulkhead-3": `flowchart TD
  exchange["Ad exchanges"] -->|"bid callback · must answer in 80 ms"| lb["Load balancer"]
  adv["Advertisers"] -->|"14-month report across 400 campaigns"| lb
  lb -->|"bid callbacks only"| bid["Bidding container · own handler pool · own memory and CPU cap"]
  lb -->|"report queries only"| rep["Reporting container · own handler pool · own memory and CPU cap · a heavy report fills only this"]
  lb -.->|"no single shared process"| proc["One server process · 64 request handlers · one 8 GB heap"]
  bid -->|"bid lookups"| budget[("Campaign budget cache")]
  rep -->|"scans months of data"| warehouse[("Reporting data store")]
  bid -->|"answers inside 80 ms"| exchange

  classDef added stroke:#16a34a,stroke-width:3px;
  class bid,rep added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class proc removed;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "bulkhead-4": `flowchart TD
  biz["Business customers · statements promised within 5 s by contract"] --> api["Statement generation service"]
  retail["Retail customers · 95 percent of volume · no delivery promise"] --> api
  api -->|"business job"| bizq[["Business job queue"]]
  api -->|"retail job"| retq[["Retail job queue"]]
  api -.->|"no single shared queue of in-flight jobs"| queue[["One shared queue"]]
  bizq --> bizpool["Business fleet · 10 workers · takes business jobs only, free within 5 s"]
  retq --> retpool["Retail fleet · 30 workers · retail volume can only fill this fleet"]
  bizpool --> acct[(Account and transaction DB)]
  retpool --> acct
  bizpool --> files[(Generated statement store)]
  retpool --> files

  classDef added stroke:#16a34a,stroke-width:3px;
  class bizq,retq,bizpool,retpool added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class queue removed;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "cache-aside-1": `flowchart TD
  shoppers["Shoppers · 12,000 page views/s, 92% land on the same 4,000 SKUs"] --> lb["Load Balancer"]
  lb --> web["Product Page Service"]
  web -->|"on a miss only, read row by SKU"| db[("Product DB · CPU freed from repeated lookups")]
  admin["Admin Tool"] -->|"1. update the price row first"| db
  web --> search["Search Service"]
  web -.-> cdn["CDN · product images"]
  web -->|"GET product:SKU"| cache[("Product Cache · entries expire after a few minutes")]
  web -->|"on a miss, write the row with an expiration"| cache
  admin -->|"2. delete product:SKU so the next read gets the new price"| cache

  classDef added stroke:#16a34a,stroke-width:3px;
  class cache,db added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "cache-aside-2": `flowchart TD
  clients["Game clients · 10 players per match"] --> match["Match Service"]
  match -->|"on a miss only, read row by item id"| db[("Item Definitions DB · bill no longer grows with match volume")]
  designers["Designer Tool"] -->|"1. update the row first"| db
  match --> mm["Matchmaking Service"]
  match --> history[("Match History DB")]
  match -->|"GET item:id"| cache[("Item Cache · whole table fits in a few hundred MB")]
  match -->|"on a miss, write the row with an expiration"| cache
  designers -->|"2. delete item:id so the old definition stops being served"| cache

  classDef added stroke:#16a34a,stroke-width:3px;
  class cache,db added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;`,

  "cache-aside-3": `flowchart TD
  exchange["Ad exchange · 200,000 bid requests/s"] -->|"80 ms total to respond"| bid["Bidding Service"]
  bid -->|"on a miss only, read targeting by campaign id"| db[("Campaign DB · 3,500 active campaigns")]
  advertisers["Advertiser Console"] -->|"a few hundred edits/hour"| db
  bid --> model["Bid Pricing Model"]
  bid -.->|"no more timeouts from 40 ms lookups"| exchange
  bid --> events[["Bid Events Stream"]]
  bid -->|"GET campaign:id · under 1 ms"| cache[("Targeting Cache · entries expire after 60 s")]
  bid -->|"on a miss, write the record with a 60 s expiration"| cache
  advertisers -->|"after updating the row, delete campaign:id"| cache

  classDef added stroke:#16a34a,stroke-width:3px;
  class cache added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "cache-aside-4": `flowchart TD
  desk["Front desk staff · repeat checks answered in milliseconds"] --> billing["Clinic Billing System"]
  billing -->|"on a miss only · about 14,000 paid calls/day"| payer["Payer Eligibility API · external"]
  billing --> db[("Billing DB")]
  billing --> sched["Scheduling Service"]
  billing -->|"GET eligibility:patient:payer"| cache[("Eligibility Cache · entries expire at the end of the day")]
  billing -->|"on a miss, save the answer until the end of the day"| cache

  classDef added stroke:#16a34a,stroke-width:3px;
  class cache,desk added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;`,

  "cache-aside-5": `flowchart TD
  apps["Streaming apps · 30,000 reads/s, 5% of titles get 80% of reads"] --> gw["API Gateway"]
  gw --> catalog["Catalog Service"]
  catalog -->|"on a miss only, look up by title id"| db[("Catalog DB · connections freed")]
  db -.-> replicas[("Read Replicas · already maxed")]
  content["Content Team Tool"] -->|"artwork and description updates"| db
  catalog --> rec["Recommendations Service"]
  catalog -->|"GET title:id"| cache[("Title Cache · entries expire after 2 min")]
  catalog -->|"on a miss, write the row with an expiration"| cache
  content -->|"after updating the row, delete title:id"| cache

  classDef added stroke:#16a34a,stroke-width:3px;
  class cache,db added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "sharding-1": `flowchart TD
  merchants["Merchant card terminals"] --> auth["Authorization Service"]
  auth -->|"38,000 inserts/s at peak · nearly every query scoped to one merchant"| pg[("Single PostgreSQL primary · retired")]
  pg -.-> replica[("Read Replicas · no help for writes or disk")]
  auth --> fraud["Fraud Scoring"]
  dashboard["Merchant Dashboard"] --> pg
  auth -->|"merchant id"| router["Shard Router · merchant id to shard lookup"]
  dashboard -->|"merchant id"| router
  router --> s1[("Shard 1 · PostgreSQL")]
  router --> s2[("Shard 2 · PostgreSQL")]
  router -->|"add shards as volume grows"| s3[("Shard N · new machine")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class router,s1,s2,s3 added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class pg,replica removed;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "sharding-2": `flowchart TD
  devices["2.4 million devices"] -->|"60,000 inserts/s"| ingest["Ingest Service"]
  ingest --> tsdb[("Single time-series DB server · retired")]
  dash["Plant Dashboards · one device's readings per query"] --> tsdb
  ingest --> alerts["Alerting Service"]
  ingest -.-> archive[("Cold Archive · last year's readings")]
  ingest -->|"device id"| router["Shard Router · hash of device id"]
  dash -->|"device id"| router
  router --> s1[("Shard 1 · time-series DB")]
  router --> s2[("Shard 2 · time-series DB")]
  router -->|"add shards as devices are added"| s3[("Shard N · new server")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class router,s1,s2,s3 added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class tsdb removed;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "sharding-3": `flowchart TD
  users["HR users at 14,000 companies"] --> app["HR App"]
  imports["Bulk imports from 3 enterprise customers"] --> app
  app -->|"every query carries a company id"| mysql[("Shared shard · the small companies")]
  mysql -->|"backup per shard, a fraction of the 8 TB"| backup[("Backup Store")]
  app --> login["Login Service"]
  app -->|"company id"| shardmap["Shard Map · company id to server lookup"]
  shardmap -->|"small companies"| mysql
  shardmap --> e1[("Enterprise A shard · own server")]
  shardmap --> e2[("Enterprise B shard · own server")]
  shardmap -->|"move a big tenant by changing its map entry"| e3[("Enterprise C shard · can move to new hardware")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class shardmap,e1,e2,e3,mysql added;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "sharding-4": `flowchart TD
  players["90 million player accounts"] --> gs["Game Servers"]
  gs -->|"inventory read or write for one player · p99 write 340 ms"| docdb[("Single document DB cluster · retired")]
  docdb -.-> secondary[("Secondary · failover")]
  gs --> match["Matchmaking Service"]
  shop["In-game Store"] --> gs
  gs -->|"player id"| router["Shard Router · hash of player id"]
  router --> s1[("Shard 1 · primary and secondary")]
  router --> s2[("Shard 2 · primary and secondary")]
  router -->|"add shards before storage doubles"| s3[("Shard N · new servers")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class router,s1,s2,s3 added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class docdb,secondary removed;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "sharding-5": `flowchart TD
  scanners["Parcel scanners"] -->|"scan events"| ingest["Tracking Ingest Service"]
  ingest --> db[("Single tracking DB · retired")]
  web["Customer tracking page · one tracking number at a time"] --> api["Tracking API"]
  api --> db
  db -.->|"nightly vacuum runs into the morning peak"| vacuum["Vacuum Job"]
  api --> notify["Notification Service"]
  ingest -->|"tracking number"| router["Shard Router · tracking number to logical shard, logical shard to server"]
  api -->|"tracking number"| router
  router --> s1[("Server 1 · logical shards 0 to 511")]
  router --> s2[("Server 2 · logical shards 512 to 1023")]
  router -->|"move a logical shard by updating the map, queries unchanged"| s3[("New Server · takes logical shards later")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class router,s1,s2,s3 added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class db,vacuum removed;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "materialized-view-1": `flowchart TD
  nurses["Charge nurses · about 200 opens/hour"] --> dash["Ward Dashboard"]
  dash -->|"join 7 tables, group by over 40 million rows · 38 s"| clin[("Clinical DB · normalized tables, still the record of truth")]
  ehr["Clinical system"] -->|"writes admissions, transfers, discharges"| clin
  dash --> sso["Hospital Sign-in"]
  dash -->|"read one row per ward · milliseconds"| view[("Ward Stats table · occupancy, length of stay, readmissions for 90 days")]
  refresh["Refresh Job · every 15 min"] -->|"runs the 7-table query once"| clin
  refresh -->|"rewrites rows, can be rebuilt from clinical tables any time"| view

  classDef added stroke:#16a34a,stroke-width:3px;
  class view,refresh added;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;`,

  "materialized-view-2": `flowchart TD
  advertisers["Advertisers · reload the page constantly"] --> portal["Advertiser Portal"]
  portal -->|"scan 900 million rows per advertiser · 22 s"| imp[("Impression table · raw rows audited by finance")]
  portal -->|"join"| rates[("Campaigns and Billing Rates DB")]
  adservers["Ad Servers"] -->|"append impressions"| imp
  finance["Finance Audit"] --> imp
  portal -->|"read by advertiser id · under 1 s"| view[("Campaign Daily Performance table · spend, impressions, clicks, cost per click")]
  refresh["Refresh Job · every 10 min"] -->|"reads new impressions"| imp
  refresh -->|"joins"| rates
  refresh -->|"writes one row per campaign per day"| view

  classDef added stroke:#16a34a,stroke-width:3px;
  class view,refresh added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "materialized-view-3": `flowchart TD
  creators["Creators · load the page many times a day"] --> page["Channel Analytics Page"]
  page -->|"join and aggregate 28 days · 45 s, page times out"| events[("View Events table")]
  page --> subs[("Subscriptions table")]
  page --> meta[("Video Metadata table")]
  player["Video Player"] -->|"view events"| events
  page -.-> cdn["CDN · thumbnails"]
  page -->|"read one row per channel · no timeout"| view[("Channel Summary table · watch minutes, subscribers, top 10 videos")]
  refresh["Refresh Job · hourly"] --> events
  refresh --> subs
  refresh --> meta
  refresh -->|"writes 28-day figures per channel"| view

  classDef added stroke:#16a34a,stroke-width:3px;
  class view,refresh added;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "materialized-view-4": `flowchart TD
  managers["Relationship managers · about 3,000 overviews/day"] --> overview["Customer Overview App"]
  overview -->|"query 5 tables in different schemas · 14 s"| core[("Core Banking DB · checking, savings, loans, cards")]
  corebank["Core banking system"] -->|"owns and writes the source tables"| core
  overview --> kyc["KYC Service"]
  overview -->|"read one row per customer"| view[("Customer Exposure table · balances, total exposure, 12-month average")]
  nightly["Overnight Rebuild Job"] -->|"reads the core tables"| core
  nightly -->|"drops and rebuilds every row"| view

  classDef added stroke:#16a34a,stroke-width:3px;
  class view,nightly added;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;`,

  "materialized-view-5": `flowchart TD
  shoppers["Shoppers · 4,000 category page hits/min"] --> lb["Load Balancer"]
  lb --> browse["Category Browse Service"]
  browse -->|"join 30 million rows · 18 s per category"| products[("Products DB")]
  browse --> prices[("Prices DB")]
  browse --> stock[("Warehouse Stock DB · changes constantly")]
  wms["Warehouse System"] -->|"stock updates"| stock
  browse -.-> images["Image CDN"]
  browse -->|"read one row per category"| view[("Category Summary table · 8,000 rows · item count, lowest price, in-stock count")]
  refresh["Refresh Job · every 5 min"] --> products
  refresh --> prices
  refresh --> stock
  refresh -->|"rewrites category rows"| view

  classDef added stroke:#16a34a,stroke-width:3px;
  class view,refresh added;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "index-table-1": `flowchart TD
  agents["Support agents"] -->|"all orders for a customer email"| support["Support tool"]
  customers["Customers"] -->|"900 orders/s"| orders["Order service"]
  orders -->|"put by order ID"| kv[("Order store · key is order ID · 400 million items · no other query")]
  support -.->|"no more full scans"| kv
  orders --> pay["Payment service"]
  kv -.-> cache[("Order status cache")]
  orders -->|"order written event"| queue[["Index update queue"]]
  queue --> worker["Index worker · keeps up with 900 writes/s · 1 to 2 s behind"]
  worker -->|"put email plus order ID"| idx[("Email index table · key is email plus order ID")]
  support -->|"read by email, gets order IDs"| idx
  support -->|"read each order by ID"| kv

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,worker,idx added;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "index-table-2": `flowchart TD
  riders["Rider app"] --> api["Trip API"]
  api -->|"find nearby driver"| match["Matching service"]
  match -->|"read by driver ID"| drivers[("Driver store · partitioned by hash of driver ID · 64 partitions · no secondary index")]
  onboard["Driver onboarding"] -->|"write driver record"| drivers
  compliance["Compliance tool"] -.->|"no more fan-out to 64 partitions"| drivers
  match --> geo[("Driver location cache")]
  onboard -->|"driver changed event"| queue[["Driver change queue"]]
  queue --> worker["Index worker"]
  worker -->|"put license state plus driver ID"| idx[("License state index table · key is state plus driver ID")]
  compliance -->|"read one key range · answers in seconds"| idx
  compliance -->|"read matching drivers by ID"| drivers

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,worker,idx added;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "index-table-3": `flowchart TD
  listeners["Listener app"] --> api["Catalog API"]
  api -->|"read album by album ID"| store[("Catalog store · wide-column · key is album ID · 120 million track rows")]
  api -.->|"no more scans of 120 million rows"| store
  labels["Label ingest job"] -->|"catalog changes a few times a day"| store
  api --> art["Cover art CDN"]
  api --> plays[("Play count store")]
  labels -->|"after each catalog change"| job["Index builder job · some lag is fine"]
  job -->|"put performer plus track ID, with track title and album ID"| idx[("Performer index table · key is performer plus track ID")]
  api -->|"tracks featuring a performer · 5,000/min · one key range read"| idx

  classDef added stroke:#16a34a,stroke-width:3px;
  class job,idx added;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;`,

  "index-table-4": `flowchart TD
  billing["Billing staff"] -->|"has insurance member number"| billapp["Billing app"]
  clinic["Clinic staff"] --> ehr["Records service"]
  ehr -->|"read and write by patient ID"| docs[("Patient document store · key is patient ID · 12 million documents · no secondary index")]
  billapp -.->|"no more scans"| docs
  billapp --> claims[("Claims DB")]
  ehr --> audit[("Access audit log")]
  ehr -->|"patient saved event"| queue[["Patient change queue"]]
  queue --> worker["Index worker · new patients findable a few seconds later"]
  worker -->|"put member number to patient ID"| idx[("Member number index table · key is member number · one row each")]
  billapp -->|"look up member number · answers right away"| idx
  billapp -->|"read patient by patient ID"| docs

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,worker,idx added;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "index-table-5": `flowchart TD
  staff["Floor staff handheld scanner"] -->|"scan pallet barcode"| inv["Inventory service"]
  inv -.->|"no more walking every item record"| items[("Item store · key is SKU · no other query")]
  erp["Purchasing system"] -->|"item changes about twice a day"| items
  inv --> locs[("Bin location DB")]
  inv --> picks["Pick list service"]
  erp -->|"change notice"| job["Index builder job · some lag is fine"]
  job -->|"reads changed items"| items
  job -->|"put barcode to SKU · 11 million rows"| idx[("Pallet barcode index table · key is barcode")]
  inv -->|"barcode to SKU in one read"| idx
  inv -->|"read item by SKU"| items

  classDef added stroke:#16a34a,stroke-width:3px;
  class job,idx added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;`,

  "cqrs-1": `flowchart TD
  traders["Trader app"] -->|"place order · 400 writes/s"| oms["Order command side · rules classes only, display fields gone"]
  blotter["Blotter screens"] -.->|"no more reads through the rules classes"| oms
  oms --> db[("Orders DB · write shape only")]
  mkt["Market data feed"] -->|"prices"| oms
  oms -->|"route order"| exch["Exchange gateway"]
  oms -->|"publish order placed, filled, cancelled"| bus[["Order event stream"]]
  bus --> proj["Blotter projector · builds one table per screen"]
  proj --> readdb[("Blotter read store · denormalized per screen · a few seconds behind")]
  blotter -->|"60,000 reads/s · one simple select"| query["Blotter query service"]
  query --> readdb

  classDef added stroke:#16a34a,stroke-width:3px;
  class oms,db,bus,proj,readdb,query added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;`,

  "cqrs-2": `flowchart TD
  adjusters["Adjusters"] -->|"claim updates · 30/s"| claims["Adjudication side · rules objects only · scales for 30 updates/s"]
  customers["Customer status page"] -.->|"no more full object graph loads"| claims
  claims -->|"loads full object graph for adjudication only"| db[("Claims DB · indexes for adjudication")]
  claims --> docs[("Claim documents store")]
  claims -->|"approved payout"| pay["Payments system"]
  claims -->|"publish claim stage changed"| bus[["Claim event stream"]]
  bus --> proj["Status projector"]
  proj -->|"claim number, stage, expected payout"| statusdb[("Status read store · own indexes")]
  customers -->|"12,000 views/s · one small row"| statusapi["Status query API · scales on its own"]
  statusapi --> statusdb

  classDef added stroke:#16a34a,stroke-width:3px;
  class claims,db,bus,proj,statusdb,statusapi added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;`,

  "cqrs-3": `flowchart TD
  guests["Guest web and app"] -->|"book · 200/s"| svc["Booking command model · booking rules only, no display fields"]
  guests -.->|"reads no longer go through the booking model"| svc
  svc --> db[("Reservations DB")]
  svc -->|"rates"| rates[("Rate plan cache")]
  svc -->|"confirmation email"| mail["Email service"]
  svc -->|"publish booking made, changed, cancelled"| bus[["Booking event stream"]]
  bus --> proj["Read model projector · a couple of seconds behind"]
  proj --> readdb[("Read store tuned for availability and reservation lists")]
  guests -->|"80,000 reads/s"| query["Search and list query service"]
  query --> readdb

  classDef added stroke:#16a34a,stroke-width:3px;
  class svc,bus,proj,readdb,query added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;`,

  "cqrs-4": `flowchart TD
  scanners["Movement scanners"] -->|"stock movements · 150/s"| wms["Movement command side · allocation and lot tracking rules only"]
  dash["Picker dashboards"] -.->|"dashboard changes no longer touch movement entities"| wms
  wms --> db[("Movement DB · shaped for the rules")]
  wms -->|"shipment ready"| carrier["Carrier integration"]
  erp["ERP"] -->|"purchase orders"| wms
  wms -->|"publish stock moved events"| bus[["Stock movement events"]]
  bus --> proj["Dashboard projector · owns the 40 display fields"]
  proj --> dashdb[("Dashboard read DB · shaped per dashboard")]
  dash -->|"25,000 reads/s"| query["Dashboard query service"]
  query --> dashdb

  classDef added stroke:#16a34a,stroke-width:3px;
  class wms,db,bus,proj,dashdb,query added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;`,

  "cqrs-5": `flowchart TD
  stores["Retail stores and call center"] -->|"activate service"| prov["Activation command side · SIM, plan, network rules only"]
  portal["Customer portal · 200 times activation traffic"] -.->|"no longer loads activation objects"| prov
  prov --> db[("Subscriber DB · sized for activation")]
  prov -->|"activate"| net["Network provisioning system"]
  prov --> billing["Billing system"]
  dev["Portal developers"] -.->|"no longer edit the activation rules class"| prov
  prov -->|"publish activation and plan change events"| bus[["Subscriber event stream"]]
  bus --> proj["Portal projector · a few seconds behind"]
  proj --> portaldb[("Portal read store · a few fields · sized for portal traffic")]
  portal -->|"reads"| query["Portal query service"]
  query --> portaldb
  dev -->|"add portal fields here"| proj

  classDef added stroke:#16a34a,stroke-width:3px;
  class prov,bus,proj,portaldb,query added;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "event-sourcing-1": `flowchart TD
  app["Mobile banking app"] -->|"deposits and transfers"| ledger["Ledger service"]
  fees["Fee batch job"] -->|"monthly fees"| ledger
  ledger -.->|"no more in-place UPDATE"| accts[("Balance view · rebuilt from the event log")]
  accts -.->|"backup at midnight"| backup[("Nightly backup")]
  support["Support team · balance at 2:14pm three months ago?"] -.->|"no longer guesses from midnight copies"| backup
  ledger --> fraud["Fraud scoring"]
  ledger -->|"append one event per deposit, fee, transfer"| events[("Account event log · append only, timestamped, in order")]
  events -->|"apply events in order"| accts
  support -->|"replay one account up to 2:14pm"| replay["Replay tool · balance at any past minute"]
  replay -->|"reads events in order"| events
  events -.->|"daily snapshot per account"| snaps[("Balance snapshots · replay starts here")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class accts,events,replay,snaps added;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "event-sourcing-2": `flowchart TD
  doctor["Doctors · change dose"] --> ord["Medication ordering module"]
  pharm["Pharmacists · adjust frequency"] --> ord
  nurse["Nurses · mark hold"] --> ord
  ord -.->|"no more in-place UPDATE"| rx[("Prescription view · rebuilt from the event log")]
  rx -.->|"3 column copy removed"| shadow[("Shadow history table")]
  ord --> mar["Medication administration record"]
  auditors["Auditors · dose at 3:00pm, who changed it in the 20 min before?"] -.->|"no longer used"| shadow
  ord -->|"append event · DoseChanged, FrequencyAdjusted, HoldPlaced · all 11 columns, user, time"| events[("Prescription event log · append only")]
  events -->|"apply events in order"| rx
  auditors -->|"replay to 3:00pm, list events from 2:40pm"| replay["Replay tool · state at any past minute and who changed it"]
  replay -->|"reads events in order"| events

  classDef added stroke:#16a34a,stroke-width:3px;
  class rx,events,replay added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class shadow removed;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "event-sourcing-3": `flowchart TD
  players["900,000 daily players"] --> gs["Game servers"]
  gs -->|"pickups, trades, crafts"| inv["Inventory service · craft ran twice for about 4,000 accounts"]
  inv -.->|"no more in-place UPDATE"| items[("Item view · rebuilt from the event log")]
  gs --> match["Matchmaking service"]
  team["Inventory team · finds the affected accounts"] -.->|"no longer reads final quantities"| items
  staging["Staging environment · replays one player exactly"] -.->|"no longer reads final quantities"| items
  inv -->|"append event · ItemPickedUp, ItemTraded, ItemCrafted"| events[("Player event log · append only, per account")]
  events -->|"apply events in order"| items
  team -->|"find accounts with the same craft event twice"| events
  staging -->|"replay one player's pickups, trades, crafts in order"| events
  restore["Restore job · replays each affected account up to the bad release"] -->|"append correcting events"| events

  classDef added stroke:#16a34a,stroke-width:3px;
  class items,team,staging,events,restore added;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "event-sourcing-4": `flowchart TD
  adjusters["Adjusters · see each status move and when"] --> app["Claims platform"]
  app -.->|"no more in-place UPDATE"| claims[("Claim view · rebuilt from the event log")]
  night["Nightly update job"] -.->|"no more overwrites"| claims
  claims --> pay["Payments system"]
  legal["Legal team · recompute 18 months of payouts under a corrected rule"] -.->|"no longer limited to final numbers"| claims
  app --> docs[("Photo and document store")]
  app -->|"append event · Submitted, Assigned, Estimated, Approved, Paid, with time"| events[("Claim event log · append only")]
  night -->|"append PayoutCalculated events"| events
  events -->|"apply events in order"| claims
  adjusters -->|"list one claim's events with times"| events
  legal -->|"replay 18 months with the corrected rule"| replay["Replay job · builds new payout figures"]
  replay -->|"reads events in order"| events

  classDef added stroke:#16a34a,stroke-width:3px;
  class adjusters,claims,events,replay added;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "event-sourcing-5": `flowchart TD
  sites["42 warehouse sites"] -->|"receipts, picks, cycle counts, damage write-offs"| stock["Stock service"]
  stock -.->|"no more in-place increments"| onhand[("on_hand view · rebuilt from the event log")]
  deploy["Bad deploy · double-decremented for 90 min"] -.-> stock
  onhand -.->|"no recount needed"| recount["Physical recount at 11 sites"]
  finance["Finance · on hand at midnight, each of the last 90 days?"] -.->|"no longer reads the live table"| onhand
  stock --> orders["Order routing service"]
  stock -->|"append event · Received, Picked, Counted, WrittenOff · ~3 million/day"| events[("Stock event log · append only")]
  events -->|"apply events in order"| onhand
  events -.->|"snapshot at midnight each day"| snaps[("Midnight snapshots · per SKU per site")]
  finance -->|"read any of the last 90 midnights"| snaps
  fix["Correction job · finds the doubled Picked events from the 90 min"] -->|"append reversing events, view rebuilds"| events

  classDef added stroke:#16a34a,stroke-width:3px;
  class onhand,events,snaps,fix added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class recount removed;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "database-per-service-1": `flowchart TD
  clients["Web and mobile clients"] --> gw["API gateway"]
  gw --> orders["Orders service"]
  gw --> cust["Customers service"]
  gw --> other["Four other services · billing, shipping, catalog, notifications"]
  orders -.->|"shared credentials"| pg[("One Postgres instance · every table, no owner")]
  cust -.->|"shared credentials"| pg
  other -.->|"no direct queries into other teams' tables"| pg
  release["Thursday night joint release"] -.->|"no shared release window"| pg
  orders -->|"own login · column rename touches only this team"| ordersdb[("Orders DB · orders service only")]
  cust -->|"own login · one update path"| custdb[("Customers DB · owned by customers team")]
  other -->|"own login each"| otherdb[("One database per service · four more")]
  other -->|"read orders through its API"| orders
  other -->|"read customers through its API"| cust

  classDef added stroke:#16a34a,stroke-width:3px;
  class ordersdb,custdb,otherdb added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class pg,release removed;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "database-per-service-2": `flowchart TD
  viewers["Viewers"] --> catalog["Catalog service"]
  catalog -.->|"eleven join tables retired"| sql[("Normalized catalog SQL tables")]
  recs["Recommendations service"] -.->|"no direct SQL joins"| sql
  search["Search indexer"] -.->|"no direct SQL joins"| sql
  billing["Billing entitlement service"] -.->|"no direct SQL joins"| sql
  catalog -->|"storage choice made by catalog team alone"| doc[("Catalog document store · catalog service only")]
  recs -->|"catalog API"| catalog
  search -->|"catalog API"| catalog
  billing -->|"catalog API"| catalog

  classDef added stroke:#16a34a,stroke-width:3px;
  class doc added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class sql removed;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "database-per-service-3": `flowchart TD
  driverapp["Driver app"] --> dsvc["Driver service · validation rules"]
  riderapp["Rider app"] --> psvc["Pricing service"]
  dsvc -->|"only login with write rights"| table[("Drivers DB · driver service only")]
  psvc -.->|"no direct writes"| table
  psvc --> surge[("Surge pricing cache")]
  dsvc --> docs[("Driver documents store")]
  psvc -->|"change status through the driver API, validated"| dsvc
  dsvc -->|"records the calling service for each status write"| audit[("Driver change log")]

  classDef added stroke:#16a34a,stroke-width:3px;
  class table,audit added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "database-per-service-4": `flowchart TD
  users["HR customers"] --> lb["Load balancer"]
  lb --> login["Login service"]
  lb --> payroll["Payroll service"]
  lb --> others["Six other services"]
  reporting["Reporting service · opened 400 connections"] -.->|"no shared user"| mysql[("One shared MySQL server · one connection limit for all")]
  login -.->|"no shared connection limit"| mysql
  payroll -.->|"no shared lock"| mysql
  others -.->|"no shared user"| mysql
  lb --> reporting
  login -->|"own user and connection limit"| logindb[("Login DB")]
  payroll -->|"own user · 4 min lock hits only payroll"| payrolldb[("Payroll DB")]
  reporting -->|"own user · 400 connections hit only its own limit"| reportdb[("Reporting read copy · fed by the services")]
  others -->|"own user each, rights on own tables only"| otherdbs[("One database per service · six more")]
  logindb -->|"copy changes"| reportdb
  payrolldb -->|"copy changes"| reportdb
  otherdbs -->|"copy changes"| reportdb

  classDef added stroke:#16a34a,stroke-width:3px;
  class logindb,payrolldb,reportdb,otherdbs added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class mysql removed;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "database-per-service-5": `flowchart TD
  advertisers["Advertisers"] --> campaign["Campaign service"]
  campaign -.->|"no writes into other teams' tables"| db[("Shared ad database · campaign, targeting, billing tables")]
  targeting["Targeting service · adds a required column"] -.->|"no shared schema"| db
  billing["Billing service"] -.->|"no SELECT star joins across teams"| db
  bidder["Ad exchange bidder"] --> targeting
  billing --> invoices[("Invoice PDF store")]
  campaign -->|"own login"| campdb[("Campaign DB")]
  targeting -->|"own login · new column breaks nobody"| targdb[("Targeting DB")]
  billing -->|"own login"| billdb[("Billing DB")]
  campaign -->|"targeting API for audience rules"| targeting
  billing -->|"campaign API"| campaign
  billing -->|"targeting API"| targeting

  classDef added stroke:#16a34a,stroke-width:3px;
  class campdb,targdb,billdb added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class db removed;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "change-data-capture-1": `flowchart TD
  shoppers["Shoppers"] --> store["Storefront"]
  store --> search[("Search index")]
  store --> pickup["Store-pickup availability page"]
  vendor["Vendor inventory app on Oracle · unchanged"] -->|"inserts, updates, deletes"| oracle[("Oracle inventory DB")]
  oracle -.->|"no nightly CSV export"| csv["Nightly CSV job"]
  csv -.-> search
  csv -.-> pickup
  poll["last_modified polling job"] -.->|"no polling queries"| oracle
  store --> cache[("Product image cache")]
  oracle -->|"reads the redo log · no extra queries on the vendor app"| cdc["Log reader · captures every insert, update, and delete"]
  cdc --> topic[["Inventory change stream"]]
  topic -->|"within a few seconds"| search
  topic -->|"within a few seconds, deletes included"| pickup

  classDef added stroke:#16a34a,stroke-width:3px;
  class cdc,topic added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class csv,poll removed;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "change-data-capture-2": `flowchart TD
  staff["Ward staff"] -->|"admissions, discharges, transfers"| emr["Clinical records product · unchanged, no extra work"]
  emr --> sql[("SQL Server patient stay table")]
  reload["Full reload job"] -.->|"no more full table reads"| sql
  reload -.-> beds["Bed management dashboard · status within 5 s"]
  reload -.-> wh[("Analytics warehouse")]
  clinicians["Clinicians"] --> beds
  analysts["Analysts"] --> bi["BI reports"]
  bi --> wh
  sql -->|"reads the transaction log"| cdc["Log reader · captures each change"]
  cdc --> stream[["Patient stay change stream · keeps each consumer's position"]]
  stream -->|"within 5 s"| beds
  stream -->|"catches up after being offline"| wh

  classDef added stroke:#16a34a,stroke-width:3px;
  class cdc,stream,beds added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class reload removed;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "change-data-capture-3": `flowchart TD
  channels["Branches and online banking"] --> mf["Mainframe core account app · not one line changed"]
  mf --> db[("Core account DB")]
  db -.->|"no nightly batch file"| batch["Batch file transfer"]
  batch -.-> fraud["Fraud scoring service · sees changes within 2 s"]
  batch -.-> wh[("Data warehouse")]
  batch -.-> search["New search service"]
  cards["Card network"] --> fraud
  mfteam["Mainframe team"] -.->|"publishing calls quoted at 14 months, rejected"| mf
  db -->|"reads the transaction log"| cdc["Log reader · captures each change"]
  cdc --> stream[["Account change stream · balance and address changes"]]
  stream -->|"under 2 s"| fraud
  stream --> wh
  stream --> search

  classDef added stroke:#16a34a,stroke-width:3px;
  class cdc,stream,fraud added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class batch removed;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "change-data-capture-4": `flowchart TD
  planners["Planners"] --> erp["Licensed ERP suite · schema untouched, no triggers"]
  erp --> pg[("ERP Postgres · work orders, bills of material")]
  floor["Shop-floor display"] -.->|"no polling"| pg
  portal["Supplier portal"] -.->|"no polling"| pg
  ml["Demand model"] -.->|"no polling"| pg
  pg -.->|"no missed deleted rows"| floor
  portal --> suppliers["Suppliers"]
  ml --> fs[("Feature store")]
  pg -->|"reads the write-ahead log"| cdc["Log reader · captures each change"]
  cdc --> stream[["Work order change stream · includes deletes"]]
  stream -->|"quantity and due date changes"| floor
  stream --> portal
  stream --> ml

  classDef added stroke:#16a34a,stroke-width:3px;
  class cdc,stream added;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "change-data-capture-5": `flowchart TD
  advertisers["Advertisers"] --> crm["In-house CRM · unchanged"]
  crm --> db[("CRM advertiser DB")]
  poll["Timestamp polling job"] -.->|"no polling"| db
  poll -.-> fs[("Feature store · budget caps current within seconds")]
  fs --> serving["Ad serving · closed accounts stop serving"]
  serving --> exchange["Ad exchanges"]
  serving --> logs[("Impression log")]
  db -->|"reads the transaction log"| cdc["Log reader · captures each change"]
  cdc --> stream[["Advertiser change stream · includes deletions"]]
  stream -->|"within seconds"| fs

  classDef added stroke:#16a34a,stroke-width:3px;
  class cdc,stream,fs,serving added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class poll removed;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "transactional-outbox-1": `flowchart TD
  support["Support agents"] --> api["Refunds service"]
  api -->|"commit refund row and outbox row in one transaction"| pg[("Refunds Postgres")]
  api -.->|"no publish from the request"| broker[["Message broker"]]
  broker --> settle["Settlement · ignores duplicates"]
  broker --> notify["Notifications · ignores duplicates"]
  broker --> acct["Accounting · ignores duplicates"]
  api -.->|"no message for a rolled back refund"| broker
  pg --> reports["Finance reports"]
  api -->|"same transaction"| outbox[("Outbox table in Refunds Postgres · message body and destination")]
  relay["Outbox relay worker · marks each row sent"] -->|"reads unsent rows"| outbox
  relay -->|"publishes, may repeat after a crash"| broker

  classDef added stroke:#16a34a,stroke-width:3px;
  class outbox,relay,settle,notify,acct added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "transactional-outbox-2": `flowchart TD
  customers["Customers"] --> order["Order service · 900 orders/s, no two-phase commit"]
  order -->|"save order and outbox row in one transaction"| mysql[("Orders MySQL")]
  order -.->|"no publish from the request"| broker[["Message broker · 90 s outage at dinner rush"]]
  broker --> dispatch["Courier dispatch · ignores duplicates"]
  broker --> terminal["Restaurant terminals · get every committed order"]
  order -.->|"no two-phase commit"| broker
  order --> pay["Payment provider"]
  order -->|"same transaction"| outbox[("Outbox table in Orders MySQL")]
  relay["Outbox relay worker · keeps retrying until the broker is back"] -->|"reads unsent rows"| outbox
  relay -->|"publishes after the outage, marks sent"| broker

  classDef added stroke:#16a34a,stroke-width:3px;
  class outbox,relay,order,dispatch,terminal added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "transactional-outbox-3": `flowchart TD
  retail["Retail stores and app"] --> act["Line activation service"]
  act -.->|"no publish before the write"| broker[["Message broker"]]
  act -->|"write 4 rows and outbox row in one transaction"| db[("Activation DB")]
  broker --> prov["Provisioning · ignores duplicates"]
  broker --> billing["Billing · charges only for committed activations"]
  broker --> sms["SMS welcome · ignores duplicates"]
  prov --> hlr[("Network subscriber register")]
  act -->|"same transaction"| outbox[("Outbox table in Activation DB")]
  relay["Outbox relay worker · picks up unsent rows after a restart"] -->|"reads unsent rows"| outbox
  relay -->|"publishes after commit, marks sent"| broker

  classDef added stroke:#16a34a,stroke-width:3px;
  class outbox,relay,prov,billing,sms added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;`,

  "transactional-outbox-4": `flowchart TD
  scanners["Package scanners"] --> lb["Load balancer"]
  lb --> ship["Shipment service · autoscales down, instances terminated mid-request"]
  ship -->|"update shipment row and insert outbox row in one transaction"| db[("Shipment DB")]
  ship -.->|"no publish from the request handler"| broker[["Message broker"]]
  broker --> tracking["Customer tracking page · ignores duplicate scans"]
  broker --> recon["Carrier reconciliation job · ignores duplicate scans"]
  db --> reports["Operations reports"]
  ship -->|"same transaction"| outbox[("Outbox table in Shipment DB")]
  relay["Outbox relay worker · separate process, not tied to any request"] -->|"reads unsent rows"| outbox
  relay -->|"publishes, then marks sent · 0 gap"| broker

  classDef added stroke:#16a34a,stroke-width:3px;
  class outbox,relay,tracking,recon added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "transactional-outbox-5": `flowchart TD
  subscribers["Subscribers"] --> apps["Web and TV apps"]
  apps -->|"upgrade plan"| sub["Subscription service"]
  sub -->|"commit plan row and outbox row in one transaction"| db[("Subscriptions DB")]
  sub -.->|"no publish from application code"| broker[["Message broker"]]
  broker --> ent["Entitlement service · sees upgrades in commit order, ignores duplicates"]
  broker --> inv["Invoicing service · sees upgrades in commit order"]
  audit["Auditors"] -.-> db
  sub -->|"same transaction · rows numbered in commit order"| outbox[("Outbox table in Subscriptions DB")]
  relay["Outbox relay worker · one reader, sends rows in outbox order"] -->|"reads unsent rows in order"| outbox
  relay -->|"publishes in commit order, marks sent"| broker

  classDef added stroke:#16a34a,stroke-width:3px;
  class outbox,relay,ent,inv added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "saga-1": `flowchart TD
  customer["Customer app"] -->|"place order"| api["Order Service · coordinator, runs the order as steps"]
  api -->|"1. reserve items"| inv["Restaurant Inventory Service"]
  api -->|"2. charge card"| pay["Payments Service"]
  pay -->|"card charged, cannot be rolled back"| psp["Payment provider"]
  api -->|"3. assign courier"| courier["Courier Dispatch Service"]
  api -->|"order row plus which steps finished, one local write"| odb[("Orders Postgres")]
  inv --> idb[("Inventory Postgres")]
  pay --> pdb[("Payments Postgres")]
  courier --> cdb[("Courier Postgres")]
  api -.->|"about 900 orders a day charged with no courier"| support["Support team · fixes orders by hand"]
  menu["Menu API"] --> cache[("Menu Cache")]
  customer --> menu
  courier -.->|"no courier found"| api
  api -->|"undo: refund the charge"| pay
  api -->|"undo: release the items"| inv

  classDef added stroke:#16a34a,stroke-width:3px;
  class api added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class support removed;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#dc2626,stroke-width:3px;`,

  "saga-2": `flowchart TD
  store["Retail store and carrier app"] -->|"activate line"| act["Activation coordinator · stores which steps finished"]
  act -->|"1. create account"| acct["Customer Account Service"]
  act -->|"2. assign phone number"| num["Number Inventory Service"]
  act -->|"3. turn line on · 8 to 40 s, no lock held"| net["Network Provisioning Service"]
  act -->|"4. start monthly charge"| bill["Billing Service"]
  acct --> adb[("Account DB")]
  num --> ndb[("Number DB")]
  net --> core["Network core"]
  bill --> bdb[("Billing DB")]
  act -.->|"gives up wherever it breaks"| half["Half-activated lines"]
  store --> plans["Plan Catalog API"]
  plans --> pcache[("Plan Cache")]
  act -->|"saves progress per activation"| sdb[("Activation state DB")]
  net -.->|"provisioning fails"| act
  act -->|"undo: release the number"| num
  act -->|"undo: close the new account"| acct

  classDef added stroke:#16a34a,stroke-width:3px;
  class act,sdb added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class half removed;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#dc2626,stroke-width:3px;`,

  "saga-3": `flowchart TD
  agent["Agent portal"] -->|"one API call: issue policy"| api["Policy API · one call for the agent, runs four local steps in order"]
  api -->|"1. record accepted risk"| uw["Underwriting Service"]
  api -->|"2. file signed contract"| doc["Document Service"]
  api -->|"3. take first premium"| pay["Payments Service"]
  api -->|"4. open coverage record"| claims["Claims Service"]
  uw --> uwdb[("Underwriting DB · accepted risk")]
  doc --> docdb[("Contract store · signed contract")]
  pay --> paydb[("Payments DB · first premium")]
  claims --> cdb[("Claims DB · coverage record")]
  api -.->|"two-phase commit not enabled"| dba["DBA team"]
  pay -.->|"premium rejected, policy stays live"| live["Live policy with no premium"]
  agent --> quote["Quote Service"]
  quote --> rates[("Rate tables")]
  api -->|"steps done and the undo for each"| log[("Issuance saga log")]
  pay -.->|"premium rejected"| api
  api -->|"undo: void the contract"| doc
  api -->|"undo: withdraw the accepted risk"| uw

  classDef added stroke:#16a34a,stroke-width:3px;
  class api,log added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class live removed;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;
  linkStyle 16 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#dc2626,stroke-width:3px;`,

  "saga-4": `flowchart TD
  shipper["Shipper portal"] -->|"book shipment"| api["Booking API · starts the booking and returns"]
  api -->|"hold truck slot"| cap["Capacity Service · region A"]
  api -->|"file paperwork · 80 to 200 ms away"| customs["Customs Service · region B"]
  api -->|"create receivable · 80 to 200 ms away"| inv["Invoicing Service · region C"]
  cap --> capdb[("Capacity DB")]
  customs -->|"file with broker"| broker["Customs broker"]
  customs --> cudb[("Customs DB")]
  inv --> ardb[("Accounts receivable DB")]
  customs -.->|"about 2 percent of bookings fail here"| api
  capdb -.->|"truck slot held forever, no invoice"| stuck["Stuck truck slots"]
  shipper --> track["Tracking Service"]
  track --> gps[("GPS ping store")]
  cap -->|"SlotHeld event, saved with the slot in one write"| bus[["Booking event bus"]]
  bus -->|"SlotHeld"| customs
  customs -->|"CustomsFiled event"| bus
  bus -->|"CustomsFiled"| inv
  customs -->|"CustomsFailed event"| bus
  bus -->|"CustomsFailed: release the truck slot"| cap

  classDef added stroke:#16a34a,stroke-width:3px;
  class api,bus added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class stuck removed;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;
  linkStyle 16 stroke:#16a34a,stroke-width:3px;
  linkStyle 17 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#dc2626,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;
  linkStyle 8 stroke:#dc2626,stroke-width:3px;
  linkStyle 9 stroke:#dc2626,stroke-width:3px;`,

  "saga-5": `flowchart TD
  doctor["Referring doctor"] -->|"create referral"| ref["Referral coordinator · runs four local steps, saves progress"]
  ref -->|"1. create referral record"| sched["Scheduling Service"]
  ref -->|"2. reserve clinic slot"| clinic["Specialist Clinic Service"]
  ref -->|"3. update coverage check"| ben["Benefits Service"]
  ref -->|"4. notify records"| rec["Records Service"]
  sched --> sdb[("Scheduling DB")]
  clinic --> cdb[("Clinic DB · slot held")]
  ben --> bdb[("Benefits DB")]
  rec --> rdb[("Records DB")]
  ref -.->|"fails halfway about 40 times a week"| orphan["Clinic slot held for a patient with no appointment"]
  monolith["Old monolith DB · one transaction, retired"] -.-> ref
  doctor --> directory["Provider directory"]
  ref -->|"which steps finished"| state[("Referral saga state DB")]
  ben -.->|"coverage check fails"| ref
  ref -->|"undo: release the clinic slot"| clinic
  ref -->|"undo: cancel the referral record"| sched

  classDef added stroke:#16a34a,stroke-width:3px;
  class ref,state added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class orphan removed;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#dc2626,stroke-width:3px;`,

  "compensating-transaction-1": `flowchart TD
  traveler["Traveler app"] -->|"book trip"| orch["Booking orchestrator · runs steps in order"]
  orch -->|"1. book flight"| flight["Flight supplier API"]
  orch -->|"2. book rental car"| car["Car supplier API"]
  orch -->|"3. book hotel"| hotel["Hotel supplier API"]
  hotel -.->|"fails after retries are exhausted"| orch
  orch -->|"each finished step, its inputs, and its undo call"| log[("Step log")]
  log -->|"read by hand, about 30 times a week"| oncall["On-call engineer"]
  oncall -->|"cancel by hand · 15 percent fee"| flight
  oncall -->|"cancel by hand · deposit back, booking fee kept"| car
  orch --> pay["Payments Service"]
  traveler --> search["Trip Search Service"]
  orch -->|"undo: cancel flight · accept 15 percent fee"| flight
  orch -->|"undo: cancel car · deposit back"| car
  orch -->|"marks each undo done"| log
  orch -.->|"page only when an undo call keeps failing"| oncall

  classDef added stroke:#16a34a,stroke-width:3px;
  class log added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;
  linkStyle 8 stroke:#dc2626,stroke-width:3px;`,

  "compensating-transaction-2": `flowchart TD
  cycle["Monthly pay cycle workflow"] -->|"send payments"| ach["Bank ACH file · 4,200 payments sent"]
  cycle -->|"deduct premiums"| benefits["Benefits vendor"]
  cycle -->|"step 4 · file taxes"| tax["Tax filing vendor"]
  tax -.->|"rejects the batch"| cycle
  cycle -.->|"later steps"| k401["401k provider"]
  cycle -.->|"later steps"| gl["General ledger"]
  cycle -.->|"later steps"| email["Email notifier"]
  cycle -.->|"stops, nothing reversed"| finance["Finance team · 2 days reversing by hand"]
  finance -->|"ACH return entries by hand"| ach
  finance -->|"adjusting credits by hand"| benefits
  hr["HR system"] -->|"employee changes"| cycle
  cycle -->|"each finished step and its undo · progress saved after each undo"| steps[("Compensation log")]
  cycle -->|"undo: post ACH return entry · a second run does nothing"| ach
  cycle -->|"undo: post adjusting credit · a second run does nothing"| benefits
  steps -.->|"resume after a crash, skip undos already done"| cycle
  cycle -.->|"page when an undo will not go through"| finance

  classDef added stroke:#16a34a,stroke-width:3px;
  class steps added;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;
  linkStyle 8 stroke:#dc2626,stroke-width:3px;
  linkStyle 9 stroke:#dc2626,stroke-width:3px;`,

  "compensating-transaction-3": `flowchart TD
  orders["Order Service"] --> flow["Fulfillment workflow"]
  flow -->|"1. pick · stock decremented"| stock[("Stock counts DB · also changed by other orders")]
  flow -->|"2. pack · pallet staged"| floor[["Floor crew task queue"]]
  flow -->|"3. buy label · $8.40"| carrierapi["Carrier label API"]
  flow -->|"4. hand off to carrier"| handoff["Carrier handoff"]
  handoff -.->|"address undeliverable · about 700 a day"| flow
  flow -.->|"gives up, nothing undone · about $5,000 lost a week"| loss["Paid labels, missing stock, staged pallets"]
  slotting["Slotting Service"] --> stock
  flow --> tracking[("Shipment tracking DB")]
  flow -->|"finished steps and the undo order the warehouse chose"| log[("Compensation log")]
  flow -->|"undo 1: request label refund"| carrierapi
  flow -->|"undo 2: add a restock entry, no count overwrite"| stock
  flow -->|"undo 3: create unstage task"| floor

  classDef added stroke:#16a34a,stroke-width:3px;
  class log added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class loss removed;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "compensating-transaction-4": `flowchart TD
  player["Player"] -->|"buy bundle"| purchase["Bundle purchase process · five steps"]
  purchase -->|"charge card · settled"| pay["Payments Service"]
  purchase -->|"grant base game"| ent["Entitlement Service"]
  purchase -->|"credit 500 in-game currency"| wallet[("Currency balance · player may have spent it")]
  purchase -->|"grant two add-ons"| ent
  ent -.->|"add-on 2 rejected · region restriction"| purchase
  purchase -->|"post achievement"| achievements["Achievement Service"]
  other["Other purchases"] --> wallet
  purchase -.->|"gives up, finished steps left in place"| partial["Charged player with a partial bundle"]
  player --> catalog["Store catalog"]
  purchase -->|"each finished step and its undo"| log[("Compensation log")]
  purchase -->|"undo: refund the charge"| pay
  purchase -->|"undo: revoke base game and add-on 1"| ent
  purchase -->|"undo: debit 500 from the current balance, no snapshot restore"| wallet

  classDef added stroke:#16a34a,stroke-width:3px;
  class log added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class partial removed;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#dc2626,stroke-width:3px;`,

  "compensating-transaction-5": `flowchart TD
  officer["Loan officer"] --> flow["Mortgage approval flow"]
  flow -->|"1. pull credit"| credit["Credit bureau"]
  flow -->|"2. order appraisal · $600"| appraisal["Appraisal vendor"]
  flow -->|"3. lock rate · held 45 days"| desk["Funding desk API"]
  flow -->|"4. reserve funds"| funds["Funds reservation service"]
  funds -.->|"fails after all retries · about 120 files a month"| flow
  flow -.->|"dead files copied out"| sheet["Ops spreadsheet"]
  sheet -->|"release rate lock by hand · misses 1 in 8"| desk
  sheet -->|"cancel appraisal by hand"| appraisal
  flow --> loanfile[("Loan file DB")]
  officer --> uploads["Document upload portal"]
  flow -->|"each finished step and its undo rule"| log[("Compensation log")]
  flow -->|"undo: cancel appraisal if within 4 h, else accept the bill"| appraisal
  flow -->|"undo: release rate lock desk call"| desk
  flow -->|"undo: mark the credit pull withdrawn"| loanfile
  flow -.->|"alert when an undo call keeps failing"| ops["Ops on-call"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class log,ops added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class sheet removed;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;
  linkStyle 8 stroke:#dc2626,stroke-width:3px;`,
  "bulkhead-5": `flowchart TD
  trucks["12,000 trucks · device messages"] -->|"5 message kinds"| ingest["Device gateway · routes by message kind"]
  ingest --> gpsq[["GPS queue"]]
  ingest --> tempq[["Temperature queue"]]
  ingest --> doorq[["Door sensor queue"]]
  ingest --> checkq[["Driver check-in queue"]]
  ingest --> fwq[["Firmware confirmation queue"]]
  ingest -.->|"no single mixed queue"| queue[["One queue · all 5 kinds"]]
  gpsq -.-> gpsc["GPS consumers · 8 processes"]
  tempq -.-> tempc["Temperature consumers · 4 processes"]
  doorq -.-> doorc["Door sensor consumers · 4 processes"]
  checkq -.-> checkc["Check-in consumers · 4 processes"]
  fwq -.-> fwc["Firmware consumers · 4 processes · a hang stalls only these"]
  fwc -->|"handler hangs 30 s per message"| blob[("Blob storage")]
  gpsc -->|"GPS pings stay current"| tracking["Live tracking"]
  tempc & doorc & checkc --> telemetry[("Telemetry DB")]
  dispatch["Dispatchers"] --> tracking

  classDef added stroke:#16a34a,stroke-width:3px;
  class gpsq,tempq,doorq,checkq,fwq,gpsc,tempc,doorc,checkc,fwc added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class queue removed;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#16a34a,stroke-width:3px;
  linkStyle 16 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "rate-limiting-1": `flowchart TD
  warehouse["Analytics warehouse"] --> events[("Day's conversion events")]
  sched["Nightly scheduler"] --> job["Upload workers · send only what their leased locks allow"]
  events -->|"enqueue all records"| queue[["Upload queue · holds the whole day"]]
  queue -.->|"small batch every 200 ms"| job
  job -->|"lease locks for a few seconds"| locks[("Lock store · 10 locks · each worth 50 writes/s")]
  job -->|"at most 500 writes/s total"| api["Ad partner API · 500 writes/s per account"]
  job -.->|"no pushing 4,000 writes/s"| api
  api -.->|"rare 429"| job
  job -.->|"on 429, requeue after a short random wait"| queue

  classDef added stroke:#16a34a,stroke-width:3px;
  class job,queue,locks added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "rate-limiting-2": `flowchart TD
  appts[("Day's appointments · 90,000 checks")] --> batch["6 am batch job"]
  batch -->|"enqueue all 90,000 checks"| queue[["Eligibility check queue"]]
  queue -.->|"4 checks every 200 ms"| pool["Worker pool · sends only what its lock lease allows"]
  pool -->|"lease lock"| locks[("Lock store · 20 requests/s for this key")]
  pool -->|"at most 20 requests/s · all done in about 75 min"| vendor["Insurance eligibility vendor · contract allows 20 requests/s per key"]
  pool -.->|"no firing at 300 requests/s"| vendor
  vendor -.->|"on a rare rejection, requeue after a short random wait"| queue
  pool --> results[("Eligibility results")]
  staff["Front desk staff"] --> app["Clinic scheduling app"]
  app --> results

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,pool,locks added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "rate-limiting-3": `flowchart TD
  cron["Hourly timer · wakes at the top of the hour"] -.->|"no single burst at the top of the hour"| poller["Tracking poller · spreads calls across the hour"]
  shipments[("Open shipments")] -->|"enqueue tracking lookups"| queue[["Lookup queue"]]
  queue -.->|"1 call every 400 ms · about 9,000 per hour"| poller
  poller -->|"steady calls all hour, under 10,000"| carrier["Carrier tracking API · 10,000 calls per hour per customer · fixed hourly window"]
  poller -.->|"lookup done, requeue for its next turn"| queue
  poller --> status[("Tracking status DB · fresh within minutes all hour")]
  customers["Customers and support"] --> portal["Tracking page"]
  portal --> status

  classDef added stroke:#16a34a,stroke-width:3px;
  class poller,queue,status added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class cron removed;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 0 stroke:#dc2626,stroke-width:3px;`,

  "rate-limiting-4": `flowchart TD
  file[("Nightly file · 10 million transaction rows")] -->|"enqueue all rows"| queue[["Row queue"]]
  queue -.->|"400 rows every 200 ms"| loader["Loader · 2,000 rows/s · done in about 83 min of the 6 h window"]
  loader -->|"about 2,000 rows/s, each row sent once"| docdb[("Document DB · 20,000 units/s · 10 units per row · 2,000 rows/s")]
  loader -.->|"no writing as fast as it reads"| docdb
  docdb -.->|"on a rare refusal, requeue the row after a short random wait"| queue
  loader --> logs[("Error logs · a few lines a night")]
  app["Fintech app · reads"] --> docdb

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,loader added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#dc2626,stroke-width:3px;`,

  "rate-limiting-5": `flowchart TD
  players[("2 million player push tokens")] -->|"enqueue all 2 million"| queue[["Notification queue"]]
  launch["Launch-day campaign"] --> queue
  queue -.->|"small batch every 200 ms"| sender["Push senders · send only what their leased locks allow"]
  sender -->|"lease locks"| locks[("Lock store · 6 locks · each worth 100 messages/s")]
  sender -->|"at most 600 messages/s · list done in about 56 min"| vendor["Push vendor · plan allows 600 messages/s"]
  sender -.->|"no pushing until refused"| vendor
  vendor -.->|"on a rare rejection, requeue after a short random wait"| queue
  vendor --> devices["Player phones"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class queue,sender,locks added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "throttling-1": `flowchart TD
  tenants["About 900 tenants · 3 to 8 requests/s each"] --> lb["Load balancer"]
  script["One tenant's script · 150 requests/s for 40 min"] --> lb
  lb --> limiter["Per-tenant limit check · runs before parsing or queries"]
  limiter -->|"add 1 to the counter for this API key this second"| counters[("Shared counter store · limits can change while running")]
  limiter -->|"under limit"| api["Analytics API servers · CPU back to normal"]
  limiter -->|"over limit: 429 Too Many Requests · Retry-After 1"| script
  api --> query["Query engine"]
  query --> store[("Analytics store")]
  api -.->|"p99 stays under 500 ms for other tenants"| tenants
  scaler["Autoscaler · adds servers after about 6 min"] -.-> api

  classDef added stroke:#16a34a,stroke-width:3px;
  class limiter,counters,api added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "throttling-2": `flowchart TD
  viewers["2.1 million concurrent viewers · capacity sized for 1.2 million"] --> edge["Delivery edge · stream plays smoothly"]
  edge -->|"720p only while over the capacity line"| origin["Stream origin"]
  origin --> enc["Encoding fleet · no hardware can be added mid-match"]
  viewers --> app["Player backend"]
  app -.->|"switched off while over the line"| recs["Personalized recommendation panel"]
  app -.->|"switched off while over the line"| stats["Live stats overlay"]
  recs -->|"18% of backend capacity freed"| shared[("Shared backend cluster")]
  stats --> shared
  monitor["Capacity monitor · viewers and CPU compared to the capacity line"] -->|"reads load"| edge
  monitor -->|"reads load"| enc
  monitor -->|"over the line: turn on degraded mode"| flags[("Degrade settings · can change while running")]
  flags -->|"cap quality at 720p"| origin
  flags -->|"hide overlay and recommendations"| app

  classDef added stroke:#16a34a,stroke-width:3px;
  class monitor,flags,edge added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class recs,stats removed;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;`,

  "throttling-3": `flowchart TD
  riders["Transit app riders"] --> lb["Load balancer"]
  scrapers["2 scrapers · 22,000 requests/s combined · unique query strings"] --> lb
  lb --> gate["Limit check at the edge · per API key · runs before cache lookup or query"]
  gate -->|"count requests per key per second"| counters[("Shared counter store")]
  gate -->|"over limit: 429 · Retry-After 5 · costs almost nothing"| scrapers
  gate -->|"total let through held under 4,000 requests/s"| cache[("Response cache · most scraper calls miss")]
  cache -->|"miss"| api["Open-data API servers · within capacity"]
  api --> feed[("Bus arrivals DB")]
  api -.->|"answers on time"| riders
  gps["Bus GPS feed"] --> feed

  classDef added stroke:#16a34a,stroke-width:3px;
  class gate,counters,api added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "throttling-4": `flowchart TD
  players["400,000 players · all try within 2 min at 6pm"] --> lb["Load balancer"]
  lb --> admit["Admission check · counts sign-ins in progress · starts refusing before the hard cap"]
  admit -->|"under 90,000/min"| queue[["Login queue · capped at what auth can finish"]]
  admit -->|"over: 429 · Retry-After 30 · no password hash"| players
  queue --> auth["Auth servers · steady 90,000 sign-ins/min"]
  auth -->|"password hash only for admitted requests"| users[("Account DB")]
  auth -->|"session token"| sessions[("Session store")]
  auth -.->|"most players in within 5 min"| players
  players -.->|"after login"| game["Game servers"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class admit,queue,auth added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;`,

  "throttling-5": `flowchart TD
  meters["2 million meters · firmware now reports every 10 s instead of every 5 min"] -->|"200,000 messages/s · was 6,600"| gw["Device gateway"]
  gw --> gate["Limit check before parsing · 1 reading per meter per 5 min · total cap 25,000/s"]
  gate -->|"count per meter id"| counters[("Shared counter store · limits can change while running")]
  gate -->|"over limit: reject · retry after 5 min"| meters
  gate -->|"accepted readings only"| ingest["Ingest tier · within 25,000 messages/s"]
  ingest -->|"200 ms write promise met"| tsdb[("Time-series DB")]
  tsdb --> reports["Usage and billing reports"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class gate,counters,ingest added;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;`,

  "shuffle-sharding-1": `flowchart TD
  customers["8,999 other customers"] --> lb["Router · hash of customer id picks 2 of 26 nodes · no lookup table"]
  bad["One customer · request pattern pegs node CPU"] --> lb
  lb -->|"bad customer's pair: nodes 1 and 2 only"| n1["Node 1 · CPU pegged"]
  lb -->|"bad customer's pair: nodes 1 and 2 only"| n2["Node 2 · CPU pegged"]
  lb -->|"never gets the bad traffic"| n3["Nodes 3 to 26 · healthy"]
  n1 --> db[("Customer data store")]
  n2 --> db
  n3 --> db
  lb -.->|"325 possible pairs · customers sharing one node retry on their other node · only about 28 share both"| customers

  classDef added stroke:#16a34a,stroke-width:3px;
  class lb,n3 added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "shuffle-sharding-2": `flowchart TD
  platform["Commerce platform · events for 12,000 merchants"] --> disp["Dispatcher · hash of merchant id picks 2 of 40 senders · uses the less busy one"]
  disp -->|"slow merchant's deliveries"| q1[["Sender 1 queue"]]
  disp -->|"slow merchant's deliveries"| q2[["Sender 2 queue"]]
  disp -->|"other merchants, each by their own pair"| q3[["Sender 3 to 40 queues"]]
  q1 --> s1["Sender 1 · slowed"]
  q2 --> s2["Sender 2 · slowed"]
  q3 --> s3["Senders 3 to 40 · never call the slow endpoint"]
  s1 -->|"waits 30 s timeout"| slow["One merchant's endpoint · holds every connection 30 s"]
  s2 -->|"waits 30 s timeout"| slow
  s3 -.->|"on time · 780 possible pairs, only about 15 merchants share both slowed senders"| others["Other merchants' endpoints"]
  s1 --> log[("Delivery attempt log")]
  platform -.->|"no shared queue for all senders"| queue[["Shared delivery queue"]]

  classDef added stroke:#16a34a,stroke-width:3px;
  class disp,q1,q2,q3,s1,s2,s3 added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class queue removed;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#dc2626,stroke-width:3px;`,

  "shuffle-sharding-3": `flowchart TD
  clients["60,000 API clients"] --> lb["Router · hash of client id picks 2 of 100 nodes · retries stay on those 2"]
  bad["One client · malformed request sent in a loop"] --> lb
  lb -->|"attempt 1"| g1["Gateway node 1 · crashed"]
  lb -->|"retry goes only to its other node"| g2["Gateway node 2 · crashed"]
  lb -->|"never gets the bad client's requests"| g3["Gateway nodes 3 to 100 · still up"]
  g1 --> pay["Payment services"]
  g2 --> pay
  g3 --> pay
  pay --> ledger[("Ledger DB")]
  lb -.->|"4,950 possible pairs · clients sharing one crashed node retry on their other node · only about 12 share both"| clients

  classDef added stroke:#16a34a,stroke-width:3px;
  class lb,g3 added;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;`,

  "shuffle-sharding-4": `flowchart TD
  guilds["30,000 guilds · chat clients"] --> lb["Chat router · hash of guild id picks 2 of 64 relays · not 8 fixed groups"]
  bot["One guild's bot · 5,000 messages/s"] --> lb
  lb -->|"bot guild's pair: relays 1 and 2 only"| r1["Relay 1 · saturated"]
  lb -->|"bot guild's pair: relays 1 and 2 only"| r2["Relay 2 · saturated"]
  lb -->|"never gets bot traffic"| r3["Relays 3 to 64 · healthy"]
  r1 --> hist[("Chat history store")]
  r2 --> hist
  r3 --> hist
  lb -.->|"2,016 possible pairs · guilds sharing one relay switch to their other relay · only about 15 share both"| guilds

  classDef added stroke:#16a34a,stroke-width:3px;
  class lb,r3 added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;`,

  "shuffle-sharding-5": `flowchart TD
  fleets["10,000 customer device fleets"] --> ep["Connection router · hash of customer id picks 3 of 30 brokers · devices connect only to those 3"]
  storm["One customer's 40,000 devices · reconnect loop after bad certificate rollout"] --> ep
  ep -->|"storm customer's set"| b1["Broker 1 · overloaded"]
  ep -->|"storm customer's set"| b2["Broker 2 · overloaded"]
  ep -->|"storm customer's set"| b3["Broker 3 · overloaded"]
  ep -->|"never sees the storm"| b4["Brokers 4 to 30 · healthy"]
  b1 --> tel[("Telemetry store")]
  b2 --> tel
  b3 --> tel
  b4 --> tel
  ep -.->|"4,060 possible sets · fleets sharing 1 or 2 brokers reconnect to a healthy one · about 2 fleets share all 3"| fleets

  classDef added stroke:#16a34a,stroke-width:3px;
  class ep,b4 added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;`,

  "leader-election-1": `flowchart TD
  meters["90,000 smart water meters"] --> ingest["Reading ingest"]
  ingest --> readings[("Readings table")]
  asg["Autoscaler"] --> c1["Rollup container 1 · leader · renews lease every 2 s"]
  asg --> c2["Rollup container 2 · follower · tries the lease every 2 s"]
  asg --> c12["Rollup containers 3 to 12 · followers · try the lease every 2 s"]
  c1 -->|"only the lease holder sweeps"| readings
  c2 -.->|"no sweep while not leader"| readings
  c12 -.->|"no sweep while not leader"| readings
  c1 -->|"writes each hourly total once"| totals[("Hourly totals table · one row per meter and hour")]
  c2 -.->|"no duplicate totals"| totals
  c12 -.->|"no duplicate totals"| totals
  billing["Billing app"] --> totals
  c1 -->|"renew lease · expires 6 s after last renew"| lease[("Sweep lease row · owner container, expires at")]
  c2 -.->|"take lease if it expired"| lease
  c12 -.->|"take lease if it expired"| lease

  classDef added stroke:#16a34a,stroke-width:3px;
  class c1,c2,c12,lease added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;
  linkStyle 7 stroke:#dc2626,stroke-width:3px;
  linkStyle 9 stroke:#dc2626,stroke-width:3px;
  linkStyle 10 stroke:#dc2626,stroke-width:3px;`,

  "leader-election-2": `flowchart TD
  clients["Banking apps"] --> lb["Load balancer"]
  lb --> s0["Account service copy 0 · current leader · renews lease every 10 s"]
  lb --> s1["Account service copies 1 to 5 · retry the lease every 10 s"]
  s0 -->|"daily interest job runs only on the lease holder"| db[("Accounts DB")]
  s1 -->|"requests, plus the job if one of them becomes leader"| db
  cfg["Deploy config · env variable turns the job on only for copy 0"] -.-> s0
  cfg -.-> s1
  s0 -->|"renew lease · expires 30 s after last renew"| lease[("Interest job lease row · owner copy, expires at")]
  s1 -.->|"take lease when it expired"| lease

  classDef added stroke:#16a34a,stroke-width:3px;
  class s0,s1,lease added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class cfg removed;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "leader-election-3": `flowchart TD
  players["Players waiting for a match"] --> api["Matchmaking API"]
  api --> i1["Matchmaking instance 1 · leader · checks it still holds the lease before each 2 s sweep"]
  api --> i2["Matchmaking instances 2 to 8 · followers · no sweep"]
  i1 -->|"reads the whole waiting pool"| pool[("Waiting player pool")]
  i2 -.->|"no sweep while not leader"| pool
  i1 -->|"each player in exactly one match"| gs["Game server fleet"]
  i2 -.->|"no match assignments"| gs
  gs --> clients["Game clients"]
  i1 -->|"renew lease every 1 s · expires after 3 s"| lease[("Sweep lease · owner instance, expires at")]
  i2 -.->|"take lease if the leader freezes and it expires"| lease

  classDef added stroke:#16a34a,stroke-width:3px;
  class i1,i2,lease added;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

  "leader-election-4": `flowchart TD
  c1["Consumer instance 1 · holds the feed lease · closes the session if a renew fails"] -->|"only the lease holder opens the session"| carrier["Carrier scan event feed · one open session per account"]
  c2["Consumer instances 2 to 5 · running on standby"] -.->|"no session while not leader"| carrier
  carrier -->|"steady stream, no gaps"| c1
  c1 --> events[("Package scan events DB")]
  c2 -.->|"no writes while on standby"| events
  events --> tracking["Tracking page and API"]
  c1 -->|"renew claim every 5 s · expires after 15 s"| lease[("Feed lease · owner instance, expires at")]
  c2 -.->|"retry claim · new holder connects once it expires"| lease

  classDef added stroke:#16a34a,stroke-width:3px;
  class c1,c2,lease added;
  linkStyle 0 stroke:#16a34a,stroke-width:3px;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 1 stroke:#dc2626,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;`,

  "leader-election-5": `flowchart TD
  rA["Rebalancer replica · zone A · leader, issues commands"] -->|"reads queue depths"| metrics[("Fleet queue depth metrics")]
  rB["Rebalancer replica · zone B · follower"] -->|"reads queue depths"| metrics
  rC["2 rebalancer replicas · zone C · followers"] -->|"read queue depths"| metrics
  rA -->|"reassignment commands tagged with lease number"| ctl["Encoder control API · rejects commands with an older lease number"]
  rB -.->|"no commands while follower"| ctl
  rC -.->|"no commands while follower"| ctl
  ctl --> enc["Encoder fleet · stays on its assigned region"]
  enc --> metrics
  rA -->|"renew lease every 5 s · expires after 15 s"| lease[("Leader lease in a consensus store spread across 3 zones")]
  rB -.->|"take lease if zone A goes down and it expires"| lease
  rC -.->|"take lease if it expires"| lease

  classDef added stroke:#16a34a,stroke-width:3px;
  class rA,rB,rC,ctl,enc,lease added;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#dc2626,stroke-width:3px;
  linkStyle 5 stroke:#dc2626,stroke-width:3px;`,

  "scheduler-agent-supervisor-1": `flowchart TD
  portal["Provider claim submissions · 4,000 a day"] --> api["Claims API"]
  api -->|"writes claim row"| db[("Claims DB")]
  api -->|"enqueue claim"| q[["Claim work queue"]]
  q --> worker["Scheduler · runs the 6 steps in order"]
  worker -->|"one row per step · status, owner, retry count, complete-by time"| steps[("Step state table")]
  worker -->|"step 2 and step 5 requests"| aq[["Agent request queue"]]
  aq --> agent["Agents · call outside system, retry short failures, give up at complete-by time"]
  agent -->|"step 2 eligibility check"| elig["Eligibility system"]
  agent -->|"step 5 payment authorization"| pay["Payment authorization system"]
  agent -->|"reply with result"| worker
  worker -->|"step 3 provider lookup"| prov[("Provider directory")]
  worker -->|"sets claim status"| db
  sup["Supervisor · timer every 5 min"] -->|"find steps still running past complete-by time"| steps
  sup -->|"retries left: reset step to pending"| worker
  sup -->|"retries used up: mark failed"| esc["Claims ops escalation queue · same day"]
  eng["Engineer · runs UPDATE statements by hand 3 weeks later"] -.->|"no more hand UPDATE statements"| db

  classDef added stroke:#16a34a,stroke-width:3px;
  class worker,steps,aq,agent,sup,esc added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class eng removed;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#16a34a,stroke-width:3px;
  linkStyle 15 stroke:#dc2626,stroke-width:3px;`,

  "scheduler-agent-supervisor-2": `flowchart TD
  app["Retail store activation app"] --> api["Activation API"]
  api -->|"activation row"| db[("Activations DB · one row per step")]
  api --> worker["Scheduler · runs the 4 steps in order"]
  worker -->|"each step · status, owner, retry count, complete-by time"| db
  worker -->|"step request"| aq[["Agent queue"]]
  aq --> agent["Vendor agents · give up at complete-by time"]
  agent -->|"1. reserve number"| num["Number reservation vendor"]
  agent -->|"2. register SIM"| sim["SIM registration vendor"]
  agent -->|"3. set up billing account"| bill["Billing vendor"]
  agent -->|"4. provision network"| net["Network provisioning vendor"]
  sup["Supervisor · timer every 2 min"] -->|"find steps in progress past complete-by time"| db
  sup -->|"retries left: reset step to pending"| worker
  sup -->|"retries used up: mark failed, run undo"| undo["Undo commands for each step"]
  undo -->|"release number, cancel SIM, close billing account"| agent
  support["Support team · morning spreadsheet of stuck line numbers"] -.->|"no morning spreadsheet"| api

  classDef added stroke:#16a34a,stroke-width:3px;
  class db,worker,aq,agent,sup,undo added;
  classDef removed stroke:#dc2626,stroke-width:3px,stroke-dasharray:4 4;
  class support removed;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 4 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 14 stroke:#dc2626,stroke-width:3px;`,

  "scheduler-agent-supervisor-3": `flowchart TD
  signup["Customer signup"] --> api["Provisioning API"]
  api --> wf["Scheduler · runs the 9 steps, any instance can resume a run"]
  wf -->|"reserve subdomain"| dns["DNS provider"]
  wf -->|"issue certificate"| ca["Certificate authority"]
  wf -->|"create containers"| cp["Container platform"]
  wf -->|"create subscription"| billing["Billing system"]
  wf -->|"each step · status, owner instance, retry count, complete-by time"| db[("Environments DB · step state rows")]
  drain["Node drain"] -.->|"terminates the process mid-run"| wf
  sup["Supervisor · timer every 5 min"] -->|"find steps running past complete-by time"| db
  sup -->|"retries left: reset step to pending"| wf
  sup -->|"retries used up: mark run failed"| undo["Undo steps · release subdomain, revoke certificate, delete containers"]
  undo -->|"release reserved subdomain"| dns

  classDef added stroke:#16a34a,stroke-width:3px;
  class wf,db,sup,undo added;
  linkStyle 6 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;`,

  "scheduler-agent-supervisor-4": `flowchart TD
  cron["Nightly payout batch"] --> worker["Scheduler · runs 5 steps · ignores replies for an old attempt number"]
  worker -->|"steps 1 and 2 · compute and hold balance"| ledger[("Seller balance ledger")]
  worker -->|"step 3 request with attempt number and complete-by time"| aq[["Transfer agent queue"]]
  worker -->|"state SENDING · owner, retry count, complete-by time"| db[("Payouts DB")]
  worker -->|"steps 4 and 5 · mark paid, email seller"| notify["Seller notification service"]
  deploy["Deploy pipeline"] -.->|"kills worker mid-batch"| worker
  db --> report["Finance payout report"]
  aq --> agent["Bank agent · gives up silently once complete-by time passes"]
  agent -->|"transfer with payout id as idempotency key"| bank["Bank transfer API"]
  agent -->|"result only if before complete-by time"| worker
  sup["Supervisor · checks every 2 min during the batch"] -->|"find SENDING rows past complete-by time"| db
  sup -->|"retries left: reset to pending, new attempt number"| worker
  sup -->|"retries used up: mark failed, page on-call"| oncall["Payments on-call · same night"]

  classDef added stroke:#16a34a,stroke-width:3px;
  class worker,db,aq,agent,sup,oncall added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 3 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;`,

  "scheduler-agent-supervisor-5": `flowchart TD
  am["Account manager"] -->|"launch campaign"| api["Campaign API"]
  api --> worker["Scheduler · runs the 7 steps in order"]
  worker -->|"steps 1 to 5 · one request per exchange"| aq[["Agent queue"]]
  worker -->|"step 6 · approve creative"| creative["Creative approval service"]
  worker -->|"step 7 · set budget"| budget["Budget service"]
  worker -->|"step rows · status, owner, retry count, complete-by time"| db[("Campaigns DB · step state rows")]
  am -.->|"no spotting by eye or manual re-runs"| api
  aq --> agent["Exchange agents · give up at complete-by time"]
  agent -->|"create campaign keyed by launch id, so a retry finds the existing one"| ex["5 ad exchange APIs · calls sometimes time out"]
  agent -->|"result"| worker
  sup["Supervisor · timer every 5 min"] -->|"find steps running past complete-by time"| db
  sup -->|"retries left: reset step to pending"| worker
  sup -->|"retries used up: mark failed, run undo"| undo["Undo steps · pause campaign on exchanges already live"]
  undo --> agent

  classDef added stroke:#16a34a,stroke-width:3px;
  class worker,aq,db,agent,sup,undo added;
  linkStyle 2 stroke:#16a34a,stroke-width:3px;
  linkStyle 5 stroke:#16a34a,stroke-width:3px;
  linkStyle 7 stroke:#16a34a,stroke-width:3px;
  linkStyle 8 stroke:#16a34a,stroke-width:3px;
  linkStyle 9 stroke:#16a34a,stroke-width:3px;
  linkStyle 10 stroke:#16a34a,stroke-width:3px;
  linkStyle 11 stroke:#16a34a,stroke-width:3px;
  linkStyle 12 stroke:#16a34a,stroke-width:3px;
  linkStyle 13 stroke:#16a34a,stroke-width:3px;
  linkStyle 6 stroke:#dc2626,stroke-width:3px;`,

};
