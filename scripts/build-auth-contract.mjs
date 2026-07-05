import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadCivitasSharedContract } = require("../core/shared/contract-loader.cjs");

const root = new URL("..", import.meta.url).pathname;
const sharedOutputPath = join(root, "dist/shared.contract.json");
const authOutputPath = join(root, "dist/auth.contract.json");
const sharedContract = loadCivitasSharedContract();
const authCompatibilityContract = { logto: sharedContract.logto, api: sharedContract.api, auth: sharedContract.auth };

mkdirSync(dirname(sharedOutputPath), { recursive: true });
writeFileSync(sharedOutputPath, `${JSON.stringify(sharedContract, null, 2)}\n`);
writeFileSync(authOutputPath, `${JSON.stringify(authCompatibilityContract, null, 2)}\n`);
console.log(`Wrote ${sharedOutputPath}`);
console.log(`Wrote ${authOutputPath}`);
