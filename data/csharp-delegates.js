/* ═══════════════════════════════════════════════════════════════════
   C# — Delegates, Events, Action, Func, Lambda Expressions
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('csharp-delegates', {
    title: 'Delegates & Events',
    description: 'Understanding delegates as type-safe function pointers, multicast behavior, events, Action/Func/Predicate, closures, and the observer pattern in C#.',
    sections: [
        {
            title: 'Delegates Fundamentals',
            content: `<p>A <strong>delegate</strong> is a type-safe function pointer — it holds a reference to a method (or multiple methods) with a specific signature. Delegates are the foundation of events, callbacks, LINQ, and functional patterns in C#.</p>
            <ul>
                <li><strong>Single-cast</strong> — points to one method</li>
                <li><strong>Multicast</strong> — chains multiple methods (invocation list)</li>
                <li><strong>Built-in types</strong> — Action, Func, Predicate cover most use cases</li>
            </ul>`,
            code: `// Custom delegate declaration
public delegate int MathOperation(int a, int b);

// Assign method to delegate
MathOperation add = (a, b) => a + b;
MathOperation multiply = (a, b) => a * b;

int result = add(3, 4);       // 7
int product = multiply(3, 4); // 12

// Multicast delegate (invocation list)
Action<string> logger = msg => Console.WriteLine($"[Console] {msg}");
logger += msg => File.AppendAllText("log.txt", msg + "\\n");
logger += msg => Debug.WriteLine($"[Debug] {msg}");

logger("Application started"); // ALL three methods called!

// Remove from invocation list
logger -= msg => Console.WriteLine($"[Console] {msg}"); // Careful: reference equality!

// Built-in delegate types (prefer these over custom)
Action                      // void, no params
Action<T>                   // void, 1 param
Action<T1, T2>              // void, 2 params (up to 16)
Func<TResult>               // returns TResult, no params
Func<T, TResult>            // returns TResult, 1 param
Func<T1, T2, TResult>       // returns TResult, 2 params
Predicate<T>                // Func<T, bool> — for filtering`,
            language: 'csharp'
        },
        {
            title: 'Events — The Observer Pattern',
            content: `<p><strong>Events</strong> are a restricted delegate pattern: only the declaring class can invoke (raise) the event; subscribers can only add/remove handlers. This enforces encapsulation and prevents external code from clearing or invoking the subscriber list.</p>`,
            code: `// Event declaration pattern
public class OrderService
{
    // 1. Define event with EventHandler<T> or custom delegate
    public event EventHandler<OrderEventArgs> OrderPlaced;
    public event EventHandler<OrderEventArgs> OrderCancelled;

    // 2. Protected virtual method to raise event (allows override in derived classes)
    protected virtual void OnOrderPlaced(OrderEventArgs args)
    {
        OrderPlaced?.Invoke(this, args); // Thread-safe null check
    }

    public async Task PlaceOrderAsync(Order order)
    {
        await _repository.SaveAsync(order);
        OnOrderPlaced(new OrderEventArgs(order)); // Raise event
    }
}

// Custom EventArgs
public class OrderEventArgs : EventArgs
{
    public Order Order { get; }
    public DateTime Timestamp { get; } = DateTime.UtcNow;
    public OrderEventArgs(Order order) => Order = order;
}

// Subscriber
public class NotificationService
{
    public NotificationService(OrderService orderService)
    {
        orderService.OrderPlaced += OnOrderPlaced;  // Subscribe
    }

    private void OnOrderPlaced(object sender, OrderEventArgs e)
    {
        SendEmail(e.Order.CustomerEmail, "Order confirmed!");
    }

    // IMPORTANT: Unsubscribe to prevent memory leaks!
    public void Dispose()
    {
        _orderService.OrderPlaced -= OnOrderPlaced;
    }
}

// Event vs Delegate — what subscribers CAN'T do:
// orderService.OrderPlaced = null;        // ERROR: can't clear
// orderService.OrderPlaced.Invoke(...);   // ERROR: can't invoke
// orderService.OrderPlaced = myHandler;   // ERROR: can't replace (only += or -=)`,
            language: 'csharp',
            callout: { type: 'warning', title: 'Memory Leak Risk', text: 'Events hold strong references to subscribers. If a subscriber has a longer lifetime than the publisher, or you forget to unsubscribe, the subscriber cannot be garbage collected. Use weak events or IDisposable pattern to unsubscribe.' }
        },
        {
            title: 'Closures and Lambda Captures',
            content: `<p>A <strong>closure</strong> is a lambda/anonymous method that captures (closes over) variables from its enclosing scope. The captured variables are lifted to a compiler-generated class, extending their lifetime beyond the original scope.</p>`,
            code: `// Closure — lambda captures 'threshold' from enclosing scope
int threshold = 100;
Func<int, bool> isAboveThreshold = x => x > threshold; // Captures 'threshold'

threshold = 200; // Changes affect the lambda!
isAboveThreshold(150); // false! (150 > 200 is false)

// The compiler generates something like:
// class <>c__DisplayClass { public int threshold; }
// The lambda gets a reference to this class, not a copy of the value

// PITFALL: Loop variable capture
var actions = new List<Action>();
for (int i = 0; i < 5; i++)
{
    actions.Add(() => Console.Write(i)); // All capture SAME variable!
}
actions.ForEach(a => a()); // Prints: 55555 (not 01234!)

// FIX: Create local copy
for (int i = 0; i < 5; i++)
{
    int local = i; // Each iteration gets its own copy
    actions.Add(() => Console.Write(local));
}
actions.ForEach(a => a()); // Prints: 01234

// foreach in C# 5+ fixes this automatically:
foreach (var item in items)
{
    actions.Add(() => Use(item)); // Each iteration has its own 'item'
}

// Performance impact: closures allocate
// Hot path — avoid closures:
// BAD: allocates closure class every call
void Process(List<int> items, int min) =>
    items.Where(x => x > min).ToList(); // Closure over 'min'

// GOOD for hot path: static lambda (C# 9+)
items.Where(static x => x > 0); // No capture = no allocation`,
            language: 'csharp'
        },
        {
            title: 'Practical Patterns with Delegates',
            content: `<p>Delegates enable powerful patterns: strategy, decorator (middleware), retry policies, and functional composition — all without inheritance or complex class hierarchies.</p>`,
            code: `// Strategy Pattern via Func<>
public class PricingEngine
{
    private readonly Func<Order, decimal> _discountStrategy;

    public PricingEngine(Func<Order, decimal> discountStrategy)
    {
        _discountStrategy = discountStrategy;
    }

    public decimal CalculateTotal(Order order) =>
        order.Subtotal - _discountStrategy(order);
}

// Usage — swap strategies without new classes:
var engine = new PricingEngine(order => order.Subtotal * 0.1m); // 10% off
var vipEngine = new PricingEngine(order => 
    order.Items.Count > 5 ? order.Subtotal * 0.2m : 0m);

// Middleware/Pipeline Pattern
public class Pipeline<T>
{
    private readonly List<Func<T, Func<T, T>, T>> _middlewares = new();

    public Pipeline<T> Use(Func<T, Func<T, T>, T> middleware)
    {
        _middlewares.Add(middleware);
        return this;
    }

    public T Execute(T input)
    {
        Func<T, T> next = x => x; // Terminal
        for (int i = _middlewares.Count - 1; i >= 0; i--)
        {
            var middleware = _middlewares[i];
            var currentNext = next;
            next = x => middleware(x, currentNext);
        }
        return next(input);
    }
}

// Retry with delegate
public static async Task<T> RetryAsync<T>(
    Func<Task<T>> operation,
    int maxRetries = 3,
    TimeSpan? delay = null)
{
    for (int attempt = 0; ; attempt++)
    {
        try { return await operation(); }
        catch when (attempt < maxRetries)
        {
            await Task.Delay(delay ?? TimeSpan.FromSeconds(Math.Pow(2, attempt)));
        }
    }
}

// Usage:
var result = await RetryAsync(() => httpClient.GetStringAsync(url));`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"What is the difference between a delegate, Action, Func, and an event?","difficulty":"medium","answer":"<p>A <strong>delegate</strong> is a type-safe function pointer — a type whose instances reference methods with a matching signature. <strong>Action&lt;T&gt;</strong> and <strong>Func&lt;T,TResult&gt;</strong> are built-in generic delegate types: Action returns void, Func returns a value — so you rarely need to declare custom delegate types anymore.</p><p>An <strong>event</strong> is a restricted wrapper over a delegate that enforces the publish/subscribe pattern: outside code can only <code>+=</code> subscribe and <code>-=</code> unsubscribe; it cannot invoke the delegate or overwrite subscribers. Events protect the invocation list from external misuse.</p>","explanation":"A delegate is a phone number you can call or hand out. An event is a mailing list where outsiders may only join or leave — only the owner (publisher) can actually send the newsletter.","bestPractices":["Prefer Action/Func over custom delegate types","Expose events (not raw delegates) for pub/sub APIs","Unsubscribe from events to avoid memory leaks"],"commonMistakes":["Exposing a public delegate field instead of an event (external invoke/overwrite)","Forgetting to unsubscribe, leaking the subscriber","Declaring custom delegates when Func/Action suffice"],"interviewTip":"Key distinction: an event restricts consumers to +=/-= only, protecting the invocation list — a raw delegate lets anyone invoke or overwrite it.","followUp":["Why can events cause memory leaks?","What is the EventHandler<T> pattern?","How do you raise an event thread-safely?"]},
        {"question":"How do multicast delegates work, and what happens if one subscriber throws?","difficulty":"hard","answer":"<p>A <strong>multicast delegate</strong> holds an invocation list of multiple methods; invoking it calls them in subscription order. For a <code>void</code> delegate all are called; for one returning a value, only the <em>last</em> return value is kept (others are discarded).</p><p>If a subscriber <strong>throws</strong>, invocation stops immediately — later subscribers are never called and the exception propagates to the caller. To isolate failures, invoke each handler individually via <code>GetInvocationList()</code> in a try/catch, aggregating errors.</p>","code":"Action notify = A; notify += B; notify += C;\n\n// Default: if B throws, C never runs and the exception bubbles up.\n// Isolate each subscriber instead:\nforeach (Action handler in notify.GetInvocationList())\n{\n    try { handler(); }\n    catch (Exception ex) { _log.LogError(ex, \"handler failed\"); }\n}","language":"csharp","explanation":"A multicast delegate is a phone tree: normally each person calls the next. If one person refuses (throws), the chain breaks and nobody after them gets called — unless you call each person yourself and shrug off the ones who do not answer.","bestPractices":["Use GetInvocationList to isolate subscriber failures","Do not rely on return values from multicast delegates","Keep handlers fast and exception-safe"],"commonMistakes":["Assuming all handlers run even if one throws","Relying on the return value of a multicast Func","Assuming a guaranteed invocation order across app versions"],"interviewTip":"The gotchas that impress: only the last return value survives, and a throwing subscriber halts the rest unless you loop GetInvocationList with try/catch.","followUp":["How do you collect return values from all subscribers?","What order are handlers invoked in?","How does this affect event design?"]},
        {
            question: 'What is a delegate in C# and how does it differ from an interface?',
            difficulty: 'easy',
            answer: `<p>A <strong>delegate</strong> is a type-safe function pointer that references a method with a specific signature. An <strong>interface</strong> defines a contract for a class. Key differences:</p>
            <ul>
                <li>Delegates reference a single method; interfaces can define many methods</li>
                <li>Delegates support multicast (chaining multiple methods); interfaces don't</li>
                <li>Delegates enable functional-style programming (pass functions as arguments)</li>
                <li>Interfaces require a class implementation; delegates work with any matching method</li>
            </ul>`,
            code: `// Interface approach — requires a class
public interface IValidator
{
    bool Validate(string input);
}
public class EmailValidator : IValidator
{
    public bool Validate(string input) => input.Contains("@");
}
// Must create class, instantiate, pass around

// Delegate approach — just a function
Func<string, bool> validate = input => input.Contains("@");
// Lightweight, composable, no class needed

// When to use each:
// Interface: multiple related methods, state, DI, mocking
// Delegate: single method, callbacks, strategy, LINQ, event handling

// Delegates shine for composition:
Func<string, bool> isEmail = s => s.Contains("@");
Func<string, bool> isLongEnough = s => s.Length > 5;
Func<string, bool> isValid = s => isEmail(s) && isLongEnough(s);`,
            language: 'csharp',
            bestPractices: [
                'Use Action/Func instead of custom delegate types for most scenarios',
                'Use interfaces when you need multiple methods or DI/mocking',
                'Use delegates for callbacks, strategies, and functional composition',
                'Prefer Func/Action in public APIs for simplicity'
            ],
            commonMistakes: [
                'Defining custom delegate types when Action/Func would suffice',
                'Using interfaces for single-method callbacks (over-engineering)',
                'Forgetting that delegates hold references to target objects (memory implications)',
                'Using events when a simple callback Func/Action would be cleaner'
            ],
            interviewTip: 'The key distinction: delegates are about "what to do" (a single operation), interfaces are about "what you are" (a contract/role). Show you can choose the right tool for each scenario.',
            followUp: ['When would you choose a delegate over an interface?', 'What is a multicast delegate?', 'How are delegates used in DI?'],
            seniorPerspective: 'I use delegates for cross-cutting behavioral injection (retry policies, circuit breakers, logging decorators) where creating an interface per behavior would be excessive ceremony.',
            architectPerspective: 'In pipeline architectures (middleware, message handlers), delegates compose better than interfaces. ASP.NET Core middleware is fundamentally Func<RequestDelegate, RequestDelegate> — pure function composition.'
        },
        {
            question: 'What is the difference between events and delegates? Why use events?',
            difficulty: 'medium',
            answer: `<p>An <strong>event</strong> is a delegate with restricted access: only the declaring class can invoke it, and external code can only subscribe (<code>+=</code>) or unsubscribe (<code>-=</code>). This enforces encapsulation of the observer pattern and prevents subscribers from accidentally clearing or invoking the event.</p>`,
            code: `// Without event keyword — dangerous!
public class Button
{
    public Action Clicked; // Any code can:
}
var btn = new Button();
btn.Clicked = null;          // Clear all subscribers! 
btn.Clicked();               // Invoke externally — breaks encapsulation!
btn.Clicked = myHandler;     // Replace all subscribers with just one!

// With event keyword — safe!
public class Button
{
    public event Action Clicked; // Restricted access:
}
var btn = new Button();
// btn.Clicked = null;       // ERROR: only += and -= allowed
// btn.Clicked();            // ERROR: only declaring class can invoke
// btn.Clicked = myHandler;  // ERROR: assignment not allowed
btn.Clicked += myHandler;    // OK: subscribe
btn.Clicked -= myHandler;    // OK: unsubscribe

// Custom event accessor (advanced — for thread safety or weak references)
public class EventAggregator
{
    private EventHandler<MessageEventArgs> _handler;
    private readonly object _lock = new();

    public event EventHandler<MessageEventArgs> MessageReceived
    {
        add { lock (_lock) { _handler += value; } }
        remove { lock (_lock) { _handler -= value; } }
    }

    protected void OnMessageReceived(MessageEventArgs args)
    {
        EventHandler<MessageEventArgs> handler;
        lock (_lock) { handler = _handler; }
        handler?.Invoke(this, args);
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Always use event keyword for publish/subscribe scenarios',
                'Use EventHandler<TEventArgs> convention for .NET standard events',
                'Raise events via protected virtual OnXxx methods (enables override)',
                'Always null-check before invoking: EventName?.Invoke(this, args)'
            ],
            commonMistakes: [
                'Using public delegates instead of events (no encapsulation)',
                'Forgetting to unsubscribe (causes memory leaks)',
                'Not null-checking before invoking (NullReferenceException if no subscribers)',
                'Raising events from outside the declaring class (compile error with events, but possible with raw delegates)'
            ],
            interviewTip: 'Focus on the WHY: events prevent three dangerous operations that raw delegates allow: external invocation, assignment (replacing all subscribers), and clearing (setting to null). This is encapsulation of the observer pattern.',
            followUp: ['How can events cause memory leaks?', 'What is the weak event pattern?', 'How do custom event accessors work?'],
            seniorPerspective: 'In long-lived services, I always implement IDisposable on subscribers that unsubscribes from all events. Forgetting this is the #1 cause of memory leaks in WPF/WinForms apps I\'ve debugged.',
            architectPerspective: 'For loosely-coupled systems, I prefer MediatR or an event bus over C# events. C# events create tight coupling between publisher and subscriber assemblies; a mediator decouples them entirely.'
        },
        {
            question: 'Explain closures in C#. What are the performance implications and pitfalls?',
            difficulty: 'advanced',
            answer: `<p>A <strong>closure</strong> is a lambda or anonymous method that captures variables from its enclosing scope. The compiler generates a hidden class to hold captured variables, extending their lifetime. This has correctness and performance implications.</p>`,
            code: `// How closures work under the hood:
int multiplier = 3;
Func<int, int> multiply = x => x * multiplier; // Captures 'multiplier'

// Compiler generates:
// private class DisplayClass
// {
//     public int multiplier;
//     public int Method(int x) => x * multiplier;
// }
// var display = new DisplayClass { multiplier = 3 };
// Func<int, int> multiply = display.Method;

// PITFALL 1: Captured variable is shared, not copied
int counter = 0;
var increment = () => counter++;
increment(); increment(); increment();
Console.WriteLine(counter); // 3 — lambda modifies the ORIGINAL variable

// PITFALL 2: Classic loop capture bug
var funcs = new Func<int>[5];
for (int i = 0; i < 5; i++)
    funcs[i] = () => i; // All capture SAME 'i'
// funcs[0]() == funcs[4]() == 5 (final value of i after loop!)

// PERFORMANCE: Closures allocate on every invocation
void ProcessHotPath(List<int> items, int threshold)
{
    // BAD: allocates DisplayClass + delegate on every call
    var filtered = items.Where(x => x > threshold).ToList();
    
    // GOOD (C# 9+ static lambda): no capture, no allocation
    var positive = items.Where(static x => x > 0).ToList();
    
    // GOOD: hoist delegate outside hot path if threshold is stable
}

// C# 9 static lambdas prevent accidental capture:
Action<int> log = static x => Console.WriteLine(x); // OK
// Action<int> bad = static x => Console.WriteLine(threshold); // ERROR! Can't capture`,
            language: 'csharp',
            bestPractices: [
                'Use static lambdas (C# 9+) in hot paths to prevent accidental captures',
                'Create local copies of loop variables when capturing in loops',
                'Be aware that captured variables extend their lifetime (prevents GC)',
                'Cache delegates that don\'t need fresh captures for reuse'
            ],
            commonMistakes: [
                'Loop variable capture bug (all lambdas reference final loop value)',
                'Not realizing closures allocate a class on the heap each time',
                'Capturing large objects unintentionally (prevents their garbage collection)',
                'Assuming captured variables are copied (they are shared by reference)'
            ],
            interviewTip: 'Draw the compiler-generated DisplayClass. Explain that the lambda does NOT get a copy of the variable — it gets a reference to the generated class field. This is why modifications are visible and why the loop bug occurs.',
            followUp: ['How does the compiler implement closures?', 'What is the loop variable capture bug?', 'How do static lambdas help performance?'],
            seniorPerspective: 'I use BenchmarkDotNet to profile closure allocations in hot paths. In one API, replacing captured lambdas with static methods and passing state via the overload parameter reduced Gen 0 collections by 40%.',
            architectPerspective: 'Closures are the hidden cost of elegant LINQ pipelines. In latency-sensitive systems (trading, real-time), I establish coding guidelines: no closures in message processing paths, cached delegates for recurring operations.'
        },
        {
            question: 'What are Action, Func, and Predicate? When would you define a custom delegate instead?',
            difficulty: 'easy',
            answer: `<p>These are built-in generic delegate types that cover 99% of use cases:</p>
            <ul>
                <li><code>Action&lt;T&gt;</code> — takes parameters, returns void (up to 16 params)</li>
                <li><code>Func&lt;T, TResult&gt;</code> — takes parameters, returns a value (last type param is return type)</li>
                <li><code>Predicate&lt;T&gt;</code> — takes one parameter, returns bool (shorthand for Func&lt;T, bool&gt;)</li>
            </ul>`,
            code: `// Action — "do something" (no return value)
Action greet = () => Console.WriteLine("Hello!");
Action<string> log = msg => Console.WriteLine($"[LOG] {msg}");
Action<string, int> repeat = (msg, times) =>
{
    for (int i = 0; i < times; i++) Console.WriteLine(msg);
};

// Func — "compute something" (has return value)
Func<int> getRandom = () => new Random().Next();
Func<int, int, int> add = (a, b) => a + b;
Func<string, bool> isValid = s => !string.IsNullOrEmpty(s);
Func<HttpClient, CancellationToken, Task<string>> fetch =
    async (client, ct) => await client.GetStringAsync("https://api.example.com", ct);

// Predicate — "test something" (always returns bool)
Predicate<int> isPositive = x => x > 0;
var positives = numbers.FindAll(isPositive); // List<T>.FindAll uses Predicate

// When to define a CUSTOM delegate:
// 1. Complex signature that benefits from a descriptive name
public delegate bool TryParseHandler<T>(string input, out T result);
// Action/Func cannot represent 'out' parameters!

// 2. ref/in/out parameters
public delegate void RefAction<T>(ref T item);

// 3. Documentation/IntelliSense clarity for domain-specific callbacks
public delegate decimal PricingRule(Order order, Customer customer, DateTime date);
// More self-documenting than Func<Order, Customer, DateTime, decimal>`,
            language: 'csharp',
            bestPractices: [
                'Prefer Action/Func over custom delegates for standard signatures',
                'Define custom delegates only for out/ref params or domain clarity',
                'Use Predicate<T> with List<T>.Find/FindAll/RemoveAll methods',
                'Name custom delegates descriptively (verb + context)'
            ],
            commonMistakes: [
                'Defining custom delegates when Action/Func would work',
                'Confusing Predicate<T> with Func<T, bool> (functionally equivalent, different types)',
                'Forgetting that Func last type param is always the return type',
                'Not leveraging Action/Func in public APIs (forces callers to know custom delegate types)'
            ],
            interviewTip: 'Quick mnemonic: Action = void return, Func = has return value (last generic param), Predicate = Func that returns bool. Mention that LINQ uses Func<T, bool> not Predicate<T>.',
            followUp: ['Why does LINQ use Func<T, bool> instead of Predicate<T>?', 'Can Action/Func represent async methods?', 'What is Func<Task<T>> for async delegates?'],
            seniorPerspective: 'I use Func<T, Task<T>> extensively for async middleware pipelines and decorator patterns. Combined with DI, it enables elegant cross-cutting concerns without class hierarchies.',
            architectPerspective: 'In plugin architectures, well-named custom delegates serve as extension points that are self-documenting. The type name in IntelliSense tells plugin authors exactly what behavior is expected.'
        },
        {
            question: 'How does a multicast delegate behave with return values and exceptions in its invocation list?',
            difficulty: 'hard',
            answer: `<p>A multicast delegate invokes each method in its <strong>invocation list in order</strong>. Two surprising behaviors matter: (1) for a non-void delegate, <strong>only the return value of the last method is kept</strong> — all others are discarded; (2) if any handler <strong>throws, invocation stops immediately</strong> and the remaining handlers never run.</p>`,
            explanation: `Picture a relay where each runner reports a number but only the final runner's number is recorded. And if any runner trips, the race halts on the spot — nobody after them runs.`,
            code: `// Return value: only the LAST result survives
Func<int> chain = () => 1;
chain += () => 2;
chain += () => 3;
int result = chain(); // 3 -> results of 1 and 2 are discarded!

// Exceptions short-circuit the rest of the list
Action pipeline = () => Console.WriteLine("A");
pipeline += () => throw new InvalidOperationException("B failed");
pipeline += () => Console.WriteLine("C"); // NEVER runs

try { pipeline(); }
catch (InvalidOperationException) { /* C was skipped */ }

