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

  "bulkhead-4": `flowchart TD
  biz["Business customers · statements promised within 5 s by contract"] --> api["Statement generation service"]
  retail["Retail customers · 95 percent of volume · no delivery promise"] --> api
  api -->|"enqueue job"| queue[["One shared queue of in-flight jobs"]]
  queue -.->|"any worker takes any job"| pool["One fleet · 40 workers · all 40 filled for 40 minutes on the first of the month"]
  pool --> acct[(Account and transaction DB)]
  pool --> files[(Generated statement store)]`,

};
