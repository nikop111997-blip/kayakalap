import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.email_redis_KV_REST_API_URL,
  token: process.env.email_redis_KV_REST_API_TOKEN,
});