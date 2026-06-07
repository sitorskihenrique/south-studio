import { AuthForm } from "@/components/auth/AuthForm";

export default async function SignupPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode="cadastro" nextPath={sanitizeNext(params?.next)} />;
}

function sanitizeNext(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
