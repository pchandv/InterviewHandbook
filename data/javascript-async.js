'use strict';

PageData.register('javascript-async', {
    title: 'JavaScript Async & Runtime',
    description: 'Event loop internals, async patterns, closures, and runtime mechanics that power JavaScript',
    sections: [
        {
            title: 'The Event Loop',
            content: `<p>JavaScript is single-threaded with a concurrency model based on the event loop. Understanding the execution order is critical for debugging async code.</p>
<ul>
<li><strong>Call Stack</strong> - Synchronous code executes here, one frame at a time (LIFO).</li>
<li><strong>Microtask Queue</strong> - Promise callbacks (.then/.catch), queueMicrotask(), MutationObserver. Drained completely after each task.</li>
<li><strong>Macrotask Queue</strong> - setTimeout, setInterval, I/O callbacks, UI rendering. One task processed per loop iteration.</li>
</ul>
<p><strong>Execution order:</strong> Call stack empties → All microtasks drain → One macrotask → Repeat.</p>`
        },
        {
            title: 'Event Loop Execution Model',
            mermaid: `graph TD
    A[Call Stack] -->|Stack empty| B{Microtask Queue empty?}
    B -->|No| C[Process ALL microtasks]
    C --> B
    B -->|Yes| D{Render needed?}
    D -->|Yes| E[requestAnimationFrame]
    E --> F[Style/Layout/Paint]
    D -->|No| G{Macrotask Queue empty?}
    F --> G
    G -->|No| H[Process ONE macrotask]
    H --> A
    G -->|Yes| I[Wait for new tasks]
    I --> A`,
            content: `<p>Key insight: Microtasks (Promises) always run before the next macrotask (setTimeout). A microtask that enqueues another microtask will delay macrotasks indefinitely - this can starve setTimeout callbacks and freeze the UI.</p>`
        },
        {
            title: 'Promises and Async/Await',
            code: `// Promise states: pending -> fulfilled OR rejected
const fetchUser = (id) => new Promise((resolve, reject) => {
    setTimeout(() => {
        if (id > 0) resolve({ id, name: 'Alice' });
        else reject(new Error('Invalid ID'));
    }, 100);
});

// Chaining - each .then returns a new Promise
fetchUser(1)
    .then(user => fetchOrders(user.id))
    .then(orders => orders.filter(o => o.total > 100))
    .catch(err => console.error(err)); // catches ANY error in chain

// Async/await - syntactic sugar over Promises
async function getUserOrders(userId) {
    try {
        const user = await fetchUser(userId);
        const orders = await fetchOrders(user.id);
        return orders.filter(o => o.total > 100);
    } catch (err) {
        console.error('Failed:', err.message);
        throw err; // re-throw to propagate
    }
}

// Parallel execution - don't await sequentially when independent
async function loadDashboard() {
    // BAD: sequential - total time = sum of all requests
    const users = await fetchUsers();
    const orders = await fetchOrders();

    // GOOD: parallel - total time = longest request
    const [users2, orders2] = await Promise.all([
        fetchUsers(),
        fetchOrders()
    ]);
}

// Promise combinators
Promise.all([p1, p2]);        // All succeed or first rejection
Promise.allSettled([p1, p2]); // Wait for all, report each status
Promise.race([p1, p2]);      // First to settle (resolve or reject)
Promise.any([p1, p2]);       // First to resolve (ignores rejections)`,
            language: 'javascript'
        },
        {
            title: 'Closures and Scope',
            code: `// Closure: function retains access to its lexical scope
function createCounter(initial = 0) {
    let count = initial; // enclosed variable
    return {
        increment: () => ++count,
        decrement: () => --count,
        getCount: () => count
    };
}
const counter = createCounter(10);
counter.increment(); // 11
counter.increment(); // 12 - count persists!

// Classic closure pitfall
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100); // 3, 3, 3 (var is function-scoped)
}
for (let j = 0; j < 3; j++) {
    setTimeout(() => console.log(j), 100); // 0, 1, 2 (let is block-scoped)
}

// Practical closure: memoization
function memoize(fn) {
    const cache = new Map();
    return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

// Module pattern (pre-ES modules)
const UserModule = (() => {
    let users = []; // private
    return {
        add: (user) => users.push(user),
        getAll: () => [...users] // return copy
    };
})();`,
            language: 'javascript'
        },
        {
            title: 'The this Keyword',
            code: `// 'this' depends on HOW the function is called, not WHERE it's defined

const obj = {
    name: 'Alice',
    greet() { return this.name; },       // method call: this = obj
    greetArrow: () => this.name,         // arrow: this = enclosing scope (window/undefined)
};

obj.greet();         // 'Alice' - called as method
const fn = obj.greet;
fn();                // undefined - called as function (this = global/undefined)

// Fixing this binding
fn.call(obj);        // 'Alice' - explicit binding
fn.apply(obj);       // 'Alice' - explicit binding (args as array)
const bound = fn.bind(obj); // permanent binding
bound();             // 'Alice'

// Arrow functions - lexical this (inherits from enclosing)
class Timer {
    seconds = 0;
    start() {
        // Arrow captures 'this' from start() method context
        setInterval(() => {
            this.seconds++; // 'this' = Timer instance
        }, 1000);
    }
}

// In event handlers
button.addEventListener('click', function() {
    this; // the button element (DOM sets this)
});
button.addEventListener('click', () => {
    this; // enclosing scope, NOT the button
});`,
            language: 'javascript'
        },
        {
            title: 'Prototypal Inheritance',
            mermaid: `graph TD
    A[Object.prototype] -->|__proto__| B[null]
    C[Array.prototype] -->|__proto__| A
    D["[1,2,3]"] -->|__proto__| C
    E[Function.prototype] -->|__proto__| A
    F["function foo(){}"] -->|__proto__| E
    G[Custom.prototype] -->|__proto__| A
    H["new Custom()"] -->|__proto__| G
    
    I["class Child extends Parent"]
    J[Child.prototype] -->|__proto__| K[Parent.prototype]
    K -->|__proto__| A`,
            content: `<p>JavaScript uses prototypal inheritance - objects inherit directly from other objects via the prototype chain. Classes are syntactic sugar over this mechanism.</p>
<ul>
<li><strong>__proto__</strong> (or Object.getPrototypeOf) - The prototype link on every object</li>
<li><strong>prototype</strong> - Property on constructor functions, becomes __proto__ of instances</li>
<li><strong>Property lookup</strong> - Walks up the chain until found or hits null</li>
<li><strong>hasOwnProperty</strong> - Checks only the object itself, not the chain</li>
</ul>`
        },
        {
            title: 'Generators and Iterators',
            code: `// Generator function - pausable/resumable
function* fibonacci() {
    let [a, b] = [0, 1];
    while (true) {
        yield a;
        [a, b] = [b, a + b];
    }
}

const fib = fibonacci();
fib.next(); // { value: 0, done: false }
fib.next(); // { value: 1, done: false }
fib.next(); // { value: 1, done: false }

// Practical: paginated API fetching
async function* fetchAllPages(url) {
    let page = 1;
    while (true) {
        const response = await fetch(\`\${url}?page=\${page}\`);
        const data = await response.json();
        if (data.items.length === 0) return;
        yield* data.items; // yield each item individually
        page++;
    }
}

// Consuming async generator
for await (const item of fetchAllPages('/api/users')) {
    processUser(item);
    if (shouldStop) break; // lazy - stops fetching more pages
}

// Iterator protocol - make any object iterable
class Range {
    constructor(start, end) { this.start = start; this.end = end; }
    [Symbol.iterator]() {
        let current = this.start;
        const end = this.end;
        return {
            next() {
                return current <= end
                    ? { value: current++, done: false }
                    : { done: true };
            }
        };
    }
}
for (const n of new Range(1, 5)) console.log(n); // 1,2,3,4,5`,
            language: 'javascript'
        },
        {
            title: 'WeakMap, WeakRef, and Memory Management',
            code: `// WeakMap - keys are weakly held (garbage collected when no other references)
const metadata = new WeakMap();

function processElement(element) {
    metadata.set(element, { clicks: 0, lastSeen: Date.now() });
}
// When element is removed from DOM and dereferenced, entry is auto-removed

// Use cases: private data, caching without memory leaks
const privateData = new WeakMap();
class User {
    constructor(name, ssn) {
        this.name = name;
        privateData.set(this, { ssn }); // truly private
    }
    getSSN() { return privateData.get(this).ssn; }
}

// WeakRef - holds weak reference, target may be GC'd
class Cache {
    #cache = new Map();
    
    set(key, value) {
        this.#cache.set(key, new WeakRef(value));
    }
    
    get(key) {
        const ref = this.#cache.get(key);
        if (!ref) return undefined;
        const value = ref.deref(); // returns undefined if GC'd
        if (!value) this.#cache.delete(key);
        return value;
    }
}

// FinalizationRegistry - callback when object is GC'd
const registry = new FinalizationRegistry((heldValue) => {
    console.log(\`Object with id \${heldValue} was garbage collected\`);
});
let obj = { id: 1, data: new ArrayBuffer(1024 * 1024) };
registry.register(obj, obj.id);
obj = null; // Eventually: "Object with id 1 was garbage collected"`,
            language: 'javascript'
        },
        {
            title: 'ES Modules vs CommonJS',
            content: `<p>JavaScript has two module systems with important behavioral differences:</p>
<ul>
<li><strong>ES Modules (import/export)</strong> - Static structure, async loading, live bindings (exports update in real-time), strict mode by default, tree-shakeable.</li>
<li><strong>CommonJS (require/module.exports)</strong> - Dynamic, synchronous, value copies (snapshots at require time), no tree-shaking.</li>
</ul>
<p><strong>Key differences:</strong></p>
<ul>
<li>ESM: imports hoisted, circular deps partially resolved via live bindings</li>
<li>CJS: require() evaluates at call site, circular deps get partial exports</li>
<li>ESM: top-level await supported</li>
<li>CJS: can require() conditionally in if-blocks</li>
</ul>
<p>Node.js uses <code>"type": "module"</code> in package.json or <code>.mjs</code> extension for ESM. The ecosystem is migrating to ESM-first.</p>`
        }
    ],
    questions: [
        {
            question: 'What is the output of this code and why? Explain the event loop execution order.',
            difficulty: 'medium',
            answer: `<p><strong>Classic interview code:</strong></p>
<pre><code>console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');</code></pre>
<p><strong>Output: 1, 4, 3, 2</strong></p>
<p><strong>Explanation:</strong></p>
<ol>
<li><code>console.log('1')</code> - synchronous, executes immediately on call stack</li>
<li><code>setTimeout</code> - callback queued in macrotask queue (even with 0ms delay)</li>
<li><code>Promise.resolve().then()</code> - callback queued in microtask queue</li>
<li><code>console.log('4')</code> - synchronous, executes immediately</li>
<li>Call stack empty → drain microtasks → <code>console.log('3')</code></li>
<li>Microtasks done → process one macrotask → <code>console.log('2')</code></li>
</ol>
<p><strong>Rule:</strong> Microtasks (Promises) always execute before macrotasks (setTimeout), regardless of registration order.</p>`,
            interviewTip: 'Walk through step by step. Draw the queues if on a whiteboard. This is one of the most common JavaScript interview questions.',
            followUp: ['What if the Promise callback enqueues another microtask?', 'How does queueMicrotask differ from setTimeout(fn, 0)?'],
            seniorPerspective: 'Understanding microtask vs macrotask priority is essential for debugging race conditions in UI frameworks. React batches state updates in microtasks, which is why setState appears async.',
            architectPerspective: 'Microtask starvation is a real production issue. A recursive Promise chain can block rendering and setTimeout callbacks indefinitely. Use requestAnimationFrame for visual updates.'
        },
        {
            question: 'Explain closures. What is a practical use case beyond the textbook counter example?',
            difficulty: 'easy',
            answer: `<p>A <strong>closure</strong> is a function that retains access to variables from its lexical scope, even after the outer function has returned.</p>
<p><strong>Practical use cases:</strong></p>
<ul>
<li><strong>Memoization</strong> - Cache expensive computation results in a closure variable</li>
<li><strong>Private state</strong> - Module pattern, encapsulating state without classes</li>
<li><strong>Partial application / currying</strong> - Configure a function with some arguments upfront</li>
<li><strong>Event handlers</strong> - Capture state at registration time</li>
<li><strong>Debounce/throttle</strong> - Timer reference persists across calls</li>
</ul>
<pre><code>// Debounce - closure holds timeoutId between calls
function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Partial application
function createLogger(prefix) {
    return function(message) {
        console.log(\`[\${prefix}] \${message}\`);
    };
}
const dbLog = createLogger('DB');
dbLog('Connected'); // [DB] Connected</code></pre>`,
            interviewTip: 'Give a real example you have used in production. Debounce and memoization are both closures that solve real problems.',
            followUp: ['What is the memory implication of closures?', 'How do closures interact with garbage collection?'],
            seniorPerspective: 'Closures are the foundation of functional patterns in JavaScript. React hooks are closures. Redux middleware uses closures. Understanding them deeply unlocks understanding of the frameworks built on them.',
            architectPerspective: 'Closures can cause memory leaks if they inadvertently capture large objects. Be intentional about what variables are in scope when creating long-lived closures (event handlers, intervals).'
        },
        {
            question: 'What are the four rules for determining this in JavaScript?',
            difficulty: 'medium',
            answer: `<p>The value of <code>this</code> is determined by the call site, following these rules in priority order:</p>
<ol>
<li><strong>new binding</strong> - <code>new Foo()</code> → this = newly created object</li>
<li><strong>Explicit binding</strong> - <code>call()</code>, <code>apply()</code>, <code>bind()</code> → this = specified object</li>
<li><strong>Implicit binding</strong> - <code>obj.method()</code> → this = obj (object before the dot)</li>
<li><strong>Default binding</strong> - plain function call → this = global (sloppy) or undefined (strict mode)</li>
</ol>
<p><strong>Arrow functions</strong> are the exception - they have no own <code>this</code>. They inherit <code>this</code> from the enclosing lexical scope at definition time. This cannot be overridden with call/apply/bind.</p>
<pre><code>class Component {
    value = 42;
    // Problem: 'this' lost when passed as callback
    handleClick() { console.log(this.value); }
    // Solution 1: arrow function property
    handleClick2 = () => { console.log(this.value); }
    // Solution 2: bind in constructor
    constructor() { this.handleClick = this.handleClick.bind(this); }
}</code></pre>`,
            interviewTip: 'Memorize the four rules and their priority. For React developers, explain why arrow functions in class components solve the this problem.',
            followUp: ['Why can you not use arrow functions as methods on object literals?', 'What does this refer to in a module scope?'],
            seniorPerspective: 'In modern code (React hooks, functional patterns), this is less relevant. But understanding it is still critical for debugging library code, class-based patterns, and legacy codebases.',
            architectPerspective: 'The this binding confusion is why many modern frameworks moved away from class-based patterns. Vue 3 Composition API, React Hooks, and Svelte all avoid this-based component APIs.'
        },
        {
            question: 'How do Promise.all, Promise.allSettled, Promise.race, and Promise.any differ?',
            difficulty: 'medium',
            answer: `<p>These combinators handle multiple concurrent promises differently:</p>
<table>
<tr><th>Method</th><th>Resolves when</th><th>Rejects when</th><th>Use case</th></tr>
<tr><td>Promise.all</td><td>ALL resolve</td><td>FIRST rejection</td><td>Parallel independent tasks (all required)</td></tr>
<tr><td>Promise.allSettled</td><td>ALL settle (resolve or reject)</td><td>Never rejects</td><td>Run all, report individual results</td></tr>
<tr><td>Promise.race</td><td>FIRST to settle</td><td>FIRST to settle (if rejection)</td><td>Timeout patterns, first-response</td></tr>
<tr><td>Promise.any</td><td>FIRST to resolve</td><td>ALL reject (AggregateError)</td><td>Fastest success from redundant sources</td></tr>
</table>
<pre><code>// Timeout pattern with Promise.race
function withTimeout(promise, ms) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
    );
    return Promise.race([promise, timeout]);
}

// Load from fastest CDN
const data = await Promise.any([
    fetch('https://cdn1.example.com/data'),
    fetch('https://cdn2.example.com/data'),
    fetch('https://cdn3.example.com/data')
]);</code></pre>`,
            interviewTip: 'Know when to use each. Promise.all for "I need all results." Promise.allSettled for "I want to know what happened to each." Promise.any for "give me the first success."',
            followUp: ['What is AggregateError?', 'How would you implement Promise.all from scratch?'],
            seniorPerspective: 'Promise.allSettled is underused. It is perfect for batch operations where partial failure is acceptable (send notifications to 100 users, report which ones failed).',
            architectPerspective: 'Promise.any enables active-active redundancy patterns. Combined with AbortController, you can cancel the slower requests once the fastest responds.'
        },
        {
            question: 'Explain hoisting. What is the Temporal Dead Zone?',
            difficulty: 'easy',
            answer: `<p><strong>Hoisting</strong> moves declarations to the top of their scope during compilation. Only the declaration is hoisted, not the initialization.</p>
<pre><code>// var - hoisted and initialized to undefined
console.log(x); // undefined (not ReferenceError)
var x = 5;

// let/const - hoisted but NOT initialized (Temporal Dead Zone)
console.log(y); // ReferenceError: Cannot access 'y' before initialization
let y = 5;

// Function declarations - fully hoisted (body included)
greet(); // Works!
function greet() { console.log('hello'); }

// Function expressions - only variable declaration hoisted
hello(); // TypeError: hello is not a function
var hello = function() { console.log('hi'); };</code></pre>
<p><strong>Temporal Dead Zone (TDZ):</strong> The period between entering a scope and the let/const declaration being reached. Accessing the variable in this zone throws a ReferenceError. This exists to catch bugs - using a variable before it is defined is almost always an error.</p>`,
            interviewTip: 'Distinguish between var (hoisted + initialized to undefined) and let/const (hoisted but in TDZ). Function declarations are fully hoisted, function expressions are not.',
            followUp: ['Why does the TDZ exist?', 'Are class declarations hoisted?'],
            seniorPerspective: 'In modern code, always use const/let. The TDZ behavior is safer than var silently returning undefined. ESLint no-var rule should be enabled in every project.',
            architectPerspective: 'Hoisting quirks are mostly irrelevant in modern codebases with proper linting. But understanding them is important for debugging minified/bundled code and working with legacy systems.'
        },
        {
            question: 'What are generators and async generators? Give a practical use case.',
            difficulty: 'hard',
            answer: `<p><strong>Generators</strong> are functions that can be paused and resumed, yielding multiple values over time.</p>
<p><strong>Async generators</strong> combine generators with async/await for lazy asynchronous iteration.</p>
<pre><code>// Practical: paginated API with automatic fetching
async function* fetchPaginated(baseUrl) {
    let cursor = null;
    while (true) {
        const url = cursor ? \`\${baseUrl}?cursor=\${cursor}\` : baseUrl;
        const response = await fetch(url);
        const { items, nextCursor } = await response.json();
        
        for (const item of items) yield item;
        
        if (!nextCursor) return;
        cursor = nextCursor;
    }
}

// Consumer only fetches pages as needed (lazy)
for await (const user of fetchPaginated('/api/users')) {
    await processUser(user);
    if (reachedLimit) break; // stops fetching more pages
}

// Practical: streaming data processing
async function* parseCSVStream(readableStream) {
    const reader = readableStream.getReader();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value);
        const lines = buffer.split('\\n');
        buffer = lines.pop(); // keep incomplete line
        for (const line of lines) yield parseCSVLine(line);
    }
    if (buffer) yield parseCSVLine(buffer);
}</code></pre>`,
            interviewTip: 'Paginated API fetching is the killer use case. It demonstrates lazy evaluation, backpressure, and clean separation of fetching logic from processing logic.',
            followUp: ['How do generators enable cooperative multitasking?', 'What is the difference between yield and yield*?'],
            seniorPerspective: 'Async generators are underutilized. They naturally handle backpressure - the producer pauses until the consumer requests the next value. Perfect for streaming scenarios.',
            architectPerspective: 'Async iterators provide a unified abstraction for streams, paginated APIs, real-time feeds, and any data source that produces values over time. They compose with for-await-of like arrays compose with for-of.'
        },
        {
            question: 'Explain the scope chain and how variable lookup works in JavaScript.',
            difficulty: 'medium',
            answer: `<p>Every execution context has a reference to its outer (parent) scope, forming a chain that is traversed during variable lookup.</p>
<pre><code>const global = 'g';

function outer() {
    const outerVar = 'o';
    
    function middle() {
        const middleVar = 'm';
        
        function inner() {
            const innerVar = 'i';
            // Lookup: inner scope -> middle -> outer -> global -> ReferenceError
            console.log(innerVar);  // found in inner scope
            console.log(middleVar); // found in middle scope
            console.log(outerVar);  // found in outer scope
            console.log(global);    // found in global scope
        }
        inner();
    }
    middle();
}</code></pre>
<p><strong>Key points:</strong></p>
<ul>
<li>Scope chain is determined at <strong>definition time</strong> (lexical/static scoping), not call time</li>
<li>Each function creates a new scope level</li>
<li>Block scoping (let/const) creates scope within { } blocks</li>
<li>Lookup walks outward until found or throws ReferenceError</li>
<li>Inner variables shadow outer variables with the same name</li>
</ul>`,
            interviewTip: 'Emphasize that JavaScript uses lexical (static) scoping - the scope chain is set when code is written, not when it runs. This is what makes closures possible.',
            followUp: ['How does variable shadowing work?', 'What is the difference between lexical and dynamic scoping?'],
            seniorPerspective: 'Scope chain understanding is prerequisite for understanding module systems, closure-based patterns, and memory management. Variables captured in closures cannot be garbage collected.',
            architectPerspective: 'Module scope (ESM) provides file-level encapsulation without closures. This is why the module pattern (IIFE) became unnecessary with ES modules.'
        },
        {
            question: 'How does prototypal inheritance differ from classical inheritance? What are the implications?',
            difficulty: 'hard',
            answer: `<p><strong>Classical inheritance</strong> (Java/C#): Classes are blueprints. Objects are instances. Inheritance is a compile-time relationship between classes.</p>
<p><strong>Prototypal inheritance</strong> (JavaScript): Objects inherit directly from other objects. No classes needed (ES6 classes are syntactic sugar). Inheritance is a runtime prototype chain.</p>
<pre><code>// Prototypal - object to object
const animal = {
    speak() { return \`\${this.name} makes a sound\`; }
};
const dog = Object.create(animal);
dog.name = 'Rex';
dog.fetch = function() { return 'fetching!'; };
dog.speak(); // "Rex makes a sound" - found via prototype chain

// ES6 class syntax (sugar over prototypes)
class Animal {
    constructor(name) { this.name = name; }
    speak() { return \`\${this.name} makes a sound\`; }
}
class Dog extends Animal {
    fetch() { return 'fetching!'; }
}
// Under the hood: Dog.prototype.__proto__ === Animal.prototype</code></pre>
<p><strong>Implications:</strong></p>
<ul>
<li>Objects can be modified at runtime (add/remove methods on prototypes)</li>
<li>Mixins and composition are more natural than in classical systems</li>
<li>instanceof checks the prototype chain, not class identity</li>
<li>Favor composition (Object.assign, spread) over deep inheritance hierarchies</li>
</ul>`,
            interviewTip: 'Show you understand that class is syntax sugar. Explain why "favor composition over inheritance" is especially natural in JavaScript.',
            followUp: ['What happens if you modify a prototype after creating instances?', 'How does Object.create differ from new?'],
            seniorPerspective: 'Modern JavaScript favors composition (mixins, functional patterns, hooks) over inheritance. Deep prototype chains are a code smell. Keep inheritance shallow (1-2 levels max).',
            architectPerspective: 'The prototype system enables powerful metaprogramming but makes static analysis harder. TypeScript classes with interfaces provide the structure benefits while the runtime remains prototypal.'
        },
        {
            question: 'What is WeakMap and when would you use it instead of Map?',
            difficulty: 'hard',
            answer: `<p><strong>WeakMap</strong> holds weak references to keys (objects only). When the key object has no other references, both the key and value are garbage collected.</p>
<p><strong>Key differences from Map:</strong></p>
<ul>
<li>Keys must be objects (not primitives)</li>
<li>Keys are weakly held (GC-able)</li>
<li>Not iterable (no .keys(), .values(), .entries(), .forEach())</li>
<li>No .size property</li>
</ul>
<p><strong>Use WeakMap when:</strong></p>
<ul>
<li><strong>DOM metadata</strong> - Attach data to elements without preventing GC when element is removed</li>
<li><strong>Private class data</strong> - Store truly private state keyed by instance</li>
<li><strong>Caching</strong> - Cache computed results without memory leaks (cache entry disappears when object is GC'd)</li>
<li><strong>Object associations</strong> - Any time you need to associate data with an object without modifying it</li>
</ul>
<pre><code>// Memory-safe DOM cache
const elementCache = new WeakMap();
function getComputedData(element) {
    if (elementCache.has(element)) return elementCache.get(element);
    const data = expensiveComputation(element);
    elementCache.set(element, data);
    return data;
}
// When element is removed from DOM and dereferenced, cache entry is auto-cleaned</code></pre>`,
            interviewTip: 'Emphasize the memory management aspect. WeakMap prevents memory leaks in long-running applications where objects come and go.',
            followUp: ['What is WeakRef and FinalizationRegistry?', 'Can WeakMap keys be strings?'],
            seniorPerspective: 'WeakMap is essential for framework authors. React uses it internally for fiber tree metadata. Any long-running application that associates data with transient objects needs WeakMap.',
            architectPerspective: 'WeakMap enables non-invasive object decoration (adding data without modifying the object). This is the foundation of many AOP and decorator patterns in JavaScript.'
        },
        {
            question: 'Implement a Promise.all polyfill from scratch.',
            difficulty: 'expert',
            answer: `<p>Promise.all takes an iterable of promises and returns a single promise that resolves with an array of results when all input promises resolve, or rejects with the first rejection.</p>
<pre><code>function promiseAll(promises) {
    return new Promise((resolve, reject) => {
        const results = [];
        let completed = 0;
        const promiseArray = Array.from(promises);
        
        if (promiseArray.length === 0) {
            resolve([]);
            return;
        }
        
        promiseArray.forEach((promise, index) => {
            // Wrap in Promise.resolve to handle non-promise values
            Promise.resolve(promise)
                .then(value => {
                    results[index] = value; // maintain order
                    completed++;
                    if (completed === promiseArray.length) {
                        resolve(results);
                    }
                })
                .catch(reject); // first rejection wins
        });
    });
}

// Edge cases handled:
// 1. Empty array -> resolves with []
// 2. Non-promise values -> wrapped with Promise.resolve()
// 3. Order preserved -> results[index] not results.push()
// 4. First rejection -> immediately rejects (others ignored)</code></pre>`,
            interviewTip: 'Handle edge cases: empty array, non-promise values, order preservation. These distinguish a production implementation from a naive one.',
            followUp: ['How would you implement Promise.allSettled?', 'How does the real implementation handle iterables vs arrays?'],
            seniorPerspective: 'This tests understanding of Promise internals, not just usage. Key insight: using index assignment (not push) preserves order despite async completion order.',
            architectPerspective: 'Understanding Promise internals helps when building custom async primitives: retry logic, circuit breakers, rate limiters, and custom combinators specific to your domain.'
        }
    ]
});
