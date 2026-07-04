import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const stepperSource = readFileSync(new URL("./Stepper.tsx", import.meta.url), "utf8");
const primitivesCss = readFileSync(new URL("../../styles/primitives.css", import.meta.url), "utf8");
const layoutCss = readFileSync(new URL("../../styles/layout.css", import.meta.url), "utf8");

test("Stepper state is derived from one activeStep comparison", () => {
  assert.match(stepperSource, /if \(index < activeStep\) return "complete"/);
  assert.match(stepperSource, /if \(index === activeStep\) return "active"/);
  assert.match(stepperSource, /return "pending"/);
  assert.match(stepperSource, /const activeIndex = Math\.min\(Math\.max\(activeStep, 0\)/);
});

test("Stepper completed steps render checks while active and pending steps render numbers", () => {
  assert.match(stepperSource, /state === "complete" \? "✓" : index \+ 1/);
  assert.match(stepperSource, /data-state=\{state\}/);
  assert.match(stepperSource, /aria-current=\{state === "active" \? "step" : undefined\}/);
});

test("Stepper connectors only turn primary after the source step is complete", () => {
  assert.match(primitivesCss, /\.civitas-stepper-item\[data-state="complete"\]:not\(:last-child\)::after\s*{\s*background: var\(--civitas-primary\);\s*}/s);
  assert.doesNotMatch(primitivesCss, /\.civitas-stepper-item\[data-state="active"\]:not\(:last-child\)::after\s*{\s*background: var\(--civitas-primary\);\s*}/s);
});

test("Stepper consumes the canonical breakpoint hook and responsive utility classes", () => {
  assert.match(stepperSource, /useBreakpoint\("md"\)/);
  assert.match(stepperSource, /civitas-scroll-x civitas-nowrap-children/);
  assert.match(stepperSource, /civitas-visually-hidden/);
  assert.match(primitivesCss, /\.civitas-stepper-list\.civitas-scroll-x\s*{\s*display: flex;/s);
  assert.match(layoutCss, /\.civitas-primary-nav\s*{[^}]*overflow-x: auto/s);
  assert.match(layoutCss, /\.civitas-nav-link\s*{[^}]*flex: 0 0 auto/s);
});
