#!/usr/bin/env node
import { readFileSync } from 'node:fs';
const schema=JSON.parse(readFileSync('contracts/integration/integration-event-v1.schema.json','utf8'));
const registry=JSON.parse(readFileSync('contracts/integration/integration-event-registry.json','utf8'));
const {createEventSchemaRegistry}=await import('../backend/services/integrationEvents.js');
const reg=createEventSchemaRegistry(registry.events);
if(!registry.events||registry.events.length===0) throw new Error('integration-event-registry.json must contain events');
if(!schema.type) throw new Error('integration-event-v1.schema.json must be valid JSON schema');
const list=reg.list();
if(list.length!==registry.events.length) throw new Error('registry event count mismatch');
for(const e of list){ if(!e.eventType||!e.schemaVersion) throw new Error(`invalid registry entry: ${JSON.stringify(e)}`); }
console.log(`P3-010 integration event contracts present and valid (${list.length} events).`);
