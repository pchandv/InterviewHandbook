/* ═══════════════════════════════════════════════════════════════════
   LEVEL 0 — Binary & Number Systems
   Foundations of Computing: how computers represent numbers
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

PageData.register('binary-number-systems', {

    title: 'Binary & Number Systems',
    level: 0,
    group: 'computing-basics',
    description: 'Understanding binary, hexadecimal, and octal number systems — the foundation of how computers store and process all data.',
    difficulty: 'beginner',
    estimatedMinutes: 25,
    prerequisites: [],

    sections: [

        // 1. Introduction
        {
            title: 'Introduction',
            content: `<p><strong>Number systems</strong> are the foundation of everything a computer does.
            Every piece of data — text, images, music, code — is ultimately represented as sequences of
            <code>0</code>s and <code>1</code>s in binary.</p>
            <p>As a software engineer, understanding number systems helps you:</p>
            <ul>
                <li>Debug bit-level operations and flags</li>
                <li>Read memory addresses and hex dumps</li>
                <li>Understand color codes (#FF0000), file permissions (0755), and network masks</li>
                <li>Work with low-level APIs, cryptography, and encoding</li>
                <li>Answer interview questions about data representation</li>
            </ul>
            <p>In this module, you will learn binary (base-2), hexadecimal (base-16), and octal (base-8),
            how to convert between them, and why programmers need to know this.</p>`
        },

        // 2. Core Concepts
        {
            title: 'Core Concepts',
            content: `<p>A <strong>number system</strong> (or numeral system) defines how we represent
            quantities using a set of symbols and positional rules.</p>
            <h4>Decimal (Base-10)</h4>
            <p>The system humans use daily. Ten digits: 0–9. Each position is a power of 10.<br/>
            Example: <code>347 = 3×10² + 4×10¹ + 7×10⁰</code></p>
            <h4>Binary (Base-2)</h4>
            <p>The system computers use natively. Two digits: 0 and 1 (called <em>bits</em>).
            Each position is a power of 2.<br/>
            Example: <code>1011₂ = 1×2³ + 0×2² + 1×2¹ + 1×2⁰ = 11₁₀</code></p>
            <h4>Hexadecimal (Base-16)</h4>
            <p>A compact way to represent binary. Sixteen digits: 0–9 and A–F.
            Each hex digit maps to exactly 4 bits.<br/>
            Example: <code>0xFF = 1111 1111₂ = 255₁₀</code></p>
            <h4>Octal (Base-8)</h4>
            <p>Eight digits: 0–7. Each octal digit maps to exactly 3 bits.
            Common in Unix file permissions.<br/>
            Example: <code>0o755 = 111 101 101₂</code> (rwxr-xr-x)</p>`,
            mermaid: `graph LR
    D[Decimal<br/>Base-10<br/>0-9] --> B[Binary<br/>Base-2<br/>0-1]
    D --> H[Hexadecimal<br/>Base-16<br/>0-F]
    D --> O[Octal<br/>Base-8<br/>0-7]
    H -->|4 bits = 1 hex digit| B
    O -->|3 bits = 1 octal digit| B`
        },

        // 3. How It Works
        {
            title: 'How It Works',
            content: `<p>Converting between number systems follows simple positional rules:</p>
            <h4>Decimal → Binary (Division Method)</h4>
            <ol>
                <li>Divide the decimal number by 2</li>
                <li>Record the remainder (0 or 1)</li>
                <li>Repeat with the quotient until it reaches 0</li>
                <li>Read remainders from bottom to top</li>
            </ol>
            <h4>Binary → Decimal (Positional Sum)</h4>
            <p>Multiply each bit by its positional power of 2 and sum the results.</p>
            <h4>Binary ↔ Hex (Group by 4)</h4>
            <p>Group binary digits into sets of 4 (from right). Each group becomes one hex digit.</p>`,
            code: `// Decimal to Binary conversion
function decimalToBinary(decimal) {
    if (decimal === 0) return '0';
    let binary = '';
    let num = decimal;
    while (num > 0) {
        binary = (num % 2) + binary;  // Prepend remainder
        num = Math.floor(num / 2);    // Integer division
    }
    return binary;
}

// Binary to Decimal conversion
function binaryToDecimal(binary) {
    let decimal = 0;
    for (let i = 0; i < binary.length; i++) {
        const bit = parseInt(binary[i]);
        const power = binary.length - 1 - i;
        decimal += bit * Math.pow(2, power);
    }
    return decimal;
}

// Hex to Binary
function hexToBinary(hex) {
    const map = {
        '0': '0000', '1': '0001', '2': '0010', '3': '0011',
        '4': '0100', '5': '0101', '6': '0110', '7': '0111',
        '8': '1000', '9': '1001', 'A': '1010', 'B': '1011',
        'C': '1100', 'D': '1101', 'E': '1110', 'F': '1111'
    };
    return hex.toUpperCase().split('').map(c => map[c]).join(' ');
}

console.log(decimalToBinary(42));    // "101010"
console.log(binaryToDecimal('101010')); // 42
console.log(hexToBinary('2A'));      // "0010 1010"`,
            language: 'javascript'
        },

        // 4. Visual Diagram
        {
            title: 'Visual Diagram',
            content: `<p>The diagram below shows how the decimal number <strong>42</strong> is represented
            across all four number systems, and how two's complement works for negative numbers:</p>`,
            mermaid: `flowchart TD
    subgraph Representations["Number 42 in Different Bases"]
        DEC["Decimal: 42"]
        BIN["Binary: 00101010"]
        HEX["Hex: 0x2A"]
        OCT["Octal: 0o52"]
    end
    subgraph TwosComp["Two's Complement (-42 in 8 bits)"]
        STEP1["Start: 00101010"]
        STEP2["Flip bits: 11010101"]
        STEP3["Add 1: 11010110"]
    end
    DEC --> BIN
    DEC --> HEX
    DEC --> OCT
    STEP1 --> STEP2 --> STEP3`
        },

        // 5. Best Practices
        {
            title: 'Best Practices',
            content: `<h4>Do: Use Language Prefix Notation</h4>
            <p>Most languages support literal prefixes for clarity:
            <code>0b1010</code> (binary), <code>0xFF</code> (hex), <code>0o77</code> (octal).</p>
            <h4>Do: Use Hex for Bit Masks and Flags</h4>
            <p>Hex is more readable than binary for flag operations:
            <code>flags & 0x0F</code> is clearer than <code>flags & 0b00001111</code> for longer masks.</p>
            <h4>Do: Know Your Byte Boundaries</h4>
            <p>Key values to memorize: 8 bits = 1 byte (0–255), 16 bits (0–65535),
            32 bits (0–4.2 billion). This helps you pick appropriate data types.</p>
            <h4>Do: Understand Signed vs Unsigned</h4>
            <p>Signed integers use the most significant bit (MSB) for the sign.
            An <code>int8</code> holds -128 to 127, while <code>uint8</code> holds 0 to 255.</p>`,
            callout: {
                type: 'tip',
                title: 'Quick Hex Trick',
                text: 'Each hex digit is exactly 4 bits. So a byte is always 2 hex digits (00 to FF), making hex ideal for reading memory dumps, color codes, and network packets.'
            }
        },

        // 6. Common Mistakes
        {
            title: 'Common Mistakes',
            content: `<h4>Mistake: Confusing Signed and Unsigned Overflow</h4>
            <p>Adding 1 to <code>0xFF</code> (255) in an unsigned byte gives 0, not 256.
            In a signed byte, <code>0x7F</code> (127) + 1 = <code>0x80</code> (-128). This is called overflow.</p>
            <h4>Mistake: Forgetting Endianness</h4>
            <p>Multi-byte numbers can be stored as big-endian (most significant byte first)
            or little-endian (least significant byte first). Network protocols use big-endian;
            x86 CPUs use little-endian. Mismatches cause garbled data.</p>
            <h4>Mistake: Off-by-One in Bit Positions</h4>
            <p>Bits are numbered from 0 (rightmost/LSB). Bit 7 in a byte is the leftmost/MSB.
            Confusing 0-indexed and 1-indexed positions causes incorrect bit manipulation.</p>
            <h4>Mistake: Using Octal Accidentally</h4>
            <p>In JavaScript and C, a leading zero makes a number octal: <code>010 === 8</code>.
            This catches many developers off guard. Use <code>0o</code> prefix for explicit octal.</p>`
        },

        // 7. Key Takeaways
        {
            title: 'Key Takeaways',
            content: `<ul>
                <li><strong>Binary (base-2)</strong> is the native language of computers — all data is bits</li>
                <li><strong>Hexadecimal (base-16)</strong> is a human-friendly shorthand for binary (4 bits = 1 hex digit)</li>
                <li><strong>Octal (base-8)</strong> maps 3 bits per digit and is used for Unix permissions</li>
                <li><strong>Two's complement</strong> is how computers represent negative integers</li>
                <li><strong>Conversion</strong> between bases uses division/remainder (dec→bin) or grouping (bin↔hex)</li>
                <li><strong>Practical applications:</strong> color codes, memory addresses, permissions, flags, networking</li>
                <li>Know your byte boundaries: 8, 16, 32, and 64 bits and their unsigned max values</li>
            </ul>`
        },

        // 8. Knowledge Check
        {
            title: 'Knowledge Check',
            content: `<p>Test your understanding:</p>
            <ol>
                <li><strong>Q:</strong> Convert the decimal number 200 to binary.<br/>
                    <em>A: 11001000₂ (128 + 64 + 8 = 200)</em></li>
                <li><strong>Q:</strong> What is <code>0xCAFE</code> in decimal?<br/>
                    <em>A: 51966 (12×4096 + 10×256 + 15×16 + 14×1)</em></li>
                <li><strong>Q:</strong> How many unique values can 8 bits represent?<br/>
                    <em>A: 256 (2⁸ = 256, ranging from 0 to 255 unsigned)</em></li>
                <li><strong>Q:</strong> What is the two's complement of 5 in an 8-bit system?<br/>
                    <em>A: 11111011₂ (flip 00000101 → 11111010, add 1 → 11111011 = -5)</em></li>
                <li><strong>Q:</strong> Why does <code>0o777</code> mean "full permissions" in Unix?<br/>
                    <em>A: Each octal digit maps to 3 bits (rwx). 7₈ = 111₂ = read+write+execute for owner, group, and others.</em></li>
            </ol>`
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW QUESTIONS
    // ═══════════════════════════════════════════════════════════════
    questions: [
        {
            question: 'Explain how negative numbers are represented in binary using two\'s complement.',

            difficulty: 'easy',

            answer: `<p><strong>Two's complement</strong> is the standard method computers use to represent
            signed integers. To negate a number:</p>
            <ol>
                <li>Write the positive number in binary</li>
                <li>Flip all bits (one's complement)</li>
                <li>Add 1 to the result</li>
            </ol>
            <p>For example, -5 in an 8-bit system:</p>
            <ul>
                <li>+5 = <code>00000101</code></li>
                <li>Flip = <code>11111010</code></li>
                <li>Add 1 = <code>11111011</code> = -5</li>
            </ul>
            <p>The MSB (bit 7) acts as the sign bit: 0 = positive, 1 = negative.
            An 8-bit signed integer ranges from -128 to +127.</p>`,

            explanation: 'Think of two\'s complement like an odometer rolling backwards past zero. After 00000000 (zero), subtracting 1 gives 11111111 (-1), then 11111110 (-2), and so on.',

            code: `// Two's complement demonstration
function twosComplement(value, bits = 8) {
    if (value >= 0) {
        return value.toString(2).padStart(bits, '0');
    }
    // For negative: compute 2^bits + value
    const result = (1 << bits) + value;
    return result.toString(2);
}

console.log(twosComplement(5));   // "00000101"
console.log(twosComplement(-5));  // "11111011"
console.log(twosComplement(-1));  // "11111111"
console.log(twosComplement(-128)); // "10000000"`,

            language: 'javascript',

            bestPractices: [
                'Always consider the bit width when working with signed numbers',
                'Use language-specific types (int8, int16, int32) to make sign and range explicit',
                'Remember: the negation of the minimum value overflows (e.g., -(-128) overflows in int8)'
            ],

            commonMistakes: [
                'Confusing one\'s complement (just flipping bits) with two\'s complement (flip + add 1)',
                'Forgetting that the range is asymmetric: -128 to +127 for 8 bits, not -128 to +128',
                'Sign-extending incorrectly when casting between different bit widths'
            ],

            interviewTip: 'When asked about binary representation, start by clarifying the bit width. Then walk through the conversion step by step. Mentioning overflow behavior shows depth.',

            followUp: [
                'Why is two\'s complement preferred over sign-magnitude or one\'s complement?',
                'What happens when you negate the most negative value in two\'s complement?',
                'How does sign extension work when promoting an int8 to int32?'
            ],

            seniorPerspective: 'In production, two\'s complement matters when working with binary protocols, serialization formats, or cross-platform data exchange. Endianness combined with sign representation is a frequent source of bugs in network programming.',

            architectPerspective: 'At the system level, understanding integer representation is critical for designing protocols, choosing wire formats (protobuf uses varint/zigzag encoding for signed integers), and ensuring data integrity across heterogeneous systems.'
        },

        {
            question: 'Why do programmers use hexadecimal instead of binary or decimal? Give practical examples.',

            difficulty: 'medium',

            answer: `<p><strong>Hexadecimal</strong> is preferred because it provides a compact, human-readable
            representation that maps perfectly to binary:</p>
            <ul>
                <li>Each hex digit = exactly 4 bits (one nibble)</li>
                <li>A byte is always 2 hex digits (00–FF)</li>
                <li>Easy mental conversion to/from binary</li>
                <li>More compact than binary, more aligned to hardware than decimal</li>
            </ul>
            <p><strong>Practical examples:</strong></p>
            <ul>
                <li><strong>Colors:</strong> <code>#FF8800</code> — R=255, G=136, B=0 (each pair = 1 byte)</li>
                <li><strong>Memory addresses:</strong> <code>0x7FFE0000</code> — clearly shows alignment and page boundaries</li>
                <li><strong>Bit masks:</strong> <code>0x0F</code> masks the lower 4 bits (clearer than 15 decimal)</li>
                <li><strong>MAC addresses:</strong> <code>AA:BB:CC:DD:EE:FF</code> — each pair = 1 byte</li>
                <li><strong>Error codes:</strong> <code>0x80070005</code> — Windows HRESULT encodes facility and code</li>
            </ul>`,

            explanation: 'Hex is like a zip code for binary. Instead of writing out "0000 1111 1000 1000 0000 0000" you write "0F8800". Same information, much easier to read and communicate.',

            code: `// Practical hex usage examples

// 1. Color manipulation
const red = 0xFF0000;
const green = 0x00FF00;
const blue = 0x0000FF;
const yellow = red | green;  // 0xFFFF00

// 2. Bit flags
const READ    = 0x04;  // 100
const WRITE   = 0x02;  // 010
const EXECUTE = 0x01;  // 001
const permissions = READ | WRITE;  // 0x06 = 110

// 3. Extracting bytes from a 32-bit value
const value = 0xCAFEBABE;
const byte3 = (value >> 24) & 0xFF;  // 0xCA = 202
const byte2 = (value >> 16) & 0xFF;  // 0xFE = 254
const byte1 = (value >> 8) & 0xFF;   // 0xBA = 186
const byte0 = value & 0xFF;          // 0xBE = 190

// 4. IP address to hex
const ip = '192.168.1.1';
const hex = ip.split('.').map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
console.log('0x' + hex);  // 0xc0a80101`,

            language: 'javascript',

            bestPractices: [
                'Use hex for any value that represents bits, bytes, or hardware-level data',
                'Prefer hex over decimal for flag constants and bit masks',
                'Use consistent casing (0xFF or 0xff) within a project',
                'Add comments explaining what hex constants represent in context'
            ],

            commonMistakes: [
                'Using decimal for bit masks (mask = 15 vs mask = 0x0F — hex shows the bit pattern)',
                'Forgetting that hex is case-insensitive (0xAB === 0xab)',
                'Confusing string representation with numeric value ("FF" !== 0xFF)',
                'Not padding hex values (write 0x0A not 0xA for byte-aligned data)'
            ],

            interviewTip: 'Demonstrate practical knowledge by citing real examples from your work — debugging with hex dumps, reading network captures, or working with color values. This shows applied understanding beyond textbook knowledge.',

            followUp: [
                'How would you manually convert 0xDEAD to decimal?',
                'When would you use octal over hexadecimal?',
                'How does hex relate to Base64 encoding?'
            ],

            seniorPerspective: 'In my experience debugging production systems, hex is indispensable when reading memory dumps, analyzing core files, or inspecting network packets. The ability to quickly translate between hex and binary in your head accelerates root cause analysis significantly.',

            architectPerspective: 'Hex literacy is foundational for protocol design, debugging distributed systems at the wire level, and understanding how data structures are laid out in memory. When designing binary protocols, hex gives you byte-aligned clarity that decimal cannot.'
        },

        {
            question: 'What is endianness, and why does it matter when exchanging binary data between systems?',

            difficulty: 'medium',

            answer: `<p><strong>Endianness</strong> is the byte order used to store a multi-byte value in memory or
            on the wire:</p>
            <ul>
                <li><strong>Big-endian:</strong> the most significant byte (MSB) comes first (lowest address).
                The 32-bit value <code>0x12345678</code> is stored as bytes <code>12 34 56 78</code>.</li>
                <li><strong>Little-endian:</strong> the least significant byte (LSB) comes first.
                The same value is stored as <code>78 56 34 12</code>.</li>
            </ul>
            <p>It matters whenever raw bytes cross a boundary between systems with different conventions:
            x86/x64 CPUs are little-endian, many older RISC chips are big-endian, and network protocols use
            big-endian (called <em>network byte order</em>). If a sender and receiver disagree on byte order,
            multi-byte integers come out scrambled.</p>`,

            explanation: 'Imagine writing the number "one thousand two hundred" — some people write the big part first (1200), others write it reversed. If you do not agree which end comes first, you read each other\u2019s numbers wrong.',

            code: `// Detecting and converting endianness in C#
uint value = 0x12345678;

// Get the raw bytes in this machine's order
byte[] bytes = BitConverter.GetBytes(value);
bool machineIsLittleEndian = BitConverter.IsLittleEndian;

// Convert to network byte order (big-endian) for transmission
uint networkOrder = System.Net.IPAddress.HostToNetworkOrder((int)value) is int n
    ? (uint)n
    : value;`,

            language: 'csharp',

            bestPractices: [
                'Always define a byte order explicitly in any binary protocol or file format spec',
                'Use network byte order (big-endian) for data sent over the wire',
                'Use library helpers (BinaryPrimitives.ReadUInt32BigEndian, IPAddress.HostToNetworkOrder) rather than manual shifts'
            ],

            commonMistakes: [
                'Assuming the receiving machine has the same endianness as the sender',
                'Casting a byte buffer directly to an integer without accounting for byte order',
                'Confusing bit order (rarely an issue) with byte order (the actual concern)'
            ],

            interviewTip: 'Give the concrete byte layout of a value like 0x12345678 in both orders — showing the actual bytes proves you understand it rather than reciting the definition.',

            followUp: [
                'Why did TCP/IP standardize on big-endian for the wire?',
                'How would you write a serializer that is endianness-independent?',
                'What is the performance cost of byte-swapping in a hot path?'
            ],

            seniorPerspective: 'Endianness bugs are subtle because code works perfectly on the developer\u2019s little-endian laptop and only breaks against a big-endian peer or a fixed wire format. I make byte order an explicit part of any serialization contract and lean on BinaryPrimitives so the order is named in the call site, not implied.',

            architectPerspective: 'At the system level, every binary protocol and file format must pin down endianness as a first-class part of its specification. Choosing a canonical wire order (typically big-endian) and converting at the boundaries keeps heterogeneous services interoperable regardless of their native CPU architecture.'
        },

        {
            question: 'How does IEEE 754 represent floating-point numbers, and why can 0.1 + 0.2 not equal 0.3?',

            difficulty: 'hard',

            answer: `<p><strong>IEEE 754</strong> represents real numbers in a binary scientific-notation format with
            three fields:</p>
            <ul>
                <li><strong>Sign bit:</strong> 0 for positive, 1 for negative</li>
                <li><strong>Exponent:</strong> a biased power of 2 (8 bits for single, 11 for double precision)</li>
                <li><strong>Mantissa/significand:</strong> the fractional digits (23 bits single, 52 bits double)</li>
            </ul>
            <p>The value is roughly <code>(-1)^sign × 1.mantissa × 2^(exponent - bias)</code>. Because the
            mantissa is binary, only fractions whose denominator is a power of 2 can be represented exactly.
            Values like <code>0.1</code> and <code>0.2</code> are repeating fractions in binary, so they are
            stored as the nearest representable approximation. Adding those approximations yields
            <code>0.30000000000000004</code>, not exactly <code>0.3</code>.</p>`,

            explanation: 'Binary fractions are like trying to write 1/3 in decimal — you get 0.3333... forever and have to round. 0.1 has the same problem in binary, so the computer keeps a slightly-off version, and the tiny errors add up.',

            code: `// The classic floating-point surprise
double sum = 0.1 + 0.2;
Console.WriteLine(sum);              // 0.30000000000000004
Console.WriteLine(sum == 0.3);      // False

// Compare with a tolerance (epsilon) instead of equality
bool nearlyEqual = Math.Abs(sum - 0.3) < 1e-9;   // True

// For money, use decimal (base-10) to avoid binary rounding
decimal money = 0.1m + 0.2m;        // exactly 0.3`,

            language: 'csharp',

            bestPractices: [
                'Never compare floating-point values with == ; use an epsilon tolerance',
                'Use decimal (base-10) for currency and exact fractional values',
                'Be aware of precision limits: double has ~15-17 significant decimal digits'
            ],

            commonMistakes: [
                'Testing float equality directly and getting flaky results',
                'Using float/double for money, accumulating rounding errors',
                'Assuming a value entered as 0.1 is stored as exactly 0.1'
            ],

            interviewTip: 'Explain the root cause — binary fractions cannot represent most base-10 decimals exactly — then give the two fixes (epsilon comparison, decimal for money). Cause plus remedy shows depth.',

            followUp: [
                'What are denormalized numbers, NaN, and infinity in IEEE 754?',
                'When would you choose float over double?',
                'How does decimal differ internally from double?'
            ],

            seniorPerspective: 'I treat "do not use floating point for money" as a hard rule on every team. The 0.1 + 0.2 example is the canonical illustration, but in practice these errors surface as one-cent discrepancies in financial reports that auditors notice. decimal for currency and epsilon comparisons for measured quantities prevent a whole class of bugs.',

            architectPerspective: 'At a system level, numeric type choice is a design decision with downstream consequences: doubles for scientific/graphics workloads where speed and range matter, decimals for financial systems where exactness and auditability dominate. Picking the wrong representation early leaks into databases, APIs, and reports that are painful to migrate later.'
        },

        {
            question: 'Explain the common bitwise operators and bit shifting, and give practical uses for each.',

            difficulty: 'medium',

            answer: `<p>Bitwise operators act on the individual bits of integers:</p>
            <ul>
                <li><strong>AND (&amp;):</strong> 1 only where both bits are 1 — used to mask/test bits
                (<code>flags &amp; MASK</code>).</li>
                <li><strong>OR (|):</strong> 1 where either bit is 1 — used to set bits
                (<code>flags | FLAG</code>).</li>
                <li><strong>XOR (^):</strong> 1 where bits differ — used to toggle bits and for parity.</li>
                <li><strong>NOT (~):</strong> inverts every bit — used to build a clear mask
                (<code>flags &amp; ~FLAG</code>).</li>
                <li><strong>Left shift (&lt;&lt;):</strong> shifts bits left, multiplying by 2 per position.</li>
                <li><strong>Right shift (&gt;&gt;):</strong> shifts bits right, dividing by 2 per position
                (sign-preserving for signed types).</li>
            </ul>
            <p>Shifts and masks are how you pack multiple values into one integer, extract fields, and implement
            efficient flag sets.</p>`,

            explanation: 'Think of an integer as a row of light switches. AND/OR/XOR/NOT let you read or flip specific switches, while shifting slides the whole row left or right — sliding left adds a zero on the end, which doubles the number.',

            code: `// Set, clear, toggle, and test a specific bit (position k)
int Set(int n, int k)    => n | (1 << k);
int Clear(int n, int k)  => n & ~(1 << k);
int Toggle(int n, int k) => n ^ (1 << k);
bool Test(int n, int k)  => (n & (1 << k)) != 0;

// Shifts as fast multiply/divide by powers of two
int doubled = value << 1;   // value * 2
int quarter = value >> 2;   // value / 4

// Pack two bytes into a 16-bit value and extract them
int packed = (high << 8) | low;
int hi = (packed >> 8) & 0xFF;
int lo = packed & 0xFF;`,

            language: 'csharp',

            bestPractices: [
                'Use named flag constants and [Flags] enums rather than raw bit literals',
                'Parenthesize bitwise expressions — & and | have lower precedence than == ',
                'Prefer unsigned types when right-shifting to avoid sign-extension surprises'
            ],

            commonMistakes: [
                'Shifting by an amount >= the type width (undefined or wrapped behavior)',
                'Forgetting that >> on a signed negative value fills with 1s (arithmetic shift)',
                'Mixing up & (bitwise) with && (logical) in conditions'
            ],

            interviewTip: 'Demonstrate the set/clear/toggle/test quartet with 1 << k — it is the canonical bit-manipulation pattern interviewers expect you to produce from memory.',

            followUp: [
                'What is the difference between an arithmetic and a logical right shift?',
                'How would you count the number of set bits in an integer?',
                'When is a [Flags] enum better than separate boolean fields?'
            ],

            seniorPerspective: 'I reach for bit flags when packing many booleans where memory or wire size matters — permission sets, feature toggles serialized into a single column. But I always wrap the shifts behind a well-named enum or helper, because raw bit math in business logic is a maintenance trap that the next developer will misread.',

            architectPerspective: 'Bit packing is a deliberate space/clarity trade-off. In protocols, embedded systems, and high-volume storage it can save real bandwidth and memory, but it couples readers and writers to an exact layout. The architectural call is whether the density gain justifies the reduced readability and the versioning rigidity it imposes on the format.'
        },

        {
            question: 'How is text represented as numbers? Explain ASCII, Unicode, and UTF-8.',

            difficulty: 'medium',

            answer: `<p>Computers store only numbers, so text is encoded as numeric <em>code points</em> mapped to
            bytes:</p>
            <ul>
                <li><strong>ASCII:</strong> a 7-bit scheme (0–127) covering English letters, digits, and basic
                punctuation. <code>'A'</code> = 65, <code>'a'</code> = 97, <code>'0'</code> = 48.</li>
                <li><strong>Unicode:</strong> a universal <em>character set</em> assigning a unique code point to
                every character in every language (e.g., U+0041 for 'A', U+1F600 for an emoji). It is a mapping,
                not a byte encoding.</li>
                <li><strong>UTF-8:</strong> a variable-length <em>encoding</em> of Unicode: 1 byte for ASCII
                characters (backward compatible), up to 4 bytes for others. It is the dominant web encoding.</li>
            </ul>
            <p>The key distinction: Unicode says <em>which number</em> a character is; UTF-8/UTF-16 say <em>how
            those numbers become bytes</em>.</p>`,

            explanation: 'Unicode is a giant numbered dictionary listing every character once. UTF-8 is the rule for writing those dictionary numbers down as bytes — small numbers (English) take one byte, bigger ones take more.',

            code: `// Encoding text to bytes and back in C#
string text = "Aé😀";

byte[] utf8 = System.Text.Encoding.UTF8.GetBytes(text);
// 'A' -> 1 byte, 'é' -> 2 bytes, '😀' -> 4 bytes  => 7 bytes total
Console.WriteLine(utf8.Length);               // 7

string roundTrip = System.Text.Encoding.UTF8.GetString(utf8);
Console.WriteLine(roundTrip == text);         // True

// A char is a UTF-16 code unit, so an emoji is a surrogate pair (length 2)
Console.WriteLine("😀".Length);               // 2`,

            language: 'csharp',

            bestPractices: [
                'Use UTF-8 as the default encoding for files, APIs, and storage',
                'Always specify the encoding explicitly when reading/writing bytes',
                'Treat user-facing string length carefully — code units are not user-perceived characters'
            ],

            commonMistakes: [
                'Assuming one character equals one byte (only true for ASCII in UTF-8)',
                'Conflating Unicode (the code-point set) with UTF-8 (a byte encoding)',
                'Decoding bytes with the wrong encoding, producing mojibake (garbled text)'
            ],

            interviewTip: 'State the Unicode-vs-UTF-8 distinction explicitly — "Unicode is the character set, UTF-8 is one way to encode it as bytes." That precision separates strong candidates from those who use the terms interchangeably.',

            followUp: [
                'Why is UTF-8 backward compatible with ASCII?',
                'What is a surrogate pair in UTF-16?',
                'How do byte order marks (BOM) relate to encoding detection?'
            ],

            seniorPerspective: 'Most "weird character" production bugs trace back to an encoding mismatch at a boundary — a file read with the platform default instead of UTF-8, or a database column in latin1. I standardize on UTF-8 end to end and make encoding an explicit parameter at every I/O boundary so there is no implicit default to get wrong.',

            architectPerspective: 'Encoding is a cross-cutting contract: databases, message queues, file formats, and HTTP layers must all agree on UTF-8 (and declare charset in headers). Establishing that standard early avoids a category of internationalization defects that are expensive to retrofit once data with mixed encodings has accumulated.'
        },

        {
            question: 'How does two\'s complement handle the asymmetric range (e.g., -128 to +127 for 8 bits), and what happens when you negate the minimum value?',

            difficulty: 'hard',

            answer: `<p>In two's complement, the range for N bits is <strong>-2^(N-1) to +2^(N-1)-1</strong>. For 8 bits that is -128 to +127 — one extra negative value because zero occupies a positive slot. The minimum value (<code>10000000</code> for int8 = -128) has no positive counterpart within the same bit width.</p>
            <p>Negating -128 via the standard invert-and-add-1 process: invert <code>10000000</code> → <code>01111111</code>, add 1 → <code>10000000</code> = -128 again. This is <strong>signed overflow</strong> — the result wraps back to the same value. In C# with <code>checked</code> context this throws <code>OverflowException</code>; in <code>unchecked</code> it silently produces -128. Languages like C/C++ leave signed overflow as undefined behavior entirely.</p>`,

            explanation: 'It is like an elevator that goes from floor -128 to +127. There is no floor +128 — if you try to go there, you wrap around back to -128. The building simply does not have a room for the positive mirror of its deepest basement.',

            code: `// Demonstrating the asymmetry and overflow:
sbyte min = sbyte.MinValue;     // -128
sbyte max = sbyte.MaxValue;     // +127

// Unchecked: silent wraparound
sbyte negated = unchecked((sbyte)(-min));  // -128 again (overflow)

// Checked: throws at runtime
try { sbyte safe = checked((sbyte)(-min)); }
catch (OverflowException) { /* -(-128) overflows 8-bit signed */ }

