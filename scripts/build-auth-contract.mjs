import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const sourcePath = join(root, "core/auth/civitas-auth.contract.ts");
const outputPath = join(root, "dist/auth.contract.json");
const source = readFileSync(sourcePath, "utf8");

const readString = (path) => {
  const pattern = path.split(".").join("\\s*:\\s*\\{[\\s\\S]*?") + "\\s*:\\s*\"([^\"]+)\"";
  const match = source.match(new RegExp(pattern));
  if (!match) throw new Error(`Unable to compile auth contract value: ${path}`);
  return match[1];
};

const contract = {
  logto: {
    issuer: readString("logto.issuer"),
    apiResource: readString("logto.apiResource"),
    managementApi: readString("logto.managementApi"),
  },
  api: {
    publicUrl: readString("api.publicUrl"),
  },
};

if (/^https?:\/\//i.test(contract.logto.apiResource)) {
  throw new Error("CivitasAuthContract.logto.apiResource must be a logical resource, not an HTTP URL");
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(contract, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
