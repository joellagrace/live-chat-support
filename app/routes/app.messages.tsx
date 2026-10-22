import { useEffect, useMemo, useRef, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRevalidator, useRouteError, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { publicMessage } from "../utils/chat.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const selectedId = new URL(request.url).searchParams.get("c");

  const conversations = await prisma.conversation.findMany({
    where: { shop },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      messages: { where: { sender: { not: "bot" } }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  let selected: any = null;
  if (selectedId) {
    const convo = await prisma.conversation.findFirst({ where: { id: selectedId, shop } });
    if (convo) {
      if (convo.unreadForAdmin > 0) {
        await prisma.conversation.update({ where: { id: convo.id }, data: { unreadForAdmin: 0 } });
      }
      const messages = await prisma.message.findMany({
        where: { conversationId: convo.id },
        orderBy: { createdAt: "asc" },
        take: 500,
      });
      selected = {
        id: convo.id,
        customerId: convo.customerId,
        name: convo.customerName,
        email: convo.customerEmail,
        messages: messages.map(publicMessage),
      };
    }
  }

  return {
    selected,
    conversations: conversations.map((c) => {
      const last = c.messages[0];
      return {
        id: c.id,
        name: c.customerName || c.customerEmail || `Customer ${c.customerId}`,
        email: c.customerEmail,
        unread: selectedId === c.id ? 0 : c.unreadForAdmin,
        preview: last?.body?.slice(0, 90) || "",
        lastFromAdmin: last?.sender === "admin",
        lastMessageAt: c.lastMessageAt.toISOString(),
      };
    }),
  };
};

function initials(name: string) {
  const parts = name.replace(/@.*/, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const PALETTE = ["#c98d77", "#7c8db5", "#6fa58a", "#b08ab5", "#d1a35c", "#6aa3b8"];
function colorFor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function listTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const CSS = `
.lc-app{--bg:#f6f6f7;--panel:#fff;--line:#e6e8ea;--ink:#202223;--muted:#6d7175;--accent:#b97862;--accent-soft:#f6e7e1;--me:#202223;--r:14px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif;color:var(--ink);display:flex;height:calc(100vh - 150px);min-height:520px;background:var(--panel);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.04)}
.lc-app *{box-sizing:border-box;font-family:inherit}
.lc-side{width:340px;flex-shrink:0;border-right:1px solid var(--line);display:flex;flex-direction:column;background:#fcfcfd}
.lc-side-head{padding:18px 18px 10px}
.lc-title{font-size:18px;font-weight:650;display:flex;align-items:center;justify-content:space-between}
.lc-count{font-size:12px;font-weight:600;color:var(--muted);background:var(--bg);border-radius:20px;padding:3px 9px}
.lc-search{margin-top:12px;width:100%;border:1px solid var(--line);background:#fff;border-radius:10px;padding:9px 12px 9px 34px;font-size:13.5px;outline:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238a8f94' stroke-width='2' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:11px 50%}
.lc-search:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.lc-list{flex:1;overflow-y:auto;padding:6px 8px 12px}
.lc-item{display:flex;gap:12px;padding:12px 10px;border-radius:12px;cursor:pointer;align-items:flex-start;transition:background .12s}
.lc-item:hover{background:#f3f4f5}
.lc-item.on{background:var(--accent-soft)}
.lc-av{width:42px;height:42px;border-radius:50%;color:#fff;font-weight:650;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;letter-spacing:.3px}
.lc-av.sm{width:34px;height:34px;font-size:12px}
.lc-av.lg{width:46px;height:46px;font-size:15px}
.lc-meta{min-width:0;flex:1}
.lc-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.lc-name{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lc-item.unread .lc-name{font-weight:700}
.lc-time{font-size:11.5px;color:var(--muted);flex-shrink:0}
.lc-prev{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:3px}
.lc-prevtxt{font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lc-item.unread .lc-prevtxt{color:var(--ink);font-weight:500}
.lc-badge{background:var(--accent);color:#fff;border-radius:20px;font-size:11px;font-weight:700;min-width:20px;height:20px;padding:0 6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.lc-main{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--panel)}
.lc-head{display:flex;align-items:center;gap:14px;padding:14px 22px;border-bottom:1px solid var(--line)}
.lc-hname{font-weight:650;font-size:16px;line-height:1.2}
.lc-hsub{font-size:13px;color:var(--muted);margin-top:2px}
.lc-hlink{margin-left:auto;font-size:13px;font-weight:600;color:var(--ink);text-decoration:none;border:1px solid var(--line);padding:7px 13px;border-radius:9px;background:#fff}
.lc-hlink:hover{background:var(--bg)}
.lc-back{display:none;border:1px solid var(--line);background:#fff;border-radius:9px;padding:6px 10px;cursor:pointer;font-size:13px}
.lc-thread{flex:1;overflow-y:auto;padding:22px 26px;background:linear-gradient(#fafafb,#fafafb);display:flex;flex-direction:column;gap:4px}
.lc-day{align-self:center;font-size:11.5px;font-weight:600;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:20px;padding:4px 12px;margin:14px 0 10px}
.lc-line{display:flex;gap:10px;align-items:flex-end;margin-top:6px}
.lc-line.admin{flex-direction:row-reverse}
.lc-col{display:flex;flex-direction:column;max-width:68%}
.lc-line.admin .lc-col{align-items:flex-end}
.lc-bub{padding:10px 14px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere;border-radius:18px}
.lc-line.cust .lc-bub{background:#fff;border:1px solid var(--line);border-bottom-left-radius:5px}
.lc-line.admin .lc-bub{background:var(--me);color:#fff;border-bottom-right-radius:5px}
.lc-line.pending .lc-bub{opacity:.6}
.lc-stamp{font-size:11px;color:var(--muted);margin:4px 4px 0}
.lc-compose{padding:14px 20px 18px;border-top:1px solid var(--line);background:#fff}
.lc-box{display:flex;gap:10px;align-items:flex-end;border:1px solid var(--line);border-radius:14px;padding:8px 8px 8px 14px;background:#fff;transition:border-color .12s,box-shadow .12s}
.lc-box:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.lc-ta{flex:1;border:0;outline:none;resize:none;font-size:14.5px;line-height:1.45;max-height:140px;padding:7px 0;background:transparent;color:var(--ink)}
.lc-send{border:0;background:var(--accent);color:#fff;font-weight:650;font-size:14px;border-radius:10px;height:38px;padding:0 18px;cursor:pointer;display:flex;align-items:center;gap:6px}
.lc-send:hover:not(:disabled){filter:brightness(.95)}
.lc-send:disabled{opacity:.45;cursor:default}
.lc-hint{font-size:11.5px;color:var(--muted);margin:7px 4px 0}
.lc-err{color:#b3261e;font-size:12.5px;margin:0 4px 8px}
.lc-empty{margin:auto;text-align:center;color:var(--muted);padding:40px;max-width:340px}
.lc-empty .ic{width:64px;height:64px;border-radius:50%;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.lc-empty h3{margin:0 0 6px;color:var(--ink);font-size:16px}
.lc-empty p{margin:0;font-size:13.5px;line-height:1.5}
@media(max-width:820px){
 .lc-app{height:calc(100vh - 130px)}
 .lc-side{width:100%;border-right:0}
 .lc-app.has-sel .lc-side{display:none}
 .lc-app:not(.has-sel) .lc-main{display:none}
 .lc-back{display:inline-block}
 .lc-col{max-width:82%}
}
`;

const ChatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b97862" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
  </svg>
);

type Msg = { id: string; sender: string; body: string; createdAt: string; pending?: boolean };

export default function Messages() {
  const { conversations, selected } = useLoaderData<typeof loader>();
  const [params, setParams] = useSearchParams();
  const revalidator = useRevalidator();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Refresh every 4s so new customer messages appear without reloading.
  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden && revalidator.state === "idle") revalidator.revalidate();
    }, 4000);
    return () => clearInterval(t);
  }, [revalidator]);

  // Drop optimistic messages once the server copy has arrived.
  const serverMsgs: Msg[] = selected?.messages ?? [];
  const msgs: Msg[] = useMemo(() => {
    const ids = new Set(serverMsgs.map((m) => m.id));
    return [...serverMsgs, ...pending.filter((p) => !ids.has(p.id))];
  }, [serverMsgs, pending]);

  useEffect(() => {
    setPending([]);
    setError("");
    setText("");
  }, [selected?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length, selected?.id]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [text]);

  const filtered = conversations.filter((c) => {
    const s = q.trim().toLowerCase();
    return !s || c.name.toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s) || c.preview.toLowerCase().includes(s);
  });
  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);

  async function send() {
    const body = text.trim();
    if (!selected || !body || sending) return;
    setSending(true);
    setError("");
    const tempId = "tmp-" + Date.now();
    setPending((p) => [...p, { id: tempId, sender: "admin", body, createdAt: new Date().toISOString(), pending: true }]);
    setText("");
    try {
      const res = await fetch("/app/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selected.id, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not send.");
      setPending((p) => p.map((m) => (m.id === tempId ? { ...json.message } : m)));
      revalidator.revalidate();
    } catch (e: any) {
      setPending((p) => p.filter((m) => m.id !== tempId));
      setText(body);
      setError(e.message || "Could not send.");
    }
    setSending(false);
    taRef.current?.focus();
  }

  const selName = selected ? selected.name || selected.email || "Customer" : "";

  return (
    <s-page heading="Messages">
      <style>{CSS}</style>
      <div className={"lc-app" + (selected ? " has-sel" : "")}>
        <aside className="lc-side">
          <div className="lc-side-head">
            <div className="lc-title">
              <span>Inbox</span>
              <span className="lc-count">{totalUnread > 0 ? `${totalUnread} unread` : `${conversations.length} chats`}</span>
            </div>
            <input className="lc-search" placeholder="Search customers or messages" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="lc-list">
            {filtered.length === 0 && (
              <div className="lc-empty" style={{ padding: 24 }}>
                <p>{conversations.length === 0 ? "No conversations yet. They will appear here when customers write from their account page." : "No results."}</p>
              </div>
            )}
            {filtered.map((c) => (
              <div
                key={c.id}
                className={"lc-item" + (params.get("c") === c.id ? " on" : "") + (c.unread > 0 ? " unread" : "")}
                onClick={() => setParams({ c: c.id })}
              >
                <div className="lc-av" style={{ background: colorFor(c.name) }}>{initials(c.name)}</div>
                <div className="lc-meta">
                  <div className="lc-row">
                    <span className="lc-name">{c.name}</span>
                    <span className="lc-time">{listTime(c.lastMessageAt)}</span>
                  </div>
                  <div className="lc-prev">
                    <span className="lc-prevtxt">{c.lastFromAdmin ? "You: " : ""}{c.preview}</span>
                    {c.unread > 0 && <span className="lc-badge">{c.unread}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="lc-main">
          {!selected ? (
            <div className="lc-empty">
              <div className="ic"><ChatIcon /></div>
              <h3>Select a conversation</h3>
              <p>Pick a customer on the left to read their messages and reply. New messages show up automatically.</p>
            </div>
          ) : (
            <>
              <div className="lc-head">
                <button className="lc-back" onClick={() => setParams({})}>← Inbox</button>
                <div className="lc-av lg" style={{ background: colorFor(selName) }}>{initials(selName)}</div>
                <div>
                  <div className="lc-hname">{selName}</div>
                  <div className="lc-hsub">{selected.email || "No email on file"}</div>
                </div>
                <a className="lc-hlink" href={`shopify:admin/customers/${selected.customerId}`} target="_top">View customer</a>
              </div>

              <div className="lc-thread">
                {msgs.map((m, i) => {
                  const prev = msgs[i - 1];
                  const newDay = !prev || !sameDay(new Date(prev.createdAt), new Date(m.createdAt));
                  const admin = m.sender !== "customer";
                  const isBot = m.sender === "bot";
                  const nextSame = msgs[i + 1] && msgs[i + 1].sender === m.sender && sameDay(new Date(msgs[i + 1].createdAt), new Date(m.createdAt));
                  return (
                    <div key={m.id} style={{ display: "contents" }}>
                      {newDay && <div className="lc-day">{dayLabel(m.createdAt)}</div>}
                      <div className={"lc-line " + (admin ? "admin" : "cust") + (m.pending ? " pending" : "")}>
                        {!admin && (
                          <div className="lc-av sm" style={{ background: colorFor(selName), visibility: nextSame ? "hidden" : "visible" }}>{initials(selName)}</div>
                        )}
                        <div className="lc-col">
                          <div className="lc-bub">{m.body}</div>
                          {!nextSame && <div className="lc-stamp">{clock(m.createdAt)}{isBot ? " · Auto-reply" : admin ? (m.pending ? " · Sending…" : " · Sent") : ""}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="lc-compose">
                {error && <div className="lc-err">{error}</div>}
                <div className="lc-box">
                  <textarea
                    ref={taRef}
                    className="lc-ta"
                    rows={1}
                    value={text}
                    maxLength={2000}
                    placeholder={`Reply to ${selName}…`}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <button className="lc-send" onClick={send} disabled={sending || !text.trim()}>Send</button>
                </div>
                <div className="lc-hint">Enter to send · Shift+Enter for a new line · The customer is emailed if they're not on the page.</div>
              </div>
            </>
          )}
        </section>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
