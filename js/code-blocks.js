/* ═══════════════════════════════════════════════════════════════════
   CODE-BLOCKS.JS — Syntax Highlighting & Copy Functionality
   Custom offline syntax highlighter (no CDN)
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

const CodeBlocks = (() => {
    // Token patterns for each language
    const PATTERNS = {
        csharp: [
            { type: 'comment', regex: /\/\/.*$/gm },
            { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
            { type: 'string', regex: /\$?"(?:[^"\\]|\\.)*"/g },
            { type: 'string', regex: /@"(?:[^"]|"")*"/g },
            { type: 'string', regex: /'[^'\\]'/g },
            { type: 'keyword', regex: /\b(abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|record|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|var|virtual|void|volatile|where|while|yield|when|init|required|global|file|scoped)\b/g },
            { type: 'type', regex: /\b(Task|ValueTask|IEnumerable|IQueryable|List|Dictionary|HashSet|Queue|Stack|Action|Func|Predicate|Span|Memory|ReadOnlySpan|CancellationToken|IDisposable|IAsyncDisposable|StringBuilder|HttpClient|ILogger|IOptions|IConfiguration|IServiceCollection|IApplicationBuilder|IHost|WebApplication)\b/g },
            { type: 'attribute', regex: /\[[\w]+(?:\(.*?\))?\]/g },
            { type: 'number', regex: /\b\d+(\.\d+)?[fFdDmMlL]?\b/g },
            { type: 'function', regex: /\b([A-Z]\w*)\s*(?=\()/g },
            { type: 'property', regex: /\.([A-Za-z]\w*)/g },
        ],
        javascript: [
            { type: 'comment', regex: /\/\/.*$/gm },
            { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
            { type: 'string', regex: /`(?:[^`\\]|\\.)*`/g },
            { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
            { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
            { type: 'keyword', regex: /\b(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|null|of|return|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/g },
            { type: 'number', regex: /\b\d+(\.\d+)?\b/g },
            { type: 'function', regex: /\b(\w+)\s*(?=\()/g },
        ],
        typescript: [
            { type: 'comment', regex: /\/\/.*$/gm },
            { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
            { type: 'string', regex: /`(?:[^`\\]|\\.)*`/g },
            { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
            { type: 'string', regex: /'(?:[^'\\]|\\.)*'/g },
            { type: 'keyword', regex: /\b(abstract|as|async|await|break|case|catch|class|const|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|super|switch|this|throw|try|type|typeof|undefined|var|void|while|with|yield)\b/g },
            { type: 'type', regex: /\b(string|number|boolean|any|void|never|unknown|object|Array|Promise|Observable|Subject|BehaviorSubject)\b/g },
            { type: 'number', regex: /\b\d+(\.\d+)?\b/g },
            { type: 'function', regex: /\b(\w+)\s*(?=\()/g },
        ],
        sql: [
            { type: 'comment', regex: /--.*$/gm },
            { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
            { type: 'string', regex: /'(?:[^']|'')*'/g },
            { type: 'keyword', regex: /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|CROSS|ON|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|AS|ORDER|BY|GROUP|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|PROCEDURE|FUNCTION|TRIGGER|BEGIN|END|IF|ELSE|WHILE|RETURN|DECLARE|EXEC|EXECUTE|WITH|UNION|ALL|DISTINCT|TOP|ASC|DESC|CASE|WHEN|THEN|NOLOCK|ROWCOUNT|IDENTITY|PRIMARY|KEY|FOREIGN|REFERENCES|CONSTRAINT|DEFAULT|CHECK|UNIQUE|CLUSTERED|NONCLUSTERED|PARTITION|OVER|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|CTE|MERGE|OUTPUT|TRANSACTION|COMMIT|ROLLBACK|TRY|CATCH|THROW)\b/gi },
            { type: 'number', regex: /\b\d+(\.\d+)?\b/g },
            { type: 'function', regex: /\b(COUNT|SUM|AVG|MAX|MIN|ISNULL|COALESCE|CAST|CONVERT|DATEADD|DATEDIFF|GETDATE|LEN|SUBSTRING|REPLACE|UPPER|LOWER|TRIM|CONCAT|STRING_AGG|JSON_VALUE|FORMAT)\b/gi },
        ],
        yaml: [
            { type: 'comment', regex: /#.*$/gm },
            { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
            { type: 'string', regex: /'(?:[^'])*'/g },
            { type: 'keyword', regex: /\b(true|false|null|yes|no)\b/gi },
            { type: 'property', regex: /^[\s]*[\w.-]+(?=\s*:)/gm },
            { type: 'number', regex: /\b\d+(\.\d+)?\b/g },
        ],
        json: [
            { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
            { type: 'keyword', regex: /\b(true|false|null)\b/g },
            { type: 'number', regex: /\b\d+(\.\d+)?\b/g },
        ],
        powershell: [
            { type: 'comment', regex: /#.*$/gm },
            { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
            { type: 'string', regex: /'(?:[^'])*'/g },
            { type: 'keyword', regex: /\b(function|param|begin|process|end|if|else|elseif|switch|foreach|for|while|do|try|catch|finally|throw|return|exit|break|continue)\b/gi },
            { type: 'variable', regex: /\$[\w]+/g },
            { type: 'function', regex: /\b(Get-|Set-|New-|Remove-|Write-|Read-|Import-|Export-|Invoke-)[\w-]+/g },
        ],
        bash: [
            { type: 'comment', regex: /#.*$/gm },
            { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g },
            { type: 'string', regex: /'[^']*'/g },
            { type: 'keyword', regex: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|in)\b/g },
            { type: 'variable', regex: /\$[\w{}]+/g },
        ]
    };

    function init() {
        document.querySelectorAll('pre code').forEach(block => {
            const lang = detectLanguage(block);
            if (lang && PATTERNS[lang]) {
                highlight(block, lang);
            }
        });
    }

    function highlight(block, lang) {
        let code = block.textContent;
        const patterns = PATTERNS[lang];
        
        // Create spans for tokens
        const tokens = [];
        
        patterns.forEach(pattern => {
            const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
            let match;
            while ((match = regex.exec(code)) !== null) {
                tokens.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    type: pattern.type,
                    text: match[0]
                });
            }
        });

        // Sort by position, remove overlaps
        tokens.sort((a, b) => a.start - b.start);
        const filtered = [];
        let lastEnd = 0;
        for (const token of tokens) {
            if (token.start >= lastEnd) {
                filtered.push(token);
                lastEnd = token.end;
            }
        }

        // Build highlighted HTML
        let result = '';
        let pos = 0;
        for (const token of filtered) {
            if (token.start > pos) {
                result += escapeHtml(code.slice(pos, token.start));
            }
            result += `<span class="token-${token.type}">${escapeHtml(token.text)}</span>`;
            pos = token.end;
        }
        if (pos < code.length) {
            result += escapeHtml(code.slice(pos));
        }

        block.innerHTML = result;
    }

    function detectLanguage(block) {
        // From class="language-xxx"
        const className = block.className || '';
        const match = className.match(/language-(\w+)/);
        if (match) return normalizeLanguage(match[1]);
        return null;
    }

    function normalizeLanguage(lang) {
        const map = {
            'cs': 'csharp', 'c#': 'csharp', 'csharp': 'csharp',
            'js': 'javascript', 'javascript': 'javascript',
            'ts': 'typescript', 'typescript': 'typescript',
            'sql': 'sql', 'tsql': 'sql',
            'yaml': 'yaml', 'yml': 'yaml',
            'json': 'json',
            'ps1': 'powershell', 'powershell': 'powershell',
            'bash': 'bash', 'sh': 'bash', 'shell': 'bash',
            'python': 'javascript', // basic fallback
        };
        return map[lang.toLowerCase()] || null;
    }

    function copy(btn) {
        const codeBlock = btn.closest('.code-block');
        const code = codeBlock?.querySelector('code')?.textContent;
        if (code) {
            navigator.clipboard.writeText(code).then(() => {
                btn.classList.add('copied');
                btn.innerHTML = `${Icons.check} <span>Copied!</span>`;
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = `${Icons.copy} <span>Copy</span>`;
                }, 2000);
            }).catch(() => {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = code;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                btn.innerHTML = `${Icons.check} <span>Copied!</span>`;
                setTimeout(() => { btn.innerHTML = `${Icons.copy} <span>Copy</span>`; }, 2000);
            });
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    return { init, copy, highlight };
})();
