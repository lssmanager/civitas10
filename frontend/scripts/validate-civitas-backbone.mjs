import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "src/styles/tokens.css",
  "src/styles/theme.css",
  "src/styles/primitives.css",
  "src/styles/layout.css",
  "src/styles/index.css",
  "src/styles/dashboard.css",
  "src/styles/tailwind-theme.css",
  "src/shared/ui/FormField.tsx",
  "src/shared/ui/AlertStrip.tsx",
  "src/shared/ui/Stepper.tsx",
  "src/shared/ui/SectionCard.tsx",
  "src/shared/ui/StatusPill.tsx",
  "src/shared/ui/PageHeader.tsx",
  "src/shared/ui/ActionBar.tsx",
  "src/shared/ui/MetricCard.tsx",
  "src/shared/ui/KpiGrid.tsx",
  "src/shared/ui/DataTable.tsx",
  "src/shared/ui/EmptyState.tsx",
  "src/layouts/AppShell.tsx",
  "src/layouts/PublicLayout.tsx",
  "src/layouts/OwnerLayout.tsx",
  "src/layouts/OrganizationLayout.tsx",
  "docs/CIVITAS_VISUAL_SYSTEM.md",
  "docs/CIVITAS_COMPONENT_RULES.md",
  "docs/CIVITAS_WIZARD_PATTERN.md",
  "docs/CIVITAS_OWNER_AUTH.md",
];

const fail = (message) => {
  console.error(`[civitas-backbone] ${message}`);
  process.exit(1);
};

for (const file of requiredFiles) {
  if (!existsSync(new URL(`../${file}`, import.meta.url))) fail(`missing required backbone file: ${file}`);
}

const barrel = readFileSync(new URL("../src/shared/ui/index.ts", import.meta.url), "utf8");
for (const primitive of ["FormField", "AlertStrip", "Stepper", "SectionCard", "StatusPill", "PageHeader", "ActionBar", "MetricCard", "KpiGrid", "DataTable", "EmptyState"]) {
  if (!barrel.includes(primitive)) fail(`shared/ui barrel does not export ${primitive}`);
}

const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
if (!main.includes("./index.css")) fail("main.tsx does not import ./index.css");
for (const disconnectedImport of ["./styles/index.css", "./styles/dashboard.css"]) {
  if (main.includes(disconnectedImport)) fail(`main.tsx must not import disconnected CSS graph ${disconnectedImport}`);
}
const cssEntry = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
for (const importPath of ['@import "tailwindcss"', '@import "./styles/index.css"', '@import "./styles/dashboard.css"']) {
  if (!cssEntry.includes(importPath)) fail(`index.css does not import ${importPath}`);
}
const stylesIndex = readFileSync(new URL("../src/styles/index.css", import.meta.url), "utf8");
for (const importPath of ["./tokens.css", "./tokens/layout.css", "./theme.css", "./tailwind-theme.css", "./layout.css", "./primitives.css"]) {
  if (!stylesIndex.includes(importPath)) fail(`styles/index.css does not import ${importPath}`);
}

const theme = readFileSync(new URL("../src/styles/theme.css", import.meta.url), "utf8");
if (!theme.includes('[data-theme="light"]') || !theme.includes('[data-theme="dark"]')) fail("theme.css must define light and dark data-theme blocks");

const auth = readFileSync(new URL("../docs/CIVITAS_OWNER_AUTH.md", import.meta.url), "utf8");
if (!auth.includes("deployment kernel `logtoResource`") || !auth.includes("sub === client_id") || !auth.includes("ownerApiFetch")) fail("owner auth documentation must explain API resource and user-token guard");

const wizard = readFileSync(new URL("../src/pages/OwnerOrganizationsPage.tsx", import.meta.url), "utf8");
for (const marker of ["data-civitas-create-organization-wizard", "Stepper", "FormField", "ActionBar", "StatusPill", "StepCanonicalOrganization", "StepBusinessProfile", "StepAdminUsers", "StepSegmentation", "StepReview"]) {
  if (!wizard.includes(marker)) fail(`create organization wizard is missing ${marker}`);
}

for (const forbidden of ["DocuMind", "AI-Powered Experience for Your Team", "Intelligent Document Management Solution"]) {
  for (const file of ["src/pages/App/Landing.tsx", "src/layouts/AppShell.tsx"]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    if (source.includes(forbidden)) fail(`demo residue '${forbidden}' found in ${file}`);
  }
}

console.log("[civitas-backbone] Visual backbone files, exports, theme blocks, shell imports, and wizard primitive usage are valid.");
