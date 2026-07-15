PageData.register('event-storming', {
    title: 'Event Storming & Domain Discovery',
    description: 'Master Event Storming workshops for bounded context discovery, aggregate identification, domain event modeling, and facilitating collaborative design sessions that bridge business and technical teams.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>Event Storming is a workshop-based method invented by Alberto Brandolini that brings together domain experts and developers to rapidly explore complex business domains. Rather than relying on lengthy documentation or isolated interviews, Event Storming uses a large modeling surface (typically an unlimited paper roll on a wall) and colored sticky notes to collaboratively discover domain events, commands, aggregates, and bounded contexts.</p>
<p>The technique operates at three levels of granularity:</p>
<ul>
<li><strong>Big Picture Event Storming</strong> — explores the entire business domain in a single session, identifying major flows and boundaries</li>
<li><strong>Process Level Event Storming</strong> — zooms into a specific business process, adding commands, policies, and read models</li>
<li><strong>Design Level Event Storming</strong> — translates process-level output into software design artifacts like aggregates, bounded contexts, and event-driven architectures</li>
</ul>
<p>Event Storming is deeply connected to Domain-Driven Design (DDD). It serves as the primary discovery technique for identifying ubiquitous language, bounded contexts, and context maps — making it an essential skill for architects and senior engineers working on complex systems.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Event Storming uses a color-coded sticky note system where each color represents a specific domain concept:</p>
<ul>
<li><strong>Orange — Domain Events:</strong> Things that happened in the system, written in past tense (e.g., "Order Placed", "Payment Received"). These are the backbone of the entire workshop.</li>
<li><strong>Blue — Commands:</strong> Actions that trigger domain events, written as imperatives (e.g., "Place Order", "Process Payment"). Commands represent user intent or system decisions.</li>
<li><strong>Yellow — Aggregates:</strong> Clusters of domain objects that enforce business rules and accept commands to produce events. These become your transactional consistency boundaries.</li>
<li><strong>Pink/Red — Hot Spots:</strong> Questions, conflicts, or areas of uncertainty that need further discussion. These highlight where domain experts disagree or where complexity lurks.</li>
<li><strong>Purple/Lilac — Policies:</strong> Reactive logic that listens to events and triggers commands ("When X happens, do Y"). Policies represent automation rules and business process orchestration.</li>
<li><strong>Green — Read Models:</strong> Views or projections that actors need to make decisions. These represent the information users consume before issuing commands.</li>
<li><strong>Small Yellow — Actors/Personas:</strong> The people or systems that issue commands.</li>
<li><strong>Large Pink — External Systems:</strong> Third-party services or legacy systems that participate in the flow.</li>
</ul>
<p>The workshop follows a diverge-then-converge pattern: first generate as many events as possible (chaotic exploration), then organize them chronologically, identify boundaries, and refine into a coherent model.</p>`
        },
        {
            title: 'How It Works',
            content: `<p>An Event Storming session follows a structured facilitation flow that moves from chaos to clarity. The facilitator guides participants through distinct phases, each building on the previous one:</p>
<ol>
<li><strong>Chaotic Exploration (15-20 min):</strong> Everyone writes domain events on orange stickies simultaneously. No discussion, no ordering — pure brain dump.</li>
<li><strong>Timeline Enforcement (20-30 min):</strong> Arrange events left-to-right chronologically. Duplicates are merged, gaps become visible.</li>
<li><strong>Reverse Narrative (10-15 min):</strong> Walk backwards through the timeline telling the story. This reveals missing events and incorrect ordering.</li>
<li><strong>Commands and Actors (20-30 min):</strong> Add blue command stickies before events, and identify who/what issues each command.</li>
<li><strong>Policies and Reactions (15-20 min):</strong> Identify automation — purple stickies for "when X happens, always do Y".</li>
<li><strong>Aggregates (20-30 min):</strong> Group commands and events around yellow aggregate stickies that enforce the business rules.</li>
<li><strong>Bounded Context Discovery (15-20 min):</strong> Draw boundaries around clusters of aggregates that share language and cohesion.</li>
<li><strong>Hot Spot Resolution (ongoing):</strong> Pink stickies mark disagreements — resolve or defer them explicitly.</li>
</ol>`,
            mermaid: `graph LR
    A[Chaotic Exploration] --> B[Timeline Enforcement]
    B --> C[Reverse Narrative]
    C --> D[Commands and Actors]
    D --> E[Policies and Reactions]
    E --> F[Aggregate Identification]
    F --> G[Bounded Context Discovery]
    G --> H[Hot Spot Resolution]
    
    style A fill:#ff9900,color:#000
    style B fill:#ff9900,color:#000
    style C fill:#ff9900,color:#000
    style D fill:#4488ff,color:#fff
    style E fill:#9944cc,color:#fff
    style F fill:#ffdd00,color:#000
    style G fill:#44aa44,color:#fff
    style H fill:#ff4466,color:#fff`
        },
        {
            title: 'Visual Diagram',
            content: `<p>Bounded Context discovery emerges naturally from Event Storming output. Clusters of related aggregates, events, and commands that share a common language form natural boundaries. The diagram below shows how event clusters map to bounded contexts and how context maps define their relationships:</p>`,
            mermaid: `graph TB
    subgraph OrderContext[Order Bounded Context]
        OA[Order Aggregate]
        OE1[Order Placed]
        OE2[Order Confirmed]
        OC1[Place Order]
        OC2[Confirm Order]
        OC1 --> OA
        OA --> OE1
        OC2 --> OA
        OA --> OE2
    end

    subgraph PaymentContext[Payment Bounded Context]
        PA[Payment Aggregate]
        PE1[Payment Initiated]
        PE2[Payment Received]
        PC1[Initiate Payment]
        PC2[Process Payment]
        PC1 --> PA
        PA --> PE1
        PC2 --> PA
        PA --> PE2
    end

    subgraph ShippingContext[Shipping Bounded Context]
        SA[Shipment Aggregate]
        SE1[Shipment Scheduled]
        SE2[Shipment Delivered]
        SC1[Schedule Shipment]
        SC1 --> SA
        SA --> SE1
        SA --> SE2
    end

    OE2 -->|Domain Event| PC1
    PE2 -->|Domain Event| SC1

    style OrderContext fill:#e8f4e8,stroke:#44aa44
    style PaymentContext fill:#e8e8f4,stroke:#4444aa
    style ShippingContext fill:#f4e8e8,stroke:#aa4444`
        },
        {
            title: 'Implementation',
            content: `<p>Translating Event Storming output into code follows a direct mapping. Each sticky note type corresponds to a code artifact. Below is a C# implementation showing how an Event Storming session output for an Order domain translates into aggregate, command, and event code:</p>`,
            code: `// Domain Event (Orange Sticky) — Something that happened
public record OrderPlaced(
    Guid OrderId,
    Guid CustomerId,
    List<OrderLine> Lines,
    decimal TotalAmount,
    DateTime OccurredAt
) : IDomainEvent;

public record PaymentReceived(
    Guid OrderId,
    Guid PaymentId,
    decimal Amount,
    DateTime OccurredAt
) : IDomainEvent;

// Command (Blue Sticky) — Intent to change state
public record PlaceOrder(
    Guid CustomerId,
    List<OrderLineDto> Lines
) : ICommand;

public record ProcessPayment(
    Guid OrderId,
    decimal Amount,
    string PaymentMethod
) : ICommand;

// Aggregate (Yellow Sticky) — Enforces business rules
public class OrderAggregate : AggregateRoot
{
    public Guid Id { get; private set; }
    public OrderStatus Status { get; private set; }
    public decimal TotalAmount { get; private set; }
    private readonly List<OrderLine> _lines = new();

    // Command handler — accepts command, enforces rules, emits event
    public void PlaceOrder(PlaceOrder command)
    {
        if (command.Lines.Count == 0)
            throw new DomainException("Order must have at least one line item");

        if (command.Lines.Any(l => l.Quantity <= 0))
            throw new DomainException("Line quantity must be positive");

        var totalAmount = command.Lines.Sum(l => l.Price * l.Quantity);

        Apply(new OrderPlaced(
            OrderId: Id,
            CustomerId: command.CustomerId,
            Lines: command.Lines.Select(MapToOrderLine).ToList(),
            TotalAmount: totalAmount,
            OccurredAt: DateTime.UtcNow
        ));
    }

    // Event handler — mutates state based on event
    private void On(OrderPlaced e)
    {
        Id = e.OrderId;
        Status = OrderStatus.Placed;
        TotalAmount = e.TotalAmount;
        _lines.AddRange(e.Lines);
    }
}

// Policy (Purple Sticky) — "When X happens, do Y"
public class PaymentPolicyHandler : IEventHandler<OrderPlaced>
{
    private readonly ICommandBus _commandBus;

    public PaymentPolicyHandler(ICommandBus commandBus)
    {
        _commandBus = commandBus;
    }

    public async Task Handle(OrderPlaced @event)
    {
        // Policy: When order is placed, initiate payment
        await _commandBus.Send(new ProcessPayment(
            OrderId: @event.OrderId,
            Amount: @event.TotalAmount,
            PaymentMethod: "default"
        ));
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<p>Running effective Event Storming sessions requires deliberate facilitation and preparation:</p>
<ul>
<li><strong>Invite the right people:</strong> You need domain experts (business), developers, UX designers, and product owners in the same room. The magic happens at the intersection of business knowledge and technical thinking. Aim for 6-15 participants.</li>
<li><strong>Use unlimited modeling space:</strong> A long wall with butcher paper (6-8 meters minimum). Digital tools work for remote but lose the kinesthetic learning advantage. Never use a whiteboard — it is too small.</li>
<li><strong>Timebox aggressively:</strong> Big Picture sessions work best at 2-4 hours. Process Level at 1-2 hours. Breaks every 45 minutes. Energy drops sharply after 4 hours.</li>
<li><strong>Start with domain events only:</strong> Resist the temptation to add commands and aggregates too early. Let the timeline form first — premature structure kills exploration.</li>
<li><strong>Embrace hot spots:</strong> Pink stickies are not failures — they reveal where the real complexity lives. Celebrate disagreements between domain experts as discovery moments.</li>
<li><strong>Write in past tense for events:</strong> "Order Placed" not "Place Order". This forces people to think about what actually happened, not what might happen.</li>
<li><strong>Facilitate, do not dictate:</strong> The facilitator asks questions and enforces the color-coding rules but never decides on domain semantics. The domain experts own the language.</li>
<li><strong>Photograph everything:</strong> Take high-resolution photos after each phase. The physical wall is ephemeral — capture it before cleanup.</li>
<li><strong>Follow up within 48 hours:</strong> Translate the wall into digital artifacts (event catalogs, context maps, aggregate diagrams) while the session is fresh in memory.</li>
<li><strong>Iterate:</strong> One session rarely captures everything. Plan for 2-3 sessions on complex domains, each progressively deeper.</li>
</ul>`
        }
    ],
    questions: [
        {
            id: 'es-q1',
            level: 'junior',
            title: 'What is Event Storming and why is it used in software development?',
            answer: `<p>Event Storming is a collaborative workshop technique invented by Alberto Brandolini for rapidly exploring complex business domains. It brings together domain experts (business people) and technical staff (developers, architects) in the same room to build a shared understanding of how a system works.</p>
<p>The core idea is simple: participants write <strong>domain events</strong> (things that happen in the business) on orange sticky notes and arrange them chronologically on a large wall. From there, the group progressively adds commands, actors, policies, and aggregates to build a complete picture of the domain.</p>
<p><strong>Why it is used:</strong></p>
<ul>
<li>It surfaces hidden complexity and misunderstandings between business and tech teams within hours rather than weeks of documentation</li>
<li>It creates a shared <em>ubiquitous language</em> that both sides understand</li>
<li>It naturally reveals bounded contexts — the logical boundaries where different parts of the system use different terminology</li>
<li>It identifies hot spots (areas of disagreement or uncertainty) early, before code is written</li>
<li>It democratizes knowledge — no single person holds all the information after a session</li>
</ul>
<p>Event Storming is particularly valuable at the start of new projects, when rewriting legacy systems, or when teams need to break a monolith into microservices.</p>`
        },
        {
            id: 'es-q2',
            level: 'junior',
            title: 'What do the different sticky note colors represent in Event Storming?',
            answer: `<p>Event Storming uses a standardized color-coding system where each color represents a specific type of domain concept:</p>
<ul>
<li><strong>Orange — Domain Events:</strong> Things that happened in the system, always written in past tense (e.g., "Order Placed", "Payment Failed"). These are the most important elements and form the timeline backbone.</li>
<li><strong>Blue — Commands:</strong> Actions or intentions that trigger events, written as imperatives (e.g., "Place Order", "Cancel Subscription"). Commands represent what users or systems want to do.</li>
<li><strong>Yellow — Aggregates:</strong> Business entities that receive commands and enforce rules before producing events. They represent consistency boundaries (e.g., "Order", "Account").</li>
<li><strong>Pink/Red — Hot Spots:</strong> Questions, conflicts, or areas of uncertainty. These mark where domain experts disagree or where further investigation is needed.</li>
<li><strong>Purple/Lilac — Policies:</strong> Automated reactions — "When event X happens, trigger command Y". These represent business rules that connect different parts of the flow.</li>
<li><strong>Green — Read Models:</strong> Information or views that actors need to see before making a decision and issuing a command.</li>
<li><strong>Small Yellow — Actors:</strong> People or external systems that initiate commands.</li>
<li><strong>Large Pink — External Systems:</strong> Third-party services that participate in the process but are outside your control.</li>
</ul>
<p>The color system works because it makes the model instantly scannable — you can spot at a glance where events cluster, where policies create coupling, and where hot spots indicate risk.</p>`
        },
        {
            id: 'es-q3',
            level: 'mid',
            title: 'How do you facilitate an effective Event Storming session? What preparation and techniques are essential?',
            answer: `<p>Facilitating an Event Storming session requires careful preparation and active moderation during the workshop:</p>
<p><strong>Before the session:</strong></p>
<ul>
<li><strong>Invite the right mix:</strong> 6-15 people including domain experts, developers, product owners, and UX designers. Too few means missing knowledge; too many creates chaos.</li>
<li><strong>Prepare the space:</strong> A long wall (6-8 meters minimum) covered with butcher paper, unlimited sticky notes in all required colors, thick markers (forces concise writing).</li>
<li><strong>Set a clear scope:</strong> Define the business process or domain being explored. Communicate this in advance so participants come prepared.</li>
<li><strong>Timebox the session:</strong> 2-4 hours for Big Picture, 1-2 hours for Process Level. Schedule breaks every 45 minutes.</li>
</ul>
<p><strong>During the session:</strong></p>
<ul>
<li><strong>Start with chaotic exploration:</strong> Give everyone 15-20 minutes to write domain events silently. No discussion, no ordering — pure divergent thinking.</li>
<li><strong>Enforce the timeline:</strong> Guide participants to arrange events left-to-right chronologically. Duplicates get merged.</li>
<li><strong>Use the reverse narrative:</strong> Walk backwards through the timeline telling the story out loud. This reveals gaps and incorrect sequencing.</li>
<li><strong>Manage hot spots actively:</strong> When disagreements arise, slap a pink sticky on them and move on. Do not let debates derail the flow.</li>
<li><strong>Progressively add layers:</strong> Commands, then actors, then policies, then aggregates. Each layer builds on the previous one.</li>
<li><strong>Ask powerful questions:</strong> "What happens before this?", "Who triggers this?", "What could go wrong here?", "Is this always true?"</li>
</ul>
<p><strong>After the session:</strong></p>
<ul>
<li>Photograph the entire wall in high resolution within minutes of finishing</li>
<li>Digitize findings within 48 hours while context is fresh</li>
<li>Schedule follow-up sessions for unresolved hot spots</li>
</ul>`
        },
        {
            id: 'es-q4',
            level: 'mid',
            title: 'How do you identify bounded contexts from Event Storming output?',
            answer: `<p>Bounded contexts emerge naturally from Event Storming output when you look for specific patterns in the event timeline and aggregate clusters:</p>
<p><strong>Key signals that indicate a boundary:</strong></p>
<ul>
<li><strong>Language shifts:</strong> When the same word means different things in different parts of the timeline (e.g., "Account" means a user profile in one area but a financial ledger in another), you have found a context boundary.</li>
<li><strong>Aggregate clusters:</strong> Groups of aggregates that interact heavily with each other but rarely with aggregates outside the group form natural bounded contexts.</li>
<li><strong>Pivot events:</strong> Domain events that trigger activity in a completely different area of the business often sit at context boundaries. These become integration events between contexts.</li>
<li><strong>Team ownership:</strong> If different teams own different parts of the timeline, those divisions often align with bounded context boundaries.</li>
<li><strong>Policy boundaries:</strong> When a purple policy sticky connects two distant parts of the timeline, it often bridges two bounded contexts.</li>
</ul>
<p><strong>The process:</strong></p>
<ol>
<li>Look for clusters of aggregates that share vocabulary and cohesion</li>
<li>Draw physical lines (use tape or markers) around these clusters on the wall</li>
<li>Name each cluster — the name should reflect the ubiquitous language within it</li>
<li>Identify the events that cross boundaries — these become your integration contracts</li>
<li>Map the relationships between contexts (upstream/downstream, conformist, anti-corruption layer, etc.)</li>
</ol>
<p>A common mistake is drawing boundaries too small (creating excessive fragmentation) or too large (creating a distributed monolith). The sweet spot is where each context has a cohesive language, a clear owner, and can evolve independently.</p>`
        },
        {
            id: 'es-q5',
            level: 'mid',
            title: 'What is the difference between Big Picture and Design Level Event Storming?',
            answer: `<p>Event Storming operates at three distinct levels, each with different goals, participants, and outputs:</p>
<table>
<tr><th>Aspect</th><th>Big Picture</th><th>Process Level</th><th>Design Level</th></tr>
<tr><td><strong>Goal</strong></td><td>Explore the entire business domain</td><td>Detail a specific business process</td><td>Translate into software design</td></tr>
<tr><td><strong>Duration</strong></td><td>2-4 hours</td><td>1-2 hours</td><td>1-3 hours</td></tr>
<tr><td><strong>Participants</strong></td><td>Everyone — business, tech, management</td><td>Domain experts + developers</td><td>Developers + architects</td></tr>
<tr><td><strong>Output</strong></td><td>Domain overview, bounded contexts, hot spots</td><td>Detailed flow with commands, policies, read models</td><td>Aggregates, event schemas, API contracts</td></tr>
<tr><td><strong>Sticky types used</strong></td><td>Mainly orange (events) + pink (hot spots)</td><td>All colors: events, commands, actors, policies, read models</td><td>Focus on yellow (aggregates) + precise event schemas</td></tr>
<tr><td><strong>Level of detail</strong></td><td>High-level, strategic</td><td>Tactical, process-specific</td><td>Implementation-ready</td></tr>
</table>
<p><strong>Big Picture</strong> is exploratory and strategic. It maps the entire business in one session, reveals major boundaries, and identifies which areas need deeper investigation. It prioritizes breadth over depth.</p>
<p><strong>Design Level</strong> is precise and implementation-focused. It takes a single bounded context from the Big Picture output and defines exact aggregate boundaries, command/event schemas, invariants (business rules), and consistency requirements. The output can be directly translated into code — aggregates become classes, commands become method signatures, events become message contracts.</p>
<p>The typical workflow is: Big Picture first to find boundaries → Process Level to understand flows within a boundary → Design Level to make it implementable.</p>`
        },
        {
            id: 'es-q6',
            level: 'senior',
            title: 'How do you translate Event Storming output into production code? Walk through the mapping of aggregates, commands, and events.',
            answer: `<p>Event Storming output maps directly to code artifacts in event-sourced or CQRS architectures. Each sticky note type has a corresponding code construct:</p>
<p><strong>The mapping:</strong></p>
<ul>
<li><strong>Orange (Domain Event)</strong> → Immutable event record/class with all relevant data. Named in past tense. Becomes the source of truth in event-sourced systems.</li>
<li><strong>Blue (Command)</strong> → Command object/DTO that carries user intent. Validated at the boundary, then routed to the appropriate aggregate.</li>
<li><strong>Yellow (Aggregate)</strong> → Class with command handlers (methods that accept commands) and event applicators (methods that mutate state from events). Enforces all invariants.</li>
<li><strong>Purple (Policy)</strong> → Event handler/saga/process manager that subscribes to events and dispatches new commands. Implements "when X then Y" automation.</li>
<li><strong>Green (Read Model)</strong> → Projection/materialized view built by subscribing to events and denormalizing data for query purposes.</li>
</ul>
<p><strong>Translation process:</strong></p>
<ol>
<li><strong>Define event schemas first:</strong> Each orange sticky becomes a strongly-typed event with a unique name, timestamp, aggregate ID, and relevant payload fields.</li>
<li><strong>Define commands:</strong> Each blue sticky becomes a command with validation rules. Commands should contain only the minimum data needed to make a decision.</li>
<li><strong>Build aggregates:</strong> Each yellow sticky becomes a class that (a) accepts commands, (b) checks business rules (invariants), (c) emits events if rules pass, and (d) applies events to update internal state.</li>
<li><strong>Wire policies:</strong> Each purple sticky becomes an event handler that reacts to events from one context and may issue commands to another.</li>
<li><strong>Build read models:</strong> Each green sticky becomes a projection that subscribes to relevant events and builds a queryable view.</li>
</ol>
<p><strong>Key principle:</strong> The aggregate is the transactional boundary. A single command targets one aggregate, and that aggregate emits one or more events atomically. Cross-aggregate coordination happens through policies (eventual consistency), never through direct coupling.</p>`
        },
        {
            id: 'es-q7',
            level: 'senior',
            title: 'How do you handle conflicts and disagreements between domain experts during an Event Storming session?',
            answer: `<p>Conflicts during Event Storming are not problems — they are the most valuable discoveries. Disagreements between domain experts reveal where implicit assumptions differ, where process branches exist, or where the domain is genuinely ambiguous. Here is how to handle them:</p>
<p><strong>Immediate tactics (during the session):</strong></p>
<ul>
<li><strong>Hot-spot it immediately:</strong> Place a pink/red sticky on the disagreement point. Write the conflicting views on it. Do not let the group debate for more than 2 minutes — capture and move on.</li>
<li><strong>Ask "Are you both right?":</strong> Often, two domain experts describe different contexts or different time periods. The "conflict" may actually reveal a context boundary or a process variant.</li>
<li><strong>Separate events for variants:</strong> If domain expert A says "Order ships immediately" and expert B says "Order goes to approval first", write BOTH as separate event flows. The model supports both paths.</li>
<li><strong>Use temporal language:</strong> Ask "Was it always this way?" and "When did this change?" — often conflicts arise because the process evolved and experts remember different eras.</li>
<li><strong>Parking lot for deep dives:</strong> Some conflicts need 30+ minutes of discussion. Park them and schedule a focused follow-up with just the relevant experts.</li>
</ul>
<p><strong>Resolution strategies (after the session):</strong></p>
<ul>
<li><strong>Data-driven resolution:</strong> Look at actual production data or logs to see which variant is real and how often each occurs.</li>
<li><strong>Context boundary indicator:</strong> If two experts use the same word differently, you have likely found a bounded context boundary. Each context gets its own definition.</li>
<li><strong>Process mining:</strong> Use actual system event logs to validate which flow actually happens in production.</li>
<li><strong>Prototype both paths:</strong> Build lightweight prototypes of conflicting models and test them against real scenarios.</li>
</ul>
<p><strong>Anti-patterns to avoid:</strong></p>
<ul>
<li>Never let the loudest person win — status should not determine domain truth</li>
<li>Never vote on domain facts — reality is not democratic</li>
<li>Never suppress conflicts to "keep the peace" — unresolved conflicts become bugs in production</li>
</ul>`
        },
        {
            id: 'es-q8',
            level: 'senior',
            title: 'How can Event Storming be used to discover and document legacy systems that lack documentation?',
            answer: `<p>Event Storming is exceptionally effective for reverse-engineering legacy systems because it extracts domain knowledge from people's heads rather than from code or (nonexistent) documentation:</p>
<p><strong>The approach:</strong></p>
<ol>
<li><strong>Identify the human experts:</strong> Find the people who have worked with the legacy system longest — support staff, senior developers, operations people, and business users who remember why things were built a certain way.</li>
<li><strong>Run a Big Picture session focused on "what happens today":</strong> Ask participants to write events describing what the current system does, not what it should do. Use the past tense strictly: "Invoice Generated", "Batch Job Ran", "Manual Override Applied".</li>
<li><strong>Surface the workarounds:</strong> Legacy systems accumulate workarounds. Ask explicitly: "Where do you do something manually because the system cannot handle it?" These workarounds are domain logic that lives in people's heads, not in code.</li>
<li><strong>Map the tribal knowledge:</strong> Ask "What happens when X breaks?" and "Who knows how to fix Y?" — the answers reveal critical paths and undocumented dependencies.</li>
<li><strong>Cross-reference with code:</strong> After the session, developers trace the discovered events back to actual code paths. This creates a Rosetta Stone between business concepts and technical implementation.</li>
</ol>
<p><strong>Specific techniques for legacy discovery:</strong></p>
<ul>
<li><strong>Shadow events:</strong> Add a "shadow" color for events that should happen but do not (gaps in the current system).</li>
<li><strong>Ghost aggregates:</strong> Identify data entities that exist in the database but no expert mentions — these may be dead code or hidden dependencies.</li>
<li><strong>Exception mapping:</strong> Dedicate time to "what goes wrong" scenarios — legacy systems often have extensive error-handling paths that are undocumented.</li>
<li><strong>Integration archaeology:</strong> Map external system touchpoints. Legacy systems often have dozens of integrations via files, queues, and scheduled jobs that no single person fully understands.</li>
</ul>
<p>The output becomes the specification for a replacement system — you now know what behaviors must be preserved, what can be dropped, and where the real complexity lives.</p>`
        },
        {
            id: 'es-q9',
            level: 'architect',
            title: 'How do you scale Event Storming across multiple teams working on a large enterprise system?',
            answer: `<p>Scaling Event Storming beyond a single team requires a hierarchical approach that balances breadth of discovery with depth of detail. Large organizations cannot fit 50+ people in one room effectively, so you need a structured multi-session strategy:</p>
<p><strong>The scaled approach:</strong></p>
<ol>
<li><strong>Executive Big Picture (1 session, 15-20 people):</strong> Senior representatives from each domain/team map the entire business at the highest level. Output: major bounded contexts identified, key integration events named, ownership assigned.</li>
<li><strong>Context-level sessions (1 per bounded context, 6-10 people):</strong> Each team runs their own Process Level and Design Level sessions within their bounded context. They own the internal model.</li>
<li><strong>Integration workshops (cross-team, 8-12 people):</strong> Representatives from adjacent contexts meet to define the contracts between their boundaries — what events cross boundaries, what data they carry, and what guarantees they provide.</li>
</ol>
<p><strong>Coordination mechanisms:</strong></p>
<ul>
<li><strong>Shared event catalog:</strong> Maintain a living document of all published integration events with their schemas, owners, and consumers. This becomes the enterprise event registry.</li>
<li><strong>Context map:</strong> Visualize relationships between all bounded contexts (upstream/downstream, conformist, ACL, open-host, published language). Update after every session.</li>
<li><strong>Facilitator network:</strong> Train facilitators in each team. Consistency of technique matters more than having one master facilitator.</li>
<li><strong>Cadence:</strong> Run Big Picture quarterly (or when major business changes occur), context-level monthly during active development, integration workshops as needed.</li>
</ul>
<p><strong>Common scaling pitfalls:</strong></p>
<ul>
<li><strong>Over-centralization:</strong> Do not try to model everything in one giant session — it becomes too abstract and loses detail</li>
<li><strong>Under-coordination:</strong> Teams modeling in isolation create conflicting event definitions and duplicate concepts</li>
<li><strong>Stale models:</strong> Event Storming output rots quickly if not connected to living code. Integrate findings into ADRs, event schemas, and automated contract tests</li>
<li><strong>Ignoring politics:</strong> Bounded context boundaries often align with organizational boundaries (Conway's Law). Acknowledge and work with this rather than fighting it</li>
</ul>
<p>The goal is federated modeling: each team owns their internal domain model, but integration points are collectively governed through shared workshops and published contracts.</p>`
        },
        {
            id: 'es-q10',
            level: 'architect',
            title: 'How do you use Event Storming output to drive microservice decomposition? What are the pitfalls?',
            answer: `<p>Event Storming provides the most reliable input for microservice boundary decisions because it reveals actual domain cohesion rather than technical layering. The decomposition process follows a structured path from sticky notes to service boundaries:</p>
<p><strong>The decomposition process:</strong></p>
<ol>
<li><strong>Start with bounded contexts:</strong> Each bounded context identified in Event Storming is a candidate microservice (or group of services). The context boundary is the service boundary.</li>
<li><strong>Validate with aggregate affinity:</strong> Within a context, check if all aggregates are truly cohesive. If an aggregate can change independently without affecting others in the same context, it might warrant its own service.</li>
<li><strong>Trace event flows for coupling:</strong> If two proposed services would need synchronous communication for most operations, they are likely too tightly coupled to separate. Merge them or redesign the boundary.</li>
<li><strong>Apply the policy test:</strong> Purple policy stickies that connect two aggregates indicate eventual consistency is acceptable between them — these are safe service boundaries. If a business rule requires atomic consistency across two aggregates, they must stay in the same service.</li>
<li><strong>Size by team capacity:</strong> A microservice should be ownable by one team (6-8 people). If a bounded context is too large for one team, split along sub-domain lines revealed in the Event Storming output.</li>
</ol>
<p><strong>Critical pitfalls:</strong></p>
<ul>
<li><strong>Entity-based decomposition:</strong> Splitting by entity (Order Service, Customer Service, Product Service) rather than by behavior/capability creates distributed monoliths with excessive cross-service calls.</li>
<li><strong>Ignoring data gravity:</strong> If two services constantly query each other's data, you drew the boundary wrong. The data that changes together should live together.</li>
<li><strong>Premature decomposition:</strong> Do not split into microservices on day one. Start with a well-structured modular monolith that mirrors your bounded contexts, then extract services when you have evidence of independent scaling or deployment needs.</li>
<li><strong>Synchronous event dependencies:</strong> If Service A cannot function without an immediate response from Service B, you have created temporal coupling. Redesign to use async events with local caches or choreography.</li>
<li><strong>Ignoring organizational alignment:</strong> A service split that does not match team ownership creates coordination overhead that negates the benefits of independence. Conway's Law is real — design for it.</li>
</ul>
<p><strong>Validation checklist before splitting:</strong></p>
<ul>
<li>Can this service deploy independently without coordinating with other teams?</li>
<li>Does this service own its data completely (no shared databases)?</li>
<li>Can failures in this service be isolated without cascading?</li>
<li>Does the team owning this service have all the skills needed to operate it?</li>
<li>Are the integration events between this service and others well-defined and stable?</li>
</ul>
<p>If any answer is "no", reconsider the boundary. Event Storming gives you the map — but the map must be validated against operational reality before you commit to service separation.</p>`
        }
    ]
});
