import prisma from "../db.server";

export const MAX_BODY = 2000;

export function cleanBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const body = raw.trim().slice(0, MAX_BODY);
  return body.length ? body : null;
}

export function publicMessage(m: { id: string; sender: string; body: string; createdAt: Date }) {
  return { id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt.toISOString() };
}

// Pull name + email once, when the conversation is first created.
export async function fetchCustomer(admin: any, customerId: string) {
  try {
    const res = await admin.graphql(
      `#graphql
      query C($id: ID!) { customer(id: $id) { firstName lastName email } }`,
      { variables: { id: `gid://shopify/Customer/${customerId}` } },
    );
    const json: any = await res.json();
    const c = json?.data?.customer;
    if (!c) return { name: null, email: null };
    const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || null;
    return { name, email: c.email || null };
  } catch (e) {
    console.error(e);
    return { name: null, email: null };
  }
}

export async function getOrCreateConversation(shop: string, customerId: string, admin: any) {
  const existing = await prisma.conversation.findUnique({
    where: { shop_customerId: { shop, customerId } },
  });
  if (existing) return existing;
  const { name, email } = await fetchCustomer(admin, customerId);
  return prisma.conversation.upsert({
    where: { shop_customerId: { shop, customerId } },
    create: { shop, customerId, customerName: name, customerEmail: email },
    update: {},
  });
}
