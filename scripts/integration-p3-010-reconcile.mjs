#!/usr/bin/env node
const args=new Set(process.argv.slice(2));
if(!args.has('--dry-run')&&!args.has('--confirm')){console.error('P3-010 reconciliation scripts require --dry-run or --confirm.');process.exit(2)}
console.log(JSON.stringify({ok:true,mode:args.has('--dry-run')?'dry-run':'confirm-required',target:[...args].find(a=>!a.startsWith('--'))||'all',payloads:'redacted'}));