// To run ALL handlers and capture every result/exception, invoke manually:
var exceptions = new List<Exception>();
foreach (Func<int> handler in chain.GetInvocationList().Cast<Func<int>>())
{
    try { var r = handler(); /* use each r */ }
    catch (Exception ex) { exceptions.Add(ex); }
}
if (exceptions.Count > 0)
    throw new AggregateException(exceptions);

// Removal uses delegate equality; method-group/static targets compare reliably,
// but two distinct lambda instances are NOT equal even if identical in code:
Action a = () => Console.Write("x");
Action combined = a + a;
combined -= a; // removes ONE occurrence (the last match)`,
            language: 'csharp',
            bestPractices: [
                'Avoid non-void multicast delegates; if you need all results, iterate GetInvocationList',
                'Iterate the invocation list manually when every handler must run despite failures',
                'Aggregate handler exceptions into an AggregateException for full visibility',
                'Subscribe with method references, not fresh lambdas, when you need to unsubscribe later'
            ],
            commonMistakes: [
                'Expecting to receive every handler return value (only the last is kept)',
                'Assuming all handlers run when one throws (invocation stops at the exception)',
                'Trying to unsubscribe a lambda using a different lambda instance',
                'Relying on multicast for fan-out where independent error handling is required'
            ],
            interviewTip: 'Two crisp facts win this question: last-return-value-wins and first-exception-stops-the-chain. Then show GetInvocationList as the escape hatch to run every handler independently.',
            followUp: ['How does GetInvocationList help with exception isolation?', 'Why can you not reliably unsubscribe an inline lambda?', 'How does this relate to event invocation?'],
            seniorPerspective: `Whenever handlers must be independent (notifications, plugins), I iterate the invocation list and collect exceptions. Relying on raw multicast invocation has caused silent dropped handlers in incident postmortems I have reviewed.`,
            architectPerspective: `Multicast delegates are fine for fire-and-forget UI events but unsuitable as an integration backbone. For independent, observable handler execution across modules I reach for a mediator or message bus instead.`
        },
        {
            question: 'How do events cause memory leaks, and how does the weak event pattern prevent them?',
            difficulty: 'advanced',
            answer: `<p>An event holds a <strong>strong reference</strong> from the publisher to each subscriber via the delegate's target. If a subscriber does not unsubscribe and the publisher outlives it, the subscriber <strong>cannot be garbage collected</strong> — a classic managed memory leak. The <strong>weak event pattern</strong> stores subscribers via <code>WeakReference</code> so the GC can reclaim them.</p>`,
            explanation: `A normal event is like the publisher gripping each subscriber's hand and never letting go. Even when a subscriber wants to leave the room, the grip keeps it pinned. A weak event holds a loose tag that lets go automatically once the subscriber is gone.`,
            code: `// THE LEAK: long-lived publisher, short-lived subscriber
public class MarketFeed                 // lives for the whole app
{
    public event EventHandler<Tick>? Ticked;
    public void Push(Tick t) => Ticked?.Invoke(this, t);
}

public class ChartView                   // created/destroyed often (UI)
{
    public ChartView(MarketFeed feed)
    {
        feed.Ticked += OnTick;           // feed now strongly references this view
    }
    private void OnTick(object? s, Tick t) { /* redraw */ }
    // No unsubscribe -> every closed ChartView stays alive forever
}

// FIX 1 (simplest, deterministic): unsubscribe in Dispose
public sealed class ChartView2 : IDisposable
{
    private readonly MarketFeed _feed;
    public ChartView2(MarketFeed feed) { _feed = feed; _feed.Ticked += OnTick; }
    private void OnTick(object? s, Tick t) { }
    public void Dispose() => _feed.Ticked -= OnTick; // releases the strong ref
}

// FIX 2: weak event manager (WPF) or a manual WeakReference store
public class WeakEvent<TArgs>
{
    private readonly List<WeakReference<EventHandler<TArgs>>> _handlers = new();

    public void Subscribe(EventHandler<TArgs> h) =>
        _handlers.Add(new WeakReference<EventHandler<TArgs>>(h));

    public void Raise(object sender, TArgs args)
    {
        // Dead targets are skipped and pruned -> no leak
        _handlers.RemoveAll(wr => !wr.TryGetTarget(out var h)
            || (Invoke(h, sender, args), false).Item2);
    }
    private static EventHandler<TArgs> Invoke(EventHandler<TArgs> h, object s, TArgs a)
    { h(s, a); return h; }
}`,
            language: 'csharp',
            bestPractices: [
                'Always unsubscribe in Dispose when a subscriber is shorter-lived than the publisher',
                'Prefer explicit unsubscription over weak events when lifetimes are clear',
                'Use WPF WeakEventManager (or weak references) for UI bound to long-lived models',
                'Capture the handler in a field so the exact delegate can be removed'
            ],
            commonMistakes: [
                'Subscribing in a constructor and never unsubscribing',
                'Static events that root subscribers for the entire process lifetime',
                'Using anonymous lambdas that cannot be unsubscribed precisely',
                'Assuming the GC handles event leaks (the strong reference prevents collection)'
            ],
            interviewTip: 'State the direction of the reference clearly: the PUBLISHER references the SUBSCRIBER through the delegate. That is why a long-lived publisher pins short-lived subscribers. Weak references break that chain.',
            followUp: ['Why does the publisher reference the subscriber and not vice versa?', 'When is the weak event pattern overkill?', 'How does WeakEventManager work in WPF?'],
            seniorPerspective: `The number-one managed leak I have debugged in desktop apps is unsubscribed events. I make every event-subscribing class implement IDisposable and enforce it with analyzers (CA1001).`,
            architectPerspective: `For loosely coupled, long-lived systems I prefer a mediator or message bus over raw C# events precisely because lifetime management is explicit. Weak events are a targeted fix, not a substitute for a clear ownership model.`
        }
    ]
});
