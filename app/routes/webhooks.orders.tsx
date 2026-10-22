import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createNotification } from "../utils/notify.server";

// One endpoint for the order topics we turn into customer notifications.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  const t = String(topic).toLowerCase().replace(/_/g, "/"); // ORDERS_PAID -> orders/paid
  const o: any = payload;

  const customerId = o?.customer?.id;
  if (customerId && o?.id) {
    const name = o.name || `#${o.order_number ?? ""}`;
    const total = o.total_price ? `${o.total_price} ${o.currency || ""}`.trim() : "";
    const url = typeof o.order_status_url === "string" ? o.order_status_url : null;

    let title = "";
    let body = "";
    if (t === "orders/create") {
      title = `Order ${name} placed`;
      body = `Thank you for your order!${total ? ` Total: ${total}.` : ""}`;
    } else if (t === "orders/paid") {
      title = `Payment received for order ${name}`;
      body = "We have received your payment. Thank you!";
    } else if (t === "orders/fulfilled") {
      title = `Order ${name} has shipped`;
      body = "Your order is on its way to you.";
    } else if (t === "orders/cancelled") {
      title = `Order ${name} was cancelled`;
      body = "If you have any questions, send us a message and we will help.";
    }

    if (title) {
      await createNotification({
        shop,
        customerId,
        type: "order",
        title,
        body,
        url,
        dedupeKey: `${t}:${o.id}`,
      });
    }
  }

  return new Response();
};
