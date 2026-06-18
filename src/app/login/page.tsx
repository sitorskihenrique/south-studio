import { AuthForm } from "@/components/auth/AuthForm";
import { sanitizeInternalPath } from "@/lib/auth/redirect";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string; config?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode="login" nextPath={sanitizeInternalPath(params?.next)} missingConfig={params?.config === "missing"} />;
}
