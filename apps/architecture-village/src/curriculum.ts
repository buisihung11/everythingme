import type { Challenge, Curriculum, FinalIncident, FoundationVillage, JourneyStop, QuizQuestion, ToolCard, VillageId } from './types';

const q = (
  id: string,
  prompt: string,
  correct: string,
  a: string,
  b: string,
  c: string,
  explanation: string,
  tag: string,
  scope: QuizQuestion['scope'] = 'current',
): QuizQuestion => {
  const answer = id.length % 4;
  const options = [a, b, c];
  options.splice(answer, 0, correct);
  return { id, prompt, options, answer, explanation, tag, scope };
};

export const toolCards: ToolCard[] = [
  {
    id: 'request-journey',
    title: 'Request Journey',
    category: 'method',
    symptom: 'requests are unclear',
    signal: 'The team cannot say what happens after the user clicks a button.',
    method: 'Trace one request from the user action to the durable result and back to the user-visible response.',
    steps: ['Name the user action', 'Draw client, network, service and data boundaries', 'Mark where success is confirmed', 'Add what the user sees next'],
    tradeoff: 'A narrow journey skips edge cases, but it gives everyone a shared baseline before adding scale or resilience work.',
    verification: 'Ask someone to replay the flow without you explaining it. If they can find the success point and failure boundary, the map is useful.',
  },
  {
    id: 'sequence-diagram',
    title: 'Sequence Diagram',
    category: 'diagram',
    symptom: 'requests are unclear',
    signal: 'People disagree about ordering, ownership or which component talks first.',
    method: 'Use vertical lifelines and ordered messages to expose timing, dependencies and missing callbacks.',
    steps: ['List actors left to right', 'Draw only one scenario', 'Put each message in time order', 'Mark retries, errors or missing telemetry'],
    tradeoff: 'It can become noisy if it tries to cover every path. Keep it to one problem at a time.',
    verification: 'Check that every arrow has a sender, receiver and reason; remove arrows that are only decorative.',
  },
  {
    id: 'browser-network',
    title: 'Browser Network Panel',
    category: 'diagnostic',
    symptom: 'requests are slow',
    signal: 'The browser feels slow, but you do not know whether the wait is before, during or after the HTTP request.',
    method: 'Inspect timing, status, payload size and headers for the exact request the user action triggered.',
    steps: ['Preserve logs', 'Perform the user action once', 'Find the request', 'Compare DNS, connection, TTFB and download timing'],
    tradeoff: 'It sees the client side clearly but cannot prove what happened inside the service without server telemetry.',
    verification: 'Repeat after one change and compare the same timing fields, not overall page feeling.',
  },
  {
    id: 'curl-probe',
    title: 'curl Probe',
    category: 'diagnostic',
    symptom: 'requests are slow',
    signal: 'You need to separate DNS, connection and application behavior outside the browser.',
    method: 'Use curl to inspect connection failures, status codes, headers and response time from a controlled client.',
    steps: ['Call the exact URL', 'Print status and timing', 'Include auth/header context when needed', 'Compare from another network if location matters'],
    tradeoff: 'curl is precise for one request, but it does not represent full browser rendering or long user sessions.',
    verification: 'Keep the command and output in the incident notes so another developer can reproduce the signal.',
  },
  {
    id: 'latency-budget',
    title: 'Latency Budget',
    category: 'method',
    symptom: 'requests are slow',
    signal: 'Many components are each “a little slow” and no one knows which one matters.',
    method: 'Allocate a target response time across client, network, service and data steps so slow slices become visible.',
    steps: ['Pick the user-visible target', 'Split time by request phase', 'Measure actual timing', 'Spend optimization work on the biggest gap'],
    tradeoff: 'A budget is a model, not a guarantee. It must be updated when real measurements disagree.',
    verification: 'Track p95 or p99 timing per phase before and after the change.',
  },
  {
    id: 'retry-backoff',
    title: 'Retry With Backoff',
    category: 'method',
    symptom: 'requests are slow',
    signal: 'Transient failures recover on retry, but immediate repeated calls make traffic spikes worse.',
    method: 'Retry only safe operations, wait longer between attempts and add jitter so clients do not synchronize.',
    steps: ['Classify the operation as safe or idempotent', 'Set timeout per attempt', 'Use exponential backoff with jitter', 'Stop at a small max attempt count'],
    tradeoff: 'Retries improve availability for transient failures but can duplicate writes or amplify overload when used blindly.',
    verification: 'Measure retry rate, final failure rate and duplicate side effects.',
  },
  {
    id: 'api-contract',
    title: 'API Contract',
    category: 'contract',
    symptom: 'writes are duplicated',
    signal: 'Clients and services disagree about what a request means, how errors look or what can be retried.',
    method: 'Define the resource/action, required fields, status codes, error shape, permissions and retry behavior.',
    steps: ['Name the resource', 'Choose the action and status code', 'Define auth rules and error body', 'Document retry and pagination rules'],
    tradeoff: 'A strict contract takes more upfront work but reduces ambiguous client behavior later.',
    verification: 'Write one example success response and two error responses; clients should handle all three without private knowledge.',
  },
  {
    id: 'idempotency-key',
    title: 'Idempotency Key',
    category: 'contract',
    symptom: 'writes are duplicated',
    signal: 'A client retries a create action after a timeout and the system creates two records.',
    method: 'Attach a client-generated key to a write so repeated attempts return the original result instead of repeating the side effect.',
    steps: ['Generate a unique key per intended action', 'Store key and result atomically', 'Return the same result for repeats', 'Expire keys after a clear window'],
    tradeoff: 'It requires extra storage and careful scoping, but it turns unknown retry outcomes into a recoverable contract.',
    verification: 'Send the same request twice with the same key and confirm there is one record and two successful responses.',
  },
  {
    id: 'openapi',
    title: 'OpenAPI Spec',
    category: 'contract',
    symptom: 'writes are duplicated',
    signal: 'Docs drift from implementation or teams interpret request fields differently.',
    method: 'Describe paths, methods, schemas, status codes and examples in a machine-readable API document.',
    steps: ['Document the smallest working contract', 'Add examples', 'Generate or validate clients', 'Review changes as contract changes'],
    tradeoff: 'Specs add maintenance cost. They pay off when multiple clients or teams depend on the API.',
    verification: 'Run schema validation in CI or a local contract check before release.',
  },
  {
    id: 'access-pattern-matrix',
    title: 'Access Pattern Matrix',
    category: 'data',
    symptom: 'queries are expensive',
    signal: 'Data modeling starts from nouns, but no one knows which reads and writes must be fast.',
    method: 'List each user action against the data it reads, writes, filters and sorts.',
    steps: ['Write the action', 'Name read/write entities', 'Add filters and sort order', 'Mark frequency and correctness needs'],
    tradeoff: 'It can feel slower than jumping into schema design, but it prevents optimizing for the wrong query.',
    verification: 'Every proposed table, document or index should point back to at least one row in the matrix.',
  },
  {
    id: 'transaction-boundary',
    title: 'Transaction Boundary',
    category: 'data',
    symptom: 'queries are expensive',
    signal: 'Two updates must succeed together or not at all, especially when counters, permissions or ownership are involved.',
    method: 'Group the minimum set of reads and writes that must be atomic for the product promise to remain true.',
    steps: ['Name the invariant', 'List the writes that protect it', 'Keep the transaction short', 'Define retry behavior for conflicts'],
    tradeoff: 'Transactions protect correctness but can reduce concurrency when they are too broad.',
    verification: 'Run concurrent attempts and prove the invariant still holds.',
  },
  {
    id: 'explain-plan',
    title: 'EXPLAIN Plan',
    category: 'data',
    symptom: 'queries are expensive',
    signal: 'A query slows down as data grows, and guesses about indexes are not enough.',
    method: 'Ask the database how it plans to read the data, then compare scan type, rows and sort work.',
    steps: ['Capture the exact query', 'Run EXPLAIN or EXPLAIN ANALYZE safely', 'Add an index matching filter and order', 'Compare the plan again'],
    tradeoff: 'Indexes speed reads but add write cost and storage. More indexes are not automatically better.',
    verification: 'The new plan should touch fewer rows or avoid a costly sort for the target query.',
  },
  {
    id: 'bottleneck-first',
    title: 'Bottleneck First',
    category: 'method',
    symptom: 'systems are overloaded',
    signal: 'The system is overloaded and everyone suggests a favorite tool before locating the constraint.',
    method: 'Find the limiting resource before choosing cache, queue, scale-out or a data change.',
    steps: ['State the symptom', 'Check metrics by component', 'Find the saturated resource', 'Apply the smallest matching tool'],
    tradeoff: 'It may delay action for a few minutes, but it prevents expensive changes that miss the real limit.',
    verification: 'The saturated metric should move after the change; if not, your bottleneck guess was wrong.',
  },
  {
    id: 'cache-aside',
    title: 'Cache Aside With TTL',
    category: 'scaling',
    symptom: 'systems are overloaded',
    signal: 'Many users repeatedly read the same data and can tolerate a bounded stale window.',
    method: 'Read from cache first, load from source on miss, then store the value with an explicit TTL.',
    steps: ['Pick cacheable data', 'Set freshness window', 'Handle miss and source failure', 'Invalidate or let TTL expire'],
    tradeoff: 'Reads get faster and cheaper, but users can see stale data until invalidation or TTL catches up.',
    verification: 'Measure cache hit rate, source load reduction and stale-data complaints.',
  },
  {
    id: 'queue-backpressure',
    title: 'Queue And Backpressure',
    category: 'scaling',
    symptom: 'systems are overloaded',
    signal: 'Work arrives faster than workers can safely process it, but the user does not need every result immediately.',
    method: 'Put slow work behind a queue and control intake when the queue grows.',
    steps: ['Separate synchronous promise from background work', 'Make jobs idempotent', 'Set queue limits and retry policy', 'Expose status to users'],
    tradeoff: 'Queues protect the core path but add delay, ordering questions and failure handling.',
    verification: 'Watch queue depth, job age, retry count and user-visible completion time.',
  },
  {
    id: 'stateless-scaleout',
    title: 'Stateless Scale-Out',
    category: 'scaling',
    symptom: 'systems are overloaded',
    signal: 'CPU or connection load is high on app servers, and requests do not require local process state.',
    method: 'Move session/state to shared stores, put servers behind a load balancer and add replicas.',
    steps: ['Remove local-only state', 'Health-check instances', 'Balance traffic', 'Autoscale based on measured load'],
    tradeoff: 'Scale-out improves capacity, but shared dependencies and deployment coordination become more important.',
    verification: 'A failed instance should drain without losing sessions, and p95 latency should improve under load.',
  },
  {
    id: 'cache-candidate',
    title: 'Cache Candidate Filter',
    category: 'cache',
    symptom: 'hot reads overload the source',
    signal: 'A small set of data is read repeatedly and exact freshness is not required for every view.',
    method: 'Cache data only when repeated reads, cost and freshness tolerance line up.',
    steps: ['Find repeated read paths', 'Name the acceptable stale window', 'Exclude permission-sensitive or rapidly changing values', 'Measure hit rate and source load'],
    tradeoff: 'Caching lowers read pressure, but every cached value creates a freshness and invalidation responsibility.',
    verification: 'Hit rate should rise while database read QPS and p95 read latency drop for the same traffic.',
  },
  {
    id: 'ttl-invalidation',
    title: 'TTL And Invalidation',
    category: 'cache',
    symptom: 'hot reads overload the source',
    signal: 'Cached data is useful, but users need a clear bound on how stale it can become.',
    method: 'Combine a TTL with targeted invalidation for updates that cannot wait for expiry.',
    steps: ['Set TTL from product freshness', 'Invalidate on important writes', 'Use jitter to avoid synchronized expiry', 'Log stale reads when possible'],
    tradeoff: 'Short TTLs protect freshness but reduce cache benefit; long TTLs save load but increase stale-data risk.',
    verification: 'Compare stale-data reports, cache hit rate and source load after changing TTL or invalidation rules.',
  },
  {
    id: 'stampede-guard',
    title: 'Stampede Guard',
    category: 'cache',
    symptom: 'hot reads overload the source',
    signal: 'A popular cached key expires and many clients rebuild it at once.',
    method: 'Let one worker refresh a missing hot key while others wait, serve stale data or back off.',
    steps: ['Identify hot keys', 'Add single-flight refresh or lock', 'Allow stale-while-revalidate when product permits', 'Cap rebuild concurrency'],
    tradeoff: 'Stampede protection adds coordination, but it prevents the cache from turning expiry into a traffic spike.',
    verification: 'During expiry, origin QPS should stay bounded instead of jumping with client count.',
  },
  {
    id: 'shard-key',
    title: 'Shard Key',
    category: 'partitioning',
    symptom: 'one data store no longer fits',
    signal: 'Data or traffic must be split, and one field will decide where each record lives.',
    method: 'Choose a key that distributes writes, keeps common reads local and can survive future growth.',
    steps: ['List access patterns', 'Estimate cardinality and write distribution', 'Check common query locality', 'Plan how resharding would work'],
    tradeoff: 'A key that spreads writes may make some queries cross-shard; a key that keeps queries local can create hotspots.',
    verification: 'Simulate distribution with real or representative keys before moving production data.',
  },
  {
    id: 'hash-vs-range',
    title: 'Hash Or Range Partition',
    category: 'partitioning',
    symptom: 'one data store no longer fits',
    signal: 'The team must choose between even distribution and efficient ordered/range reads.',
    method: 'Use hashing for even spread; use ranges when ordered scans matter and hotspots are controlled.',
    steps: ['Name the dominant read', 'Check whether order/ranges are required', 'Look for monotonic write hotspots', 'Choose split and rebalance rules'],
    tradeoff: 'Hashing scatters adjacent data. Ranges preserve order but can overload the newest or busiest range.',
    verification: 'Compare per-shard QPS, storage and query fanout under expected traffic.',
  },
  {
    id: 'cross-shard-query',
    title: 'Cross-Shard Query Check',
    category: 'partitioning',
    symptom: 'one data store no longer fits',
    signal: 'A product query may need data from many shards, raising latency and coordination cost.',
    method: 'Flag queries that fan out, then redesign access patterns, indexes or read models when needed.',
    steps: ['Mark single-shard reads', 'Mark fanout reads', 'Estimate merge/sort cost', 'Add a read model or routing index if the query is common'],
    tradeoff: 'Read models reduce fanout but add write complexity and consistency lag.',
    verification: 'The query should touch fewer shards or have a bounded fanout under load.',
  },
  {
    id: 'consistent-ring',
    title: 'Consistent Hashing Ring',
    category: 'partitioning',
    symptom: 'nodes change often',
    signal: 'Adding or removing a node causes too much cached or stored data to move.',
    method: 'Hash both keys and nodes onto a ring; a key belongs to the next node clockwise.',
    steps: ['Hash keys and nodes into one space', 'Assign ownership ranges', 'Move only affected ranges on node changes', 'Track ownership metadata'],
    tradeoff: 'The ring reduces remapping, but operational correctness depends on clear ownership and handoff.',
    verification: 'When one node joins, only keys in the new ownership range should move.',
  },
  {
    id: 'virtual-nodes',
    title: 'Virtual Nodes',
    category: 'partitioning',
    symptom: 'nodes change often',
    signal: 'A small number of physical nodes creates uneven ownership ranges.',
    method: 'Place many virtual points per physical node so load spreads more evenly.',
    steps: ['Create multiple tokens per node', 'Map each token to a physical owner', 'Tune token count by skew', 'Move token ranges during rebalance'],
    tradeoff: 'More virtual nodes smooth load but increase metadata and rebalance bookkeeping.',
    verification: 'Per-node owned key count and request rate should be closer after adding virtual nodes.',
  },
  {
    id: 'replication-placement',
    title: 'Replication Placement',
    category: 'resilience',
    symptom: 'nodes change often',
    signal: 'A key needs copies, but copies on the wrong nodes fail together.',
    method: 'Place replicas on distinct failure domains after assigning the primary owner.',
    steps: ['Choose replication factor', 'Avoid same rack or region when possible', 'Define repair after node loss', 'Test reads during replacement'],
    tradeoff: 'More replicas improve availability but increase write cost, repair work and consistency decisions.',
    verification: 'A node loss should keep the configured number of readable copies after repair completes.',
  },
  {
    id: 'cap-partition-choice',
    title: 'CAP Partition Choice',
    category: 'resilience',
    symptom: 'regions cannot communicate',
    signal: 'During a network partition, the system cannot guarantee both immediate consistency and availability.',
    method: 'Decide per operation whether to reject/route writes for consistency or accept local work and reconcile later.',
    steps: ['Name the invariant', 'Name user harm from rejection', 'Choose CP or AP behavior for the partition window', 'Explain recovery to users'],
    tradeoff: 'CP protects correctness by saying no. AP keeps the product responsive but must handle conflicts or stale reads.',
    verification: 'Partition drills should show the chosen response and recovery path for each operation.',
  },
  {
    id: 'stale-read-budget',
    title: 'Stale Read Budget',
    category: 'resilience',
    symptom: 'regions cannot communicate',
    signal: 'Some reads can be old for a short time, but the product needs a visible bound.',
    method: 'Define how stale each read may be and what the UI should disclose when freshness is uncertain.',
    steps: ['Classify reads by harm', 'Set a max age', 'Show freshness when needed', 'Route critical reads to stronger sources'],
    tradeoff: 'Stale reads preserve availability, but too much hidden staleness breaks user trust.',
    verification: 'During partition, noncritical reads stay available and critical reads do not pretend to be fresh.',
  },
  {
    id: 'reconciliation-plan',
    title: 'Reconciliation Plan',
    category: 'resilience',
    symptom: 'regions cannot communicate',
    signal: 'The product accepts local writes during a partition and must merge or repair them later.',
    method: 'Record intent, detect conflicts and define deterministic merge or human review paths.',
    steps: ['Store operation intent and version', 'Detect conflicting changes', 'Apply deterministic rules where safe', 'Surface unresolved conflicts'],
    tradeoff: 'Reconciliation protects availability, but it pushes complexity into recovery and user communication.',
    verification: 'Replay conflicting writes in a test partition and confirm the final state and user message are predictable.',
  },
];

