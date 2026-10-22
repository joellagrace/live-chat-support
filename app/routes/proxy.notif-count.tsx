import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// GET /apps/messages/notif-count -> { unread: number }  (for a menu badge)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const customerId = url.searchParams.get("logged_in_customer_id");
  const shop = session?.shop || url.searchParams.get("shop");
  const headers = { "Cache-Control": "no-store" };
  if (!customerId || !shop) return Response.json({ unread: 0 }, { headers });
  const unread = await prisma.notification.count({
    where: { shop, customerId, readAt: null },
  });
  return Response.json({ unread }, { headers });
};
