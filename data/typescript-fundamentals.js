'use strict';

PageData.register('typescript-fundamentals', {
    title: 'TypeScript Essentials',
    description: 'Type system mastery from generics to conditional types for building type-safe applications',
    sections: [
        {
            title: 'Type System Fundamentals',
            content: `<p>TypeScript adds static typing to JavaScript. Understanding the type system depth determines how effectively you use it.</p>
<ul>
<li><strong>Structural typing</strong> - Types are compatible based on shape, not name (duck typing).</li>
<li><strong>Type inference</strong> - TypeScript infers types from usage; explicit annotations are optional when inference is sufficient.</li>
<li><strong>Literal types</strong> - Values themselves can be types: <code>type Direction = 'north' | 'south'</code></li>
<li><strong>never vs void vs unknown</strong> - void for no return value, never for unreachable code, unknown for safe any.</li>
</ul>`
        },
        {
            title: 'Type System Hierarchy',
            mermaid: `graph TD
    A[unknown - top type] --> B[object]
    A --> C[string]
    A --> D[number]
    A --> E[boolean]
    A --> F[symbol]
    A --> G[bigint]
    B --> H[Array]
    B --> I[Function]
    B --> J[Record]
    C --> K[literal 'hello']
    D --> L[literal 42]
    E --> M[literal true]
    K --> N[never - bottom type]
    L --> N
    M --> N`,
            content: `<p>Every type is assignable to <code>unknown</code> (top type). <code>never</code> is assignable to every type (bottom type). This hierarchy drives type narrowing and conditional types.</p>`
        },
        {
            title: 'Generics and Constraints',
            code: `// Basic generic function
function identity<T>(value: T): T {
    return value;
}

// Generic with constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

// Generic class
class Repository<T extends { id: string }> {
    private items: Map<string, T> = new Map();
    
    add(item: T): void {
        this.items.set(item.id, item);
    }
    
    find(id: string): T | undefined {
        return this.items.get(id);
    }
}

// Default generic parameter
type ApiResponse<T = unknown> = {
    data: T;
    status: number;
    timestamp: Date;
};

// Generic constraint with interface
interface Serializable {
    serialize(): string;
}

function saveToStorage<T extends Serializable>(item: T): void {
    localStorage.setItem('data', item.serialize());
}`,
            language: 'typescript'
        },
        {
            title: 'Utility Types Deep Dive',
            code: `// Built-in utility types
interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    createdAt: Date;
}

// Partial - all properties optional
type UpdateUser = Partial<User>;

// Required - all properties required
type CompleteUser = Required<User>;

// Pick - select specific properties
type UserSummary = Pick<User, 'id' | 'name'>;

// Omit - exclude specific properties
type CreateUser = Omit<User, 'id' | 'createdAt'>;

// Record - construct object type
type UserRoles = Record<string, 'admin' | 'user' | 'guest'>;

// Readonly - immutable
type FrozenUser = Readonly<User>;

// Extract / Exclude - filter union types
type StringOrNumber = string | number | boolean;
type OnlyStrNum = Extract<StringOrNumber, string | number>; // string | number
type NoString = Exclude<StringOrNumber, string>; // number | boolean

// ReturnType / Parameters
function createUser(name: string, email: string): User {
    return {} as User;
}
type CreateParams = Parameters<typeof createUser>; // [string, string]
type CreateReturn = ReturnType<typeof createUser>; // User`,
            language: 'typescript'
        },
        {
            title: 'Discriminated Unions and Type Narrowing',
            code: `// Discriminated union - each variant has a literal discriminant
type Shape =
    | { kind: 'circle'; radius: number }
    | { kind: 'rectangle'; width: number; height: number }
    | { kind: 'triangle'; base: number; height: number };

// Exhaustive pattern matching
function area(shape: Shape): number {
    switch (shape.kind) {
        case 'circle':
            return Math.PI * shape.radius ** 2;
        case 'rectangle':
            return shape.width * shape.height;
        case 'triangle':
            return (shape.base * shape.height) / 2;
        default:
            // Exhaustiveness check - never reached if all cases handled
            const _exhaustive: never = shape;
            return _exhaustive;
    }
}

// Type narrowing techniques
function process(value: string | number | null) {
    if (value === null) return;        // null narrowed out
    if (typeof value === 'string') {
        value.toUpperCase();           // string
    } else {
        value.toFixed(2);              // number
    }
}

// Type predicates (user-defined type guards)
interface Fish { swim(): void; }
interface Bird { fly(): void; }

function isFish(pet: Fish | Bird): pet is Fish {
    return (pet as Fish).swim !== undefined;
}`,
            language: 'typescript'
        },
        {
            title: 'Mapped and Conditional Types',
            code: `// Mapped type - transform all properties
type Nullable<T> = {
    [K in keyof T]: T[K] | null;
};

// Mapped type with modifiers
type Mutable<T> = {
    -readonly [K in keyof T]: T[K];
};

type Optional<T> = {
    [K in keyof T]+?: T[K];
};

// Conditional types
type IsString<T> = T extends string ? true : false;
type A = IsString<'hello'>; // true
type B = IsString<42>;      // false

// infer keyword - extract types from patterns
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type X = UnwrapPromise<Promise<string>>; // string

type ArrayElement<T> = T extends (infer E)[] ? E : never;
type Y = ArrayElement<number[]>; // number

// Recursive conditional type
type DeepPartial<T> = T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

// Template literal types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ApiPath = '/users' | '/orders';
type Endpoint = \`\${HttpMethod} \${ApiPath}\`;
// 'GET /users' | 'GET /orders' | 'POST /users' | ... (8 combinations)

// Distributive conditional types
type ToArray<T> = T extends any ? T[] : never;
type Distributed = ToArray<string | number>; // string[] | number[]`,
            language: 'typescript'
        },
        {
            title: 'Module System and Declaration Files',
            content: `<p>TypeScript supports both ESM and CommonJS module systems with different trade-offs.</p>
<ul>
<li><strong>ESM (import/export)</strong> - Static analysis, tree-shaking, async loading. The modern standard.</li>
<li><strong>CJS (require/module.exports)</strong> - Dynamic, synchronous. Node.js legacy default.</li>
<li><strong>Declaration files (.d.ts)</strong> - Type information without runtime code. Used for typing JavaScript libraries.</li>
<li><strong>Module resolution</strong> - <code>moduleResolution: "bundler"</code> for modern projects, <code>"node16"</code> for Node.js packages.</li>
</ul>
<p>Key tsconfig settings: <code>module</code>, <code>moduleResolution</code>, <code>esModuleInterop</code>, <code>isolatedModules</code>.</p>`
        },
        {
            title: 'TypeScript Compiler Flow',
            mermaid: `graph LR
    A[.ts Source Files] --> B[Scanner/Lexer]
    B --> C[Parser - AST]
    C --> D[Binder - Symbols]
    D --> E[Type Checker]
    E --> F[Emitter]
    F --> G[.js Output]
    F --> H[.d.ts Declarations]
    F --> I[.js.map Source Maps]
    
    J[tsconfig.json] --> E
    K[node_modules/@types] --> E
    L[.d.ts files] --> E`,
            content: `<p>The TypeScript compiler performs type checking at compile time and emits JavaScript. Declaration files allow typing for JavaScript libraries without modifying source code. The <code>@types</code> scope on npm provides community-maintained declarations.</p>`
        }
    ],
    questions: [
        {
            question: 'Explain the difference between unknown and any. When would you use each?',
            difficulty: 'easy',
            answer: `<p><strong>any</strong> disables type checking entirely. Any operation is allowed without type narrowing.</p>
<p><strong>unknown</strong> is the type-safe counterpart. You must narrow the type before performing operations on it.</p>
<pre><code>let x: any = getValue();
x.foo();          // No error - any allows anything

let y: unknown = getValue();
y.foo();          // Error! Must narrow first
if (typeof y === 'string') {
    y.toUpperCase(); // OK - narrowed to string
}</code></pre>
<p><strong>Use unknown when:</strong> accepting input from external boundaries (API responses, user input, deserialized data). Forces consumers to validate before using.</p>
<p><strong>Use any when:</strong> migrating JavaScript to TypeScript incrementally, or interfacing with truly dynamic code where typing is impractical. Minimize its use.</p>`,
            interviewTip: 'Strongly prefer unknown over any. Say "any is an escape hatch for migration, unknown is for production code handling external data."',
            followUp: ['How does unknown interact with union and intersection types?', 'What is the difference between {} and object and unknown?'],
            seniorPerspective: 'In a mature codebase, any should require a comment explaining why. ESLint rules like no-explicit-any enforce this. unknown at system boundaries with Zod/io-ts validation is the robust pattern.',
            architectPerspective: 'Type safety at system boundaries (API responses, message queues, config files) prevents entire categories of runtime errors. Use runtime validation libraries that produce TypeScript types from schemas.'
        },
        {
            question: 'How do generics with constraints work? Give a practical example.',
            difficulty: 'medium',
            answer: `<p>Generics allow writing reusable code that works with multiple types. Constraints restrict which types are acceptable.</p>
<pre><code>// Without constraint - T could be anything
function broken&lt;T&gt;(item: T): string {
    return item.name; // Error! T might not have .name
}

// With constraint - T must have at least these properties
interface HasId { id: string; }
function findById&lt;T extends HasId&gt;(items: T[], id: string): T | undefined {
    return items.find(item => item.id === id);
}

// keyof constraint - K must be a key of T
function pick&lt;T, K extends keyof T&gt;(obj: T, keys: K[]): Pick&lt;T, K&gt; {
    const result = {} as Pick&lt;T, K&gt;;
    keys.forEach(key => result[key] = obj[key]);
    return result;
}</code></pre>
<p>The constraint <code>extends</code> does not mean inheritance - it means "is assignable to" in TypeScript structural typing.</p>`,
            interviewTip: 'Show a real-world use case like a repository pattern or API client. Abstract examples are less convincing.',
            followUp: ['What is the difference between extends in generics vs extends in interfaces?', 'How do default type parameters work?'],
            seniorPerspective: 'Well-designed generics reduce code duplication without sacrificing type safety. Over-engineering with complex generic chains hurts readability. Find the balance.',
            architectPerspective: 'Generic constraints at framework boundaries define the contract for plugin/extension systems. Libraries like TypeORM and Prisma use sophisticated generics to provide type-safe query builders.'
        },
        {
            question: 'Explain discriminated unions and exhaustive checking. Why are they powerful?',
            difficulty: 'medium',
            answer: `<p>A discriminated union uses a common literal property (the discriminant) to distinguish between variants. Combined with exhaustive checking, the compiler ensures all cases are handled.</p>
<pre><code>type Result&lt;T&gt; =
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error }
    | { status: 'loading' };

function handleResult(result: Result&lt;User&gt;) {
    switch (result.status) {
        case 'success': return renderUser(result.data);
        case 'error': return renderError(result.error);
        case 'loading': return renderSpinner();
        // If a new status is added, TypeScript errors here
    }
}

// Exhaustiveness enforcement with never
function assertNever(x: never): never {
    throw new Error('Unexpected: ' + x);
}</code></pre>
<p><strong>Power:</strong> Adding a new variant to the union causes compile errors everywhere the union is not fully handled. This is compile-time safety for state machines, API responses, and event systems.</p>`,
            interviewTip: 'Connect this to real patterns: Redux actions, API response handling, state machines. Show how it prevents "forgot to handle new case" bugs.',
            followUp: ['How do discriminated unions compare to class hierarchies with polymorphism?', 'Can you have nested discriminated unions?'],
            seniorPerspective: 'Discriminated unions model domain states more precisely than boolean flags. Instead of { isLoading: boolean; error?: Error; data?: T }, use a proper union with exactly one valid state at a time.',
            architectPerspective: 'Event-driven architectures benefit enormously from discriminated unions. Each event type carries exactly the payload it needs, and handlers are proven exhaustive at compile time.'
        },
        {
            question: 'What are conditional types and the infer keyword? Give a real-world use case.',
            difficulty: 'hard',
            answer: `<p>Conditional types apply logic at the type level: <code>T extends U ? X : Y</code>. The <code>infer</code> keyword extracts types from patterns.</p>
<pre><code>// Extract return type of async functions
type AsyncReturnType&lt;T&gt; = T extends (...args: any[]) => Promise&lt;infer R&gt; ? R : never;

// Extract event payload from event map
type EventMap = {
    click: { x: number; y: number };
    keypress: { key: string; code: number };
};
type EventPayload&lt;E extends keyof EventMap&gt; = EventMap[E];

// Flatten nested arrays
type Flatten&lt;T&gt; = T extends Array&lt;infer U&gt; ? Flatten&lt;U&gt; : T;
type Deep = Flatten&lt;number[][][]&gt;; // number

// Real-world: type-safe API client
type ApiRoutes = {
    'GET /users': { response: User[]; params: { page: number } };
    'POST /users': { response: User; body: CreateUserDto };
};
type ResponseOf&lt;R extends keyof ApiRoutes&gt; = ApiRoutes[R] extends { response: infer T } ? T : never;</code></pre>
<p><strong>Real-world uses:</strong> ORM query builders, API clients, form libraries, state management type inference.</p>`,
            interviewTip: 'Start with a simple example (UnwrapPromise) before showing complex ones. Show you can build up complexity incrementally.',
            followUp: ['What is distributive behavior in conditional types?', 'How do you prevent distribution?'],
            seniorPerspective: 'Conditional types are powerful but can produce unreadable code. Use them in library internals; expose simple types to consumers. If a type error message is incomprehensible, the type is too complex.',
            architectPerspective: 'Type-level programming enables frameworks to provide compile-time safety without runtime overhead. tRPC, Prisma, and Zod all leverage conditional types and infer to derive types from schemas.'
        },
        {
            question: 'How do mapped types work? Build a custom utility type.',
            difficulty: 'hard',
            answer: `<p>Mapped types iterate over keys to create new types. They use the <code>[K in keyof T]</code> syntax.</p>
<pre><code>// Make all properties nullable
type Nullable&lt;T&gt; = {
    [K in keyof T]: T[K] | null;
};

// Make specific properties required, rest optional
type RequireFields&lt;T, K extends keyof T&gt; = Omit&lt;T, K&gt; & Required&lt;Pick&lt;T, K&gt;&gt;;

// Form state - each field has value, error, touched
type FormState&lt;T&gt; = {
    [K in keyof T]: {
        value: T[K];
        error: string | null;
        touched: boolean;
    };
};

// API response wrapper
type ApiFields&lt;T&gt; = {
    [K in keyof T as \`get\${Capitalize&lt;string & K&gt;}\`]: () => Promise&lt;T[K]&gt;;
};

interface UserService {
    name: string;
    age: number;
}
// ApiFields&lt;UserService&gt; = { getName: () => Promise&lt;string&gt;; getAge: () => Promise&lt;number&gt; }</code></pre>
<p>Key modifiers: <code>+readonly</code>, <code>-readonly</code>, <code>+?</code>, <code>-?</code> add or remove property modifiers. Key remapping with <code>as</code> allows transforming key names.</p>`,
            interviewTip: 'Building a custom utility type live demonstrates deep understanding. Practice building Partial, Required, and Pick from scratch.',
            followUp: ['How does key remapping with as work?', 'Can you filter keys in a mapped type?'],
            seniorPerspective: 'Custom mapped types are the foundation of type-safe abstraction layers. A well-designed mapped type can eliminate entire categories of boilerplate while maintaining full type safety.',
            architectPerspective: 'Mapped types enable zero-runtime-cost type transformations. Use them to derive DTOs from domain models, form types from schemas, and API types from route definitions.'
        },
        {
            question: 'Explain template literal types and their practical applications.',
            difficulty: 'advanced',
            answer: `<p>Template literal types combine literal types with string interpolation at the type level.</p>
<pre><code>// Basic template literal
type Greeting = \`Hello, \${string}\`;
const g: Greeting = 'Hello, World'; // OK
const bad: Greeting = 'Hi there';   // Error

// Event handler pattern
type EventName = 'click' | 'focus' | 'blur';
type Handler = \`on\${Capitalize&lt;EventName&gt;}\`; // 'onClick' | 'onFocus' | 'onBlur'

// CSS unit type
type CSSUnit = 'px' | 'rem' | 'em' | '%';
type CSSValue = \`\${number}\${CSSUnit}\`; // '16px', '1.5rem', etc.

// Route parameter extraction
type ExtractParams&lt;T extends string&gt; = 
    T extends \`\${string}:\${infer Param}/\${infer Rest}\`
        ? Param | ExtractParams&lt;Rest&gt;
        : T extends \`\${string}:\${infer Param}\`
            ? Param
            : never;

type Params = ExtractParams&lt;'/users/:userId/posts/:postId'&gt;;
// 'userId' | 'postId'</code></pre>
<p><strong>Applications:</strong> Type-safe routing, CSS-in-JS, event systems, API path builders, configuration keys.</p>`,
            interviewTip: 'Template literal types show advanced TypeScript knowledge. Demonstrating the route parameter extraction pattern is particularly impressive.',
            followUp: ['How do intrinsic string manipulation types work (Uppercase, Lowercase, Capitalize)?', 'What are the performance implications of complex template literal types?'],
            seniorPerspective: 'Template literal types enable previously impossible type safety for string-based APIs. But they can dramatically slow down the type checker if overused. Profile tsc performance.',
            architectPerspective: 'Frameworks like Hono and tRPC use template literal types to provide compile-time route safety. This pattern eliminates an entire class of runtime routing errors.'
        },
        {
            question: 'What is structural typing and how does it differ from nominal typing?',
            difficulty: 'easy',
            answer: `<p><strong>Structural typing</strong> (TypeScript): Types are compatible if they have the same shape (properties and their types), regardless of declared name.</p>
<p><strong>Nominal typing</strong> (C#, Java): Types are compatible only if they explicitly declare a relationship (implements/extends).</p>
<pre><code>// TypeScript - structural
interface Point { x: number; y: number; }
interface Coordinate { x: number; y: number; }
const p: Point = { x: 1, y: 2 };
const c: Coordinate = p; // OK! Same shape

// This also works - excess properties are fine for variables
const p3d = { x: 1, y: 2, z: 3 };
const flat: Point = p3d; // OK! Has x and y

// Branded types for nominal-like behavior
type UserId = string & { readonly brand: unique symbol };
type OrderId = string & { readonly brand: unique symbol };
function getUser(id: UserId) { /* ... */ }
// getUser(orderId); // Error! Different brands</code></pre>
<p>Structural typing is more flexible but can allow unintended compatibility. Use branded types when you need nominal-like safety.</p>`,
            interviewTip: 'The branded types pattern shows you can work around structural typing limitations when domain safety requires it.',
            followUp: ['What are the downsides of structural typing?', 'How do branded types work at runtime?'],
            seniorPerspective: 'Branded types are essential for domain-driven design in TypeScript. Prevent mixing UserId with OrderId even though both are strings. Libraries like io-ts and Zod support branded types.',
            architectPerspective: 'Structural typing enables powerful patterns like dependency injection without interfaces (just pass any object with the right shape), but requires discipline to maintain clear boundaries.'
        },
        {
            question: 'How would you set up a TypeScript project for a library that needs to support both ESM and CJS consumers?',
            difficulty: 'advanced',
            answer: `<p>Dual-format packages require careful configuration to work correctly in both module systems.</p>
<pre><code>// package.json - dual package setup
{
  "name": "my-lib",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    }
  },
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts"
}

// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "declaration": true,
    "declarationDir": "./dist/types",
    "sourceMap": true
  }
}

// tsconfig.esm.json
{ "extends": "./tsconfig.base.json",
  "compilerOptions": { "module": "ESNext", "outDir": "./dist/esm" } }

// tsconfig.cjs.json  
{ "extends": "./tsconfig.base.json",
  "compilerOptions": { "module": "CommonJS", "outDir": "./dist/cjs" } }</code></pre>
<p>Build both targets and ensure .d.ts files are shared. Use <code>exports</code> field in package.json for Node.js 12+ conditional exports.</p>`,
            interviewTip: 'This is a real-world pain point for library authors. Showing familiarity with dual packaging demonstrates production experience.',
            followUp: ['What is the dual package hazard?', 'How do you handle default exports across ESM and CJS?'],
            seniorPerspective: 'Consider whether dual support is actually needed. If all consumers are modern (ESM-only), avoid the complexity. Tools like tsup and unbuild handle dual builds automatically.',
            architectPerspective: 'Library packaging decisions affect the entire consumer ecosystem. Ship ESM-first with CJS fallback. Consider build tools like tsup, unbuild, or pkgroll that abstract the dual-format complexity.'
        },
        {
            question: 'Design a type-safe event emitter using TypeScript generics and mapped types.',
            difficulty: 'expert',
            answer: `<p>A type-safe event emitter ensures that event names and their payloads are checked at compile time.</p>
<pre><code>// Define event map
interface AppEvents {
    userLogin: { userId: string; timestamp: Date };
    orderPlaced: { orderId: string; amount: number };
    error: { code: number; message: string };
}

// Type-safe emitter
class TypedEmitter&lt;Events extends Record&lt;string, any&gt;&gt; {
    private listeners = new Map&lt;keyof Events, Set&lt;Function&gt;&gt;();

    on&lt;E extends keyof Events&gt;(
        event: E,
        handler: (payload: Events[E]) => void
    ): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
        return () => this.listeners.get(event)?.delete(handler);
    }

    emit&lt;E extends keyof Events&gt;(event: E, payload: Events[E]): void {
        this.listeners.get(event)?.forEach(handler => handler(payload));
    }
}

// Usage - fully type-safe
const emitter = new TypedEmitter&lt;AppEvents&gt;();
emitter.on('userLogin', (data) => {
    console.log(data.userId); // string - inferred!
});
emitter.emit('orderPlaced', { orderId: '123', amount: 99.99 });
// emitter.emit('orderPlaced', { wrong: true }); // Compile error!</code></pre>`,
            interviewTip: 'This demonstrates practical generic design. Mention how it compares to Node.js EventEmitter which has no type safety.',
            followUp: ['How would you add once() and off() methods?', 'How would you make the emitter support async handlers?'],
            seniorPerspective: 'This pattern is used in production libraries (mitt, tiny-emitter typed wrappers). The key insight is using a generic event map as the single source of truth for all event shapes.',
            architectPerspective: 'Type-safe event systems enable decoupled architectures with compile-time guarantees. Combined with discriminated unions for event payloads, you get exhaustive handling of all system events.'
        },
        {
            question: 'What are the differences between type aliases and interfaces? When do you prefer one over the other?',
            difficulty: 'easy',
            answer: `<p><strong>Interfaces</strong> can be extended and merged (declaration merging). They describe object shapes.</p>
<p><strong>Type aliases</strong> can represent any type: unions, intersections, primitives, tuples, mapped types.</p>
<pre><code>// Interface - extendable, mergeable
interface Animal { name: string; }
interface Dog extends Animal { breed: string; }
// Declaration merging (same name adds properties)
interface Animal { age: number; } // Now Animal has name + age

// Type alias - more flexible
type ID = string | number;  // Unions
type Pair = [string, number]; // Tuples
type Callback = (data: string) => void; // Functions

// Practical guidance:
// Use interface for: object shapes, class contracts, public APIs (extendable)
// Use type for: unions, intersections, utility types, complex transformations</code></pre>
<p><strong>Performance note:</strong> Interfaces are slightly faster for the type checker to process (cached by name). Types are evaluated structurally each time.</p>`,
            interviewTip: 'Do not say "they are basically the same." Show you know the specific differences: declaration merging, union support, performance characteristics.',
            followUp: ['What is declaration merging and when is it useful?', 'Can interfaces extend type aliases?'],
            seniorPerspective: 'Consistency matters more than the choice itself. Pick a team convention (e.g., "interface for public API shapes, type for everything else") and enforce it with ESLint.',
            architectPerspective: 'Declaration merging is powerful for plugin systems - plugins extend a core interface to add their types. This is how Express request types and global augmentation work.'
        }
    ]
});
