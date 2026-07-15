PageData.register('fluent-validation', {
    title: 'FluentValidation',
    description: 'Strongly-typed validation rules for .NET using a fluent interface. Covers AbstractValidator, built-in rules, custom validators, async validation, and pipeline integration with MediatR.',
    sections: [
        {
            title: 'Introduction',
            content: `<p>FluentValidation is the most popular validation library for .NET. It replaces Data Annotations with strongly-typed, testable validation rules using a fluent builder syntax. Instead of scattering [Required] and [MaxLength] attributes across models, you define dedicated validator classes with full access to C# logic.</p>
<p>In interviews, FluentValidation questions test your ability to write maintainable validation logic, integrate it with ASP.NET Core pipelines, handle complex cross-property rules, and unit test validators independently.</p>`
        },
        {
            title: 'Core Concepts',
            content: `<p>FluentValidation architecture:</p>
<ul>
<li><strong>AbstractValidator&lt;T&gt;</strong> — Base class for all validators. Define rules in the constructor.</li>
<li><strong>RuleFor()</strong> — Targets a single property with one or more chained validators</li>
<li><strong>Built-in validators</strong> — NotEmpty, MaxLength, EmailAddress, GreaterThan, InclusiveBetween, Matches (regex), etc.</li>
<li><strong>Custom validators</strong> — Must() for inline predicates, Custom() for complex logic, AbstractValidator inheritance for reusable rules</li>
<li><strong>Severity levels</strong> — Error (default), Warning, Info — control response behavior</li>
<li><strong>Cascade mode</strong> — Stop or Continue validation after first failure per rule chain</li>
<li><strong>RuleSets</strong> — Group rules that apply only in specific contexts (e.g., Create vs Update)</li>
</ul>`,
            mermaid: `flowchart TD
    A[Request DTO arrives] --> B[ASP.NET Model Binding]
    B --> C[FluentValidation Filter]
    C --> D{Validator exists?}
    D -->|Yes| E[Execute RuleFor chains]
    D -->|No| F[Pass through]
    E --> G{All rules pass?}
    G -->|Yes| F[Continue to Controller/Handler]
    G -->|No| H[Return 400 + ValidationProblemDetails]`
        },
        {
            title: 'Implementation',
            content: `<p>Complete FluentValidation examples from basic to advanced:</p>`,
            code: `// ═══ Basic Validator ═══
using FluentValidation;

public class CreateOrderRequest
{
    public string CustomerEmail { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public List<OrderLineItem> Items { get; set; }
}

public class CreateOrderValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerEmail)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Must be a valid email")
            .MaximumLength(255);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be positive")
            .LessThanOrEqualTo(100_000).WithMessage("Amount exceeds maximum");

        RuleFor(x => x.Currency)
            .NotEmpty()
            .Must(c => new[] { "USD", "EUR", "GBP" }.Contains(c))
            .WithMessage("Currency must be USD, EUR, or GBP");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Order must have at least one item");

        // Validate each item in the collection
        RuleForEach(x => x.Items)
            .SetValidator(new OrderLineItemValidator());
    }
}

// ═══ Cross-Property Validation ═══
public class DateRangeValidator : AbstractValidator<DateRangeRequest>
{
    public DateRangeValidator()
    {
        RuleFor(x => x.StartDate)
            .NotEmpty()
            .LessThan(x => x.EndDate)
            .WithMessage("Start date must be before end date");

        RuleFor(x => x.EndDate)
            .NotEmpty()
            .GreaterThan(x => x.StartDate)
            .Must(end => end <= DateTime.UtcNow.AddYears(1))
            .WithMessage("End date cannot be more than 1 year in the future");
    }
}

// ═══ Async Validation (database check) ═══
public class RegisterUserValidator : AbstractValidator<RegisterUserRequest>
{
    private readonly IUserRepository _userRepo;

    public RegisterUserValidator(IUserRepository userRepo)
    {
        _userRepo = userRepo;

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MustAsync(BeUniqueEmail)
            .WithMessage("Email is already registered");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Must contain uppercase letter")
            .Matches("[a-z]").WithMessage("Must contain lowercase letter")
            .Matches("[0-9]").WithMessage("Must contain a digit")
            .Matches("[^a-zA-Z0-9]").WithMessage("Must contain a special character");
    }

    private async Task<bool> BeUniqueEmail(string email, CancellationToken ct)
    {
        return !await _userRepo.ExistsAsync(email, ct);
    }
}

// ═══ ASP.NET Core Registration ═══
// Program.cs
builder.Services.AddValidatorsFromAssemblyContaining<CreateOrderValidator>();
// Automatic validation via FluentValidation.AspNetCore:
builder.Services.AddFluentValidationAutoValidation();

// ═══ MediatR Pipeline Behavior ═══
public class ValidationBehavior<TRequest, TResponse> 
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        => _validators = validators;

    public async Task<TResponse> Handle(TRequest request,
        RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (!_validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = (await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, ct))))
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Any())
            throw new ValidationException(failures);

        return await next();
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Testing Validators',
            content: `<p>FluentValidation provides a test helper for clean validator unit tests:</p>`,
            code: `using FluentValidation.TestHelper;
using Xunit;

public class CreateOrderValidatorTests
{
    private readonly CreateOrderValidator _validator = new();

    [Fact]
    public void Should_have_error_when_email_is_empty()
    {
        var model = new CreateOrderRequest { CustomerEmail = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.CustomerEmail)
              .WithErrorMessage("Email is required");
    }

    [Fact]
    public void Should_not_have_error_when_email_is_valid()
    {
        var model = new CreateOrderRequest { CustomerEmail = "test@example.com" };
        var result = _validator.TestValidate(model);
        result.ShouldNotHaveValidationErrorFor(x => x.CustomerEmail);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Should_have_error_when_amount_is_not_positive(decimal amount)
    {
        var model = new CreateOrderRequest { Amount = amount };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Amount);
    }

    [Fact]
    public void Should_pass_for_valid_order()
    {
        var model = new CreateOrderRequest
        {
            CustomerEmail = "user@test.com",
            Amount = 99.99m,
            Currency = "USD",
            Items = new() { new OrderLineItem { ProductId = 1, Quantity = 2 } }
        };
        var result = _validator.TestValidate(model);
        result.ShouldNotHaveAnyValidationErrors();
    }
}`,
            language: 'csharp'
        },
        {
            title: 'Best Practices',
            content: `<ul>
<li><strong>One validator per request/command</strong> — CreateOrderValidator, UpdateOrderValidator. Never one mega-validator.</li>
<li><strong>Use CascadeMode.Stop</strong> — Avoid running expensive rules (async DB checks) if cheap rules already failed</li>
<li><strong>Inject dependencies</strong> — Validators support constructor DI; use for async uniqueness checks, permission checks</li>
<li><strong>Test validators independently</strong> — Use TestValidate() helper; validators are pure logic, easy to unit test</li>
<li><strong>Prefer explicit messages</strong> — .WithMessage() on every rule; default messages are too generic for APIs</li>
<li><strong>Use RuleSets sparingly</strong> — Prefer separate validator classes (CreateXValidator, UpdateXValidator) over RuleSets</li>
<li><strong>Validate at the boundary</strong> — API input validation only. Domain validation belongs in domain entities.</li>
<li><strong>Keep validators fast</strong> — Avoid heavy DB queries in validators; validate format/range, not business rules</li>
</ul>`
        },
        {
            title: 'Common Mistakes',
            content: `<ul>
<li><strong>Mixing validation and business rules</strong> — "Order total must not exceed credit limit" is a business rule, not input validation. Keep it in domain services.</li>
<li><strong>Async in sync path</strong> — Using MustAsync but not awaiting properly in manual validation calls. Always use ValidateAsync().</li>
<li><strong>Not registering validators</strong> — Forgetting AddValidatorsFromAssembly(); validators silently do nothing.</li>
<li><strong>Over-validating</strong> — Validating fields that the API consumer cannot control (internal IDs, computed fields).</li>
<li><strong>Duplicate validation</strong> — Same rules in validator AND Data Annotations on the model. Pick one approach.</li>
<li><strong>Swallowing ValidationException</strong> — Not mapping it to proper ProblemDetails/400 response in middleware.</li>
<li><strong>Testing only happy path</strong> — Validators need boundary tests: null, empty, max+1, min-1, special characters.</li>
</ul>`
        },
        {
            title: 'Comparison',
            content: `<p>FluentValidation vs Data Annotations vs manual validation:</p>`,
            table: {
                headers: ['Aspect', 'FluentValidation', 'Data Annotations', 'Manual (if statements)'],
                rows: [
                    ['Testability', 'Excellent (dedicated test helpers)', 'Requires ModelState setup', 'Good (but verbose)'],
                    ['Complex rules', 'Easy (cross-property, async, conditional)', 'Limited (IValidatableObject hack)', 'Easy but messy'],
                    ['DI support', 'Full (inject services)', 'None', 'Full'],
                    ['Reusability', 'SetValidator for composition', 'Custom attributes', 'Extract methods'],
                    ['Separation', 'Separate class from model', 'Coupled to model', 'Scattered in handlers'],
                    ['Performance', 'Good (expression-compiled)', 'Good (reflection-cached)', 'Best (direct code)'],
                    ['Learning curve', 'Medium', 'Low', 'None']
                ]
            }
        },
        {
            title: 'Interview Tips',
            callout: {
                type: 'tip',
                title: 'What Interviewers Look For',
                text: `<ul>
<li><strong>Why not Data Annotations?</strong> — Separation of concerns, testability, complex cross-property rules, DI support</li>
<li><strong>Pipeline integration</strong> — Can you explain the MediatR ValidationBehavior pattern?</li>
<li><strong>Testing approach</strong> — Do you test validators? How? (TestValidate helper, boundary conditions)</li>
<li><strong>Domain vs input validation</strong> — Where does FluentValidation stop and domain logic begin?</li>
<li><strong>Performance awareness</strong> — Async validators, CascadeMode, avoiding N+1 in RuleForEach</li>
</ul>`
            }
        }
    ],
    questions: [
        {
            id: 'fv-q1',
            level: 'junior',
            title: 'Why use FluentValidation instead of Data Annotations?',
            answer: `<p>FluentValidation advantages over Data Annotations:</p>
<ul>
<li><strong>Separation of concerns</strong> — Validation logic lives in its own class, not cluttering the model with attributes</li>
<li><strong>Testability</strong> — Validators are plain C# classes with built-in test helpers; no ModelState mocking needed</li>
<li><strong>Complex rules</strong> — Cross-property validation ("end date must be after start date"), conditional rules (When/Unless), async DB checks</li>
<li><strong>Dependency injection</strong> — Validators can inject repositories, configuration, etc. Data Annotations cannot.</li>
<li><strong>Composability</strong> — Reuse validators via SetValidator() for nested objects and collections</li>
<li><strong>Better error messages</strong> — Full control over message text, property name, error code per rule</li>
</ul>
<p>Data Annotations are fine for simple models (string length, required fields). FluentValidation shines when validation is a first-class concern.</p>`
        },
        {
            id: 'fv-q2',
            level: 'junior',
            title: 'How do you validate a collection of items in FluentValidation?',
            answer: `<p>Use <code>RuleForEach()</code> to apply rules to each element in a collection:</p>
<pre><code>public class OrderValidator : AbstractValidator&lt;Order&gt;
{
    public OrderValidator()
    {
        // Validate the collection itself
        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Must have at least one item");

        // Validate each item individually
        RuleForEach(x => x.Items)
            .SetValidator(new OrderItemValidator());
    }
}

public class OrderItemValidator : AbstractValidator&lt;OrderItem&gt;
{
    public OrderItemValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0);
        RuleFor(x => x.Quantity).InclusiveBetween(1, 999);
        RuleFor(x => x.UnitPrice).GreaterThan(0);
    }
}</code></pre>
<p>Error messages include the index: "Items[2].Quantity must be between 1 and 999."</p>`
        },
        {
            id: 'fv-q3',
            level: 'mid',
            title: 'How do you implement conditional validation rules?',
            answer: `<p>FluentValidation provides When/Unless for conditional rules:</p>
<pre><code>public class PaymentValidator : AbstractValidator&lt;PaymentRequest&gt;
{
    public PaymentValidator()
    {
        // Only validate card number if payment method is card
        When(x => x.PaymentMethod == "card", () =>
        {
            RuleFor(x => x.CardNumber)
                .NotEmpty()
                .CreditCard();
            RuleFor(x => x.CVV)
                .NotEmpty()
                .Length(3, 4);
            RuleFor(x => x.ExpiryDate)
                .NotEmpty()
                .Must(BeInFuture)
                .WithMessage("Card is expired");
        });

        // Only validate bank details if method is bank transfer
        When(x => x.PaymentMethod == "bank", () =>
        {
            RuleFor(x => x.AccountNumber).NotEmpty();
            RuleFor(x => x.RoutingNumber).NotEmpty().Length(9);
        });

        // Unless = inverse condition
        Unless(x => x.IsGuest, () =>
        {
            RuleFor(x => x.CustomerId).GreaterThan(0);
        });
    }
}</code></pre>
<p>When/Unless prevent rules from even executing when the condition is false — more efficient than Must() with a predicate that always runs.</p>`
        },
        {
            id: 'fv-q4',
            level: 'mid',
            title: 'How do you integrate FluentValidation with MediatR pipeline?',
            answer: `<p>The standard pattern is a <strong>ValidationBehavior</strong> that runs before every handler:</p>
<ol>
<li>Register all validators: <code>services.AddValidatorsFromAssembly(typeof(Program).Assembly)</code></li>
<li>Register the pipeline behavior: <code>services.AddTransient(typeof(IPipelineBehavior&lt;,&gt;), typeof(ValidationBehavior&lt;,&gt;))</code></li>
<li>The behavior collects all IValidator&lt;TRequest&gt; for the current request type</li>
<li>Runs all validators, collects failures</li>
<li>If failures exist, throws ValidationException (which middleware maps to 400)</li>
<li>If no failures, calls next() to proceed to the handler</li>
</ol>
<p>This means: every MediatR command/query is automatically validated before the handler executes. Zero manual Validate() calls in handlers.</p>
<p>Benefit: Handlers assume valid input — cleaner code, single responsibility.</p>`
        },
        {
            id: 'fv-q5',
            level: 'senior',
            title: 'How do you handle async validation without performance issues?',
            answer: `<p>Async validators (MustAsync) typically hit a database or external service. Performance considerations:</p>
<ul>
<li><strong>CascadeMode.Stop</strong> — Set at rule level so async rules only run if cheap sync rules pass first:</li>
</ul>
<pre><code>RuleFor(x => x.Email)
    .Cascade(CascadeMode.Stop) // Stop chain on first failure
    .NotEmpty()                // Cheap: runs first
    .EmailAddress()            // Cheap: runs second
    .MustAsync(BeUniqueEmail)  // Expensive: only if above pass
    .WithMessage("Email taken");</code></pre>
<ul>
<li><strong>Avoid N+1 in RuleForEach</strong> — If validating 50 items, do NOT make 50 DB calls. Batch-load outside the validator or use a custom validator that queries once.</li>
<li><strong>Always use ValidateAsync()</strong> — If ANY rule in the validator is async, you must call ValidateAsync, not Validate (which blocks).</li>
<li><strong>Cache expensive lookups</strong> — If the same validator runs multiple async checks against same data, cache the first result.</li>
<li><strong>Consider validation placement</strong> — Heavy DB validation might belong in the domain service, not the input validator.</li>
</ul>`
        },
        {
            id: 'fv-q6',
            level: 'senior',
            title: 'What is the difference between input validation and domain validation? Where does FluentValidation fit?',
            answer: `<p>Two distinct validation layers:</p>
<table>
<tr><th>Aspect</th><th>Input Validation (FluentValidation)</th><th>Domain Validation</th></tr>
<tr><td>Purpose</td><td>Reject malformed requests early</td><td>Enforce business invariants</td></tr>
<tr><td>Location</td><td>API boundary (controller/pipeline)</td><td>Domain entities/services</td></tr>
<tr><td>Examples</td><td>Email format, string length, required fields, numeric range</td><td>Insufficient balance, order exceeds credit limit, appointment conflicts</td></tr>
<tr><td>Response</td><td>400 Bad Request</td><td>422 Unprocessable Entity or domain exception</td></tr>
<tr><td>Dependencies</td><td>Minimal (format checks)</td><td>Repositories, domain services, aggregate state</td></tr>
<tr><td>Testing</td><td>Unit test validators in isolation</td><td>Test domain logic with domain test fixtures</td></tr>
</table>
<p>FluentValidation fits at the <strong>input validation</strong> layer. It should reject obviously bad data before it reaches domain logic. Domain validation happens inside aggregates/services where business state is available.</p>
<p>Anti-pattern: putting business rules in FluentValidation validators. This couples your validation layer to your entire domain model.</p>`
        },
        {
            id: 'fv-q7',
            level: 'mid',
            title: 'How do you return validation errors as ProblemDetails in ASP.NET Core?',
            answer: `<p>Two approaches to return RFC 7807 ProblemDetails from FluentValidation failures:</p>
<p><strong>Approach 1: Auto-validation (FluentValidation.AspNetCore)</strong></p>
<pre><code>// Automatically returns 400 with ValidationProblemDetails
builder.Services.AddFluentValidationAutoValidation();
// Customise the response:
builder.Services.Configure&lt;ApiBehaviorOptions&gt;(options =>
{
    options.InvalidModelStateResponseFactory = context =>
        new BadRequestObjectResult(new ValidationProblemDetails(
            context.ModelState));
});</code></pre>
<p><strong>Approach 2: Exception middleware (MediatR pipeline)</strong></p>
<pre><code>app.UseExceptionHandler(err => err.Run(async context =>
{
    var ex = context.Features.Get&lt;IExceptionHandlerFeature&gt;()?.Error;
    if (ex is ValidationException ve)
    {
        context.Response.StatusCode = 400;
        var problems = new ValidationProblemDetails(
            ve.Errors.GroupBy(e => e.PropertyName)
              .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()));
        await context.Response.WriteAsJsonAsync(problems);
    }
}));</code></pre>`
        },
        {
            id: 'fv-q8',
            level: 'architect',
            title: 'How would you design a validation strategy for a large enterprise application with 200+ validators?',
            answer: `<p>At scale, FluentValidation needs governance:</p>
<ul>
<li><strong>Assembly scanning</strong> — AddValidatorsFromAssembly per feature slice; never register manually</li>
<li><strong>Naming convention</strong> — {CommandName}Validator in same folder as command. Enforced by architecture test.</li>
<li><strong>Base validator</strong> — Create AbstractAppValidator&lt;T&gt; with shared rules (e.g., string trimming, common field patterns)</li>
<li><strong>Shared rule sets</strong> — Extract common patterns (PhoneNumber, PostalCode, MoneyAmount) as extension methods on IRuleBuilder</li>
<li><strong>Validation pipeline</strong> — Single ValidationBehavior in MediatR; all commands auto-validated</li>
<li><strong>Error code standards</strong> — .WithErrorCode("FIELD_REQUIRED") for machine-readable errors; not just human messages</li>
<li><strong>Localization</strong> — Use .WithMessage() with resource keys for multi-language support</li>
<li><strong>Architecture tests</strong> — ArchUnit/NetArchTest: "Every IRequest must have a corresponding IValidator"</li>
<li><strong>Performance guardrails</strong> — Lint rule: no MustAsync without CascadeMode.Stop preceding it</li>
<li><strong>Documentation</strong> — Auto-generate API validation docs from validator rules (custom Swagger filter)</li>
</ul>`
        }
    ]
});
