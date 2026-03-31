import { Whop } from "@whop/sdk";

export const whop = new Whop({
  apiKey: process.env.WHOP_API_KEY ? `Bearer ${process.env.WHOP_API_KEY}` : undefined,
});

export const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID ?? "";
export const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET ?? "";
