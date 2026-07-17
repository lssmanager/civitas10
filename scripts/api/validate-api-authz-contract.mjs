import fs from 'node:fs';
import path from 'node:path';

const directory = 'contracts/openapi/modules';
const failures = [];

for (const name of fs.readdirSync(directory).filter((item) => item.endsWith('.yaml'))) {
  const file = path.join(directory, name);
  const content = fs.readFileSync(file, 'utf8');
  const status = content.match(/x-civitas-status:\s*(\S+)/)?.[1];
  const permission = content.match(/x-civitas-permission:\s*(\S+)/)?.[1];
  const surface = content.match(/x-civitas-surface:\s*(\S+)/)?.[1];
  if (!status) failures.push(`${file}: missing status`);
  if (surface === 'organization' && !permission) failures.push(`${file}: organization operation requires permission metadata`);
  if (surface === 'organization' && !content.includes('same-organization')) failures.push(`${file}: missing same-organization policy`);
  if (status === 'active') failures.push(`${file}: documentation foundation must not declare unimplemented operations active`);
  if (/x-civitas-permission:\s*(null|none)/.test(content)) failures.push(`${file}: null permission is forbidden`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('API authorization metadata validation passed.');