const cards = (...ids: string[]) => ids;

const sequence: Challenge = {
  kind: 'sequence',
  title: 'Repair the request map',
  prompt: 'The village notice board accepts a post, but the team cannot agree where the request goes. Put the path in order and find what is missing.',
  items: ['Store notice in database', 'Client clicks Publish', 'HTTP request crosses the network', 'Service validates and writes', 'Client sees success'],
  answer: ['Client clicks Publish', 'HTTP request crosses the network', 'Service validates and writes', 'Store notice in database', 'Client sees success'],
  observation: 'The map is still missing telemetry at the service and database boundary, so a future failure would be hard to locate.',
  tag: 'request-journey',
};
const diagnose: Challenge = {
  kind: 'diagnose',
  title: 'Follow the slow request',
  prompt: 'Read each clue and choose the layer where investigation should start.',
  cases: [
    { id: 'dns', clue: 'The browser waits before any connection opens, and curl reports that the host cannot be resolved.', answer: 'DNS', explanation: 'Name resolution fails before a TCP or TLS connection exists.', tag: 'dns' },
    { id: 'connection', clue: 'DNS resolves, but connection setup times out from one office network.', answer: 'Connection', explanation: 'The host is known, so start with routing, firewall, TCP or TLS reachability.', tag: 'connection' },
    { id: 'application', clue: 'The request connects quickly, then returns HTTP 500 after the service spends two seconds working.', answer: 'Application', explanation: 'The network path exists; the failure is inside the HTTP application path.', tag: 'application' },
  ],
};
const contract: Challenge = {
  kind: 'contract',
  title: 'Stop duplicate notices',
  prompt: 'A villager retries POST /notices after a timeout and two notices appear. Select the fixes that belong in the API contract.',
  fixes: [
    { id: 'key', label: 'Require an Idempotency-Key for create-notice requests and store the first result with it.', correct: true, explanation: 'The retry can return the original result instead of creating another notice.', tag: 'idempotency' },
    { id: 'status', label: 'Return a clear 201 success body with noticeId, and a documented error shape for failures.', correct: true, explanation: 'Clients need to know whether they can show, retry or repair the action.', tag: 'api-contract' },
    { id: 'rename', label: 'Rename the endpoint to /fast-notices so the client trusts it more.', correct: false, explanation: 'Naming does not change duplicate side effects or retry behavior.', tag: 'contract-fluff' },
    { id: 'auth', label: 'Check author permission before accepting the write.', correct: true, explanation: 'Authorization is part of the contract because only valid authors may create notices.', tag: 'auth' },
  ],
};
const data: Challenge = {
  kind: 'data',
  title: 'Protect the source of truth',
  prompt: 'The board must update a notice and then show the newest notices by village and created time. Pick the data decisions that fit.',
  decisions: [
    { id: 'transaction', label: 'Use a short transaction for the notice update and audit row that must succeed together.', correct: true, explanation: 'The invariant is that an accepted edit has its audit trail.', tag: 'transaction' },
    { id: 'index', label: 'Add an index matching villageId and createdAt for the common feed query.', correct: true, explanation: 'The query filters by village and sorts by created time.', tag: 'index' },
    { id: 'scan', label: 'Keep a full table scan because the dataset is small today and growth is someone else’s problem.', correct: false, explanation: 'The problem statement says queries are getting slower as data grows.', tag: 'query-plan' },
    { id: 'explain', label: 'Compare EXPLAIN before and after the index instead of guessing.', correct: true, explanation: 'The plan proves whether the index reduced scan or sort work.', tag: 'explain' },
  ],
};
const bottleneck: Challenge = {
  kind: 'bottleneck',
  title: 'Match the growth tool',
  prompt: 'Festival traffic hits the board. Match each symptom with the smallest useful tool.',
  symptoms: [
    { id: 'repeat-read', label: 'Everyone reads the same festival schedule every few seconds; it can be 30 seconds stale.', answer: 'cache', explanation: 'Repeated tolerant reads are a strong cache-aside fit.', tag: 'cache-aside' },
    { id: 'slow-side-work', label: 'Publishing triggers slow poster rendering that does not need to finish before the author sees “received”.', answer: 'queue', explanation: 'Move slow side work behind a queue and expose job status.', tag: 'queue' },
    { id: 'cpu', label: 'App servers are CPU-bound, requests are stateless and the database is healthy.', answer: 'scale-out', explanation: 'Adding healthy stateless replicas targets the saturated tier.', tag: 'scale-out' },
  ],
};

