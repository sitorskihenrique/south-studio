export type TenantRole = "owner" | "admin" | "member" | "viewer";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TenantMembership = {
  tenant: Tenant;
  role: TenantRole;
  created_at?: string;
};

export type TenantSettings = Record<string, unknown>;
