/* ═══════════════════════════════════════════════════════════════════
   OPERATING SYSTEM BASICS — Level 0: Prerequisites (Computing Basics)
   Processes vs threads, scheduling, virtual memory, filesystems,
   system calls, and concurrency fundamentals.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('os-fundamentals', {

    title: 'Operating System Basics',
    level: 0,
    group: 'computing-basics',
    description: 'Processes vs threads, CPU scheduling, virtual memory and paging, filesystems, system calls, and the concurrency primitives every developer should understand.',
    difficulty: 'beginner',
    estimatedMinutes: 35,
    prerequisites: ['how-computers-work'],

    sections: [

        {
            title: 'Introduction',
            content: `<p>The <strong>operating system (OS)</strong> is the software layer between your programs and the
            hardware. It manages processes, memory, files, and devices, and provides the abstractions —
            processes, threads, files, sockets — that all application code relies on.</p>
            <p>Understanding the OS explains how programs run concurrently, why threads share bugs, how memory
            is protected between programs, and what actually happens when you open a file or make a network call.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>Processes vs threads and how they differ</li>
                <li>How the scheduler shares the CPU among many tasks</li>
                <li>Virtual memory, paging, and process isolation</li>
                <li>Filesystems and how files are accessed</li>
                <li>System calls — the boundary between user code and the kernel</li>
                <li>Core concurrency concepts and hazards</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>Process</h4>
            <p>An independent running program with its own isolated memory space. Processes cannot directly read
            each other's memory — the OS enforces isolation for security and stability.</p>
            <h4>Thread</h4>
            <p>A unit of execution within a process. Threads of the same process <em>share</em> memory (heap),
            which makes communication fast but introduces race conditions. Each thread has its own stack.</p>
            <h4>Scheduler</h4>
            <p>The kernel component that decides which thread runs on which core and for how long, creating the
            illusion of many tasks running simultaneously via rapid context switching.</p>
            <h4>Virtual Memory</h4>
            <p>Each process sees a private, contiguous address space. The OS maps these virtual addresses to
            physical RAM (and disk via paging), enabling isolation and using more memory than physically exists.</p>
            <h4>System Call</h4>
            <p>A controlled entry point into the kernel (e.g., read, write, open, fork). User code cannot touch
            hardware directly; it requests services via syscalls.</p>
            <h4>Kernel vs User Mode</h4>
            <p>The CPU runs in a privileged kernel mode (full hardware access) or restricted user mode. Syscalls
            transition from user to kernel mode safely.</p>`,
            mermaid: `graph TB
    subgraph Process A
        TA1[Thread 1]
        TA2[Thread 2]
        HA[Shared Heap A]
        TA1 --- HA
        TA2 --- HA
    end
    subgraph Process B
        TB1[Thread 1]
        HB[Shared Heap B]
        TB1 --- HB
    end
    OS[OS Kernel: scheduler, memory, I/O] --> ProcessA
    OS --> ProcessB`
        },
        {
            title: 'How It Works',
            content: `<p><strong>Context switching</strong> is how one CPU core runs many threads. When a thread's time
            slice expires (or it blocks on I/O), the scheduler saves its registers and state, then loads another
            thread's state. This happens thousands of times per second.</p>
            <p><strong>Virtual memory</strong> works via page tables: the CPU's MMU (Memory Management Unit) translates
            each virtual address to a physical one. If a page isn't in RAM, a <em>page fault</em> loads it from disk.</p>
            <p><strong>A system call flow</strong>: your code calls a library function &rarr; which issues a syscall
            instruction &rarr; CPU switches to kernel mode &rarr; kernel performs the operation &rarr; returns to user mode.</p>`,
            code: `// What looks like a simple call...
string text = File.ReadAllText("data.txt");

// ...triggers a chain of OS activity:
// 1. open()  syscall  -> kernel locates the file, returns a file descriptor
// 2. read()  syscall  -> kernel copies bytes from disk/cache into your buffer
// 3. close() syscall  -> kernel releases the descriptor
// Each syscall switches user -> kernel mode and back.`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Process and thread states managed by the scheduler:</p>`,
            mermaid: `stateDiagram-v2
    [*] --> Ready
    Ready --> Running: scheduler dispatches
    Running --> Ready: time slice expires
    Running --> Blocked: waits on I/O or lock
    Blocked --> Ready: I/O completes / lock acquired
    Running --> Terminated: finishes
    Terminated --> [*]`
        },
        {
            title: 'Implementation',
            content: `<p>How processes, threads, and async map to code:</p>`,
            tabs: [
                {
                    label: 'Threads (C#)',
                    code: `// Threads share heap memory -> need synchronization
private int _counter = 0;
private readonly object _lock = new();

void IncrementSafely()
{
    lock (_lock)          // mutual exclusion prevents a race condition
    {
        _counter++;       // read-modify-write must be atomic
    }
}

// Launch parallel work
Parallel.For(0, 1000, i => IncrementSafely());`,
                    language: 'csharp'
                },
                {
                    label: 'Async I/O (C#)',
                    code: `// Async frees the thread while waiting on I/O (a blocked syscall)
async Task<string> FetchAsync(HttpClient client, string url)
{
    // The thread is returned to the pool during the network wait,
    // rather than blocking — better scalability for I/O-bound work.
    return await client.GetStringAsync(url);
}`,
                    language: 'csharp'
                },
                {
                    label: 'Processes (shell)',
                    code: `# Each command runs as a separate process with isolated memory
$ ps aux            # list running processes
$ top               # live view of CPU/memory per process

# Pipes connect processes via the OS (stdout -> stdin)
$ cat log.txt | grep ERROR | wc -l`,
                    language: 'bash'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Match Concurrency Model to Workload</h4>
            <p>Use async I/O for I/O-bound work (network, disk) and threads/parallelism for CPU-bound work.
            Mixing them up wastes resources.</p>
            <h4>Do: Protect Shared State</h4>
            <p>Any data shared between threads needs synchronization (locks, concurrent collections, immutability)
            to prevent race conditions.</p>
            <h4>Do: Prefer Higher-Level Abstractions</h4>
            <p>Use thread pools, Task/async, and concurrent data structures rather than managing raw threads and
            locks manually.</p>
            <h4>Do: Minimize Lock Scope</h4>
            <p>Hold locks for the shortest time possible to reduce contention. Never do I/O while holding a lock.</p>`,
            callout: {
                type: 'tip',
                title: 'I/O-bound vs CPU-bound',
                text: 'I/O-bound tasks spend most time waiting (network, disk) — use async to free threads. CPU-bound tasks spend time computing — use parallelism across cores. Choosing wrong (e.g., threads for I/O) limits scalability.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Race Conditions on Shared State</h4>
            <p>Two threads reading-modifying-writing the same variable without synchronization produce
            nondeterministic, hard-to-reproduce bugs.</p>
            <h4>Mistake: Deadlocks</h4>
            <p>Two threads each holding a lock the other needs, waiting forever. Avoid by acquiring locks in a
            consistent order and minimizing nested locks.</p>
            <h4>Mistake: Blocking Async Code</h4>
            <p>Calling <code>.Result</code> or <code>.Wait()</code> on async code can deadlock and wastes threads.
            Use async all the way.</p>
            <h4>Mistake: Confusing Processes and Threads</h4>
            <p>Assuming threads are isolated like processes leads to shared-memory bugs. Threads share the heap;
            processes do not.</p>
            <h4>Mistake: Spawning Too Many Threads</h4>
            <p>Each thread costs ~1 MB of stack and scheduling overhead. Thousands of threads thrash the
            scheduler. Use a thread pool or async instead.</p>`,
            code: `// RACE CONDITION: unsynchronized shared counter
int counter = 0;
Parallel.For(0, 100000, i => counter++);   // counter++ is NOT atomic
// Result is unpredictable and usually < 100000

// FIX: atomic operation or lock
int counter2 = 0;
Parallel.For(0, 100000, i => Interlocked.Increment(ref counter2));  // correct`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>Web Servers</h4>
            <p>Handle thousands of concurrent connections using async I/O and thread pools rather than one thread
            per request — the foundation of scalability.</p>
            <h4>Databases</h4>
            <p>Manage concurrent transactions with locking and isolation — direct applications of OS concurrency
            concepts.</p>
            <h4>Containers</h4>
            <p>Docker/Kubernetes use OS features (namespaces, cgroups) to isolate processes and limit their
            resources — lightweight virtualization built on process isolation.</p>
            <h4>Mobile &amp; Desktop Apps</h4>
            <p>Keep the UI thread responsive by offloading work to background threads — a direct concurrency
            concern rooted in the OS model.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Processes vs threads — the key distinctions:</p>`,
            table: {
                headers: ['Aspect', 'Process', 'Thread'],
                rows: [
                    ['Memory', 'Isolated, private', 'Shared (heap) within process'],
                    ['Creation cost', 'High', 'Lower'],
                    ['Communication', 'IPC (pipes, sockets) — slower', 'Shared memory — fast'],
                    ['Crash impact', 'Isolated (one crash spares others)', 'Can crash whole process'],
                    ['Context switch', 'Expensive (swap address space)', 'Cheaper'],
                    ['Synchronization', 'Less needed (isolated)', 'Required for shared data'],
                    ['Use case', 'Isolation, security', 'Parallelism within an app']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>OS-level choices have major performance impact:</p>
            <h4>Context Switch Cost</h4>
            <p>Switching threads costs microseconds (saving/restoring state, cache effects). Too many runnable
            threads cause excessive switching and cache thrashing.</p>
            <h4>Async Scales I/O</h4>
            <p>For I/O-bound servers, async lets a few threads handle thousands of connections, because threads
            aren't blocked waiting. Thread-per-request hits limits fast.</p>
            <h4>Lock Contention</h4>
            <p>When many threads compete for one lock, they serialize and stall. Reduce contention with finer-grained
            locks, lock-free structures, or partitioning.</p>
            <h4>Page Faults</h4>
            <p>If a process's working set exceeds RAM, paging to disk ("thrashing") destroys performance — disk is
            millions of times slower than RAM.</p>`,
            callout: {
                type: 'warning',
                title: 'Threads Are Not Free',
                text: 'Each thread consumes ~1 MB stack plus scheduling overhead. Creating thousands of threads to handle concurrency is an anti-pattern; use a thread pool or async I/O so a small number of threads serve many tasks.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Concurrency bugs are notoriously hard to test because they are timing-dependent.</p>
            <h4>Stress &amp; Repeat</h4>
            <p>Run concurrent code many times under load to surface race conditions that appear only under specific
            interleavings.</p>
            <h4>Deterministic Where Possible</h4>
            <p>Design code to be testable by injecting synchronization points or using deterministic schedulers in
            tests. Prefer immutable data to avoid races entirely.</p>`,
            code: `// Stress test to expose a race condition
[Fact]
public void Counter_UnderConcurrency_StaysConsistent()
{
    var counter = new ThreadSafeCounter();
    Parallel.For(0, 100_000, _ => counter.Increment());
    Assert.Equal(100_000, counter.Value);   // fails if not thread-safe
}

// Run repeatedly in CI; nondeterministic failures reveal races.`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>OS concepts are core to backend and systems interviews:</p>
            <ul>
                <li><strong>Process vs thread</strong> is one of the most common fundamentals questions</li>
                <li><strong>Explain race conditions and deadlocks</strong> with concrete examples</li>
                <li><strong>Know I/O-bound vs CPU-bound</strong> and the right concurrency model for each</li>
                <li><strong>Describe virtual memory</strong> and why processes are isolated</li>
                <li><strong>Mention context switching cost</strong> when discussing thread counts</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Deadlock Conditions',
                text: 'Deadlock requires four conditions simultaneously (Coffman conditions): mutual exclusion, hold-and-wait, no preemption, and circular wait. Breaking any one prevents deadlock \u2014 commonly by enforcing a consistent lock acquisition order (breaks circular wait).'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Books</h4>
            <ul>
                <li><em>Operating System Concepts</em> by Silberschatz, Galvin, Gagne ("the dinosaur book")</li>
                <li><em>Operating Systems: Three Easy Pieces</em> (free online) by Arpaci-Dusseau</li>
                <li><em>Modern Operating Systems</em> by Andrew Tanenbaum</li>
            </ul>
            <h4>Online</h4>
            <ul>
                <li>OSTEP (ostep.org) — excellent free textbook</li>
                <li>MIT 6.S081 Operating System Engineering</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Process:</strong> isolated memory; <strong>Thread:</strong> shares heap within a process</li>
                <li><strong>Scheduler</strong> time-slices the CPU among threads via context switching</li>
                <li><strong>Virtual memory</strong> gives each process a private address space and enables isolation</li>
                <li><strong>System calls</strong> are the controlled boundary between user code and the kernel</li>
                <li><strong>I/O-bound \u2192 async; CPU-bound \u2192 parallelism</strong></li>
                <li><strong>Shared state needs synchronization;</strong> watch for race conditions and deadlocks</li>
                <li><strong>Interview signal:</strong> process vs thread, deadlock conditions, and concurrency model selection</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Reproduce and Fix a Race Condition</h4>
            <ol>
                <li>Write a shared counter incremented by many threads <em>without</em> synchronization</li>
                <li>Run it repeatedly and observe the inconsistent total</li>
                <li>Fix it three ways: a lock, Interlocked, and a concurrent/immutable approach</li>
                <li>Then induce a deadlock with two locks acquired in opposite orders</li>
                <li>Fix the deadlock by enforcing a consistent lock ordering</li>
            </ol>`,
            code: `// 1. Reproduce the race (see Common Mistakes)
// 2-3. Fix with: lock(_obj){...}, Interlocked.Increment, ConcurrentDictionary
// 4. Deadlock: Thread1 locks A then B; Thread2 locks B then A
// 5. Fix: always lock A before B everywhere`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is the key memory difference between a process and a thread?<br/>
                    <em>A: Processes have isolated, private memory; threads within a process share the heap (but each
                    has its own stack).</em></li>
                <li><strong>Q:</strong> What causes a race condition?<br/>
                    <em>A: Multiple threads accessing shared mutable state concurrently without synchronization, where
                    the outcome depends on timing/interleaving.</em></li>
                <li><strong>Q:</strong> When should you use async I/O vs parallel threads?<br/>
                    <em>A: Async for I/O-bound work (waiting on network/disk) to free threads; parallelism for CPU-bound
                    work to use multiple cores.</em></li>
                <li><strong>Q:</strong> Name one way to prevent deadlocks.<br/>
                    <em>A: Acquire locks in a consistent global order (breaks the circular-wait condition); also minimize
                    nested locks and avoid holding locks during I/O.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'Compare mutex, semaphore, and spinlock \u2014 when would you use each, and what is priority inversion?',
            difficulty: 'hard',
            answer: `<p>All are synchronization primitives, but with different semantics and costs:</p>
            <ul>
                <li><strong>Mutex (mutual exclusion lock):</strong> one owner at a time; the owner must release it.
                A waiting thread <em>blocks</em> (is descheduled). Use for protecting a critical section.</li>
                <li><strong>Semaphore:</strong> a counter allowing up to N concurrent holders (a binary semaphore = 1).
                Not owned by a thread \u2014 any thread can signal. Use to limit concurrency (e.g., N DB connections) or
                for signaling between threads.</li>
                <li><strong>Spinlock:</strong> a thread <em>busy-waits</em> (spins) instead of blocking. Cheap if the
                lock is held very briefly (no context-switch cost), terrible if held long (wastes CPU). Used in
                kernels and ultra-low-latency code.</li>
            </ul>
            <p><strong>Priority inversion:</strong> a high-priority thread waits on a lock held by a low-priority
            thread, which is itself preempted by a medium-priority thread \u2014 so the high-priority thread is
            effectively blocked by the medium one. Solved with <strong>priority inheritance</strong> (the low-priority
            holder temporarily inherits the high priority until it releases the lock).</p>`,
            explanation: 'A mutex is a single key to a room \u2014 you wait outside (sleep) until it\u2019s free. A semaphore is N keys (limit how many enter). A spinlock is repeatedly jiggling the door handle (burning energy) instead of sitting down \u2014 only worth it if the wait is tiny.',
            code: `// Semaphore to cap concurrency (e.g., max 5 concurrent calls)
private readonly SemaphoreSlim _gate = new(5);
async Task CallApiAsync() {
    await _gate.WaitAsync();
    try { /* at most 5 here at once */ }
    finally { _gate.Release(); }
}

