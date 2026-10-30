import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · CHICC Staff" };

type LoginPageProps = {
  searchParams: Promise<{ error?: string; setup?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error ?? params.setup ?? null;
  return <LoginForm initialError={error} />;
}