const cache: Challenge = {
  kind: 'cache',
  title: 'Calm the hot notice',
  prompt: 'The festival schedule is read constantly. Pick the cache decisions that reduce load without hiding freshness risk.',
  decisions: [
    { id: 'candidate', label: 'Cache the public schedule because many users read it and 30 seconds of staleness is acceptable.', correct: true, explanation: 'Repeated tolerant reads are a strong cache candidate.', tag: 'cache-candidate' },
    { id: 'ttl', label: 'Set a TTL from the product freshness promise and invalidate when the organizer publishes an urgent change.', correct: true, explanation: 'TTL bounds ordinary staleness; invalidation handles important writes faster.', tag: 'ttl-invalidation' },
    { id: 'private', label: 'Cache every personalized permission result globally with no user key.', correct: false, explanation: 'Permission-sensitive data must not be shared across users by a global cache key.', tag: 'cache-safety' },
    { id: 'verify', label: 'Verify with hit rate, database read QPS and p95 read latency.', correct: true, explanation: 'A cache should prove it reduced source load and user-visible latency.', tag: 'cache-verification' },
  ],
};

const shard: Challenge = {
  kind: 'shard',
  title: 'Choose the split',
  prompt: 'The notice archive is too large for one database. Rate each shard-key candidate for the village notice board.',
  candidates: [
    { id: 'notice-id', label: 'Hash noticeId for public notice reads by id and even write spread.', fit: 'strong', explanation: 'High-cardinality IDs spread evenly, but feed queries may need a read model or routing index.', tag: 'shard-key' },
    { id: 'created-at', label: 'Range by createdAt while most writes target the newest notices.', fit: 'danger', explanation: 'A monotonic time range can overload the newest shard.', tag: 'hotspot' },
    { id: 'region', label: 'Shard by region when most feeds and moderation work stay inside one region.', fit: 'strong', explanation: 'Region keeps common reads local if traffic is balanced enough.', tag: 'query-locality' },
    { id: 'status', label: 'Shard by status where most notices are active.', fit: 'weak', explanation: 'Low-cardinality values create uneven shards and poor distribution.', tag: 'low-cardinality' },
  ],
};

