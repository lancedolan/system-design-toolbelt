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
    text: "Your payroll SaaS has a Generate Year-End Statements button. Clicking it builds a PDF bundle across roughly 40,000 employee rows and takes 90 seconds to 4 minutes depending on the company size. The browser tab spins the whole time with no progress shown, and the CDN in front of your app returns 504 at 100 seconds. Customers cannot tell whether the run is still working or dead. You want the button click to return right away with something the front end can check every few seconds to show state and, when finished, get the download link.",
    answers: ["asynchronous-request-reply"],
  },
  {
    id: "asynchronous-request-reply-4",
    text: "A freight company integrates with your route optimization API. A single POST with 350 stops runs a solver for 2 to 11 minutes. The partner's client is an old Java integration that only speaks HTTP and cannot hold sockets open past 30 seconds, and their operations team cannot open a firewall port for callbacks. The solver itself is fine and already runs on background machines, but your API layer still blocks waiting for it and burns web threads. Change the HTTP flow so the partner gets an immediate answer and a place to check the solve state and fetch the result.",
    answers: ["asynchronous-request-reply"],
  },
  {
    id: "asynchronous-request-reply-5",
    text: "An ad platform lets agencies request an audience export. Building the export scans 400 million rows and takes 5 to 20 minutes. Today the endpoint blocks, and your API gateway hard-caps responses at 29 seconds, so every request fails with 504 while the export quietly completes and lands in storage that nobody links back to the caller. Agencies write scripts that call the endpoint in a loop and pile up duplicate exports. Redesign the HTTP interaction so one call starts the export, returns instantly, and gives the caller a documented way to learn when it is done and where the file is.",
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
    text: "A logistics company generates shipping labels from a durable queue. One label generator process reads messages and calls the carrier API, taking about 800 milliseconds each. At the 4 PM carrier cutoff, warehouses push 90,000 label requests in 20 minutes, and the single process needs 20 hours to drain it, so trucks leave without labels. The carrier API happily accepts 500 requests per second and labels can be produced in any order. The team has plenty of spare container capacity and needs a design where each label request is picked up by one machine and reappears for another if a machine dies holding it.",
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
    text: "A game studio's support platform turns every player report into a job on one shared work stream handled in arrival order. Paying subscribers are promised a first response within 15 minutes and free accounts within 48 hours. A bot wave dumped 90,000 free-account reports in an hour, and every subscriber report filed afterward waited 6 hours behind them, breaking the paid commitment for 400 customers. Adding processing power is affordable, but arrival order alone still puts subscriber reports at the back. The team wants the two classes of report scheduled differently, with the paid ones getting far more processing power.",
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
    text: "An IoT platform for wind turbines collects 10-minute vibration waveforms from 4,000 turbines. Each waveform message is 8 MB and the ingestion topic is configured with a 1 MB per record limit, so 30 percent of records are rejected outright. Increasing the broker limit would require the premium tier at four times the price, and the team measured that broker replication traffic alone would saturate the 10 Gbps link. The waveform blobs could just as easily be written to cheap object storage by the gateway. Consumers only need the waveform when an anomaly score crosses a threshold.",
    answers: ["claim-check"],
  },
  {
    id: "dead-letter-queue-1",
    text: "An e-commerce order pipeline reads from a queue and writes to a warehouse system. Last Tuesday a partner sent 12 orders with a malformed country code that throws a parse error every time. Because the consumer never acknowledges those messages, the broker keeps redelivering them, and the same 12 messages have now been attempted 400,000 times, filling the error logs and burning 40 percent of consumer capacity. Fresh orders are stuck behind them and the backlog is 90 minutes deep. The team wants those 12 messages out of the way after a handful of failed attempts but kept somewhere they can inspect and resubmit them later.",
    answers: ["dead-letter-queue"],
  },
  {
    id: "dead-letter-queue-2",
    text: "A healthcare integration service consumes HL7 messages from a hospital feed. About 0.3 percent of messages reference a patient record that does not exist, and processing them always throws the same exception no matter how many times it runs. On-call gets paged nightly because the consumer's error rate never clears, and the same records cycle forever. Deleting them silently is not acceptable because the integration team must review every rejected record for the compliance report. They need failing records automatically pulled aside after a set number of delivery attempts, into a place with a longer retention window than the main feed.",
    answers: ["dead-letter-queue"],
  },
  {
    id: "dead-letter-queue-3",
    text: "A ride-hailing company's trip settlement worker pulls from a queue. After a schema change, 2,100 in-flight messages carry an old field layout the new worker cannot deserialize. Those messages are redelivered every 30 seconds and will keep failing until someone writes a converter, which will take two days. Meanwhile the worker fleet is spending most of its time on messages that can never succeed. Engineering wants a rule that after five attempts a message is automatically moved off the main queue into a separate one, so the converter can be run against that set later.",
    answers: ["dead-letter-queue"],
  },
  {
    id: "dead-letter-queue-4",
    text: "A game studio processes in-app purchase receipts from a queue. A small number of receipts come from a jailbroken client and fail signature validation permanently. These bad receipts have accumulated to 8,000 messages, and because the consumer keeps retrying them, the visible queue depth alarm fires constantly and the team has learned to ignore it. Support still needs to look at individual bad receipts when a player complains. The studio wants permanently failing messages routed to a separate holding queue with its own alarm, so the main queue depth again means what it says.",
    answers: ["dead-letter-queue"],
  },
  {
    id: "dead-letter-queue-5",
    text: "A logistics firm's customs filing service consumes shipment events. Roughly 40 events a day fail because a downstream broker rejects the tariff code, and no amount of retrying changes that. Right now the consumer catches the error and drops the message, and last quarter 3,400 shipments silently vanished with no record. The compliance team demands that every unprocessable event be preserved with its original body and headers for at least 14 days so it can be replayed after the tariff table is fixed. The main queue only keeps messages for 4 days.",
    answers: ["dead-letter-queue"],
  },
  {
    id: "idempotency-key-1",
    text: "A payments API charges customer cards. The mobile app's HTTP client has a 10 second timeout, but during a database slowdown some charge calls took 14 seconds and still completed on the server. The app retried, and 1,200 customers were charged twice in one afternoon, costing 38,000 dollars in refunds and chargeback fees. The server cannot tell a genuine second purchase from a retry of the first, because both requests look identical on the wire. The team needs a way for the client to mark a retry as the same operation so the server returns the original result instead of charging again.",
    answers: ["idempotency-key"],
  },
  {
    id: "idempotency-key-2",
    text: "A bank's internal transfer service is called by a batch job over a flaky VPN link that drops about 1 in 500 connections mid-response. When the connection drops the job has no idea whether the transfer landed, so it calls again. Last month this produced 47 duplicate transfers totaling 2.1 million dollars, all reconciled by hand. Reading back the ledger before retrying does not work because there is no field that distinguishes a legitimate repeat transfer of the same amount to the same account. They need the caller to attach something unique per intended transfer that the service stores and matches on.",
    answers: ["idempotency-key"],
  },
  {
    id: "idempotency-key-3",
    text: "A ticketing platform issues seat reservations over a POST endpoint. During a stadium onsale, users double-tap the buy button and the browser also auto-retries on 502 responses from the load balancer. The result was 900 people holding two reservations each for the same seat block, and the inventory count went negative. The endpoint is not naturally safe to call twice because each call decrements inventory and creates a new reservation row. The team wants the client to generate a unique value per purchase attempt so repeated calls with that value return the first reservation.",
    answers: ["idempotency-key"],
  },
  {
    id: "idempotency-key-4",
    text: "A payroll vendor exposes an endpoint that creates direct deposit batches. A customer's integration crashed after sending the request but before recording the response, so on restart it sent the same batch again and 4,300 employees were paid twice. The vendor's support team spent three weeks clawing money back. The fix must let the customer replay the exact same request safely after a crash and receive the original batch ID and status code back, including if the first attempt returned a 500. Comparing request bodies alone is not enough because two identical payroll runs can legitimately be submitted.",
    answers: ["idempotency-key"],
  },
  {
    id: "idempotency-key-5",
    text: "A food delivery app lets restaurants issue refunds through a partner API. The partner's client library retries any request that fails with a network error, up to three times. Over a week this produced 220 duplicate refunds worth 6,800 dollars, because each retry created a brand new refund record. The API owner wants each refund attempt to carry a unique client-generated value that the server records with the outcome, so a retried call within the next 24 hours replays the stored status code and body rather than moving money again.",
    answers: ["idempotency-key"],
  },
  {
    id: "valet-key-1",
    text: "A video platform lets creators upload source files that average 4 GB. Right now every byte streams through the API tier, and 60 upload pods spend 95 percent of their CPU copying bytes into object storage while the actual business logic uses almost nothing. Egress and compute for that copying costs 21,000 dollars a month, and a burst of 200 concurrent uploads still exhausts the pods' memory. The team wants browsers to write straight to the storage bucket, but creators are untrusted and must never receive the storage account credentials, and each upload must be limited to one destination path and expire within a few minutes.",
    answers: ["valet-key"],
  },
  {
    id: "valet-key-2",
    text: "A radiology portal serves study downloads that are 500 MB to 3 GB. The web tier reads each file from storage and streams it to the browser, so eight app servers stay pinned at their 1 Gbps network limit and a download takes 11 minutes. Doubling the fleet only doubles the cost without fixing the round trip, since the data is stored in a different region than the app. Patients log into the portal and are authenticated, but they must not be able to reach any study other than their own, and their access must stop working after 15 minutes.",
    answers: ["valet-key"],
  },
  {
    id: "valet-key-3",
    text: "A field inspection app used by 12,000 contractors uploads photo bundles of 200 MB from job sites over LTE. Every bundle currently goes through a small API service, which now needs 30 instances just to absorb the transfer and still returns timeouts during the 4 pm rush. The contractors are third parties on personal devices, so shipping long-lived storage credentials in the app is out of the question. The team wants the phone to write bytes into the bucket itself, with permission narrowed to a single file name, write only, and valid for three minutes.",
    answers: ["valet-key"],
  },
  {
    id: "valet-key-4",
    text: "A genomics service delivers 40 GB FASTQ result files to research customers. The download proxy is a Python app that holds one worker per active transfer, and with 50 concurrent downloads it runs out of file descriptors and the whole API goes down. Cross-region bandwidth charges from proxying add 8,000 dollars a month even though the app does nothing to the bytes. Customers authenticate to the service already, but their institution's cluster nodes are untrusted machines that should get read access only to the specific result files they paid for, for a bounded window.",
    answers: ["valet-key"],
  },
  {
    id: "valet-key-5",
    text: "A dashcam vendor collects 1.5 GB incident clips from 80,000 vehicles. The current upload endpoint is a fleet of servers whose only job is to receive the bytes and forward them into storage, and it costs 45,000 dollars a month while adding two extra network hops. Vehicles are physically accessible to owners and can be tampered with, so an embedded permanent storage credential would leak. The vendor wants the head unit to ask the backend for permission and then push the clip directly into the bucket, where that permission covers exactly one object path, allows create only so it cannot overwrite prior clips, and dies after five minutes.",
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
    text: "Our multiplayer game backend is 12 services, and most of them do not speak anything a client can use. Matchmaking and inventory are gRPC only, the presence service uses a custom binary protocol over raw TCP, and two older services still expose SOAP. The game client and the companion phone app both need data from all of these, so we have been embedding protocol adapters into every client build, and a change to the presence wire format broke both clients at once. We want both clients to make plain HTTP calls to one address that routes each path to the right internal service and does the protocol translation on our side.",
    answers: ["api-gateway"],
  },
  {
    id: "api-gateway-5",
    text: "At our bank, 22 microservices each have their own public load balancer. Token validation is copy-pasted into all 22 codebases, request logging formats differ, and when compliance asked which services accept traffic from the internet, it took a week to answer. Clients, including our web app and our ATM fleet software, hold a config file mapping features to service URLs, and that file has drifted between deployments. We want a single service in front that reads the routing table, looks up the current address of the target service, checks the access token once, and forwards the call.",
    answers: ["api-gateway"],
  },
  {
    id: "backends-for-frontends-1",
    text: "Our video streaming service has three clients on one shared API: a smart TV app, an iOS app, and a desktop browser app. The TV app wants only 8 fields per title because its runtime chokes on the 60-field payload, the browser app wants all 60 plus editorial copy, and the iOS team keeps asking for a different page size. The shared API now has 14 query flags like fields=tv_minimal and layout=web2 that exist only to keep one client happy. Every change needs sign-off from all three client teams plus the API team, so a two-line field addition took 5 weeks. Each client team wants to shape and ship its own responses on its own schedule without waiting on the others.",
    answers: ["backends-for-frontends"],
  },
  {
    id: "backends-for-frontends-2",
    text: "We build logistics software with a driver Android app and a dispatcher web console, both hitting one shared API service. The driver app needs tiny responses and a single active stop at a time because drivers are on rural cellular. The dispatcher console needs 500 stops with full address history in one screen. The single API team gets conflicting tickets from both sides every sprint, and a change made for dispatchers last month doubled the driver payload and increased app crashes on old handsets. Both client teams want their own service they control, shaped for their own screens, released when they choose.",
    answers: ["backends-for-frontends"],
  },
  {
    id: "backends-for-frontends-3",
    text: "Our retail company has one API service serving a mobile shopping app and an in-store associate terminal. The mobile team writes Kotlin, the terminal team writes C#, and the shared API is a Java monolith owned by a fourth team that neither client team can commit to. The shared service now has if-blocks on a client-type header in 30 endpoints, and its test suite takes 45 minutes because it covers both clients' rules. A terminal-only pricing change broke mobile checkout twice this quarter. Leadership wants each client team to own the service that serves its own app, including choosing the language and the release schedule, with token checking and rate limits kept in the shared entry layer already in front.",
    answers: ["backends-for-frontends"],
  },
  {
    id: "backends-for-frontends-4",
    text: "A healthcare portal serves two very different audiences from one API: a clinician web workstation and a patient phone app. Clinicians need full chart histories, 200 rows at a time, with lab values and provider notes. Patients need a summary of the next appointment and 5 recent results, and they must never receive provider notes at all, but the shared response object contains them and the app filters client-side. The single API team is now the bottleneck for both roadmaps, and the shared object makes it hard to prove that patient responses never carry clinician-only fields. We want each audience served by its own service, sized and secured for that audience alone.",
    answers: ["backends-for-frontends"],
  },
  {
    id: "backends-for-frontends-5",
    text: "Our ad platform has an advertiser dashboard in the browser and a rep-facing tablet app, both calling one shared reporting API. The tablet needs 20 rows with 6 columns and pre-rounded numbers, the dashboard needs 10,000 rows with raw values for its own charting. The shared API is now three code paths deep in per-client branching, its owning team runs a 3 week ticket queue, and neither client team can ship a screen change without entering that queue. We plan to split it so the tablet team and the dashboard team each build and deploy the service that answers their own app, keeping login checks and request logging in the layer already sitting in front of both.",
    answers: ["backends-for-frontends"],
  },
  {
    id: "gateway-aggregation-1",
    text: "Our insurance mobile app opens a claim detail screen that makes 7 separate HTTPS calls: claim, policy, adjuster, photos, payment status, repair shop, and messages. On cellular each round trip costs about 380 ms, so the screen takes 2.7 seconds to fill in, and roughly 3 percent of sessions lose one of the 7 responses entirely and render a half-empty screen. The 7 services all live in the same data center and each responds in under 30 ms, so the time is almost all network. We want the phone to make one request and get one merged body back, with per-service timeouts decided server side.",
    answers: ["gateway-aggregation"],
  },
  {
    id: "gateway-aggregation-2",
    text: "We monitor farm equipment, and the field technician tablet connects over satellite with a 700 ms round trip. Opening a machine's status page fires 12 requests to 12 services for engine hours, fault codes, firmware version, warranty, parts, and so on. That is 8.4 seconds of pure waiting even though every service answers in about 15 ms locally. Technicians on bad links often see 2 or 3 of the 12 panels fail. We want one call from the tablet, with the fan-out happening next to the services and one combined response coming back.",
    answers: ["gateway-aggregation"],
  },
  {
    id: "gateway-aggregation-3",
    text: "Our food delivery app's order tracking screen calls the order service, the courier location service, the restaurant service, the ETA service, and the promotions service, one request each, every 5 seconds while an order is active. That is 5 connections per poll per phone, and at dinner peak we see 40,000 active orders, so 200,000 requests every 5 seconds mostly spent on connection setup and headers. Each backend responds in under 20 ms. We want the phone to poll one endpoint that fans out inside our network and returns a single merged tracking body, with a rule for what to return when the promotions call times out.",
    answers: ["gateway-aggregation"],
  },
  {
    id: "gateway-aggregation-4",
    text: "Airline check-in kiosks sit in airports on links with 250 ms round trips to our data center. Starting a check-in makes 9 sequential calls: reservation, passenger, seat map, bag rules, visa check, loyalty, upgrade offers, payment token, and boarding pass eligibility. Passengers wait about 3 seconds staring at a spinner before the first field appears. The services themselves are fast and colocated. We need the kiosk to send one request and receive one assembled response, with a correlation ID passed to each internal call so we can tell which one was slow.",
    answers: ["gateway-aggregation"],
  },
  {
    id: "gateway-aggregation-5",
    text: "Our banking app's home screen needs balances, recent transactions, card status, rewards points, alerts, and pending transfers. Today the app fires 6 requests in parallel from the phone. On 3G we measure 1.9 seconds to paint the full screen and about 4 percent of loads where at least one of the 6 never returns, leaving a blank tile. All 6 services sit in the same cluster and respond in 10 to 25 ms. We want one home-screen request that our own infrastructure expands into those 6 internal calls and merges into one JSON body, returning a partial body with the rewards tile omitted if that one call exceeds 200 ms.",
    answers: ["gateway-aggregation"],
  },
  {
    id: "cache-aside-1",
    text: "Our e-commerce product page reads a single row by SKU on every view. Traffic is 12,000 page views per second and about 92 percent of them land on the same 4,000 SKUs. The database is at 88 percent CPU purely from those repeated single-row lookups, each taking 6 ms, and reads outnumber writes about 900 to 1. Prices and titles change a handful of times a day through an admin tool, and the business says a few minutes of staleness on a product title is fine but a stale price after an edit is not. We need reads to stop hitting the database for rows we just read, and we need the admin write path to make the next read pick up the new value.",
    answers: ["cache-aside"],
  },
  {
    id: "cache-aside-2",
    text: "In our mobile game, every match start reads the item definition row for each of the 10 players' loadouts, keyed by item id. That is roughly 45,000 single-row reads per second against a table of 8,000 rows that designers edit maybe twice a week. Each read takes 4 ms and the database is now our biggest bill line. The rows are small, about 2 KB each, and the whole table would fit in a few hundred megabytes of memory. We want match start to look up item definitions from memory, fall back to the database when the entry is missing, and stop serving the old definition after a designer edits an item.",
    answers: ["cache-aside"],
  },
  {
    id: "cache-aside-3",
    text: "Our ad bidding service must read a campaign's targeting record by campaign id before it can bid, and it has 80 ms total to respond. We handle 200,000 bid requests per second across roughly 3,500 active campaigns, so the same few thousand records are read over and over. The database lookup averages 3 ms and spikes to 40 ms under load, which is what causes our timeouts. Campaign settings change when advertisers edit them, which is a few hundred times an hour, and a 60 second delay in picking up an edit is acceptable. We need the hot records held in memory with an expiry, loaded from the database only on a miss, and cleared when an advertiser saves a change.",
    answers: ["cache-aside"],
  },
  {
    id: "cache-aside-4",
    text: "Our clinic billing system checks insurance eligibility by calling a payer's external API, which takes 800 ms and costs us 2 cents per call. Front desk staff check the same patient's eligibility 4 or 5 times during a visit, and we make about 60,000 calls a day for only 14,000 distinct patients. Eligibility for a given patient and payer does not change during a day. We want the first lookup for a patient to hit the payer and every repeat within the same day to be answered from a fast local store, with a fallback to the payer when that store has no entry for the key.",
    answers: ["cache-aside"],
  },
  {
    id: "cache-aside-5",
    text: "Our streaming catalog service serves title metadata by title id, one row per request, to the apps. We do 30,000 reads per second, and 5 percent of titles account for 80 percent of those reads. Each read is a simple key lookup that takes 5 ms, but the volume keeps the database near its connection limit and read replicas are already maxed. Metadata for a title changes rarely, mostly when artwork or descriptions are updated by the content team, and a couple of minutes of staleness is fine. We want the service to check a fast in-memory store first, load from the database and store it with an expiry on a miss, and remove the entry when the content team publishes an update.",
    answers: ["cache-aside"],
  },
  {
    id: "sharding-1",
    text: "Our payments company keeps every card authorization in one PostgreSQL primary. The table is now 11 TB and grows about 900 GB a month, and we are writing 38,000 rows per second at peak. We already moved to the largest instance the cloud vendor sells, so there is no bigger box left to buy. Read replicas do not help because the pressure is writes and disk, not reads. We need a plan that lets us keep adding machines as the volume grows, with each machine holding a different slice of the authorizations and a routing rule based on the merchant account number.",
    answers: ["sharding"],
  },
  {
    id: "sharding-2",
    text: "A factory sensor platform ingests readings from 2.4 million devices, about 60,000 inserts per second. Everything lands in a single time-series database server that is at 94 percent disk and pegs CPU during the morning shift. Vertical scaling has run out: we are on the top instance size and the vendor has nothing larger. Almost every query asks for one device's readings, so we do not need cross-device joins. We want a scheme where a hash of the device ID picks which of several independent database servers holds that device's rows, and adding servers adds capacity.",
    answers: ["sharding"],
  },
  {
    id: "sharding-3",
    text: "Our multi-tenant HR product has 14,000 companies in one MySQL database. Three enterprise customers now account for 60 percent of the 8 TB of data and their bulk imports slow queries for everyone else. Backups take 9 hours and a restore would take longer than our recovery target. Contracts with two of the big customers also require their employee records to sit on separate servers. We need to split the tenants across several independent databases with routing by tenant ID, keeping many small logical groups so we can move a tenant to a new machine later without touching application code.",
    answers: ["sharding"],
  },
  {
    id: "sharding-4",
    text: "A mobile game stores player inventory in one document database cluster. We passed 90 million accounts, the working set no longer fits in the 768 GB of RAM on the primary, and p99 writes went from 12 ms to 340 ms as the disk started thrashing. Every inventory operation touches exactly one player, and we never join across players. Storage is projected to double again in eight months. We want to spread accounts across several independent clusters by account ID and add clusters as we grow.",
    answers: ["sharding"],
  },
  {
    id: "sharding-5",
    text: "A freight tracking service records every scan event for parcels. One database now holds 6.2 billion rows and takes 1.5 TB of new data per week, and the nightly vacuum no longer finishes before the morning peak. Adding CPU and disk to the single server has stopped helping and we are at the vendor's maximum size. Nearly all queries look up one tracking number at a time. We plan to pick a routing field, send each tracking number to one of several independent databases, and keep a mapping we can change when we move data between machines.",
    answers: ["sharding"],
  },
  {
    id: "materialized-view-1",
    text: "A hospital operations dashboard shows bed occupancy, average length of stay, and readmission counts per ward for the last 90 days. The query behind it joins seven normalized tables and runs a group-by over 40 million admission rows, taking 38 seconds. Charge nurses open the dashboard about 200 times an hour and the numbers only need to be accurate to the last 15 minutes. The source tables cannot be reshaped because the clinical system writes to them. We want to compute those totals ahead of time into a flat table the dashboard selects from directly, refreshed on a timer and rebuildable from the source at any point.",
    answers: ["materialized-view"],
  },
  {
    id: "materialized-view-2",
    text: "An ad platform gives each advertiser a performance page with spend, impressions, clicks, and cost per click broken down by campaign and day. Building that page runs a query that scans a 900 million row impression table and joins it to campaigns and billing rates, taking 22 seconds per advertiser. Advertisers reload the page constantly during business hours. The raw impression rows must stay as they are because finance audits them. We want a separate table holding the already-summed daily totals and the already-divided cost per click, refreshed every ten minutes from the raw rows.",
    answers: ["materialized-view"],
  },
  {
    id: "materialized-view-3",
    text: "A video site shows each channel a page with total watch minutes, subscriber count, and top ten videos for the last 28 days. That page joins the view-events table, the subscription table, and the video metadata table, and the aggregation takes 45 seconds on a channel with a large back catalog, so the page times out. Creators load it many times a day and are fine with figures that are up to an hour old. We plan to run the heavy aggregation on a schedule and write the finished rows, including the precomputed totals, into a table the page reads with one simple select.",
    answers: ["materialized-view"],
  },
  {
    id: "materialized-view-4",
    text: "A bank's relationship managers open a customer overview that sums balances across checking, savings, loans, and credit cards, then computes total exposure and a 12-month average balance. The overview query touches five normalized tables in different schemas and takes 14 seconds, and managers open around 3,000 overviews a day. The source tables are owned by the core banking system and cannot change. Numbers refreshed once overnight would satisfy the business. We want to precompute the joined and summed rows into a read-only table that can be discarded and rebuilt from the core tables whenever it drifts.",
    answers: ["materialized-view"],
  },
  {
    id: "materialized-view-5",
    text: "An online grocer's category browse page shows, for each of 8,000 categories, the item count, the lowest current price, and the number of items in stock. Producing it joins products, prices, and warehouse stock across 30 million rows and takes 18 seconds per category. Shoppers hit these pages 4,000 times a minute. Stock changes constantly but the page is allowed to be five minutes stale. We want to run that expensive join once per refresh cycle and store the finished counts and minimum prices as plain rows the page reads without any joins or math.",
    answers: ["materialized-view"],
  },
  {
    id: "index-table-1",
    text: "Our order service stores orders in a key-value store where the key is the order ID, and that store offers no way to query by any other field. Support agents constantly ask for all orders belonging to a customer email address, and the only way to answer today is a full scan of 400 million items, which takes minutes and burns our read budget. Customers place roughly 900 orders a second, so the lookup structure has to be kept current as orders are written. We plan to maintain a second table keyed by email address holding the order IDs, updated by a background worker that reads a change message, accepting that it lags the real orders by a second or two.",
    answers: ["index-table"],
  },
  {
    id: "index-table-2",
    text: "A ride-hailing app keeps driver records in a store partitioned by a hash of the driver ID, which spreads writes nicely but makes any other lookup a fan-out across all partitions. Compliance now needs to pull every driver whose license was issued in a given state, and that query currently touches all 64 partitions and takes 30 seconds. The store has no secondary index feature. We want a separate table whose key is the issuing state plus the driver's last name, storing the hashed partition key so we can jump straight to the full record, kept in step by a queued update on every driver write.",
    answers: ["index-table"],
  },
  {
    id: "index-table-3",
    text: "A music catalog is stored with the album ID as the primary key in a wide-column store that does not support querying on any non-key column. The app now needs to list all tracks featuring a given performer, and today that means scanning 120 million track rows. Performer lookups happen about 5,000 times a minute and catalog rows change only a few times a day. We plan to build a second table keyed by performer name that copies the track title and duration for the common case, and keeps the album ID so we can fetch the remaining fields with a second read.",
    answers: ["index-table"],
  },
  {
    id: "index-table-4",
    text: "A medical records system keeps patient documents keyed by an internal patient ID in a document store with no secondary index support. Billing staff arrive with an insurance member number instead and need the matching patient, and the current workaround scans 12 million documents and takes 40 seconds per lookup. Member numbers are unique and staff run about 600 of these lookups an hour. We want a second table keyed by member number that stores just the internal patient ID, written by a background worker on every patient create or update, with the understanding that a brand new patient may not be findable for a few seconds.",
    answers: ["index-table"],
  },
  {
    id: "index-table-5",
    text: "Warehouse inventory items live in a store keyed by SKU, and the store cannot query on any other attribute. Floor staff scan a physical pallet barcode and need the SKU behind it, but that lookup currently walks all 8 million item records and takes 25 seconds on a handheld scanner. There are about 11 million distinct pallet barcodes and each maps to exactly one SKU. Item records change perhaps twice a day. We plan to keep a second table keyed by pallet barcode holding the SKU, updated whenever an item record changes.",
    answers: ["index-table"],
  },
  {
    id: "cqrs-1",
    text: "Our brokerage order management service has one set of classes used both for placing orders and for displaying them. The placing side has thick rules: margin checks, position limits, and regulatory eligibility, and those classes have picked up dozens of display-only fields and getters added purely so screens can render. Meanwhile order placement runs at 400 writes per second while the blotter screens run 60,000 reads per second and need a completely different shape, denormalized per screen. We want to write two separate models in code, one that takes order commands and enforces the rules, and one that serves screen-shaped selects from its own store fed by events, accepting a few seconds of lag on the display side.",
    answers: ["cqrs"],
  },
  {
    id: "cqrs-2",
    text: "An insurance claims system uses the same domain objects for adjudication and for the customer-facing status page. Adjudication needs deep validation, coverage rules, and state transitions, so those objects are large and slow to load. The status page just needs claim number, stage, and expected payout, but it loads the full object graph and takes 900 ms. Claim updates run at 30 per second and status page views at 12,000 per second, and the two loads want completely different indexes and scaling. We plan to split the code into a command side that keeps the rules and a query side with its own simple tables shaped exactly like the status page, updated from events the command side publishes.",
    answers: ["cqrs"],
  },
  {
    id: "cqrs-3",
    text: "A hotel booking backend has one model handling both reservations and search results. The booking rules keep growing, overlapping stays, rate plans, cancellation windows, and every new screen adds fields to those same classes just for display, so the rules code is getting hard to change safely. Bookings run around 200 per second, while availability and reservation-list reads run near 80,000 per second and would be happier in a store tuned for reads. Reads being a couple of seconds behind a booking is acceptable to the business. We want distinct write-side and read-side models with their own stores, connected by events.",
    answers: ["cqrs"],
  },
  {
    id: "cqrs-4",
    text: "Our warehouse management service shares one set of entities between the code that records stock movements and the code that renders picker dashboards. The movement code carries the real business rules such as allocation and lot tracking, but it now also carries 40 display fields and mapping helpers, and every dashboard change risks breaking the movement rules. Movements happen 150 times per second, dashboards are read 25,000 times per second, and each wants a different database shape. We plan to keep the rules in a command-handling model and build a separate query-handling model with tables that match each dashboard one to one, updated from published events.",
    answers: ["cqrs"],
  },
  {
    id: "cqrs-5",
    text: "A telecom provisioning service uses the same objects for activating service and for the customer portal. Activation involves heavy rules across SIM, plan, and network state, while the portal only shows a few fields, yet portal traffic is 200 times the activation traffic and the shared objects force the portal to load everything. Adding a portal field means editing the class that enforces activation rules, and two outages traced back to exactly that. Portal data being a few seconds stale is fine. We want the change-handling side and the reading side written as two separate models, the read side with its own store shaped for the portal screens and kept in step by events.",
    answers: ["cqrs"],
  },
  {
    id: "event-sourcing-1",
    text: "You maintain the ledger service at a consumer bank. The accounts table holds one row per account with a current balance column, and every deposit, fee, and transfer updates that column in place. Last week a customer opened a dispute claiming her balance was wrong at 2:14pm on a Tuesday three months ago, and the only thing you could offer was a nightly backup taken at midnight. Support also asks weekly how an account reached its present figure and in what order the amounts were applied, and nobody can answer without guessing. The team wants the stored record itself to be every individual change ever applied, in order, so the current figure is something you compute by replaying them and any past moment can be reconstructed exactly.",
    answers: ["event-sourcing"],
  },
  {
    id: "event-sourcing-2",
    text: "You work on the medication ordering module of a hospital records system. A prescription row is updated in place when a doctor changes a dose, a pharmacist adjusts a frequency, or a nurse marks a hold. During a regulatory review the auditors asked what the exact dose was at 3:00pm on a given day and who changed it in the twenty minutes before, and the answer was not in the database. Someone bolted on a shadow history table two years ago, but it only tracks three of the eleven columns and was silently broken for six months. Leadership now wants the stored record to be every ordered change itself, so the current prescription is derived by applying them and the state at any past minute can be rebuilt on demand.",
    answers: ["event-sourcing"],
  },
  {
    id: "event-sourcing-3",
    text: "You are on the inventory team for a multiplayer game with 900,000 daily players. A duplication bug let roughly 4,000 accounts craft an item twice, and the item rows now show only the final quantity, so you cannot tell which accounts were affected or what they held before the bug shipped. You also cannot reproduce the sequence in a test environment because the player's chain of pickups, trades, and crafts was never kept, only the end result. The team wants storage where each pickup, trade, and craft is written as its own permanent entry, so a player's inventory is computed by applying those entries in order, one player's history can be re-run in staging to reproduce a bug, and an account can be rebuilt to its exact contents from before a bad release.",
    answers: ["event-sourcing"],
  },
  {
    id: "event-sourcing-4",
    text: "You maintain the claims platform at an auto insurer. A claim row carries a status column that moves through submitted, assigned, estimated, approved, and paid, and adjusters constantly ask how a specific claim reached its current status and when each move happened. Worse, the legal team asked the team to recompute payouts for the last 18 months under a corrected calculation rule, and there is no way to do it because only the final numbers survive. Each nightly update overwrites the previous values with no trace. You want the durable record to be the ordered set of things that happened to each claim, with the current claim state derived by replaying them, so recalculating under a new rule is a matter of running the replay again.",
    answers: ["event-sourcing"],
  },
  {
    id: "event-sourcing-5",
    text: "You run the stock system for a warehouse network with 42 sites. The on_hand column per SKU per site is incremented and decremented by receipts, picks, cycle counts, and damage write-offs, roughly 3 million updates a day. A bad deploy last month double-decremented for 90 minutes and left the counts wrong, and the only recovery was a full physical recount at eleven sites. Finance separately asks for the exact quantity on hand at midnight for each of the last 90 days, which nobody can produce. You want each stock movement stored permanently as its own entry so the on-hand figure is a computed result, a corrupted number can be thrown away and rebuilt from the entries, and any past date can be answered by stopping the replay there.",
    answers: ["event-sourcing"],
  },
  {
    id: "database-per-service-1",
    text: "Your company split its monolith into six services two years ago, but all six still connect to the same Postgres instance with the same credentials, and each one issues SELECTs and UPDATEs against any table it likes. Last sprint your team tried to rename a column in the orders table and discovered four other services querying it directly, so the change needed a coordination meeting and a shared release window. Every deploy now goes out on Thursday nights together because a migration for one service can break another. Nobody can say who owns the customers table, and two teams have written conflicting update logic against it.",
    answers: ["database-per-service"],
  },
  {
    id: "database-per-service-2",
    text: "You are on the catalog team at a video streaming company. Catalog data is deeply nested with variable metadata per title, and you want to move it to a document store to stop maintaining eleven join tables. You cannot, because the recommendations service, the search indexer, and the billing entitlement service all run their own SQL joins straight against your normalized tables. Any storage change you make would break three teams you do not control, so the migration has been blocked for a year. The architects want each team's data reachable only through that team's own API, so storage choices become an internal decision.",
    answers: ["database-per-service"],
  },
  {
    id: "database-per-service-3",
    text: "You work at a ride-hailing company where both the driver service and the pricing service write to the same drivers table. Last month 1,200 drivers ended up with a status value that neither team's documentation allows, and after two days of investigation nobody could prove which code path wrote it because both have INSERT and UPDATE rights on every column. Validation rules exist in the driver service, but the pricing service bypasses them entirely by writing directly. The fix under discussion is to give each service its own store with its own login, revoke cross-team table access, and force any team that needs driver data to call the driver team's API instead of querying the tables.",
    answers: ["database-per-service"],
  },
  {
    id: "database-per-service-4",
    text: "Your HR SaaS product runs nine services against one shared MySQL server. When the payroll team needs a schema migration that locks a large table for four minutes, all nine services go down together, so migrations happen quarterly at 2am with the whole engineering org on a call. Connection limits are also shared, and last quarter the reporting service opened 400 connections and starved the login service. Every service uses the same database user with full rights across all schemas, so nothing stops one team from reading another team's tables. The team wants each service to own its data outright with no cross-service table access.",
    answers: ["database-per-service"],
  },
  {
    id: "database-per-service-5",
    text: "You joined an ad tech firm where campaign, targeting, and billing were split into separate deployable services, but they were never separated at the storage layer. A campaign write touches tables owned conceptually by all three, and the billing team's code contains a join across seven tables belonging to the other two teams. When targeting wanted to add a required column, the billing team's queries failed in production because they use SELECT star against those tables. Each team wants to release on its own schedule, and right now a schema change by any of them forces the other two to redeploy in lockstep.",
    answers: ["database-per-service"],
  },
  {
    id: "change-data-capture-1",
    text: "You work at a retailer whose inventory of record lives in a 22-year-old vendor application on Oracle. You have no source code, the vendor contract forbids modifying it, and the vendor will not add any message publishing. Your storefront search index and your store-pickup availability page need stock numbers that are no more than a few seconds stale, but today they are fed by a CSV export that runs at 2am, so items sell out online for 18 hours after they are gone. A job that polls the last_modified column was tried and it both added noticeable load and silently missed discontinued items, which are deleted rather than flagged. You need the row-level inserts, updates, and deletes taken directly off what the database itself already writes for recovery and pushed onto a topic your services subscribe to.",
    answers: ["change-data-capture"],
  },
  {
    id: "change-data-capture-2",
    text: "You are the data engineer at a hospital group. Admissions, discharges, and transfers are recorded by a purchased clinical records product on SQL Server that your team is contractually barred from altering, so getting it to emit messages is off the table. The bed management dashboard and the analytics warehouse currently reload the whole patient stay table every 30 minutes, taking 12 minutes each run and hammering the production instance. Clinicians need bed status within about 5 seconds. You want a separate process that reads the transaction log the database already maintains and streams every row-level insert, update, and delete to a queue, so the source system does no extra work and a downstream consumer that is offline can catch up.",
    answers: ["change-data-capture"],
  },
  {
    id: "change-data-capture-3",
    text: "Your bank's core account system is a mainframe application that gets one release a year through a vendor. The fraud scoring service needs to see balance and address changes within 2 seconds, but the only current path is a nightly batch file, so fraud rules are running on data up to 22 hours old. Asking the mainframe team to add publishing calls was quoted at 14 months and rejected. The plan being drawn up is to attach a reader to the database's own recovery log, turn each committed row change into a message on a stream, and let fraud, the warehouse, and a new search service all consume it independently without a single line changed in the mainframe application.",
    answers: ["change-data-capture"],
  },
  {
    id: "change-data-capture-4",
    text: "You support a manufacturing company that runs a licensed ERP suite on Postgres for work orders and bills of material. Three newer systems, a shop-floor display, a supplier portal, and a machine learning demand model, all need to react when a work order quantity or due date changes. The ERP is closed source and support is voided if you add triggers or modify its schema. Right now each of the three systems runs its own 60-second query against the ERP tables, and together they add 30 percent to the database's load and still miss rows that get deleted. You want one reader tailing the database's write-ahead stream and turning committed row changes into messages the three systems subscribe to.",
    answers: ["change-data-capture"],
  },
  {
    id: "change-data-capture-5",
    text: "You are at an ad tech company where advertiser accounts live in an old in-house CRM nobody is allowed to touch. The last engineer who understood its PHP code left in 2019, and management has frozen it pending a replacement that is two years out. Meanwhile your feature store needs advertiser attribute updates within seconds because stale budget caps caused 40,000 dollars of overspend last quarter. A timestamp-based polling job runs every minute today, but it never notices when an advertiser row is deleted, so closed accounts keep serving. You need a mechanism that reads the database's internal record of committed inserts, updates, and deletes and publishes them, with no change to the frozen application.",
    answers: ["change-data-capture"],
  },
  {
    id: "transactional-outbox-1",
    text: "You own the refunds service at a payments company, and your code you fully control does two things per refund: it commits a row to its own Postgres, then calls the message broker to tell settlement, notifications, and accounting. During a rolling deploy last Tuesday the pod was killed between those two lines, and 63 refunds were committed with no message ever sent, so customers were refunded and never told. The opposite also happens: the broker call succeeds, then the transaction rolls back on a constraint violation, and consumers act on a refund that does not exist. You need the database write and the record of the message to succeed or fail together in the single local transaction you already have, with a separate worker responsible for actually handing the message to the broker afterward.",
    answers: ["transactional-outbox"],
  },
  {
    id: "transactional-outbox-2",
    text: "Your food delivery order service saves an order to MySQL and then publishes a message so the courier dispatch and restaurant terminal services can react. When the broker had a 90-second outage at dinner rush, 2,400 orders committed successfully and no message was published, so restaurants never saw them and refunds cost the company 31,000 dollars. Your team tried wrapping both in a two-phase transaction across the database and the broker, and throughput dropped from 900 to 120 orders per second. You want the message content written into your own database inside the same transaction as the order row, with a background sender publishing anything not yet marked as delivered, and consumers built to tolerate the same message arriving twice.",
    answers: ["transactional-outbox"],
  },
  {
    id: "transactional-outbox-3",
    text: "You are on the line activation service at a telecom carrier. Activating a SIM writes four rows to your service's own database and must then notify the provisioning, billing, and SMS welcome services. Right now the notification is published first because a developer wanted to avoid losing it, which means about 200 times a day a notification goes out and the subsequent database write fails, leaving billing charging for a line that was never activated. Moving the publish after the commit just swaps the failure to lost notifications when the process restarts. Your team controls all of this code and wants a design where the intent to publish is stored durably by the same commit that stores the activation, and a separate sender drains it.",
    answers: ["transactional-outbox"],
  },
  {
    id: "transactional-outbox-4",
    text: "You maintain the shipment service at a logistics company. Each time a package is scanned, your code updates the shipment row and then publishes a notification for the customer tracking page and the carrier reconciliation job. Monitoring shows a steady 0.4 percent gap between committed scan rows and messages seen by consumers, roughly 4,000 missing notifications a day, and it always spikes when the service autoscales down and instances are terminated mid-request. Retrying the publish inside the request handler does not help because the process itself disappears. You want the message stored in the service's own database as part of the same commit that stores the scan, so a relay process can pick up anything unpublished after a restart.",
    answers: ["transactional-outbox"],
  },
  {
    id: "transactional-outbox-5",
    text: "You are building a subscription service for a streaming product. When a subscription is upgraded, your service writes the new plan row and must tell the entitlement and invoicing services, and order matters because two rapid upgrades must be seen downstream in the sequence they were committed. Today the publish happens after the commit in application code, and under load the two publishes sometimes arrive out of order, plus any crash between commit and publish drops the message entirely. Auditors found 11 accounts last month whose stored plan and downstream entitlement disagree permanently. You want the message rows inserted in the same transaction as the plan change and sent afterward by a dedicated reader in commit order.",
    answers: ["transactional-outbox"],
  },
  {
    id: "saga-1",
    text: "You work on a food delivery backend that was recently split into four services: orders, payments, restaurant inventory, and courier dispatch. Each one owns its own Postgres database and no service can read another's tables. Placing an order has to reserve the items, charge the card, and assign a courier, and right now the order service tries to do all three inside one wrapping transaction that has no way to roll back once the payment provider has already charged. About 900 orders a day end up with a charged card and no courier, and support fixes them by hand. You need a design where each service commits only its own local write, hands off to the next step through a message it stores in the same write, and where a failure late in the flow runs undo steps for the earlier ones.",
    answers: ["saga"],
  },
  {
    id: "saga-2",
    text: "A mobile carrier is building a new SIM activation flow. Activating a line touches four separate systems, each with its own database: the customer account service, the number inventory service that assigns a phone number, the network provisioning service that turns the line on, and the billing service that starts the monthly charge. There is no shared database and no way to hold one transaction across all four, and provisioning alone takes 8 to 40 seconds so nothing can wait on a single lock. The team needs a way to run these four steps as one business operation, where finishing a step reliably starts the next one and a failure anywhere runs undo work for whatever already finished. Right now the activation code just calls the four services in a row over HTTP and gives up wherever it breaks.",
    answers: ["saga"],
  },
  {
    id: "saga-3",
    text: "You are designing the policy issuance flow for a car insurance company. Issuing a policy means the underwriting service records the accepted risk, the document service generates and files the signed contract, the payments service takes the first premium, and the claims service opens an eligible coverage record. Each of those four is a separately deployed service with its own database, and the DBA team will not enable two-phase commit across them. The product owner wants one API call for the agent, but you know that call cannot be one atomic write. You need a design that runs the four writes as separate local transactions chained together by messages, with defined undo steps for each one, so a rejected premium does not leave a live policy.",
    answers: ["saga"],
  },
  {
    id: "saga-4",
    text: "A freight logistics platform books a shipment across three services it owns: the capacity service that holds a truck slot, the customs service that files the paperwork with a broker, and the invoicing service that creates the accounts receivable record. Each service has its own database, and the three run in different regions with 80 to 200 ms of network delay between them, so a single locking transaction would hold rows far too long. Today the booking API calls them one after another and roughly 2 percent of bookings fail at the customs step, leaving a truck slot held forever and no invoice. You need a way to express the whole booking as a chain of local writes, each publishing an event stored alongside its own data change, with a defined reversal for every completed step.",
    answers: ["saga"],
  },
  {
    id: "saga-5",
    text: "You are on a team building patient referrals for a hospital network. A referral has to create a record in the scheduling service, reserve a slot in the specialist clinic service, update the coverage check in the benefits service, and notify the records service, all four of which are independent services with separate databases after last year's split. The old monolith did this in one database transaction, and after the split there is nothing that plays that role. Referrals now fail halfway about 40 times a week and leave a clinic slot held for a patient with no appointment. Design the referral as a sequence of local commits linked by messages, with reversal steps defined for each stage.",
    answers: ["saga"],
  },
  {
    id: "compensating-transaction-1",
    text: "Your travel booking workflow already runs its steps in order through an orchestrator, and each step calls a separate supplier: a flight, a rental car, and a hotel. When the hotel call fails after retries are exhausted, the flight and the car are already confirmed with the suppliers and money has moved. Undoing them is not a database rollback, because canceling a flight within 24 hours means calling the supplier's cancel API and accepting a 15 percent fee, and the car cancel returns the deposit but not the booking fee. Right now an on-call engineer reads the log and makes those cancel calls by hand, roughly 30 times a week. You need the workflow to record what each finished step did and what would reverse it, then run those reversals automatically, retry each one safely, and alert a human when a reversal keeps failing.",
    answers: ["compensating-transaction"],
  },
  {
    id: "compensating-transaction-2",
    text: "A payroll platform runs a monthly pay cycle as a long workflow across six external systems: a bank ACH file, a tax filing vendor, a benefits vendor, a 401k provider, a general ledger, and an email notifier. Last month the tax vendor rejected the batch at step four, after ACH had already sent 4,200 payments and the benefits vendor had already deducted premiums. The finance team spent two days reversing that work by hand, and the reversals were not simple deletes: an ACH payment is undone with a separate return entry, and a benefits deduction is undone by posting an adjusting credit. You want the workflow to store, for every step it completes, the inputs and the exact reversing command to send. Reversals must be safe to run twice, must save progress so a crash resumes where it stopped, and must page someone when one will not go through.",
    answers: ["compensating-transaction"],
  },
  {
    id: "compensating-transaction-3",
    text: "You maintain a warehouse fulfillment workflow that already coordinates picking, packing, label purchase, and carrier handoff. Roughly 700 times a day the carrier handoff fails permanently because the address is undeliverable, and by then the label has been bought for $8.40, the stock has been decremented, and the pallet has been staged. Undoing this is domain work, not a data restore: the label needs a refund request to the carrier, the stock needs a restock entry rather than an increment because other orders have already changed the same counts, and the pallet needs an unstage task for the floor crew. Today none of that happens automatically and the losses run about $5,000 a week. You need the workflow to keep an undo instruction for each completed step and to run them in a chosen order when the flow gives up.",
    answers: ["compensating-transaction"],
  },
  {
    id: "compensating-transaction-4",
    text: "An online gaming store runs a bundle purchase as a five-step process: charge the card, grant the base game, grant the two downloadable add-ons, credit 500 in-game currency, and post the achievement. When granting the second add-on fails because the entitlement service rejects a region restriction, the charge has already settled and the player already owns the base game and 500 currency they may have spent. Restoring the old state by force is wrong, because the currency balance has changed since then and other purchases touched it. The team wants each finished step to record a matching reversal action, such as a partial refund for the settled amount and a negative currency adjustment rather than a balance overwrite, and wants those reversals run and retried automatically after the forward path gives up.",
    answers: ["compensating-transaction"],
  },
  {
    id: "compensating-transaction-5",
    text: "A mortgage origination system runs an existing multi-step approval flow that pulls credit, orders an appraisal for $600, locks a rate with the funding desk, and reserves funds. About 120 files a month die at the funds reservation step after all retries fail, and by then the appraisal is ordered and billed, the rate lock is held for 45 days, and the credit pull is recorded. Each of those needs a different kind of reversal with its own business rule: the appraisal can be canceled only within 4 hours or it must be billed anyway, and the rate lock is released with a specific desk API call. Ops handles this on a spreadsheet today and misses about 1 in 8 rate lock releases. You want the flow to keep a durable record of each completed step plus its reversing command, run those commands when the file dies, and alert when one fails repeatedly.",
    answers: ["compensating-transaction"],
  },
  {
    id: "circuit-breaker-1",
    text: "Your checkout service calls a third-party fraud scoring API on every purchase, about 1,200 calls per second, with a 5 second timeout. Twice this month the vendor had a 25 minute outage where every call hung until timeout. During those windows all 200 threads in your web pool sat waiting, so unrelated endpoints like order history and address lookup also stopped responding and your whole service looked down. Your client kept firing the full 1,200 calls per second at the vendor the entire time, none of which had any chance of succeeding, and the vendor's status page later said the retry volume slowed their recovery. You want the client to notice a burst of failures, start refusing to make the call at all and return a low-risk default instantly, then carefully let a few real calls through after a cooldown to see if the vendor is healthy again.",
    answers: ["circuit-breaker"],
  },
  {
    id: "circuit-breaker-2",
    text: "A video streaming backend asks a recommendations service for the home screen rows. Yesterday that service ran out of memory and returned errors on 100 percent of requests for 18 minutes. Your home screen API kept calling it 8,000 times a second the whole time, each call burning a connection from a pool of 500 and taking 3 seconds to fail, so the home screen p99 went from 120 ms to 9 seconds even though the rest of the page came from a cache that was fine. The recommendations team said the constant traffic kept their pods crash-looping so they could not come back up. You need the caller to stop making calls entirely once failures cross a threshold, return a cached generic row list right away, and only resume after probing with a small number of requests.",
    answers: ["circuit-breaker"],
  },
  {
    id: "circuit-breaker-3",
    text: "An IoT platform ingests readings from 400,000 smart meters and writes each one to a time series database. When that database goes into a long compaction and stops accepting writes, which happens for 10 to 30 minutes about once a week, your ingest workers keep attempting every write. Each attempt blocks a worker for the full 10 second timeout, so the worker pool empties, the device-facing HTTP endpoint stops answering health checks, and the load balancer pulls healthy nodes out. The database team says the flood of doomed writes lengthens the compaction. You want the ingest workers to detect the sustained failures, immediately stop attempting writes and spool to local disk instead without waiting on the network, and then test the database with a handful of writes before returning to normal.",
    answers: ["circuit-breaker"],
  },
  {
    id: "circuit-breaker-4",
    text: "A bank's mobile API calls a mainframe balance service through a gateway that supports only 60 concurrent sessions. When the mainframe goes into its nightly window and starts returning errors for 40 minutes, your API keeps sending calls, every session is consumed by requests that are certain to fail, and transfers and bill pay, which use the same gateway sessions, stop working too. Support tickets spike and the p99 for every endpoint goes past 20 seconds. What you want is for the caller to count recent failures, and once they pass a limit within a short window, immediately return a clear 'balance unavailable' response without touching the gateway at all, then after a wait allow a couple of calls through to check whether the mainframe is answering again.",
    answers: ["circuit-breaker"],
  },
  {
    id: "circuit-breaker-5",
    text: "An ad server calls three external bidding exchanges in parallel and must answer in under 100 ms. One exchange has been going fully dark for 5 to 15 minutes at a time, several times a day, during which it accepts the TCP connection but never responds. Your server waits the full 100 ms on every one of those 30,000 calls per second, which holds sockets and pushes your own response past the publisher deadline, so you lose revenue on the two healthy exchanges too. You want the caller to notice that one exchange has failed on most recent calls and simply skip it, returning no bid from that exchange instantly with zero network work, then start including it again only after a quiet period and a few successful test calls.",
    answers: ["circuit-breaker"],
  },
  {
    id: "retry-with-backoff-and-jitter-1",
    text: "A ride hailing app has 60,000 driver phones that send a location update to your ingest API every 4 seconds. When one of your API nodes restarts, the clients that were talking to it all get a connection error at the same instant. Every client is coded to try again after exactly 1 second, so 4 seconds later the remaining nodes take a single spike of 60,000 requests in one 50 ms slice and start failing too, which produces another synchronized wave. The failures themselves are short, usually gone within 2 seconds. You need the clients to wait longer after each successive failure and to pick a random wait inside that growing window, so the retries spread out instead of landing together, with a hard cap on attempts.",
    answers: ["retry-with-backoff-and-jitter"],
  },
  {
    id: "retry-with-backoff-and-jitter-2",
    text: "Your batch job writes 2 million rows a night to a managed key-value store, and about 0.3 percent of writes come back with a brief capacity error that clears in well under a second. The job runs on 200 workers, each retrying a failed write immediately in a tight loop, and the store's dashboard shows a sawtooth: a small error blip turns into a 5x request spike, which causes more errors, which causes a bigger spike. Total job time went from 40 minutes to over 3 hours. The errors are genuinely temporary and the same write can be repeated safely because each row has a unique key. You need each worker to wait a growing amount of time between attempts and to randomize each wait so the 200 workers do not line up.",
    answers: ["retry-with-backoff-and-jitter"],
  },
  {
    id: "retry-with-backoff-and-jitter-3",
    text: "A payments SDK you ship to 8,000 merchant servers posts to your authorization endpoint. During a 3 second network blip in one availability zone, every merchant's request failed and every SDK immediately re-sent, then re-sent again 100 ms later, producing a burst of 400,000 requests in 2 seconds against an endpoint sized for 5,000 per second. The original blip was over in 3 seconds, but the burst kept the endpoint degraded for 11 minutes. Every request already carries a unique operation ID that your server deduplicates, so repeating a call is safe. You want the SDK to space its attempts out with each wait longer than the last, chosen randomly within that range, and to stop after a small fixed number of tries.",
    answers: ["retry-with-backoff-and-jitter"],
  },
  {
    id: "retry-with-backoff-and-jitter-4",
    text: "A game client with 250,000 concurrent players reconnects to your matchmaking service after a brief deploy that drops all websocket connections for about 2 seconds. Every client reconnects the moment the socket closes, so your gateway sees 250,000 handshakes inside one second, runs out of file descriptors, and rejects most of them, which makes every rejected client reconnect again in lockstep. It takes 25 minutes to settle even though the underlying deploy took 2 seconds. You want each client to wait before reconnecting, double that wait after each failure up to a ceiling of 30 seconds, and pick the actual wait as a random value inside that range so the crowd spreads across time.",
    answers: ["retry-with-backoff-and-jitter"],
  },
  {
    id: "retry-with-backoff-and-jitter-5",
    text: "A hospital records integration reads from a vendor FHIR API that returns a temporary 503 on roughly 1 in 200 calls, usually recovering within a second. Your sync service runs 50 parallel readers, each of which retries a 503 right away up to 10 times with no wait, and the calling layer above it also retries the whole batch 3 times. During a 10 second vendor hiccup last Tuesday, the combination sent 90,000 requests where the normal rate is 400, and the vendor blocked your API key for an hour. You need a single layer to do the retrying, with the wait growing after each attempt and randomized so the 50 readers do not fire together, and a fixed attempt limit.",
    answers: ["retry-with-backoff-and-jitter"],
  },
  {
    id: "bulkhead-1",
    text: "Our checkout service calls three outside vendors during a purchase: fraud scoring, sales tax, and address cleanup. All three calls go through one shared pool of 200 worker threads. Last Tuesday the tax vendor got slow, 90ms average up to 9 seconds, but it never returned errors and every call eventually succeeded. Within two minutes all 200 threads were parked waiting on tax, so fraud scoring and address cleanup got no threads at all and the whole checkout page returned 500s. Gift card purchases, which never touch the tax vendor, also failed. We want a slow vendor to only be able to stall the purchases that need that vendor.",
    answers: ["bulkhead"],
  },
  {
    id: "bulkhead-2",
    text: "A hospital records system uses one database connection pool of 60 connections. Clinician chart lookups run against it all day and need to answer in under 400ms. A nightly bulk export for the research team also runs against it, and last week it was rescheduled to 7am by mistake. The export opened 55 long-running connections, so chart lookups queued for connections and timed out for 20 minutes while doctors were seeing patients. The database itself was fine and had CPU headroom the whole time. We need the export to never be able to take more than a fixed slice of the connections, so lookups always have their own.",
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
    text: "Our clinic scheduling app checks insurance eligibility through a vendor whose contract allows 20 requests per second for our key. Each morning at 6am we run 90,000 checks for that day's appointments, and our worker pool fires them as fast as threads free up, around 300 per second. The vendor rejects the excess and has now sent us a written warning that they will suspend the key if it keeps happening. Our workers can easily do 300 per second, but the vendor cannot take them. We need our side to release calls at a steady 20 per second, spread evenly across the whole job, instead of firing everything at once.",
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
    text: "Our hosted API runs on a fleet of 26 identical request-handling nodes serving 9,000 customers. A load balancer spreads every customer's traffic across all 26. Last month one customer sent a request pattern that pegged CPU on whatever node handled it, and since their traffic went everywhere, all 9,000 customers saw errors at once. Giving each customer their own dedicated node would need 9,000 nodes and we can afford 26. What we want is for each customer to be served by only a small fixed group of those 26 nodes, chosen so that any two customers almost never draw the same group, which would put the number of customers hurt by one bad one well under 1%.",
    answers: ["shuffle-sharding"],
  },
  {
    id: "shuffle-sharding-2",
    text: "We run webhook delivery for 12,000 merchants on a pool of 40 sender processes, and any sender can pick up any merchant's deliveries. One merchant's endpoint started holding connections open for the full 30 second timeout on every call, and because their deliveries landed on all 40 senders, every merchant's webhooks were 20 minutes late. Timeouts and retry limits reduce the damage but do not change the fact that one merchant's traffic touches the entire pool. Buying 12,000 dedicated senders is out of the question. We want each merchant tied to a small handful of the 40 senders so that a bad endpoint can only slow the few merchants who happen to draw the same handful.",
    answers: ["shuffle-sharding"],
  },
  {
    id: "shuffle-sharding-3",
    text: "Our payments API gateway runs on 100 nodes and serves 60,000 API clients. We found a parsing bug where one specific malformed request crashes the node that receives it. One client's integration sent that request in a loop, and because their retries went to a new node each time, they walked through and crashed most of the fleet in under three minutes, taking down all 60,000 clients. We have fixed that one bug, but the next bad request will do the same thing. We need an arrangement where a single client can only reach a small named group of the 100 nodes, and where two clients drawing the exact same group is rare.",
    answers: ["shuffle-sharding"],
  },
  {
    id: "shuffle-sharding-4",
    text: "Our multiplayer game runs 64 chat relay servers for 30,000 guilds, and guild traffic is spread across all of them. A guild running a bot that posted 5,000 messages per second saturated every relay and chat broke for all 30,000 guilds for 11 minutes. One relay per guild is far too expensive at our price point. Splitting the guilds into 8 fixed groups of 8 relays each was our first idea, but that still means one bad guild takes out an eighth of our players. We want the number of guilds affected by any single bad guild to be a few dozen, not thousands, using the same 64 relays.",
    answers: ["shuffle-sharding"],
  },
  {
    id: "shuffle-sharding-5",
    text: "Our industrial IoT service has 30 message brokers handling 10,000 customer device fleets, and every fleet's devices can connect to any broker. When one customer's 40,000 devices got into a reconnect loop from a bad certificate rollout, they hammered all 30 brokers and every other customer's telemetry stalled for half an hour. Connection caps per customer help with volume but not with the fact that their connections reach every broker in the fleet. We cannot dedicate brokers per customer at 10,000 customers. We want each fleet assigned to a small group of brokers, picked so that the chance any two fleets land on the same group is tiny.",
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
    text: "Our video platform has a background service that rebalances which encoder machines handle which regions. It reads the whole fleet's queue depths and issues reassignment commands. The service runs as 4 identical replicas across three availability zones. When two replicas rebalance at once they issue conflicting commands and encoders flap between regions, which added 6 minutes of encode delay during the last incident. The rebalance itself is cheap and one replica can easily handle it. What we need is a reliable way for the replicas to agree, without an operator involved, on which single replica is allowed to issue commands right now, and for that right to move automatically when a zone goes down.",
    answers: ["leader-election"],
  },
  {
    id: "scheduler-agent-supervisor-1",
    text: "Our health insurance claims service moves each claim through 6 steps: intake validation, eligibility check, provider lookup, pricing, payment authorization, and notification. Steps 2 and 5 call outside systems that sometimes hang. We process about 4,000 claims a day, and roughly 60 of them end each day sitting in status processing forever, because the worker handling them crashed or the outside call never returned. Nobody finds them until a provider calls three weeks later, and then an engineer runs UPDATE statements by hand to push them along. We want each step to carry a deadline and a retry count, and we want something to look for steps past their deadline on a timer and either push them through again or give up and raise an alert.",
    answers: ["scheduler-agent-supervisor"],
  },
  {
    id: "scheduler-agent-supervisor-2",
    text: "Activating a new mobile line in our telecom system takes 4 steps that hit 4 different vendor systems: number reservation, SIM registration, billing account setup, and network provisioning. About 3 percent of activations stall partway. The usual cause is that a vendor call takes longer than the worker's 90 second timeout, the worker dies, and the activation row stays marked in progress with no owner. Our support team has a spreadsheet of stuck line numbers they replay manually every morning. We already have the undo commands written for each step. What is missing is a durable record of each step's owner, deadline, and attempt count, plus something running on a timer that finds the abandoned rows and either restarts them or triggers the undo path after too many attempts.",
    answers: ["scheduler-agent-supervisor"],
  },
  {
    id: "scheduler-agent-supervisor-3",
    text: "Our platform provisions a new customer environment in 9 steps, calling a DNS provider, a certificate authority, a container platform, and a billing system. A full run takes 12 to 20 minutes. When a step's remote call fails permanently, or when the process running the workflow is terminated by a node drain, the run just stops. We currently have 140 half-built environments in the database, some 5 months old, each holding a reserved subdomain. The workflow code itself is fine and each remote call already retries short failures. We need a persistent record of where every run is, a maximum time each step is allowed to take, and a separate process that periodically scans for runs past that time and recovers or fails them.",
    answers: ["scheduler-agent-supervisor"],
  },
  {
    id: "scheduler-agent-supervisor-4",
    text: "Our marketplace pays out sellers in a nightly batch. Each payout runs through 5 steps, and step 3 calls the bank's transfer API, which returns in about 800 milliseconds normally but has hung for over 10 minutes twice this quarter. When a payout worker is redeployed mid-batch the payouts it held stay in state SENDING with no owner and no timeout, so they are neither retried nor cancelled. Last month 312 sellers were paid two days late because nobody spotted 312 rows in that state. We want a deadline stored on each step, a worker that gives up quietly once the deadline passes rather than replying late, and a periodic checker that resets or escalates anything sitting past its deadline.",
    answers: ["scheduler-agent-supervisor"],
  },
  {
    id: "scheduler-agent-supervisor-5",
    text: "Launching an ad campaign in our system means calling 5 different exchange APIs in order, then a creative approval service, then a budget service. Roughly 1 in 30 launches ends up half-applied, live on 3 exchanges and missing from 2, usually because an exchange call timed out and the worker process was recycled before it could react. Our account managers find these by eye and re-run the launch, which sometimes creates duplicate campaigns. We want every step's status, attempt count, and complete-by time written to a store, and a separate periodic process that finds launches whose current step blew its complete-by time and drives them back to a good state or starts the rollback.",
    answers: ["scheduler-agent-supervisor"],
  },
  {
    id: "deployment-stamps-1",
    text: "We sell payroll software to 430 companies. Everything runs as one shared application tier and one shared Postgres cluster, and that cluster is at 84 percent of its maximum storage with connection counts near the instance limit. Two large customers now demand that their records live in their own separate database with their own encryption keys, and three risk-averse hospitals want to stay on the previous release for 30 days after we ship. A bad migration last quarter took all 430 companies offline for 51 minutes. Any given company's users all work in one country and never need to reach another company's data, so pinning each company to a fixed complete copy of the whole application plus its own database would solve the capacity ceiling, the isolation demand, and the all-at-once outage risk.",
    answers: ["deployment-stamps"],
  },
  {
    id: "deployment-stamps-2",
    text: "Our restaurant point-of-sale backend serves 1,200 chains from a single deployment. We already split the orders table across 8 database shards, but the shared search cluster, the shared cache, and the shared message broker have each hit their own limits, and adding chains is now hitting a nonlinear cost curve. On top of that, our largest chain has a contract requiring its data to never share infrastructure with other customers. Chains never query each other's data and a chain's traffic all comes from one country. We want to stop growing one giant environment and instead run several complete self-contained copies of the whole application, each with its own database and search cluster, each serving a fixed assigned list of chains, with a small lookup service in front that knows which chain lives where.",
    answers: ["deployment-stamps"],
  },
  {
    id: "deployment-stamps-3",
    text: "We run a clinical records product used by 60 hospital groups. German hospitals must have their data physically stored and processed in Germany, Canadian ones in Canada, and one government client requires a completely separate environment that our other clients never touch. Today it is one deployment in one region with row-level tenant filtering, and a single bad release affects everyone at once. Each hospital group's clinicians only ever access their own group's records, from one country. We want to build the full application and its database as a repeatable unit we can deploy many times, put a fixed set of hospital groups on each copy, and roll releases out one copy at a time starting with the ones that tolerate frequent changes.",
    answers: ["deployment-stamps"],
  },
  {
    id: "deployment-stamps-4",
    text: "Our warehouse management platform serves 220 logistics operators from one shared environment. A single operator running a 900,000 row inventory reconciliation last Thursday drove shared database CPU to 100 percent and slowed scanner requests for every other operator from 80 milliseconds to 9 seconds. Splitting thread pools did not help, because the bottleneck was the one database everybody shares, and that database is already the largest instance our provider sells. Operators never share data and each one works out of a single country. We want to package the entire environment, application servers and database together, and run many identical copies, each carrying a limited number of operators, so one operator's heavy job can only affect the handful of operators sitting on the same copy.",
    answers: ["deployment-stamps"],
  },
  {
    id: "deployment-stamps-5",
    text: "Our banking-as-a-service platform hosts 75 fintech clients on one stack. Compliance now requires that clients under a national banking license run on infrastructure with no shared components with unlicensed clients, and two clients need to freeze on a specific release for their annual audit while everyone else takes weekly updates. We are also finding that our per-client onboarding time grows as the shared database grows, and we cannot buy a bigger instance. A client's requests always belong to that client and never need data from another. The direction we are considering is defining the whole environment in Terraform as one repeatable unit, deploying it many times, assigning each client to exactly one of those deployments, and updating them on different schedules.",
    answers: ["deployment-stamps"],
  },
  {
    id: "geodes-1",
    text: "Our multiplayer game runs presence, friends, and chat from one region in Virginia. Players in Seoul see 240 milliseconds on every chat send and 310 milliseconds on presence updates, and our Sydney player base has been complaining for a year. Any player can be anywhere on any day, players travel, and a squad often has members on three continents who all write to the same chat room. Read replicas do not help because these are write-heavy operations. We want the same full backend running in Virginia, Frankfurt, and Singapore, with a global entry point sending each player to whichever one is closest right now, a database that accepts writes in all three and replicates between them, and enough independence that losing Frankfurt just shifts its players to the other two.",
    answers: ["geodes"],
  },
  {
    id: "geodes-2",
    text: "Our ride-hailing dispatch API is deployed in one region in Ireland. Drivers in Sao Paulo post location updates every 4 seconds and each update costs 190 milliseconds round trip, which is hurting dispatch accuracy. Drivers and riders are not tied to any region; a driver may cross a border mid-shift and riders open the app while travelling. Every request both reads and writes trip state, so a read-only copy in Brazil would not work. We want identical full deployments in several regions worldwide, any one of which can serve any driver or rider, a routing layer in front that picks the nearest, and a data store that accepts writes in every region and keeps them in sync, so a full region loss just moves traffic to the survivors.",
    answers: ["geodes"],
  },
  {
    id: "geodes-3",
    text: "We run a collaborative whiteboard used by 400,000 people a day. All writes go to one region in Oregon, and users in India see 280 milliseconds per stroke, which makes drawing feel broken. A single board frequently has editors in Bangalore, London, and San Francisco writing at the same time, so we cannot assign a board or a user to a home region. We also want to survive the loss of an entire region without a failover procedure. The shape we are aiming for is the same complete backend deployed in five regions, each able to serve any user and accept any write, fronted by one global address, with the data layer replicating writes among all five.",
    answers: ["geodes"],
  },
  {
    id: "geodes-4",
    text: "Our connected-car platform ingests 20,000 telemetry messages per second from vehicles in 40 countries and also serves the driver mobile app. Everything runs in one region in Ohio. Cars roam across continents on shipping routes and rental fleets, so no vehicle belongs to a fixed region, and both the ingest path and the app path write vehicle state. Vehicles in Europe currently see 160 milliseconds of extra latency on every command acknowledgment, and a 40 minute outage in Ohio last spring took the whole fleet offline worldwide. We want the identical stack running in several regions, any of which can handle any vehicle or any driver, behind a global routing layer, on a store that takes writes everywhere and replicates them.",
    answers: ["geodes"],
  },
  {
    id: "geodes-5",
    text: "Our real-time bidding service must respond to exchange requests in under 100 milliseconds or the bid is discarded. Running from two regions in the United States, we lose 38 percent of bids from Asian exchanges purely on network time. Bid requests can arrive from any exchange in any region, they are not tied to a customer or a location, and each one both reads and updates a shared budget counter for the campaign. We want the full service, including the budget data, running in many regions worldwide, each region able to serve any incoming bid request on its own, with a global front end steering each request to the nearest region and replication keeping the data identical across all of them.",
    answers: ["geodes"],
  },
  {
    id: "sidecar-1",
    text: "A payments company runs 22 backend services across Java, Go, Python, and Node. Security now requires every outgoing internal call to use mutual TLS with certificates that rotate every 24 hours, plus a standard retry and timeout policy. The team has already written the certificate handling twice, once as a Java library and once as a Go library, and the Python and Node versions are still not started. Every certificate format change means four libraries to update and 22 services to rebuild and redeploy. They want the connection handling to run as its own program next to each service instance, reachable over localhost, started and stopped with that instance, so the service code just makes a plain HTTP call and never knows about certificates.",
    answers: ["sidecar"],
  },
  {
    id: "sidecar-2",
    text: "A hospital imaging system includes a vendor-supplied C++ program that reads scanner output. The hospital has no source code and the vendor ships a new binary twice a year. Compliance now requires that program's log files be shipped to a central audit store within 60 seconds and that its outbound connections use certificates the hospital rotates weekly. The program only writes logs to a local directory and only speaks plain HTTP. The team wants to run a second small program in the same pod, sharing the same log directory and the same local network space, that tails those files, forwards them, and handles the certificate work, so the vendor binary is never modified.",
    answers: ["sidecar"],
  },
  {
    id: "sidecar-3",
    text: "A game studio runs match servers written in C#, and matchmaking and chat services written in Elixir and Rust. All of them need to read tuning values, such as XP multipliers and region routing rules, from a central configuration store, and pick up changes within 30 seconds without restarting. Right now each language has its own client that polls the store, and the three clients disagree about caching and retry behavior, so during one incident the Rust services kept serving values that were 11 minutes old. The studio wants one small program deployed alongside every server instance that does the polling and exposes the current values on a local port, so each server just reads localhost and no language-specific client is needed.",
    answers: ["sidecar"],
  },
  {
    id: "sidecar-4",
    text: "A fleet telematics platform has an ingest service written in Rust that only speaks plain HTTP POST. A newly acquired hardware line sends MQTT over TLS with a binary payload format the ingest service cannot parse, and rewriting the ingest service would take a quarter and put the 40,000 messages per second hot path at risk. The team wants a small translator program deployed in the same container group as each ingest instance, listening for the MQTT traffic and converting it into the plain HTTP POST calls the ingest service already understands over the local interface. It should be built in Go by the hardware team, released on its own schedule, and torn down with the ingest instance it belongs to.",
    answers: ["sidecar", "anti-corruption-layer"],
  },
  {
    id: "sidecar-5",
    text: "An ad exchange embeds a log enrichment and shipping library inside each bidder process. The library adds geo and advertiser fields to every log line, and at peak it holds 1.4 GB of buffered lines in the same heap as the bidder, which pushed three bidder instances into out-of-memory crashes last week. The bidders run in Java and Go, so the library exists twice, and the buffering bug had to be fixed twice. The team wants that enrichment and shipping work moved into its own container running on the same host as each bidder, with its own 512 MB memory cap, receiving lines over a local socket, so a buffering problem can no longer kill the bidder and one build serves both languages.",
    answers: ["sidecar"],
  },
  {
    id: "service-discovery-1",
    text: "A logistics routing platform scales its route-solver instances between 8 and 60 copies depending on parcel volume, and each copy gets a new private IP when it starts. The dispatch service reads a list of solver IP addresses from a YAML file baked into its container image. Every scale-up requires an ops engineer to edit the file, rebuild, and redeploy dispatch, and after a scale-down dispatch keeps calling addresses that no longer exist, producing about 4,000 connection timeouts an hour until someone notices. The team needs dispatch to look up which solver addresses are alive right now, with dead ones dropped automatically after a failed health check.",
    answers: ["service-discovery"],
  },
  {
    id: "service-discovery-2",
    text: "A video transcoding company runs its encoder workers on interruption-prone cheap compute, so on a normal day roughly 200 workers start and 180 are reclaimed, each with a different host and port. The job scheduler holds worker addresses in a text file that an engineer updates by hand each morning. By afternoon a third of the entries point at machines that are gone, and jobs sent to them sit unclaimed until a 10 minute timeout fires. The team wants each worker to announce its address when it boots and remove itself when it shuts down, so the scheduler always reads a current list instead of a stale file.",
    answers: ["service-discovery"],
  },
  {
    id: "service-discovery-3",
    text: "A bank runs 30 internal services on a container platform where a failed host causes the platform to restart the affected containers on different machines with different addresses. Callers get target addresses from a spreadsheet-driven configuration bundle that is regenerated once per deploy. During last month's host failure, the payments API kept calling the old address of the account service for 22 minutes because nothing told it the address had changed. The bank wants a service that keeps a live table of service names to current instance addresses, updated as instances start and stop, and checked with a health endpoint every few seconds so callers stop being handed addresses that no longer answer.",
    answers: ["service-discovery"],
  },
  {
    id: "service-discovery-4",
    text: "A multiplayer game boots a dedicated match process per game, and each process binds whatever port the host has free, so a single machine may run 40 matches on 40 unpredictable ports. The matchmaker currently guesses ports by convention and gets it wrong often enough that 3 percent of players are sent to a port with nothing listening. Matches also end constantly, freeing ports that the matchmaker keeps handing out for another minute. The studio wants each match process to publish its host and port when it starts accepting players and withdraw that entry when the match ends, so the matchmaker can ask for the set of currently joinable matches.",
    answers: ["service-discovery"],
  },
  {
    id: "service-discovery-5",
    text: "An online grocery platform relies on internal DNS names for its 18 services. Client libraries cache DNS answers for the record's 60 second lifetime, and the JVM services cache them longer, so after an autoscaling event new inventory service instances get no traffic for several minutes while old addresses still receive calls and fail. DNS also gives no way to know whether an instance passes its health check, only whether the name resolves. The platform team wants a central service holding the live instance addresses for each service name, updated by instances as they come and go and pruned by health checks, that callers query directly instead of resolving a name.",
    answers: ["service-discovery"],
  },
  {
    id: "publisher-subscriber-1",
    text: "A ride-hailing backend finishes a trip and must tell several other teams. Over two years, the trip service grew seven outbound HTTP calls in its completion handler: receipts, driver payouts, loyalty points, the fraud team, the support tool, the data warehouse loader, and the insurance partner. Adding an eighth consumer means a pull request against the trip service, a code review from a team that does not care about the new feature, and a redeploy of the busiest service in the company. Worse, when the loyalty service was down for 12 minutes, trip completion latency went from 90 ms to 8 seconds because the handler waited on it. The team wants the trip service to announce that a trip finished once, with no knowledge of who reacts, and let each team attach and detach on its own.",
    answers: ["publisher-subscriber"],
  },
  {
    id: "publisher-subscriber-2",
    text: "A bank posts about 12 million card transactions a day and five internal groups want to react to them. The fraud group wants only transactions over 500 dollars or from outside the cardholder's country, the statement group wants all of them, the rewards group wants only merchant categories 5411 and 5812, and two analytics groups want everything but read hours later during their nightly window. Today the core ledger writes to a single queue that the fraud group drains, and the other four groups ask the ledger team to add more queues and more send calls. The bank wants one announcement per posted transaction that any group can attach its own filtered feed to, with each group getting its own copy and its own backlog when it falls behind.",
    answers: ["publisher-subscriber"],
  },
  {
    id: "publisher-subscriber-3",
    text: "A video platform finishes ingesting an upload and then must trigger thumbnail generation, caption transcription, copyright matching, search indexing, and a creator notification. The upload service calls all five in sequence, so a finished upload is not marked ready for 40 seconds, and last week the captions service returned 500s for an hour and uploads stopped completing entirely. The moderation team now wants to add a sixth reaction, and the search team wants to split into two consumers, both of which mean changing and redeploying the upload service. The platform wants the upload service to state that an upload finished exactly once and return in under 50 ms, with each downstream team wiring up its own independent feed off that announcement.",
    answers: ["publisher-subscriber"],
  },
  {
    id: "publisher-subscriber-4",
    text: "A utility company collects 15-minute readings from 4 million smart meters. Three separate systems care about each reading: billing, an outage detection service, and a machine learning feature store owned by a different department that runs its own maintenance window every Tuesday and stays offline for two hours. Right now the ingest service writes readings to one queue, and when the feature store team asked for their own copy, the ingest team started writing the same message twice to two queues, which drifted out of sync after a schema change. The company wants ingest to announce each reading once while each of the three systems keeps its own copy and its own backlog, so the Tuesday outage means the feature store catches up afterward and nobody else notices.",
    answers: ["publisher-subscriber"],
  },
  {
    id: "publisher-subscriber-5",
    text: "A marketplace changes a product price roughly 900 times per minute across 2 million listings. Six systems need to know: the search index, the cart recalculation job, the price history archive, two partner feed exporters, and a merchandising alert tool that only cares about drops over 20 percent. The catalog service currently keeps a hardcoded list of six endpoints and posts to each one, and when a partner exporter started timing out, catalog write throughput fell by 70 percent because the posts were in the same request path. A seventh system is being built by a team in another region on a different stack. The catalog service should state a price changed once and stop knowing anything about who listens.",
    answers: ["publisher-subscriber"],
  },
  {
    id: "canary-release-1",
    text: "A streaming service rewrote the manifest server that tells players which video quality to request. Load tests look fine, but the old server has years of odd behavior around slow mobile networks that nobody fully understands, and rebuffering rate is the metric leadership watches. The team deploys the new server to three machines that receive no traffic yet, then shifts 1 percent of playback sessions to it and watches rebuffer rate, startup time, and CPU against the old machines for two hours. If the numbers hold, they move to 5 percent, then 25 percent, then all of it. If rebuffer rate climbs above the old version's 0.8 percent, they set the routing share back to zero and every session returns to the old server.",
    answers: ["canary-release"],
  },
  {
    id: "canary-release-2",
    text: "A payments processor is replacing the service that scores card authorizations for fraud. Replaying last month's traffic offline gives a decline rate within 0.1 percent of the current service, but the offline replay cannot reproduce timing, retries, or issuer responses. Declining good cards costs real money, so the team will not switch everything at once. They stand up the new scorer on its own instances, route 2 percent of live authorizations to it, and compare decline rate, approval rate, and p99 latency against the remaining 98 percent for a full business day before stepping the share up. Any drift beyond half a percent and the routing rule sends all authorizations back to the old scorer.",
    answers: ["canary-release"],
  },
  {
    id: "canary-release-3",
    text: "An online marketplace rewrote its search ranking service. The staging environment only holds 2 percent of the catalog and gets synthetic queries, so click-through rate there means nothing. The only way to know whether the rewrite helps is real shoppers on the real index. The team wants the new ranking service running on separate instances taking a small, growing slice of live search requests, starting at 1 percent, while they compare click-through rate, zero-result rate, and p95 latency between the slice and everyone else. They also need a single routing change that pulls the slice back to zero within seconds if conversions drop.",
    answers: ["canary-release"],
  },
  {
    id: "canary-release-4",
    text: "An airline booking system is upgrading its Java runtime across 200 application servers. The new runtime changes garbage collection behavior, and the team has been burned before by pause times that only appear after eight hours under real booking traffic with real session sizes. Synthetic load never reproduced it. They plan to upgrade four servers, send them 5 percent of live booking traffic, and watch pause times, heap use, and error rate side by side with the untouched servers for two days before upgrading more. If pause times exceed 200 ms, those four servers drop out of the rotation and traffic returns entirely to the old runtime.",
    answers: ["canary-release"],
  },
  {
    id: "canary-release-5",
    text: "A health insurer is releasing a new version of the claims submission API used by 3,000 clinics. A bad release means rejected claims and phone calls from clinic staff, so the team wants exposure to grow in controlled steps. They deploy the new version to a separate group of servers, then set the router to send only their own internal test accounts there, then 10 clinics that agreed to it, then 1 percent of all clinics, checking rejection rate and p99 response time against the old servers at every step. The old version stays running the whole time, and the router rule can send that share back to zero in one change.",
    answers: ["canary-release"],
  },
  {
    id: "blue-green-deployment-1",
    text: "We run a card payment authorization API on 40 identical application servers behind one load balancer. Deploys are a rolling restart that takes 25 minutes, and during that window old and new code run side by side and we see about 900 failed authorizations from version mismatches. When a release goes bad, backing it out means another 25 minute rolling restart, so the damage keeps going the whole time. Bank partners hold us to 99.99 percent availability, so we need the cutover from old code to new code to happen for every request at the same instant, and we need the old code still running and warm so returning to it takes seconds. We have budget to run a second full set of 40 servers permanently.",
    answers: ["blue-green-deployment"],
  },
  {
    id: "blue-green-deployment-2",
    text: "Our hospital scheduling system serves 3,000 clinic staff and cannot be down during business hours, since a 10 minute outage means front desks fall back to paper. Today we deploy at 2am with a 40 minute maintenance page, and twice this year the new build failed smoke tests at 2:30am and the restore from backup took two hours. Compliance requires we prove before every release that the exact build going live has passed a full test run on production-grade hardware with production configuration, not on a smaller staging box. We want a second complete copy of the stack, database included, where we deploy and verify the release with no user traffic on it, then move all traffic over at once, and move it straight back if the first hour looks wrong.",
    answers: ["blue-green-deployment"],
  },
  {
    id: "blue-green-deployment-3",
    text: "A freight tracking platform ingests 12,000 GPS pings per second from 80,000 trucks and serves dispatcher dashboards. Last release we pushed a bad build and it took 18 minutes to rebuild and redeploy the previous version from the artifact store, during which dispatchers saw stale positions. We already keep a warm standby copy of the entire stack in the same region for disaster recovery, and it sits idle 364 days a year. The team wants to deploy each release onto that idle copy, run the full dispatcher test suite against it, then have the front-end router send 100 percent of traffic there in one step, keeping the previous copy untouched and ready to receive traffic again. Rolling out to a small percentage of dispatchers first is not useful to us because a stale map for even 1 percent of dispatchers triggers a support call.",
    answers: ["blue-green-deployment"],
  },
  {
    id: "blue-green-deployment-4",
    text: "Our online game runs a matchmaking service for 250,000 concurrent players, and the client holds a long-lived socket that reconnects on disconnect. Partial deploys are the problem: while half the fleet runs the new matchmaking rules and half runs the old, players in the same lobby get matched under different rules and about 4 percent of matches fail to start. We need every server answering a given moment to be on one version, and we need the old fleet kept running and warm so a bad release can be reversed inside 60 seconds instead of waiting 12 minutes for a redeploy. We can afford double the servers during release windows, and we already have a router in front that can be repointed in one config change.",
    answers: ["blue-green-deployment"],
  },
  {
    id: "blue-green-deployment-5",
    text: "A retail bank's statement portal gets 90 percent of its monthly traffic in a three-day window, and outages there generate regulator-reportable incidents. Our current process upgrades servers in place, so rolling back means reinstalling the old application package and its dependencies, which has taken up to 45 minutes and once left a machine in a broken half-upgraded state. Auditors also want us to rehearse failing over to our standby hardware more than once a year, and today that rehearsal never happens. We want a release process where the standby set of machines gets the new build, is verified end to end, then takes all production traffic in one cutover, with the former production set left intact as the immediate fallback and used to stage the next release. Our database changes will be written to work with both the old and new application versions so either side can serve traffic.",
    answers: ["blue-green-deployment"],
  },
  {
    id: "feature-toggles-1",
    text: "Our ad serving platform deploys 20 times a day from one shared branch, and a new bidding algorithm will take six weeks to finish. Keeping it on a side branch that long has already cost us two painful merges with 400 conflicting files. We want the half-finished bidding code to ship to production with every deploy but stay unreachable, and then have one person turn it on for real traffic later without any build, deploy, or restart. The same control should let us turn it back off within seconds if bid latency goes above 8 milliseconds, again without a deploy. The decision needs to be read from somewhere we can change while the process is running.",
    answers: ["feature-toggles"],
  },
  {
    id: "feature-toggles-2",
    text: "A video streaming service has a personalized recommendation row that costs about 120 milliseconds per page load and calls a machine learning service. During last month's traffic spike the recommendation service fell over and took the whole home page down with it. Operations wants a way to turn that one row off during load spikes and serve a plain popularity list instead, and they want to do it in under 30 seconds at 3am without waking a developer or shipping a build. The value should come from a config store the running servers read on each request. When the spike passes, they turn the row back on the same way.",
    answers: ["feature-toggles"],
  },
  {
    id: "feature-toggles-3",
    text: "We run a business banking web app and a new payments approval screen is finished and deployed to all servers, but legal will not let it go live until the customer agreement update lands on the 14th. Marketing wants it live at 9am sharp that day, and the deploy pipeline takes 50 minutes with a change advisory approval attached. Also, our 30 internal test users need the new screen right now so they can find bugs, while the other 40,000 customers keep seeing the old one. We want one named setting, stored in a database table, that decides per user which screen renders, so release timing and deploy timing stop being the same event.",
    answers: ["feature-toggles"],
  },
  {
    id: "feature-toggles-4",
    text: "Our IoT platform manages 2 million smart meters and a firmware update job that runs nightly. We are rewriting the scheduling logic and want to compare the old and new versions on live traffic, sending users into two groups by a hash of the meter id so each meter always gets the same version, and we need to change the split from 50/50 to 90/10 during the run based on what the error rate looks like. Deploying a new build to change that split is not workable, since each deploy takes 35 minutes and disturbs in-flight update jobs. Both code paths already exist in the shipped binary and we just need the running service to choose between them from a value we can edit at any time.",
    answers: ["feature-toggles"],
  },
  {
    id: "feature-toggles-5",
    text: "A logistics company's warehouse app has a premium route-optimization report that only customers on the enterprise plan may see. Today the check is a hardcoded list of 12 account ids compiled into the app, so adding a customer means a code change and a release, and sales asks for one about twice a week. We also want to give the whole feature to our own staff accounts before any customer sees a new version of it. The plan is to wrap the report code in a named check that reads its answer at request time from a store we can edit, with the caller's account passed in so the answer can differ per user. The dead branch and its check get deleted once every plan gets the report.",
    answers: ["feature-toggles"],
  },
  {
    id: "strangler-fig-1",
    text: "We own a 14-year-old insurance policy administration system, 900,000 lines of Java in one WAR file, handling quotes, policy issue, endorsements, billing, and claims. A full rewrite was estimated at three years, and the business will not accept a three-year freeze on new features. We can put a proxy in front that receives every HTTP request from the web and partner clients first. The plan is to start by rebuilding the quoting endpoints in a new service, then point the proxy so only /quote paths reach the new service while everything else keeps hitting the old WAR, then repeat with billing, claims, and the rest, deleting each chunk of old code once nothing routes to it. Clients should not notice which side answered.",
    answers: ["strangler-fig"],
  },
  {
    id: "strangler-fig-2",
    text: "A grocery retailer runs order management on a mainframe reachable through a CICS-backed HTTP wrapper, serving about 400 requests per second. Management wants off the mainframe because the annual license is $2.1 million and only two people still know the code, but stopping it all at once is impossible since it also runs pricing and inventory. We already added a routing service in front of the wrapper that all store apps call. The first move is to implement order status lookup in a new Go service and change the routing rules so status requests go there while order placement still goes to the mainframe, then take over placement, then pricing, retiring mainframe programs as their traffic drops to zero. Each move needs to be reversible by changing the routing rules back.",
    answers: ["strangler-fig"],
  },
  {
    id: "strangler-fig-3",
    text: "Our telehealth company has a PHP monolith from 2011 that serves appointments, video sessions, prescriptions, and patient messaging under one domain. Every release is a 6-hour ordeal because all four areas ship together, and last quarter a messaging bug rolled back an appointment feature that was fine. We want to move one area at a time into separate services while the monolith keeps serving the rest, with a proxy in front of the domain deciding, per URL path, whether the request goes to a new service or the old monolith. Messaging goes first because it has the cleanest boundary, and its PHP code gets deleted once the proxy stops sending it anything. The end state is a monolith that receives no requests and can be turned off.",
    answers: ["strangler-fig"],
  },
  {
    id: "strangler-fig-4",
    text: "A payments processor has a settlement platform written in Perl that handles 3 million transactions per night. Rewriting it in one go was tried in 2022, ran 11 months over, and was cancelled. The new plan starts by placing a request interceptor in front of the platform's internal API that at first forwards everything to Perl unchanged, proving the interceptor is transparent before any behavior moves. Then chargeback handling, about 4 percent of nightly volume, gets built in the new system and the interceptor starts sending only chargeback calls there. Each following release moves another slice of traffic, and the matching Perl modules are deleted once their traffic is zero, until nothing is left.",
    answers: ["strangler-fig"],
  },
  {
    id: "strangler-fig-5",
    text: "Our university runs student records on a vendor system nobody can extend, and we are building an in-house replacement, but we cannot cut over 45,000 students in one weekend during registration. We are putting a routing service in front of the student portal that forwards each request to either the old vendor system or our new one. Course search moves first, then transcripts, then registration, one per semester, with the routing rules being the only thing that changes when a piece moves. As soon as a piece is fully served by the new system, we cancel that vendor module and its license line. After the last piece moves the vendor system is turned off entirely.",
    answers: ["strangler-fig"],
  },
  {
    id: "anti-corruption-layer-1",
    text: "We are building a new order service in a clean domain model, and it has to keep reading customer data from a 1990s AS/400 system that will stay in place for at least five more years. That system returns fixed-width records where a customer is split across three record types, dates are stored as CYYMMDD integers, and a null address is the string SPACES. Right now three of our new services each parse those records themselves, and the CYYMMDD handling has been copy-pasted and got it wrong in two of them. We want exactly one piece of code that talks to the AS/400, taking calls in our own Customer shape and turning them into and out of the mainframe format, so no other new code ever sees a fixed-width record. It should hold only conversion work and field checks, no business rules, and it goes away when the AS/400 does.",
    answers: ["anti-corruption-layer"],
  },
  {
    id: "anti-corruption-layer-2",
    text: "Our clinical scheduling product integrates with three hospital electronic record systems that all speak HL7 v2 with different local field usage, so a patient identifier lives in PID-3 for one hospital and in PID-18 for another. Our internal model has one Patient type with a single id, and we do not want HL7 segment names appearing anywhere in our scheduling logic. Today they do: we have 60 places calling getField(\"PID\", 3) directly, and adding a fourth hospital means editing all of them. We want one piece of code that is the only thing that knows HL7 exists, taking our Patient and Appointment types in and producing the right segments per hospital, and returning our types back. It should validate incoming fields and log every conversion failure with a correlation id.",
    answers: ["anti-corruption-layer"],
  },
  {
    id: "anti-corruption-layer-3",
    text: "A new logistics pricing service we wrote has to quote using rates from a third-party carrier API we do not control. That API uses its own vocabulary: a shipment is a consignment, weights come back in stones, service levels are numeric codes like 07 and 12, and errors arrive as HTTP 200 with a body field errCd. Our developers started naming our own classes Consignment and passing around the numeric codes, and now the carrier's ideas are spread through code that has nothing to do with that carrier. We want a single component between our pricing code and that API, so our code only ever sees Shipment, kilograms, and our own ServiceLevel enum, and only that component knows how to map them. The carrier system is not being retired and is not something we are migrating off.",
    answers: ["anti-corruption-layer"],
  },
  {
    id: "anti-corruption-layer-4",
    text: "Our new subscription billing service is live for 200,000 accounts, but entitlements still come from a legacy CRM that will run for years. The CRM exposes a SOAP endpoint where an account has 140 fields, five of them mean status in different ways, and the meaning of the field ACT_FLG_2 was explained to us in a 2009 email. New code that calls it directly ends up carrying those five status fields around, and our domain has one clear SubscriptionState with four values. We want one component that owns every call to the CRM, taking SubscriptionState in and out and doing the messy mapping inside, adding about 8 milliseconds per call which we accept. It contains only mapping and validation, and we will monitor its error rate separately.",
    answers: ["anti-corruption-layer"],
  },
  {
    id: "anti-corruption-layer-5",
    text: "A new smart-building service we are writing reads sensor data from a building management system that speaks BACnet, where a temperature reading is an object with instance numbers, engineering-unit enums, and priority arrays. Our domain model wants a simple Reading with a device id, a value in Celsius, and a timestamp. Two of our services already imported the BACnet client library and now our code passes priority arrays around, which means we cannot test them without a BACnet simulator. We want one service in the middle that is the only thing importing that library, publishing our Reading shape to everyone else and converting commands the other direction. The building system belongs to the property owner and is never going away, so this component is permanent.",
    answers: ["anti-corruption-layer"],
  },
  {
    id: "gatekeeper-1",
    text: "We run a hospital records API that lets outside clinics submit patient documents over the public internet. Today the same service that parses the uploaded XML also holds the database password and the storage account key in its environment variables. A security review pointed out that our XML parser had two remote code execution advisories in the last year, and if someone gets shell on that box they get the keys to every patient record. We want the internet-facing part to do nothing but check the caller's certificate, confirm the document is under 5 MB and matches our schema, and strip anything unexpected, then hand the approved request to a service that has no public address at all. That inner service would be the only thing holding credentials.",
    answers: ["gatekeeper"],
  },
  {
    id: "gatekeeper-2",
    text: "Our payments company exposes one endpoint that partner merchants call to submit refund requests, around 400 requests per second. The endpoint currently runs inside the same process that talks to the ledger database and the card network. Twice we have had merchants send malformed JSON with 40 MB of junk in a description field, and once someone sent a SQL fragment that our ORM logged but did not execute. Compliance wants the public-facing code to run with zero access to any secret, do all field length and type checks itself, reject anything suspicious, and pass clean requests to the ledger service over a private network address unreachable from the internet.",
    answers: ["gatekeeper"],
  },
  {
    id: "gatekeeper-3",
    text: "A connected-car company accepts firmware telemetry uploads from 2 million vehicles. The upload handler is one service, and it also writes directly to the long-term storage bucket using a key with write access to everything. A red team showed that a crafted telemetry frame could crash the handler and, with more work, read that key out of memory. The fix we are considering is to split the handler in two: an outward-facing piece that only validates frame size, checksum, and device certificate, running with no storage key, and an inner piece that holds the key and is reachable only from that outward piece. Vehicles would never be able to reach the inner piece.",
    answers: ["gatekeeper"],
  },
  {
    id: "gatekeeper-4",
    text: "Our online game lets players upload custom level files, and the upload service both scans the file and writes to the shared asset database with an admin login. Last month a player found a buffer overflow in our level parser and got it to dump environment variables into an error message. We now want a separate small service to be the only thing the game client can connect to. It would check that the file is under 10 MB, that the header magic bytes match, that the player is not sending more than 5 uploads per minute, and then forward only accepted uploads to the internal asset service, which sits on a private address and holds the database login.",
    answers: ["gatekeeper"],
  },
  {
    id: "gatekeeper-5",
    text: "A bank runs a wire transfer intake API used by corporate treasury systems. Right now the internet-facing process performs the field checks and also signs messages with the HSM credentials. Auditors flagged that a single compromise of that process exposes both the public entry point and the signing ability. We plan to move the signing and the account lookups into a service with no public endpoint, and put a stripped-down front process in the public subnet that does nothing but authenticate the caller, verify amounts and account number formats, and cap requests per client. That front process would hold no keys of its own, so breaking into it gains an attacker nothing.",
    answers: ["gatekeeper"],
  },
  {
    id: "federated-identity-1",
    text: "We sell a warehouse management app to logistics companies. Each new customer asks us to import their employee list, and we end up storing 3,000 to 20,000 password hashes per customer. Every quarter a customer complains that a fired driver could still sign in for weeks because nobody told us to delete the account. Their IT teams already run a corporate directory that knows the moment someone leaves. We want our app to stop holding passwords entirely and instead send the user's browser to the customer's own sign-in system, then accept a signed token that tells us the user id and roles.",
    answers: ["federated-identity"],
  },
  {
    id: "federated-identity-2",
    text: "Our hospital scheduling web app has its own username and password table. Clinicians already sign in to the hospital network each morning, and they complain about typing a second password 8 to 10 times a day because our session expires after 30 minutes. We also spend about 15 support hours a week on password resets. We do not want to build multifactor support, risk detection, or password rotation ourselves. The plan is to redirect unauthenticated users to the hospital's existing sign-in service, exchange the returned code for a signed token, and read the user's department and role out of that token.",
    answers: ["federated-identity"],
  },
  {
    id: "federated-identity-3",
    text: "We run an ad campaign dashboard used by our own staff plus about 60 agency partners who are not in our employee directory. Today each partner gets an account in our database, and we have 1,400 partner accounts with no reliable offboarding. Partners want to sign in with the accounts their own companies already manage, and our staff want to keep using the corporate login. We plan to remove credential storage from the app, trust several external sign-in services, and decide what each user can do from the roles carried in the signed token they present.",
    answers: ["federated-identity"],
  },
  {
    id: "federated-identity-4",
    text: "Our mobile banking app currently stores passwords with bcrypt and handles its own password reset emails, lockouts, and one-time codes over SMS. A penetration test found our reset token was only 6 characters and never expired, and we do not have the staff to build proper account takeover detection. We want to hand sign-in off entirely to a separate service the bank already runs for its web portal, so a customer who signed in there is not asked again. Our app would only receive a signed token, check the signature, and read the customer id and permitted product list from it.",
    answers: ["federated-identity"],
  },
  {
    id: "federated-identity-5",
    text: "We build a video editing tool sold to studios. Small studios want to sign in with their existing Google or Apple accounts, while large studios insist their staff use the studio's own login system so they can enforce hardware keys. Maintaining our own account table means we would have to build both flows and still store passwords for a third group. Instead we want the app to hold no credentials, redirect each user to whichever sign-in service matches their email domain, and then read the user id and plan level out of the signed token that comes back.",
    answers: ["federated-identity"],
  },
  {
    id: "distributed-tracing-1",
    text: "A checkout request in our retail platform passes through 11 services before returning. The 99th percentile went from 400 ms to 2.1 seconds last week, and nobody can say which hop is responsible. Each service logs its own timings, but the logs have no shared identifier, so joining them means guessing by timestamp across machines whose clocks drift by up to 300 ms. When a customer reports a failed order we currently grep 11 log sets by their email address, which only works for the two services that log it. We want a single random id created at the edge, passed on every downstream call as a header, printed in every log line, and reported with per-step start and end times to a central collector.",
    answers: ["distributed-tracing"],
  },
  {
    id: "distributed-tracing-2",
    text: "Our ride-hailing backend fans a single trip request out to pricing, driver matching, maps, and fraud scoring, and each of those calls two or three more services. About 0.3 percent of trip requests take over 8 seconds, but every individual service reports a 95th percentile under 120 ms, so the slow time is hiding in a path we cannot see end to end. We can reproduce nothing because the slow ones are scattered. Engineers want to pick one slow request and see the exact ordered list of service calls it made, how long each took, and which one waited on which.",
    answers: ["distributed-tracing"],
  },
  {
    id: "distributed-tracing-3",
    text: "A video streaming company gets support tickets saying playback start took 6 seconds. The start path touches the entitlement service, the manifest builder, the DRM license service, and two caches, all in different teams. Each team looks at their own dashboard, sees healthy averages, and says the problem is someone else. There is no way to follow one specific playback attempt through all five systems. We want each incoming playback request tagged with a unique id at the first server, that id carried in the headers of every internal call, and each service to report its own timing under that id to one place we can query.",
    answers: ["distributed-tracing"],
  },
  {
    id: "distributed-tracing-4",
    text: "Our insurance claims platform is 30 services deep in places. A claim submission occasionally returns a 500 error, about 40 times a day out of 200,000 submissions, and the error message is always a generic timeout from the outermost service. The failing dependency is different every time. Debugging means asking six teams to search their logs for the same minute, and the search usually finds nothing because the failing service is not one of the six we guessed. We want every claim submission to get one identifier at entry, have it flow to every call it triggers, appear in all log lines, and be reported with per-step timings to a central store.",
    answers: ["distributed-tracing"],
  },
  {
    id: "distributed-tracing-5",
    text: "An industrial sensor platform ingests readings and runs them through validation, unit conversion, alert rules, and storage, each a separate service, some communicating over a message queue. Operators report that a small share of alerts arrive 45 seconds late instead of the usual 2 seconds. Queue depth looks normal and each service's processing time looks normal. Nobody can follow one late reading from the moment it arrived to the moment the alert fired, because the queue message drops all context from the original HTTP call. We want a unique id attached at ingest, carried through both the HTTP calls and the queue message headers, recorded with start and end times per step, and sent to one collector.",
    answers: ["distributed-tracing"],
  },
];
