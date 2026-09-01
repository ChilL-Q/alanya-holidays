import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(new URL("./e2e-smoke.yml", import.meta.url), "utf8");

test("legacy smoke coverage remains on Desktop Chrome", () => {
  const legacyStep = workflow.match(
    /- name: Run Legacy E2E Smoke Tests(?<body>[\s\S]*?)(?=\n\s+- name:|\n\s*$)/,
  )?.groups?.body;

  assert.ok(legacyStep, "expected a clearly named legacy smoke step");
  for (const spec of ["home", "navigation", "auth", "checkout", "enquiry"]) {
    assert.match(legacyStep, new RegExp(`e2e/${spec}\\.spec\\.ts`));
  }
  assert.match(legacyStep, /--project=["']Desktop Chrome["']/);
});

test("production readiness runs on every configured Playwright project", () => {
  const productionStep = workflow.match(
    /- name: Run Production Readiness on All Configured Projects(?<body>[\s\S]*?)(?=\n\s+- name:|\n\s*$)/,
  )?.groups?.body;

  assert.ok(productionStep, "expected a clearly named production-readiness matrix step");
  assert.match(productionStep, /e2e\/production-readiness\.spec\.ts/);
  assert.doesNotMatch(
    productionStep,
    /--project(?:=|\s)/,
    "the production-readiness command must not filter out configured projects",
  );
  assert.match(workflow, /playwright install chromium webkit/);
});
