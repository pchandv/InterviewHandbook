'use strict';

PageData.register('fullstack-state', {
  title: 'State Management (End-to-End)',
  description: 'Comprehensive patterns for managing state across client and server boundaries, including caching, real-time sync, and conflict resolution.',
  sections: [
    {
      title: 'Introduction',
      content: `
        <p>State management in full-stack applications extends far beyond a Redux store or a database table. 
        Modern systems must reconcile <strong>client state</strong> (UI interactions, form data, navigation) with 
        <strong>server state</strong> (persisted data, shared resources, real-time feeds) while handling network 
        latency, failures, and concurrent modifications.</p>
        <p>This topic covers the patterns architects use to build responsive, resilient applications that feel 
        instant to users while maintaining data consistency across distributed systems.</p>
      `
    },
    {
      title: 'Core Concepts',
      content: `
        <h3>Client State vs Server State</h3>
        <p><strong>Client state</strong> is ephemeral, owned by the UI: selected tabs, open modals, form inputs 
        before submission. <strong>Server state</strong> is authoritative, shared across users: user profiles, 
        order history, inventory counts. The critical insight is that most frontend state is actually a 
        <em>cache</em> of server state, and should be treated accordingly.</p>

        <h3>Optimistic Updates</h3>
        <p>Rather than waiting for server confirmation, optimistic updates immediately reflect changes in the UI 
        and roll back on failure. This reduces perceived latency from 200-500ms to near-zero for common operations.</p>

        <h3>Cache Invalidation Strategies</h3>
        <ul>
          <li><strong>Stale-While-Revalidate (SWR):</strong> Serve cached data immediately, then fetch fresh data 
          in the background. The UI updates seamlessly when new data arrives.</li>
          <li><strong>Time-To-Live (TTL):</strong> Cache entries expire after a fixed duration. Simple but can 
          serve stale data within the window.</li>
          <li><strong>Event-driven invalidation:</strong> Server pushes invalidation signals via WebSocket/SSE 
          when underlying data changes.</li>
        </ul>

        <h3>Real-Time Sync Mechanisms</h3>
        <ul>
          <li><strong>WebSocket:</strong> Full-duplex, persistent connection. Ideal for high-frequency updates 
          (chat, gaming, live dashboards).</li>
          <li><strong>Server-Sent Events (SSE):</strong> Unidirectional server-to-client. Simpler, auto-reconnects, 
          works through HTTP/2 multiplexing.</li>
          <li><strong>Long Polling:</strong> Fallback for environments where WebSocket is blocked.</li>
        </ul>

        <h3>Conflict Resolution</h3>
        <ul>
          <li><strong>Last-Write-Wins (LWW):</strong> Simplest strategy; latest timestamp wins. Risks data loss 
          on concurrent edits.</li>
          <li><strong>CRDTs (Conflict-free Replicated Data Types):</strong> Mathematically guaranteed convergence 
          without coordination. Used in collaborative editing (Yjs, Automerge).</li>
          <li><strong>Operational Transform (OT):</strong> Server-mediated conflict resolution (Google Docs model).</li>
        </ul>
      `
    },
    {
      title: 'State Flow Architecture',
      content: `
        <p>The following diagram illustrates how state flows between client and server layers in a modern 
        full-stack application:</p>
        <div class="mermaid-diagram">
          <pre class="mermaid">
graph TB
    subgraph Client["Client Layer"]
        UI[UI Components]
        LS[Local State<br/>Forms, UI flags]
        SC[Server Cache<br/>React Query / SWR]
        OQ[Optimistic Queue]
    end

    subgraph Transport["Transport Layer"]
        REST[REST / GraphQL]
        WS[WebSocket]
        SSE[SSE Channel]
    end

    subgraph Server["Server Layer"]
        API[API Gateway]
        SVC[Domain Services]
        DB[(Database)]
        MQ[Message Queue]
        CACHE[(Redis Cache)]
    end

    UI --> LS
    UI --> SC
    SC -->|fetch/mutate| REST
    SC -->|subscribe| WS
    SC -->|listen| SSE
    OQ -->|retry on fail| REST
    REST --> API
    WS --> API
    API --> SVC
    SVC --> DB
    SVC --> CACHE
    SVC -->|publish events| MQ
    MQ -->|notify| WS
    MQ -->|push| SSE
          </pre>
        </div>
      `
    },
    {
      title: 'Implementation',
      content: `
        <h3>React Query / TanStack Query Pattern (TypeScript)</h3>
        <pre><code class="language-typescript">// Optimistic update with rollback
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todo: Todo) =>
      fetch(\`/api/todos/\${todo.id}\`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !todo.completed }),
      }).then(res => res.json()),

    // Optimistic update
    onMutate: async (todo) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // Snapshot previous value for rollback
      const previous = queryClient.getQueryData&lt;Todo[]&gt;(['todos']);

      // Optimistically update cache
      queryClient.setQueryData&lt;Todo[]&gt;(['todos'], (old) =>
        old?.map(t => t.id === todo.id
          ? { ...t, completed: !t.completed }
          : t
        )
      );

      return { previous };
    },

    // Rollback on error
    onError: (_err, _todo, context) => {
      queryClient.setQueryData(['todos'], context?.previous);
    },

    // Refetch after success or error to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}</code></pre>

        <h3>NgRx + Signals Approach (TypeScript / Angular)</h3>
        <pre><code class="language-typescript">// Signal-based state with server sync
import { computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

interface CacheEntry&lt;T&gt; {
  data: T;
  timestamp: number;
  stale: boolean;
}

export class TodoStore {
  private http = inject(HttpClient);
  private readonly STALE_TIME = 30_000; // 30 seconds

  // Server state as resource
  private todosResource = rxResource({
    loader: () => this.http.get&lt;Todo[]&gt;('/api/todos'),
  });

  // Derived signals
  readonly todos = computed(() => this.todosResource.value() ?? []);
  readonly isLoading = this.todosResource.isLoading;

  // Local optimistic state overlay
  private optimisticUpdates = signal&lt;Map&lt;string, Partial&lt;Todo&gt;&gt;&gt;(new Map());

  // Merged view: server state + optimistic patches
  readonly mergedTodos = computed(() => {
    const serverTodos = this.todos();
    const patches = this.optimisticUpdates();

    return serverTodos.map(todo => {
      const patch = patches.get(todo.id);
      return patch ? { ...todo, ...patch } : todo;
    });
  });

  async toggleTodo(todo: Todo): Promise&lt;void&gt; {
    const patch = { completed: !todo.completed };

    // Apply optimistic update
    this.optimisticUpdates.update(map => {
      const next = new Map(map);
      next.set(todo.id, patch);
      return next;
    });

    try {
      await firstValueFrom(
        this.http.patch(\`/api/todos/\${todo.id}\`, patch)
      );
      this.todosResource.reload();
    } catch {
      // Rollback optimistic update
      this.optimisticUpdates.update(map => {
        const next = new Map(map);
        next.delete(todo.id);
        return next;
      });
    }
  }
}</code></pre>

        <h3>Offline-First with Background Sync (TypeScript)</h3>
        <pre><code class="language-typescript">// IndexedDB queue for offline mutations
class OfflineMutationQueue {
  private db: IDBDatabase;

  async enqueue(mutation: PendingMutation): Promise&lt;void&gt; {
    const tx = this.db.transaction('mutations', 'readwrite');
    await tx.objectStore('mutations').add({
      ...mutation,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      retryCount: 0,
    });
  }

  async processQueue(): Promise&lt;void&gt; {
    const tx = this.db.transaction('mutations', 'readonly');
    const mutations = await tx.objectStore('mutations').getAll();

    for (const mutation of mutations) {
      try {
        await this.executeMutation(mutation);
        await this.removeMutation(mutation.id);
      } catch (error) {
        if (mutation.retryCount >= 3) {
          await this.moveToDeadLetter(mutation);
        } else {
          await this.incrementRetry(mutation.id);
        }
      }
    }
  }

  // Listen for online event
  initialize(): void {
    window.addEventListener('online', () => this.processQueue());

    // Also process on a timer for reliability
    setInterval(() => {
      if (navigator.onLine) this.processQueue();
    }, 30_000);
  }
}</code></pre>
      `
    },
    {
      title: 'Common Mistakes',
      content: `
        <ul>
          <li><strong>Treating server state as client state:</strong> Storing API responses in local component 
          state causes stale data, duplicated fetching logic, and inconsistency across components viewing the 
          same resource.</li>
          <li><strong>No rollback on optimistic failures:</strong> Implementing optimistic updates without proper 
          error handling leaves the UI in an inconsistent state when mutations fail.</li>
          <li><strong>Over-fetching with real-time:</strong> Subscribing to WebSocket channels for all data 
          instead of selectively subscribing based on what the user is viewing.</li>
          <li><strong>Ignoring race conditions:</strong> Multiple in-flight requests can resolve out of order. 
          Always use request IDs or abort controllers to prevent stale responses overwriting fresh data.</li>
          <li><strong>Cache TTL without invalidation:</strong> Relying solely on TTL means users see stale data 
          for the entire cache window. Combine TTL with event-driven invalidation for critical data.</li>
          <li><strong>CRDTs everywhere:</strong> Using complex conflict resolution when simple last-write-wins 
          or server-authoritative patterns are sufficient for the use case.</li>
        </ul>
      `
    },
    {
      title: 'Interview Tips',
      type: 'callout',
      content: `
        <div class="callout callout-tip">
          <h4>Interview Tips</h4>
          <ul>
            <li>Always clarify requirements first: "How critical is real-time consistency? Can we tolerate 
            eventual consistency for this feature?"</li>
            <li>Mention the <strong>CAP theorem</strong> trade-offs when discussing distributed state — 
            you cannot have consistency and availability during a network partition.</li>
            <li>Draw the state flow diagram showing where the "source of truth" lives for each piece of data.</li>
            <li>Discuss <strong>observable cost</strong>: what does it cost when state is wrong? A stale 
            "likes" count is cheap; a stale inventory count causes overselling.</li>
            <li>Reference concrete tools: React Query, SWR, Apollo Client cache, NgRx ComponentStore, 
            Zustand — show you have hands-on experience.</li>
            <li>For senior/architect roles, discuss operational concerns: how do you monitor cache hit rates? 
            How do you debug stale data issues in production?</li>
          </ul>
        </div>
      `
    },
    {
      title: 'Key Takeaways',
      content: `
        <ul>
          <li>Separate client state (UI concerns) from server state (cached remote data) in your architecture.</li>
          <li>Optimistic updates with proper rollback make applications feel instant while maintaining correctness.</li>
          <li>Stale-While-Revalidate is the default caching strategy for most read-heavy applications.</li>
          <li>Choose real-time sync mechanism based on update frequency: SSE for occasional pushes, WebSocket 
          for high-frequency bidirectional communication.</li>
          <li>Conflict resolution strategy depends on data criticality: LWW for low-stakes, CRDTs or OT for 
          collaborative editing, server-authoritative for financial data.</li>
          <li>Offline-first requires a mutation queue, conflict detection, and a clear sync protocol.</li>
        </ul>
      `
    }
  ],

  questions: [
    {
      id: 'fs-state-q1',
      level: 'junior',
      title: 'What is the difference between client state and server state?',
      answer: `
        <p><strong>Client state</strong> is data owned and managed entirely within the browser/client application. 
        It includes UI state (modal open/closed, selected tab, form inputs before submission, scroll position) 
        and exists only for the current session.</p>
        <p><strong>Server state</strong> is data that lives on the server and is shared across users/sessions. 
        Examples: user profiles, product listings, order history. When displayed in the client, it is a 
        <em>cache</em> of the server's authoritative data.</p>
        <p>The key architectural insight: most "state management" bugs come from treating server state as client 
        state — storing API responses in local variables and manually keeping them in sync rather than using a 
        proper cache layer (React Query, SWR, Apollo) that handles staleness, refetching, and deduplication.</p>
      `
    },
    {
      id: 'fs-state-q2',
      level: 'mid',
      title: 'How would you implement optimistic updates with proper error handling?',
      answer: `
        <p>Optimistic updates follow a four-step pattern:</p>
        <ol>
          <li><strong>Snapshot:</strong> Save the current state before mutation for potential rollback.</li>
          <li><strong>Optimistic apply:</strong> Immediately update the local cache/UI with the expected result.</li>
          <li><strong>Execute:</strong> Send the mutation to the server.</li>
          <li><strong>Reconcile:</strong> On success, optionally refetch to get server-computed fields. On failure, 
          rollback to the snapshot and show an error notification.</li>
        </ol>
        <pre><code class="language-typescript">// With TanStack Query
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const snapshot = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old) =>
      old.map(t => t.id === newTodo.id ? newTodo : t)
    );
    return { snapshot };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['todos'], context.snapshot);
    toast.error('Update failed, changes reverted');
  },
  onSettled: () => queryClient.invalidateQueries(['todos']),
});</code></pre>
        <p>Critical considerations: handle concurrent optimistic updates (queue them), prevent stale rollbacks 
        (use version vectors), and always invalidate after settlement to ensure eventual consistency.</p>
      `
    },
    {
      id: 'fs-state-q3',
      level: 'mid',
      title: 'Explain Stale-While-Revalidate and when you would NOT use it.',
      answer: `
        <p><strong>Stale-While-Revalidate (SWR)</strong> serves cached data immediately (even if stale) while 
        fetching fresh data in the background. When the fresh data arrives, the cache is updated and the UI 
        re-renders with the new data.</p>
        <p>Benefits: zero-latency reads, graceful degradation, reduced perceived loading time.</p>
        <p><strong>When NOT to use SWR:</strong></p>
        <ul>
          <li><strong>Financial data:</strong> Showing a stale account balance, then updating it, causes user 
          anxiety and potential incorrect decisions.</li>
          <li><strong>Inventory/booking:</strong> Showing stale availability leads to failed purchases.</li>
          <li><strong>Security-sensitive:</strong> Permission changes must be immediately reflected.</li>
          <li><strong>Collaborative editing:</strong> Users need to see the latest version to avoid conflicts.</li>
        </ul>
        <p>For these cases, prefer <strong>fetch-then-render</strong> (show loading state until fresh data 
        arrives) or <strong>real-time subscriptions</strong> that push updates immediately.</p>
      `
    },
    {
      id: 'fs-state-q4',
      level: 'senior',
      title: 'How would you design a real-time sync system for a collaborative document editor?',
      answer: `
        <p>A collaborative editor requires three core components:</p>
        <ol>
          <li><strong>Local-first editing:</strong> All edits are applied locally with zero latency. The document 
          model must support concurrent modifications.</li>
          <li><strong>Conflict resolution:</strong> Use CRDTs (Yjs, Automerge) or Operational Transform. CRDTs are 
          preferred for decentralized architectures as they guarantee convergence without a central server.</li>
          <li><strong>Transport + Awareness:</strong> WebSocket for low-latency bidirectional sync. Include cursor 
          positions and selection awareness for collaboration UX.</li>
        </ol>
        <pre><code class="language-typescript">// CRDT-based collaborative state (using Yjs concepts)
class CollaborativeDocument {
  private doc: Y.Doc;
  private provider: WebsocketProvider;
  private awareness: Awareness;

  constructor(roomId: string) {
    this.doc = new Y.Doc();
    this.provider = new WebsocketProvider(WS_URL, roomId, this.doc);
    this.awareness = this.provider.awareness;

    // Share cursor position
    this.awareness.setLocalState({
      user: { name: currentUser.name, color: currentUser.color },
      cursor: null,
    });
  }

  getText(): Y.Text {
    return this.doc.getText('content');
  }

  // All operations are conflict-free by construction
  insert(index: number, text: string): void {
    this.getText().insert(index, text);
    // Automatically synced to all connected peers
  }
}</code></pre>
        <p>Architecture decisions: persistence layer (snapshot + operation log), presence service (who is 
        online), permission model (real-time revocation), and graceful degradation (offline queue with 
        merge on reconnect).</p>
      `
    },
    {
      id: 'fs-state-q5',
      level: 'senior',
      title: 'Compare Last-Write-Wins, vector clocks, and CRDTs for conflict resolution.',
      answer: `
        <table>
          <tr><th>Strategy</th><th>Consistency</th><th>Complexity</th><th>Use Case</th></tr>
          <tr><td>Last-Write-Wins</td><td>Eventual (lossy)</td><td>Trivial</td><td>Non-critical data, preferences</td></tr>
          <tr><td>Vector Clocks</td><td>Detects conflicts</td><td>Moderate</td><td>Flags conflicts for manual resolution</td></tr>
          <tr><td>CRDTs</td><td>Eventual (lossless)</td><td>High</td><td>Collaborative editing, distributed counters</td></tr>
        </table>
        <p><strong>LWW</strong> uses timestamps to pick a winner. Simple but silently drops concurrent updates. 
        Acceptable for user settings or social media likes.</p>
        <p><strong>Vector clocks</strong> track causal history. They detect when two updates are concurrent 
        (neither happened-before the other) but require application logic to resolve the conflict — often 
        pushing the decision to the user ("which version do you want to keep?").</p>
        <p><strong>CRDTs</strong> are data structures designed so that all concurrent operations commute — 
        they can be applied in any order and converge to the same result. Examples: G-Counter (grow-only counter), 
        LWW-Register, OR-Set (observed-remove set), RGA (replicated growable array for text).</p>
        <p>Trade-off: CRDTs have higher memory overhead (tombstones, version metadata) and limited operation 
        expressiveness. Not every business operation maps cleanly to a CRDT.</p>
      `
    },
    {
      id: 'fs-state-q6',
      level: 'architect',
      title: 'Design the state synchronization architecture for an offline-first mobile app with eventual consistency.',
      answer: `
        <p>An offline-first architecture requires four layers:</p>
        <ol>
          <li><strong>Local persistence:</strong> All data stored in IndexedDB/SQLite. The app works fully 
          offline against this local store.</li>
          <li><strong>Mutation queue:</strong> All write operations are logged as immutable events in a local 
          outbox. Each event has a client-generated ID, timestamp, and vector clock.</li>
          <li><strong>Sync engine:</strong> When online, processes the outbox FIFO. Handles conflicts using 
          domain-specific rules (not generic LWW).</li>
          <li><strong>Server reconciliation:</strong> Server applies events, detects conflicts via vector clocks, 
          and returns a resolution stream.</li>
        </ol>
        <pre><code class="language-typescript">interface SyncProtocol {
  // Client sends pending mutations
  push(events: LocalEvent[]): Promise&lt;SyncResult&gt;;
  // Server sends changes since last sync point
  pull(lastSyncId: string): Promise&lt;RemoteEvent[]&gt;;
  // Bidirectional for real-time when online
  subscribe(channel: string): Observable&lt;RemoteEvent&gt;;
}

interface SyncResult {
  accepted: string[];        // Event IDs accepted
  rejected: ConflictInfo[];  // Events that conflicted
  serverEvents: RemoteEvent[]; // Changes to apply locally
}</code></pre>
        <p>Key design decisions: sync granularity (document-level vs field-level), conflict resolution per 
        entity type, compaction strategy for the event log, and bandwidth optimization (delta sync vs full 
        state transfer). Monitor sync lag and conflict rate as operational metrics.</p>
      `
    },
    {
      id: 'fs-state-q7',
      level: 'architect',
      title: 'How would you handle cache invalidation across multiple services in a microservices architecture?',
      answer: `
        <p>Cache invalidation in microservices requires a <strong>publish-subscribe invalidation bus</strong> 
        combined with <strong>versioned cache keys</strong>:</p>
        <pre><code class="language-csharp">// C# - Event-driven cache invalidation
public class CacheInvalidationService : IHostedService
{
    private readonly IDistributedCache _cache;
    private readonly IMessageBus _bus;

    public async Task StartAsync(CancellationToken ct)
    {
        await _bus.SubscribeAsync&lt;EntityChangedEvent&gt;(async (evt) =>
        {
            // Invalidate specific keys
            var keys = BuildCacheKeys(evt.EntityType, evt.EntityId);
            foreach (var key in keys)
                await _cache.RemoveAsync(key, ct);

            // Invalidate dependent aggregates
            var dependents = await GetDependentCacheKeys(evt);
            foreach (var dep in dependents)
                await _cache.RemoveAsync(dep, ct);
        });
    }

    private IEnumerable&lt;string&gt; BuildCacheKeys(string type, string id)
    {
        yield return $"{type}:{id}";
        yield return $"{type}:{id}:details";
        yield return $"{type}:list:v{GetListVersion(type)}";
    }
}</code></pre>
        <p>Patterns to combine:</p>
        <ul>
          <li><strong>Write-through:</strong> Update cache on write (consistent but slower writes).</li>
          <li><strong>Write-behind:</strong> Update cache immediately, async persist (faster but risky).</li>
          <li><strong>Cache-aside with events:</strong> Each service manages its own cache; domain events 
          trigger cross-service invalidation via message bus.</li>
        </ul>
        <p>Guard against thundering herd: use probabilistic early expiration, request coalescing, and 
        circuit breakers on cache-miss paths. Monitor cache hit ratio per service — below 80% indicates 
        either too-aggressive invalidation or incorrect TTL configuration.</p>
      `
    },
    {
      id: 'fs-state-q8',
      level: 'senior',
      title: 'How do you handle optimistic updates that fail and need to be rolled back in the UI?',
      answer: `
        <p><strong>Optimistic updates</strong> show the user an immediate result (assume success) while the actual 
        operation happens asynchronously. When the operation fails, the UI must gracefully roll back to the previous 
        state without confusing or frustrating the user.</p>
        <h4>Implementation Pattern:</h4>
        <ol>
          <li><strong>Snapshot previous state</strong> before applying the optimistic update. Store it in a 
          local variable, undo stack, or state management (NgRx: store previous state in action metadata).</li>
          <li><strong>Apply optimistic update immediately</strong> — update the UI state as if the operation succeeded. 
          User sees instant feedback.</li>
          <li><strong>Fire the async operation</strong> (HTTP request, WebSocket message).</li>
          <li><strong>On success:</strong> Reconcile with server response (server may return slightly different data, 
          e.g., server-generated ID or timestamp). Replace optimistic data with authoritative server data.</li>
          <li><strong>On failure:</strong> Restore the snapshot, show a non-intrusive error notification (toast/snackbar), 
          and optionally offer retry. The UI "snaps back" to the true state.</li>
        </ol>
        <h4>Advanced Considerations:</h4>
        <ul>
          <li><strong>Multiple pending operations:</strong> If user makes 3 rapid changes and the 2nd fails, you must 
          roll back the 2nd while keeping the 1st (succeeded) and 3rd (still pending). Requires per-operation tracking, 
          not a single "previous state" snapshot.</li>
          <li><strong>List operations:</strong> Optimistic add/remove from a list is tricky — if the add fails but the 
          user has scrolled away, removing the item may be confusing. Use temporary visual indicators (grayed out, "saving..." badge).</li>
          <li><strong>Conflict resolution:</strong> Another user may have modified the same resource. On conflict (409), 
          show both versions and let the user decide, rather than silently overwriting.</li>
        </ul>
        <p><strong>NgRx pattern:</strong> Dispatch an optimistic action that updates state immediately, with a 
        corresponding effect that calls the API. On success, dispatch a confirm action. On failure, dispatch a 
        rollback action carrying the previous state snapshot.</p>
      `
    }
  ]
});
