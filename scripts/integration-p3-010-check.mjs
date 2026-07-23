#!/usr/bin/env node
import { readFileSync } from 'node:fs';
JSON.parse(readFileSync('contracts/integration/integration-event-v1.schema.json','utf8'));
JSON.parse(readFileSync('contracts/integration/integration-event-registry.json','utf8'));
await import('../backend/services/integrationEvents.js');
console.log('P3-010 integration event contracts present.');
