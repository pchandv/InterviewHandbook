import fs from 'fs';
import path from 'path';

const base = 'c:/GitLab/WorkSpace/KiroWorkSpaceTools/interview-handbook';
const sitemap = fs.readFileSync(path.join(base, 'js/sitemap.js'), 'utf8');
const dataFiles = [...sitemap.matchAll(/dataFile:\s*'([^']+)'/g)].map(m => m[1]).filter(Boolean);

const results = [];

for (const df of dataFiles) {
  const fp = path.join(base, df);
  if (!fs.existsSync(fp)) continue;
  const content = fs.readFileSync(fp, 'utf8');
  const lines = content.split('\n').length;
  
  // Count questions (both formats)
  const qOld = (content.match(/"question"/g) || []).length;
  const qNew = (content.match(/question:\s*'/g) || []).length;
  const qCount = qOld + qNew;
  
  // Count sections
  const sections = (content.match(/title:\s*'/g) || []).length;
  
  // Check for mermaid diagrams
  const hasMermaid = content.includes('mermaid');
  
  // Extract topic ID
  const idMatch = content.match(/register\('([^']+)'/);
  const id = idMatch ? idMatch[1] : df;
  
  results.push({ id, file: df, lines, questions: qCount, sections, mermaid: hasMermaid });
}

// Sort by questions (lowest first)
results.sort((a, b) => a.questions - b.questions);

console.log('=== TOPICS WITH FEWEST QUESTIONS (need more interview content) ===');
console.log('Questions | Sections | Lines | Mermaid | Topic');
console.log('---------|----------|-------|---------|------');
results.filter(r => r.questions < 5).forEach(r => {
  console.log(`${String(r.questions).padEnd(9)}| ${String(r.sections).padEnd(8)}| ${String(r.lines).padEnd(5)}| ${r.mermaid ? 'Yes' : 'NO '} | ${r.id}`);
});

console.log('\n=== TOPICS WITH 5-7 QUESTIONS (could use more) ===');
results.filter(r => r.questions >= 5 && r.questions < 8).forEach(r => {
  console.log(`${String(r.questions).padEnd(9)}| ${String(r.sections).padEnd(8)}| ${String(r.lines).padEnd(5)}| ${r.mermaid ? 'Yes' : 'NO '} | ${r.id}`);
});

console.log('\n=== SUMMARY BY QUESTION COUNT ===');
const buckets = { '0': 0, '1-4': 0, '5-7': 0, '8-10': 0, '11+': 0 };
results.forEach(r => {
  if (r.questions === 0) buckets['0']++;
  else if (r.questions < 5) buckets['1-4']++;
  else if (r.questions < 8) buckets['5-7']++;
  else if (r.questions <= 10) buckets['8-10']++;
  else buckets['11+']++;
});
Object.entries(buckets).forEach(([k, v]) => console.log(`  ${k} questions: ${v} topics`));

console.log('\n=== TOPICS WITHOUT MERMAID DIAGRAMS ===');
const noMermaid = results.filter(r => !r.mermaid);
console.log(`${noMermaid.length} topics missing diagrams`);
noMermaid.slice(0, 10).forEach(r => console.log(`  ${r.id} (${r.lines} lines)`));

console.log('\n=== TOTAL STATS ===');
const totalQ = results.reduce((s, r) => s + r.questions, 0);
const totalLines = results.reduce((s, r) => s + r.lines, 0);
console.log(`Topics: ${results.length}`);
console.log(`Total questions: ${totalQ}`);
console.log(`Total lines: ${totalLines}`);
console.log(`Average questions/topic: ${(totalQ / results.length).toFixed(1)}`);