const ring: Challenge = {
  kind: 'ring',
  title: 'Rebalance the ring',
  prompt: 'The board uses a hash ring for cache ownership. Predict what should happen during each event.',
  events: [
    { id: 'join', label: 'A new node joins between node B and node C on the ring.', answer: 'few-keys', explanation: 'Only keys in the new node ownership range should move.', tag: 'consistent-ring' },
    { id: 'modulo', label: 'The team replaces the ring with hash(key) % nodeCount, then adds a node.', answer: 'many-keys', explanation: 'Modulo changes the bucket calculation for many keys when node count changes.', tag: 'remapping' },
    { id: 'tiny-ring', label: 'Three physical nodes own very uneven ranges.', answer: 'skewed', explanation: 'Virtual nodes can smooth ownership across physical nodes.', tag: 'virtual-nodes' },
  ],
};

const partition: Challenge = {
  kind: 'partition',
  title: 'Choose partition behavior',
  prompt: 'Two regions cannot communicate. Match each product operation with the behavior that fits its correctness needs.',
  operations: [
    { id: 'unique', label: 'Claim a globally unique town-hall slot.', answer: 'CP', explanation: 'Reject or route the write until the invariant can be protected.', tag: 'cp-choice' },
    { id: 'read-banner', label: 'Read a public festival banner that may be one minute stale.', answer: 'AP', explanation: 'Serving bounded stale data keeps the read available with acceptable harm.', tag: 'stale-read-budget' },
    { id: 'drafts', label: 'Accept local draft edits in both regions and merge after recovery.', answer: 'Reconcile', explanation: 'Intent logging and deterministic conflict handling make AP writes recoverable.', tag: 'reconciliation' },
  ],
};

