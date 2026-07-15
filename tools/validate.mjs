/* ═══════════════════════════════════════════════════════════════════
   validate.mjs — Interview Handbook validation suite
   ───────────────────────────────────────────────────────────────────
   Loads every data file (data/ tree) with a stubbed PageData (no browser),
   cross-checks ids against js/sitemap.js, counts questions per topic,
   statically lints every Mermaid definition, and audits code blocks.

   Run:  node tools/validate.mjs            (from interview-handbook/)
         node tools/validate.mjs --json      (machine-readable summary)

   Exit code is non-zero if any problem is found.

   NOTE on Mermaid: no mermaid/jsdom is vendored yet (Phase C), so this
   uses a conservative static linter that catches the high-confidence
   breakages listed in Req 2.3 (unknown type, truncated graph, bracket
   imbalance, unquoted parens/specials inside labels, empty diagram).
   ═══════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SITEMAP = path.join(ROOT, 'js', 'sitemap.js');

const CORE_THRESHOLD = 8;
const FOUNDATIONAL_THRESHOLD = 6;
const MIN_CODE_LEN = 20;

const JSON_OUT = process.argv.includes('--json');

// ─── helpers ────────────────────────────────────────────────────────
function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
    }
    return out;
}

function rel(p) {
    return path.relative(ROOT, p).split(path.sep).join('/');
}

// ─── 1. Load sitemap ────────────────────────────────────────────────
function loadSitemap() {
    const src = fs.readFileSync(SITEMAP, 'utf8');
    const iconsProxy = new Proxy({}, { get: () => '' });
    const sandbox = { Icons: iconsProxy, console, __export: null };
    vm.createContext(sandbox);
    // append an export so we can capture the block-scoped const SiteMap
    new vm.Script(src + '\n;__export = SiteMap;').runInContext(sandbox);
    return sandbox.__export;
}

function indexSitemap(sitemap) {
    // id -> { dataFile, level, title }
    const byId = new Map();
    // dataFile -> id
    const byFile = new Map();
    for (const lvl of sitemap.levels) {
        for (const group of lvl.groups) {
            for (const item of group.items) {
                byId.set(item.id, { dataFile: item.dataFile, level: lvl.level, title: item.title });
                if (item.dataFile) byFile.set(item.dataFile, item.id);
            }
        }
    }
    return { byId, byFile };
}

// ─── 2. Load a data file with stubbed PageData ──────────────────────
function loadDataFile(file) {
    const src = fs.readFileSync(file, 'utf8');
    const registrations = [];
    const PageData = {
        register(id, data) { registrations.push({ id, data }); },
        get: () => null,
    };
    const sandbox = { PageData, console: { log() {}, warn() {}, error() {} } };
    vm.createContext(sandbox);
    try {
        new vm.Script(src, { filename: rel(file) }).runInContext(sandbox);
    } catch (e) {
        return { registrations, loadError: e.message };
    }
    return { registrations, loadError: null };
}

// ─── 3. Mermaid static linter ───────────────────────────────────────
const DIAGRAM_TYPES = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
    'stateDiagram-v2', 'erDiagram', 'journey', 'gantt', 'pie', 'mindmap',
    'timeline', 'gitGraph', 'quadrantChart', 'requirementDiagram', 'C4Context',
];

function lintMermaid(def) {
    const problems = [];
    if (!def || !def.trim()) { return ['empty diagram']; }

    const lines = def.split('\n')
        .map(l => l.replace(/\t/g, ' ').trimEnd())
        .filter(l => l.trim() && !l.trim().startsWith('%%'));

    if (lines.length === 0) return ['empty diagram (only comments/blank)'];

    // (a) diagram type on first meaningful line
    const first = lines[0].trim();
    const typeWord = first.split(/\s/)[0];
    const typeOk = DIAGRAM_TYPES.some(t => t.toLowerCase() === typeWord.toLowerCase());
    if (!typeOk) {
        problems.push(`unknown/missing diagram type (first token: "${typeWord.slice(0, 40)}")`);
    }
    const kind = typeWord.toLowerCase();
    const isFlowchart = kind === 'graph' || kind === 'flowchart';

    // (b) truncation — last line ends with a dangling connector
    const last = lines[lines.length - 1].trim();
    if (/(--+>?|-\.->?|==+>?|->>|--[xo])\s*$/.test(last)) {
        problems.push(`possible truncation — last line ends with a dangling connector: "${last.slice(-24)}"`);
    }

    // (c) bracket balance outside double-quoted strings (flowchart/graph only —
    //     sequence uses --) async arrows, class/state use () in signatures).
    if (isFlowchart) {
        const balance = { '(': 0, '[': 0, '{': 0 };
        const opposite = { ')': '(', ']': '[', '}': '{' };
        let bStr = false;
        for (const ch of def) {
            if (bStr) { if (ch === '"') bStr = false; continue; }
            if (ch === '"') { bStr = true; continue; }
            if (ch === '(' || ch === '[' || ch === '{') balance[ch]++;
            else if (ch === ')' || ch === ']' || ch === '}') balance[opposite[ch]]--;
        }
        for (const k of Object.keys(balance)) {
            if (balance[k] !== 0) problems.push(`unbalanced '${k}' brackets (net ${balance[k]})`);
        }
    }

    // (d) unquoted special chars inside FLOWCHART node labels only.
    //     classDiagram/stateDiagram/erDiagram use ()/{}/<< >> structurally.
    if (isFlowchart) {
        // Remove quoted labels first — a quoted label is always valid regardless
        // of its contents (parens, <br/>, arrows), so it must not be flagged.
        let work = def.replace(/"[^"]*"/g, '""');
        // Shape-aware extraction, most-specific delimiters first so cylinder
        // [(x)], circle ((x)), stadium ([x]), hexagon {{x}}, subroutine [[x]]
        // are unwrapped to their inner text (no false paren flags).
        const shapeRes = [
            /\(\(([^)]*)\)\)/g,       // ((circle))
            /\{\{([^}]*)\}\}/g,       // {{hexagon}}
            /\[\[([^\]]*)\]\]/g,      // [[subroutine]]
            /\[\(([^)]*)\)\]/g,       // [(cylinder)]
            /\(\[([^\]]*)\]\)/g,      // ([stadium])
            /\[\/([^/]*)\/\]/g,       // [/parallelogram/]
            /\[\\([^\\]*)\\\]/g,      // [\trapezoid\]
        ];
        const labels = [];
        for (const re of shapeRes) {
            work = work.replace(re, (_, inner) => { labels.push(inner); return ' '; });
        }
        // remaining single-delimiter shapes: [rect], (round), {rhombus}
        for (const re of [/\[([^\]]*)\]/g, /\(([^)]*)\)/g, /\{([^}]*)\}/g]) {
            work = work.replace(re, (_, inner) => { labels.push(inner); return ' '; });
        }
        for (const raw of labels) {
            const label = raw.trim();
            if (!label || label === '""') continue;
            const stripped = label.replace(/<br\s*\/?>/gi, '');
            if (/[()]/.test(stripped)) {
                problems.push(`unquoted parentheses in label "${label.slice(0, 40)}" — wrap label in double quotes`);
            } else if (/[<>]/.test(stripped)) {
                problems.push(`unquoted angle bracket in label "${label.slice(0, 40)}" — wrap in double quotes`);
            }
        }
    }

    return problems;
}

// ─── 4. Code audit ──────────────────────────────────────────────────
function auditCode(code, language) {
    const problems = [];
    if (code == null) return problems;
    const trimmed = String(code).trim();
    if (trimmed.length === 0) { problems.push('empty code block'); return problems; }
    if (trimmed.length < MIN_CODE_LEN) problems.push(`code block too short (${trimmed.length} chars)`);
    if (/```/.test(code)) problems.push('triple-backtick fence artifact inside code string');
    // conservative language mismatch heuristics
    const lang = (language || '').toLowerCase();
    const looksSql = /^\s*(SELECT|CREATE\s+TABLE|INSERT\s+INTO|UPDATE\s+\w+\s+SET|ALTER\s+TABLE|WITH\s+\w+\s+AS)\b/i.test(trimmed);
    if (looksSql && lang && !/sql/.test(lang)) {
        problems.push(`language "${language}" but code looks like SQL`);
    }
    return problems;
}

// ─── walk topic content for diagrams + code ─────────────────────────
function collectContent(data) {
    const diagrams = [];   // { where, def }
    const codes = [];      // { where, code, language }

    const pushSection = (s, prefix) => {
        if (s.mermaid) diagrams.push({ where: `${prefix}.mermaid`, def: s.mermaid });
        if (s.code) codes.push({ where: `${prefix}.code`, code: s.code, language: s.language });
        if (Array.isArray(s.tabs)) {
            s.tabs.forEach((t, ti) => {
                if (t.mermaid) diagrams.push({ where: `${prefix}.tabs[${ti}].mermaid`, def: t.mermaid });
                if (t.code) codes.push({ where: `${prefix}.tabs[${ti}].code`, code: t.code, language: t.language });
            });
        }
    };

    (data.sections || []).forEach((s, i) => pushSection(s, `sections[${i}]`));
    (data.questions || []).forEach((q, i) => {
        if (q.mermaid) diagrams.push({ where: `questions[${i}].mermaid`, def: q.mermaid });
        if (q.code) codes.push({ where: `questions[${i}].code`, code: q.code, language: q.language });
    });

    return { diagrams, codes };
}

// ─── main ───────────────────────────────────────────────────────────
function main() {
    const sitemap = loadSitemap();
    const { byId, byFile } = indexSitemap(sitemap);

    const dataFiles = walk(DATA_DIR).filter(f => {
        const base = path.basename(f);
        return base !== 'page-data.js' && !base.startsWith('_');
    });

    const report = {
        topics: 0,
        questions: 0,
        belowThreshold: [],
        invalidDiagrams: [],
        suspectCode: [],
        idIssues: [],
        loadErrors: [],
        orphanFiles: [],
        missingFiles: [],
        diagramCount: 0,
    };

    for (const file of dataFiles) {
        const relFile = rel(file);
        const { registrations, loadError } = loadDataFile(file);

        if (loadError) {
            report.loadErrors.push(`${relFile}: ${loadError}`);
            continue;
        }
        if (registrations.length === 0) {
            report.idIssues.push(`${relFile}: no PageData.register call`);
            continue;
        }
        if (registrations.length > 1) {
            report.idIssues.push(`${relFile}: ${registrations.length} register calls (expected 1) — ids: ${registrations.map(r => r.id).join(', ')}`);
        }

        for (const { id, data } of registrations) {
            report.topics++;
            const expectedId = byFile.get(relFile);
            if (!byId.has(id)) {
                report.idIssues.push(`${relFile}: registers "${id}" which is not in sitemap`);
            } else if (expectedId && expectedId !== id) {
                report.idIssues.push(`${relFile}: registers "${id}" but sitemap maps this file to "${expectedId}"`);
            }

            const qCount = Array.isArray(data.questions) ? data.questions.length : 0;
            report.questions += qCount;

            const meta = byId.get(id);
            const foundational = meta && meta.level === 0;
            const threshold = foundational ? FOUNDATIONAL_THRESHOLD : CORE_THRESHOLD;
            if (qCount < threshold) {
                report.belowThreshold.push({ id, file: relFile, count: qCount, need: threshold, kind: foundational ? 'foundational' : 'core' });
            }

            const { diagrams, codes } = collectContent(data);
            report.diagramCount += diagrams.length;
            for (const d of diagrams) {
                const probs = lintMermaid(d.def);
                if (probs.length) report.invalidDiagrams.push({ id, where: d.where, problems: probs });
            }
            for (const c of codes) {
                const probs = auditCode(c.code, c.language);
                if (probs.length) report.suspectCode.push({ id, where: c.where, problems: probs });
            }
        }
    }

    // orphan / missing dataFile references
    const onDisk = new Set(dataFiles.map(rel));
    for (const [dataFile, id] of byFile) {
        if (!onDisk.has(dataFile)) report.missingFiles.push(`${dataFile} (sitemap id "${id}") — referenced but not on disk`);
    }
    for (const f of onDisk) {
        if (!byFile.has(f)) report.orphanFiles.push(`${f} — on disk but not referenced by sitemap`);
    }

    // ─── output ──────────────────────────────────────────────────────
    const line = '─'.repeat(64);
    if (JSON_OUT) {
        process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    } else {
        console.log(line);
        console.log('  INTERVIEW HANDBOOK — VALIDATION SUMMARY');
        console.log(line);
        console.log(`  Topics registered ......... ${report.topics}`);
        console.log(`  Total questions ........... ${report.questions}`);
        console.log(`  Diagrams checked .......... ${report.diagramCount}`);
        console.log(line);
        const section = (label, arr, fmt) => {
            console.log(`  ${label}: ${arr.length}`);
            arr.forEach(x => console.log('    - ' + fmt(x)));
        };
        section('Load errors', report.loadErrors, x => x);
        section('ID issues', report.idIssues, x => x);
        section('Missing data files', report.missingFiles, x => x);
        section('Orphan data files', report.orphanFiles, x => x);
        section('Topics below threshold', report.belowThreshold,
            x => `${x.id} (${x.file}): ${x.count}/${x.need} [${x.kind}]`);
        section('Invalid diagrams', report.invalidDiagrams,
            x => `${x.id} ${x.where}: ${x.problems.join('; ')}`);
        section('Suspect code blocks', report.suspectCode,
            x => `${x.id} ${x.where}: ${x.problems.join('; ')}`);
        console.log(line);
    }

    const problemCount =
        report.loadErrors.length + report.idIssues.length + report.missingFiles.length +
        report.belowThreshold.length + report.invalidDiagrams.length + report.suspectCode.length;
    // orphanFiles are informational only (not counted as failures)

    if (!JSON_OUT) {
        console.log(problemCount === 0
            ? '  RESULT: CLEAN ✔  (0 problems)'
            : `  RESULT: ${problemCount} problem(s) found ✘  (orphans: ${report.orphanFiles.length}, informational)`);
        console.log(line);
    }

    process.exit(problemCount === 0 ? 0 : 1);
}

main();
