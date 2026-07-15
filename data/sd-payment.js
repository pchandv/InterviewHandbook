/* ═══════════════════════════════════════════════════════════════════
   System Design — Payment Gateway
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('sd-payment', {
    title: 'Payment Gateway',
    description: 'System design for a payment processing system — idempotency, exactly-once processing, reconciliation, PCI compliance, and handling distributed transactions reliably.',
    sections: [
        {
            title: 'Requirements & Scale',
            content: `<h4>Functional Requirements</h4>
            <ul>
                <li>Process card payments (authorize, capture, void, refund)</li>
                <li>Idempotent processing — never double-charge</li>
                <li>Multi-currency support</li>
                <li>3D Secure (3DS) authentication flow</li>
                <li>Webhook delivery for async payment status</li>
                <li>Reconciliation with bank settlement files</li>
                <li>PCI DSS compliance — never store raw card data</li>
            </ul>
            <h4>Non-Functional Requirements</h4>
            <ul>
                <li>Availability: 99.99% — downtime = lost revenue</li>
                <li>Consistency: Strongly consistent for financial amounts</li>
                <li>Latency: Authorization &lt;2 seconds end-to-end</li>
                <li>Auditability: Every state change logged immutably</li>
                <li>Scale: 10K+ transactions/second at peak</li>
            </ul>`
        },
        {
            title: 'High-Level Architecture',
            mermaid: `graph TB
    subgraph Client
        APP[Merchant App/Checkout]
    end
    subgraph Gateway[Payment Gateway]
        API[API Layer<br/>Idempotency Check]
        RISK[Risk Engine<br/>Fraud Detection]
        ROUTER[Processor Router<br/>Routing Rules]
        LEDGER[Double-Entry Ledger<br/>Append-Only]
        SM[State Machine<br/>Payment Lifecycle]
        WEBHOOK[Webhook Dispatcher]
    end
    subgraph External[External Systems]
        VAULT[Token Vault<br/>PCI Compliant]
        PROC1[Processor 1<br/>Stripe/Adyen]
        PROC2[Processor 2<br/>Fallback]
        BANK[Issuing Bank]
    end
    subgraph DataStores
        DB[(Payment DB<br/>PostgreSQL)]
        OUTBOX[(Outbox Table)]
        EVENTS[(Event Store<br/>Audit Log)]
        RECON[(Settlement Files)]
    end
    APP -->|Token + Amount| API
    API --> RISK --> ROUTER
    ROUTER --> PROC1 & PROC2
    PROC1 & PROC2 --> BANK
    API --> SM --> LEDGER
    SM --> DB & OUTBOX & EVENTS
    OUTBOX --> WEBHOOK
    APP -->|Card Entry| VAULT
    VAULT -->|Token| APP
    RECON -->|Daily| LEDGER`,
            content: `<p>The architecture separates concerns: <strong>tokenization</strong> (PCI vault), <strong>orchestration</strong> (state machine + idempotency), <strong>processing</strong> (routed to processor), and <strong>accounting</strong> (double-entry ledger). This enables independent scaling and testing of each concern.</p>`
        },
        {
            title: 'Payment Lifecycle State Machine',
            mermaid: `stateDiagram-v2
    [*] --> Created: Payment initiated
    Created --> Authorized: Auth approved by bank
    Created --> Failed: Auth declined
    Created --> Pending3DS: 3DS challenge required
    Pending3DS --> Authorized: 3DS passed
    Pending3DS --> Failed: 3DS failed/timeout
    Authorized --> Captured: Merchant captures funds
    Authorized --> Voided: Merchant cancels before capture
    Captured --> Settled: Bank settlement confirmed
    Captured --> PartialRefund: Partial refund issued
    Captured --> FullRefund: Full refund issued
    PartialRefund --> Settled: Remaining settled
    FullRefund --> [*]: Fully reversed
    Settled --> [*]: Complete`,
            content: `<p>Each transition is <strong>guarded</strong> (only valid transitions allowed), <strong>idempotent</strong> (repeating a transition is a no-op), and <strong>logged</strong> (immutable audit entry). This prevents invalid operations like refunding an uncaptured payment or capturing a voided auth.</p>`
        },
        {
            title: 'Core Patterns Deep Dive',
            content: `<p>Design a payment gateway that processes credit card transactions reliably — ensuring money is never double-charged, payments never lost, and all operations are auditable.</p>`,
            code: `// CRITICAL REQUIREMENTS:
// 1. IDEMPOTENCY — same request processed exactly once (never double-charge)
// 2. CONSISTENCY — debit and credit must both succeed or both fail
// 3. AUDITABILITY — every state change logged immutably
// 4. RELIABILITY — no payment lost even during failures
// 5. PCI COMPLIANCE — card data never stored in plain text

// PAYMENT FLOW:
// Client → API Gateway → Payment Service → Risk Engine → Processor → Bank
//                ↓                ↓                              ↑
//         Idempotency Key    Ledger Entry                  Response
//                                ↓
//                         Event (PaymentSucceeded/Failed)

// IDEMPOTENCY (most critical pattern):
public class PaymentService
{
    public async Task<PaymentResult> ProcessAsync(PaymentRequest request)
    {
        // Check if this idempotency key was already processed
        var existing = await _store.GetByIdempotencyKeyAsync(request.IdempotencyKey);
        if (existing is not null)
            return existing.Result; // Return cached result — no re-processing!

        // Process the payment
        var result = await _processor.ChargeAsync(request);
        
        // Store result keyed by idempotency key (atomically)
        await _store.SaveAsync(request.IdempotencyKey, result);
        
        return result;
    }
}

// DOUBLE-ENTRY LEDGER (accounting correctness):
// Every transaction creates TWO entries that sum to zero:
// Debit:  Customer Account  -100.00
// Credit: Merchant Account   +100.00
// This ensures money is never created or destroyed.

// RECONCILIATION:
// End-of-day: compare our ledger with bank/processor settlement files
// Discrepancies flagged for manual review
// Automated retry for failed payments (with exponential backoff)

// STATE MACHINE for payment lifecycle:
// Created → Processing → Authorized → Captured → Settled
//                ↓             ↓           ↓
//             Failed        Voided      Refunded
// Each transition is idempotent and logged

// PCI COMPLIANCE:
// Never store full card numbers — use tokenization
// Card data only in PCI-compliant vault (Stripe, Adyen)
// Your system only handles tokens/references
// Network segmentation: card processing in isolated environment`,
            language: 'csharp'
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
                <li><strong>No idempotency key</strong>: Retries after timeout cause double-charges — the #1 production incident in payment systems</li>
                <li><strong>Storing raw card numbers</strong>: Massive PCI scope, breach liability. Always tokenize.</li>
                <li><strong>Mutable balance column</strong>: Single balance field with no audit trail makes reconciliation and dispute resolution impossible</li>
                <li><strong>Synchronous assumption</strong>: Payment results often arrive async (3DS, bank webhooks). Not handling pending states causes data loss.</li>
                <li><strong>No reconciliation process</strong>: Your ledger will diverge from the bank — guaranteed. Without reconciliation you won't know.</li>
                <li><strong>2PC across services</strong>: Two-phase commit blocks on coordinator failure. Use saga + outbox pattern instead.</li>
                <li><strong>Trusting webhooks without signature verification</strong>: Attackers can forge payment-success callbacks</li>
                <li><strong>No processor fallback</strong>: Single processor dependency means their outage = your outage</li>
            </ul>`
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
                    <li><strong>Idempotency</strong> as the #1 concern — show you understand exactly-once in distributed systems</li>
                    <li><strong>State machine</strong> for payment lifecycle with guarded transitions</li>
                    <li><strong>Double-entry ledger</strong> for accounting correctness (debit + credit = 0)</li>
                    <li><strong>PCI compliance</strong> via tokenization — never store PANs</li>
                    <li><strong>Reconciliation</strong> as the safety net that catches lost callbacks</li>
                    <li><strong>Saga + outbox</strong> for distributed transactions (not 2PC)</li>
                    <li><strong>Separation</strong>: correctness over availability for financial amounts</li>
                </ul>`
            }
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li>Idempotency key → check-before-process → cache result. This prevents double-charges.</li>
                <li>Double-entry ledger: every movement is two entries that net to zero. Never mutate, only append.</li>
                <li>Payment state machine: Created → Authorized → Captured → Settled (with branches for failures/refunds)</li>
                <li>PCI compliance: tokenize at the edge, never let PANs reach your servers</li>
                <li>Reconciliation: daily comparison of your ledger vs bank settlement files catches silent discrepancies</li>
                <li>Saga + outbox for cross-service flows; reject 2PC for availability reasons</li>
                <li>Webhook handlers must be idempotent, signature-verified, and order-independent</li>
                <li>Processor fallback: route to backup processor when primary is down</li>
            </ul>`
        }
    ],
    questions: [
        {
            question: 'How would you design a payment gateway that never double-charges customers?',
            difficulty: 'architect',
            answer: `<p>The key pattern is <strong>idempotency</strong>: every payment request includes a unique idempotency key. Before processing, check if this key was already handled — if yes, return the cached result. Combined with a state machine (preventing invalid transitions) and double-entry ledger (accounting correctness), this ensures exactly-once processing semantics.</p>`,
            interviewTip: 'Lead with idempotency — it is THE critical pattern for payment systems. Then discuss: state machine for payment lifecycle, double-entry ledger for accounting, reconciliation for catching discrepancies, and PCI compliance for card data security. Show you understand that "exactly-once" in distributed systems requires idempotency at the application level.',
            followUp: ['What is a double-entry ledger?', 'How do you handle partial failures (charged but response lost)?', 'What is PCI DSS compliance?'],
            seniorPerspective: 'I implement idempotency at the API layer (idempotency key in request header) AND at the processor layer (unique transaction reference). Belt and suspenders — even if our system retries, the bank sees the same reference and deduplicates.',
            architectPerspective: 'Payment systems are the canonical example of "correctness over availability." Unlike most systems where eventual consistency is acceptable, payments must be strongly consistent for financial amounts. I separate the payment processing path (strongly consistent, synchronous) from notifications and analytics (eventually consistent, async).'
        }
    ,
        {
            question: 'What is a double-entry ledger, and why use it in a payment system?',
            difficulty: 'medium',
            answer: `<p>A <strong>double-entry ledger</strong> records every transaction as two balanced entries \u2014 a debit and an equal credit \u2014 so the books always sum to zero and money is never created or destroyed (e.g., debit customer \u2212$100, credit merchant +$100). Balances are derived by summing immutable, append-only entries rather than mutating a single number, which makes the system auditable and reconcilable.</p>`,
            bestPractices: ['Model money movement as balanced debit/credit entries', 'Keep ledger entries immutable and append-only', 'Derive balances by summation, not in-place mutation', 'Reconcile the ledger against processor/bank settlement files daily'],
            commonMistakes: ['Storing a single mutable balance column (no audit trail)', 'Allowing entries that do not balance to zero', 'Editing/deleting past entries instead of posting reversals', 'Skewing reconciliation by mixing authorization and capture amounts'],
            interviewTip: 'Stress immutability and balancing: every movement is two entries that net to zero, and you never edit history \u2014 you post a reversal. That is what auditors and interviewers want to hear.',
            followUp: ['How do you represent a refund or chargeback in the ledger?', 'How does reconciliation detect discrepancies?', 'How do authorization vs capture appear in the ledger?'],
            seniorPerspective: 'I treat the ledger as the source of truth and everything else as a projection. Corrections are reversing entries, never edits \u2014 that discipline is what survives an audit.',
            architectPerspective: 'A double-entry, append-only ledger is essentially event sourcing for money: immutable facts, derived balances, full auditability. It underpins correctness guarantees that a mutable-balance design cannot provide.'
        },
        {
            question: 'How do you reliably coordinate a payment across multiple services (saga, outbox, 2PC)?',
            difficulty: 'hard',
            answer: `<p>Distributed payments cannot rely on a single ACID transaction across services, and <strong>two-phase commit (2PC)</strong> is usually avoided \u2014 it blocks on coordinator failure and scales poorly. Instead, use a <strong>saga</strong>: a sequence of local transactions with <strong>compensating actions</strong> (e.g., refund if fulfillment fails). To publish events atomically with the local DB write, use the <strong>transactional outbox</strong> pattern so the state change and the event are committed together, then relayed reliably.</p>`,
            bestPractices: ['Use sagas with explicit compensating transactions for cross-service flows', 'Use the outbox pattern to publish events atomically with the DB write', 'Make every step idempotent so retries are safe', 'Model the payment lifecycle as a state machine with logged transitions'],
            commonMistakes: ['Using 2PC across services (blocking, poor availability)', 'Dual-writing to DB and broker without an outbox (lost or phantom events)', 'Sagas without compensations, leaving money in an inconsistent state', 'Non-idempotent steps that double-charge on retry'],
            interviewTip: 'Explicitly reject 2PC for availability reasons, then pair saga (orchestration + compensation) with the outbox (atomic event publish). Tie it back to idempotency to avoid double charges.',
            followUp: ['Orchestration vs choreography sagas \u2014 which and why?', 'How does the outbox relay work exactly?', 'What do you compensate when capture succeeds but fulfillment fails?'],
            seniorPerspective: 'I default to orchestrated sagas for payments because the compensation logic is explicit and auditable, backed by an outbox so we never lose a state-change event. 2PC is a last resort I almost never reach for.',
            architectPerspective: 'Payments are the canonical place where you trade distributed ACID for sagas + idempotency + outbox. The architecture accepts eventual consistency between services while preserving strict correctness within each local transaction.'
        },
        {
            question: 'How do you handle PCI compliance so you never store raw card data?',
            difficulty: 'medium',
            answer: `<p>Keep card data out of your systems entirely via <strong>tokenization</strong>: the card is captured directly by a PCI-compliant vault/processor (Stripe, Adyen) which returns a <strong>token</strong>; your services only ever store and use that token. This shrinks PCI scope, since raw PANs never touch your servers, logs, or database. Combine with network segmentation, TLS in transit, encryption at rest, and strict access controls.</p>`,
            bestPractices: ['Tokenize via a PCI-compliant vault \u2014 store tokens, never raw PANs', 'Isolate any card-handling in a segmented, minimal-scope environment', 'Never log card numbers; mask/redact in all telemetry', 'Encrypt in transit (TLS) and at rest; enforce least-privilege access'],
            commonMistakes: ['Persisting full card numbers to reduce processor calls', 'Accidentally logging PANs in request/debug logs', 'Treating the whole system as in-scope instead of isolating card flows', 'Rolling your own card vault instead of using a compliant provider'],
            interviewTip: 'The mantra: data you never hold cannot be breached. Lead with tokenization to minimize PCI scope, then mention segmentation, no-logging, and encryption as defense in depth.',
            followUp: ['What does "reducing PCI scope" mean in practice?', 'How does tokenization differ from encryption?', 'How do you support recurring charges without storing the card?'],
            seniorPerspective: 'I push card capture to the processor\u2019s hosted fields/SDK so the PAN never reaches our backend. Recurring billing uses processor-stored tokens, keeping us out of PCI scope for raw card data.',
            architectPerspective: 'Tokenization is a scope-reduction strategy as much as a security one: by designing card data to live only in a compliant vault, the rest of the platform stays out of the highest-burden PCI requirements.'
        }
    ,
        {
            question: 'How does reconciliation work in a payment system, and why is it essential even with idempotency?',
            difficulty: 'advanced',
            answer: `<p><strong>Reconciliation</strong> is the periodic process of comparing your internal ledger against the external truth \u2014 the settlement/statement files from the bank or processor \u2014 to detect and resolve discrepancies. Idempotency prevents double-charging within your system, but the external world can still diverge: a charge succeeds at the processor but your callback was lost, a refund partially applied, fees differ, or a chargeback arrives days later.</p>
            <ul>
                <li><strong>Ingest settlement files</strong> (often daily) and match each external transaction to a ledger entry by a stable reference id.</li>
                <li><strong>Classify</strong> matches, missing-on-our-side, missing-on-their-side, and amount mismatches.</li>
                <li><strong>Auto-resolve</strong> known cases (e.g., post fees) and queue the rest for manual review.</li>
            </ul>`,
            explanation: 'It is balancing your checkbook against the bank statement: even if you recorded every transaction carefully, you still compare against the bank monthly, because fees, timing, and lost notifications mean the two never perfectly agree on their own.',
            bestPractices: ['Match external settlement records to ledger entries by a stable transaction reference', 'Run reconciliation on a schedule and alert on unmatched items', 'Auto-resolve known categories (fees, rounding) and queue exceptions for humans', 'Keep an immutable audit trail so every adjustment is traceable'],
            commonMistakes: ['Assuming idempotency alone guarantees your books match the processor', 'No process for charges that succeeded externally but failed to record internally', 'Ignoring chargebacks/refunds that arrive asynchronously days later', 'Mutating past entries instead of posting reversing/adjustment entries'],
            interviewTip: 'Explicitly separate the two guarantees: idempotency = no double-charge inside your system; reconciliation = your system agrees with the bank. Strong candidates raise the lost-callback case (charged externally, not recorded).',
            followUp: ['How do you handle a charge confirmed at the processor but missing a callback?', 'How are chargebacks represented in the ledger?', 'How would you automate exception resolution?'],
            seniorPerspective: 'I treat the processor settlement file as the source of truth for money movement and reconcile daily. The scary failures are not double-charges (idempotency handles those) but silent single-sided discrepancies from lost webhooks, which only reconciliation catches.',
            architectPerspective: 'Reconciliation is the financial-correctness backstop of the architecture: idempotency, the double-entry ledger, and reconciliation form a defense-in-depth where each catches what the others miss. For audited systems it is non-negotiable, not an afterthought.'
        },
        {
            question: 'How do you model the payment lifecycle as a state machine and handle asynchronous processor callbacks (webhooks, 3DS)?',
            difficulty: 'hard',
            answer: `<p>A payment moves through explicit states \u2014 Created \u2192 Authorized \u2192 Captured \u2192 Settled, with branches to Failed, Voided, Refunded \u2014 and only defined transitions are allowed. Modeling it as a <strong>state machine</strong> makes illegal transitions impossible and every change auditable.</p>
            <ul>
                <li><strong>Async confirmation</strong> \u2014 results often arrive later via webhook (or after a 3-D Secure challenge the user completes out-of-band), so the system cannot assume a synchronous answer.</li>
                <li><strong>Idempotent webhook handling</strong> \u2014 processors retry webhooks and may deliver out of order; dedupe by event id and apply only valid transitions.</li>
                <li><strong>Verify authenticity</strong> \u2014 validate webhook signatures; never trust an unauthenticated callback.</li>
                <li><strong>Reconcile timeouts</strong> \u2014 if no callback arrives, poll the processor rather than guess.</li>
            </ul>`,
            explanation: 'It is like tracking a package through defined stages \u2014 ordered, shipped, delivered \u2014 where the courier phones you with updates that can arrive late, out of order, or twice. You record each valid stage once and ignore duplicates.',
            code: `// Idempotent, signature-verified webhook applying only valid transitions
public async Task HandleWebhookAsync(HttpRequest req)
{
    if (!_processor.VerifySignature(req)) return; // reject forgeries
    var evt = await _processor.ParseAsync(req);

    if (await _events.SeenAsync(evt.Id)) return;  // dedupe retries
    await _events.RecordAsync(evt.Id);

    var payment = await _repo.GetAsync(evt.PaymentId);
    // State machine rejects illegal transitions (e.g., Refund before Capture)
    payment.Apply(evt.ToTransition());
    await _repo.SaveAsync(payment);
}`,
            language: 'csharp',
            bestPractices: ['Define explicit states and allow only valid transitions', 'Make webhook handlers idempotent (dedupe by event id) and order-independent', 'Verify webhook signatures before acting', 'Poll/reconcile when an expected callback does not arrive'],
            commonMistakes: ['Assuming a synchronous result and ignoring async webhooks/3DS', 'Trusting unauthenticated callbacks (forgery/replay risk)', 'Processing duplicate or out-of-order webhooks as new events', 'Allowing arbitrary status updates instead of guarded transitions'],
            interviewTip: 'Combine "state machine for valid transitions" with "idempotent, signature-verified webhook handling". Mentioning 3DS and webhook retries/ordering shows real payments experience.',
            followUp: ['How do you handle a webhook that arrives before your own DB commit?', 'How do you secure webhook endpoints?', 'What happens when a callback never arrives?'],
            seniorPerspective: 'I assume callbacks are unreliable: retried, reordered, occasionally never sent. So the handler is idempotent and the state machine is the gatekeeper, and a reconciliation poll covers the missing-callback case. That combination is what keeps payment state correct under real-world processor behavior.',
            architectPerspective: 'The payment state machine is the contract the whole system agrees on \u2014 it localizes correctness so async callbacks, retries, and reconciliation all funnel through one guarded transition path rather than scattering ad-hoc status updates across services.'
        },
        {
            question: 'How do you implement idempotency for payment endpoints, and why is it critical?',
            difficulty: 'hard',
            answer: `<p><strong>Idempotency</strong> ensures that processing the same request multiple times produces the same result as processing it once — critical for payments because network retries, client timeouts, and webhooks can cause duplicate requests.</p>
<h4>Implementation:</h4>
<ol>
<li><strong>Client sends an Idempotency-Key header</strong> (UUID generated client-side, sent with every retry of the same request)</li>
<li><strong>Server stores the key + response</strong> in a deduplication table:
<pre><code>CREATE TABLE idempotency_keys (
  key VARCHAR(64) PRIMARY KEY,
  request_hash VARCHAR(128),
  response_body JSONB,
  status_code INT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);</code></pre></li>
<li><strong>On each request:</strong> Check if key exists. If yes → return the stored response (no re-processing). If no → process normally, store the response, return it.</li>
<li><strong>Key expiration:</strong> TTL of 24-72 hours (retries beyond that are suspicious and should be rejected).</li>
</ol>
<h4>Edge cases:</h4>
<ul>
<li><strong>Request in progress:</strong> Second request arrives while first is still processing → return 409 Conflict or block until first completes</li>
<li><strong>Request hash mismatch:</strong> Same key but different body → reject (key reuse with different intent is a bug)</li>
<li><strong>Partial failure:</strong> Processing succeeded but response was lost → key ensures client gets the original result on retry</li>
</ul>
<p><strong>Why critical:</strong> Without idempotency, a client timeout + retry charges the card TWICE. A webhook retry processes the payment TWICE. This is real money — double-charging is a compliance and trust issue.</p>`,
            bestPractices: ['Client generates idempotency key; server deduplicates', 'Store the full response so retries get the exact same result', 'Hash the request body to detect key reuse with different parameters', 'Set TTL on keys (24-72 hours) to bound storage and reject stale retries'],
            commonMistakes: ['Server generates the key (client cannot retry with the same key)', 'Only checking key existence without storing the response (inconsistent retries)', 'No handling for concurrent duplicates (race condition → double processing)', 'Keys that never expire — unbounded storage growth'],
            interviewTip: 'Walk through the full lifecycle: client generates key → server checks → process or return stored result. Mention the concurrent-duplicate edge case (409 or mutex) to show depth.',
            followUp: ['How do you handle idempotency across distributed systems (multiple payment service instances)?', 'What if the server crashes after processing but before storing the idempotency response?']
        },
        {
            question: 'How does reconciliation work in a payment system, and why is it necessary even with idempotency?',
            difficulty: 'expert',
            answer: `<p><strong>Reconciliation</strong> is the process of comparing your internal payment records against the payment processor's records to identify and resolve discrepancies.</p>
<h4>Why necessary even with idempotency:</h4>
<ul>
<li>Webhooks can be lost (processor outage, network failure, your endpoint was down)</li>
<li>Your system may have processed a payment but crashed before recording it</li>
<li>The processor may have charged the card but your system thinks it failed</li>
<li>Fraud, chargebacks, and refunds happen outside your system's awareness</li>
</ul>
<h4>Reconciliation architecture:</h4>
<ol>
<li><strong>Daily settlement file:</strong> Processor sends a file (CSV/SFTP) listing all transactions for the previous day</li>
<li><strong>Match engine:</strong> Compare each processor transaction against your internal records:
<ul>
<li><strong>Matched:</strong> Both sides agree on amount, status, timestamp → OK</li>
<li><strong>Missing internally:</strong> Processor charged but you have no record → investigate, create record</li>
<li><strong>Missing at processor:</strong> You think you charged but processor has no record → mark as failed, refund if needed</li>
<li><strong>Amount mismatch:</strong> Both have the transaction but amounts differ → flag for investigation</li>
</ul></li>
<li><strong>Resolution workflow:</strong> Unmatched items go to a queue for manual or automated resolution</li>
<li><strong>Ledger adjustment:</strong> Once resolved, adjust your internal ledger to match reality</li>
</ol>
<h4>Frequency:</h4>
<ul>
<li><strong>T+1 daily reconciliation:</strong> Catches most issues within 24 hours</li>
<li><strong>Real-time reconciliation:</strong> For high-value transactions, poll processor API every few minutes</li>
<li><strong>Monthly close:</strong> Full audit ensuring all accounts balance</li>
</ul>
<p><strong>Key principle:</strong> The processor's records are the source of truth for what actually happened to real money. Your system's records are what you THINK happened. Reconciliation detects when these diverge.</p>`,
            bestPractices: ['Run daily T+1 reconciliation as a minimum; real-time for critical flows', 'Automate matching and only surface genuine discrepancies for human review', 'Track reconciliation metrics: match rate, unmatched count, resolution time', 'Build idempotent resolution actions (safe to re-run reconciliation)'],
            commonMistakes: ['No reconciliation at all — trusting your internal state is correct', 'Manual reconciliation at month-end — catching problems 30 days late', 'Not handling the "charge succeeded but we think it failed" case — customer charged but no order', 'Ignoring small discrepancies — they accumulate and indicate systemic bugs'],
            interviewTip: 'Explain WHY reconciliation is needed (distributed systems have no single source of truth) and describe the match engine logic. Mentioning T+1 timing and the "processor is truth" principle shows real payments experience.',
            followUp: ['How do you handle a reconciliation mismatch where the customer was charged but your system shows no payment?', 'How do PCI compliance requirements affect reconciliation data storage?']
        }
    ]
});
