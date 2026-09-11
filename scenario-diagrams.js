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

};
