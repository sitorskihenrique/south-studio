import "server-only";

import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { ACTIVE_TENANT_COOKIE } from "./shared";
import type { Tenant, TenantMembership, TenantRole, TenantSettings } from "./types";

type TenantMemberRow = {
  role: TenantRole;
  created_at?: string;
  tenant: Tenant | Tenant[] | null;
};

function normalizeTenant(tenant: Tenant | Tenant[] | null) {
  return Array.isArray(tenant) ? tenant[0] ?? null : tenant;
}

function toMembership(row: TenantMemberRow | null): TenantMembership | null {
  const tenant = normalizeTenant(row?.tenant ?? null);
  if (!row || !tenant) return null;
  return { tenant, role: row.role, created_at: row.created_at };
}

export async function getCurrentMembership(): Promise<TenantMembership | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const activeTenantId = (await cookies()).get(ACTIVE_TENANT_COOKIE)?.value;

  if (activeTenantId) {
    const { data } = await supabase
      .from("tenant_members")
      .select("role, created_at, tenant:tenants(*)")
      .eq("user_id", user.id)
      .eq("tenant_id", activeTenantId)
      .maybeSingle();

    const membership = toMembership(data as TenantMemberRow | null);
    if (membership) return membership;
  }

  const { data } = await supabase
    .from("tenant_members")
    .select("role, created_at, tenant:tenants(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return toMembership(data as TenantMemberRow | null);
}

export async function getCurrentTenant(): Promise<(TenantMembership & { settings: TenantSettings }) | null> {
  const membership = await getCurrentMembership();
  if (!membership) return null;

  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("tenant_settings")
    .select("settings")
    .eq("tenant_id", membership.tenant.id)
    .maybeSingle();

  return { ...membership, settings: (data?.settings ?? {}) as TenantSettings };
}

export async function getActiveTenantId(): Promise<string | null> {
  const membership = await getCurrentMembership();
  return membership?.tenant.id ?? null;
}
