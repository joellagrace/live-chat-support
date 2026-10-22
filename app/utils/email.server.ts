// Thin wrapper around Resend's HTTP API. Needs RESEND_API_KEY.
// MAIL_FROM and ADMIN_NOTIFY_EMAIL are configured through env vars.

const RESEND_API_URL = "https://api.resend.com/emails";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set - skipping email");
    return;
  }
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Joella Grace Jewelry <info@joellagrace.com>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend error (${res.status}): ${await res.text()}`);
  }
}

// Email problems must never break chat, so these swallow errors.
export async function notifyAdminOfMessage(opts: {
  customerName?: string | null;
  customerEmail?: string | null;
  body: string;
  shop: string;
}) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return;
  const who = opts.customerName || opts.customerEmail || "A customer";
  try {
    await send(
      to,
      `New message from ${who}`,
      `<p><strong>${esc(who)}</strong>${
        opts.customerEmail ? ` (${esc(opts.customerEmail)})` : ""
      } wrote:</p><blockquote>${esc(opts.body)}</blockquote>` +
        `<p>Reply from your Shopify admin: Apps &rarr; Live Chat Support (${esc(opts.shop)}).</p>`,
    );
  } catch (e) {
    console.error(e);
  }
}

export async function notifyCustomerOfReply(opts: {
  to: string;
  customerName?: string | null;
  body: string;
  accountUrl: string;
}) {
  try {
    await send(
      opts.to,
      "You have a new reply from Joella Grace Jewelry",
      `<p>Hi${opts.customerName ? " " + esc(opts.customerName) : ""},</p>` +
        `<p>We replied to your message:</p><blockquote>${esc(opts.body)}</blockquote>` +
        `<p><a href="${opts.accountUrl}">Open your Messages</a> to continue the conversation.</p>`,
    );
  } catch (e) {
    console.error(e);
  }
}
