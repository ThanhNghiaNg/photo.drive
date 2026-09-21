import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin/events");
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4"><LoginForm /></main>;
}
