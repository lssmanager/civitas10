import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import test from "node:test";

const frontendRoot = resolve(new URL("..", import.meta.url).pathname);
const repoRoot = resolve(frontendRoot, "..");
const intakeRoot = join(frontendRoot, ".design-intake", "contract-tests");
const mapper = join(frontendRoot, "scripts/design-system/map-tailwind-plus-palette.mjs");
const mapping = join(frontendRoot, "scripts/design-system/semantic-utility-map.json");
const provenanceValidator = join(frontendRoot, "scripts/design-system/validate-provenance.mjs");

const resetIntake = () => {
  rmSync(intakeRoot, { recursive: true, force: true });
  mkdirSync(intakeRoot, { recursive: true });
};
const runNode = (args, options = {}) => spawnSync(process.execPath, args, { cwd: frontendRoot, encoding: "utf8", ...options });

test("mapper maps explicit semantic rules and preserves structure with a machine-readable report", () => {
  resetIntake();
  const input = join(intakeRoot, "Synthetic.source.tsx");
  const output = join(intakeRoot, "Synthetic.mapped.tsx");
  const reportPath = join(intakeRoot, "Synthetic.report.json");
  writeFileSync(input, 'export const Synthetic = () => <div className="bg-white text-gray-900 border-gray-200 flex"><button className="bg-indigo-600 hover:bg-indigo-700">Synthetic</button></div>;\n');

  const result = runNode([mapper, "--input", input, "--output", output, "--report", reportPath, "--mapping", mapping]);
  assert.equal(result.status, 0, result.stderr);
  const mapped = readFileSync(output, "utf8");
  assert.match(mapped, /className="bg-surface text-text border-border flex"/);
  assert.match(mapped, /className="bg-primary hover:bg-primary-strong"/);
  assert.match(mapped, /export const Synthetic/);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  assert.equal(report.summary.mapped, 5);
  assert.equal(report.summary.unchanged, 1);
  assert.equal(report.promotable, true);
  assert.deepEqual(report.unresolved, []);
});

test("mapper fails closed for ambiguous dark mode and arbitrary visual values", () => {
  resetIntake();
  const input = join(intakeRoot, "Unresolved.source.tsx");
  const output = join(intakeRoot, "Unresolved.mapped.tsx");
  const reportPath = join(intakeRoot, "Unresolved.report.json");
  writeFileSync(input, 'export const Synthetic = () => <div className="dark:bg-gray-900 text-[rgb(1,2,3)] shadow-[0_0_1px_red]" />;\n');

  const result = runNode([mapper, "--input", input, "--output", output, "--report", reportPath, "--mapping", mapping]);
  assert.notEqual(result.status, 0);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  assert.equal(report.summary.unresolved, 3);
  assert.equal(report.promotable, false);
  assert.deepEqual(report.unresolved.map((item) => item.reason), ["dark-mode-requires-explicit-semantic-review", "arbitrary-visual-utility", "arbitrary-visual-utility"]);
});

test("mapper rejects input and output outside frontend/.design-intake and never promotes to src", () => {
  resetIntake();
  const safeInput = join(intakeRoot, "Safe.source.tsx");
  writeFileSync(safeInput, '<div className="bg-white" />\n');
  const reportPath = join(intakeRoot, "Safe.report.json");
  const outsideInput = join(frontendRoot, "scripts/design-system/fixtures/synthetic-source.tsx");
  const outsideOutput = join(frontendRoot, "src/ShouldNotExist.tsx");

  const inputResult = runNode([mapper, "--input", outsideInput, "--output", join(intakeRoot, "Safe.mapped.tsx"), "--report", reportPath, "--mapping", mapping]);
  assert.notEqual(inputResult.status, 0);
  assert.match(inputResult.stderr, /input must be inside/);

  const outputResult = runNode([mapper, "--input", safeInput, "--output", outsideOutput, "--report", reportPath, "--mapping", mapping]);
  assert.notEqual(outputResult.status, 0);
  assert.match(outputResult.stderr, /output must be inside/);
});

test("provenance empty file is valid", () => {
  const result = runNode([provenanceValidator]);
  assert.equal(result.status, 0, result.stderr);
});

test("provenance invalid real entry fails for secrets, committed source, invalid SHA, and incomplete reviews", () => {
  resetIntake();
  const invalid = join(intakeRoot, "invalid-provenance.json");
  writeFileSync(invalid, JSON.stringify({
    version: 1,
    entries: [{
      component: "SyntheticTabs",
      sourceFamily: "Tailwind Plus / Tabs",
      sourceVersion: "4.3",
      licenseVerified: true,
      licenseType: "personal",
      verifiedBy: "reviewer@example.com",
      adaptedAt: "2026-07-13",
      mapperVersion: "1",
      promotionCommit: "abc123",
      redistributionBoundary: "public-library",
      sourceCommitted: true,
      licenseKey: "secret",
      review: { semantic: true, accessibility: false, responsive: true }
    }]
  }, null, 2));
  const result = runNode([provenanceValidator, "--file", invalid]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /sourceCommitted must be false/);
  assert.match(result.stderr, /promotionCommit must be a full 40-character git SHA/);
  assert.match(result.stderr, /forbidden secret/);
  assert.match(result.stderr, /email-like value/);
  assert.match(result.stderr, /review semantic\/accessibility\/responsive must all be true/);
});

test("intake directory is ignored and no intake files are tracked", () => {
  const ignored = execFileSync("git", ["check-ignore", "frontend/.design-intake/contract-tests/probe.tsx"], { cwd: repoRoot, encoding: "utf8" }).trim();
  assert.match(ignored, /frontend\/\.design-intake/);
  const tracked = execFileSync("git", ["ls-files", "frontend/.design-intake"], { cwd: repoRoot, encoding: "utf8" }).trim();
  assert.equal(tracked, "");
});