// Mutex/lock for a critical section
private readonly object _lock = new();
void Update() { lock (_lock) { /* one thread at a time */ } }`,
            language: 'csharp',
            bestPractices: ['Use a mutex/lock for critical sections; a semaphore to limit concurrency', 'Avoid spinlocks in application code (busy-waiting wastes CPU)', 'Keep critical sections short; never do I/O while holding a lock'],
            commonMistakes: ['Using a spinlock for a long-held lock (CPU burn)', 'Releasing a semaphore more times than acquired', 'Ignoring priority inversion in real-time systems'],
            interviewTip: 'Anchor on the key distinctions: ownership (mutex owned, semaphore not), counting (semaphore N), and blocking vs spinning. Bonus points for explaining priority inversion + inheritance.',
            followUp: ['Why is a spinlock sometimes faster than a mutex?', 'How does a semaphore differ from a condition variable?'],
            seniorPerspective: 'In application code I almost always reach for the highest-level primitive that fits \u2014 a lock for mutual exclusion, SemaphoreSlim to throttle concurrency (like limiting outbound API calls), and concurrent collections to avoid explicit locking entirely. Spinlocks and hand-tuned primitives belong in the kernel or measured hot paths; using them in business logic is usually a premature optimization that adds risk.'
        },
        {
            question: 'Explain how virtual memory paging works, including the TLB, page faults, and thrashing.',
            difficulty: 'hard',
            answer: `<p>Virtual memory divides each process\u2019s address space into fixed-size <strong>pages</strong>,
            mapped to physical <strong>frames</strong> via per-process <strong>page tables</strong>. The CPU\u2019s MMU
            translates virtual to physical addresses on every access.</p>
            <ul>
                <li><strong>TLB (Translation Lookaside Buffer):</strong> a small cache of recent page-table
                translations. A TLB hit makes translation fast; a TLB miss requires walking the page table (slower).</li>
                <li><strong>Page fault:</strong> when an accessed page isn\u2019t in physical RAM. The OS traps, loads the
                page from disk (or allocates it), updates the page table, and resumes \u2014 a "minor" fault is cheap,
                a "major" fault hitting disk is very expensive (~ms).</li>
                <li><strong>Thrashing:</strong> when the working set exceeds physical RAM, the system spends most of
                its time paging to/from disk instead of doing useful work \u2014 performance collapses.</li>
            </ul>
            <p>Page replacement algorithms (LRU approximations like the clock algorithm) decide which page to evict
            when RAM is full.</p>`,
            explanation: 'Virtual memory is like a librarian giving each reader their own catalog (page table) that maps "book #5" to a real shelf. The TLB is the librarian\u2019s memory of recent lookups. A page fault is fetching a book from deep storage. Thrashing is when too many readers need too many stored books and the librarian does nothing but run to storage and back.',
            bestPractices: ['Keep a process\u2019s hot working set within RAM to avoid major page faults', 'Be aware that memory-mapped files and large allocations interact with paging', 'Access memory with locality to maximize TLB hits'],
            commonMistakes: ['Assuming all memory access is uniform cost (TLB miss + page fault vary hugely)', 'Allocating far beyond RAM and triggering thrashing', 'Ignoring that a "memory" access can secretly hit disk'],
            interviewTip: 'Walk the translation path (virtual -> TLB -> page table -> frame) and distinguish minor vs major page faults. Mentioning thrashing as a working-set-exceeds-RAM phenomenon signals depth.',
            followUp: ['What is the working-set model?', 'How does the clock (second-chance) page-replacement algorithm work?'],
            seniorPerspective: 'When a service mysteriously slows to a crawl under load, thrashing (or GC pressure) is high on my suspect list \u2014 the symptom is high disk/page-fault activity with the CPU mostly idle, waiting on memory. The fix is usually reducing the working set (smaller caches, streaming instead of loading everything) or adding RAM, not adding CPU. Understanding paging is what lets you read that signature correctly instead of misdiagnosing it as a CPU problem.'
        },
        {
            question: 'What is the difference between a process and a thread?',
            difficulty: 'easy',
            answer: `<p>A <strong>process</strong> is an independent program with its own isolated memory space. A
            <strong>thread</strong> is a unit of execution within a process; threads of the same process share that
            process's heap memory but each has its own stack.</p>
            <ul>
                <li>Processes are isolated — one crashing doesn't directly affect another</li>
                <li>Threads share memory, enabling fast communication but requiring synchronization</li>
                <li>Creating a process is more expensive than creating a thread</li>
            </ul>`,
            explanation: 'A process is like a separate house (its own rooms, walls, address). Threads are people inside one house sharing the same rooms — they cooperate easily but can bump into each other (race conditions).',
            bestPractices: ['Use processes for isolation/security, threads for parallel work within an app', 'Synchronize shared data between threads'],
            commonMistakes: ['Assuming threads are isolated like processes', 'Ignoring synchronization on shared state'],
            interviewTip: 'Lead with the memory-isolation distinction — it is the crux of the answer and explains every other difference.',
            followUp: ['Why do threads need synchronization but processes usually do not?', 'What is inter-process communication?']
        },
        {
            question: 'What is a deadlock and how do you prevent it?',
            difficulty: 'medium',
            answer: `<p>A <strong>deadlock</strong> is when two or more threads are each waiting for a resource the other
            holds, so none can proceed — they wait forever.</p>
            <p>Deadlock requires four conditions (Coffman) simultaneously: mutual exclusion, hold-and-wait, no
            preemption, and circular wait. Preventing any one prevents deadlock. The most practical technique is to
            <strong>acquire locks in a consistent global order</strong>, which eliminates circular wait. Other
            tactics: use lock timeouts, avoid nested locks, and prefer lock-free/immutable designs.</p>`,
            explanation: 'Two people each grab one chopstick and refuse to let go until they have both — neither can eat. If everyone agrees to always pick up the left chopstick first, the cycle is broken.',
            code: `// Deadlock risk: opposite lock orders
