#!/usr/bin/env node
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const mapperVersion = "1";
const frontendRoot = realpathSync(new URL("../../", import.meta.url));
const intakeRoot = resolve(frontendRoot, ".design-intake");
const defaultMapping = resolve(frontendRoot, "scripts/design-system/semantic-utility-map.json");

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected positional argument: ${arg}`);
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    args[key] = value;
    index += 1;
  }
  return args;
};

const resolveFromCwd = (value) => resolve(process.cwd(), value);
const isInside = (path, dir) => {
  const rel = relative(dir, path);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
};
const assertIntakePath = (label, path) => {
  const resolved = resolveFromCwd(path);
  if (!isInside(resolved, intakeRoot)) throw new Error(`${label} must be inside frontend/.design-intake/: ${path}`);
  return resolved;
};

const visualRawPalettePattern = /^(?:(?:hover|focus|focus-visible|active|disabled|group-hover|data-\[[^\]]+\]):)*(?:bg|text|border|ring|outline|shadow|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-[\w./]+)?$/;
const arbitraryVisualPattern = /^(?:(?:hover|focus|focus-visible|active|disabled|group-hover|data-\[[^\]]+\]):)*(?:bg|text|border|ring|outline|shadow)-\[.+\]$/;
const darkVariantPattern = /(?:^|:)dark:/;
const forbiddenTokenPattern = /(?:tailwind-plus|tailwindplus|@tailwindplus|@tailwindui|catalyst)/i;

export const mapSource = ({ source, inputName, outputName, mapping }) => {
  const rules = new Map(mapping.rules.map((rule) => [rule.from, rule]));
  const report = {
    input: inputName,
    output: outputName,
    mapperVersion,
    summary: { mapped: 0, unchanged: 0, unresolved: 0, forbidden: 0 },
    mappings: [],
    unresolved: [],
    forbidden: [],
    requiresHumanReview: [],
    promotable: false,
  };

  const mappedSource = source.replace(/\b(className|class)\s*=\s*(["'`])([^"'`]*?)\2/g, (match, attr, quote, classValue) => {
    const tokens = classValue.split(/\s+/).filter(Boolean);
    const mappedTokens = tokens.map((token) => {
      if (forbiddenTokenPattern.test(token)) {
        report.summary.forbidden += 1;
        report.forbidden.push({ token, reason: "forbidden-tailwind-plus-or-catalyst-reference" });
        return token;
      }

      const rule = rules.get(token);
      if (rule) {
        report.summary.mapped += 1;
        const item = { from: rule.from, to: rule.to, kind: rule.kind, semanticIntent: rule.semanticIntent, requiresReview: Boolean(rule.requiresReview) };
        report.mappings.push(item);
        if (rule.requiresReview) report.requiresHumanReview.push(item);
        return rule.to;
      }

      if (darkVariantPattern.test(token)) {
        report.summary.unresolved += 1;
        report.unresolved.push({ token, reason: "dark-mode-requires-explicit-semantic-review" });
        return token;
      }

      if (arbitraryVisualPattern.test(token)) {
        report.summary.unresolved += 1;
        report.unresolved.push({ token, reason: "arbitrary-visual-utility" });
        return token;
      }

      if (visualRawPalettePattern.test(token)) {
        report.summary.unresolved += 1;
        report.unresolved.push({ token, reason: "raw-tailwind-palette-without-explicit-utility-rule" });
        return token;
      }

      report.summary.unchanged += 1;
      return token;
    });
    return `${attr}=${quote}${mappedTokens.join(" ")}${quote}`;
  });

  report.promotable = report.summary.unresolved === 0 && report.summary.forbidden === 0 && report.requiresHumanReview.length === 0;
  return { mappedSource, report };
};

export const run = (argv = process.argv.slice(2)) => {
  const args = parseArgs(argv);
  for (const key of ["input", "output", "report"]) if (!args[key]) throw new Error(`Missing --${key}`);
  const inputPath = assertIntakePath("input", args.input);
  const outputPath = assertIntakePath("output", args.output);
  const reportPath = assertIntakePath("report", args.report);
  const mappingPath = args.mapping ? resolveFromCwd(args.mapping) : defaultMapping;
  if (isInside(outputPath, resolve(frontendRoot, "src"))) throw new Error("output must not target product src/");

  const mapping = JSON.parse(readFileSync(mappingPath, "utf8"));
  if (mapping.version !== 1 || !Array.isArray(mapping.rules)) throw new Error("semantic utility mapping must include version 1 and rules[]");
  for (const rule of mapping.rules) {
    for (const field of ["from", "to", "kind", "semanticIntent", "requiresReview"]) {
      if (!(field in rule)) throw new Error(`mapping rule is missing ${field}`);
    }
  }

  const source = readFileSync(inputPath, "utf8");
  const { mappedSource, report } = mapSource({
    source,
    inputName: relative(intakeRoot, inputPath),
    outputName: relative(intakeRoot, outputPath),
    mapping,
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(outputPath, mappedSource);
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (!report.promotable) {
    console.error(`[design-intake-map] Mapping requires resolution before promotion. unresolved=${report.summary.unresolved} forbidden=${report.summary.forbidden} review=${report.requiresHumanReview.length}`);
    return 1;
  }
  console.log(`[design-intake-map] Mapping complete. mapped=${report.summary.mapped} unchanged=${report.summary.unchanged}`);
  return 0;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    process.exitCode = run();
  } catch (error) {
    console.error(`[design-intake-map] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
