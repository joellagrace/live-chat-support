import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { cleanBody, publicMessage } from "../utils/chat.server";
import { notifyCustomerOfReply } from "../utils/email.server";
import { createNotification } from "../utils/notify.server";

// Resource route (no default export): POST /app/reply returns JSON.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const payload: any = await request.json().catch(() => null);
  const body = cleanBody(payload?.body);
  if (!body || typeof payload?.conversationId !== "string") {
    return Response.json({ error: "Message is empty." }, { status: 400 });
  }

  const convo = await prisma.conversation.findFirst({
    where: { id: payload.conversationId, shop },
  });
  if (!convo) return Response.json({ error: "Conversation not found." }, { status: 404 });

  const message = await prisma.message.create({
    data: { conversationId: convo.id, sender: "admin", body },
  });
  await prisma.conversation.update({
    where: { id: convo.id },
    data: { lastMessageAt: message.createdAt },
  });

  // In-app notification for the customer's Notifications page.
  await createNotification({
    shop,
    customerId: convo.customerId,
    type: "chat",
    title: "New reply from support",
    body: body.length > 140 ? body.slice(0, 139) + "\u2026" : body,
    url: "/apps/messages",
    dedupeKey: `chat:${message.id}`,
  });

  // If the customer isn't looking at the chat right now, also email them.
  const away =
    !convo.customerLastSeenAt || Date.now() - convo.customerLastSeenAt.getTime() > 60_000;
  if (away && convo.customerEmail) {
    const base = process.env.STOREFRONT_URL || `https://${shop}`;
    await notifyCustomerOfReply({
      to: convo.customerEmail,
      customerName: convo.customerName,
      body,
      accountUrl: `${base.replace(/\/$/, "")}/apps/messages`,
    });
  }

  return Response.json({ message: publicMessage(message) });
};

