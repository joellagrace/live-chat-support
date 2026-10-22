import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  cleanBody,
  getOrCreateConversation,
  publicMessage,
} from "../utils/chat.server";
import { notifyAdminOfMessage } from "../utils/email.server";

const AUTO_REPLY_GAP_MS = 6 * 60 * 60 * 1000;
const DEFAULT_AUTO_REPLY =
  "Thanks for reaching out to Joella Grace Jewelry! We're connecting you with a team member. We'll reply right here as soon as we can, and we'll email you if you step away.";

// POST /apps/messages/send   (JSON: { body })
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const customerId = url.searchParams.get("logged_in_customer_id");
  const shop = session?.shop || url.searchParams.get("shop");

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  if (!customerId || !shop || !admin) {
    return Response.json({ error: "Please log in." }, { status: 401 });
  }

  let payload: any = null;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const body = cleanBody(payload?.body);
  if (!body) return Response.json({ error: "Message is empty." }, { status: 400 });

  const convo = await getOrCreateConversation(shop, customerId, admin);

  // Basic flood protection: at most 10 messages per minute per customer.
  const recent = await prisma.message.count({
    where: {
      conversationId: convo.id,
      sender: "customer",
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
  });
  if (recent >= 10) {
    return Response.json({ error: "Too many messages. Please wait a moment." }, { status: 429 });
  }

  // Is this the start of a new conversation thread? (no messages in the last 6 hours)
  const lastMessage = await prisma.message.findFirst({
    where: { conversationId: convo.id },
    orderBy: { createdAt: "desc" },
  });
  const newThread =
    !lastMessage || Date.now() - lastMessage.createdAt.getTime() > AUTO_REPLY_GAP_MS;

  const message = await prisma.message.create({
    data: { conversationId: convo.id, sender: "customer", body },
  });
  await prisma.conversation.update({
    where: { id: convo.id },
    data: {
      lastMessageAt: message.createdAt,
      unreadForAdmin: { increment: 1 },
      customerLastSeenAt: new Date(),
    },
  });

  // Email the shop only when this starts a new unread stretch (no spam).
  if (convo.unreadForAdmin === 0) {
    await notifyAdminOfMessage({
      customerName: convo.customerName,
      customerEmail: convo.customerEmail,
      body,
      shop,
    });
  }

  // Instant automated reply when a new thread starts. Stored as sender "bot".
  let auto: ReturnType<typeof publicMessage> | null = null;
  if (newThread) {
    const bot = await prisma.message.create({
      data: {
        conversationId: convo.id,
        sender: "bot",
        body: process.env.AUTO_REPLY_TEXT || DEFAULT_AUTO_REPLY,
        createdAt: new Date(message.createdAt.getTime() + 1),
      },
    });
    auto = publicMessage(bot);
  }

  return Response.json(
    { message: publicMessage(message), auto },
    { headers: { "Cache-Control": "no-store" } },
  );
};
