import fs from 'node:fs';
const required=['backend/planning/infrastructure/moduleExecutionContext.js','backend/planning/infrastructure/serviceIdentity.js'];
for (const f of required) if(!fs.existsSync(f)) { console.error(`P3-008 prerequisite missing ${f}`); process.exit(1); }
const t=required.map(f=>fs.readFileSync(f,'utf8')).join('\n');
if(/createUnsignedContext|allowAll|Authorization.*user/i.test(t)) { console.error('P3-008 unsafe bypass marker'); process.exit(1); }
console.log('P3-008 prerequisite gate passed');