const foundationStops: JourneyStop[] = [
  {
    id: 'town-square',
    villageId: 'foundation',
    order: 1,
    title: 'Town Square - Map the Request',
    place: 'Town Square',
    problem: 'No one can see how a request travels through the system.',
    subtitle: 'Start with one visible path before naming architecture.',
    duration: 12,
    icon: '01',
    color: '#7f9462',
    spirit: 'Village Cartographer',
    position: [-4, 1.8],
    prerequisites: [],
    story: 'The village notice board is simple on the surface: a villager writes a message and everyone can read it. The first problem is not scale. The first problem is that the team cannot describe the path from a click to a durable notice.',
    clues: ['The Publish button sometimes says success before anyone can find the notice.', 'The team argues about cache before agreeing where the source of truth is.', 'Logs exist, but no one knows which request they belong to.'],
    beats: [
      { title: 'Draw the boundary', body: 'Name what is inside the system you control and what sits outside it: browser, network, service and data store.' },
      { title: 'Follow one request', body: 'Trace the smallest complete user action in order. A diagram is useful only when it shows who sends what, when success is confirmed and what the user sees.' },
      { title: 'Separate signals', body: 'Functional signals describe behavior. Non-functional signals describe qualities such as latency, freshness, reliability and observability.' },
    ],
    toolCardIds: cards('request-journey', 'sequence-diagram', 'browser-network'),
    challenge: sequence,
    quiz: [
      q('town-q1', 'What is the best first move when nobody can explain where a notice goes after Publish?', 'Trace one request from client to durable data and back to the user response.', 'Choose a cache product.', 'Add three services to the diagram.', 'Estimate global traffic for next year.', 'A concrete request journey creates the baseline for later choices.', 'request-journey'),
      q('town-q2', 'Which item is a non-functional signal?', 'The notice should appear for readers within a target freshness window.', 'The author can create a notice.', 'The author can delete their own notice.', 'The board supports notice categories.', 'Freshness is a quality of behavior, not the behavior itself.', 'requirements'),
      q('town-q3', 'Why use a sequence diagram here?', 'It exposes ordering, ownership and missing handoffs in one scenario.', 'It proves the database can scale forever.', 'It replaces status codes.', 'It makes every future edge case disappear.', 'Sequence diagrams are strongest when clarifying one concrete flow.', 'sequence-diagram'),
      q('town-q4', 'The service logs an error but the browser reports success. What should the map identify?', 'Where success is confirmed and which component owns that promise.', 'Which icon should mark the service.', 'Whether the team prefers REST or GraphQL.', 'How many future villages exist.', 'The mismatch is about the success boundary and observability.', 'success-boundary'),
      q('town-q5', 'Which tool gives the fastest client-side evidence for the request triggered by a click?', 'Browser Network panel.', 'A quarterly architecture review.', 'A new load balancer.', 'A database shard map.', 'The browser Network panel ties a user action to timing, status and headers.', 'browser-network'),
    ],
  },
  {
    id: 'signal-gate',
    villageId: 'foundation',
    order: 2,
    title: 'Signal Gate - Follow the Request',
    place: 'Signal Gate',
    problem: 'Requests are slow or disappear before the board can answer.',
    subtitle: 'Diagnose before retrying harder.',
    duration: 13,
    icon: '02',
    color: '#6f9a9a',
    spirit: 'Signal Keeper',
    position: [-1.8, -2.8],
    prerequisites: ['town-square'],
    story: 'At the village gate, notices leave the browser and cross the network. Some fail before the service sees them. Some reach the service and fail there. Your job is to read the clues before choosing a fix.',
    clues: ['Some users see host resolution errors.', 'Some requests connect but time out during TLS or TCP setup.', 'Some responses are HTTP 500 after the service works for a while.'],
    beats: [
      { title: 'Layers leave fingerprints', body: 'DNS happens before connection setup. TCP/TLS happens before HTTP response handling. Application errors usually have status codes or service traces.' },
      { title: 'Budget the latency', body: 'A latency budget splits the user-visible wait across phases so one slow slice does not hide inside a vague “the app is slow”.' },
      { title: 'Retry with restraint', body: 'Timeouts and retries need limits, backoff and idempotency. A retry can rescue a transient read, but it can also duplicate a write or amplify overload.' },
    ],
    toolCardIds: cards('curl-probe', 'latency-budget', 'retry-backoff'),
    challenge: diagnose,
    quiz: [
      q('signal-q1', 'curl says the host cannot be resolved. Where should investigation start?', 'DNS.', 'Application handler.', 'Database index.', 'Pagination contract.', 'Resolution fails before a connection or HTTP handler is involved.', 'dns'),
      q('signal-q2', 'Why define a latency budget?', 'To make each phase of the user-visible wait measurable and accountable.', 'To guarantee every request is fast forever.', 'To remove the need for service metrics.', 'To turn POST into GET.', 'Budgets guide measurement and prioritization; they are not guarantees.', 'latency-budget'),
      q('signal-q3', 'What makes retry safer?', 'Timeout per attempt, bounded attempts, backoff with jitter and idempotent operations.', 'Infinite immediate retries.', 'Retrying every write without a key.', 'Hiding errors from users.', 'Retries need boundaries and safe semantics to avoid making failures worse.', 'retry-backoff'),
      q('signal-r1', 'Retrieval: before diagnosing scale, what did Town Square teach you to map?', 'The request journey from user action to data and back.', 'Only the deployment region.', 'Only the CSS state.', 'Only the final database table.', 'The journey anchors any later network or service diagnosis.', 'request-journey', 'retrieval'),
      q('signal-r2', 'Retrieval: which client-side tool can show DNS, connection, response timing and status?', 'Browser Network panel.', 'Sequence diagram alone.', 'A product roadmap.', 'A queue worker.', 'The Network panel gives request-level client timing evidence.', 'browser-network', 'retrieval'),
    ],
  },
  {
    id: 'contract-workshop',
    villageId: 'foundation',
    order: 3,
    title: 'Contract Workshop - Make a Clear Contract',
    place: 'Contract Workshop',
    problem: 'Actions are misunderstood or executed more than once.',
    subtitle: 'A good API tells clients what happened and what to do next.',
    duration: 14,
    icon: '03',
    color: '#b08a5c',
    spirit: 'Contract Smith',
    position: [2.1, -2.7],
    prerequisites: ['signal-gate'],
    story: 'The notice board now receives requests, but clients behave differently after errors. One mobile client retries creates after timeouts. Another shows success when permission failed. The contract needs to become explicit.',
    clues: ['A timeout after POST /notices sometimes creates duplicate notices.', 'Errors use different response shapes across endpoints.', 'Readers ask for thousands of notices at once because pagination is undefined.'],
    beats: [
      { title: 'Name the promise', body: 'An API contract covers resource, action, status, error shape, permissions, pagination and retry behavior.' },
      { title: 'Make retries boring', body: 'Idempotency keys turn an unknown create outcome into a repeatable result. The repeated request should not repeat the side effect.' },
      { title: 'Document the shape', body: 'OpenAPI helps multiple clients share the same schema and examples. The spec must stay close to implementation or it becomes decoration.' },
    ],
    toolCardIds: cards('api-contract', 'idempotency-key', 'openapi'),
    challenge: contract,
    quiz: [
      q('contract-q1', 'A client retries a create after a timeout. What contract feature prevents duplicate notices?', 'An idempotency key stored with the original result.', 'A shorter endpoint name.', 'A bigger response body with no key.', 'A different button color.', 'The key lets the service return the first result for repeated attempts.', 'idempotency'),
      q('contract-q2', 'Which detail belongs in the API contract?', 'Status codes, error shape, permissions, pagination and retry behavior.', 'Only the internal class names.', 'Only the server CPU count.', 'Only the database vendor logo.', 'Clients need these promises to handle success, failure and repetition correctly.', 'api-contract'),
      q('contract-q3', 'When is OpenAPI most valuable?', 'When multiple clients or teams need a shared machine-readable contract.', 'When there is no API.', 'When the schema should stay secret from all clients.', 'When examples are forbidden.', 'Specs reduce drift when many consumers depend on the same interface.', 'openapi'),
      q('contract-r1', 'Retrieval: why should a retry policy know whether an operation is idempotent?', 'Because unsafe writes can repeat side effects.', 'Because DNS always fixes duplicates.', 'Because retries remove all latency.', 'Because pagination depends on TLS.', 'Signal Gate connected retries with operation safety.', 'retry-backoff', 'retrieval'),
      q('contract-r2', 'Retrieval: what must the request map identify before API decisions are useful?', 'Where success is confirmed.', 'The mascot name.', 'The future sharding key.', 'The number of UI colors.', 'The API promise depends on the point where the system says the action succeeded.', 'success-boundary', 'retrieval'),
    ],
  },
  {
    id: 'archive-house',
    villageId: 'foundation',
    order: 4,
    title: 'Archive House - Protect the Source of Truth',
    place: 'Archive House',
    problem: 'Data is wrong and queries get slower as the board grows.',
    subtitle: 'Model from access patterns, then prove the query plan.',
    duration: 15,
    icon: '04',
    color: '#8d8aa8',
    spirit: 'Archive Keeper',
    position: [4.6, .8],
    prerequisites: ['contract-workshop'],
    story: 'The board stores more notices every week. Edits need audit history, feeds need the newest notices quickly and permission checks must not drift from the source of truth.',
    clues: ['A notice edit can succeed while its audit row fails.', 'The feed query filters by village and sorts by created time.', 'The team keeps adding indexes without checking the query plan.'],
    beats: [
      { title: 'Start with access patterns', body: 'A data model is judged by the reads, writes, filters, sort order and correctness needs it must support.' },
      { title: 'Protect invariants', body: 'Use a transaction when multiple changes must succeed together. Keep it small so correctness does not crush concurrency.' },
      { title: 'Index with evidence', body: 'Indexes match query filters and ordering. EXPLAIN shows whether the database will scan too much data or sort expensively.' },
    ],
    toolCardIds: cards('access-pattern-matrix', 'transaction-boundary', 'explain-plan'),
    challenge: data,
    quiz: [
      q('archive-q1', 'What should drive the first data model for the notice board?', 'Access patterns: reads, writes, filters, ordering and correctness needs.', 'A list of nouns only.', 'The longest possible table name.', 'The number of UI panels.', 'Data choices should serve concrete operations.', 'access-patterns'),
      q('archive-q2', 'When should the edit and audit write share a transaction?', 'When the product promise requires both to succeed or both to fail.', 'Whenever a query is slow.', 'Only when DNS fails.', 'Never, because transactions are decorative.', 'Transactions protect invariants across related writes.', 'transaction'),
      q('archive-q3', 'Which index fits a feed filtered by villageId and sorted by createdAt?', 'An index that starts with villageId and includes createdAt in the useful order.', 'An index on a rarely used color field.', 'No index because the table was small last month.', 'A random id only.', 'The index should match filter and sort shape.', 'index'),
      q('archive-r1', 'Retrieval: what API feature stops duplicated create side effects?', 'Idempotency key.', 'Browser zoom.', 'A sequence diagram by itself.', 'A larger cache.', 'The key scopes retries to one intended action.', 'idempotency', 'retrieval'),
      q('archive-r2', 'Retrieval: a request connects quickly, then HTTP 500 appears after service work. Where do you start?', 'Application path.', 'DNS.', 'Pointer gesture threshold.', 'Static asset cache.', 'The network succeeded; the HTTP application failed.', 'application', 'retrieval'),
    ],
  },
  {
    id: 'festival-square',
    villageId: 'foundation',
    order: 5,
    title: 'Festival Square - Handle Growth',
    place: 'Festival Square',
    problem: 'Festival traffic overloads the notice board.',
    subtitle: 'Find the bottleneck before choosing the tool.',
    duration: 15,
    icon: '05',
    color: '#b7776b',
    spirit: 'Festival Steward',
    position: [0, 3.4],
    prerequisites: ['archive-house'],
    story: 'The village festival turns the quiet notice board into shared infrastructure. Reads spike, publishing triggers slow side work and app servers run hot. Each symptom needs a different tool.',
    clues: ['Most traffic repeatedly reads the same schedule.', 'Publishing does image generation and notifications after the write.', 'App CPU is saturated while the database still has headroom.'],
    beats: [
      { title: 'Bottleneck first', body: 'A scaling tool is only good if it targets the saturated resource. Start with component metrics and the user symptom.' },
      { title: 'Cache repeated tolerant reads', body: 'Cache-aside with TTL helps when the same data is read often and a bounded stale window is acceptable.' },
      { title: 'Queue slow side work, scale stateless servers', body: 'Queues protect the synchronous path when work can finish later. Stateless replicas help when app servers are the bottleneck.' },
    ],
    toolCardIds: cards('bottleneck-first', 'cache-aside', 'queue-backpressure', 'stateless-scaleout'),
    challenge: bottleneck,
    quiz: [
      q('festival-q1', 'What should you do before choosing cache, queue or more replicas?', 'Find the bottleneck using symptoms and component metrics.', 'Pick the tool you used last time.', 'Rename every service.', 'Add every tool at once.', 'Scaling starts with the limiting resource.', 'bottleneck-first'),
      q('festival-q2', 'Which symptom best fits cache-aside with TTL?', 'Repeated reads of the same data with acceptable bounded staleness.', 'Every write must be globally unique immediately.', 'A missing DNS record.', 'A transaction invariant is broken.', 'Cache trades freshness for faster, cheaper repeated reads.', 'cache-aside'),
      q('festival-q3', 'Which symptom best fits a queue?', 'Slow side work can finish after the user receives an accepted response.', 'The host name cannot resolve.', 'The query plan scans too many rows.', 'The API lacks status codes.', 'Queues move delay-tolerant work out of the synchronous path.', 'queue'),
      q('festival-r1', 'Retrieval: how do you prove an index helped?', 'Compare EXPLAIN plans before and after.', 'Count the number of endpoints.', 'Retry the POST forever.', 'Look only at a diagram color.', 'The query plan shows whether scan or sort work changed.', 'explain', 'retrieval'),
      q('festival-r2', 'Retrieval: why keep a transaction short?', 'It protects the invariant while limiting concurrency cost.', 'It makes DNS faster.', 'It replaces idempotency keys.', 'It removes all read traffic.', 'Archive House tied transaction scope to correctness and concurrency.', 'transaction', 'retrieval'),
    ],
  },
];

