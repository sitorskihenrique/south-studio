"use client";

import { createClient } from "@/lib/supabase/client";

export const usageAnalyticsPreferenceKey = "south-studio-anonymous-analytics-v1";
export const usageAnalyticsPreferenceEvent = "south-studio-analytics-preference";

export type UsageEventName =
  | "tool_opened"
  | "project_created"
  | "task_created"
  | "budget_saved"
  | "film_plan_saved";

export type UsageTool =
  | "dashboard"
  | "projects"
  | "tasks"
  | "budgets"
  | "film_plans"
  | "settings";

const anonymousIdKey = "south-studio-anonymous-installation-v1";
const recentEvents = new Map<string, number>();
const eventThrottleMs = 20_000;

export function isUsageAnalyticsEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(usageAnalyticsPreferenceKey) === "enabled";
}

export function setUsageAnalyticsEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) window.localStorage.setItem(usageAnalyticsPreferenceKey, "enabled");
  else window.localStorage.removeItem(usageAnalyticsPreferenceKey);
  window.dispatchEvent(new CustomEvent(usageAnalyticsPreferenceEvent, { detail: enabled }));
}

export async function trackUsageEvent(eventName: UsageEventName, tool: UsageTool) {
  if (!isUsageAnalyticsEnabled()) return;

  const eventKey = `${eventName}:${tool}`;
  const lastEvent = recentEvents.get(eventKey) || 0;
  if (Date.now() - lastEvent < eventThrottleMs) return;
  recentEvents.set(eventKey, Date.now());

  const supabase = createClient();
  if (!supabase) return;

  await supabase.from("usage_events").insert({
    anonymous_id: getAnonymousInstallationId(),
    event_name: eventName,
    tool,
    device_type: getDeviceType(),
    app_version: "0.1.0-beta",
  });
}

function getAnonymousInstallationId() {
  const current = window.localStorage.getItem(anonymousIdKey);
  if (current) return current;
  const created = crypto.randomUUID();
  window.localStorage.setItem(anonymousIdKey, created);
  return created;
}

function getDeviceType() {
  if (window.matchMedia("(max-width: 767px)").matches) return "mobile";
  if (window.matchMedia("(max-width: 1023px)").matches) return "tablet";
  return "desktop";
}
