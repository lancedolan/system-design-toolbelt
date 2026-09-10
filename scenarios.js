// Quiz scenarios. answers holds every pattern id that is a correct pick.
const SCENARIOS = [
  {
    id: "asynchronous-request-reply-1",
    text: "You run the upload API for a video platform. A creator POSTs a 900 MB source file and your backend transcodes it into six renditions, which takes between 3 and 9 minutes. Right now the API holds the HTTP connection open until transcoding finishes, and the load balancer kills any connection idle for more than 60 seconds, so the browser shows a network error on about 80 percent of uploads even though the transcode finished fine. Support tickets say creators upload the same file three or four times because they think it failed. You need the browser to get a clean answer in under a second and still learn the outcome later using only ordinary HTTP calls.",
    answers: ["asynchronous-request-reply"],
  },
  {
    id: "asynchronous-request-reply-2",
    text: "A hospital imaging vendor calls your API to score chest CT studies. Their integration server sends POST /studies/analyze and your model takes 2 to 6 minutes per study on a GPU worker. The hospital network blocks all inbound connections, so you cannot call them back with a webhook, and their HTTP client gives up at 120 seconds. Their software can only make plain outbound HTTPS requests, no websockets. You must redesign the API contract so their client gets an immediate acknowledgment and can find the finished report on its own.",
    answers: ["asynchronous-request-reply"],
  },
  {
    id: "asynchronous-request-reply-3",
    text: "Your payroll SaaS has a Generate Year-End Statements button. Clicking it builds a PDF bundle across roughly 40,000 employee rows and takes 90 seconds to 4 minutes depending on the company size. The browser tab spins the whole time with no progress shown, and the CDN in front of your app returns 504 at 100 seconds. Customers cannot tell whether the run is still working or dead. The click must give the browser an answer well inside the CDN's 100 second limit, and customers must still be able to find out how the run ended and download the bundle.",
    answers: ["asynchronous-request-reply"],
  },
  {
    id: "asynchronous-request-reply-4",
    text: "A freight company integrates with your route optimization API. A single POST with 350 stops runs a solver for 2 to 11 minutes. The partner's client is an old Java integration that only speaks HTTP and cannot hold sockets open past 30 seconds, and their operations team cannot open a firewall port for callbacks. The solver itself is fine and already runs on background machines, but your API layer still blocks waiting for it and burns web threads. The partner cannot change anything about their client beyond the calls it already makes, and they must still end up with the solved route.",
    answers: ["asynchronous-request-reply"],
  },
  {
    id: "asynchronous-request-reply-5",
    text: "An ad platform lets agencies request an audience export. Building the export scans 400 million rows and takes 5 to 20 minutes. Today the endpoint blocks, and your API gateway hard-caps responses at 29 seconds, so every request fails with 504 while the export quietly completes and lands in storage that nobody links back to the caller. Agencies write scripts that call the endpoint in a loop and pile up duplicate exports. Agencies need one call that finishes well inside the gateway's 29 second limit, and they must still end up with the finished file instead of starting the export again.",
    answers: ["asynchronous-request-reply"],
  },
  {
    id: "queue-based-load-leveling-1",
    text: "You run the meter ingest service for a utility company. Roughly 40,000 smart meters all report at the top of each hour, so your ingest tier receives about 12,000 writes per second for 90 seconds and then almost nothing for the next 58 minutes. The storage system behind it is a licensed vendor appliance that handles 500 writes per second and cannot be scaled or replaced this year. During each spike its connection pool fills, writes fail, and roughly 4 percent of readings are lost. No reading may be dropped, but storing a reading a few minutes after it arrives is acceptable to the business.",
    answers: ["queue-based-load-leveling"],
  },
  {
    id: "queue-based-load-leveling-2",
    text: "A mobile game finishes matches in waves. When a season event starts, 200,000 clients end matches within the same two minutes and each one calls the stats service directly to write its match record. The stats service normally handles 800 writes per second and falls over at about 3,000, so during events it times out, the game client retries, and the retries make it worse. Between events the service sits at 5 percent CPU. Players do not need their updated career stats instantly; showing them within a minute or two is fine. You want the game servers to hand off match records without waiting and let the stats service take them at a rate it can survive.",
    answers: ["queue-based-load-leveling"],
  },
  {
    id: "queue-based-load-leveling-3",
    text: "An online retailer syncs inventory changes into a 15-year-old warehouse management system over a SOAP endpoint. On a normal day that endpoint receives about 20 calls per second and is fine. During a flash sale, 60 store service instances call it at once and push it to 900 calls per second, at which point it stops responding for 10 to 15 minutes and needs a manual restart. The vendor will not let you add servers to it. Inventory updates arriving 30 seconds late are acceptable, but losing them is not.",
    answers: ["queue-based-load-leveling"],
  },
  {
    id: "queue-based-load-leveling-4",
    text: "Your payments company receives merchant settlement files. Every merchant's cron job fires at exactly 00:00 UTC, so 4,000 uploads hit the file processing service in the same 30-second window, then nothing arrives for the next 23 hours. The processing service runs on fixed hardware sized for the average of 3 files per second, and at midnight it runs out of memory and restarts, which costs your on-call an hour of manual recovery every night. Sizing the hardware for the midnight peak would cost 40 times more and idle all day. Files may be processed over the following hour without breaking any agreement.",
    answers: ["queue-based-load-leveling"],
  },
  {
    id: "queue-based-load-leveling-5",
    text: "A social app resizes uploaded photos with an internal image service. Traffic is usually 50 images per second, but when a large account posts, uploads jump to 4,000 per second for a couple of minutes. Right now the upload API calls the image service directly and waits, so during a spike the image service's threads are all busy, the calls time out, and the whole upload path returns 500s including for users who are not affected by the spike. The image service costs a lot to keep at peak size and is idle 95 percent of the day. Thumbnails appearing a minute after upload is acceptable to product.",
    answers: ["queue-based-load-leveling"],
  },
  {
    id: "competing-consumers-1",
    text: "An insurance claims platform already writes each submitted claim as a message onto a durable queue, and one worker process reads that queue and runs the enrichment steps. Each claim takes about 4 seconds of mostly network waiting, and claims arrive at roughly 10 per second during business hours. The backlog has grown to 300,000 messages and the oldest unprocessed claim is 9 hours old. The worker box is at 6 percent CPU, so making the code faster is not the answer. Claims are independent of each other and can be handled in any order, and the team is worried about what happens if the same claim gets handled twice while they change this.",
    answers: ["competing-consumers"],
  },
  {
    id: "competing-consumers-2",
    text: "A video platform runs content moderation from a message queue. One moderation process pulls a message, downloads the clip, and runs the classifier, which takes 12 seconds per clip. Uploads now arrive at 5 per second, so the backlog grows by about 300,000 clips a day and new uploads sit unreviewed for 6 hours. The single process is a container with 2 vCPUs and the classifier is not CPU bound. Clips have no ordering relationship and the team can run as many containers as they want, but they need each clip reviewed exactly once and they need a crashed process to not lose the clip it was holding.",
    answers: ["competing-consumers"],
  },
  {
    id: "competing-consumers-3",
    text: "Your notification service sends transactional email. Messages land on a durable queue and one sender process reads them, calls the mail provider, and records the result. Each send takes 300 milliseconds, so the single process tops out around 3 messages per second, while a marketing send pushes 500,000 messages onto the queue in ten minutes. Password reset emails, which sit in the same queue, now arrive 40 minutes late. Sends do not depend on each other, and the mail provider can handle 2,000 requests per second. The team can duplicate the sender process freely and has already made the send safe to repeat.",
    answers: ["competing-consumers"],
  },
  {
    id: "competing-consumers-4",
    text: "A genomics lab queues one message per sequencing sample. A single analysis process reads the queue and runs a 6-minute pipeline for each sample, so it handles 10 samples an hour. The sequencers now produce 400 samples a day and the backlog is two weeks deep. Samples are fully independent and the cluster has 200 idle cores available. The team's only worry is that if they run the pipeline in more places at once, two machines might grab the same sample, and that a machine dying mid-pipeline should not silently drop that sample.",
    answers: ["competing-consumers"],
  },
  {
    id: "competing-consumers-5",
    text: "A logistics company generates shipping labels from a durable queue. One label generator process reads messages and calls the carrier API, taking about 800 milliseconds each. At the 4 PM carrier cutoff, warehouses push 90,000 label requests in 20 minutes, and the single process needs 20 hours to drain it, so trucks leave without labels. The carrier API happily accepts 500 requests per second and labels can be produced in any order. The team has plenty of spare container capacity, and their only worry is a label being produced twice, or lost when a machine dies holding it.",
    answers: ["competing-consumers"],
  },
  {
    id: "priority-queue-1",
    text: "A hospital lab system puts every finished test result onto one work stream that a set of workers reads in arrival order. Overnight, an automated batch dumps 20,000 routine results in at 2 AM. When a doctor orders a stat troponin at 2:05 AM, that result sits behind the whole batch and reaches the chart 40 minutes later, though the rule is 2 minutes. Overall throughput is fine; the workers drain everything by 5 AM. The problem is only that critical results are handled strictly in the order they arrived, mixed in with routine ones.",
    answers: ["priority-queue"],
  },
  {
    id: "priority-queue-2",
    text: "A payments company reviews flagged transactions from a single stream of review jobs. Two kinds of jobs share it: live card authorizations that a customer is waiting on and must clear in under 3 seconds, and overnight merchant risk re-scoring that can wait until morning. At 9 PM a batch of 150,000 re-scoring jobs is submitted, and live authorizations submitted after it wait 8 minutes and get declined by timeout. Total capacity is sufficient for both kinds of work over a day. The team needs the live authorizations handled first even though they arrive after the batch.",
    answers: ["priority-queue"],
  },
  {
    id: "priority-queue-3",
    text: "A game studio's support platform turns every player report into a job on one shared work stream handled in arrival order. Paying subscribers are promised a first response within 15 minutes and free accounts within 48 hours. A bot wave dumped 90,000 free-account reports in an hour, and every subscriber report filed afterward waited 6 hours behind them, breaking the paid commitment for 400 customers. Adding processing power is affordable and total capacity is sufficient. The problem is only that subscriber reports are handled strictly in the order they arrived, behind the bot wave.",
    answers: ["priority-queue"],
  },
  {
    id: "priority-queue-4",
    text: "An industrial IoT platform ingests events from 30,000 factory sensors into a single stream processed in order. Most events are routine temperature and vibration readings sent every 10 seconds. A small number are equipment fault alarms that must reach the plant operator's screen within 5 seconds. During a shift start, routine readings surge to 60,000 per minute and a fault alarm raised at 6:02 AM does not reach the operator until 6:09 AM because it is behind 400,000 routine readings. The routine readings still need to be processed, just not ahead of alarms.",
    answers: ["priority-queue"],
  },
  {
    id: "priority-queue-5",
    text: "Your document processing SaaS puts every customer job into one shared work stream and handles them oldest first. Enterprise contracts promise a processed document within 5 minutes; self-serve accounts have no such promise. One self-serve customer submitted a 300,000-page bulk import at 8 AM, and for the next four hours every enterprise job submitted after it waited behind that import and took 3 hours instead of 5 minutes. Capacity across the day is sufficient. The team wants enterprise jobs handled ahead of bulk self-serve work, while still making sure the bulk import eventually finishes rather than sitting forever.",
    answers: ["priority-queue"],
  },
  {
    id: "claim-check-1",
    text: "A medical imaging company moved its scan processing onto a message broker. Each study carries the raw DICOM series, and a chest CT can be 180 MB, while the broker rejects anything over 256 KB. The team tried splitting studies into 700 chunk messages each, and broker CPU went to 90 percent while delivery latency for every other queue on the same cluster rose from 40 ms to 6 seconds. The scan files already sit in object storage after ingestion.",
    answers: ["claim-check"],
  },
  {
    id: "claim-check-2",
    text: "A drone survey startup publishes one message per flight to a topic that four services consume: stitching, defect detection, billing, and archive. The message body holds the full 400 MB image bundle, so the broker stores and copies it four times, and monthly broker storage costs hit 9,000 dollars. Only two of the four consumers ever open the images. Broker throughput dropped from 20,000 messages per second to 300 after the bundles were added. The images are already written to a bucket by the upload service before the message is sent.",
    answers: ["claim-check"],
  },
  {
    id: "claim-check-3",
    text: "A legal e-discovery system routes each uploaded evidence bundle through a workflow of six services connected by a message bus. Lawyers attach scanned documents and video, so a typical message body is 30 MB and the bus fails on anything over 100 MB. Every intermediate service must deserialize, decrypt, re-encrypt, and re-serialize the whole attachment set even though only the final review service opens the files. End-to-end processing went from 2 seconds to 45 seconds after attachments were embedded in the message. The team wants the bus to carry only small routing data.",
    answers: ["claim-check"],
  },
  {
    id: "claim-check-4",
    text: "A speech analytics vendor pushes each finished call recording into a queue for transcription. Recordings average 22 MB of WAV audio and peak at 180 MB for long support calls. The queue service charges per 64 KB billing unit, and the bill jumped to 14,000 dollars a month. Worse, the audio bytes now sit in the broker's storage, which is not covered by the company's encrypted-at-rest audit scope, and compliance flagged it. The recordings are simultaneously written to an encrypted bucket that is in scope.",
    answers: ["claim-check"],
  },
  {
    id: "claim-check-5",
    text: "An IoT platform for wind turbines collects 10-minute vibration waveforms from 4,000 turbines. Each waveform message is 8 MB and the ingestion topic is configured with a 1 MB per record limit, so 30 percent of records are rejected outright. Increasing the broker limit would require the premium tier at four times the price, and the team measured that broker replication traffic alone would saturate the 10 Gbps link. Consumers only need the waveform when an anomaly score crosses a threshold.",
    answers: ["claim-check"],
  },
  {
    id: "dead-letter-queue-1",
    text: "An e-commerce order pipeline reads from a queue and writes to a warehouse system. Last Tuesday a partner sent 12 orders with a malformed country code that throws a parse error every time. Because the consumer never acknowledges those messages, the broker keeps redelivering them, and the same 12 messages have now been attempted 400,000 times, filling the error logs and burning 40 percent of consumer capacity. Fresh orders are stuck behind them and the backlog is 90 minutes deep. Deleting them is not acceptable, because the partner integration team has to inspect each one and resubmit it once the country code is fixed.",
    answers: ["dead-letter-queue"],
  },
  {
    id: "dead-letter-queue-2",
    text: "A healthcare integration service consumes HL7 messages from a hospital feed. About 0.3 percent of messages reference a patient record that does not exist, and processing them always throws the same exception no matter how many times it runs. On-call gets paged nightly because the consumer's error rate never clears, and the same records cycle forever. Deleting them silently is not acceptable because the integration team must review every rejected record for the compliance report. The main feed itself only keeps messages for 24 hours, which is far shorter than the compliance review cycle.",
    answers: ["dead-letter-queue"],
  },
  {
    id: "dead-letter-queue-3",
    text: "A ride-hailing company's trip settlement worker pulls from a queue. After a schema change, 2,100 in-flight messages carry an old field layout the new worker cannot deserialize. Those messages are redelivered every 30 seconds and will keep failing until someone writes a converter, which will take two days. Meanwhile the worker fleet is spending most of its time on messages that can never succeed. Engineering needs the fleet to stop spending its time on those 2,100 messages today, while still having their exact bodies available in two days when the converter is ready.",
    answers: ["dead-letter-queue"],
  },
  {
    id: "dead-letter-queue-4",
    text: "A game studio processes in-app purchase receipts from a queue. A small number of receipts come from a jailbroken client and fail signature validation permanently. These bad receipts have accumulated to 8,000 messages, and because the consumer keeps retrying them, the visible queue depth alarm fires constantly and the team has learned to ignore it. Support still needs to look at individual bad receipts when a player complains. The studio needs queue depth to mean what it says again, without losing the bad receipts that support has to look at.",
    answers: ["dead-letter-queue"],
  },
  {
    id: "dead-letter-queue-5",
    text: "A logistics firm's customs filing service consumes shipment events. Roughly 40 events a day fail because a downstream broker rejects the tariff code, and no amount of retrying changes that. Right now the consumer catches the error and drops the message, and last quarter 3,400 shipments silently vanished with no record. The compliance team demands that every unprocessable event be preserved with its original body and headers for at least 14 days so it can be replayed after the tariff table is fixed. The main queue only keeps messages for 4 days.",
    answers: ["dead-letter-queue"],
  },
  {
    id: "idempotency-key-1",
    text: "A payments API charges customer cards. The mobile app's HTTP client has a 10 second timeout, but during a database slowdown some charge calls took 14 seconds and still completed on the server. The app retried, and 1,200 customers were charged twice in one afternoon, costing 38,000 dollars in refunds and chargeback fees. The server cannot tell a genuine second purchase from a retry of the first, because both requests look identical on the wire. The team cannot solve this by comparing request bodies, because a customer can legitimately buy the same item twice in a row for the same amount.",
    answers: ["idempotency-key"],
  },
  {
    id: "idempotency-key-2",
    text: "A bank's internal transfer service is called by a batch job over a flaky VPN link that drops about 1 in 500 connections mid-response. When the connection drops the job has no idea whether the transfer landed, so it calls again. Last month this produced 47 duplicate transfers totaling 2.1 million dollars, all reconciled by hand. Reading back the ledger before retrying does not work because there is no field that distinguishes a legitimate repeat transfer of the same amount to the same account. A retry after a dropped connection must not move money a second time, even though the job cannot tell whether its previous call landed.",
    answers: ["idempotency-key"],
  },
  {
    id: "idempotency-key-3",
    text: "A ticketing platform issues seat reservations over a POST endpoint. During a stadium onsale, users double-tap the buy button and the browser also auto-retries on 502 responses from the load balancer. The result was 900 people holding two reservations each for the same seat block, and the inventory count went negative. The endpoint is not naturally safe to call twice because each call decrements inventory and creates a new reservation row. The team cannot simply reject repeat calls, because a fan may genuinely buy two separate reservations within the same minute.",
    answers: ["idempotency-key"],
  },
  {
    id: "idempotency-key-4",
    text: "A payroll vendor exposes an endpoint that creates direct deposit batches. A customer's integration crashed after sending the request but before recording the response, so on restart it sent the same batch again and 4,300 employees were paid twice. The vendor's support team spent three weeks clawing money back. The fix must let the customer replay the exact same request safely after a crash and receive the original batch ID and status code back, including if the first attempt returned a 500. Comparing request bodies alone is not enough because two identical payroll runs can legitimately be submitted.",
    answers: ["idempotency-key"],
  },
  {
    id: "idempotency-key-5",
    text: "A food delivery app lets restaurants issue refunds through a partner API. The partner's client library retries any request that fails with a network error, up to three times. Over a week this produced 220 duplicate refunds worth 6,800 dollars, because each retry created a brand new refund record. The partner's client library cannot be changed, so the API itself has to make a repeated call within the next 24 hours return the first refund rather than moving money again.",
    answers: ["idempotency-key"],
  },
  {
    id: "valet-key-1",
    text: "A video platform lets creators upload source files that average 4 GB. Right now every byte streams through the API tier, and 60 upload pods spend 95 percent of their CPU copying bytes into object storage while the actual business logic uses almost nothing. Egress and compute for that copying costs 21,000 dollars a month, and a burst of 200 concurrent uploads still exhausts the pods' memory. Creators are authenticated in the app, but must not be able to reach anything other than their own upload, and that access must stop working within a few minutes.",
    answers: ["valet-key"],
  },
  {
    id: "valet-key-2",
    text: "A radiology portal serves study downloads that are 500 MB to 3 GB. The web tier reads each file from storage and streams it to the browser, so eight app servers stay pinned at their 1 Gbps network limit and a download takes 11 minutes. Doubling the fleet only doubles the cost without fixing the round trip, since the data is stored in a different region than the app. Patients log into the portal and are authenticated, but they must not be able to reach any study other than their own, and their access must stop working after 15 minutes.",
    answers: ["valet-key"],
  },
  {
    id: "valet-key-3",
    text: "A field inspection app used by 12,000 contractors uploads photo bundles of 200 MB from job sites over LTE. Every bundle currently goes through a small API service, which now needs 30 instances just to absorb the transfer and still returns timeouts during the 4 pm rush. The contractors are third parties on personal devices, so shipping long-lived storage credentials in the app is out of the question. Contractors are authenticated in the app, but must not be able to touch any bundle other than the one they are sending, and that access must lapse within three minutes.",
    answers: ["valet-key"],
  },
  {
    id: "valet-key-4",
    text: "A genomics service delivers 40 GB FASTQ result files to research customers. The download proxy is a Python app that holds one worker per active transfer, and with 50 concurrent downloads it runs out of file descriptors and the whole API goes down. Cross-region bandwidth charges from proxying add 8,000 dollars a month even though the app does nothing to the bytes. Customers authenticate to the service already, but their institution's cluster nodes are untrusted machines that should get read access only to the specific result files they paid for, for a bounded window.",
    answers: ["valet-key"],
  },
  {
    id: "valet-key-5",
    text: "A dashcam vendor collects 1.5 GB incident clips from 80,000 vehicles. The current upload endpoint is a fleet of servers whose only job is to receive the bytes and forward them into storage, and it costs 45,000 dollars a month while adding two extra network hops. Vehicles are physically accessible to owners and can be tampered with, so an embedded permanent storage credential would leak. A tampered vehicle must never be able to overwrite a clip it already sent or read another vehicle's clips, and whatever access it holds must lapse after five minutes.",
    answers: ["valet-key"],
  },
  {
    id: "api-gateway-1",
    text: "We run a ride hailing platform that grew from 3 services to 17 over two years. The iOS and Android apps ship a hardcoded list of 17 public hostnames, one per service, and each app build knows which service owns which path. Last month we split the payments service into a wallet service and a settlement service, and we had to publish an emergency app release because the old hostname stopped answering half the paths. Every one of the 17 services also carries its own copy of token validation code, and three of them are two versions behind on the shared auth library. We want the apps to call one address, and for us to move, split, or rename services behind it without touching the app.",
    answers: ["api-gateway"],
  },
  {
    id: "api-gateway-2",
    text: "Our online grocery site has a browser app that talks to 9 separate services over 9 different domains. Each service maintains its own CORS allow list, its own TLS certificate, and its own copy of the JWT check, and two of them disagree about whether an expired token returns 401 or 403. When the catalog team moved search into a new service last sprint, the browser app broke because it still pointed at the old address. We want the browser to know exactly one hostname and one set of paths, with routing to the right internal service and token checking done in one place before anything reaches those services.",
    answers: ["api-gateway"],
  },
  {
    id: "api-gateway-3",
    text: "We sell a hospital scheduling product and 40 clinic software vendors integrate with us. Right now each vendor is given the addresses of 6 of our internal services and told which one owns appointments, providers, rooms, insurance checks, and so on. Every time we reorganize internal ownership, we have to email 40 vendors and support the old addresses for a year. Vendors also each implement our auth handshake slightly differently, and we cannot enforce a request rate limit consistently because there is no single place all their traffic passes through. We want one published entry point that hides which internal service handles what.",
    answers: ["api-gateway"],
  },
  {
    id: "api-gateway-4",
    text: "Our multiplayer game backend is 12 services, and most of them do not speak anything a client can use. Matchmaking and inventory are gRPC only, the presence service uses a custom binary protocol over raw TCP, and two older services still expose SOAP. The game client and the companion phone app both need data from all of these, so we have been embedding protocol adapters into every client build, and a change to the presence wire format broke both clients at once. We want both clients to speak plain HTTP to one address, and an internal wire format change to stop reaching client builds.",
    answers: ["api-gateway"],
  },
  {
    id: "api-gateway-5",
    text: "At our bank, 22 microservices each have their own public load balancer. Token validation is copy-pasted into all 22 codebases, request logging formats differ, and when compliance asked which services accept traffic from the internet, it took a week to answer. Clients, including our web app and our ATM fleet software, hold a config file mapping features to service URLs, and that file has drifted between deployments. We want one internet-facing entry point for all 22, with the access token checked once before a request reaches any of them, and clients no longer holding a map of feature to service URL.",
    answers: ["api-gateway"],
  },
  {
    id: "backends-for-frontends-1",
    text: "Our video streaming service has three clients on one shared API: a smart TV app, an iOS app, and a desktop browser app. The TV app wants only 8 fields per title because its runtime chokes on the 60-field payload, the browser app wants all 60 plus editorial copy, and the iOS team keeps asking for a different page size. The shared API now has 14 query flags like fields=tv_minimal and layout=web2 that exist only to keep one client happy. Every change needs sign-off from all three client teams plus the API team, so a two-line field addition took 5 weeks. Each client team wants to shape and ship its own responses on its own schedule without waiting on the others.",
    answers: ["backends-for-frontends"],
  },
  {
    id: "backends-for-frontends-2",
    text: "We build logistics software with a driver Android app and a dispatcher web console, both hitting one shared API service. The driver app needs tiny responses and a single active stop at a time because drivers are on rural cellular. The dispatcher console needs 500 stops with full address history in one screen. The single API team gets conflicting tickets from both sides every sprint, and a change made for dispatchers last month doubled the driver payload and increased app crashes on old handsets. Both client teams want to stop having their payloads shaped by the other's requirements, and to release when they choose.",
    answers: ["backends-for-frontends"],
  },
  {
    id: "backends-for-frontends-3",
    text: "Our retail company has one API service serving a mobile shopping app and an in-store associate terminal. The mobile team writes Kotlin, the terminal team writes C#, and the shared API is a Java monolith owned by a fourth team that neither client team can commit to. The shared service now has if-blocks on a client-type header in 30 endpoints, and its test suite takes 45 minutes because it covers both clients' rules. A terminal-only pricing change broke mobile checkout twice this quarter. Leadership wants each client team working in its own language and on its own release schedule, with token checking and rate limits staying in the shared entry layer already in front.",
    answers: ["backends-for-frontends"],
  },
  {
    id: "backends-for-frontends-4",
    text: "A healthcare portal serves two very different audiences from one API: a clinician web workstation and a patient phone app. Clinicians need full chart histories, 200 rows at a time, with lab values and provider notes. Patients need a summary of the next appointment and 5 recent results, and they must never receive provider notes at all, but the shared response object contains them and the app filters client-side. The single API team is now the bottleneck for both roadmaps, and the shared object makes it hard to prove that patient responses never carry clinician-only fields. We want to be able to prove that a patient response can never carry a clinician-only field, and to stop one API team gating both roadmaps.",
    answers: ["backends-for-frontends"],
  },
  {
    id: "backends-for-frontends-5",
    text: "Our ad platform has an advertiser dashboard in the browser and a rep-facing tablet app, both calling one shared reporting API. The tablet needs 20 rows with 6 columns and pre-rounded numbers, the dashboard needs 10,000 rows with raw values for its own charting. The shared API is now three code paths deep in per-client branching, its owning team runs a 3 week ticket queue, and neither client team can ship a screen change without entering that queue. We want each client team shipping its own screen changes without entering that queue, keeping login checks and request logging in the layer already sitting in front of both.",
    answers: ["backends-for-frontends"],
  },
  {
    id: "gateway-aggregation-1",
    text: "Our insurance mobile app opens a claim detail screen that makes 7 separate HTTPS calls: claim, policy, adjuster, photos, payment status, repair shop, and messages. On cellular each round trip costs about 380 ms, so the screen takes 2.7 seconds to fill in, and roughly 3 percent of sessions lose one of the 7 responses entirely and render a half-empty screen. The 7 services all live in the same data center and each responds in under 30 ms, so the time is almost all network. The app cannot keep paying 7 cellular round trips for one screen, and the decision about what to do when one of the 7 is slow belongs on our side rather than in the app.",
    answers: ["gateway-aggregation"],
  },
  {
    id: "gateway-aggregation-2",
    text: "We monitor farm equipment, and the field technician tablet connects over satellite with a 700 ms round trip. Opening a machine's status page fires 12 requests to 12 services for engine hours, fault codes, firmware version, warranty, parts, and so on. That is 8.4 seconds of pure waiting even though every service answers in about 15 ms locally. Technicians on bad links often see 2 or 3 of the 12 panels fail. The tablet cannot keep paying 12 satellite round trips for one page, and technicians should stop seeing panels fail on a bad link.",
    answers: ["gateway-aggregation"],
  },
  {
    id: "gateway-aggregation-3",
    text: "Our food delivery app's order tracking screen calls the order service, the courier location service, the restaurant service, the ETA service, and the promotions service, one request each, every 5 seconds while an order is active. That is 5 connections per poll per phone, and at dinner peak we see 40,000 active orders, so 200,000 requests every 5 seconds mostly spent on connection setup and headers. Each backend responds in under 20 ms. We need to cut the per-poll connection count without changing how often the screen refreshes, and we need a defined answer for when promotions is slow.",
    answers: ["gateway-aggregation"],
  },
  {
    id: "gateway-aggregation-4",
    text: "Airline check-in kiosks sit in airports on links with 250 ms round trips to our data center. Starting a check-in makes 9 sequential calls: reservation, passenger, seat map, bag rules, visa check, loyalty, upgrade offers, payment token, and boarding pass eligibility. Passengers wait about 3 seconds staring at a spinner before the first field appears. The services themselves are fast and colocated. Nearly all of that 3 seconds is the 9 round trips, and when a check-in is slow we need to know which internal call caused it.",
    answers: ["gateway-aggregation"],
  },
  {
    id: "gateway-aggregation-5",
    text: "Our banking app's home screen needs balances, recent transactions, card status, rewards points, alerts, and pending transfers. Today the app fires 6 requests in parallel from the phone. On 3G we measure 1.9 seconds to paint the full screen and about 4 percent of loads where at least one of the 6 never returns, leaving a blank tile. All 6 services sit in the same cluster and respond in 10 to 25 ms. The home screen cannot keep paying 6 mobile round trips, and the rewards tile should be dropped rather than blocking the screen when it goes past 200 ms.",
    answers: ["gateway-aggregation"],
  },
  {
    id: "cache-aside-1",
    text: "Our e-commerce product page reads a single row by SKU on every view. Traffic is 12,000 page views per second and about 92 percent of them land on the same 4,000 SKUs. The database is at 88 percent CPU purely from those repeated single-row lookups, each taking 6 ms, and reads outnumber writes about 900 to 1. Prices and titles change a handful of times a day through an admin tool, and the business says a few minutes of staleness on a product title is fine but a stale price after an edit is not. The database cannot keep serving 12,000 repeated lookups a second, and an admin price edit must be visible on the very next read.",
    answers: ["cache-aside"],
  },
  {
    id: "cache-aside-2",
    text: "In our mobile game, every match start reads the item definition row for each of the 10 players' loadouts, keyed by item id. That is roughly 45,000 single-row reads per second against a table of 8,000 rows that designers edit maybe twice a week. Each read takes 4 ms and the database is now our biggest bill line. The rows are small, about 2 KB each, and the whole table would fit in a few hundred megabytes of memory. The database bill cannot keep growing with match volume, and a designer's edit must stop the old definition from being served.",
    answers: ["cache-aside"],
  },
  {
    id: "cache-aside-3",
    text: "Our ad bidding service must read a campaign's targeting record by campaign id before it can bid, and it has 80 ms total to respond. We handle 200,000 bid requests per second across roughly 3,500 active campaigns, so the same few thousand records are read over and over. The database lookup averages 3 ms and spikes to 40 ms under load, which is what causes our timeouts. Campaign settings change when advertisers edit them, which is a few hundred times an hour, and a 60 second delay in picking up an edit is acceptable. We cannot spend 40 ms on a targeting lookup inside an 80 ms budget, and an advertiser's edit should take effect within a minute.",
    answers: ["cache-aside"],
  },
  {
    id: "cache-aside-4",
    text: "Our clinic billing system checks insurance eligibility by calling a payer's external API, which takes 800 ms and costs us 2 cents per call. Front desk staff check the same patient's eligibility 4 or 5 times during a visit, and we make about 60,000 calls a day for only 14,000 distinct patients. Eligibility for a given patient and payer does not change during a day. We are paying the payer four or five times for an answer that cannot change during the day, and the front desk cannot wait 800 ms each time.",
    answers: ["cache-aside"],
  },
  {
    id: "cache-aside-5",
    text: "Our streaming catalog service serves title metadata by title id, one row per request, to the apps. We do 30,000 reads per second, and 5 percent of titles account for 80 percent of those reads. Each read is a simple key lookup that takes 5 ms, but the volume keeps the database near its connection limit and read replicas are already maxed. Metadata for a title changes rarely, mostly when artwork or descriptions are updated by the content team, and a couple of minutes of staleness is fine. There is no headroom left in the database, and a published artwork update should appear within a couple of minutes.",
    answers: ["cache-aside"],
  },
  {
    id: "sharding-1",
    text: "Our payments company keeps every card authorization in one PostgreSQL primary. The table is now 11 TB and grows about 900 GB a month, and we are writing 38,000 rows per second at peak. We already moved to the largest instance the cloud vendor sells, so there is no bigger box left to buy. Read replicas do not help because the pressure is writes and disk, not reads. We need to keep adding capacity as volume grows, and nearly every query is scoped to a single merchant account.",
    answers: ["sharding"],
  },
  {
    id: "sharding-2",
    text: "A factory sensor platform ingests readings from 2.4 million devices, about 60,000 inserts per second. Everything lands in a single time-series database server that is at 94 percent disk and pegs CPU during the morning shift. Vertical scaling has run out: we are on the top instance size and the vendor has nothing larger. Almost every query asks for one device's readings, so we do not need cross-device joins. We need a way to keep adding capacity as devices are added, and no query needs data from more than one device.",
    answers: ["sharding"],
  },
  {
    id: "sharding-3",
    text: "Our multi-tenant HR product has 14,000 companies in one MySQL database. Three enterprise customers now account for 60 percent of the 8 TB of data and their bulk imports slow queries for everyone else. Backups take 9 hours and a restore would take longer than our recovery target. Contracts with two of the big customers also require their employee records to sit on separate servers. We also need to be able to move a single large tenant onto different hardware later without changing application code.",
    answers: ["sharding"],
  },
  {
    id: "sharding-4",
    text: "A mobile game stores player inventory in one document database cluster. We passed 90 million accounts, the working set no longer fits in the 768 GB of RAM on the primary, and p99 writes went from 12 ms to 340 ms as the disk started thrashing. Every inventory operation touches exactly one player, and we never join across players. Storage is projected to double again in eight months. We need capacity to keep pace as storage doubles again, and no operation needs data from more than one player.",
    answers: ["sharding"],
  },
  {
    id: "sharding-5",
    text: "A freight tracking service records every scan event for parcels. One database now holds 6.2 billion rows and takes 1.5 TB of new data per week, and the nightly vacuum no longer finishes before the morning peak. Adding CPU and disk to the single server has stopped helping and we are at the vendor's maximum size. Nearly all queries look up one tracking number at a time. We need room to keep growing, and we need to be able to move data between machines later without rewriting queries.",
    answers: ["sharding"],
  },
  {
    id: "materialized-view-1",
    text: "A hospital operations dashboard shows bed occupancy, average length of stay, and readmission counts per ward for the last 90 days. The query behind it joins seven normalized tables and runs a group-by over 40 million admission rows, taking 38 seconds. Charge nurses open the dashboard about 200 times an hour and the numbers only need to be accurate to the last 15 minutes. The source tables cannot be reshaped because the clinical system writes to them. Whatever we build has to be reproducible from the clinical tables at any point, since it cannot become the record of truth.",
    answers: ["materialized-view"],
  },
  {
    id: "materialized-view-2",
    text: "An ad platform gives each advertiser a performance page with spend, impressions, clicks, and cost per click broken down by campaign and day. Building that page runs a query that scans a 900 million row impression table and joins it to campaigns and billing rates, taking 22 seconds per advertiser. Advertisers reload the page constantly during business hours. The raw impression rows must stay as they are because finance audits them. Advertisers can tolerate figures that are ten minutes old, but not a 22 second page.",
    answers: ["materialized-view"],
  },
  {
    id: "materialized-view-3",
    text: "A video site shows each channel a page with total watch minutes, subscriber count, and top ten videos for the last 28 days. That page joins the view-events table, the subscription table, and the video metadata table, and the aggregation takes 45 seconds on a channel with a large back catalog, so the page times out. Creators load it many times a day and are fine with figures that are up to an hour old. That cost cannot be paid on every page load, and the page must stop timing out.",
    answers: ["materialized-view"],
  },
  {
    id: "materialized-view-4",
    text: "A bank's relationship managers open a customer overview that sums balances across checking, savings, loans, and credit cards, then computes total exposure and a 12-month average balance. The overview query touches five normalized tables in different schemas and takes 14 seconds, and managers open around 3,000 overviews a day. The source tables are owned by the core banking system and cannot change. Numbers refreshed once overnight would satisfy the business. Whatever we build must be safe to throw away and regenerate from the core tables, which stay the record of truth.",
    answers: ["materialized-view"],
  },
  {
    id: "materialized-view-5",
    text: "An online grocer's category browse page shows, for each of 8,000 categories, the item count, the lowest current price, and the number of items in stock. Producing it joins products, prices, and warehouse stock across 30 million rows and takes 18 seconds per category. Shoppers hit these pages 4,000 times a minute. Stock changes constantly but the page is allowed to be five minutes stale. The 18 second join cannot be paid 4,000 times a minute, and five minute old counts are acceptable.",
    answers: ["materialized-view"],
  },
  {
    id: "index-table-1",
    text: "Our order service stores orders in a key-value store where the key is the order ID, and that store offers no way to query by any other field. Support agents constantly ask for all orders belonging to a customer email address, and the only way to answer today is a full scan of 400 million items, which takes minutes and burns our read budget. Customers place roughly 900 orders a second, so the lookup structure has to be kept current as orders are written. Whatever we add has to keep up with 900 writes a second, and lagging the real orders by a second or two is acceptable.",
    answers: ["index-table"],
  },
  {
    id: "index-table-2",
    text: "A ride-hailing app keeps driver records in a store partitioned by a hash of the driver ID, which spreads writes nicely but makes any other lookup a fan-out across all partitions. Compliance now needs to pull every driver whose license was issued in a given state, and that query currently touches all 64 partitions and takes 30 seconds. The store has no secondary index feature. Compliance runs this query rarely, but it has to answer in seconds instead of touching all 64 partitions.",
    answers: ["index-table"],
  },
  {
    id: "index-table-3",
    text: "A music catalog is stored with the album ID as the primary key in a wide-column store that does not support querying on any non-key column. The app now needs to list all tracks featuring a given performer, and today that means scanning 120 million track rows. Performer lookups happen about 5,000 times a minute and catalog rows change only a few times a day. Performer lookups cannot keep scanning 120 million rows, and since the catalog changes only a few times a day, some lag is acceptable.",
    answers: ["index-table"],
  },
  {
    id: "index-table-4",
    text: "A medical records system keeps patient documents keyed by an internal patient ID in a document store with no secondary index support. Billing staff arrive with an insurance member number instead and need the matching patient, and the current workaround scans 12 million documents and takes 40 seconds per lookup. Member numbers are unique and staff run about 600 of these lookups an hour. Billing staff need the member number lookup to answer immediately, and a brand new patient not being findable for a few seconds is acceptable.",
    answers: ["index-table"],
  },
  {
    id: "index-table-5",
    text: "Warehouse inventory items live in a store keyed by SKU, and the store cannot query on any other attribute. Floor staff scan a physical pallet barcode and need the SKU behind it, but that lookup currently walks all 8 million item records and takes 25 seconds on a handheld scanner. There are about 11 million distinct pallet barcodes and each maps to exactly one SKU. Item records change perhaps twice a day. The handheld scanner cannot wait 25 seconds, and since item records change twice a day, some lag is acceptable.",
    answers: ["index-table"],
  },
  {
    id: "cqrs-1",
    text: "Our brokerage order management service has one set of classes used both for placing orders and for displaying them. The placing side has thick rules: margin checks, position limits, and regulatory eligibility, and those classes have picked up dozens of display-only fields and getters added purely so screens can render. Meanwhile order placement runs at 400 writes per second while the blotter screens run 60,000 reads per second and need a completely different shape, denormalized per screen. We want the rules code to stop absorbing display concerns, and the blotter served from storage shaped for its screens, accepting a few seconds of lag there.",
    answers: ["cqrs"],
  },
  {
    id: "cqrs-2",
    text: "An insurance claims system uses the same domain objects for adjudication and for the customer-facing status page. Adjudication needs deep validation, coverage rules, and state transitions, so those objects are large and slow to load. The status page just needs claim number, stage, and expected payout, but it loads the full object graph and takes 900 ms. Claim updates run at 30 per second and status page views at 12,000 per second, and the two loads want completely different indexes and scaling. The status page cannot keep loading the adjudication object graph, and the two workloads want different indexes and different scaling.",
    answers: ["cqrs"],
  },
  {
    id: "cqrs-3",
    text: "A hotel booking backend has one model handling both reservations and search results. The booking rules keep growing, overlapping stays, rate plans, cancellation windows, and every new screen adds fields to those same classes just for display, so the rules code is getting hard to change safely. Bookings run around 200 per second, while availability and reservation-list reads run near 80,000 per second and would be happier in a store tuned for reads. Reads being a couple of seconds behind a booking is acceptable to the business. We want display fields to stop landing in the booking rules classes, and reads served from storage tuned for reads.",
    answers: ["cqrs"],
  },
  {
    id: "cqrs-4",
    text: "Our warehouse management service shares one set of entities between the code that records stock movements and the code that renders picker dashboards. The movement code carries the real business rules such as allocation and lot tracking, but it now also carries 40 display fields and mapping helpers, and every dashboard change risks breaking the movement rules. Movements happen 150 times per second, dashboards are read 25,000 times per second, and each wants a different database shape. A dashboard change must stop being able to break the stock movement rules, and each side needs a different database shape.",
    answers: ["cqrs"],
  },
  {
    id: "cqrs-5",
    text: "A telecom provisioning service uses the same objects for activating service and for the customer portal. Activation involves heavy rules across SIM, plan, and network state, while the portal only shows a few fields, yet portal traffic is 200 times the activation traffic and the shared objects force the portal to load everything. Adding a portal field means editing the class that enforces activation rules, and two outages traced back to exactly that. Portal data being a few seconds stale is fine. A portal field must stop being an edit to the activation rules, and the portal needs storage sized for its own traffic rather than activation's.",
    answers: ["cqrs"],
  },
  {
    id: "event-sourcing-1",
    text: "You maintain the ledger service at a consumer bank. The accounts table holds one row per account with a current balance column, and every deposit, fee, and transfer updates that column in place. Last week a customer opened a dispute claiming her balance was wrong at 2:14pm on a Tuesday three months ago, and the only thing you could offer was a nightly backup taken at midnight. Support also asks weekly how an account reached its present figure and in what order the amounts were applied, and nobody can answer without guessing. The team needs to answer what an account held at any past minute, not just at midnight, and to stop guessing at the order.",
    answers: ["event-sourcing"],
  },
  {
    id: "event-sourcing-2",
    text: "You work on the medication ordering module of a hospital records system. A prescription row is updated in place when a doctor changes a dose, a pharmacist adjusts a frequency, or a nurse marks a hold. During a regulatory review the auditors asked what the exact dose was at 3:00pm on a given day and who changed it in the twenty minutes before, and the answer was not in the database. Someone bolted on a shadow history table two years ago, but it only tracks three of the eleven columns and was silently broken for six months. Leadership wants an answer to what the dose was at any past minute and who changed it, covering all eleven columns rather than three.",
    answers: ["event-sourcing"],
  },
  {
    id: "event-sourcing-3",
    text: "You are on the inventory team for a multiplayer game with 900,000 daily players. A duplication bug let roughly 4,000 accounts craft an item twice, and the item rows now show only the final quantity, so you cannot tell which accounts were affected or what they held before the bug shipped. You also cannot reproduce the sequence in a test environment because the player's chain of pickups, trades, and crafts was never kept, only the end result. The team needs to identify which accounts were affected, re-run one player's exact sequence in staging, and put an account back to what it held before the bad release.",
    answers: ["event-sourcing"],
  },
  {
    id: "event-sourcing-4",
    text: "You maintain the claims platform at an auto insurer. A claim row carries a status column that moves through submitted, assigned, estimated, approved, and paid, and adjusters constantly ask how a specific claim reached its current status and when each move happened. Worse, the legal team asked the team to recompute payouts for the last 18 months under a corrected calculation rule, and there is no way to do it because only the final numbers survive. Each nightly update overwrites the previous values with no trace. You need both of those answered out of the stored data itself, rather than from numbers the nightly update has already overwritten.",
    answers: ["event-sourcing"],
  },
  {
    id: "event-sourcing-5",
    text: "You run the stock system for a warehouse network with 42 sites. The on_hand column per SKU per site is incremented and decremented by receipts, picks, cycle counts, and damage write-offs, roughly 3 million updates a day. A bad deploy last month double-decremented for 90 minutes and left the counts wrong, and the only recovery was a full physical recount at eleven sites. Finance separately asks for the exact quantity on hand at midnight for each of the last 90 days, which nobody can produce. You need to correct wrong counts without a physical recount, and to answer what was on hand at midnight on any of the last 90 days.",
    answers: ["event-sourcing"],
  },
  {
    id: "database-per-service-1",
    text: "Your company split its monolith into six services two years ago, but all six still connect to the same Postgres instance with the same credentials, and each one issues SELECTs and UPDATEs against any table it likes. Last sprint your team tried to rename a column in the orders table and discovered four other services querying it directly, so the change needed a coordination meeting and a shared release window. Every deploy now goes out on Thursday nights together because a migration for one service can break another. Nobody can say who owns the customers table, and two teams have written conflicting update logic against it.",
    answers: ["database-per-service"],
  },
  {
    id: "database-per-service-2",
    text: "You are on the catalog team at a video streaming company. Catalog data is deeply nested with variable metadata per title, and you want to move it to a document store to stop maintaining eleven join tables. You cannot, because the recommendations service, the search indexer, and the billing entitlement service all run their own SQL joins straight against your normalized tables. Any storage change you make would break three teams you do not control, so the migration has been blocked for a year. The architects want a storage choice to stop being a decision three other teams can block.",
    answers: ["database-per-service"],
  },
  {
    id: "database-per-service-3",
    text: "You work at a ride-hailing company where both the driver service and the pricing service write to the same drivers table. Last month 1,200 drivers ended up with a status value that neither team's documentation allows, and after two days of investigation nobody could prove which code path wrote it because both have INSERT and UPDATE rights on every column. Validation rules exist in the driver service, but the pricing service bypasses them entirely by writing directly. The driver team needs its validation rules to be unavoidable, and needs to be able to prove which code wrote a bad status.",
    answers: ["database-per-service"],
  },
  {
    id: "database-per-service-4",
    text: "Your HR SaaS product runs nine services against one shared MySQL server. When the payroll team needs a schema migration that locks a large table for four minutes, all nine services go down together, so migrations happen quarterly at 2am with the whole engineering org on a call. Connection limits are also shared, and last quarter the reporting service opened 400 connections and starved the login service. Every service uses the same database user with full rights across all schemas, so nothing stops one team from reading another team's tables. The team wants a payroll migration to stop taking the other eight services down with it, and one team's connection use to stop starving another's.",
    answers: ["database-per-service"],
  },
  {
    id: "database-per-service-5",
    text: "You joined an ad tech firm where campaign, targeting, and billing were split into separate deployable services, but they were never separated at the storage layer. A campaign write touches tables owned conceptually by all three, and the billing team's code contains a join across seven tables belonging to the other two teams. When targeting wanted to add a required column, the billing team's queries failed in production because they use SELECT star against those tables. Each team wants to release on its own schedule, and right now a schema change by any of them forces the other two to redeploy in lockstep.",
    answers: ["database-per-service"],
  },
  {
    id: "change-data-capture-1",
    text: "You work at a retailer whose inventory of record lives in a 22-year-old vendor application on Oracle. You have no source code, the vendor contract forbids modifying it, and the vendor will not add any message publishing. Your storefront search index and your store-pickup availability page need stock numbers that are no more than a few seconds stale, but today they are fed by a CSV export that runs at 2am, so items sell out online for 18 hours after they are gone. A job that polls the last_modified column was tried and it both added noticeable load and silently missed discontinued items, which are deleted rather than flagged. You need every insert, update, and delete, including the deletes, within a few seconds, without adding load to the vendor application and without changing it.",
    answers: ["change-data-capture"],
  },
  {
    id: "change-data-capture-2",
    text: "You are the data engineer at a hospital group. Admissions, discharges, and transfers are recorded by a purchased clinical records product on SQL Server that your team is contractually barred from altering, so getting it to emit messages is off the table. The bed management dashboard and the analytics warehouse currently reload the whole patient stay table every 30 minutes, taking 12 minutes each run and hammering the production instance. Clinicians need bed status within about 5 seconds. None of that can involve extra work by the clinical product, and a consumer that goes offline has to be able to catch up afterward.",
    answers: ["change-data-capture"],
  },
  {
    id: "change-data-capture-3",
    text: "Your bank's core account system is a mainframe application that gets one release a year through a vendor. The fraud scoring service needs to see balance and address changes within 2 seconds, but the only current path is a nightly batch file, so fraud rules are running on data up to 22 hours old. Asking the mainframe team to add publishing calls was quoted at 14 months and rejected. Whatever is built has to serve fraud, the warehouse, and a new search service at that freshness, without a single line changed in the mainframe application.",
    answers: ["change-data-capture"],
  },
  {
    id: "change-data-capture-4",
    text: "You support a manufacturing company that runs a licensed ERP suite on Postgres for work orders and bills of material. Three newer systems, a shop-floor display, a supplier portal, and a machine learning demand model, all need to react when a work order quantity or due date changes. The ERP is closed source and support is voided if you add triggers or modify its schema. Right now each of the three systems runs its own 60-second query against the ERP tables, and together they add 30 percent to the database's load and still miss rows that get deleted. You need the three systems to learn about work order changes without polling the ERP, without touching its schema, and without missing deleted rows.",
    answers: ["change-data-capture"],
  },
  {
    id: "change-data-capture-5",
    text: "You are at an ad tech company where advertiser accounts live in an old in-house CRM nobody is allowed to touch. The last engineer who understood its PHP code left in 2019, and management has frozen it pending a replacement that is two years out. Meanwhile your feature store needs advertiser attribute updates within seconds because stale budget caps caused 40,000 dollars of overspend last quarter. A timestamp-based polling job runs every minute today, but it never notices when an advertiser row is deleted, so closed accounts keep serving. You need advertiser changes, including deletions, delivered within seconds, with no change to the frozen application.",
    answers: ["change-data-capture"],
  },
  {
    id: "transactional-outbox-1",
    text: "You own the refunds service at a payments company, and your code you fully control does two things per refund: it commits a row to its own Postgres, then calls the message broker to tell settlement, notifications, and accounting. During a rolling deploy last Tuesday the pod was killed between those two lines, and 63 refunds were committed with no message ever sent, so customers were refunded and never told. The opposite also happens: the broker call succeeds, then the transaction rolls back on a constraint violation, and consumers act on a refund that does not exist. You need the refund row and the notification to either both take effect or neither, using only the local transaction you already have.",
    answers: ["transactional-outbox"],
  },
  {
    id: "transactional-outbox-2",
    text: "Your food delivery order service saves an order to MySQL and then publishes a message so the courier dispatch and restaurant terminal services can react. When the broker had a 90-second outage at dinner rush, 2,400 orders committed successfully and no message was published, so restaurants never saw them and refunds cost the company 31,000 dollars. Your team tried wrapping both in a two-phase transaction across the database and the broker, and throughput dropped from 900 to 120 orders per second. You need a committed order to always result in a published message eventually, even across a 90 second broker outage, without paying the two-phase commit cost.",
    answers: ["transactional-outbox"],
  },
  {
    id: "transactional-outbox-3",
    text: "You are on the line activation service at a telecom carrier. Activating a SIM writes four rows to your service's own database and must then notify the provisioning, billing, and SMS welcome services. Right now the notification is published first because a developer wanted to avoid losing it, which means about 200 times a day a notification goes out and the subsequent database write fails, leaving billing charging for a line that was never activated. Moving the publish after the commit just swaps the failure to lost notifications when the process restarts. Your team controls all of this code and needs an ordering where neither failure is possible: no notification without an activation, and no activation without an eventual notification.",
    answers: ["transactional-outbox"],
  },
  {
    id: "transactional-outbox-4",
    text: "You maintain the shipment service at a logistics company. Each time a package is scanned, your code updates the shipment row and then publishes a notification for the customer tracking page and the carrier reconciliation job. Monitoring shows a steady 0.4 percent gap between committed scan rows and messages seen by consumers, roughly 4,000 missing notifications a day, and it always spikes when the service autoscales down and instances are terminated mid-request. Retrying the publish inside the request handler does not help because the process itself disappears. You need that 0.4 percent gap closed even though instances are terminated mid-request, which rules out anything that only runs inside the request handler.",
    answers: ["transactional-outbox"],
  },
  {
    id: "transactional-outbox-5",
    text: "You are building a subscription service for a streaming product. When a subscription is upgraded, your service writes the new plan row and must tell the entitlement and invoicing services, and order matters because two rapid upgrades must be seen downstream in the sequence they were committed. Today the publish happens after the commit in application code, and under load the two publishes sometimes arrive out of order, plus any crash between commit and publish drops the message entirely. Auditors found 11 accounts last month whose stored plan and downstream entitlement disagree permanently. You need downstream services to see the upgrades in commit order, and to never miss one when the process dies between the write and the send.",
    answers: ["transactional-outbox"],
  },
  {
    id: "saga-1",
    text: "You work on a food delivery backend that was recently split into four services: orders, payments, restaurant inventory, and courier dispatch. Each one owns its own Postgres database and no service can read another's tables. Placing an order has to reserve the items, charge the card, and assign a courier, and right now the order service tries to do all three inside one wrapping transaction that has no way to roll back once the payment provider has already charged. About 900 orders a day end up with a charged card and no courier, and support fixes them by hand. You need placing an order to behave as one business operation across the four services, even though nothing can hold a transaction across them, and a charged card must never be left without a courier.",
    answers: ["saga"],
  },
  {
    id: "saga-2",
    text: "A mobile carrier is building a new SIM activation flow. Activating a line touches four separate systems, each with its own database: the customer account service, the number inventory service that assigns a phone number, the network provisioning service that turns the line on, and the billing service that starts the monthly charge. There is no shared database and no way to hold one transaction across all four, and provisioning alone takes 8 to 40 seconds so nothing can wait on a single lock. Right now the activation code just calls the four services in a row over HTTP and gives up wherever it breaks, leaving lines half activated. The team needs the four steps to behave as one business operation with nothing left half done.",
    answers: ["saga"],
  },
  {
    id: "saga-3",
    text: "You are designing the policy issuance flow for a car insurance company. Issuing a policy means the underwriting service records the accepted risk, the document service generates and files the signed contract, the payments service takes the first premium, and the claims service opens an eligible coverage record. Each of those four is a separately deployed service with its own database, and the DBA team will not enable two-phase commit across them. The product owner wants one API call for the agent, but you know that call cannot be one atomic write. You need the four writes to behave as one business operation, so a rejected premium cannot leave a live policy behind.",
    answers: ["saga"],
  },
  {
    id: "saga-4",
    text: "A freight logistics platform books a shipment across three services it owns: the capacity service that holds a truck slot, the customs service that files the paperwork with a broker, and the invoicing service that creates the accounts receivable record. Each service has its own database, and the three run in different regions with 80 to 200 ms of network delay between them, so a single locking transaction would hold rows far too long. Today the booking API calls them one after another and roughly 2 percent of bookings fail at the customs step, leaving a truck slot held forever and no invoice. You need the whole booking to behave as one business operation, so a customs failure cannot leave a truck slot held forever with no invoice.",
    answers: ["saga"],
  },
  {
    id: "saga-5",
    text: "You are on a team building patient referrals for a hospital network. A referral has to create a record in the scheduling service, reserve a slot in the specialist clinic service, update the coverage check in the benefits service, and notify the records service, all four of which are independent services with separate databases after last year's split. The old monolith did this in one database transaction, and after the split there is nothing that plays that role. Referrals now fail halfway about 40 times a week and leave a clinic slot held for a patient with no appointment. The referral has to behave as one business operation again, with no clinic slot left held for a patient who has no appointment.",
    answers: ["saga"],
  },
  {
    id: "compensating-transaction-1",
    text: "Your travel booking workflow already runs its steps in order through an orchestrator, and each step calls a separate supplier: a flight, a rental car, and a hotel. When the hotel call fails after retries are exhausted, the flight and the car are already confirmed with the suppliers and money has moved. Undoing them is not a database rollback, because canceling a flight within 24 hours means calling the supplier's cancel API and accepting a 15 percent fee, and the car cancel returns the deposit but not the booking fee. Right now an on-call engineer reads the log and makes those cancel calls by hand, roughly 30 times a week. You need that undo work to happen on its own when the hotel step gives up, with a human pulled in only when an undo call itself keeps failing.",
    answers: ["compensating-transaction"],
  },
  {
    id: "compensating-transaction-2",
    text: "A payroll platform runs a monthly pay cycle as a long workflow across six external systems: a bank ACH file, a tax filing vendor, a benefits vendor, a 401k provider, a general ledger, and an email notifier. Last month the tax vendor rejected the batch at step four, after ACH had already sent 4,200 payments and the benefits vendor had already deducted premiums. The finance team spent two days reversing that work by hand, and the reversals were not simple deletes: an ACH payment is undone with a separate return entry, and a benefits deduction is undone by posting an adjusting credit. You want that unwinding to happen on its own instead of taking finance two days, and it has to be safe to run twice, resume after a crash, and page someone when it will not go through.",
    answers: ["compensating-transaction"],
  },
  {
    id: "compensating-transaction-3",
    text: "You maintain a warehouse fulfillment workflow that already coordinates picking, packing, label purchase, and carrier handoff. Roughly 700 times a day the carrier handoff fails permanently because the address is undeliverable, and by then the label has been bought for $8.40, the stock has been decremented, and the pallet has been staged. Undoing this is domain work, not a data restore: the label needs a refund request to the carrier, the stock needs a restock entry rather than an increment because other orders have already changed the same counts, and the pallet needs an unstage task for the floor crew. Today none of that happens automatically and the losses run about $5,000 a week. You need that unwinding to happen on its own when the flow gives up, in an order the warehouse chooses, instead of losing $5,000 a week.",
    answers: ["compensating-transaction"],
  },
  {
    id: "compensating-transaction-4",
    text: "An online gaming store runs a bundle purchase as a five-step process: charge the card, grant the base game, grant the two downloadable add-ons, credit 500 in-game currency, and post the achievement. When granting the second add-on fails because the entitlement service rejects a region restriction, the charge has already settled and the player already owns the base game and 500 currency they may have spent. Restoring the old state by force is wrong, because the currency balance has changed since then and other purchases touched it. The team wants the already-finished steps unwound automatically once the forward path gives up, using actions that respect what the balance is now rather than overwriting it.",
    answers: ["compensating-transaction"],
  },
  {
    id: "compensating-transaction-5",
    text: "A mortgage origination system runs an existing multi-step approval flow that pulls credit, orders an appraisal for $600, locks a rate with the funding desk, and reserves funds. About 120 files a month die at the funds reservation step after all retries fail, and by then the appraisal is ordered and billed, the rate lock is held for 45 days, and the credit pull is recorded. Each of those needs a different kind of reversal with its own business rule: the appraisal can be canceled only within 4 hours or it must be billed anyway, and the rate lock is released with a specific desk API call. Ops handles this on a spreadsheet today and misses about 1 in 8 rate lock releases. You want the completed steps unwound automatically when a file dies, and an alert when one of those calls keeps failing, instead of a spreadsheet that misses 1 in 8 rate lock releases.",
    answers: ["compensating-transaction"],
  },
  {
    id: "circuit-breaker-1",
    text: "Your checkout service calls a third-party fraud scoring API on every purchase, about 1,200 calls per second, with a 5 second timeout. Twice this month the vendor had a 25 minute outage where every call hung until timeout. During those windows all 200 threads in your web pool sat waiting, so unrelated endpoints like order history and address lookup also stopped responding and your whole service looked down. Your client kept firing the full 1,200 calls per second at the vendor the entire time, none of which had any chance of succeeding, and the vendor's status page later said the retry volume slowed their recovery. During an outage you would rather return a low-risk default instantly than spend a thread on a call that cannot succeed, and you need vendor traffic to come back on its own once they recover.",
    answers: ["circuit-breaker"],
  },
  {
    id: "circuit-breaker-2",
    text: "A video streaming backend asks a recommendations service for the home screen rows. Yesterday that service ran out of memory and returned errors on 100 percent of requests for 18 minutes. Your home screen API kept calling it 8,000 times a second the whole time, each call burning a connection from a pool of 500 and taking 3 seconds to fail, so the home screen p99 went from 120 ms to 9 seconds even though the rest of the page came from a cache that was fine. The recommendations team said the constant traffic kept their pods crash-looping so they could not come back up. You would rather serve a cached generic row list immediately than hold a connection for 3 seconds on a call that will fail, and the recommendations pods need room to restart before traffic returns.",
    answers: ["circuit-breaker"],
  },
  {
    id: "circuit-breaker-3",
    text: "An IoT platform ingests readings from 400,000 smart meters and writes each one to a time series database. When that database goes into a long compaction and stops accepting writes, which happens for 10 to 30 minutes about once a week, your ingest workers keep attempting every write. Each attempt blocks a worker for the full 10 second timeout, so the worker pool empties, the device-facing HTTP endpoint stops answering health checks, and the load balancer pulls healthy nodes out. The database team says the flood of doomed writes lengthens the compaction. During a compaction you need the workers to spool to local disk without spending 10 seconds per write waiting on the network, and to go back to normal on their own once the database accepts writes again.",
    answers: ["circuit-breaker"],
  },
  {
    id: "circuit-breaker-4",
    text: "A bank's mobile API calls a mainframe balance service through a gateway that supports only 60 concurrent sessions. When the mainframe goes into its nightly window and starts returning errors for 40 minutes, your API keeps sending calls, every session is consumed by requests that are certain to fail, and transfers and bill pay, which use the same gateway sessions, stop working too. Support tickets spike and the p99 for every endpoint goes past 20 seconds. During the nightly window you want a clear 'balance unavailable' answer that costs no gateway session, so transfers and bill pay keep working, and you want normal service to resume without an operator.",
    answers: ["circuit-breaker"],
  },
  {
    id: "circuit-breaker-5",
    text: "An ad server calls three external bidding exchanges in parallel and must answer in under 100 ms. One exchange has been going fully dark for 5 to 15 minutes at a time, several times a day, during which it accepts the TCP connection but never responds. Your server waits the full 100 ms on every one of those 30,000 calls per second, which holds sockets and pushes your own response past the publisher deadline, so you lose revenue on the two healthy exchanges too. While an exchange is dark you need to spend none of your 100 ms on it so the two healthy exchanges still get a bid, and you need it back in rotation on its own once it recovers.",
    answers: ["circuit-breaker"],
  },
  {
    id: "retry-with-backoff-and-jitter-1",
    text: "A ride hailing app has 60,000 driver phones that send a location update to your ingest API every 4 seconds. When one of your API nodes restarts, the clients that were talking to it all get a connection error at the same instant. Every client is coded to try again after exactly 1 second, so 4 seconds later the remaining nodes take a single spike of 60,000 requests in one 50 ms slice and start failing too, which produces another synchronized wave. The failures themselves are short, usually gone within 2 seconds. The clients should still recover on their own from a 2 second blip, without 60,000 of them landing in the same 50 ms slice.",
    answers: ["retry-with-backoff-and-jitter"],
  },
  {
    id: "retry-with-backoff-and-jitter-2",
    text: "Your batch job writes 2 million rows a night to a managed key-value store, and about 0.3 percent of writes come back with a brief capacity error that clears in well under a second. The job runs on 200 workers, each retrying a failed write immediately in a tight loop, and the store's dashboard shows a sawtooth: a small error blip turns into a 5x request spike, which causes more errors, which causes a bigger spike. Total job time went from 40 minutes to over 3 hours. The errors are genuinely temporary and the same write can be repeated safely because each row has a unique key. The writes are worth repeating, but the 200 workers have to stop turning a small error blip into a 5x request spike.",
    answers: ["retry-with-backoff-and-jitter"],
  },
  {
    id: "retry-with-backoff-and-jitter-3",
    text: "A payments SDK you ship to 8,000 merchant servers posts to your authorization endpoint. During a 3 second network blip in one availability zone, every merchant's request failed and every SDK immediately re-sent, then re-sent again 100 ms later, producing a burst of 400,000 requests in 2 seconds against an endpoint sized for 5,000 per second. The original blip was over in 3 seconds, but the burst kept the endpoint degraded for 11 minutes. Every request already carries a unique operation ID that your server deduplicates, so repeating a call is safe. The SDK should still recover from a 3 second blip on its own, without 8,000 merchants producing 400,000 requests in 2 seconds.",
    answers: ["retry-with-backoff-and-jitter"],
  },
  {
    id: "retry-with-backoff-and-jitter-4",
    text: "A game client with 250,000 concurrent players reconnects to your matchmaking service after a brief deploy that drops all websocket connections for about 2 seconds. Every client reconnects the moment the socket closes, so your gateway sees 250,000 handshakes inside one second, runs out of file descriptors, and rejects most of them, which makes every rejected client reconnect again in lockstep. It takes 25 minutes to settle even though the underlying deploy took 2 seconds. Clients must still reconnect on their own after a 2 second deploy, without 250,000 of them arriving in lockstep and then arriving in lockstep again after each rejection.",
    answers: ["retry-with-backoff-and-jitter"],
  },
  {
    id: "retry-with-backoff-and-jitter-5",
    text: "A hospital records integration reads from a vendor FHIR API that returns a temporary 503 on roughly 1 in 200 calls, usually recovering within a second. Your sync service runs 50 parallel readers, each of which retries a 503 right away up to 10 times with no wait, and the calling layer above it also retries the whole batch 3 times. During a 10 second vendor hiccup last Tuesday, the combination sent 90,000 requests where the normal rate is 400, and the vendor blocked your API key for an hour. You need only one layer doing the repeating, and a 10 second vendor hiccup must never again turn 400 requests into 90,000.",
    answers: ["retry-with-backoff-and-jitter"],
  },
  {
    id: "bulkhead-1",
    text: "Our checkout service calls three outside vendors during a purchase: fraud scoring, sales tax, and address cleanup. All three calls go through one shared pool of 200 worker threads. Last Tuesday the tax vendor got slow, 90ms average up to 9 seconds, but it never returned errors and every call eventually succeeded. Within two minutes all 200 threads were parked waiting on tax, so fraud scoring and address cleanup got no threads at all and the whole checkout page returned 500s. Gift card purchases, which never touch the tax vendor, also failed. We want a slow vendor to only be able to stall the purchases that need that vendor.",
    answers: ["bulkhead"],
  },
  {
    id: "bulkhead-2",
    text: "A hospital records system uses one database connection pool of 60 connections. Clinician chart lookups run against it all day and need to answer in under 400ms. A nightly bulk export for the research team also runs against it, and last week it was rescheduled to 7am by mistake. The export opened 55 long-running connections, so chart lookups queued for connections and timed out for 20 minutes while doctors were seeing patients. The database itself was fine and had CPU headroom the whole time. Chart lookups must keep answering in under 400ms no matter what the export is doing.",
    answers: ["bulkhead"],
  },
  {
    id: "bulkhead-3",
    text: "Our ad platform runs one server process that handles two jobs: real-time bid callbacks that must answer in 80ms, and advertiser reporting queries that scan months of data. Both jobs are served by the same pool of 64 request handlers and the same 8GB heap. When one large advertiser pulled a 14-month report across 400 campaigns, the reporting work held 60 of the 64 handlers for almost a minute, bid callbacks timed out, and we lost roughly 3 million bid opportunities. Reporting and bidding have completely different deadlines and completely different value to us. We want a heavy report to be unable to starve bidding of workers or memory.",
    answers: ["bulkhead"],
  },
  {
    id: "bulkhead-4",
    text: "Our bank's statement generation service is shared by two groups of customers. Business customers have a contract promising statements within 5 seconds and pay for it. Retail customers have no such promise and make up 95% of the volume. Everything runs on one fleet of 40 workers with one shared queue of in-flight jobs. On the first of the month retail volume filled every worker for 40 minutes and business customers waited just as long as everyone else, which broke the contract. Adding more workers helps for a while but does nothing to stop retail from occupying whatever we add.",
    answers: ["bulkhead", "priority-queue"],
  },
  {
    id: "bulkhead-5",
    text: "A logistics platform consumes device messages from a single queue with one group of 24 consumer processes. The queue carries five message kinds: GPS pings, temperature readings, door sensor events, driver check-ins, and firmware upload confirmations. A bug in the firmware confirmation handler made it hang for 30 seconds per message while it waited on blob storage. Because any consumer can pick up any message kind, all 24 consumers ended up stuck on firmware messages and GPS pings fell 45 minutes behind, which broke live tracking for 12,000 trucks. The other four handlers were healthy the entire time and were doing no work.",
    answers: ["bulkhead"],
  },
  {
    id: "rate-limiting-1",
    text: "Every night we upload the day's conversion events to an ad partner's API. Their contract says 500 writes per second per account, and they return HTTP 429 above that. Our job runs 200 parallel workers that push as fast as they can, so we send around 4,000 per second, get 68% of calls rejected, and then resend those records. The job used to finish in 2.5 hours and now takes 5, and half of that time is spent sending records that will be refused. The partner's limit is fixed and published and is not going to be raised. We already back off on each failed call, but the total traffic we generate is still eight times what they will accept.",
    answers: ["rate-limiting"],
  },
  {
    id: "rate-limiting-2",
    text: "Our clinic scheduling app checks insurance eligibility through a vendor whose contract allows 20 requests per second for our key. Each morning at 6am we run 90,000 checks for that day's appointments, and our worker pool fires them as fast as threads free up, around 300 per second. The vendor rejects the excess and has now sent us a written warning that they will suspend the key if it keeps happening. Our workers can easily do 300 per second, but the vendor cannot take them. The 90,000 checks have all morning to finish, so the only thing that has to change is how fast we hand them over.",
    answers: ["rate-limiting"],
  },
  {
    id: "rate-limiting-3",
    text: "We poll a shipping carrier's tracking API, which allows 10,000 calls per hour per customer and counts them in a fixed hourly window. Our poller wakes at the top of each hour and burns the entire 10,000 in the first four minutes, then every call for the next 56 minutes comes back refused. So tracking data is fresh at 2:04pm and 58 minutes stale at 2:59pm, and support gets calls about it. The carrier will not raise our quota. The number of calls we need per hour is under the quota, so the only problem is how we time them.",
    answers: ["rate-limiting"],
  },
  {
    id: "rate-limiting-4",
    text: "Our fintech data team loads 10 million transaction rows a night into a managed document database. The database is provisioned at 20,000 capacity units per second and each row costs 10 units to write, so it can take 2,000 rows per second. The loader reads the file and writes as fast as it can, so most writes come back refused, we resend them, and we end up sending each row an average of three times. The error logs alone are now 40GB a night. Capacity is fixed by budget and will not be increased. The load itself is not urgent and has a six hour window, so the only thing that needs to change is how fast we hand rows to the database.",
    answers: ["rate-limiting"],
  },
  {
    id: "rate-limiting-5",
    text: "Our mobile game sends launch-day push notifications through a third party whose plan allows 600 messages per second. We have 2 million players to notify, and our sender opens 50 connections and pushes until it is refused. Roughly 40% of our sends come back rejected, and the resends push our outbound volume to nearly three times what we would need if every send counted. The vendor's dashboard shows we are the only account of theirs generating rejections. We do not need to send all 2 million within a minute. We just need to feed the vendor at a rate it will accept until the list is done.",
    answers: ["rate-limiting"],
  },
  {
    id: "throttling-1",
    text: "We run a multi-tenant analytics API for about 900 companies. Typical tenants send 3 to 8 requests per second. Yesterday one tenant deployed a script that sent 150 per second for 40 minutes. Our servers stayed up but CPU hit 96%, p99 latency for every other tenant went from 120ms to 4.2 seconds, and we broke our 500ms promise for the whole customer base. Autoscaling adds capacity but takes about six minutes, and the spike was already past that point. We would rather refuse the extra requests from that one tenant, and tell it when to try again, than let everyone's response times collapse.",
    answers: ["throttling"],
  },
  {
    id: "throttling-2",
    text: "Our live sports streaming service sized its encoding and delivery capacity for 1.2 million concurrent viewers. A surprise final drew 2.1 million and demand went past what we had provisioned, with no chance of adding hardware mid-match. The stream started stuttering for everyone at once, including paying subscribers, and the personalized recommendation panel and live stats overlay were consuming about 18% of backend capacity. We would rather drop everyone to 720p and switch off the stats overlay and recommendations than have the video fail for everyone. We need the system to notice it is over its capacity line and cut back on its own.",
    answers: ["throttling"],
  },
  {
    id: "throttling-3",
    text: "Our city publishes a free open-data API for bus arrivals, sized for about 4,000 requests per second. Two scrapers now hit it with 22,000 requests per second between them, pulling the same full feed every second. The API servers are saturated, the transit app that riders actually use gets timeouts, and we cannot buy more servers because the budget is fixed for the year. Caching already helps but the scrapers request unique query strings so most calls miss. We need incoming demand held to what the fleet can actually serve, with the excess refused cheaply and with a clear signal to try later.",
    answers: ["throttling"],
  },
  {
    id: "throttling-4",
    text: "Our game's launch night went badly. The login service can complete 90,000 sign-ins per minute. At 6pm about 400,000 players tried within two minutes, and every one of them was accepted into the queue, so the auth servers thrashed, average sign-in time went to 90 seconds, and nobody got in. If we had served 90,000 a minute and told the rest to come back shortly, most players would have been in within five minutes. We also found that refusing a request still cost us a full password hash check, so even the refusals ate capacity. We need to stop accepting more work than we can finish, and to say no early and cheaply.",
    answers: ["throttling"],
  },
  {
    id: "throttling-5",
    text: "Our IoT platform takes readings from 2 million meters. A firmware update made every meter report every 10 seconds instead of every 5 minutes, so incoming volume went from 6,600 to 200,000 messages per second against an ingest tier that can handle 25,000. Buffering does not save us because the extra traffic is continuous, not a burst, and the backlog would grow forever and never drain. The readings are also low value at that frequency, since we only need one every 5 minutes per meter. We need the ingest tier to accept what it can serve and reject the rest so it keeps meeting its 200ms write promise for the meters it does accept.",
    answers: ["throttling"],
  },
  {
    id: "shuffle-sharding-1",
    text: "Our hosted API runs on a fleet of 26 identical request-handling nodes serving 9,000 customers. A load balancer spreads every customer's traffic across all 26. Last month one customer sent a request pattern that pegged CPU on whatever node handled it, and since their traffic went everywhere, all 9,000 customers saw errors at once. Giving each customer their own dedicated node would need 9,000 nodes and we can afford 26. What we need is for one customer's bad traffic to reach well under 1% of the others, using the 26 nodes we can afford.",
    answers: ["shuffle-sharding"],
  },
  {
    id: "shuffle-sharding-2",
    text: "We run webhook delivery for 12,000 merchants on a pool of 40 sender processes, and any sender can pick up any merchant's deliveries. One merchant's endpoint started holding connections open for the full 30 second timeout on every call, and because their deliveries landed on all 40 senders, every merchant's webhooks were 20 minutes late. Timeouts and retry limits reduce the damage but do not change the fact that one merchant's traffic touches the entire pool. Buying 12,000 dedicated senders is out of the question. We need one bad endpoint to delay a handful of merchants at most, using the 40 senders we already have.",
    answers: ["shuffle-sharding"],
  },
  {
    id: "shuffle-sharding-3",
    text: "Our payments API gateway runs on 100 nodes and serves 60,000 API clients. We found a parsing bug where one specific malformed request crashes the node that receives it. One client's integration sent that request in a loop, and because their retries went to a new node each time, they walked through and crashed most of the fleet in under three minutes, taking down all 60,000 clients. We have fixed that one bug, but the next bad request will do the same thing. We need the next bad request to be able to take down only a tiny fraction of the 60,000 clients rather than all of them.",
    answers: ["shuffle-sharding"],
  },
  {
    id: "shuffle-sharding-4",
    text: "Our multiplayer game runs 64 chat relay servers for 30,000 guilds, and guild traffic is spread across all of them. A guild running a bot that posted 5,000 messages per second saturated every relay and chat broke for all 30,000 guilds for 11 minutes. One relay per guild is far too expensive at our price point. Splitting the guilds into 8 fixed groups of 8 relays each was our first idea, but that still means one bad guild takes out an eighth of our players. We want the number of guilds affected by any single bad guild to be a few dozen, not thousands, using the same 64 relays.",
    answers: ["shuffle-sharding"],
  },
  {
    id: "shuffle-sharding-5",
    text: "Our industrial IoT service has 30 message brokers handling 10,000 customer device fleets, and every fleet's devices can connect to any broker. When one customer's 40,000 devices got into a reconnect loop from a bad certificate rollout, they hammered all 30 brokers and every other customer's telemetry stalled for half an hour. Connection caps per customer help with volume but not with the fact that their connections reach every broker in the fleet. We cannot dedicate brokers per customer at 10,000 customers. We need one customer's reconnect storm to stall a tiny number of other fleets rather than all 10,000, using the 30 brokers we have.",
    answers: ["shuffle-sharding"],
  },
  {
    id: "leader-election-1",
    text: "We run a telemetry rollup service for about 90,000 smart water meters. The service runs as 12 identical containers behind an autoscaler, and each container has a timer that fires every 60 seconds to sweep new readings and write hourly totals. Since we scaled from 1 container to 12, every hourly total is being written 12 times, and the totals table now has duplicate rows for the same meter and hour. We cannot just pin the timer to one named container, because when that container is rescheduled onto another host the sweep stops running entirely until someone notices. We need exactly one of the running containers to own the sweep at any moment, with another one picking it up within a few seconds if that container dies.",
    answers: ["leader-election"],
  },
  {
    id: "leader-election-2",
    text: "Our savings account service posts daily interest for 2.1 million accounts. The posting job is a timer inside the same service process, and the service now runs 6 copies for request throughput. Last month all 6 copies ran the job at the same time and 40,000 accounts got credited twice before we caught it. As a stopgap we set an environment variable so only copy number 0 runs the job, but when that copy crashed on a Tuesday night no interest posted at all and nobody was paged. We want the job to run on exactly one live copy, and for a surviving copy to take over automatically when the current one stops.",
    answers: ["leader-election"],
  },
  {
    id: "leader-election-3",
    text: "Our matchmaking service holds a pool of waiting players and runs a sweep every 2 seconds that groups them into 5-player matches and assigns each match a game server. The service runs 8 instances in one cluster. Twice this week two instances ran the sweep at the same instant and put the same player into two different matches, which crashed the client. Sharding players across instances does not work here, because the sweep needs to see the entire waiting pool to make good matches. Only one instance should be running that sweep at a time, and if that instance freezes the others must take over within a few seconds.",
    answers: ["leader-election"],
  },
  {
    id: "leader-election-4",
    text: "Our logistics tracking service consumes a carrier's streaming feed of package scan events. The carrier only allows one open session per account, and any second connection with the same credentials kicks the first one off. We now run 5 instances of the consumer for redundancy, and they keep knocking each other off the feed, so we lose scan events in 30 second gaps all day. Running only one instance is not acceptable because when it crashed on Sunday we were blind for 4 hours. All 5 instances should stay running, but only one should hold the feed connection, and a different one should grab it if the holder stops renewing its claim.",
    answers: ["leader-election"],
  },
  {
    id: "leader-election-5",
    text: "Our video platform has a background service that rebalances which encoder machines handle which regions. It reads the whole fleet's queue depths and issues reassignment commands. The service runs as 4 identical replicas across three availability zones. When two replicas rebalance at once they issue conflicting commands and encoders flap between regions, which added 6 minutes of encode delay during the last incident. The rebalance itself is cheap and one replica can easily handle it. We need only one replica issuing commands at any moment, decided without an operator, and that right to move automatically when a zone goes down.",
    answers: ["leader-election"],
  },
  {
    id: "scheduler-agent-supervisor-1",
    text: "Our health insurance claims service moves each claim through 6 steps: intake validation, eligibility check, provider lookup, pricing, payment authorization, and notification. Steps 2 and 5 call outside systems that sometimes hang. We process about 4,000 claims a day, and roughly 60 of them end each day sitting in status processing forever, because the worker handling them crashed or the outside call never returned. Nobody finds them until a provider calls three weeks later, and then an engineer runs UPDATE statements by hand to push them along. We need those 60 claims found the same day and either pushed through or escalated, instead of an engineer writing UPDATE statements three weeks later.",
    answers: ["scheduler-agent-supervisor"],
  },
  {
    id: "scheduler-agent-supervisor-2",
    text: "Activating a new mobile line in our telecom system takes 4 steps that hit 4 different vendor systems: number reservation, SIM registration, billing account setup, and network provisioning. About 3 percent of activations stall partway. The usual cause is that a vendor call takes longer than the worker's 90 second timeout, the worker dies, and the activation row stays marked in progress with no owner. Our support team has a spreadsheet of stuck line numbers they replay manually every morning. We already have the undo commands written for each step. What is missing is anything that notices an activation has been abandoned and acts on it, so the morning spreadsheet can go away.",
    answers: ["scheduler-agent-supervisor"],
  },
  {
    id: "scheduler-agent-supervisor-3",
    text: "Our platform provisions a new customer environment in 9 steps, calling a DNS provider, a certificate authority, a container platform, and a billing system. A full run takes 12 to 20 minutes. When a step's remote call fails permanently, or when the process running the workflow is terminated by a node drain, the run just stops. We currently have 140 half-built environments in the database, some 5 months old, each holding a reserved subdomain. The workflow code itself is fine and each remote call already retries short failures. We need a stalled run noticed and either recovered or failed, instead of sitting for five months holding a reserved subdomain.",
    answers: ["scheduler-agent-supervisor"],
  },
  {
    id: "scheduler-agent-supervisor-4",
    text: "Our marketplace pays out sellers in a nightly batch. Each payout runs through 5 steps, and step 3 calls the bank's transfer API, which returns in about 800 milliseconds normally but has hung for over 10 minutes twice this quarter. When a payout worker is redeployed mid-batch the payouts it held stay in state SENDING with no owner and no timeout, so they are neither retried nor cancelled. Last month 312 sellers were paid two days late because nobody spotted 312 rows in that state. We need a payout stuck in SENDING noticed and acted on the same night, and a worker that has already given up must not come back with a late answer.",
    answers: ["scheduler-agent-supervisor"],
  },
  {
    id: "scheduler-agent-supervisor-5",
    text: "Launching an ad campaign in our system means calling 5 different exchange APIs in order, then a creative approval service, then a budget service. Roughly 1 in 30 launches ends up half-applied, live on 3 exchanges and missing from 2, usually because an exchange call timed out and the worker process was recycled before it could react. Our account managers find these by eye and re-run the launch, which sometimes creates duplicate campaigns. We need a half-applied launch found automatically and driven to a good state or unwound, instead of account managers spotting them by eye and creating duplicates.",
    answers: ["scheduler-agent-supervisor"],
  },
  {
    id: "deployment-stamps-1",
    text: "We sell payroll software to 430 companies. Everything runs as one shared application tier and one shared Postgres cluster, and that cluster is at 84 percent of its maximum storage with connection counts near the instance limit. Two large customers now demand that their records live in their own separate database with their own encryption keys, and three risk-averse hospitals want to stay on the previous release for 30 days after we ship. A bad migration last quarter took all 430 companies offline for 51 minutes. Any given company's users all work in one country and never need to reach another company's data.",
    answers: ["deployment-stamps"],
  },
  {
    id: "deployment-stamps-2",
    text: "Our restaurant point-of-sale backend serves 1,200 chains from a single deployment. We already split the orders table across 8 database shards, but the shared search cluster, the shared cache, and the shared message broker have each hit their own limits, and adding chains is now hitting a nonlinear cost curve. On top of that, our largest chain has a contract requiring its data to never share infrastructure with other customers. Chains never query each other's data and a chain's traffic all comes from one country. We want to stop growing one giant environment, since splitting the orders table did nothing for the search cluster, the cache, or the broker.",
    answers: ["deployment-stamps"],
  },
  {
    id: "deployment-stamps-3",
    text: "We run a clinical records product used by 60 hospital groups. German hospitals must have their data physically stored and processed in Germany, Canadian ones in Canada, and one government client requires a completely separate environment that our other clients never touch. Today it is one deployment in one region with row-level tenant filtering, and a single bad release affects everyone at once. Each hospital group's clinicians only ever access their own group's records, from one country. We also want to be able to put a release in front of some hospital groups well before others, starting with the ones that tolerate frequent changes.",
    answers: ["deployment-stamps"],
  },
  {
    id: "deployment-stamps-4",
    text: "Our warehouse management platform serves 220 logistics operators from one shared environment. A single operator running a 900,000 row inventory reconciliation last Thursday drove shared database CPU to 100 percent and slowed scanner requests for every other operator from 80 milliseconds to 9 seconds. Splitting thread pools did not help, because the bottleneck was the one database everybody shares, and that database is already the largest instance our provider sells. Operators never share data and each one works out of a single country. We need a cap on how many operators one heavy job can affect, and we have run out of room to grow the single database.",
    answers: ["deployment-stamps"],
  },
  {
    id: "deployment-stamps-5",
    text: "Our banking-as-a-service platform hosts 75 fintech clients on one stack. Compliance now requires that clients under a national banking license run on infrastructure with no shared components with unlicensed clients, and two clients need to freeze on a specific release for their annual audit while everyone else takes weekly updates. We are also finding that our per-client onboarding time grows as the shared database grows, and we cannot buy a bigger instance. A client's requests always belong to that client and never need data from another.",
    answers: ["deployment-stamps"],
  },
  {
    id: "geodes-1",
    text: "Our multiplayer game runs presence, friends, and chat from one region in Virginia. Players in Seoul see 240 milliseconds on every chat send and 310 milliseconds on presence updates, and our Sydney player base has been complaining for a year. Any player can be anywhere on any day, players travel, and a squad often has members on three continents who all write to the same chat room. Read replicas do not help because these are write-heavy operations. We need Seoul and Sydney players writing to something close to them, no player pinned to a home region, and the loss of one location to just move its players elsewhere.",
    answers: ["geodes"],
  },
  {
    id: "geodes-2",
    text: "Our ride-hailing dispatch API is deployed in one region in Ireland. Drivers in Sao Paulo post location updates every 4 seconds and each update costs 190 milliseconds round trip, which is hurting dispatch accuracy. Drivers and riders are not tied to any region; a driver may cross a border mid-shift and riders open the app while travelling. Every request both reads and writes trip state, so a read-only copy in Brazil would not work. We need any driver or rider served with low latency wherever they happen to be that day, and a full region loss to just move traffic to the survivors.",
    answers: ["geodes"],
  },
  {
    id: "geodes-3",
    text: "We run a collaborative whiteboard used by 400,000 people a day. All writes go to one region in Oregon, and users in India see 280 milliseconds per stroke, which makes drawing feel broken. A single board frequently has editors in Bangalore, London, and San Francisco writing at the same time, so we cannot assign a board or a user to a home region. We also want to survive the loss of an entire region without a failover procedure. We need every editor of a board writing with low latency wherever they are, and no failover procedure to run when a region is lost.",
    answers: ["geodes"],
  },
  {
    id: "geodes-4",
    text: "Our connected-car platform ingests 20,000 telemetry messages per second from vehicles in 40 countries and also serves the driver mobile app. Everything runs in one region in Ohio. Cars roam across continents on shipping routes and rental fleets, so no vehicle belongs to a fixed region, and both the ingest path and the app path write vehicle state. Vehicles in Europe currently see 160 milliseconds of extra latency on every command acknowledgment, and a 40 minute outage in Ohio last spring took the whole fleet offline worldwide. We need vehicles and drivers served with low latency wherever they are that day, and one location's outage to stop taking the worldwide fleet offline.",
    answers: ["geodes"],
  },
  {
    id: "geodes-5",
    text: "Our real-time bidding service must respond to exchange requests in under 100 milliseconds or the bid is discarded. Running from two regions in the United States, we lose 38 percent of bids from Asian exchanges purely on network time. Bid requests can arrive from any exchange in any region, they are not tied to a customer or a location, and each one both reads and updates a shared budget counter for the campaign. We need every exchange, wherever it sits, answered inside 100 milliseconds, including the shared budget counter that each bid updates.",
    answers: ["geodes"],
  },
  {
    id: "sidecar-1",
    text: "A payments company runs 22 backend services across Java, Go, Python, and Node. Security now requires every outgoing internal call to use mutual TLS with certificates that rotate every 24 hours, plus a standard retry and timeout policy. The team has already written the certificate handling twice, once as a Java library and once as a Go library, and the Python and Node versions are still not started. Every certificate format change means four libraries to update and 22 services to rebuild and redeploy. They want service code to make a plain HTTP call and never know about certificates, and they want one implementation of that work rather than four.",
    answers: ["sidecar"],
  },
  {
    id: "sidecar-2",
    text: "A hospital imaging system includes a vendor-supplied C++ program that reads scanner output. The hospital has no source code and the vendor ships a new binary twice a year. Compliance now requires that program's log files be shipped to a central audit store within 60 seconds and that its outbound connections use certificates the hospital rotates weekly. The program only writes logs to a local directory and only speaks plain HTTP. The team needs the log shipping and the certificate handling added around that program without modifying it, and without the vendor's twice-yearly binary drop undoing the work.",
    answers: ["sidecar"],
  },
  {
    id: "sidecar-3",
    text: "A game studio runs match servers written in C#, and matchmaking and chat services written in Elixir and Rust. All of them need to read tuning values, such as XP multipliers and region routing rules, from a central configuration store, and pick up changes within 30 seconds without restarting. Right now each language has its own client that polls the store, and the three clients disagree about caching and retry behavior, so during one incident the Rust services kept serving values that were 11 minutes old. The studio wants one implementation of the polling and caching behavior rather than three, without writing and maintaining a client in each language.",
    answers: ["sidecar"],
  },
  {
    id: "sidecar-4",
    text: "A fleet telematics platform has an ingest service written in Rust that only speaks plain HTTP POST. A newly acquired hardware line sends MQTT over TLS with a binary payload format the ingest service cannot parse, and rewriting the ingest service would take a quarter and put the 40,000 messages per second hot path at risk. The team wants the MQTT traffic turned into the plain HTTP POST calls the ingest service already understands, written in Go by the hardware team, released on its own schedule, and scaled and retired alongside the ingest instances it serves.",
    answers: ["sidecar", "anti-corruption-layer"],
  },
  {
    id: "sidecar-5",
    text: "An ad exchange embeds a log enrichment and shipping library inside each bidder process. The library adds geo and advertiser fields to every log line, and at peak it holds 1.4 GB of buffered lines in the same heap as the bidder, which pushed three bidder instances into out-of-memory crashes last week. The bidders run in Java and Go, so the library exists twice, and the buffering bug had to be fixed twice. The team wants the enrichment and shipping work to have its own memory limit so a buffering bug can no longer kill a bidder, and one build to serve both languages.",
    answers: ["sidecar"],
  },
  {
    id: "service-discovery-1",
    text: "A logistics routing platform scales its route-solver instances between 8 and 60 copies depending on parcel volume, and each copy gets a new private IP when it starts. The dispatch service reads a list of solver IP addresses from a YAML file baked into its container image. Every scale-up requires an ops engineer to edit the file, rebuild, and redeploy dispatch, and after a scale-down dispatch keeps calling addresses that no longer exist, producing about 4,000 connection timeouts an hour until someone notices. The team needs dispatch to reach only solvers that are alive right now, without an engineer editing a file on every scale event.",
    answers: ["service-discovery"],
  },
  {
    id: "service-discovery-2",
    text: "A video transcoding company runs its encoder workers on interruption-prone cheap compute, so on a normal day roughly 200 workers start and 180 are reclaimed, each with a different host and port. The job scheduler holds worker addresses in a text file that an engineer updates by hand each morning. By afternoon a third of the entries point at machines that are gone, and jobs sent to them sit unclaimed until a 10 minute timeout fires. The team needs the scheduler to stop sending jobs to machines that are gone, on a fleet where 200 workers appear and 180 vanish every day.",
    answers: ["service-discovery"],
  },
  {
    id: "service-discovery-3",
    text: "A bank runs 30 internal services on a container platform where a failed host causes the platform to restart the affected containers on different machines with different addresses. Callers get target addresses from a spreadsheet-driven configuration bundle that is regenerated once per deploy. During last month's host failure, the payments API kept calling the old address of the account service for 22 minutes because nothing told it the address had changed. The bank needs callers to stop being handed addresses that no longer answer, without waiting for the next deploy to regenerate a configuration bundle.",
    answers: ["service-discovery"],
  },
  {
    id: "service-discovery-4",
    text: "A multiplayer game boots a dedicated match process per game, and each process binds whatever port the host has free, so a single machine may run 40 matches on 40 unpredictable ports. The matchmaker currently guesses ports by convention and gets it wrong often enough that 3 percent of players are sent to a port with nothing listening. Matches also end constantly, freeing ports that the matchmaker keeps handing out for another minute. The studio needs the matchmaker to know exactly which host and port combinations are accepting players right now, on a fleet where matches start and end constantly.",
    answers: ["service-discovery"],
  },
  {
    id: "service-discovery-5",
    text: "An online grocery platform relies on internal DNS names for its 18 services. Client libraries cache DNS answers for the record's 60 second lifetime, and the JVM services cache them longer, so after an autoscaling event new inventory service instances get no traffic for several minutes while old addresses still receive calls and fail. DNS also gives no way to know whether an instance passes its health check, only whether the name resolves. The platform team needs traffic reaching new instances immediately after an autoscaling event, and failing instances excluded, neither of which DNS gives them.",
    answers: ["service-discovery"],
  },
  {
    id: "publisher-subscriber-1",
    text: "A ride-hailing backend finishes a trip and must tell several other teams. Over two years, the trip service grew seven outbound HTTP calls in its completion handler: receipts, driver payouts, loyalty points, the fraud team, the support tool, the data warehouse loader, and the insurance partner. Adding an eighth consumer means a pull request against the trip service, a code review from a team that does not care about the new feature, and a redeploy of the busiest service in the company. Worse, when the loyalty service was down for 12 minutes, trip completion latency went from 90 ms to 8 seconds because the handler waited on it. The team wants adding or removing a reaction to stop requiring a change to the trip service, and a slow consumer to stop adding latency to trip completion.",
    answers: ["publisher-subscriber"],
  },
  {
    id: "publisher-subscriber-2",
    text: "A bank posts about 12 million card transactions a day and five internal groups want to react to them. The fraud group wants only transactions over 500 dollars or from outside the cardholder's country, the statement group wants all of them, the rewards group wants only merchant categories 5411 and 5812, and two analytics groups want everything but read hours later during their nightly window. Today the core ledger writes to a single queue that the fraud group drains, and the other four groups ask the ledger team to add more queues and more send calls. The bank wants the ledger team to stop being asked for another queue and another send call every time a group appears, and each group to keep its own backlog when it falls behind.",
    answers: ["publisher-subscriber"],
  },
  {
    id: "publisher-subscriber-3",
    text: "A video platform finishes ingesting an upload and then must trigger thumbnail generation, caption transcription, copyright matching, search indexing, and a creator notification. The upload service calls all five in sequence, so a finished upload is not marked ready for 40 seconds, and last week the captions service returned 500s for an hour and uploads stopped completing entirely. The moderation team now wants to add a sixth reaction, and the search team wants to split into two consumers, both of which mean changing and redeploying the upload service. The platform wants the upload service to return in under 50 ms no matter how many reactions exist, and a sixth team to be able to start consuming without a change to the upload service.",
    answers: ["publisher-subscriber"],
  },
  {
    id: "publisher-subscriber-4",
    text: "A utility company collects 15-minute readings from 4 million smart meters. Three separate systems care about each reading: billing, an outage detection service, and a machine learning feature store owned by a different department that runs its own maintenance window every Tuesday and stays offline for two hours. Right now the ingest service writes readings to one queue, and when the feature store team asked for their own copy, the ingest team started writing the same message twice to two queues, which drifted out of sync after a schema change. The company wants ingest to write each reading once, with the Tuesday maintenance window meaning the feature store catches up afterward and nobody else notices.",
    answers: ["publisher-subscriber"],
  },
  {
    id: "publisher-subscriber-5",
    text: "A marketplace changes a product price roughly 900 times per minute across 2 million listings. Six systems need to know: the search index, the cart recalculation job, the price history archive, two partner feed exporters, and a merchandising alert tool that only cares about drops over 20 percent. The catalog service currently keeps a hardcoded list of six endpoints and posts to each one, and when a partner exporter started timing out, catalog write throughput fell by 70 percent because the posts were in the same request path. A seventh system is being built by a team in another region on a different stack. The catalog service should stop holding a list of endpoints, and its write throughput should stop depending on how fast any one consumer accepts a post.",
    answers: ["publisher-subscriber"],
  },
  {
    id: "canary-release-1",
    text: "A streaming service rewrote the manifest server that tells players which video quality to request. Load tests look fine, but the old server has years of odd behavior around slow mobile networks that nobody fully understands, and rebuffering rate is the metric leadership watches. The team will not move every session over at once. They need rebuffer rate, startup time, and CPU compared against the old server's 0.8 percent on real mobile sessions before exposure widens, and a way back that takes effect in seconds.",
    answers: ["canary-release"],
  },
  {
    id: "canary-release-2",
    text: "A payments processor is replacing the service that scores card authorizations for fraud. Replaying last month's traffic offline gives a decline rate within 0.1 percent of the current service, but the offline replay cannot reproduce timing, retries, or issuer responses. Declining good cards costs real money, so the team will not switch everything at once. They want the new scorer judged against the old one on live authorizations, with only a small share of real money exposed while that comparison runs, and a way back that takes effect immediately.",
    answers: ["canary-release"],
  },
  {
    id: "canary-release-3",
    text: "An online marketplace rewrote its search ranking service. The staging environment only holds 2 percent of the catalog and gets synthetic queries, so click-through rate there means nothing. The only way to know whether the rewrite helps is real shoppers on the real index. The team needs click-through rate, zero-result rate, and p95 latency compared between shoppers on the rewrite and shoppers on the current service, with only a small share exposed and a way back within seconds if conversions drop.",
    answers: ["canary-release"],
  },
  {
    id: "canary-release-4",
    text: "An airline booking system is upgrading its Java runtime across 200 application servers. The new runtime changes garbage collection behavior, and the team has been burned before by pause times that only appear after eight hours under real booking traffic with real session sizes. Synthetic load never reproduced it. They need the new runtime carrying real booking traffic for two days, and compared against untouched servers, before it goes anywhere near all 200.",
    answers: ["canary-release"],
  },
  {
    id: "canary-release-5",
    text: "A health insurer is releasing a new version of the claims submission API used by 3,000 clinics. A bad release means rejected claims and phone calls from clinic staff, so the team wants exposure to grow in controlled steps. They want exposure to start with their own internal accounts, then a handful of clinics that agreed to it, then a small share of the rest, with rejection rate and p99 checked against the old version at every step and the old version still serving everyone else throughout.",
    answers: ["canary-release"],
  },
  {
    id: "blue-green-deployment-1",
    text: "We run a card payment authorization API on 40 identical application servers behind one load balancer. Deploys are a rolling restart that takes 25 minutes, and during that window old and new code run side by side and we see about 900 failed authorizations from version mismatches. When a release goes bad, backing it out means another 25 minute rolling restart, so the damage keeps going the whole time. Bank partners hold us to 99.99 percent availability. Every request has to move from old code to new code at the same instant, since the failures come from the two versions running side by side, and backing out cannot cost another 25 minutes.",
    answers: ["blue-green-deployment"],
  },
  {
    id: "blue-green-deployment-2",
    text: "Our hospital scheduling system serves 3,000 clinic staff and cannot be down during business hours, since a 10 minute outage means front desks fall back to paper. Today we deploy at 2am with a 40 minute maintenance page, and twice this year the new build failed smoke tests at 2:30am and the restore from backup took two hours. Compliance requires we prove before every release that the exact build going live has passed a full test run on production-grade hardware with production configuration, not on a smaller staging box. We need to verify the exact build on production-grade hardware before any user reaches it, cut over with no maintenance page, and get back to the previous version in minutes rather than a two hour restore.",
    answers: ["blue-green-deployment"],
  },
  {
    id: "blue-green-deployment-3",
    text: "A freight tracking platform ingests 12,000 GPS pings per second from 80,000 trucks and serves dispatcher dashboards. Last release we pushed a bad build and it took 18 minutes to rebuild and redeploy the previous version from the artifact store, during which dispatchers saw stale positions. We already keep a warm standby copy of the entire stack in the same region for disaster recovery, and it sits idle 364 days a year. Rolling out to a small percentage of dispatchers first is not useful to us, because a stale map for even 1 percent triggers a support call. What we need is to stop paying 18 minutes to get back to the previous version, and to get some use out of that idle hardware.",
    answers: ["blue-green-deployment"],
  },
  {
    id: "blue-green-deployment-4",
    text: "Our online game runs a matchmaking service for 250,000 concurrent players, and the client holds a long-lived socket that reconnects on disconnect. Partial deploys are the problem: while half the fleet runs the new matchmaking rules and half runs the old, players in the same lobby get matched under different rules and about 4 percent of matches fail to start. We need every server answering at a given moment to be on the same version, and a bad release reversed inside 60 seconds instead of 12 minutes. We can afford double the servers during release windows, and we already have a router in front that can be repointed in one config change.",
    answers: ["blue-green-deployment"],
  },
  {
    id: "blue-green-deployment-5",
    text: "A retail bank's statement portal gets 90 percent of its monthly traffic in a three-day window, and outages there generate regulator-reportable incidents. Our current process upgrades servers in place, so rolling back means reinstalling the old application package and its dependencies, which has taken up to 45 minutes and once left a machine in a broken half-upgraded state. Auditors also want us to rehearse failing over to our standby hardware more than once a year, and today that rehearsal never happens. We need getting back to the previous version to be immediate and incapable of leaving a machine half upgraded, the standby hardware exercised on every release rather than once a year, and database changes written to work against both the old and new application versions.",
    answers: ["blue-green-deployment"],
  },
  {
    id: "feature-toggles-1",
    text: "Our ad serving platform deploys 20 times a day from one shared branch, and a new bidding algorithm will take six weeks to finish. Keeping it on a side branch that long has already cost us two painful merges with 400 conflicting files. We want the half-finished bidding code to ship to production with every deploy but stay unreachable, then become reachable later, and unreachable again within seconds if bid latency goes above 8 milliseconds, with no build, deploy, or restart in either direction.",
    answers: ["feature-toggles"],
  },
  {
    id: "feature-toggles-2",
    text: "A video streaming service has a personalized recommendation row that costs about 120 milliseconds per page load and calls a machine learning service. During last month's traffic spike the recommendation service fell over and took the whole home page down with it. Operations wants a way to turn that one row off during load spikes and serve a plain popularity list instead, and they want to do it in under 30 seconds at 3am without waking a developer or shipping a build. The change has to be reversible the same way once the spike passes.",
    answers: ["feature-toggles"],
  },
  {
    id: "feature-toggles-3",
    text: "We run a business banking web app and a new payments approval screen is finished and deployed to all servers, but legal will not let it go live until the customer agreement update lands on the 14th. Marketing wants it live at 9am sharp that day, and the deploy pipeline takes 50 minutes with a change advisory approval attached. Also, our 30 internal test users need the new screen right now so they can find bugs, while the other 40,000 customers keep seeing the old one. We need release timing to stop being the same event as deploy timing, and the answer to be able to differ per user.",
    answers: ["feature-toggles"],
  },
  {
    id: "feature-toggles-4",
    text: "Our IoT platform manages 2 million smart meters and a firmware update job that runs nightly. We are rewriting the scheduling logic and want to compare the old and new versions on live traffic, sending users into two groups by a hash of the meter id so each meter always gets the same version, and we need to change the split from 50/50 to 90/10 during the run based on what the error rate looks like. Deploying a new build to change that split is not workable, since each deploy takes 35 minutes and disturbs in-flight update jobs. Both code paths already exist in the shipped binary, and the split has to change while the service is running.",
    answers: ["feature-toggles"],
  },
  {
    id: "feature-toggles-5",
    text: "A logistics company's warehouse app has a premium route-optimization report that only customers on the enterprise plan may see. Today the check is a hardcoded list of 12 account ids compiled into the app, so adding a customer means a code change and a release, and sales asks for one about twice a week. We also want to give the whole feature to our own staff accounts before any customer sees a new version of it. We need the answer to differ per account and to change without a release, and whatever we add should be removable once every plan gets the report.",
    answers: ["feature-toggles"],
  },
  {
    id: "strangler-fig-1",
    text: "We own a 14-year-old insurance policy administration system, 900,000 lines of Java in one WAR file, handling quotes, policy issue, endorsements, billing, and claims. A full rewrite was estimated at three years, and the business will not accept a three-year freeze on new features. We can put a proxy in front that receives every HTTP request from the web and partner clients first. We need to move one area at a time, starting with quoting, while the old WAR keeps serving everything else and clients cannot tell which side answered.",
    answers: ["strangler-fig"],
  },
  {
    id: "strangler-fig-2",
    text: "A grocery retailer runs order management on a mainframe reachable through a CICS-backed HTTP wrapper, serving about 400 requests per second. Management wants off the mainframe because the annual license is $2.1 million and only two people still know the code, but stopping it all at once is impossible since it also runs pricing and inventory. We already added a routing service in front of the wrapper that all store apps call. We need to take over one function at a time, starting with order status lookup, while the mainframe keeps running placement, pricing, and inventory, and each move has to be reversible.",
    answers: ["strangler-fig"],
  },
  {
    id: "strangler-fig-3",
    text: "Our telehealth company has a PHP monolith from 2011 that serves appointments, video sessions, prescriptions, and patient messaging under one domain. Every release is a 6-hour ordeal because all four areas ship together, and last quarter a messaging bug rolled back an appointment feature that was fine. We want to move one area at a time while the monolith keeps serving the rest, starting with messaging because it has the cleanest boundary, and to end up with a monolith that receives nothing and can be turned off.",
    answers: ["strangler-fig"],
  },
  {
    id: "strangler-fig-4",
    text: "A payments processor has a settlement platform written in Perl that handles 3 million transactions per night. Rewriting it in one go was tried in 2022, ran 11 months over, and was cancelled. The new plan has to prove itself on a small slice first, chargeback handling at about 4 percent of nightly volume, with Perl still serving the rest and each following release taking over another slice until nothing is left.",
    answers: ["strangler-fig"],
  },
  {
    id: "strangler-fig-5",
    text: "Our university runs student records on a vendor system nobody can extend, and we are building an in-house replacement, but we cannot cut over 45,000 students in one weekend during registration. We need to move one piece at a time, course search first, then transcripts, then registration, one per semester, cancelling each vendor module and its license line as it is fully replaced, until the vendor system can be switched off.",
    answers: ["strangler-fig"],
  },
  {
    id: "anti-corruption-layer-1",
    text: "We are building a new order service in a clean domain model, and it has to keep reading customer data from a 1990s AS/400 system that will stay in place for at least five more years. That system returns fixed-width records where a customer is split across three record types, dates are stored as CYYMMDD integers, and a null address is the string SPACES. Right now three of our new services each parse those records themselves, and the CYYMMDD handling has been copy-pasted and got it wrong in two of them. We want the AS/400's record layouts and CYYMMDD dates to stop appearing anywhere in our new code, with the conversion living in exactly one place that holds no business rules and goes away when the AS/400 does.",
    answers: ["anti-corruption-layer"],
  },
  {
    id: "anti-corruption-layer-2",
    text: "Our clinical scheduling product integrates with three hospital electronic record systems that all speak HL7 v2 with different local field usage, so a patient identifier lives in PID-3 for one hospital and in PID-18 for another. Our internal model has one Patient type with a single id, and we do not want HL7 segment names appearing anywhere in our scheduling logic. Today they do: we have 60 places calling getField(\"PID\", 3) directly, and adding a fourth hospital means editing all of them. We want HL7 segment names to stop appearing in scheduling logic at all, and the per-hospital mapping to live in one place we can extend.",
    answers: ["anti-corruption-layer"],
  },
  {
    id: "anti-corruption-layer-3",
    text: "A new logistics pricing service we wrote has to quote using rates from a third-party carrier API we do not control. That API uses its own vocabulary: a shipment is a consignment, weights come back in stones, service levels are numeric codes like 07 and 12, and errors arrive as HTTP 200 with a body field errCd. Our developers started naming our own classes Consignment and passing around the numeric codes, and now the carrier's ideas are spread through code that has nothing to do with that carrier. We want our own code to only ever see Shipment, kilograms, and our own ServiceLevel values. The carrier system is not being retired and is not something we are migrating off.",
    answers: ["anti-corruption-layer"],
  },
  {
    id: "anti-corruption-layer-4",
    text: "Our new subscription billing service is live for 200,000 accounts, but entitlements still come from a legacy CRM that will run for years. The CRM exposes a SOAP endpoint where an account has 140 fields, five of them mean status in different ways, and the meaning of the field ACT_FLG_2 was explained to us in a 2009 email. New code that calls it directly ends up carrying those five status fields around, and our domain has one clear SubscriptionState with four values. We want the five status fields and ACT_FLG_2 to stop travelling through code that has one SubscriptionState with four values, and we will accept about 8 milliseconds per call to get that.",
    answers: ["anti-corruption-layer"],
  },
  {
    id: "anti-corruption-layer-5",
    text: "A new smart-building service we are writing reads sensor data from a building management system that speaks BACnet, where a temperature reading is an object with instance numbers, engineering-unit enums, and priority arrays. Our domain model wants a simple Reading with a device id, a value in Celsius, and a timestamp. Two of our services already imported the BACnet client library and now our code passes priority arrays around, which means we cannot test them without a BACnet simulator. We want our services to stop importing that library and passing priority arrays around, so they can be tested without a BACnet simulator. The building system belongs to the property owner and is never going away.",
    answers: ["anti-corruption-layer"],
  },
  {
    id: "gatekeeper-1",
    text: "We run a hospital records API that lets outside clinics submit patient documents over the public internet. Today the same service that parses the uploaded XML also holds the database password and the storage account key in its environment variables. A security review pointed out that our XML parser had two remote code execution advisories in the last year, and if someone gets shell on that box they get the keys to every patient record. We need a shell on that parser to gain an attacker nothing, so whatever the internet can reach must hold no credentials at all while still rejecting documents that are oversized or off schema.",
    answers: ["gatekeeper"],
  },
  {
    id: "gatekeeper-2",
    text: "Our payments company exposes one endpoint that partner merchants call to submit refund requests, around 400 requests per second. The endpoint currently runs inside the same process that talks to the ledger database and the card network. Twice we have had merchants send malformed JSON with 40 MB of junk in a description field, and once someone sent a SQL fragment that our ORM logged but did not execute. Compliance wants the code merchants can reach to run with zero access to any secret, all field length and type checks done before anything is trusted, and the ledger and card network work unreachable from the internet.",
    answers: ["gatekeeper"],
  },
  {
    id: "gatekeeper-3",
    text: "A connected-car company accepts firmware telemetry uploads from 2 million vehicles. The upload handler is one service, and it also writes directly to the long-term storage bucket using a key with write access to everything. A red team showed that a crafted telemetry frame could crash the handler and, with more work, read that key out of memory. The fix has to make crashing the code a vehicle can reach worthless to an attacker, so the storage key cannot live anywhere a crafted frame can arrive, while frame size, checksum, and device certificate are still checked.",
    answers: ["gatekeeper"],
  },
  {
    id: "gatekeeper-4",
    text: "Our online game lets players upload custom level files, and the upload service both scans the file and writes to the shared asset database with an admin login. Last month a player found a buffer overflow in our level parser and got it to dump environment variables into an error message. We need that parser bug to stop being able to leak the asset database login, while file size, header magic bytes, and a 5 uploads per minute limit are still checked before an upload is accepted.",
    answers: ["gatekeeper"],
  },
  {
    id: "gatekeeper-5",
    text: "A bank runs a wire transfer intake API used by corporate treasury systems. Right now the internet-facing process performs the field checks and also signs messages with the HSM credentials. Auditors flagged that a single compromise of that process exposes both the public entry point and the signing ability. We need a single compromise of the public entry point to gain an attacker nothing, so the HSM signing ability and the account lookups cannot sit in the process treasury systems can reach, while caller authentication and amount and account number checks still happen.",
    answers: ["gatekeeper"],
  },
  {
    id: "federated-identity-1",
    text: "We sell a warehouse management app to logistics companies. Each new customer asks us to import their employee list, and we end up storing 3,000 to 20,000 password hashes per customer. Every quarter a customer complains that a fired driver could still sign in for weeks because nobody told us to delete the account. Their IT teams already run a corporate directory that knows the moment someone leaves. We want to stop holding passwords entirely, and a fired driver to lose access the moment their employer's directory says so.",
    answers: ["federated-identity"],
  },
  {
    id: "federated-identity-2",
    text: "Our hospital scheduling web app has its own username and password table. Clinicians already sign in to the hospital network each morning, and they complain about typing a second password 8 to 10 times a day because our session expires after 30 minutes. We also spend about 15 support hours a week on password resets. We do not want to build multifactor support, risk detection, or password rotation ourselves. We want clinicians to stop typing a second password all day, and the hospital's existing sign-in to be the only place credentials live.",
    answers: ["federated-identity"],
  },
  {
    id: "federated-identity-3",
    text: "We run an ad campaign dashboard used by our own staff plus about 60 agency partners who are not in our employee directory. Today each partner gets an account in our database, and we have 1,400 partner accounts with no reliable offboarding. Partners want to sign in with the accounts their own companies already manage, and our staff want to keep using the corporate login. We want to stop storing partner credentials entirely, let each partner company keep managing its own accounts and offboarding, and have our staff keep using the corporate login.",
    answers: ["federated-identity"],
  },
  {
    id: "federated-identity-4",
    text: "Our mobile banking app currently stores passwords with bcrypt and handles its own password reset emails, lockouts, and one-time codes over SMS. A penetration test found our reset token was only 6 characters and never expired, and we do not have the staff to build proper account takeover detection. We want to stop owning passwords, resets, lockouts, and takeover detection, and a customer already signed in to the bank's web portal should not be asked again.",
    answers: ["federated-identity"],
  },
  {
    id: "federated-identity-5",
    text: "We build a video editing tool sold to studios. Small studios want to sign in with their existing Google or Apple accounts, while large studios insist their staff use the studio's own login system so they can enforce hardware keys. Maintaining our own account table means we would have to build both flows and still store passwords for a third group. Instead we want the app to hold no credentials at all, and each user to sign in wherever their studio or their consumer account already lives.",
    answers: ["federated-identity"],
  },
  {
    id: "distributed-tracing-1",
    text: "A checkout request in our retail platform passes through 11 services before returning. The 99th percentile went from 400 ms to 2.1 seconds last week, and nobody can say which hop is responsible. Each service logs its own timings, but the logs have no shared identifier, so joining them means guessing by timestamp across machines whose clocks drift by up to 300 ms. When a customer reports a failed order we currently grep 11 log sets by their email address, which only works for the two services that log it. We want to take one checkout request and see how long each of the 11 hops took, and to pull up a specific customer's failed order across all of them.",
    answers: ["distributed-tracing"],
  },
  {
    id: "distributed-tracing-2",
    text: "Our ride-hailing backend fans a single trip request out to pricing, driver matching, maps, and fraud scoring, and each of those calls two or three more services. About 0.3 percent of trip requests take over 8 seconds, but every individual service reports a 95th percentile under 120 ms, so the slow time is hiding in a path we cannot see end to end. We can reproduce nothing because the slow ones are scattered. Engineers want to pick one slow request and see the exact ordered list of service calls it made, how long each took, and which one waited on which.",
    answers: ["distributed-tracing"],
  },
  {
    id: "distributed-tracing-3",
    text: "A video streaming company gets support tickets saying playback start took 6 seconds. The start path touches the entitlement service, the manifest builder, the DRM license service, and two caches, all in different teams. Each team looks at their own dashboard, sees healthy averages, and says the problem is someone else. There is no way to follow one specific playback attempt through all five systems. We want that to become possible, and to see where the 6 seconds went, instead of five teams comparing healthy averages.",
    answers: ["distributed-tracing"],
  },
  {
    id: "distributed-tracing-4",
    text: "Our insurance claims platform is 30 services deep in places. A claim submission occasionally returns a 500 error, about 40 times a day out of 200,000 submissions, and the error message is always a generic timeout from the outermost service. The failing dependency is different every time. Debugging means asking six teams to search their logs for the same minute, and the search usually finds nothing because the failing service is not one of the six we guessed. We want to take one of those 40 failures and see exactly which of the 30 services timed out, without asking six teams to guess.",
    answers: ["distributed-tracing"],
  },
  {
    id: "distributed-tracing-5",
    text: "An industrial sensor platform ingests readings and runs them through validation, unit conversion, alert rules, and storage, each a separate service, some communicating over a message queue. Operators report that a small share of alerts arrive 45 seconds late instead of the usual 2 seconds. Queue depth looks normal and each service's processing time looks normal. Nobody can follow one late reading from the moment it arrived to the moment the alert fired, because the queue message drops all context from the original HTTP call. We want that to become possible across both the HTTP calls and the queue hop, so one late alert can be followed end to end.",
    answers: ["distributed-tracing"],
  },
];
