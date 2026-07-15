/* ═══════════════════════════════════════════════════════════════════
   C# — Pattern Matching (C# 7–12)
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('csharp-patterns', {
    title: 'C# Pattern Matching',
    description: 'Comprehensive coverage of pattern matching evolution from C# 7 through 12 — type patterns, property patterns, positional patterns, relational patterns, list patterns, and switch expressions.',
    sections: [
        {
            title: 'Type Patterns & Declaration Patterns',
            content: `<p>Type patterns test whether an expression is a specific type and optionally declare a variable of that type. Introduced in C# 7, they replace verbose <code>is</code> + cast combinations.</p>`,
            code: `// Before pattern matching (C# 6):
if (shape is Circle)
{
    var circle = (Circle)shape; // Redundant cast!
    Console.WriteLine(circle.Radius);
}

// Type pattern (C# 7) — test and declare in one step:
if (shape is Circle circle)
{
    Console.WriteLine(circle.Radius); // 'circle' is in scope and typed
}

// Declaration pattern with 'when' guard:
if (shape is Circle { Radius: > 10 } largeCircle)
{
    Console.WriteLine($"Large circle: {largeCircle.Radius}");
}

// Null checks with patterns:
if (input is not null)           // C# 9 — cleaner than input != null
if (input is string { Length: > 0 } text)  // Non-null AND has content

// Switch statement with type patterns:
string Describe(object obj) => obj switch
{
    int n when n < 0    => "negative number",
    int n               => $"number: {n}",
    string s            => $"string of length {s.Length}",
    IEnumerable<int> list => $"list with {list.Count()} items",
    null                => "null",
    _                   => $"unknown: {obj.GetType().Name}"
};

// Discard pattern (_) — matches anything, catches remaining cases
// var pattern — matches anything AND binds to variable
if (GetResult() is var result && result.IsSuccess)
{
    // var pattern always matches — useful for intermediate binding
}`,
            language: 'csharp'
        },
        {
            title: 'Switch Expressions & Property Patterns',
            content: `<p><strong>Switch expressions</strong> (C# 8) are concise, expression-based alternatives to switch statements. <strong>Property patterns</strong> match against object properties without deconstructing.</p>`,
            code: `// Switch expression — returns a value, exhaustive
decimal CalculateDiscount(Customer customer) => customer.Tier switch
{
    "Gold"     => 0.20m,
    "Silver"   => 0.10m,
    "Bronze"   => 0.05m,
    _          => 0.0m   // Default arm
};

// Property pattern — match nested properties
string GetShippingZone(Address address) => address switch
{
    { Country: "US", State: "CA" or "WA" or "OR" } => "West Coast",
    { Country: "US", State: "NY" or "NJ" or "CT" } => "East Coast",
    { Country: "US" }                                => "Domestic",
    { Country: "CA" }                                => "Canada",
    { Country: not null }                            => "International",
    _                                                => "Unknown"
};

// Nested property pattern:
decimal CalculateTax(Order order) => order switch
{
    { Customer.Address.Country: "US", Total: > 100 } => order.Total * 0.08m,
    { Customer.Address.Country: "US" }               => order.Total * 0.06m,
    { Customer.Address.Country: "UK" }               => order.Total * 0.20m,
    _                                                 => 0m
};

// Combining patterns with 'and', 'or', 'not' (C# 9):
string Classify(int value) => value switch
{
    > 0 and < 10   => "single digit positive",
    >= 10 and < 100 => "double digit",
    < 0            => "negative",
    0              => "zero",
    _              => "large"
};

// Tuple pattern — match multiple values simultaneously:
string GetQuadrant(int x, int y) => (x, y) switch
{
    ( > 0,  > 0) => "Q1",
    ( < 0,  > 0) => "Q2",
    ( < 0,  < 0) => "Q3",
    ( > 0,  < 0) => "Q4",
    (0, 0)       => "Origin",
    _            => "On axis"
};`,
            language: 'csharp'
        },
        {
            title: 'List Patterns & Positional Patterns',
            content: `<p><strong>List patterns</strong> (C# 11) match against sequences and arrays. <strong>Positional patterns</strong> deconstruct objects and match each component.</p>`,
            code: `// List patterns (C# 11) — match array/list contents:
int[] numbers = { 1, 2, 3, 4, 5 };

var result = numbers switch
{
    [1, 2, ..]             => "starts with 1, 2",
    [.., 4, 5]            => "ends with 4, 5",
    [_, _, 3, ..]         => "third element is 3",
    [var first, .., var last] => $"first={first}, last={last}",
    []                     => "empty",
    _                      => "other"
};

// Slice pattern (..) captures remaining elements:
if (args is [var command, .. var rest])
{
    Console.WriteLine($"Command: {command}, Args: {string.Join(' ', rest)}");
}

// List pattern in validation:
bool IsValidIp(int[] octets) => octets is [
    >= 0 and <= 255,
    >= 0 and <= 255,
    >= 0 and <= 255,
    >= 0 and <= 255
];

// Positional pattern — works with Deconstruct or records:
public record Point(double X, double Y);

string Classify(Point p) => p switch
{
    (0, 0)           => "origin",
    (var x, 0)       => $"on x-axis at {x}",
    (0, var y)       => $"on y-axis at {y}",
    (> 0, > 0)       => "quadrant 1",
    var (x, y)       => $"({x}, {y})"
};

// Combining positional with property:
public record Shape(string Type, double Area);

string Describe(Shape s) => s switch
{
    ("circle", > 100)  => "large circle",
    ("circle", _)      => "small circle",
    (_, > 1000)        => "very large shape",
    var (type, area)   => $"{type} with area {area}"
};`,
            language: 'csharp',
            callout: { type: 'info', title: 'Exhaustiveness Checking', text: 'The compiler checks switch expressions for exhaustiveness — it warns if not all possible inputs are covered. Use the discard pattern (_) as a catch-all, or ensure all enum values are handled. This catches bugs at compile time.' }
        },
        {
            title: 'Real-World Pattern Matching',
            content: `<p>Pattern matching shines in domain logic, validation, state machines, and replacing complex if-else chains with declarative, readable code.</p>`,
            code: `// Domain logic — order processing
public decimal CalculateShipping(Order order) => order switch
{
    { Items.Count: 0 }                          => 0m,
    { Customer.IsPremium: true }                => 0m, // Free for premium
    { Total: >= 100m, Destination.IsLocal: true } => 5.99m,
    { Total: >= 100m }                           => 9.99m,
    { Weight: > 50 }                             => 24.99m, // Heavy
    _                                            => 12.99m
};

// State machine transitions:
public OrderStatus NextStatus(OrderStatus current, OrderEvent evt) =>
    (current, evt) switch
    {
        (OrderStatus.Draft, OrderEvent.Submit)       => OrderStatus.Pending,
        (OrderStatus.Pending, OrderEvent.Pay)        => OrderStatus.Paid,
        (OrderStatus.Paid, OrderEvent.Ship)          => OrderStatus.Shipped,
        (OrderStatus.Shipped, OrderEvent.Deliver)    => OrderStatus.Delivered,
        (_, OrderEvent.Cancel)                       => OrderStatus.Cancelled,
        _ => throw new InvalidOperationException(
                 $"Cannot apply {evt} to order in {current} state")
    };

// Validation with pattern matching:
public string? ValidateRequest(CreateUserRequest req) => req switch
{
    { Email: null or "" }                  => "Email is required",
    { Email: not { Length: <= 255 } }      => "Email too long",
    { Age: < 18 }                          => "Must be 18 or older",
    { Password.Length: < 8 }               => "Password too short",
    { Password: var p } when p == req.Email => "Password cannot be email",
    _                                       => null // Valid!
};

// Exception handling with patterns:
try { await ProcessAsync(); }
catch (Exception ex) when (ex is HttpRequestException { StatusCode: HttpStatusCode.TooManyRequests })
{
    await Task.Delay(TimeSpan.FromSeconds(30));
    await ProcessAsync(); // Retry after rate limit
}
catch (Exception ex) when (ex is TimeoutException or TaskCanceledException)
{
    _logger.LogWarning("Timeout — circuit breaker may open");
}`,
            language: 'csharp'
        }
    ],
    questions: [
        {"question":"What pattern-matching features does modern C# provide, and why are they useful?","difficulty":"medium","answer":"<p>Modern C# pattern matching includes: <strong>type patterns</strong> (<code>if (o is Customer c)</code>), <strong>property patterns</strong> (<code>{ Status: Active, Age: &gt; 18 }</code>), <strong>relational</strong> (<code>&gt;</code>, <code>&lt;=</code>) and <strong>logical</strong> patterns (<code>and</code>, <code>or</code>, <code>not</code>), <strong>positional/deconstruction</strong> patterns for tuples/records, and <strong>list patterns</strong> (<code>[first, .., last]</code>).</p><p>They make conditional logic declarative and safe: you match shape and extract values in one expression, the compiler checks exhaustiveness in switch expressions, and code reads closer to the intent than nested if/casts.</p>","code":"string Describe(object o) => o switch\n{\n    int n and > 0        => \"positive int\",\n    string { Length: 0 } => \"empty string\",\n    Customer { IsVip: true } c => $\"VIP {c.Name}\",\n    null                 => \"null\",\n    _                    => \"other\"\n};","language":"csharp","explanation":"Pattern matching is a smart bouncer that checks type, properties, and shape all at once (\"over-18 VIPs in the left queue\"), instead of a pile of separate if-checks and casts.","bestPractices":["Prefer switch expressions for exhaustive mapping","Combine type + property patterns to avoid casts","Use a discard arm (_) for the default case"],"commonMistakes":["Falling back to nested if/is/cast instead of patterns","Non-exhaustive switch expressions throwing at runtime","Overly clever patterns that hurt readability"],"interviewTip":"List the pattern categories (type, property, relational/logical, positional, list) and note switch-expression exhaustiveness checking.","followUp":["What is a switch expression vs statement?","What are list patterns?","How does exhaustiveness checking help?"]},
        {"question":"What is a switch expression, and how does it differ from a switch statement?","difficulty":"medium","answer":"<p>A <strong>switch expression</strong> (C# 8+) evaluates to a value using <code>=&gt;</code> arms and pattern matching, with no <code>case</code>/<code>break</code> and a <code>_</code> discard for the default. A <strong>switch statement</strong> executes side-effecting blocks per case and requires <code>break</code>.</p><p>Differences: the expression returns a value (assign it directly), is more concise, uses patterns natively, and the compiler warns if it is not exhaustive (throwing <code>SwitchExpressionException</code> at runtime for an unhandled value). Use the expression when mapping an input to a value; use the statement when you need multiple statements/side effects per branch.</p>","explanation":"A switch statement is a set of instructions (\"if red, do these three things\"). A switch expression is a lookup table that just returns an answer (\"red → stop\"), cleaner when you only need the answer.","bestPractices":["Use switch expressions to map input to a single value","Handle the default (_) arm to avoid runtime throws","Use switch statements when branches need multiple side-effecting statements"],"commonMistakes":["Forgetting the _ arm (non-exhaustive, runtime exception)","Cramming heavy side effects into expression arms","Using verbose switch statements for simple value maps"],"interviewTip":"Emphasize \"returns a value + pattern-based + exhaustiveness warning\" as the switch-expression wins over the statement.","followUp":["What happens on an unmatched switch expression?","Can you combine patterns with when guards?","When is a switch statement still better?"]},
        {
            question: 'What are the main types of patterns in C# and how have they evolved?',
            difficulty: 'easy',
            answer: `<p>C# pattern matching has evolved significantly across versions:</p>
            <ul>
                <li><strong>C# 7</strong>: Type patterns, constant patterns, var pattern</li>
                <li><strong>C# 8</strong>: Switch expressions, property patterns, tuple patterns, positional patterns</li>
                <li><strong>C# 9</strong>: Relational patterns (&lt;, &gt;, &lt;=, &gt;=), logical patterns (and, or, not), type pattern simplification</li>
                <li><strong>C# 10</strong>: Extended property patterns (nested dot access)</li>
                <li><strong>C# 11</strong>: List patterns, slice patterns</li>
            </ul>`,
            code: `// C# 7: Type pattern
if (obj is string s) Console.WriteLine(s.Length);

// C# 8: Switch expression + property pattern
var zone = address switch
{
    { Country: "US" } => "Domestic",
    { Country: "CA" } => "Canada",
    _ => "International"
};

// C# 9: Relational + logical patterns
string Classify(int temp) => temp switch
{
    < 0        => "freezing",
    >= 0 and < 20 => "cold",
    >= 20 and < 35 => "comfortable",
    >= 35      => "hot"
};

// C# 9: 'not' pattern (cleaner null checks)
if (input is not null) { /* ... */ }
if (status is not (Status.Active or Status.Pending)) { /* ... */ }

