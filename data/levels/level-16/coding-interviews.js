/* ═══════════════════════════════════════════════════════════════════
   CODING INTERVIEWS — Level 16: Career & Interview Mastery
   Problem-solving framework (UMPIRE), patterns, communication,
   Big-O, edge cases, and preparation strategy.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('coding-interviews', {

    title: 'Coding Interviews',
    level: 16,
    group: 'interview-prep',
    description: 'Acing coding/algorithm interviews: a problem-solving framework (UMPIRE), common patterns, communication, complexity analysis, edge cases, and an efficient preparation strategy.',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    prerequisites: [],

    sections: [

        {
            title: 'Introduction',
            content: `<p>The <strong>coding interview</strong> asks you to solve an algorithmic problem in code, usually
            in 30-45 minutes, while explaining your thinking. It assesses problem-solving, data-structure/algorithm
            knowledge, coding ability, communication, and how you handle edge cases — not whether you've memorized the
            solution.</p>
            <p>Success comes from a repeatable approach, recognizing patterns, communicating throughout, and
            efficient preparation — not from grinding thousands of random problems.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>A problem-solving framework (UMPIRE)</li>
                <li>Common patterns that cover most problems</li>
                <li>Communicating while you solve</li>
                <li>Big-O analysis and edge cases</li>
                <li>An efficient preparation strategy</li>
                <li>What to do when you're stuck</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<h4>A Problem-Solving Framework (UMPIRE)</h4>
            <p><strong>U</strong>nderstand the problem, <strong>M</strong>atch it to known patterns, <strong>P</strong>lan
            an approach, <strong>I</strong>mplement, <strong>R</strong>eview/test, <strong>E</strong>valuate
            complexity. A repeatable structure prevents flailing.</p>
            <h4>Pattern Recognition</h4>
            <p>Most problems map to a manageable set of patterns: two pointers, sliding window, hashing, BFS/DFS,
            binary search, dynamic programming, heap/priority queue, backtracking, etc. Recognizing the pattern is
            half the battle.</p>
            <h4>Communication</h4>
            <p>Think out loud: state your understanding, options, chosen approach, and trade-offs. The interviewer
            scores your process and can nudge you if you verbalize where you are.</p>
            <h4>Complexity Analysis (Big-O)</h4>
            <p>Always state and justify the time and space complexity of your solution, and discuss whether it can be
            improved.</p>
            <h4>Edge Cases</h4>
            <p>Empty input, single element, duplicates, negatives, overflow, very large input. Identifying and
            handling these is a strong signal.</p>
            <h4>Correctness First, Then Optimize</h4>
            <p>A working brute-force solution you can then optimize beats a half-finished "optimal" attempt. Get
            something correct, state its complexity, then improve.</p>`,
            mermaid: `flowchart LR
    U[Understand<br/>+ clarify + examples] --> M[Match<br/>to a pattern]
    M --> P[Plan<br/>approach + complexity]
    P --> I[Implement<br/>clean code]
    I --> R[Review/Test<br/>edge cases]
    R --> E[Evaluate<br/>Big-O + optimize]
    style U fill:#dbeafe,color:#1e293b`
        },
        {
            title: 'How It Works',
            content: `<p>Working a problem with UMPIRE in the interview:</p>
            <ol>
                <li><strong>Understand:</strong> restate the problem, ask clarifying questions, and confirm with
                examples (including edge cases). Never start coding immediately.</li>
                <li><strong>Match:</strong> "this looks like a sliding-window / graph / DP problem because..."</li>
                <li><strong>Plan:</strong> outline the approach in plain language, state expected complexity, and get
                the interviewer's buy-in before coding.</li>
                <li><strong>Implement:</strong> write clean, readable code, narrating as you go.</li>
                <li><strong>Review/Test:</strong> walk through with an example and edge cases; fix bugs.</li>
                <li><strong>Evaluate:</strong> state final time/space complexity and discuss possible improvements.</li>
            </ol>`,
            code: `// UMPIRE in action: "Find two numbers that sum to a target."
//
// Understand: input = array + target; return indices of the two numbers;
//   clarify: exactly one solution? can I reuse an element? negatives?
// Match: "lookups for a complement -> a hash map fits."
// Plan: "one pass; for each x, check if (target - x) is in the map; else
//   store x. Expected O(n) time, O(n) space." (confirm with interviewer)
// Implement:
function twoSum(nums, target) {
  const seen = new Map();               // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];                            // edge case: no solution
}
// Review: test [2,7,11,15], target 9 -> [0,1]; empty -> []; dup values.
// Evaluate: O(n) time, O(n) space; better than the O(n^2) brute force.`,
            language: 'javascript'
        },
        {
            title: 'Visual Diagram',
            content: `<p>The most common patterns and the problem signals that point to them:</p>`,
            mermaid: `flowchart TB
    Sorted[Sorted array / pair search] --> TP[Two Pointers / Binary Search]
    Substr[Contiguous subarray/substring] --> SW[Sliding Window]
    Lookup[Need fast lookup / counts] --> Hash[Hash Map / Set]
    Graph[Grid / nodes + edges / levels] --> BFS[BFS / DFS]
    Optimal[Overlapping subproblems / choices] --> DP[Dynamic Programming]
    TopK[Top-K / running min-max] --> Heap[Heap / Priority Queue]
    Combos[All combinations / permutations] --> BT[Backtracking]`
        },
        {
            title: 'Implementation',
            content: `<p>Pattern templates you can adapt to many problems:</p>`,
            tabs: [
                {
                    label: 'Sliding Window',
                    code: `// Pattern: longest/shortest contiguous subarray/substring meeting a condition
// Signal: "contiguous", "substring", "window", "at most K"
function longestUniqueSubstring(s) {
  const seen = new Map();
  let start = 0, best = 0;
  for (let end = 0; end < s.length; end++) {
    const c = s[end];
    if (seen.has(c) && seen.get(c) >= start) {
      start = seen.get(c) + 1;        // shrink window past the duplicate
    }
    seen.set(c, end);
    best = Math.max(best, end - start + 1);
  }
  return best;                         // O(n) time, O(min(n, alphabet)) space
}`,
                    language: 'javascript'
                },
                {
                    label: 'BFS (graph/grid)',
                    code: `// Pattern: shortest path / level-order on a grid or graph
// Signal: "shortest", "fewest steps", "levels", grid of cells
function shortestPath(grid, start, target) {
  const queue = [[start, 0]];          // [node, distance]
  const visited = new Set([key(start)]);
  while (queue.length) {
    const [node, dist] = queue.shift();
    if (equal(node, target)) return dist;
    for (const next of neighbors(node, grid)) {
      if (!visited.has(key(next))) {
        visited.add(key(next));
        queue.push([next, dist + 1]);
      }
    }
  }
  return -1;                           // unreachable; O(V+E) time and space
}`,
                    language: 'javascript'
                },
                {
                    label: 'When Stuck',
                    code: `// Don't freeze - have a recovery playbook (narrate all of this):
//
// 1. Re-read / restate the problem; try a concrete small example by hand.
// 2. Start with brute force: ANY correct solution. State its complexity.
//    ("O(n^2) works; let me see if I can do better.")
// 3. Look for repeated work or sorted structure -> hashing / two pointers /
//    binary search often improve it.
// 4. Think about the data structure that makes the bottleneck cheap
//    (map for lookups, heap for top-k, set for seen).
// 5. Ask a clarifying question or think aloud - the interviewer may nudge.
//
// A working brute force + clear path to optimize > a stuck "optimal" attempt.`,
                    language: 'javascript'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Clarify Before Coding</h4>
            <p>Restate the problem, ask about constraints/edge cases, and confirm with examples. Coding the wrong
            problem fast is the worst outcome.</p>
            <h4>Do: Communicate Continuously</h4>
            <p>Narrate your understanding, approach, and trade-offs. Get buy-in on your plan before implementing so
            you don't code 30 minutes in the wrong direction.</p>
            <h4>Do: Start with Brute Force, Then Optimize</h4>
            <p>Get a correct solution and state its complexity, then improve it. Correctness first; a partial
            "optimal" attempt scores worse than a complete simple one.</p>
            <h4>Do: State Complexity</h4>
            <p>Always analyze time and space (Big-O) and discuss whether it can be improved — interviewers expect it.</p>
            <h4>Do: Test with Edge Cases</h4>
            <p>Walk through your code with a normal case and edge cases (empty, single, duplicates, negatives) to
            catch bugs before the interviewer does.</p>
            <h4>Do: Write Clean Code</h4>
            <p>Good names, small functions, no obvious bugs. Readability counts — they imagine you on their team.</p>`,
            callout: {
                type: 'tip',
                title: 'A Working Solution Beats a Perfect Plan',
                text: 'Get SOMETHING correct on the board \u2014 even brute force \u2014 state its complexity, then optimize. A complete O(n\u00b2) solution you can analyze and improve scores far better than an incomplete "optimal" attempt that doesn\u2019t run. Correctness first, optimization second.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Coding Before Understanding</h4>
            <p>Jumping into code without clarifying constraints/examples, then realizing you solved the wrong
            problem. Always understand and confirm first.</p>
            <h4>Mistake: Silent Coding</h4>
            <p>Solving quietly denies the interviewer your reasoning and the chance to nudge you. Narrate throughout.</p>
            <h4>Mistake: Chasing Optimal Immediately</h4>
            <p>Getting stuck trying to find the perfect solution and writing nothing. Start with brute force; a
            working solution is the foundation.</p>
            <h4>Mistake: Ignoring Edge Cases</h4>
            <p>Not handling empty input, single element, duplicates, or overflow — and not testing. These are easy
            points lost.</p>
            <h4>Mistake: Not Stating Complexity</h4>
            <p>Finishing without analyzing Big-O. Interviewers almost always want it; volunteer it.</p>
            <h4>Mistake: Inefficient Prep (Grinding Randomly)</h4>
            <p>Doing hundreds of random problems without learning patterns. Study patterns and a curated set
            (e.g., Blind 75 / NeetCode) deeply instead.</p>`,
            code: `// Anti-pattern: dive straight into code on a vague prompt, get it wrong:
// (starts coding immediately) ... 20 minutes later: "oh, the array can be
//  unsorted and have duplicates?" -> rewrites everything under time pressure.
//
// Better: 2 minutes up front -
//  "Is the array sorted? Can there be duplicates or negatives? One solution
//   guaranteed? What should I return if none?" -> then plan -> then code.
// Cheap questions prevent expensive rewrites.`,
            language: 'javascript'
        },
        {
            title: 'Real-World Applications',
            content: `<h4>The Tech Screen &amp; Onsite</h4>
            <p>Coding rounds are standard at most software companies (phone screen + onsite). They're often the first
            gate; strong performance is necessary to reach the rest of the loop.</p>
            <h4>Pattern Skills Transfer</h4>
            <p>The patterns (hashing for lookups, BFS/DFS for traversal, sliding window for ranges, DP for
            optimization) genuinely appear in real work — parsing, search, scheduling, caching, graph problems.</p>
            <h4>Communication Habits</h4>
            <p>The think-out-loud, clarify-first, test-your-work habits the interview rewards are exactly the
            behaviors of effective engineers in code review and pairing.</p>
            <h4>Preparation Culture</h4>
            <p>Curated lists (Blind 75, NeetCode 150) and pattern-based study have largely replaced brute-force
            problem grinding as the efficient path \u2014 reflecting the industry's pattern-centric view.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>Common patterns, their signals, and typical complexity:</p>`,
            table: {
                headers: ['Pattern', 'Problem signal', 'Typical complexity'],
                rows: [
                    ['Hash Map/Set', 'Fast lookups, counts, "seen"', 'O(n) time, O(n) space'],
                    ['Two Pointers', 'Sorted array, pairs, in-place', 'O(n) time, O(1) space'],
                    ['Sliding Window', 'Contiguous subarray/substring', 'O(n) time'],
                    ['Binary Search', 'Sorted, "find/min/max that..."', 'O(log n) time'],
                    ['BFS/DFS', 'Graph/grid, paths, levels', 'O(V+E) time'],
                    ['Dynamic Programming', 'Overlapping subproblems, optimal', 'O(n*m) typical'],
                    ['Heap', 'Top-K, running min/max', 'O(n log k) time'],
                    ['Backtracking', 'All combinations/permutations', 'Exponential (pruned)']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Both your solution's performance and your prep efficiency matter:</p>
            <h4>Know Complexity Cold</h4>
            <p>Be fluent in the Big-O of common operations (array index O(1), hash lookup O(1), sort O(n log n),
            BST/heap O(log n)) so you can analyze and compare approaches instantly.</p>
            <h4>Optimize the Bottleneck</h4>
            <p>Improving from O(n²) to O(n) usually means removing repeated work — often via a hash map (trade space
            for time) or exploiting sorted structure (two pointers/binary search).</p>
            <h4>Space-Time Trade-offs</h4>
            <p>Many optimizations trade memory for speed (caching/memoization, hash maps). State the trade-off
            explicitly when you make it.</p>
            <h4>Prep Efficiency</h4>
            <p>Pattern-based study of a curated set (Blind 75 / NeetCode 150) deeply beats randomly grinding 500
            problems shallowly. Quality and pattern coverage over raw volume.</p>`,
            callout: {
                type: 'info',
                title: 'Study Patterns, Not Problems',
                text: 'There are thousands of problems but only ~15 core patterns. Learning to recognize the pattern (sliding window, BFS, DP, two pointers...) lets you solve unseen problems, whereas memorizing specific solutions doesn\u2019t generalize. A curated, pattern-organized list (NeetCode 150) studied deeply is far more efficient than random grinding.'
            }
        },
        {
            title: 'Testing',
            content: `<p>Test your solution in the interview, and practice realistically before it.</p>
            <h4>Trace Through Examples</h4>
            <p>After coding, walk through your code line-by-line with a normal example and edge cases (empty, single,
            duplicates). Catch bugs yourself before the interviewer points them out.</p>
            <h4>Practice Under Real Conditions</h4>
            <p>Solve problems on a timer, out loud, on a plain editor/whiteboard (not an IDE with autocomplete) — the
            real conditions. Do mock interviews with a peer.</p>
            <h4>Review and Pattern-Tag</h4>
            <p>After each practice problem, note which pattern it used and what tripped you up. Build pattern
            recognition deliberately rather than just chasing a solved count.</p>`,
            code: `// Trace your code before saying "done" - dry-run with cases:
// twoSum([2,7,11,15], 9)
//   i=0 x=2 need=7 not in map -> map{2:0}
//   i=1 x=7 need=2 in map -> return [0,1]   correct
// Edge cases to verify:
//   [] -> []           (empty)
//   [3,3], 6 -> [0,1]  (duplicates)
//   [1,2], 10 -> []    (no solution)
// Verbalize this trace - it demonstrates rigor and catches off-by-one bugs.`,
            language: 'javascript'
        },
        {
            title: 'Interview Tips',
            content: `<p>The highest-leverage coding-round tips:</p>
            <ul>
                <li><strong>Clarify first, code second</strong> — confirm constraints and examples</li>
                <li><strong>Use a framework (UMPIRE)</strong> and narrate throughout</li>
                <li><strong>Brute force first,</strong> state complexity, then optimize</li>
                <li><strong>Always state Big-O</strong> and test with edge cases</li>
                <li><strong>Study patterns, not random problems</strong> (NeetCode 150 / Blind 75)</li>
                <li><strong>When stuck, narrate your recovery</strong> — small example, brute force, find repeated work</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Being Stuck Is Not Failure',
                text: 'Interviewers expect you to get stuck \u2014 how you recover is the signal. Narrate your thinking, try a concrete small example, fall back to brute force, look for repeated work, and respond to hints. A candidate who reasons through being stuck out loud often scores better than one who silently produces a memorized answer.'
            }
        },
        {
            title: 'Further Reading',
            content: `<h4>Resources</h4>
            <ul>
                <li><em>Cracking the Coding Interview</em> by Gayle Laakmann McDowell</li>
                <li>NeetCode (neetcode.io) — NeetCode 150, pattern-organized</li>
                <li>Blind 75 (curated essential problems list)</li>
                <li><em>Grokking the Coding Interview</em> (pattern-based)</li>
                <li>LeetCode (practice platform) — use with a curated list, not randomly</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Use a framework (UMPIRE):</strong> Understand, Match, Plan, Implement, Review, Evaluate</li>
                <li><strong>Clarify first;</strong> never code the wrong problem fast</li>
                <li><strong>Recognize patterns</strong> (~15 cover most problems) rather than memorizing solutions</li>
                <li><strong>Brute force first, then optimize;</strong> correctness before cleverness</li>
                <li><strong>Always state Big-O</strong> and test with edge cases</li>
                <li><strong>Communicate continuously;</strong> recover from being stuck out loud</li>
                <li><strong>Prep efficiently:</strong> study patterns via a curated list, under real conditions</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Practice the Full Loop on One Problem</h4>
            <ol>
                <li>Pick a medium problem (e.g., "longest substring without repeating characters")</li>
                <li>Apply UMPIRE out loud: clarify, identify the pattern (sliding window), plan + state complexity</li>
                <li>Implement cleanly while narrating; then dry-run with normal + edge cases</li>
                <li>State final time/space complexity and discuss any improvement</li>
                <li>Tag the pattern and note what was hard; then solve 2 more problems of the same pattern</li>
                <li>Do a timed mock with a peer asking follow-ups ("what if the input is huge / streamed?")</li>
            </ol>`,
            code: `// Run UMPIRE end-to-end out loud, then reflect:
// [ ] Clarified constraints + examples before coding?
// [ ] Identified the pattern?
// [ ] Stated the plan + complexity before implementing?
// [ ] Narrated throughout?
// [ ] Tested edge cases (empty/single/duplicates)?
// [ ] Stated final Big-O + possible optimization?
// Then drill the SAME pattern on 2-3 more problems to cement recognition.`,
            language: 'javascript'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What should you do before writing any code?<br/>
                    <em>A: Understand and clarify the problem \u2014 restate it, ask about constraints and edge cases, confirm
                    with examples, and (ideally) state your planned approach and complexity before implementing.</em></li>
                <li><strong>Q:</strong> Why start with a brute-force solution?<br/>
                    <em>A: A correct working solution (even O(n\u00b2)) is the foundation; you can state its complexity and then
                    optimize. A complete simple solution scores better than an incomplete "optimal" attempt.</em></li>
                <li><strong>Q:</strong> Why study patterns instead of grinding many random problems?<br/>
                    <em>A: Thousands of problems reduce to ~15 core patterns. Recognizing the pattern lets you solve unseen
                    problems; memorizing specific solutions doesn't generalize. A curated, pattern-organized set studied
                    deeply is far more efficient.</em></li>
                <li><strong>Q:</strong> What's the best way to handle getting stuck?<br/>
                    <em>A: Narrate your recovery: try a concrete small example, fall back to brute force, look for repeated
                    work or sorted structure to optimize, and respond to hints. How you recover is itself a strong signal.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'Walk me through your approach to solving a coding interview problem.',
            difficulty: 'easy',
            answer: `<p>I use a structured framework (UMPIRE) and communicate throughout:</p>
            <ol>
                <li><strong>Understand:</strong> restate the problem, ask clarifying questions (constraints, edge
                cases), and confirm with examples — before any code.</li>
                <li><strong>Match:</strong> identify the likely pattern (hashing, sliding window, BFS, DP...).</li>
                <li><strong>Plan:</strong> outline the approach in words and state expected complexity; get buy-in.</li>
                <li><strong>Implement:</strong> write clean code while narrating.</li>
                <li><strong>Review:</strong> dry-run with normal and edge cases; fix bugs.</li>
                <li><strong>Evaluate:</strong> state final time/space complexity and possible improvements.</li>
            </ol>
            <p>Throughout, I think out loud so the interviewer follows my reasoning and can nudge me.</p>`,
            explanation: 'It is like a pilot\u2019s checklist: a repeatable sequence keeps you from skipping a critical step (like clarifying the problem) under the pressure of the moment.',
            bestPractices: ['Clarify before coding', 'Identify the pattern', 'State the plan + complexity first', 'Narrate and test edge cases'],
            commonMistakes: ['Coding immediately', 'Solving silently', 'Skipping complexity analysis'],
            interviewTip: 'Having a named framework (UMPIRE or your own) signals preparation and keeps you calm and structured under pressure.',
            followUp: ['What do you do if you get stuck?', 'How do you decide which pattern applies?']
        },
        {
            question: 'How do you analyze and improve the time complexity of a solution?',
            difficulty: 'medium',
            answer: `<p><strong>Analyze</strong> by counting how the work grows with input size: look at loops (nested loops
            often mean O(n²)), recursion (branching factor and depth), and the cost of operations inside them (a hash
            lookup is O(1), a sort is O(n log n)). State both time and space in Big-O.</p>
            <p><strong>Improve</strong> by finding and removing repeated work:</p>
            <ul>
                <li><strong>Use a hash map/set</strong> to make lookups O(1) instead of scanning (trades space for
                time) — often turns O(n²) into O(n).</li>
                <li><strong>Exploit sorted structure</strong> with two pointers or binary search (O(log n) lookups).</li>
                <li><strong>Memoize/DP</strong> to avoid recomputing overlapping subproblems.</li>
                <li><strong>Use the right data structure</strong> (heap for top-k, etc.).</li>
            </ul>
            <p>State the trade-off (usually space for time) when you optimize.</p>`,
            explanation: 'Optimizing is usually about not doing the same work twice: if your nested loop keeps re-searching for something, a hash map "remembers" it so each lookup is instant \u2014 turning quadratic into linear.',
            code: `// O(n^2) brute force: for each pair, check sum -> nested loops
// O(n)  optimized: one pass + hash map of complements (trade space for time)
// Recognizing "repeated lookup" -> hashing is the most common O(n^2)->O(n) win.`,
            language: 'javascript',
            bestPractices: ['State time AND space Big-O', 'Find repeated work to eliminate', 'Trade space for time with hashing/memoization', 'Exploit sorted input (two pointers/binary search)'],
            commonMistakes: ['Not stating complexity', 'Optimizing without identifying the bottleneck', 'Ignoring space complexity'],
            interviewTip: 'Name the specific lever ("I can drop this to O(n) with a hash map, trading O(n) space") rather than vaguely saying "I can optimize it."',
            followUp: ['When is the space cost of a hash map not worth it?', 'How do you analyze recursive complexity?']
        },
        {
            question: 'What do you do when you get stuck on a problem during the interview?',
            difficulty: 'hard',
            answer: `<p>Getting stuck is expected — the recovery is what's scored. My playbook (narrated out loud):</p>
            <ol>
                <li><strong>Re-anchor:</strong> re-read/restate the problem and work a small concrete example by hand;
                this often reveals the structure or the pattern.</li>
                <li><strong>Fall back to brute force:</strong> get <em>any</em> correct solution and state its
                complexity. A working O(n²) is a foundation and buys time/credit.</li>
                <li><strong>Look for repeated work or structure:</strong> can a hash map make lookups O(1)? Is the
                input sorted (two pointers/binary search)? Are there overlapping subproblems (DP)?</li>
                <li><strong>Reach for the right data structure:</strong> map (lookups), set (seen), heap (top-k),
                stack/queue (order) — matching the bottleneck.</li>
                <li><strong>Engage the interviewer:</strong> verbalize where I'm stuck and what I'm considering; ask a
                clarifying question. They often nudge — and responding well to hints is a positive signal.</li>
            </ol>
            <p>The key is to keep reasoning visibly and make progress (brute force -> optimize), rather than freezing
            silently chasing the perfect solution.</p>`,
            explanation: 'Being stuck is like a maze: panicking and standing still gets you nowhere, but methodically trying paths (small example, brute force, look for shortcuts) and thinking aloud lets the interviewer see your navigation \u2014 and sometimes hand you a clue.',
            bestPractices: ['Narrate your recovery process', 'Work a concrete small example', 'Get brute force working first', 'Look for repeated work / sorted structure', 'Engage the interviewer and use hints'],
            commonMistakes: ['Freezing silently', 'Refusing to write brute force while chasing optimal', 'Ignoring interviewer hints', 'Giving up'],
            interviewTip: 'Say your recovery out loud: "Let me try a small example... ok, brute force would be O(n\u00b2)... can I avoid re-scanning? a hash map would..." Visible structured recovery often scores higher than a silently-recalled answer.',
            followUp: ['How do you respond to a hint without it looking like you needed it?', 'When do you decide brute force is good enough to stop?'],
            seniorPerspective: 'The most important reframe I give candidates is that the interview is not testing whether you instantly know the answer \u2014 it is testing how you think when you don\u2019t. So when I am stuck I deliberately externalize my process: restate the problem, try a tiny example, write the brute force and analyze it, then hunt for the repeated work to eliminate. That narration does two things \u2014 it demonstrates exactly the reasoning the interviewer wants to see, and it opens the door for them to give a hint, which a silent candidate never gets. A thoughtful, communicative "stuck" beats a lucky, silent "solved" almost every time.'
        }
    ,
        {
            question: 'How do you approach a coding interview problem using a framework like UMPIRE?',
            difficulty: 'medium',
            answer: `<p><strong>UMPIRE</strong> gives a repeatable structure: <strong>U</strong>nderstand, <strong>M</strong>atch, <strong>P</strong>lan, <strong>I</strong>mplement, <strong>R</strong>eview, <strong>E</strong>valuate.</p>
            <ul>
                <li><strong>Understand</strong> \u2014 restate the problem, clarify inputs/outputs, ask about constraints and edge cases.</li>
                <li><strong>Match</strong> \u2014 recognize the pattern (two pointers, sliding window, BFS/DFS, hashing, DP).</li>
                <li><strong>Plan</strong> \u2014 outline the approach in words/pseudocode and confirm with the interviewer before coding.</li>
                <li><strong>Implement</strong> \u2014 write clean code while narrating.</li>
                <li><strong>Review</strong> \u2014 trace through with an example, check edge cases.</li>
                <li><strong>Evaluate</strong> \u2014 state time/space complexity and possible optimizations.</li>
            </ul>`,
            explanation: 'It is a pre-flight checklist for coding: pilots don\u2019t just start the engines, they run the list. UMPIRE stops you from coding before you understand the problem \u2014 the most common crash.',
            bestPractices: ['Clarify the problem and constraints before writing any code', 'Confirm your plan with the interviewer before implementing', 'Narrate your thinking continuously', 'State complexity and edge cases proactively at the end'],
            commonMistakes: ['Coding immediately without clarifying requirements', 'Silent problem-solving (interviewer gets no signal)', 'Ignoring edge cases (empty, null, overflow, duplicates)', 'Not stating time/space complexity'],
            interviewTip: 'The two biggest score-movers are clarifying before coding and thinking out loud. A framework like UMPIRE keeps you from freezing and shows structured problem-solving.',
            followUp: ['What are the most common algorithm patterns to know?', 'How do you handle a problem you don\u2019t immediately recognize?', 'How important is finishing vs approach?'],
            seniorPerspective: 'I treat the interviewer as a pair-programming partner: I clarify, propose an approach, and check in before coding. Communication and a clean approach often matter more than reaching the optimal solution, especially at senior level.',
            architectPerspective: 'Coding rounds probe how you decompose problems and communicate, not trivia. The same Understand\u2192Plan\u2192Review discipline that solves a LeetCode problem is what makes someone reliable on real, ambiguous engineering work.'
        },
        {
            question: 'What should you do when you get stuck on a coding problem in an interview?',
            difficulty: 'medium',
            answer: `<p>Being stuck is expected; how you handle it is the signal. Have a recovery strategy:</p>
            <ul>
                <li><strong>Think out loud</strong> \u2014 verbalize where you\u2019re stuck so the interviewer can nudge and see your reasoning.</li>
                <li><strong>Start with brute force</strong> \u2014 a working naive solution beats a broken clever one; optimize after.</li>
                <li><strong>Work a concrete example</strong> \u2014 trace a small input by hand to surface the pattern.</li>
                <li><strong>Simplify</strong> \u2014 solve a smaller/relaxed version, then generalize.</li>
                <li><strong>Use hints gracefully</strong> \u2014 take the nudge, don\u2019t resist it; collaboration is being assessed.</li>
            </ul>`,
            explanation: 'Getting stuck is like missing a turn while driving with someone who knows the way \u2014 narrate where you are, accept directions, and keep moving. Silently freezing is the only real failure.',
            bestPractices: ['Verbalize exactly where and why you are stuck', 'Get a brute-force solution working first, then optimize', 'Trace a small concrete example to find the pattern', 'Accept and build on the interviewer\u2019s hints'],
            commonMistakes: ['Going silent and freezing', 'Insisting on the optimal solution and writing nothing', 'Ignoring or resisting hints', 'Guessing randomly instead of reasoning from an example'],
            interviewTip: 'Say "let me start with a brute-force approach and optimize" \u2014 it keeps you moving and shows pragmatism. A working O(n^2) you then improve beats a blank screen chasing O(n).',
            followUp: ['Is a brute-force solution acceptable?', 'How do you take a hint without looking lost?', 'How do you optimize from brute force?'],
            seniorPerspective: 'I get a correct solution on the board fast, even an ugly one, because a working baseline removes pressure and gives something to optimize. Interviewers reward forward progress and clear reasoning over elegant paralysis.',
            architectPerspective: 'Recovering from being stuck mirrors real engineering: get something working, validate with examples, then iterate. The interview is checking whether you make steady progress under uncertainty rather than freeze.'
        },
        {
            question: 'How should a senior engineer prepare for coding interviews efficiently?',
            difficulty: 'medium',
            answer: `<p>Prepare by <strong>patterns, not problem count</strong>. Grinding 500 random problems is inefficient; mastering ~15 patterns transfers to most questions.</p>
            <ul>
                <li><strong>Learn the core patterns</strong> \u2014 two pointers, sliding window, fast/slow, BFS/DFS, backtracking, binary search, heaps, hashing, intervals, top-K, and the common DP shapes.</li>
                <li><strong>Spaced repetition</strong> \u2014 revisit problems you missed; re-solving beats first-time solving for retention.</li>
                <li><strong>Simulate real conditions</strong> \u2014 timed, talking out loud, on a plain editor/whiteboard.</li>
                <li><strong>Review data-structure fundamentals</strong> \u2014 complexity of operations is the backbone of good choices.</li>
                <li><strong>Don\u2019t neglect communication</strong> \u2014 practice narrating, since that is half the score.</li>
            </ul>`,
            explanation: 'It is like studying for a math exam by mastering the formulas and problem types, not memorizing every textbook question. Patterns generalize; individual problems don\u2019t.',
            bestPractices: ['Study ~15 transferable patterns rather than chasing problem count', 'Use spaced repetition; re-solve missed problems', 'Practice timed and out loud to mirror real conditions', 'Refresh data-structure operation complexities'],
            commonMistakes: ['Grinding hundreds of problems with no pattern reflection', 'Solving silently, never practicing communication', 'Only doing easy problems or only reading solutions', 'Cramming the night before instead of spaced practice'],
            interviewTip: 'Tell-tale of efficient prep: you can name the pattern a problem belongs to within a minute. Practicing out loud is the most underrated step because communication is graded.',
            followUp: ['Which patterns give the most coverage?', 'How long should you prep?', 'How do you balance prep with a full-time job?'],
            seniorPerspective: 'As a senior I refuse to grind 500 problems \u2014 I drill patterns and practice communicating, because at this level the bar is clean reasoning and clear collaboration, not having memorized an obscure trick.',
            architectPerspective: 'Pattern-based preparation mirrors how experienced engineers actually work: recognizing a known shape and applying a proven technique. That transfer \u2014 from pattern to novel problem \u2014 is exactly what the coding round tries to detect.'
        },
        {
            question: 'How do you communicate effectively during a coding interview when you\u2019re stuck?',
            difficulty: 'hard',
            answer: `<p>Communication while stuck is <strong>the highest-signal moment</strong> in a coding interview. How you navigate uncertainty reveals more than how you execute a known solution.</p>
            <ul>
                <li><strong>Name what you\u2019re stuck on specifically</strong> — "I\u2019m not sure how to handle the overlapping intervals efficiently" is vastly better than silence or "I\u2019m thinking."</li>
                <li><strong>Share your partial reasoning</strong> — "I can see this is a graph problem, and I think BFS would work, but I\u2019m not sure how to model the edges" gives the interviewer a thread to pull on.</li>
                <li><strong>Propose a fallback</strong> — "Let me try a brute-force approach first to confirm my understanding, then I\u2019ll optimize." This keeps you moving forward.</li>
                <li><strong>Use concrete examples</strong> — "Let me trace through [1, 3, 5, 2] by hand to see what pattern emerges." Working an example often unsticks you.</li>
                <li><strong>Take hints collaboratively</strong> — when the interviewer offers a nudge, build on it openly: "Ah, so if I use a heap here, I can get the minimum in O(log n) — let me restructure around that."</li>
                <li><strong>Acknowledge the gap</strong> — "I\u2019m not confident about the optimal approach for this part, but here\u2019s my best reasoning..." Honesty scores higher than confident bluffing.</li>
            </ul>`,
            explanation: 'Being stuck in a coding interview is like being lost while navigating with a passenger: narrating "I think we\u2019re east of the highway, let me try this road" gets help and shows reasoning. Driving silently in circles impresses nobody, and refusing directions makes it worse.',
            bestPractices: ['Name specifically what you are stuck on, not just "I\u2019m thinking"', 'Share partial reasoning so the interviewer can see your thought process', 'Fall back to brute force to keep moving rather than freezing', 'Work concrete examples by hand to find patterns', 'Accept and build on hints — collaboration is being assessed'],
            commonMistakes: ['Going completely silent for extended periods', 'Saying "I\u2019m thinking" repeatedly without sharing any reasoning', 'Refusing or resisting interviewer hints', 'Bluffing confidence when you genuinely don\u2019t know', 'Giving up and saying "I don\u2019t know" without attempting to reason through it'],
            interviewTip: 'Practice narrating your confusion, not just your solutions. The sentence "I\u2019m stuck on X because Y, let me try Z" is more valuable than 30 seconds of silence followed by the right answer.',
            followUp: ['How do you take a hint without looking like you needed it?', 'How much time should you spend stuck before asking for direction?', 'How do you recover momentum after being stuck?'],
            seniorPerspective: 'I treat the interviewer as a pair-programming partner, especially when stuck. Saying "I think this is a sliding-window problem but I\u2019m not sure about the shrink condition — what do you think?" signals collaboration and confidence simultaneously.',
            architectPerspective: 'Communication under uncertainty is the meta-skill being tested. In real engineering, getting stuck and navigating it — by naming the gap, reasoning publicly, and incorporating input — is daily work. The coding interview compresses this into a visible, gradable moment.'
        },
        {
            question: 'How do you decide between an optimal solution and a working solution under time pressure?',
            difficulty: 'hard',
            answer: `<p>In a coding interview, a <strong>correct working solution always beats an incomplete optimal one</strong>. The decision framework is: get something working first, then optimize if time allows.</p>
            <ul>
                <li><strong>State the trade-off out loud</strong> — "I can do this in O(n\u00b2) right now, or O(n log n) with a more complex approach. Let me get the O(n\u00b2) working first, then optimize."</li>
                <li><strong>Working beats perfect</strong> — interviewers score a correct brute-force solution much higher than a broken attempt at the optimal. You get partial credit for correct; you get zero for broken.</li>
                <li><strong>Know the complexity before you start</strong> — if you can state "this is O(n\u00b2) and the optimal is O(n)", the interviewer knows you understand the space. You can still get high marks implementing the simpler version.</li>
                <li><strong>Optimize incrementally</strong> — once brute-force works, identify the bottleneck: "the nested loop is the expensive part. If I use a hash set, I can eliminate the inner loop." This narrates your optimization thinking.</li>
                <li><strong>Ask the interviewer</strong> — "Would you like me to optimize this, or should we move to another question?" Sometimes they prefer breadth over depth.</li>
                <li><strong>Time estimation</strong> — if there are 5 minutes left, solidify the working solution with edge-case handling rather than rushing an optimization that might break it.</li>
            </ul>`,
            explanation: 'It is like a timed cooking competition: a simple, well-executed dish that is finished and plated beats an ambitious dish that is still raw when time is called. The judges taste completed plates, not intentions.',
            bestPractices: ['State the complexity of your approach and the optimal upfront — this shows awareness', 'Get a correct brute-force solution working before optimizing', 'Narrate the optimization opportunity: name the bottleneck and the technique that fixes it', 'Ask the interviewer whether to optimize or move on — respect their time allocation', 'With 5 minutes left, solidify edge cases rather than starting a risky rewrite'],
            commonMistakes: ['Spending 30 minutes chasing the optimal and submitting nothing', 'Not stating you know a better approach exists (interviewer assumes you don\u2019t)', 'Optimizing prematurely before confirming the brute-force is correct', 'Rushing an optimization in the last 2 minutes that breaks the working solution'],
            interviewTip: 'Say: "I\u2019m going to start with O(n\u00b2) to get correctness, then I\u2019ll optimize to O(n)." This one sentence communicates awareness, pragmatism, and a plan — three signals in ten words.',
            followUp: ['Is a brute-force solution ever the final answer?', 'How do you identify what to optimize?', 'How do you handle an interviewer who expects the optimal solution?'],
            seniorPerspective: 'I always announce both complexities before coding: "brute force is O(n\u00b2), optimal is O(n) with a hash map. Let me get the n\u00b2 working and then upgrade." This shows I know the landscape, and it buys me goodwill to start simple.',
            architectPerspective: 'This is directly analogous to production engineering: ship the working version, then optimize the hot path. The judgment to ship correct-and-simple before investing in optimal-and-complex is the same pragmatism we exercise daily in real system design.'
        }
    ]
});