const highlandStops: JourneyStop[] = [
  {
    id: 'cache-bazaar',
    villageId: 'distributed-highlands',
    order: 1,
    title: 'Cache Bazaar - Keep Hot Reads Close',
    place: 'Cache Bazaar',
    problem: 'Popular notices keep hitting the source of truth.',
    subtitle: 'Cache only when the signal, freshness and proof line up.',
    duration: 13,
    icon: '01',
    color: '#7c9f9a',
    spirit: 'Cache Merchant',
    position: [-4.2, 2.1],
    prerequisites: [],
    story: 'The notice board is now read by nearby villages. The festival schedule becomes so popular that the archive spends most of its time answering the same read again and again.',
    clues: ['One public schedule receives far more reads than writes.', 'Readers can tolerate the schedule being 30 seconds old.', 'When the cache expires, source database QPS spikes sharply.'],
    beats: [
      { title: 'Cache the right thing', body: 'A good cache candidate is read often, expensive enough to matter and safe to serve within a known stale window.' },
      { title: 'Freshness is a promise', body: 'TTL and invalidation are product decisions. They say how long old data may be shown and which writes must refresh it sooner.' },
      { title: 'Protect hot keys', body: 'A cache stampede happens when many clients rebuild the same expired key. Single-flight refresh, jitter or stale-while-revalidate keeps the source calm.' },
    ],
    diagram: `sequenceDiagram
  participant User
  participant App
  participant Cache
  participant Source as Source of Truth
  User->>App: Read festival schedule
  App->>Cache: Get schedule
  alt Cache hit within TTL
    Cache-->>App: Cached schedule
  else Cache miss or expired
    App->>Source: Load schedule
    Source-->>App: Fresh schedule
    App->>Cache: Store with TTL and jitter
  end
  App-->>User: Show schedule with freshness bound`,
    toolCardIds: cards('cache-candidate', 'ttl-invalidation', 'stampede-guard'),
    challenge: cache,
    quiz: [
      q('cache-q1', 'Which notice is the strongest cache candidate?', 'A public festival schedule read often and safe to show up to 30 seconds stale.', 'A one-time password.', 'A permission check shared across all users.', 'A write that must be globally unique immediately.', 'Cache repeated tolerant reads, not sensitive or uniqueness-critical operations.', 'cache-candidate'),
      q('cache-q2', 'What does a TTL express?', 'The maximum ordinary age a cached value may reach before refresh.', 'The number of database shards.', 'A guarantee that data is never stale.', 'The TCP handshake duration.', 'TTL is a freshness bound, not proof of perfect freshness.', 'ttl'),
      q('cache-q3', 'How do you reduce a cache stampede?', 'Let one worker refresh a hot key while others wait or receive acceptable stale data.', 'Expire every hot key at the same millisecond.', 'Retry every miss without limits.', 'Remove all metrics.', 'Stampede guards cap rebuild concurrency at the source.', 'stampede'),
      q('cache-q4', 'Which metric proves cache benefit?', 'Higher hit rate with lower source read QPS and lower p95 read latency.', 'More endpoint names.', 'A prettier sequence diagram.', 'A larger retry count.', 'Cache needs evidence that source load and latency moved.', 'cache-verification'),
      q('cache-q5', 'What is the main tradeoff of cache-aside?', 'Faster cheaper reads in exchange for stale-data and invalidation responsibility.', 'Guaranteed linearizable writes everywhere.', 'No need for source storage.', 'Automatic shard rebalancing.', 'Cache-aside helps reads but adds freshness work.', 'cache-tradeoff'),
    ],
  },
  {
    id: 'shard-quarry',
    villageId: 'distributed-highlands',
    order: 2,
    title: 'Shard Quarry - Split the Growing Archive',
    place: 'Shard Quarry',
    problem: 'One database no longer stores or processes all notice data evenly.',
    subtitle: 'A shard key is a long-lived product bet.',
    duration: 14,
    icon: '02',
    color: '#9b8f72',
    spirit: 'Quarry Planner',
    position: [-1.2, -2.7],
    prerequisites: ['cache-bazaar'],
    story: 'The archive grows past one machine. Splitting sounds simple until the team realizes every future read, write and migration depends on the field that chooses the shard.',
    clues: ['Writes by createdAt all land on the newest range.', 'Moderators mostly work within a single region.', 'A global search query may need to fan out across every shard.'],
    beats: [
      { title: 'Start from access patterns', body: 'Shard keys are judged by distribution, query locality and the future cost of changing your mind.' },
      { title: 'Hash and range split differently', body: 'Hash partitioning spreads load. Range partitioning preserves order but can create hotspots on monotonic values.' },
      { title: 'Fanout is a cost', body: 'Cross-shard reads may need routing indexes, read models or bounded fanout so a common query does not touch everything.' },
    ],
    diagram: `flowchart LR
  Client[Notice request] --> Router{Shard router}
  Router -->|hash noticeId| S1[(Shard A)]
  Router -->|hash noticeId| S2[(Shard B)]
  Router -->|hash noticeId| S3[(Shard C)]
  Feed[Regional feed query] --> RegionIndex[Routing index or read model]
  RegionIndex --> S1
  RegionIndex --> S2
  Global[Global search] --> Fanout[Bounded fanout or async index]
  Fanout --> S1
  Fanout --> S2
  Fanout --> S3`,
    toolCardIds: cards('shard-key', 'hash-vs-range', 'cross-shard-query'),
    challenge: shard,
    quiz: [
      q('shard-q1', 'What makes a shard key strong?', 'It distributes load, keeps common reads local and has a realistic resharding path.', 'It is the shortest column name.', 'It changes every deployment.', 'It hides all access patterns.', 'Shard keys must serve real reads and writes over time.', 'shard-key'),
      q('shard-q2', 'Why is range partitioning by createdAt risky for constant new writes?', 'Newest records can overload the newest range.', 'It prevents all ordered reads.', 'It removes every index.', 'It makes caches impossible.', 'Monotonic keys often create hot ranges.', 'hotspot'),
      q('shard-q3', 'What is a cross-shard query risk?', 'It fans out work and may need merge, sort or a read model.', 'It always improves latency.', 'It guarantees perfect consistency.', 'It replaces authorization.', 'Fanout increases coordination and latency cost.', 'cross-shard-query'),
      q('shard-r1', 'Retrieval: which cache metric should move when hot reads are handled well?', 'Hit rate should rise while source read QPS drops.', 'Node count should always shrink.', 'All writes should be rejected.', 'DNS should disappear.', 'Cache Bazaar measured cache impact with hit rate and source load.', 'cache-verification', 'retrieval'),
      q('shard-r2', 'Retrieval: why add jitter to cache expiry?', 'To avoid many hot keys expiring and rebuilding at the same time.', 'To choose a shard key.', 'To force CP behavior.', 'To remove stale data entirely.', 'Jitter helps avoid synchronized cache stampedes.', 'stampede', 'retrieval'),
    ],
  },
  {
    id: 'ring-station',
    villageId: 'distributed-highlands',
    order: 3,
    title: 'Ring Station - Rebalance Without Chaos',
    place: 'Ring Station',
    problem: 'Adding or removing a node moves too many keys.',
    subtitle: 'Keep ownership stable while capacity changes.',
    duration: 14,
    icon: '03',
    color: '#8982ad',
    spirit: 'Ring Keeper',
    position: [2.2, -2.5],
    prerequisites: ['shard-quarry'],
    story: 'The highlands add cache nodes during festivals and remove them after. With the wrong mapping, each change scrambles ownership and floods the network with moved keys.',
    clues: ['Modulo routing remaps many keys after adding one node.', 'Some nodes own much larger key ranges than others.', 'Replicas placed in the same failure area disappear together.'],
    beats: [
      { title: 'Own ranges, not buckets', body: 'Consistent hashing places keys and nodes on a ring, then moves only affected ranges when membership changes.' },
      { title: 'Smooth the ring', body: 'Virtual nodes give each physical node many ownership points, reducing skew when the cluster is small.' },
      { title: 'Place copies carefully', body: 'Replication helps only when copies survive different failures. Placement matters as much as replica count.' },
    ],
    diagram: `flowchart TB
  K1[key: schedule] --> A1((A-1))
  K2[key: notice-91] --> B2((B-2))
  K3[key: notice-42] --> C1((C-1))
  A1 --> Ring[Hash ring ownership ranges]
  A2((A-2)) --> Ring
  B1((B-1)) --> Ring
  B2 --> Ring
  C1 --> Ring
  C2((C-2)) --> Ring
  Ring --> Join[Node D joins]
  Join --> Move[Only D ownership ranges move]`,
    toolCardIds: cards('consistent-ring', 'virtual-nodes', 'replication-placement'),
    challenge: ring,
    quiz: [
      q('ring-q1', 'In consistent hashing, where does a key belong?', 'To the next node clockwise on the hash ring.', 'To every node with the same hostname.', 'Always to the newest node.', 'Only to the database primary.', 'Ring ownership is based on key position and the next node.', 'consistent-ring'),
      q('ring-q2', 'What should happen when one node joins a healthy ring?', 'Only keys in the new node ownership range move.', 'Every key must move.', 'No ownership metadata is needed.', 'All writes must stop forever.', 'The point of consistent hashing is limited remapping.', 'remapping'),
      q('ring-q3', 'Why use virtual nodes?', 'To reduce uneven ownership and smooth load across physical nodes.', 'To remove the need for monitoring.', 'To guarantee CAP availability and consistency together.', 'To make every query single-shard.', 'Virtual nodes spread ranges more evenly.', 'virtual-nodes'),
      q('ring-r1', 'Retrieval: what shard-key property prevents uneven write load?', 'High cardinality and a distribution that avoids hotspots.', 'A monotonic newest range only.', 'A boolean status field only.', 'A key no query can route by.', 'Shard Quarry focused on distribution and hotspots.', 'shard-key', 'retrieval'),
      q('ring-r2', 'Retrieval: what does a cache stampede guard protect?', 'The source of truth during hot key refresh.', 'The hash ring from virtual nodes.', 'The API from pagination.', 'The TLS handshake.', 'Cache Bazaar used single-flight or stale refresh to bound source load.', 'stampede', 'retrieval'),
    ],
  },
  {
    id: 'partition-observatory',
    villageId: 'distributed-highlands',
    order: 4,
    title: 'Partition Observatory - Choose Behavior Under Failure',
    place: 'Partition Observatory',
    problem: 'Regions lose contact, but the system must still decide how to respond.',
    subtitle: 'CAP is a product choice during a partition, not a slogan.',
    duration: 15,
    icon: '04',
    color: '#6f8fb2',
    spirit: 'Partition Watcher',
    position: [4.5, 1.7],
    prerequisites: ['ring-station'],
    story: 'Storms split the highland regions. Some operations can keep working with old information. Some must say no until the invariant is safe. The architecture choice has to be explainable to users.',
    clues: ['A unique booking cannot be safely accepted in two isolated regions.', 'Public notices can be read even if they are marked as possibly stale.', 'Draft edits can be accepted locally if conflicts are reconciled later.'],
    beats: [
      { title: 'CAP appears during partition', body: 'When regions cannot communicate, you choose between rejecting work to preserve consistency or staying available with recovery work later.' },
      { title: 'Choose per operation', body: 'Not every feature needs the same behavior. Protect hard invariants; allow bounded staleness where user harm is low.' },
      { title: 'Recovery is part of the design', body: 'AP writes need intent logs, conflict detection, merge rules and user-visible repair when automatic reconciliation is unsafe.' },
    ],
    diagram: `flowchart TD
  Partition[Network partition] --> Decision{What does this operation promise?}
  Decision -->|Hard invariant| CP[CP: reject or route write]
  Decision -->|Bounded stale read is okay| AP[AP: serve local/stale read]
  Decision -->|Local writes can merge later| REC[Accept intent locally]
  REC --> Log[Record versions and intent]
  Log --> Merge[Reconcile after recovery]
  Merge --> User[Explain final state to user]`,
    toolCardIds: cards('cap-partition-choice', 'stale-read-budget', 'reconciliation-plan'),
    challenge: partition,
    quiz: [
      q('partition-q1', 'What does CAP force during a network partition?', 'A choice between immediate consistency and availability for an operation.', 'A choice between CSS and WebGL.', 'A guarantee that both consistency and availability always hold.', 'A replacement for cache TTL.', 'During partition, communication is unavailable, so the system must choose behavior.', 'cap'),
      q('partition-q2', 'Which operation is a CP fit?', 'Claiming a globally unique slot that must not be double-booked.', 'Reading a public banner that may be stale.', 'Saving a local draft that can merge later.', 'Loading a static icon.', 'Hard uniqueness invariants usually require rejecting or routing writes.', 'cp-choice'),
      q('partition-q3', 'What does reconciliation require?', 'Recorded intent, conflict detection and predictable merge or review rules.', 'Ignoring versions.', 'Deleting one region after recovery.', 'Infinite cache TTL.', 'AP writes need a recovery design, not hope.', 'reconciliation'),
      q('partition-r1', 'Retrieval: why do virtual nodes help a hash ring?', 'They smooth ownership across physical nodes.', 'They make stale reads impossible.', 'They prevent all cross-shard queries.', 'They create idempotency keys.', 'Ring Station used virtual nodes to reduce skew.', 'virtual-nodes', 'retrieval'),
      q('partition-r2', 'Retrieval: why can a hash shard key make range reads harder?', 'Adjacent data may be scattered across shards.', 'It always creates one newest hotspot.', 'It disables every cache.', 'It removes source of truth.', 'Shard Quarry compared even spread against ordered locality.', 'hash-vs-range', 'retrieval'),
    ],
  },
];