// Thread 1: lock(A) -> lock(B)
// Thread 2: lock(B) -> lock(A)

// Fix: consistent ordering everywhere
lock (A) { lock (B) { /* work */ } }   // all threads acquire A before B`,
            language: 'csharp',
            bestPractices: ['Establish and document a global lock ordering', 'Minimize nested locks and lock scope', 'Never perform I/O while holding a lock', 'Consider lock-free structures or immutability'],
            commonMistakes: ['Acquiring multiple locks in inconsistent orders', 'Holding locks during long operations or callbacks'],
            interviewTip: 'Name the four Coffman conditions, then give the practical fix (consistent lock ordering breaks circular wait). Concrete > abstract.',
            followUp: ['What is a livelock?', 'How does a database detect and resolve deadlocks?'],
            seniorPerspective: 'In production I prefer designs that avoid multi-lock scenarios entirely — message passing, immutable snapshots, or single-owner concurrency — because consistent lock ordering is hard to enforce across a large codebase as it evolves. When locks are unavoidable I keep them coarse, short, and ordered, and I add deadlock detection (lock timeouts with logging) so we find violations in testing rather than production.'
        },
        {
            question: 'Explain virtual memory and why it is important.',
            difficulty: 'medium',
            answer: `<p><strong>Virtual memory</strong> gives each process its own private, contiguous address space.
            The OS and CPU's MMU translate these virtual addresses to physical RAM locations via page tables. Pages
            not currently needed can be stored on disk and loaded on demand (paging).</p>
            <p>It is important because it provides: <strong>isolation</strong> (a process can't read another's
            memory — security and stability), <strong>abstraction</strong> (programs see simple contiguous memory
            regardless of physical fragmentation), and <strong>over-commit</strong> (the system can offer more
            address space than physical RAM by paging to disk).</p>`,
            explanation: 'Each process gets its own "virtual building" with apartments numbered 1..N. The OS secretly maps those apartment numbers to real rooms scattered across the physical building (or temporarily into storage). No tenant can wander into another building.',
            bestPractices: ['Keep a process working set within RAM to avoid paging (thrashing)', 'Understand that page faults to disk are extremely costly'],
            commonMistakes: ['Assuming virtual addresses equal physical addresses', 'Ignoring that excessive memory use triggers slow disk paging'],
            interviewTip: 'Emphasize the three benefits — isolation, abstraction, over-commit — and mention page faults to show you understand the cost side.',
            followUp: ['What is a page fault?', 'What is thrashing and how do you detect it?']
        },
        {
            question: 'What is a system call, and why is the user-mode/kernel-mode boundary important?',
            difficulty: 'medium',
            answer: `<p>A <strong>system call (syscall)</strong> is the controlled mechanism by which user-space code
            requests a privileged service from the OS kernel — opening a file, allocating memory, sending on a
            socket, creating a process. User code cannot touch hardware directly; it must ask the kernel.</p>
            <p>The CPU runs in two privilege levels:</p>
            <ul>
                <li><strong>User mode:</strong> restricted — cannot execute privileged instructions or access
                hardware/other processes' memory directly.</li>
                <li><strong>Kernel mode:</strong> full access to hardware and all memory.</li>
            </ul>
            <p>A syscall triggers a controlled transition (a trap) from user to kernel mode, the kernel validates
            the request and performs it, then returns control. This boundary is what enforces <strong>isolation,
            security, and stability</strong>: a buggy or malicious program cannot crash the machine or read other
            processes' data because every privileged action is mediated and checked by the kernel.</p>`,
            explanation: 'User mode is a customer at a bank counter; kernel mode is the vault. You cannot walk into the vault yourself — you hand a slip to the teller (syscall), who checks it and fetches what you asked for. The barrier keeps everyone\u2019s money safe.',
            code: `// A simple file read in C# is several syscalls under the hood
string text = File.ReadAllText("data.txt");
// open()  -> trap to kernel: locate file, return a descriptor
// read()  -> trap to kernel: copy bytes from disk/cache into the buffer
// close() -> trap to kernel: release the descriptor
// Each trap is a user -> kernel -> user transition (with real overhead).`,
            language: 'csharp',
            bestPractices: ['Batch I/O to reduce the number of syscalls (each transition has overhead)', 'Use buffered streams rather than byte-at-a-time reads/writes', 'Prefer async I/O so threads are not blocked across the kernel boundary'],
            commonMistakes: ['Assuming a library call is "free" when it actually issues expensive syscalls', 'Reading/writing one byte at a time, multiplying syscall overhead', 'Confusing user-mode CPU time with kernel-mode (system) time when profiling'],
            interviewTip: 'Tie the two privilege modes to the syscall trap, then explain that this boundary is exactly what enforces process isolation and security — that connection is the senior-level insight.',
            followUp: ['Why are syscalls more expensive than ordinary function calls?', 'How do mechanisms like io_uring reduce syscall overhead?'],
            seniorPerspective: 'When I profile an I/O-heavy service and see high "system" (kernel) CPU time, the usual culprit is too many fine-grained syscalls — unbuffered reads, chatty socket writes. The fix is to batch and buffer so each kernel crossing carries more work. Understanding that the user/kernel transition is a real, measurable cost (not just an abstraction) is what turns a vague "it is slow" into a targeted optimization.',
            architectPerspective: 'The user/kernel split is the foundational security boundary of the OS, and modern isolation tech builds on it: containers (namespaces, cgroups), sandboxes, and VMs all extend this principle. At a system level you design around minimizing crossings (batching, zero-copy, async) while respecting that the boundary is non-negotiable for multi-tenant safety.'
        },

        {
            question: 'Compare deadlock detection versus deadlock prevention strategies. When would you choose one over the other in a production system?',

            difficulty: 'hard',

            answer: `<p><strong>Deadlock prevention</strong> eliminates deadlock by design — you structure the system so at least one of the four Coffman conditions can never hold. The most common technique is <strong>lock ordering</strong> (eliminates circular wait). Others include: acquiring all locks at once (eliminates hold-and-wait), or using try-lock with timeout (eliminates no-preemption). Prevention has zero runtime detection cost but constrains design.</p>
            <p><strong>Deadlock detection</strong> allows deadlocks to form, then discovers and resolves them. A detection algorithm periodically builds a wait-for graph and looks for cycles. On detection, one participant is chosen as a victim and rolled back. This is how databases (SQL Server, PostgreSQL) handle transaction deadlocks.</p>
            <p>Choose <strong>prevention</strong> for application-level locks where you control the ordering, and for systems where a deadlock means a hard hang with no automatic recovery. Choose <strong>detection</strong> for database/resource managers where transactions can be safely rolled back, and where imposing a global order would be impractical across independently-developed components.</p>`,

            explanation: 'Prevention is banning U-turns on every road so circular routes are impossible — safe but constraining. Detection is letting traffic flow freely but having a helicopter spot gridlocks and ordering one car to reverse. Databases use the helicopter; application code prefers banning U-turns.',

            code: `// PREVENTION: consistent lock ordering (eliminates circular wait)
// Always acquire locks in a defined global order (e.g., by ID):
void Transfer(Account from, Account to, decimal amount)
{
    var first = from.Id < to.Id ? from : to;
    var second = from.Id < to.Id ? to : from;
    lock (first.Lock) {
        lock (second.Lock) {
            from.Balance -= amount;
            to.Balance += amount;
        }
    }
}

// PREVENTION: try-lock with timeout (eliminates indefinite waiting)
bool acquired = Monitor.TryEnter(resource, TimeSpan.FromSeconds(5));
if (!acquired) throw new TimeoutException("Could not acquire lock");
try { /* work */ } finally { Monitor.Exit(resource); }

// DETECTION: SQL Server detects deadlocks automatically
// It picks the cheaper transaction as victim and rolls it back.
// Your code must handle the SqlException (error 1205) and retry:
catch (SqlException ex) when (ex.Number == 1205)
{
    // Deadlock victim — retry the transaction
    await RetryTransactionAsync();
}`,

            language: 'csharp',

            bestPractices: [
                'Use lock ordering (prevention) for application-level mutexes where you control all lock sites',
                'Rely on database deadlock detection and implement retry logic for DB transactions',
                'Add lock-acquisition timeouts as a safety net even when ordering is in place',
                'Log deadlock events for post-mortem analysis and ordering fixes'
            ],

            commonMistakes: [
                'Assuming database deadlock detection means you do not need to handle the error (you must retry)',
                'Enforcing lock ordering in one module but violating it in another (partial ordering is not safe)',
                'Using detection in application code without a rollback mechanism (detection without recovery is useless)',
                'Setting lock timeouts too short, causing spurious failures under normal contention'
            ],

            interviewTip: 'Contrast the two approaches with a clear criterion: prevention constrains design but is zero-cost at runtime; detection is flexible but requires a recovery mechanism (rollback + retry). Then give the database deadlock as the canonical detection example.',

            followUp: [
                'What algorithm does a database use to detect deadlock cycles?',
                'How does the Banker\'s algorithm prevent deadlock in resource allocation?',
                'What is a livelock and how does it differ from a deadlock?'
            ]
        },

        {
            question: 'Explain virtual memory page replacement algorithms (LRU, Clock/Second-Chance, and Working Set). What are the trade-offs and how do they affect application performance?',

            difficulty: 'hard',

            answer: `<p>When physical RAM is full and a new page must be loaded, the OS must choose a <strong>victim page</strong> to evict. The goal is to evict the page least likely to be needed soon, minimizing future page faults:</p>
            <ul>
                <li><strong>LRU (Least Recently Used):</strong> evicts the page accessed longest ago. Optimal in theory but expensive to implement exactly (requires tracking access time for every page). Used approximately via aging counters.</li>
                <li><strong>Clock (Second-Chance):</strong> a practical LRU approximation. Pages are arranged in a circular list with a "referenced" bit. The clock hand sweeps: if the bit is set, clear it and move on (second chance); if unset, evict that page. Efficient because it only checks one bit per page.</li>
                <li><strong>Working Set:</strong> defines the set of pages a process has accessed within a recent time window. Pages outside the working set are eligible for eviction. This model prevents thrashing by ensuring each process keeps enough pages in RAM to function.</li>
            </ul>
            <p>The trade-off is between eviction accuracy and implementation cost. True LRU is accurate but expensive (O(n) scan or expensive hardware). Clock is cheap (O(1) amortized) with slightly worse eviction choices. The working-set model adds per-process fairness but requires tuning the window size.</p>`,

            explanation: 'Page replacement is like a library with limited shelf space deciding which books to send to storage. LRU checks the checkout date of every book (accurate but slow). Clock just checks if the book has a "recently touched" sticker and removes the first unstickered one it finds (fast approximation). Working Set says "keep each reader\'s active pile on the shelf — only return books nobody is currently reading."',

            code: `// Application-level impact: design for good working-set behavior
// BAD: random access across a huge array — working set exceeds RAM
var hugeArray = new int[500_000_000]; // ~2 GB
var random = new Random();
for (int i = 0; i < 10_000_000; i++)
    sum += hugeArray[random.Next(hugeArray.Length)]; // page faults galore

// GOOD: sequential or localized access — working set stays small
for (int i = 0; i < hugeArray.Length; i++)
    sum += hugeArray[i]; // sequential = prefetchable, minimal page faults

// Monitoring page fault behavior:
// Windows: Process Explorer -> Page Faults column
// Linux: perf stat -e page-faults ./myapp
// .NET: dotnet-counters monitor --counters System.Runtime

// Practical: streaming large files instead of loading entirely
using var stream = File.OpenRead("huge.bin");
var buffer = new byte[4096]; // process one page at a time
while (await stream.ReadAsync(buffer) > 0)
    Process(buffer); // constant working set regardless of file size`,

            language: 'csharp',

            bestPractices: [
                'Design data access patterns for locality — sequential access minimizes page faults',
                'Stream large data sets rather than loading entirely into memory',
                'Monitor page fault rates to detect working-set-exceeds-RAM situations (thrashing)',
                'Use memory-mapped files for random access to large data — let the OS page efficiently'
            ],

            commonMistakes: [
                'Loading entire large files into memory when only small portions are accessed',
                'Random access patterns over data structures larger than available RAM',
                'Ignoring page fault metrics when diagnosing mysterious slowdowns under load',
                'Assuming "more cache" fixes thrashing (the fix is reducing working set or adding RAM)'
            ],

            interviewTip: 'Describe Clock as "LRU approximation with a single reference bit and circular scan" — that is the one-sentence explanation interviewers want. Then connect to thrashing: when the working set exceeds RAM, no algorithm helps because every eviction causes a near-immediate fault.',

            followUp: [
                'What is Bélády\'s anomaly and which algorithms are immune to it?',
                'How does Linux\'s page replacement differ from the classic Clock algorithm?',
                'What is the relationship between page replacement and GC (generational collection)?'
            ]
        }
    ]
});
