import fs from 'node:fs';
import path from 'node:path';

const explicitFiles = [
  'docs/adr/ADR-002-rest-api-boundary.md',
  'docs/architecture/CIVITAS_REST_API_STANDARD.md',
  'docs/architecture/CIVITAS_MODULE_HTTP_CONTRACT.md',
  'docs/development/CIVITAS_REST_API_DEVELOPER_GUIDE.md',
  'docs/development/CIVITAS_CODE_STYLE.md',
];
const roots = ['contracts/openapi', 'scripts/api'];
const extensions = new Set(['.md', '.yaml', '.yml', '.mjs']);
const failures = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const files = [...explicitFiles, ...roots.flatMap(walk)].filter(
  (item) => fs.existsSync(item) && extensions.has(path.extname(item)),
);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.endsWith('\n')) failures.push(`${file}: missing final newline`);
  if (content.includes('\r')) failures.push(`${file}: CRLF/CR is not allowed`);
  content.split('\n').forEach((line, index) => {
    if (/[ \t]+$/.test(line)) failures.push(`${file}:${index + 1}: trailing whitespace`);
  });
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('API style validation passed.');
