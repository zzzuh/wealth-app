import { getSession } from "@/lib/auth";

export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthenticated");
  }
  return session.userId;
}