// C# 10: Extended property pattern (dot access)
if (order is { Customer.Address.Country: "US" }) { /* ... */ }
// Before C# 10: { Customer: { Address: { Country: "US" } } }

// C# 11: List patterns
if (args is ["--verbose", .. var rest]) { /* ... */ }
bool IsAscending(int[] arr) => arr is [_, ..] && 
    arr.Zip(arr.Skip(1)).All(p => p.First <= p.Second);`,
            language: 'csharp',
            bestPractices: [
                'Prefer switch expressions over switch statements for value computation',
                'Use property patterns for null-safe nested property access',
                'Combine relational and logical patterns for range checks',
                'Use list patterns for command-line arg parsing and protocol handling'
            ],
            commonMistakes: [
                'Forgetting the discard (_) default arm in switch expressions (compiler warning)',
                'Overly complex patterns that reduce readability (keep each arm simple)',
                'Not realizing pattern order matters (first match wins)',
                'Using pattern matching where a simple if-else is clearer'
            ],
            interviewTip: 'Show the progression across versions — it demonstrates you keep up with language evolution. Highlight that patterns are not just syntactic sugar: they enable exhaustiveness checking and safer code.',
            followUp: ['What is exhaustiveness checking?', 'When would you avoid pattern matching?', 'How do patterns work with records?'],
            seniorPerspective: 'I refactor complex if-else chains into switch expressions during code review. The exhaustiveness checking catches missed cases that would be bugs in if-else chains.',
            architectPerspective: 'Pattern matching enables encoding business rules declaratively. Combined with records (domain events, commands), switch expressions become readable state machines that non-developers can review.'
        },
        {
            question: 'How do switch expressions differ from switch statements? When do you use each?',
            difficulty: 'medium',
            answer: `<p><strong>Switch expressions</strong> (C# 8) are value-returning, concise, and compiler-checked for exhaustiveness. <strong>Switch statements</strong> are imperative, support fall-through (with goto case), and allow side effects in each arm.</p>`,
            code: `// Switch EXPRESSION — returns a value, concise, exhaustive
decimal tax = customer.Region switch
{
    "US-CA" => amount * 0.0725m,
    "US-NY" => amount * 0.08m,
    "UK"    => amount * 0.20m,
    _       => 0m
};
// Benefits: one expression, compiler warns if not exhaustive, no break needed

// Switch STATEMENT — imperative, allows side effects
switch (command)
{
    case "start":
        _service.Start();
        _logger.LogInformation("Service started");
        break;
    case "stop":
        _service.Stop();
        _logger.LogInformation("Service stopped");
        break;
    case "restart":
        _service.Stop();
        _service.Start(); // Multiple statements per case
        break;
    default:
        throw new ArgumentException($"Unknown command: {command}");
}

// When to use EXPRESSION:
// - Computing a value from input
// - Mapping/transforming (enum → string, input → result)
// - Pattern-heavy logic (type checking, property matching)

// When to use STATEMENT:
// - Multiple side effects per case
// - Need goto case (fall-through)
// - Void methods with complex per-case logic
// - Performance-critical code where you need early return

// Expression with complex patterns:
var response = result switch
{
    { IsSuccess: true, Value: var v } => Ok(v),
    { Error.Code: 404 }              => NotFound(),
    { Error.Code: >= 500 }           => StatusCode(500),
    { Error: var e }                  => BadRequest(e.Message)
};`,
            language: 'csharp',
            bestPractices: [
                'Default to switch expressions for value computation (mapping, classification)',
                'Use switch statements for imperative code with side effects',
                'Always include a discard arm (_) or ensure exhaustiveness with enums',
                'Keep each expression arm simple — extract complex logic to methods'
            ],
            commonMistakes: [
                'Trying to use statements (Console.Write, await) inside expression arms directly',
                'Forgetting that expression arms must all return the same type',
                'Not leveraging exhaustiveness checking (adding _ too eagerly hides missing cases)',
                'Using switch statements where a simple expression would be clearer'
            ],
            interviewTip: 'Key distinction: expressions RETURN values, statements PERFORM actions. Mention that for enums without a discard, the compiler ensures every value is handled — this catches bugs when new enum values are added.',
            followUp: ['Can you use await inside switch expressions?', 'How does exhaustiveness work with nullable types?', 'What is the performance of switch expressions vs if-else?'],
            seniorPerspective: 'I use switch expressions as the default for any mapping logic. When a new enum value is added and the switch doesn\'t handle it, the compiler warning immediately shows all affected code paths.',
            architectPerspective: 'In domain-driven code, switch expressions over discriminated unions (records + base type) encode business rules that are both compiler-verified and readable by domain experts during code reviews.'
        },
        {
            question: 'How would you use pattern matching to implement a state machine or domain validation?',
            difficulty: 'advanced',
            answer: `<p>Pattern matching with tuple patterns is ideal for state machines (matching current state + event → next state), and property patterns excel at multi-field validation. Both produce declarative, maintainable code that reads like a specification.</p>`,
            code: `// STATE MACHINE with tuple pattern:
public record OrderState(Status Status, bool IsPaid, bool IsShipped);

public OrderState Transition(OrderState state, OrderEvent evt) =>
    (state.Status, evt) switch
    {
        (Status.Draft, OrderEvent.Submit)      => state with { Status = Status.Pending },
        (Status.Pending, OrderEvent.Approve)   => state with { Status = Status.Approved },
        (Status.Approved, OrderEvent.Pay)      => state with { Status = Status.Paid, IsPaid = true },
        (Status.Paid, OrderEvent.Ship)         => state with { Status = Status.Shipped, IsShipped = true },
        (Status.Shipped, OrderEvent.Deliver)   => state with { Status = Status.Delivered },
        (not Status.Delivered and not Status.Cancelled, OrderEvent.Cancel)
                                                => state with { Status = Status.Cancelled },
        _ => throw new InvalidStateTransitionException(state.Status, evt)
    };

// VALIDATION with property patterns:
public record CreateAccountRequest(string Email, string Password, int Age, string Country);

public IReadOnlyList<string> Validate(CreateAccountRequest req)
{
    var errors = new List<string>();
    
    // Each validation is a pattern match:
    _ = req switch
    {
        { Email: null or "" }              => errors.Add("Email required"),
        { Email.Length: > 255 }            => errors.Add("Email too long"),
        { Email: var e } when !e.Contains('@') => errors.Add("Invalid email"),
        _ => false
    };
    
    _ = req switch
    {
        { Password.Length: < 8 }           => errors.Add("Password min 8 chars"),
        { Password: var p } when p == req.Email => errors.Add("Password cannot equal email"),
        _ => false
    };
    
    _ = req switch
    {
        { Age: < 18 }                      => errors.Add("Must be 18+"),
        { Age: > 120 }                     => errors.Add("Invalid age"),
        _ => false
    };
    
    return errors;
}

// DISCRIMINATED UNION style (simulating with records):
public abstract record PaymentResult;
public record PaymentSuccess(string TransactionId, decimal Amount) : PaymentResult;
public record PaymentDeclined(string Reason) : PaymentResult;
public record PaymentError(Exception Ex) : PaymentResult;

public IActionResult HandlePayment(PaymentResult result) => result switch
{
    PaymentSuccess s    => Ok(new { s.TransactionId, s.Amount }),
    PaymentDeclined d   => BadRequest(new { d.Reason }),
    PaymentError { Ex: TimeoutException } => StatusCode(504),
    PaymentError e      => StatusCode(500, e.Ex.Message),
    _                   => throw new UnreachableException()
};`,
            language: 'csharp',
            bestPractices: [
                'Use tuple patterns for state machine transitions (state, event) → newState',
                'Model domain results as record hierarchies for type-safe pattern matching',
                'Keep each pattern arm focused on one concern (single responsibility)',
                'Use \'with\' expressions on records for immutable state transitions'
            ],
            commonMistakes: [
                'Making patterns too complex (extract conditions to well-named methods)',
                'Not considering pattern ordering (more specific must come before general)',
                'Forgetting that the compiler cannot verify exhaustiveness for open hierarchies',
                'Using exceptions for control flow instead of result types with patterns'
            ],
            interviewTip: 'The state machine example demonstrates two advanced concepts at once: tuple patterns for multi-value matching and records with \'with\' expressions for immutable state transitions. This shows you think about correctness and immutability together.',
            followUp: ['How do discriminated unions work in C# vs F#?', 'What are the limitations of exhaustiveness checking?', 'How does this compare to the State design pattern?'],
            seniorPerspective: 'I model all workflow transitions as tuple-pattern switch expressions. Adding a new state or event immediately shows compiler warnings at every switch that needs updating — impossible to miss a case.',
            architectPerspective: 'Pattern matching + records enables algebraic data types in C#. This is how we model complex domain logic (payment processing, compliance rules) in a way that\'s both compiler-verified and reviewable by business stakeholders.'
        },
        {
            question: 'What are records in C# and how do they interact with pattern matching?',
            difficulty: 'hard',
            answer: `<p>A <strong>record</strong> (C# 9) is a reference type (or <code>record struct</code> in C# 10) with compiler-generated <strong>value equality</strong>, <code>ToString</code>, a <code>Deconstruct</code> method (for positional records), and nondestructive mutation via <code>with</code>. These features make records ideal targets for positional and property patterns.</p>
            <ul>
                <li><strong>Value equality</strong> — two records are equal if all members are equal, not by reference.</li>
                <li><strong>with expressions</strong> — create a modified copy, leaving the original immutable.</li>
                <li><strong>Deconstruct</strong> — positional records auto-generate it, enabling positional patterns.</li>
            </ul>`,
            explanation: `A record is like a sealed envelope describing a fact (an event, a coordinate). Two envelopes with identical contents are considered the same, and to change one you photocopy it with edits rather than scribbling on the original.`,
            code: `// Positional record: auto Deconstruct, value equality, init-only props
public record Money(decimal Amount, string Currency);

var a = new Money(100m, "USD");
var b = new Money(100m, "USD");
Console.WriteLine(a == b);          // True -> value equality, not reference

// Nondestructive mutation
var discounted = a with { Amount = 90m }; // a unchanged, new instance

// Pattern matching shines because of the generated Deconstruct:
string Describe(Money m) => m switch
{
    (0, _)               => "free",
    ( < 0, _)            => "refund",
    (var amt, "USD") when amt > 1000 => "large USD payment",
    (_, var cur)         => cur + " payment"
};

// Records compose well with discriminated-union style hierarchies:
public abstract record Shape;
public record Circle(double Radius) : Shape;
public record Rectangle(double Width, double Height) : Shape;

double Area(Shape s) => s switch
{
    Circle(var r)            => Math.PI * r * r,
    Rectangle(var w, var h)  => w * h,
    _                        => throw new ArgumentException("unknown shape")
};

// record struct (C# 10) for small value types without heap allocation:
public readonly record struct Point(int X, int Y);`,
            language: 'csharp',
            bestPractices: [
                'Use records for immutable data: DTOs, domain events, value objects',
                'Use positional records to unlock concise positional patterns',
                'Use record struct for small value-like data to avoid heap allocation',
                'Use with expressions for immutable state transitions instead of mutation'
            ],
            commonMistakes: [
                'Adding mutable properties to records, defeating value-equality expectations',
                'Using records for entities with identity (equality should be by Id, not all fields)',
                'Forgetting that record equality includes every member, including collections by reference',
                'Assuming record (class) is allocation-free; only record struct avoids the heap'
            ],
            interviewTip: 'Tie records back to pattern matching: positional records generate Deconstruct, which is exactly what positional patterns consume. Mention that value equality on a mutable record is a footgun because the hash code can change after insertion into a dictionary.',
            followUp: ['What is the difference between record class and record struct?', 'Why is value equality dangerous for mutable records?', 'How do you customize record equality?'],
            seniorPerspective: `I default DTOs and domain events to records. The free value equality makes test assertions trivial and the with expression keeps state transitions immutable, which eliminates a whole class of aliasing bugs.`,
            architectPerspective: `Records plus an abstract base form C#'s practical algebraic data types. Modeling commands and events as record hierarchies lets switch expressions act as exhaustive dispatch, giving compiler-verified handling of every case in event-sourced systems.`
        },
        {
            question: 'How does deconstruction work in C#, and how is it used by positional patterns?',
            difficulty: 'medium',
            answer: `<p><strong>Deconstruction</strong> splits an object into its component parts via a <code>Deconstruct</code> method (or tuple). Any type with a <code>Deconstruct(out ...)</code> method — instance or extension — can be deconstructed, and <strong>positional patterns</strong> in a switch use that exact method to match components.</p>`,
            explanation: `Deconstruction is unpacking a box into its labeled parts. Positional patterns then check each part against a template, like a customs officer verifying each item in the unpacked box.`,
            code: `// 1. Tuples deconstruct natively
var (id, name) = GetUser(); // id and name are separate variables

// 2. Any class can opt in with a Deconstruct method
public class Temperature
{
    public double Celsius { get; }
    public Temperature(double c) => Celsius = c;
    public void Deconstruct(out double celsius, out double fahrenheit)
    {
        celsius = Celsius;
        fahrenheit = Celsius * 9 / 5 + 32;
    }
}

var (c, f) = new Temperature(20); // c = 20, f = 68

// 3. Extension method Deconstruct works for types you do not own
public static class DateTimeExtensions
{
    public static void Deconstruct(this DateTime dt, out int year, out int month, out int day)
        => (year, month, day) = (dt.Year, dt.Month, dt.Day);
}
var (yr, mo, dy) = DateTime.Now;

// 4. Positional patterns USE Deconstruct to match
string Classify(Temperature t) => t switch
{
    ( < 0, _)        => "freezing",
    ( >= 0 and < 25, _) => "comfortable",
    var (cel, _)     => cel + "C is hot"
};

// Discards ignore parts you do not care about:
var (_, fahrenheit) = new Temperature(100);`,
            language: 'csharp',
            bestPractices: [
                'Provide Deconstruct on value-like types to enable positional patterns',
                'Use discards (_) to ignore components you do not need',
                'Use extension Deconstruct for framework types you cannot modify',
                'Keep Deconstruct outputs intuitive and stable; patterns depend on the order'
            ],
            commonMistakes: [
                'Reordering Deconstruct parameters, silently breaking positional patterns',
                'Overloading Deconstruct ambiguously so the compiler cannot pick one',
                'Confusing deconstruction (out parameters) with tuple return types',
                'Expecting deconstruction to deep-copy; it just projects existing values'
            ],
            interviewTip: 'Make the connection explicit: positional patterns are syntactic sugar over a Deconstruct call. If a type has no Deconstruct (and is not a tuple), positional patterns will not compile against it.',
            followUp: ['Can a type have multiple Deconstruct overloads?', 'How do positional and property patterns differ?', 'How does deconstruction relate to tuples?'],
            seniorPerspective: `I add Deconstruct to value objects so they read naturally in switch expressions. It keeps domain logic declarative and avoids a sprawl of property accessors in conditional code.`,
            architectPerspective: `Deconstruction decouples a type's internal shape from how callers consume it. Combined with positional patterns it forms a stable, intention-revealing contract for matching domain values across layers.`
        },
        {
            question: 'How does the compiler lower switch expressions, and what are the performance characteristics versus if-else chains?',
            difficulty: 'advanced',
            answer: `<p>The compiler lowers a switch expression into an optimized <strong>decision tree (DAG)</strong>, not a naive sequence of checks. For constant or enum patterns it can emit a <strong>jump table</strong> (O(1) dispatch); for type patterns it groups checks to avoid redundant <code>isinst</code> tests. This often beats a hand-written if-else chain, which evaluates conditions strictly top to bottom.</p>`,
            explanation: `An if-else chain is like asking a yes/no question for every door in a hallway one by one. The compiler instead builds a flowchart that shares common questions and can jump straight to the right door.`,
            code: `// Switch expression over an enum -> compiler may emit a jump table
decimal Rate(Tier tier) => tier switch
{
    Tier.Free     => 0m,
    Tier.Standard => 9.99m,
    Tier.Pro      => 29.99m,
    Tier.Enterprise => 99.99m,
    _ => throw new ArgumentOutOfRangeException(nameof(tier))
};
// Lowered to a switch IL instruction (jump table) -> O(1) dispatch

// Type-pattern switch: compiler shares the isinst checks intelligently
double Area(Shape s) => s switch
{
    Circle c    => Math.PI * c.Radius * c.Radius,
    Square sq   => sq.Side * sq.Side,
    Rectangle r => r.Width * r.Height,
    _           => 0
};
// Each type is tested once; the tree avoids re-testing already-eliminated types

// Ordering matters for correctness AND speed with relational patterns:
string Band(int score) => score switch
{
    >= 90 => "A",   // tested in a balanced fashion, not always sequentially
    >= 80 => "B",
    >= 70 => "C",
    _     => "F"
};

// Exhaustiveness: the compiler proves coverage and warns on gaps,
// something an if-else chain can never verify.`,
            language: 'csharp',
            bestPractices: [
                'Prefer switch expressions for dense enum/constant dispatch to enable jump tables',
                'Order relational arms logically; the compiler still requires non-overlapping intent',
                'Rely on exhaustiveness warnings rather than a catch-all that hides missing cases',
                'Benchmark with BenchmarkDotNet before micro-optimizing hot dispatch paths'
            ],
            commonMistakes: [
                'Assuming switch expressions always evaluate arms strictly top to bottom',
                'Believing a long if-else chain is automatically as fast as a switch',
                'Adding a premature _ default that suppresses useful exhaustiveness warnings',
                'Putting expensive when-guards early, forcing evaluation on every input'
            ],
            interviewTip: 'Mention the IL switch instruction (jump table) for contiguous constants and enums. Distinguish that from sparse or type-based patterns, where the compiler builds a balanced decision tree rather than a table.',
            followUp: ['When can the compiler emit a jump table versus a decision tree?', 'How do when-guards affect lowering?', 'How does exhaustiveness checking work for enums and sealed hierarchies?'],
            seniorPerspective: `I rarely worry about switch performance for business logic, but for hot dispatch (parsers, opcode loops) I verify the lowering with BenchmarkDotNet. Dense enum switches reliably compile to jump tables.`,
            architectPerspective: `Decision-tree lowering means declarative pattern code does not cost readability for speed. That lets us encode dispatch-heavy logic (protocol handlers, rule engines) clearly while trusting the compiler to generate efficient branching.`
        },
        {
            question: 'Compare switch expressions to traditional switch statements. When does each one shine, and what can switch expressions do that statements cannot (and vice versa)?',
            difficulty: 'hard',
            answer: `<p><strong>Switch expressions</strong> (C# 8+) are <em>expressions</em> that return a value, making them ideal for assignments and returns. They enforce exhaustiveness (compiler warns on unhandled cases) and support all pattern types (type, property, relational, list). <strong>Switch statements</strong> are <em>statements</em> that execute code blocks, support fall-through (goto case), and can contain arbitrary imperative logic.</p>
            <p>Switch expressions excel at: (1) mapping inputs to outputs (pure transformations), (2) deconstructing complex objects with nested patterns, (3) enforcing exhaustiveness for safety. Switch statements excel at: (1) multi-line logic per case with side effects, (2) fall-through behavior, (3) cases that need to break/continue/return from an outer loop.</p>
            <p>Key limitation: switch expressions cannot contain statements — no variable declarations, no try/catch, no loops inside arms. Each arm must be a single expression. For complex per-case logic, the switch statement remains appropriate.</p>`,
            explanation: 'A switch expression is like a lookup table — "given this input, here is the output." A switch statement is like a choose-your-own-adventure book — "given this input, go execute this chapter of code." Use the table when you need an answer; use the adventure when you need actions.',
            code: `// SWITCH EXPRESSION — returns a value, exhaustive, concise
string GetSeverity(LogLevel level) => level switch
{
    LogLevel.Trace or LogLevel.Debug => "low",
    LogLevel.Information => "medium",
    LogLevel.Warning => "elevated",
    LogLevel.Error or LogLevel.Critical => "high",
    _ => throw new ArgumentOutOfRangeException(nameof(level))
};

// Nested property patterns — impossible with traditional switch:
decimal CalculateShipping(Order order) => order switch
{
    { Weight: < 1, Destination.Country: "US" } => 4.99m,
    { Weight: < 5, IsPrime: true } => 0m,
    { Weight: >= 50 } => order.Weight * 0.5m,
    _ => 9.99m
};

// SWITCH STATEMENT — needed for side effects, multi-line logic:
switch (command)
{
    case "save":
        ValidateState();
        await _repo.SaveAsync(entity);
        _logger.LogInformation("Saved {Id}", entity.Id);
        NotifyListeners(entity);
        break;
    case "delete":
        if (!CanDelete(entity))
            throw new InvalidOperationException("Cannot delete");
        await _repo.DeleteAsync(entity.Id);
        break;
    case "archive":
        goto case "save"; // Fall-through — not possible in expressions!
}

// SWITCH EXPRESSION CANNOT DO:
// - Variable declarations inside arms
// - try/catch per arm
// - goto case (fall-through)
// - Imperative multi-statement logic
// Use helper methods to work around:
string result = input switch
{
    "complex" => HandleComplex(input), // delegate to a method
    "simple" => input.ToUpper(),
    _ => "default"
};`,
            language: 'csharp',
            bestPractices: [
                'Use switch expressions for pure mappings (input → output) to get exhaustiveness checking',
                'Use switch statements when arms need side effects, multi-line logic, or fall-through',
                'Extract complex arm logic into helper methods to keep switch expressions readable',
                'Leverage the discard pattern (_) deliberately — prefer exhaustive enums without it when possible',
                'Combine relational and property patterns for expressive business rules in switch expressions'
            ],
            commonMistakes: [
                'Forcing complex imperative logic into switch expression arms (hurts readability)',
                'Using switch statements for simple value mappings where an expression is cleaner',
                'Adding a _ discard to suppress exhaustiveness warnings without considering future enum values',
                'Nesting switch expressions too deeply (extract methods for readability)'
            ],
            interviewTip: 'Distinguish expression (returns value, exhaustive, pattern-rich) from statement (executes blocks, fall-through, imperative). Show you choose based on whether the switch maps or acts.',
            followUp: ['How does exhaustiveness checking work with sealed hierarchies?', 'Can you use when guards in switch expressions?', 'What is the performance difference between switch expressions and if-else chains?']
        },
        {
            question: 'When does pattern matching hurt readability? Give examples of overuse and explain how to recognize when simpler constructs are better.',
            difficulty: 'hard',
            answer: `<p>Pattern matching becomes harmful when: (1) <strong>nested patterns are too deep</strong> — more than 2-3 levels of property/positional nesting makes the arm unreadable without careful formatting; (2) <strong>patterns encode business rules that should be methods</strong> — a complex when guard with 4+ conditions is better as a named predicate method; (3) <strong>patterns are used for simple null/type checks</strong> where <code>is null</code> or <code>as</code> + null check is more idiomatic and familiar; (4) <strong>the exhaustive matching is forced onto open types</strong> where a dictionary lookup or strategy pattern is more maintainable.</p>
            <p>The readability threshold: if a colleague needs more than 5 seconds to understand what a pattern arm matches, refactor. Named predicate methods, extracted variables, or a simple if-else may communicate intent better than a clever pattern.</p>`,
            explanation: 'Pattern matching is like a Swiss Army knife — great for many tasks, but using the corkscrew to open a soda can (when you have a can opener) is showing off, not solving the problem.',
            code: `// OVERUSE 1: Deeply nested patterns (unreadable)
var result = transaction switch
{
    { Account: { Owner: { Address: { Country: "US", State: var s } } },
      Amount: > 10000, Type: TransactionType.Wire } when s is "NY" or "CA"
        => ApplyRegulatedRate(transaction),
    _ => ApplyStandardRate(transaction)
};
// BETTER: Extract named predicates
var result = transaction switch
{
    var t when IsRegulatedWireTransfer(t) => ApplyRegulatedRate(t),
    _ => ApplyStandardRate(transaction)
};
bool IsRegulatedWireTransfer(Transaction t) =>
    t.Amount > 10000
    && t.Type == TransactionType.Wire
    && t.Account.Owner.Address.Country == "US"
    && t.Account.Owner.Address.State is "NY" or "CA";

// OVERUSE 2: Pattern for a simple null check
// Overly clever:
if (user is { Name: not null and var name, Age: >= 18 }) { }
// More readable for simple cases:
if (user != null && user.Name != null && user.Age >= 18) { }

// OVERUSE 3: Strategy that should be a dictionary/DI
decimal Apply(string discountCode) => discountCode switch
{
    "SUMMER2024" => 0.2m,
    "VIP" => 0.3m,
    "EMPLOYEE" => 0.5m,
    // 50 more cases...
    _ => 0m
};
// BETTER: data-driven lookup
private static readonly Dictionary<string, decimal> _discounts = new()
{
    ["SUMMER2024"] = 0.2m, ["VIP"] = 0.3m, ["EMPLOYEE"] = 0.5m
};
decimal Apply(string code) =>
    _discounts.GetValueOrDefault(code, 0m);

// GOOD USE — patterns are the right tool here:
string Classify(Shape shape) => shape switch
{
    Circle { Radius: 0 } => "point",
    Circle { Radius: < 5 } => "small circle",
    Rectangle { Width: var w, Height: var h } when w == h => "square",
    _ => "shape"
};`,
            language: 'csharp',
            bestPractices: [
                'Limit nesting to 2 levels of property patterns — extract predicates beyond that',
                'Use named methods for complex when guards to make business rules self-documenting',
                'Prefer dictionary lookups over large switch expressions for data-driven mappings',
                'Reserve pattern matching for structural decomposition and type discrimination',
                'Format multi-line patterns with clear indentation and one condition per line'
            ],
            commonMistakes: [
                'Using patterns to "show off" language features instead of communicating intent',
                'Deeply nested property patterns that require horizontal scrolling to read',
                'Encoding business rules in patterns that will change frequently (prefer configuration)',
                'Using pattern matching for simple equality checks where == is clearer'
            ],
            interviewTip: 'This question tests judgment, not knowledge. Show you know WHEN to use patterns (type discrimination, structural decomposition) and when NOT to (simple checks, data-driven lookups, deeply nested conditions). Mention the "5-second rule" for arm readability.',
            followUp: ['How do you refactor a large switch expression that has grown unwieldy?', 'When would the Strategy pattern be better than pattern matching?', 'How does team familiarity factor into pattern matching decisions?']
        },
        {
            question: 'How do sealed record hierarchies enable exhaustive switch expressions that simulate algebraic data types in C#? Show how the compiler verifies exhaustiveness.',
            difficulty: 'advanced',
            answer: `<p>A sealed abstract record with a fixed set of derived records creates a closed type hierarchy (discriminated union). When you switch on the base type, the compiler knows ALL possible subtypes because the sealed modifier prevents external derivation. If your switch arms cover every subtype, the compiler can verify exhaustiveness at compile time — no discard (_) pattern needed, and adding a new subtype causes compile errors at every switch that doesn\'t handle it.</p>
            <p>This simulates algebraic data types (sum types) from functional languages like F# or Rust. The pattern: define a sealed abstract record as the "union", derive specific cases as records, then use switch expressions with type patterns. The compiler guarantees you handle every case, making illegal states unrepresentable and refactoring safe — add a new case and the compiler shows you every place that needs updating.</p>
            <p>The key advantage over enums: each case can carry different data (like Result<T> having Success with a value OR Failure with an error), whereas enums are just named integers with no associated data.</p>`,
            explanation: 'A sealed hierarchy is like a form with exactly 3 checkbox options where the rules say you MUST check one. The compiler is the auditor who rejects your form if you did not account for every option. Add a 4th checkbox, and every incomplete form gets flagged.',
            code: `// Discriminated union via sealed records
public abstract record Shape;
public sealed record Circle(double Radius) : Shape;
public sealed record Rectangle(double Width, double Height) : Shape;
public sealed record Triangle(double Base, double Height) : Shape;

// Exhaustive switch — compiler verifies all cases covered
public double Area(Shape shape) => shape switch
{
    Circle c => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.Width * r.Height,
    Triangle t => 0.5 * t.Base * t.Height,
    // No _ needed! Compiler knows these are ALL the cases.
    // Adding "record Pentagon : Shape" causes compile error HERE.
};

// Real-world: Result type (functional error handling)
public abstract record Result<T>;
public sealed record Success<T>(T Value) : Result<T>;
public sealed record Failure<T>(string Error, Exception? Ex = null) : Result<T>;

public string HandleResult(Result<Order> result) => result switch
{
    Success<Order> { Value: var order } => $"Order {order.Id} placed",
    Failure<Order> { Error: var msg } => $"Failed: {msg}",
    // Exhaustive — no discard pattern, no runtime surprises
};

// Command pattern with exhaustive handling
public abstract record Command;
public sealed record CreateUser(string Name, string Email) : Command;
public sealed record DeleteUser(Guid Id) : Command;
public sealed record UpdateEmail(Guid Id, string NewEmail) : Command;

public async Task Handle(Command cmd) {
    switch (cmd) { // Adding a new Command forces handling here
        case CreateUser c: await CreateAsync(c); break;
        case DeleteUser d: await DeleteAsync(d); break;
        case UpdateEmail u: await UpdateAsync(u); break;
    }
}`,
            language: 'csharp',
            bestPractices: [
                'Use sealed abstract records for closed hierarchies where all cases are known at compile time',
                'Avoid the _ discard in exhaustive switches — let the compiler enforce completeness',
                'Use this pattern for domain commands, events, and Result<T>/Option<T> types',
                'Keep the hierarchy in one file or assembly to maintain the sealed guarantee',
                'Combine with required properties for self-documenting case data'
            ],
            commonMistakes: [
                'Forgetting to seal the derived records (external code could add subtypes, breaking exhaustiveness)',
                'Adding a default/discard arm "just in case" — this defeats the purpose of compile-time exhaustiveness',
                'Using this pattern for open hierarchies where new cases are expected from plugins or extensions',
                'Nesting too many levels of sealed hierarchies (becomes hard to navigate)'
            ],
            interviewTip: 'Compare to F# discriminated unions explicitly — show you understand this is C# emulating algebraic data types. The key selling point is: "add a new case, get compile errors everywhere it is not handled." This is the type-safety argument that resonates with interviewers.',
            followUp: ['How does this compare to the Visitor pattern for exhaustive handling?', 'What are the limitations of C# sealed hierarchies vs true sum types in F#/Rust?', 'Can you use this pattern with interfaces instead of records?']
        },
        {
            question: 'What are recursive patterns and list patterns (C# 11+)? Show how to match nested structures and array slicing. When do they improve vs hurt readability?',
            difficulty: 'hard',
            answer: `<p><strong>Recursive patterns</strong> allow matching nested properties at arbitrary depth in a single pattern expression: you can test a property of a property of a property without intermediate variables. <strong>List patterns</strong> (C# 11) enable matching against array/list structure using [first, second, ..rest] syntax — similar to destructuring in functional languages, with support for slicing (..), exact length matching, and discard (_) elements.</p>
            <p>They improve readability when: matching known-structure data like JSON tokens, command arguments, or protocol messages where the shape IS the logic. They hurt readability when: nesting exceeds 2-3 levels (the pattern becomes wider than the screen), when business rules are encoded in patterns rather than named methods (loses self-documentation), or when applied to problems better solved by iteration (e.g., using list patterns to parse variable-length input).</p>
            <p>The general guideline: list patterns excel for fixed-structure decomposition (command args, known-format arrays), while recursive property patterns excel for type+state discrimination. If you need to explain what the pattern matches in a comment, it is too complex — extract a named predicate.</p>`,
            explanation: 'Recursive patterns are like Russian nesting dolls — you can describe what is inside each layer in one expression. List patterns are like template matching on a sequence — "starts with X, ends with Y, something in between." Both are powerful tools that become unreadable when overused.',
            code: `// RECURSIVE PATTERNS — matching nested properties
var discount = customer switch
{
    { Tier: "Gold", Address: { Country: "US" } } => 0.20m,
    { Tier: "Gold" } => 0.15m,
    { Orders: { Count: > 100 } } => 0.10m, // nested Count check
    _ => 0m
};

// LIST PATTERNS (C# 11) — structural array matching
int[] numbers = { 1, 2, 3, 4, 5 };

var result = numbers switch
{
    [1, 2, .. var rest] => $"Starts with 1,2 then {rest.Length} more",
    [_, _, 3, ..] => "Third element is 3",
    [var only] => $"Single element: {only}",
    [] => "Empty array",
    [.., var last] => $"Last element: {last}",
};

// PRACTICAL: Command-line argument parsing
string[] args = { "--verbose", "--output", "file.txt" };
var config = args switch
{
    ["--help"] => new Config(ShowHelp: true),
    ["--verbose", "--output", var file] => new Config(Verbose: true, Output: file),
    ["--output", var file] => new Config(Output: file),
    [var unknown, ..] => throw new ArgumentException($"Unknown: {unknown}"),
    [] => new Config() // defaults
};

// WHEN IT HURTS READABILITY (too complex):
var x = data switch
{
    { Header: { Version: > 2, Flags: { IsCompressed: true } },
      Body: { Chunks: [{ Size: > 1024 }, ..] } } => "complex!",
    // BETTER: extract named predicates
    var d when IsLargeCompressedV3(d) => "clear!",
};`,
            language: 'csharp',
            bestPractices: [
                'Use list patterns for fixed-structure inputs (CLI args, protocol headers, known-format arrays)',
                'Limit recursive pattern depth to 2 levels — extract predicates beyond that',
                'Combine .. slice with var to capture remaining elements for further processing',
                'Use list patterns in validation: [_, _, ..] ensures at least 2 elements',
                'Format complex patterns across multiple lines with clear alignment'
            ],
            commonMistakes: [
                'Using list patterns for variable-length parsing better handled by a loop or parser',
                'Nesting recursive patterns beyond readability (3+ levels deep requires comments to understand)',
                'Forgetting that list patterns require indexable/countable types (arrays, List<T>, not IEnumerable)',
                'Over-relying on .. slice without checking what it captured (could be empty)'
            ],
            interviewTip: 'Show one clean list pattern example (CLI args or protocol matching) and one overuse example. The interviewer wants to see judgment — knowing the feature AND knowing when NOT to use it. Mention the readability threshold: if it needs a comment explaining what it matches, refactor.',
            followUp: ['What types support list patterns (what interfaces must they implement)?', 'How do list patterns interact with Span<T>?', 'Can you use list patterns with recursive property patterns together?']
        }
    ]
});
