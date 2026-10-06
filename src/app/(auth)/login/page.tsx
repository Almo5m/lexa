import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
