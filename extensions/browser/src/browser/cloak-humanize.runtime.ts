import { patchBrowser, resolveConfig, type HumanConfig } from "cloakbrowser/human";
import type { Browser } from "playwright-core";

const patchedBrowsers = new WeakSet<Browser>();

let warnedInvalidConfig = false;

function isEnabled(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return /^(1|true|yes|on)$/i.test(value.trim());
}

function readHumanConfigOverride(): HumanConfig | undefined {
  const raw = process.env.OPENCLAW_CLOAK_HUMAN_CONFIG;
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch {
    if (!warnedInvalidConfig) {
      warnedInvalidConfig = true;
      console.warn("[browser] OPENCLAW_CLOAK_HUMAN_CONFIG is not valid JSON; ignoring override.");
    }
    return undefined;
  }
}

export async function maybePatchBrowserHumanize(browser: Browser): Promise<void> {
  if (!isEnabled(process.env.OPENCLAW_CLOAK_HUMANIZE)) {
    return;
  }
  if (patchedBrowsers.has(browser)) {
    return;
  }

  let preset: "default" | "careful" = "default";
  if (process.env.OPENCLAW_CLOAK_HUMAN_PRESET) {
    if (process.env.OPENCLAW_CLOAK_HUMAN_PRESET == "careful") {
      preset = "careful";
    } else if (process.env.OPENCLAW_CLOAK_HUMAN_PRESET !== "default") {
      console.warn(
        `[browser] OPENCLAW_CLOAK_HUMAN_PRESET value "${preset}" is not valid; falling back to "default".`,
      );
    }
  }
  const override = readHumanConfigOverride();
  const config = override ?? resolveConfig(preset);

  await Promise.resolve(patchBrowser(browser, config));
  patchedBrowsers.add(browser);
}
