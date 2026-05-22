"use server";

import { redirect } from "next/navigation";
import { login, startSession } from "@/lib/auth";

export async function loginAction(prevState: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };
  const u = await login(email, password);
  if (!u) return { error: "Invalid email or password." };
  await startSession(u.id);
  redirect("/dashboard");
}