export const stops: JourneyStop[] = [...foundationStops, ...highlandStops];

export const foundationVillage: FoundationVillage = {
  id: 'foundation',
  title: 'Foundation Village',
  subtitle: 'REQUESTS, CONTRACTS, DATA AND GROWTH',
  description: 'Explore one village notice-board system and collect methods you can reuse when architecture problems appear.',
  color: '#7f9462',
  biome: 'meadow',
  stopIds: foundationStops.map(stop => stop.id),
};

export const highlandsVillage: FoundationVillage = {
  id: 'distributed-highlands',
  title: 'Distributed Highlands',
  subtitle: 'CACHING, SHARDING, RINGS AND PARTITIONS',
  description: 'Continue the notice-board story as villages spread across regions and the system must handle hot reads, split data and network failure.',
  badge: 'Recommended after Foundation',
  color: '#8982ad',
  biome: 'highlands',
  stopIds: highlandStops.map(stop => stop.id),
};

export const villages: FoundationVillage[] = [foundationVillage, highlandsVillage];

export const finalIncidents: FinalIncident[] = [{
  id: 'foundation-final',
  villageId: 'foundation',
  title: 'Festival Incident Review',
  summary: 'A launch day incident combines a missing request path, duplicate write, slow feed query and overload. This optional review saves your best score but does not gate Foundation completion.',
  steps: [
    { id: 'final-1', prompt: 'The incident channel is noisy. What anchors the investigation?', options: ['Map the user request path and identify where success was promised.', 'Start by adding every scaling tool.', 'Delete the API contract.', 'Ignore user-visible behavior.'], answer: 0, explanation: 'The request path gives the team one shared story to debug.', tag: 'request-journey' },
    { id: 'final-2', prompt: 'Duplicate notices appeared after retries. What fix belongs in the write contract?', options: ['Idempotency-Key with stored first result.', 'More DNS records.', 'A wider sidebar.', 'A table scan.'], answer: 0, explanation: 'The same intended write should return the same result without repeating the side effect.', tag: 'idempotency' },
    { id: 'final-3', prompt: 'The feed query slows as data grows. What evidence should you inspect?', options: ['EXPLAIN plan for the exact query.', 'Only the number of UI labels.', 'Only the TLS version.', 'Only the retry count.'], answer: 0, explanation: 'The plan shows whether indexes and ordering match the access pattern.', tag: 'explain' },
    { id: 'final-4', prompt: 'Festival schedule reads dominate traffic and tolerate 30 seconds of staleness. What tool fits?', options: ['Cache-aside with TTL.', 'A bigger transaction.', 'Infinite retries.', 'A new resource name only.'], answer: 0, explanation: 'Repeated tolerant reads are the sweet spot for cache-aside.', tag: 'cache-aside' },
  ],
}, {
  id: 'distributed-highlands-final',
  villageId: 'distributed-highlands',
  title: 'Highlands Incident Review',
  summary: 'A regional festival incident combines cache stampede, shard hotspot, node replacement and a network partition. This optional review saves your best score but does not gate village completion.',
  steps: [
    { id: 'highlands-final-1', prompt: 'A hot schedule key expires and database reads spike. What stabilizes the source?', options: ['Single-flight refresh or stale-while-revalidate for that hot key.', 'Hash every request to a new shard.', 'Reject all public reads.', 'Remove TTL from every cached value.'], answer: 0, explanation: 'Stampede guards keep many clients from rebuilding the same hot key at once.', tag: 'stampede' },
    { id: 'highlands-final-2', prompt: 'Writes by createdAt overload one shard. What is the likely mistake?', options: ['A monotonic range key created a newest-range hotspot.', 'Too many virtual nodes.', 'A stale-read budget was documented.', 'The API used status codes.'], answer: 0, explanation: 'Newest time ranges often concentrate writes on one shard.', tag: 'hotspot' },
    { id: 'highlands-final-3', prompt: 'A cache node is replaced and most keys move. What design should reduce remapping?', options: ['Consistent hashing with clear ownership ranges.', 'Modulo routing by node count.', 'Infinite retry loops.', 'A longer OpenAPI description.'], answer: 0, explanation: 'Consistent hashing limits movement to affected ranges.', tag: 'consistent-ring' },
    { id: 'highlands-final-4', prompt: 'Two regions cannot communicate and users claim unique slots. What response protects correctness?', options: ['Use CP behavior: reject or route the write until the invariant can be checked.', 'Accept both writes and ignore conflicts.', 'Serve the result from a public cache.', 'Move the request to a random shard.'], answer: 0, explanation: 'Uniqueness needs consistency during partition, so availability may be reduced.', tag: 'cp-choice' },
  ],
}];

export const curriculum: Curriculum = { version: 4, villages, stops, toolCards, finalIncidents };
export const modules = stops;
export const village = foundationVillage;
export const finalIncident = finalIncidents[0];

export function stopById(id: string): JourneyStop {
  const stop = stops.find(item => item.id === id);
  if (!stop) throw new Error(`Unknown journey stop: ${id}`);
  return stop;
}
export function toolCardById(id: string): ToolCard {
  const card = toolCards.find(item => item.id === id);
  if (!card) throw new Error(`Unknown tool card: ${id}`);
  return card;
}
export const moduleById = stopById;
export function villageById(id: string): FoundationVillage {
  const result = villages.find(item => item.id === id);
  if (!result) throw new Error(`Unknown village: ${id}`);
  return result;
}
export function finalIncidentByVillage(id: VillageId): FinalIncident {
  const result = finalIncidents.find(item => item.villageId === id);
  if (!result) throw new Error(`Unknown final incident for village: ${id}`);
  return result;
}
