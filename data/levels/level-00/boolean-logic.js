/* ═══════════════════════════════════════════════════════════════════
   BOOLEAN LOGIC & GATES — Level 0: Prerequisites (Computing Basics)
   Logic operations, truth tables, gates, De Morgan's laws, and how
   gates build the arithmetic circuits inside a CPU.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('boolean-logic', {

    title: 'Boolean Logic & Gates',
    level: 0,
    group: 'computing-basics',
    description: 'Boolean operations (AND, OR, NOT, XOR, NAND, NOR), truth tables, logic gates, De Morgan\u2019s laws, and how gates combine to build adders and the circuits inside a CPU.',
    difficulty: 'beginner',
    estimatedMinutes: 30,
    prerequisites: ['binary-number-systems'],

    sections: [

        {
            title: 'Introduction',
            content: `<p><strong>Boolean logic</strong> is the mathematics of true and false. Named after George Boole,
            it underpins every digital computer: every decision a CPU makes, every bit it stores, and every
            arithmetic operation reduces to combinations of simple logical operations on 1s and 0s.</p>
            <p>Understanding boolean logic is foundational because it connects the abstract <code>if</code>
            statements you write in code to the physical transistors and logic gates that execute them.</p>
            <p>In this module you will learn:</p>
            <ul>
                <li>The core boolean operations and their truth tables</li>
                <li>Logic gates and how they map to operations</li>
                <li>De Morgan's laws and boolean algebra simplification</li>
                <li>How gates combine to perform binary addition</li>
                <li>Why this matters for writing correct conditional logic</li>
            </ul>`
        },
        {
            title: 'Core Concepts',
            content: `<p>Boolean logic operates on two values: <strong>true (1)</strong> and <strong>false (0)</strong>.
            The fundamental operations are:</p>
            <h4>AND (&amp;&amp;, &amp;)</h4>
            <p>Output is true only when <em>both</em> inputs are true. Think "both conditions must hold".</p>
            <h4>OR (||, |)</h4>
            <p>Output is true when <em>at least one</em> input is true. Think "either condition is enough".</p>
            <h4>NOT (!)</h4>
            <p>Inverts a single input: true becomes false and vice versa.</p>
            <h4>XOR (exclusive OR, ^)</h4>
            <p>Output is true when inputs <em>differ</em>. Used in parity checks, encryption, and addition.</p>
            <h4>NAND &amp; NOR</h4>
            <p>NAND = NOT(AND); NOR = NOT(OR). These are "universal gates" — any logic circuit can be built
            from NAND alone (or NOR alone), which is why chip manufacturing favors them.</p>`,
            mermaid: `graph LR
    A[Inputs A,B] --> AND[AND: A and B]
    A --> OR[OR: A or B]
    A --> XOR[XOR: A differs B]
    A --> NAND[NAND: not AND]
    A --> NOR[NOR: not OR]
    NAND --> U[Universal: builds any circuit]`
        },
        {
            title: 'How It Works',
            content: `<p>A <strong>truth table</strong> lists every possible input combination and the resulting output.
            For two inputs there are four combinations (00, 01, 10, 11). The tables below define each operation:</p>
            <ul>
                <li><strong>AND:</strong> 0,0&rarr;0 | 0,1&rarr;0 | 1,0&rarr;0 | 1,1&rarr;1</li>
                <li><strong>OR:</strong> 0,0&rarr;0 | 0,1&rarr;1 | 1,0&rarr;1 | 1,1&rarr;1</li>
                <li><strong>XOR:</strong> 0,0&rarr;0 | 0,1&rarr;1 | 1,0&rarr;1 | 1,1&rarr;0</li>
                <li><strong>NAND:</strong> 0,0&rarr;1 | 0,1&rarr;1 | 1,0&rarr;1 | 1,1&rarr;0</li>
            </ul>
            <p>In code, these same rules drive conditional logic. Short-circuit evaluation means
            <code>&amp;&amp;</code> stops at the first false and <code>||</code> stops at the first true.</p>`,
            code: `// Short-circuit evaluation in action
bool HasAccess(User u) =>
    u != null && u.IsActive && u.HasPermission;
    // If u is null, the rest is never evaluated (no NullReferenceException)

// XOR detects "exactly one" — useful for toggles and parity
bool exactlyOneSelected = optionA ^ optionB;

// NOT inverts; combine for guard conditions
if (!(order.IsPaid || order.IsCancelled))
    PromptForPayment();`,
            language: 'csharp'
        },
        {
            title: 'Visual Diagram',
            content: `<p>Logic gates are the physical building blocks. Each gate implements one boolean
            operation in hardware. The diagram shows how two gates combine into a "half adder" that
            adds two bits, producing a sum and a carry:</p>`,
            mermaid: `flowchart LR
    A[Bit A] --> XOR[XOR gate]
    B[Bit B] --> XOR
    A --> AND[AND gate]
    B --> AND
    XOR --> S[Sum bit]
    AND --> C[Carry bit]`
        },

        {
            title: 'Implementation',
            content: `<p>Boolean logic appears in every language. Below are the operators and bitwise variants:</p>`,
            tabs: [
                {
                    label: 'C#',
                    code: `// Logical operators (short-circuit)
bool a = true, b = false;
bool and = a && b;   // false
bool or  = a || b;   // true
bool not = !a;       // false
bool xor = a ^ b;    // true (differ)

// Bitwise operators work on each bit of integers
int x = 0b1100;      // 12
int y = 0b1010;      // 10
int bitAnd = x & y;  // 0b1000 = 8
int bitOr  = x | y;  // 0b1110 = 14
int bitXor = x ^ y;  // 0b0110 = 6

// Common bit trick: toggle a flag with XOR
flags ^= FlagMask;`,
                    language: 'csharp'
                },
                {
                    label: 'Python',
                    code: `# Logical operators
a, b = True, False
print(a and b)  # False
print(a or b)   # True
print(not a)    # False
print(a ^ b)    # True (bool xor)

# Bitwise on integers
x, y = 0b1100, 0b1010
print(bin(x & y))  # 0b1000
print(bin(x | y))  # 0b1110
print(bin(x ^ y))  # 0b0110`,
                    language: 'python'
                }
            ]
        },
        {
            title: 'Best Practices',
            content: `<h4>Do: Rely on Short-Circuit Order</h4>
            <p>Put cheap or null-guarding checks first: <code>obj != null &amp;&amp; obj.IsValid</code>.
            The second operand is skipped if the first short-circuits.</p>
            <h4>Do: Simplify with Boolean Algebra</h4>
            <p>Apply De Morgan's laws to make conditions readable: <code>!(a &amp;&amp; b)</code> equals
            <code>!a || !b</code>. Choose whichever reads more naturally.</p>
            <h4>Do: Name Complex Conditions</h4>
            <p>Extract a compound boolean into a well-named variable or method:
            <code>bool isEligible = isActive &amp;&amp; !isSuspended &amp;&amp; hasBalance;</code></p>
            <h4>Do: Prefer Logical over Bitwise for Conditions</h4>
            <p>Use <code>&amp;&amp;</code>/<code>||</code> for boolean conditions (short-circuit), and reserve
            <code>&amp;</code>/<code>|</code> for actual bit manipulation.</p>`,
            callout: {
                type: 'tip',
                title: 'De Morgan in One Line',
                text: 'NOT(A AND B) = (NOT A) OR (NOT B); NOT(A OR B) = (NOT A) AND (NOT B). Distribute the NOT and flip the operator. This is the most useful boolean identity for refactoring confusing conditions.'
            }
        },
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Confusing Bitwise and Logical Operators</h4>
            <p>Using <code>&amp;</code> instead of <code>&amp;&amp;</code> defeats short-circuiting and can cause
            null reference errors or unnecessary expensive evaluations.</p>
            <h4>Mistake: Inverting Conditions Incorrectly</h4>
            <p>The negation of <code>a &amp;&amp; b</code> is <em>not</em> <code>!a &amp;&amp; !b</code> — it is
            <code>!a || !b</code>. Forgetting to flip the operator is a classic bug.</p>
            <h4>Mistake: Double Negatives</h4>
            <p><code>!isNotReady</code> is hard to read. Prefer a positive name (<code>isReady</code>).</p>
            <h4>Mistake: Assuming XOR Means "or"</h4>
            <p>XOR is true only when inputs differ. <code>true ^ true</code> is false, which surprises people
            expecting OR behavior.</p>`,
            code: `// BUG: De Morgan applied wrong
if (!isActive && !isVerified)   // means "neither active nor verified"
    DenyAccess();
// If you meant "not (active and verified)", you needed:
if (!(isActive && isVerified))  // = !isActive || !isVerified
    DenyAccess();`,
            language: 'csharp'
        },
        {
            title: 'Real-World Applications',
            content: `<p>Boolean logic is everywhere in computing:</p>
            <h4>CPU Arithmetic</h4>
            <p>Adders, multipliers, and the entire ALU (Arithmetic Logic Unit) are built from gates.
            Addition uses XOR for the sum bit and AND for the carry.</p>
            <h4>Permissions &amp; Feature Flags</h4>
            <p>Access control combines conditions with AND/OR. Bit flags pack many booleans into one integer
            (<code>Permissions.Read | Permissions.Write</code>).</p>
            <h4>Database Queries</h4>
            <p>SQL <code>WHERE</code> clauses combine predicates with AND/OR/NOT — the optimizer reasons about
            them using boolean algebra.</p>
            <h4>Cryptography &amp; Hashing</h4>
            <p>XOR is fundamental to stream ciphers and many hash functions because it is reversible and
            evenly mixes bits.</p>`
        },
        {
            title: 'Comparison',
            content: `<p>How the operations compare at a glance:</p>`,
            table: {
                headers: ['Operation', 'Symbol (logical)', 'Symbol (bitwise)', 'True when', 'Universal gate?'],
                rows: [
                    ['AND', '&&', '&', 'Both inputs true', 'No'],
                    ['OR', '||', '|', 'At least one true', 'No'],
                    ['NOT', '!', '~', 'Input is false', 'No'],
                    ['XOR', 'n/a', '^', 'Inputs differ', 'No'],
                    ['NAND', 'n/a', 'n/a', 'Not both true', 'Yes'],
                    ['NOR', 'n/a', 'n/a', 'Neither true', 'Yes']
                ]
            }
        },
        {
            title: 'Performance',
            content: `<p>Boolean operations are among the fastest a CPU can perform — typically a single clock
            cycle. Performance considerations are mostly about <em>logic structure</em>, not raw speed:</p>
            <h4>Short-Circuit Savings</h4>
            <p>Ordering conditions so the cheapest or most-likely-to-fail check comes first avoids evaluating
            expensive operations (DB calls, method invocations) unnecessarily.</p>
            <h4>Branch Prediction</h4>
            <p>Modern CPUs predict the outcome of conditional branches. Predictable conditions (almost always
            true/false) run faster than random ones because mispredictions flush the pipeline.</p>
            <h4>Bit Flags Save Memory</h4>
            <p>Packing 32 booleans into one int uses 4 bytes instead of 32+. Bitwise checks are extremely fast.</p>`,
            callout: {
                type: 'info',
                title: 'Branchless Tricks',
                text: 'Performance-critical code sometimes replaces branches with bitwise arithmetic to avoid branch mispredictions. Useful in tight loops, but measure first — readability usually wins.'
            }
        },

        {
            title: 'Testing',
            content: `<p>Boolean logic is highly testable because the input space is small and finite.</p>
            <h4>Exhaustive Truth-Table Testing</h4>
            <p>For a function of N boolean inputs there are only 2^N combinations. For small N you can test
            every case exhaustively — guaranteeing correctness.</p>
            <h4>Parameterized Tests</h4>
            <p>Use data-driven tests to cover each truth-table row concisely.</p>`,
            code: `[Theory]
[InlineData(true,  true,  true)]
[InlineData(true,  false, false)]
[InlineData(false, true,  false)]
[InlineData(false, false, false)]
public void And_MatchesTruthTable(bool a, bool b, bool expected)
    => Assert.Equal(expected, a && b);

[Theory]
[InlineData(true,  true,  false)]   // XOR: equal -> false
[InlineData(true,  false, true)]
[InlineData(false, false, false)]
public void Xor_MatchesTruthTable(bool a, bool b, bool expected)
    => Assert.Equal(expected, a ^ b);`,
            language: 'csharp'
        },
        {
            title: 'Interview Tips',
            content: `<p>Boolean logic shows up in fundamentals screens and low-level questions:</p>
            <ul>
                <li><strong>Know your truth tables cold</strong> — especially XOR and NAND</li>
                <li><strong>Apply De Morgan's laws live</strong> — interviewers love asking you to simplify a condition</li>
                <li><strong>Explain short-circuiting</strong> — and how to exploit it for null safety</li>
                <li><strong>Mention NAND/NOR universality</strong> — signals hardware awareness</li>
                <li><strong>Connect to code</strong> — relate gates to the <code>if</code> statements you write daily</li>
            </ul>`,
            callout: {
                type: 'info',
                title: 'Classic Question',
                text: 'Interviewers may ask "swap two integers without a temp variable." The XOR trick (a ^= b; b ^= a; a ^= b;) demonstrates you understand XOR\u2019s reversibility — though in real code a tuple swap is clearer.'
            }
        },
        {
            title: 'Further Reading',
            content: `<p>Resources to go deeper:</p>
            <h4>Books</h4>
            <ul>
                <li><em>Code: The Hidden Language of Computer Hardware and Software</em> by Charles Petzold</li>
                <li><em>The Elements of Computing Systems</em> (Nand2Tetris) by Nisan &amp; Schocken</li>
                <li><em>Digital Design</em> by Morris Mano</li>
            </ul>
            <h4>Online</h4>
            <ul>
                <li>Nand2Tetris course (nand2tetris.org) — build a computer from NAND gates</li>
                <li>CrashCourse Computer Science (YouTube) — Boolean Logic episode</li>
            </ul>`
        },
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Core idea:</strong> All computation reduces to AND, OR, NOT on 1s and 0s</li>
                <li><strong>Truth tables</strong> define each operation exhaustively (2^N rows for N inputs)</li>
                <li><strong>De Morgan's laws:</strong> NOT(A AND B) = NOT A OR NOT B; flip operator when distributing NOT</li>
                <li><strong>NAND/NOR are universal</strong> — any circuit can be built from them alone</li>
                <li><strong>Short-circuit:</strong> && stops at first false, || at first true — exploit for null safety and performance</li>
                <li><strong>Logical vs bitwise:</strong> use &&/|| for conditions, &/| for bit manipulation</li>
                <li><strong>Interview signal:</strong> simplifying conditions with De Morgan and knowing XOR cold</li>
            </ul>`
        },
        {
            title: 'Exercise',
            content: `<h4>Challenge: Build and Test a Half Adder</h4>
            <p>Using only boolean operations, implement a function that adds two bits:</p>
            <ol>
                <li>Write <code>HalfAdder(bool a, bool b)</code> returning (sum, carry)</li>
                <li>Sum = a XOR b; Carry = a AND b</li>
                <li>Extend to a <code>FullAdder(a, b, carryIn)</code> that chains two half adders</li>
                <li>Write exhaustive truth-table tests for both</li>
                <li>Bonus: chain four full adders to add two 4-bit numbers</li>
            </ol>
            <h4>Starter Code</h4>`,
            code: `public static (bool sum, bool carry) HalfAdder(bool a, bool b)
{
    bool sum = a ^ b;       // TODO confirm
    bool carry = a && b;    // TODO confirm
    return (sum, carry);
}

// TODO: FullAdder using two half adders + an OR for the carries
public static (bool sum, bool carryOut) FullAdder(bool a, bool b, bool carryIn)
{
    throw new NotImplementedException();
}

// TODO: exhaustive [Theory] tests covering all input rows`,
            language: 'csharp'
        },
        {
            title: 'Knowledge Check',
            content: `<ol>
                <li><strong>Q:</strong> What is the output of <code>true XOR true</code>?<br/>
                    <em>A: false — XOR is true only when inputs differ.</em></li>
                <li><strong>Q:</strong> Rewrite <code>!(a || b)</code> using De Morgan's law.<br/>
                    <em>A: !a &amp;&amp; !b — distribute the NOT and change OR to AND.</em></li>
                <li><strong>Q:</strong> Why are NAND and NOR called universal gates?<br/>
                    <em>A: Any boolean function (and thus any digital circuit) can be constructed using only NAND
                    gates, or only NOR gates. This simplifies chip manufacturing.</em></li>
                <li><strong>Q:</strong> In <code>x != null &amp;&amp; x.Ready</code>, why is order important?<br/>
                    <em>A: Short-circuit evaluation: if x is null the second operand is never evaluated, avoiding a
                    null reference exception.</em></li>
            </ol>`
        }
    ],
    questions: [
        {
            question: 'What is two\u2019s complement, and how does it let one adder circuit perform both addition and subtraction?',
            difficulty: 'hard',
            answer: `<p><strong>Two's complement</strong> is the standard way to represent signed integers in binary. To
            negate a number you invert all bits (one's complement) and add 1. The most significant bit acts as the
            sign (1 = negative). Its key property: <strong>a - b = a + (-b)</strong> works using the <em>same</em>
            binary adder, because subtraction becomes adding the two's-complement negation.</p>
            <p>This is why CPUs need only one adder circuit: to compute <code>a - b</code>, the ALU computes the
            two's complement of <code>b</code> (invert + add 1) and adds it to <code>a</code>. It also gives a single
            representation of zero (unlike sign-magnitude) and wraps around cleanly on overflow.</p>`,
            explanation: 'Think of a car odometer: rolling backward from 0000 gives 9999, which behaves like "-1". Two\u2019s complement uses the same wraparound so that adding the "negative" representation produces the right subtraction result with ordinary addition.',
            code: `// 8-bit two's complement of 5 -> represents -5
//   5        = 0000 0101
//   invert   = 1111 1010   (one's complement)
//   + 1      = 1111 1011   = -5
//
// Subtraction via addition:  7 - 5  ==  7 + (-5)
//   7        = 0000 0111
//   -5       = 1111 1011
//   sum      = 0000 0010 (=2), carry out discarded -> correct`,
            language: 'csharp',
            bestPractices: ['Remember the sign bit is the MSB', 'Negate via invert-then-add-1', 'Watch for overflow when the result exceeds the range'],
            commonMistakes: ['Confusing one\u2019s complement (just invert) with two\u2019s complement (invert + 1)', 'Ignoring overflow/wraparound semantics', 'Assuming signed and unsigned compare the same'],
            interviewTip: 'State the defining property: subtraction reduces to addition of the negation, so hardware needs one adder. That insight is what interviewers want, beyond the bit mechanics.',
            followUp: ['How is signed overflow detected in hardware?', 'Why does two\u2019s complement have only one representation of zero?'],
            seniorPerspective: 'The practical payoff of understanding two\u2019s complement is debugging integer overflow and signed/unsigned bugs \u2014 e.g., a length stored in a signed int wrapping negative, or a comparison flipping because one operand was treated as unsigned. Knowing the bit-level representation turns these from baffling production bugs into obvious ones.'
        },
        {
            question: 'Explain common bit-manipulation tricks and when you would use them (e.g., check power of two, count set bits, toggle/clear/set a bit).',
            difficulty: 'hard',
            answer: `<p>Bit tricks exploit binary structure for fast, allocation-free operations \u2014 common in flags,
            low-level performance code, and interview problems:</p>
            <ul>
                <li><strong>Test a bit:</strong> <code>(n &gt;&gt; k) &amp; 1</code></li>
                <li><strong>Set a bit:</strong> <code>n | (1 &lt;&lt; k)</code>; <strong>clear:</strong> <code>n &amp; ~(1 &lt;&lt; k)</code>; <strong>toggle:</strong> <code>n ^ (1 &lt;&lt; k)</code></li>
                <li><strong>Power of two check:</strong> <code>n &gt; 0 &amp;&amp; (n &amp; (n - 1)) == 0</code> \u2014 a power of two has exactly one set bit, and subtracting 1 flips it and all lower bits.</li>
                <li><strong>Clear lowest set bit:</strong> <code>n &amp; (n - 1)</code>; <strong>isolate lowest set bit:</strong> <code>n &amp; (-n)</code></li>
                <li><strong>Count set bits (popcount):</strong> Brian Kernighan\u2019s loop <code>n &amp;= (n-1)</code> runs once per set bit; or use a hardware popcount intrinsic.</li>
            </ul>`,
            explanation: 'These work because each bit is an independent on/off switch. The "n & (n-1)" family relies on a neat fact: subtracting 1 flips the lowest set bit and everything below it, which lets you test, clear, or count set bits in O(set bits) instead of O(width).',
            code: `static bool IsPowerOfTwo(int n) => n > 0 && (n & (n - 1)) == 0;

static int CountSetBits(int n) {            // Brian Kernighan
    int count = 0;
    while (n != 0) { n &= (n - 1); count++; } // clears lowest set bit each pass
    return count;                            // .NET: System.Numerics.BitOperations.PopCount
}

// Flags packed into one int:
const int Read = 1 << 0, Write = 1 << 1, Exec = 1 << 2;
int perms = Read | Write;                   // set
bool canWrite = (perms & Write) != 0;       // test
perms &= ~Write;                            // clear`,
            language: 'csharp',
            bestPractices: ['Use named flag constants, not magic shifts', 'Prefer built-in popcount intrinsics (BitOperations.PopCount) over hand-rolled loops in hot paths', 'Comment bit tricks \u2014 they are terse'],
            commonMistakes: ['Off-by-one on shift amounts / shifting by >= width (undefined in some languages)', 'Forgetting operator precedence (& is lower than ==) and missing parentheses', 'Using signed types where the sign bit causes surprises with >>'],
            interviewTip: 'Memorize the power-of-two and n&(n-1) tricks cold \u2014 they appear constantly. Explain WHY (subtracting 1 flips the lowest set bit) rather than just reciting the formula.',
            followUp: ['How does n & (-n) isolate the lowest set bit?', 'When is a lookup table or hardware popcount faster than Kernighan\u2019s loop?'],
            seniorPerspective: 'In production I reach for bit flags when packing many booleans (permissions, feature sets) where memory or wire size matters, and for the occasional hot-loop optimization a profiler justifies. But I keep them behind well-named helpers/enums \u2014 clever bit math unexplained in business logic is a maintenance hazard, so the trick must earn its place with a measured benefit or a genuinely natural fit (like flag enums).'
        },
        {
            question: 'What is the difference between logical (&&) and bitwise (&) AND operators?',
            difficulty: 'easy',
            answer: `<p><strong>Logical AND (&amp;&amp;)</strong> operates on boolean values and short-circuits — if the
            left operand is false, the right is never evaluated. <strong>Bitwise AND (&amp;)</strong> operates on
            each corresponding bit of integer operands and always evaluates both sides.</p>
            <ul>
                <li><code>true &amp;&amp; false</code> &rarr; false (boolean, short-circuits)</li>
                <li><code>0b1100 &amp; 0b1010</code> &rarr; 0b1000 (bit-by-bit)</li>
            </ul>`,
            explanation: 'Logical && is like a bouncer checking conditions one at a time and stopping at the first failure. Bitwise & lines up two binary numbers and compares every digit position simultaneously.',
            bestPractices: [
                'Use && / || for boolean conditions to get short-circuit behavior',
                'Use & / | only for genuine bit manipulation (flags, masks)',
                'Order && operands so null/cheap checks come first'
            ],
            commonMistakes: [
                'Using & on booleans, losing short-circuit protection',
                'Using && on integers (compile error in C#, surprising in C)'
            ],
            interviewTip: 'Mention short-circuiting explicitly — it is the key behavioral difference and the reason && is preferred for conditions.',
            followUp: ['How does short-circuiting help avoid null reference exceptions?', 'What are bit flags and when would you use them?']
        },
        {
            question: 'Explain De Morgan\u2019s laws and give a practical example of using them.',
            difficulty: 'medium',
            answer: `<p>De Morgan's laws describe how to distribute a NOT across AND/OR:</p>
            <ul>
                <li>NOT(A AND B) = (NOT A) OR (NOT B)</li>
                <li>NOT(A OR B) = (NOT A) AND (NOT B)</li>
            </ul>
            <p>When you push a negation inside parentheses, flip every AND to OR and vice versa. This is used
            constantly to simplify or invert conditions for readability.</p>`,
            explanation: 'If "both the door is locked AND the alarm is on" describes a secure state, then "NOT secure" means "the door is unlocked OR the alarm is off" — notice AND became OR.',
            code: `// Original guard
if (!(user.IsActive && user.HasSubscription))
    ShowUpgradePrompt();

// Equivalent via De Morgan — sometimes clearer
if (!user.IsActive || !user.HasSubscription)
    ShowUpgradePrompt();`,
            language: 'csharp',
            bestPractices: [
                'Use De Morgan to choose the more readable of two equivalent forms',
                'Apply it when inverting a complex condition for an early-return guard'
            ],
            commonMistakes: [
                'Forgetting to flip the operator (turning AND into AND) when distributing NOT',
                'Negating only some terms inside the parentheses'
            ],
            interviewTip: 'Be ready to simplify a messy nested negation live — it is a very common whiteboard ask.',
            followUp: ['Simplify !(!a || b) for me.', 'How does this relate to guard clauses?']
        },
        {
            question: 'How would you swap two integers using XOR, and why does it work?',
            difficulty: 'hard',
            answer: `<p>You can swap without a temporary variable using XOR's reversibility:</p>
            <p><code>a ^= b; b ^= a; a ^= b;</code></p>
            <p>It works because XOR is its own inverse: <code>x ^ y ^ y = x</code>. After the first line a holds
            a^b; the second sets b = (a^b)^b = a; the third sets a = (a^b)^a = b.</p>
            <p>In practice this is a curiosity — modern languages offer tuple swaps (<code>(a, b) = (b, a)</code>)
            which are clearer and just as fast. The XOR trick also fails if both references are the same variable
            (it zeroes the value).</p>`,
            explanation: 'XOR is reversible: applying the same value twice cancels out. The swap exploits this to shuffle the two values through each other without a third storage slot.',
            code: `// XOR swap (demonstrates the property; prefer tuple swap in real code)
a ^= b;
b ^= a;   // b = (a^b)^b = a
a ^= b;   // a = (a^b)^a = b

// Preferred in modern C#:
(a, b) = (b, a);`,
            language: 'csharp',
            bestPractices: [
                'Prefer the readable tuple/temp swap in production code',
                'Use the XOR trick only to demonstrate understanding of XOR properties'
            ],
            commonMistakes: [
                'Applying XOR swap when both operands alias the same variable (result becomes 0)',
                'Believing it is faster — compilers optimize the simple swap equally well'
            ],
            interviewTip: 'Show you know the trick AND that you would not use it in real code — demonstrating judgment, not just cleverness, is the senior signal.',
            followUp: ['Why does the XOR swap break when a and b are the same memory location?', 'What other algorithms exploit XOR reversibility?'],
            seniorPerspective: 'I treat clever bit tricks as red flags in production unless a profiler proves they matter. The XOR swap is a great interview demonstration of understanding reversibility, but in a real codebase a tuple swap communicates intent instantly and the compiler emits equivalent machine code.'
        },
        {
            question: 'Why are NAND and NOR called "universal" gates, and what is the practical significance?',
            difficulty: 'medium',
            answer: `<p>A gate is <strong>universal</strong> if any boolean function can be built using only that
            gate. Both <strong>NAND</strong> and <strong>NOR</strong> qualify because you can construct NOT, AND, and
            OR from either one alone:</p>
            <ul>
                <li><strong>NOT</strong> from NAND: tie both inputs together — <code>NAND(a, a) = NOT a</code></li>
                <li><strong>AND</strong> from NAND: <code>NOT(NAND(a, b))</code></li>
                <li><strong>OR</strong> from NAND: <code>NAND(NOT a, NOT b)</code> (via De Morgan)</li>
            </ul>
            <p>Since {AND, OR, NOT} is a complete set and all three reduce to NAND, NAND alone is complete — and the
            same holds for NOR.</p>`,
            explanation: 'NAND is like a single LEGO brick that can be combined to build every other shape. Because one brick does everything, a factory only has to manufacture and test that one part really well.',
            code: `// Building the basic gates from NAND only
bool Nand(bool a, bool b) => !(a && b);

bool Not(bool a)        => Nand(a, a);
bool And(bool a, bool b) => Not(Nand(a, b));
bool Or(bool a, bool b)  => Nand(Not(a), Not(b));`,
            language: 'csharp',
            bestPractices: ['Understand universality conceptually rather than memorizing every construction', 'Connect it to why hardware favors a small set of repeated building blocks'],
            commonMistakes: ['Claiming AND or OR alone is universal (they are not — you cannot make NOT from them)', 'Forgetting that XOR alone is also not universal'],
            interviewTip: 'Show one concrete construction (NOT from NAND by tying inputs together) — a single worked example proves you understand universality, not just the term.',
            followUp: ['Why is XOR not a universal gate on its own?', 'How does universality simplify chip fabrication and testing?'],
            seniorPerspective: 'The practical payoff of universality is manufacturing economy: a fab can optimize, yield-test, and characterize a single NAND-based cell extremely well, then compose everything from it. It is the hardware analog of building a system from one small, well-tested primitive rather than many bespoke parts.'
        },

        {
            question: 'How do you apply De Morgan\'s Laws to simplify complex boolean expressions in production code, and what are the common pitfalls when the expression involves more than two terms?',

            difficulty: 'hard',

            answer: `<p>De Morgan's Laws generalize to any number of terms: <code>NOT(A AND B AND C) = NOT A OR NOT B OR NOT C</code> and <code>NOT(A OR B OR C) = NOT A AND NOT B AND NOT C</code>. In practice you push the NOT inward, flipping every AND to OR (and vice versa) and negating each term.</p>
            <p>The tricky part with multi-term expressions is <strong>nested groups</strong>: <code>!(a && (b || c))</code> requires applying De Morgan twice — first to the outer AND, then to the inner OR: <code>!a || (!b && !c)</code>. Missing one level of distribution is the most common bug.</p>
            <p>In production, the goal is readability. Sometimes the original negated form is clearer than the De Morgan expansion — extract the condition into a well-named boolean method rather than mechanically distributing NOTs across five terms.</p>`,

            explanation: 'De Morgan is like reversing directions on a map: every "turn left" becomes "turn right" and every "go straight through" becomes "stop at". With nested intersections (groups) you must reverse at each junction separately, or you give someone wrong directions.',

            code: `// Multi-term De Morgan in practice:
// Original complex guard:
if (!(user.IsActive && user.HasSubscription && (user.Age >= 18 || user.HasParentalConsent)))
    DenyAccess();

// Step 1: outer AND -> OR with negated terms:
// !user.IsActive || !user.HasSubscription || !(user.Age >= 18 || user.HasParentalConsent)
// Step 2: inner OR -> AND:
// !user.IsActive || !user.HasSubscription || (user.Age < 18 && !user.HasParentalConsent)

// Final — but is this actually more readable? Often better to extract:
bool IsEligible(User u) =>
    u.IsActive && u.HasSubscription && (u.Age >= 18 || u.HasParentalConsent);

if (!IsEligible(user)) DenyAccess(); // clearest of all`,

            language: 'csharp',

            bestPractices: [
                'Apply De Morgan level by level for nested expressions — do not try to flatten everything in one step',
                'Prefer extracting complex conditions into named methods over mechanical De Morgan expansion',
                'Verify transformations with a truth table for critical business logic'
            ],

            commonMistakes: [
                'Flipping the outer operator but forgetting to negate inner grouped terms',
                'Applying De Morgan across mixed precedence without respecting parentheses',
                'Producing a "correct" expansion that is less readable than the original negated form'
            ],

            interviewTip: 'Walk through a two-level nested example step by step. Then show judgment by saying "but in production I would extract this into a named predicate for clarity." That demonstrates both skill and engineering maturity.',

            followUp: [
                'How do you verify a complex boolean transformation is correct?',
                'When is a truth table more appropriate than algebraic simplification?',
                'How does short-circuit evaluation interact with De Morgan transformations?'
            ]
        },

        {
            question: 'What is a Karnaugh map, and how does it help simplify boolean expressions that have many variables? When would you use one in software engineering?',

            difficulty: 'hard',

            answer: `<p>A <strong>Karnaugh map (K-map)</strong> is a grid-based visual method for simplifying boolean expressions with 2-4 variables. You plot all 2^N input combinations in a grid ordered by Gray code (adjacent cells differ by one bit), then circle groups of 1s in power-of-two rectangles. Each group yields one simplified product term, and the union of all groups gives the minimal Sum-of-Products expression.</p>
            <p>It works because adjacent cells that are both 1 share a common factor — the differing variable cancels out. This exploits the identity <code>AB + A(NOT B) = A</code> visually, without algebraic manipulation.</p>
            <p>In software engineering, K-maps rarely appear directly, but the principle matters when: (1) writing complex conditional logic and needing to verify minimality, (2) designing hardware description language (Verilog/VHDL) logic, (3) optimizing bit-flag tests or permission checks with many boolean inputs, or (4) verifying that a set of business rules has no redundant or contradictory conditions.</p>`,

            explanation: 'A K-map is like arranging colored tiles on a grid so that similar tiles sit next to each other. You then draw rectangles around groups of same-colored tiles — the bigger the rectangle, the simpler the rule that covers them all. It turns algebra into a visual puzzle.',

            code: `// Example: simplify f(A,B,C) = ABC + AB'C + A'BC + A'B'C
// K-map for 3 variables (A on one axis, BC on the other):
//        BC=00  BC=01  BC=11  BC=10
// A=0  |  0   |  1   |  1   |  0  |
// A=1  |  0   |  1   |  1   |  0  |
//
// Group: entire column where C=1 (4 cells) -> simplified to just C
// Result: f = C
// Without K-map you might not see that A and B are irrelevant!

// In code this means:
// Before simplification (4 conditions):
bool result = (a && b && c) || (a && !b && c) || (!a && b && c) || (!a && !b && c);
// After K-map simplification (1 condition):
bool result = c;  // A and B do not matter!

// Practical use: validating business rule simplification
// "Grant access if: (admin AND active) OR (admin AND verified) OR (moderator AND active) OR (moderator AND verified)"
// K-map shows this simplifies to: (admin OR moderator) AND (active OR verified)
bool access = (isAdmin || isModerator) && (isActive || isVerified);`,

            language: 'csharp',

            bestPractices: [
                'Use K-maps to verify that a complex conditional has been simplified correctly',
                'Apply the technique mentally for 2-3 variable expressions to spot redundant checks',
                'For 5+ variables, use algebraic tools or truth-table testing rather than K-maps'
            ],

            commonMistakes: [
                'Forgetting Gray code ordering on K-map axes (adjacent cells must differ by exactly one bit)',
                'Drawing groups that are not power-of-two sizes (1, 2, 4, 8 only)',
                'Wrapping groups around grid edges (valid in K-maps but easy to miss)'
            ],

            interviewTip: 'Most software interviews do not ask you to draw a K-map, but understanding the concept shows you can reason about boolean simplification rigorously. Mention that the real payoff is verifying that a complex condition is minimal and has no redundant branches.',

            followUp: [
                'How does a K-map scale beyond 4 variables?',
                'What is the Quine-McCluskey algorithm and how does it relate to K-maps?',
                'How would you verify a boolean simplification programmatically?'
            ]
        }
    ]
});
