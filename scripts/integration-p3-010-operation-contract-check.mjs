#!/usr/bin/env node
import { OPERATION_STATES } from '../backend/services/integrationEvents.js';
const required=['ACCEPTED','QUEUED','RUNNING','SUCCEEDED','PARTIALLY_SUCCEEDED','FAILED','CANCELLED'];
for(const k of required) if(!OPERATION_STATES[k]) throw new Error(`missing operation state ${k}`);
console.log('P3-010 operation contract check passed.');
