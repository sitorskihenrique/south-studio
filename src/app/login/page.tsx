import { AuthForm } from "@/components/auth/AuthForm";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string; config?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode="login" nextPath={sanitizeNext(params?.next)} missingConfig={params?.config === "missing"} />;
}

function sanitizeNext(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
