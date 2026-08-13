"use client";

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

export function isUsageAnalyticsEnabled() {
  return false;
}

export function setUsageAnalyticsEnabled(_enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(usageAnalyticsPreferenceKey);
  window.dispatchEvent(new CustomEvent(usageAnalyticsPreferenceEvent, { detail: false }));
}

export async function trackUsageEvent(_eventName: UsageEventName, _tool: UsageTool) {
  return;
}
