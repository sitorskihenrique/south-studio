import { AuthForm } from "@/components/auth/AuthForm";
import { sanitizeInternalPath } from "@/lib/auth/redirect";

export default async function SignupPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode="cadastro" nextPath={sanitizeInternalPath(params?.next)} />;
}
