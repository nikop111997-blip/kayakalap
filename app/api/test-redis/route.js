import { redis } from "@/lib/upstash";

export async function GET() {
  await redis.set("check", "working");
  const value = await redis.get("check");

  return Response.json({ value });
}