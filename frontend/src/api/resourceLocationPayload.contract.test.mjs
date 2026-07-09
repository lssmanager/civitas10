import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('resource create organization contract accepts wizard location payload', () => {
  const source = readFileSync(join(__dirname, 'resource.ts'), 'utf8');
  assert.match(source, /business\?: \{/);
  assert.match(source, /location\?: \{/);
  assert.match(source, /countryId\?: number/);
  assert.match(source, /stateId\?: number/);
  assert.match(source, /cityId\?: number/);
  assert.match(source, /manualCity\?: string/);
  assert.match(source, /phonePrefix\?: string/);
});