// Practical implication: Math.Abs(int.MinValue) throws in checked context
int danger = int.MinValue; // -2,147,483,648
// int abs = Math.Abs(danger); // OverflowException!`,

            language: 'csharp',

            bestPractices: [
                'Always handle the MinValue edge case when negating or taking absolute values',
                'Use checked arithmetic in safety-critical code to detect overflow early',
                'Prefer unsigned types when you need the full positive range without sign complications'
            ],

            commonMistakes: [
                'Assuming -int.MinValue produces a valid positive int (it overflows)',
                'Writing Math.Abs without guarding against MinValue input',
                'Relying on unchecked wraparound behavior that differs across languages'
            ],

            interviewTip: 'Walk through the bit-level negate of 10000000 to show it maps back to itself. Then connect this to real code: Math.Abs(int.MinValue) is a production bug people hit. Showing both the theory and the practical trap is the senior signal.',

            followUp: [
                'Why does C# distinguish checked and unchecked contexts?',
                'How do languages like Rust handle integer overflow differently?',
                'What is the difference between undefined behavior (C) and defined wraparound (C#/Java)?'
            ]
        },

        {
            question: 'Explain the IEEE 754 special values (NaN, Infinity, denormalized numbers) and the precision issues that arise from floating-point gaps.',

            difficulty: 'hard',

            answer: `<p>IEEE 754 reserves special bit patterns beyond normal numbers:</p>
            <ul>
                <li><strong>±Infinity:</strong> exponent all 1s, mantissa all 0s. Results from division by zero or overflow. Infinity propagates in arithmetic (Inf + 1 = Inf).</li>
                <li><strong>NaN (Not a Number):</strong> exponent all 1s, mantissa non-zero. Results from invalid operations (0/0, sqrt(-1)). NaN is never equal to anything, including itself (<code>NaN != NaN</code>).</li>
                <li><strong>Denormalized (subnormal) numbers:</strong> exponent all 0s, mantissa non-zero. These fill the gap between zero and the smallest normalized number, providing gradual underflow instead of an abrupt jump to zero.</li>
            </ul>
            <p>The precision gap issue: floating-point numbers are not uniformly spaced. Between 1.0 and 2.0 there are ~2^52 representable doubles, but between 2^52 and 2^53, consecutive representable values are exactly 1.0 apart — meaning integers above ~9×10^15 cannot all be represented. This causes subtle bugs when using doubles for large IDs or financial totals.</p>`,

            explanation: 'Floating-point numbers are like mile markers that get farther apart the further you travel from zero. Near zero they are inches apart; near huge values they are miles apart. NaN is a "road closed" sign, and Infinity is driving off the edge of the map.',

            code: `// Special values in action:
double posInf = 1.0 / 0.0;        // Positive Infinity
double negInf = -1.0 / 0.0;       // Negative Infinity
double nan = 0.0 / 0.0;           // NaN

Console.WriteLine(nan == nan);      // False! NaN is NEVER equal to itself
Console.WriteLine(double.IsNaN(nan)); // True — use this instead

// Precision gaps at large magnitudes:
double big = Math.Pow(2, 53);       // 9,007,199,254,740,992
Console.WriteLine(big == big + 1);  // True! Cannot distinguish big and big+1

// JavaScript JSON IDs: a 64-bit int ID loses precision as a JSON double
long id = 9007199254740993L;        // exceeds 2^53
double asDouble = (double)id;       // rounds to 9007199254740992
Console.WriteLine(id == (long)asDouble); // False — precision lost

// Denormalized numbers (gradual underflow):
double tiny = double.Epsilon;       // smallest positive denorm: ~5e-324
double halfTiny = tiny / 2;         // underflows to 0.0 (below denorm range)`,

            language: 'csharp',

            bestPractices: [
                'Use double.IsNaN() and double.IsInfinity() — never compare NaN with ==',
                'Never use floating-point for IDs or monetary values that require exact integer fidelity',
                'Be aware that precision degrades at large magnitudes — doubles cannot represent all integers above 2^53'
            ],

            commonMistakes: [
                'Comparing a value to NaN with == (always false) instead of double.IsNaN()',
                'Serializing 64-bit integer IDs as JSON numbers (JavaScript loses precision beyond 2^53)',
                'Assuming floating-point spacing is uniform (it widens exponentially with magnitude)'
            ],

            interviewTip: 'Explain that NaN != NaN is by IEEE 754 design, not a bug. Then mention the practical 2^53 precision limit that bites when serializing large IDs to JSON. Connecting specification detail to a real-world API bug demonstrates production awareness.',

            followUp: [
                'Why did IEEE 754 define NaN as not equal to itself?',
                'How do denormalized numbers prevent the "catastrophic cancellation" problem?',
                'What is the difference between quiet NaN and signaling NaN?'
            ]
        }
    ]
});
