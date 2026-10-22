import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { publicMessage } from "../utils/chat.server";

// GET /apps/messages/poll?after=<ISO date>
// Returns messages for the logged-in customer only.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const customerId = url.searchParams.get("logged_in_customer_id");
  const shop = session?.shop || url.searchParams.get("shop");
  const headers = { "Cache-Control": "no-store" };

  if (!customerId || !shop) {
    return Response.json({ loggedIn: false }, { status: 401, headers });
  }

  const convo = await prisma.conversation.findUnique({
    where: { shop_customerId: { shop, customerId } },
  });
  if (!convo) return Response.json({ loggedIn: true, messages: [] }, { headers });

  const afterRaw = url.searchParams.get("after");
  const after = afterRaw ? new Date(afterRaw) : null;
  const validAfter = after && !isNaN(after.getTime()) ? after : null;

  const messages = await prisma.message.findMany({
    where: {
      conversationId: convo.id,
      ...(validAfter ? { createdAt: { gte: validAfter } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  // "Seen" marker: used to decide whether a reply also needs an email.
  // Only count the customer as "on the page" when the tab is actually visible.
  if (url.searchParams.get("visible") === "1") {
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { customerLastSeenAt: new Date() },
    });
  }

  return Response.json(
    { loggedIn: true, messages: messages.map(publicMessage) },
    { headers },
  );
};
