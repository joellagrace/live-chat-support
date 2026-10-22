import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

// Served at /apps/messages/notifications (Liquid, renders inside the theme).
// Liquid processes this body: never include the Liquid delimiters.
// Also: no backticks / dollar-brace / backslashes (this is a TS template literal).

const PAGE = `
<style>
.nt-root{--nt-font:inherit;--nt-text:#2b2b2b;--nt-muted:#8a8a8a;--nt-accent:#c98d77;--nt-accent-text:#fff;--nt-border:#ecdcd5;--nt-tab-bg:#f1ddd6;--nt-row:#f6e8e2;--nt-radius:16px;font-family:var(--nt-font);color:var(--nt-text);box-sizing:border-box;width:100%;max-width:980px;margin:0 auto;padding:12px}
.nt-root *{box-sizing:border-box;font-family:inherit}
.nt-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.nt-h{font-size:20px;font-weight:650;margin:0}
.nt-bell{position:relative;display:flex;align-items:center;gap:4px;color:var(--nt-text)}
.nt-bell b{font-size:12px;font-weight:700;background:var(--nt-accent);color:var(--nt-accent-text);border-radius:20px;min-width:20px;height:20px;padding:0 6px;display:flex;align-items:center;justify-content:center}
.nt-bell b.zero{background:#e5dbd7;color:#8a7f7a}
.nt-tabs{display:flex;gap:6px;background:var(--nt-tab-bg);padding:8px;border-radius:var(--nt-radius)}
.nt-tab{flex:1;border:0;background:transparent;color:var(--nt-text);padding:13px 10px;border-radius:10px;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;font-weight:500}
.nt-tab.on{background:var(--nt-accent);color:var(--nt-accent-text)}
.nt-bar{display:flex;justify-content:space-between;align-items:center;margin:16px 4px 10px;gap:10px;flex-wrap:wrap}
.nt-filter{display:flex;gap:6px}
.nt-chip{border:1px solid var(--nt-border);background:#fff;border-radius:20px;padding:6px 14px;font-size:13px;cursor:pointer;color:var(--nt-text)}
.nt-chip.on{background:var(--nt-text);color:#fff;border-color:var(--nt-text)}
.nt-link{border:0;background:transparent;color:var(--nt-accent);font-weight:600;font-size:13px;cursor:pointer;padding:6px 4px}
.nt-link:disabled{opacity:.4;cursor:default}
.nt-list{border-radius:var(--nt-radius);overflow:hidden;border:1px solid var(--nt-border);background:var(--nt-row)}
.nt-item{display:flex;gap:14px;padding:16px 18px;border-bottom:1px solid var(--nt-border);cursor:default;align-items:flex-start;background:var(--nt-row);transition:background .12s}
.nt-item:last-child{border-bottom:0}
.nt-item.link{cursor:pointer}
.nt-item.link:hover{background:#f1dfd8}
.nt-ic{width:38px;height:38px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--nt-accent)}
.nt-main{flex:1;min-width:0}
.nt-row1{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.nt-title{font-size:14.5px;font-weight:600;line-height:1.35}
.nt-item.unread .nt-title{font-weight:700}
.nt-time{font-size:12px;color:var(--nt-muted);white-space:nowrap}
.nt-body{font-size:13.5px;line-height:1.5;margin-top:4px;color:#4a4340;overflow-wrap:anywhere}
.nt-more{display:inline-block;margin-top:8px;font-size:12.5px;font-weight:600;color:var(--nt-accent)}
.nt-dot{width:9px;height:9px;border-radius:50%;background:var(--nt-accent);flex-shrink:0;margin-top:6px}
.nt-dot.off{visibility:hidden}
.nt-empty{padding:46px 20px;text-align:center;color:var(--nt-muted);font-size:14px;background:var(--nt-row)}
.nt-empty strong{display:block;color:var(--nt-text);font-size:16px;margin-bottom:6px}
.nt-set p{margin:18px 4px 12px;font-size:14px;color:#4a4340}
.nt-sw{display:flex;align-items:center;justify-content:space-between;padding:13px 4px;font-size:14.5px;border-bottom:1px solid var(--nt-border)}
.nt-sw.all{font-weight:700}
.nt-sw span small{display:block;font-size:12px;color:var(--nt-muted);font-weight:400;margin-top:2px}
.nt-tg{position:relative;width:46px;height:26px;border-radius:20px;background:#d8cec9;border:0;cursor:pointer;flex-shrink:0;transition:background .15s;padding:0}
.nt-tg i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.nt-tg.on{background:var(--nt-accent)}
.nt-tg.on i{left:23px}
.nt-tg:disabled{opacity:.5;cursor:default}
.nt-foot{font-size:11.5px;color:var(--nt-muted);text-align:center;margin-top:18px}
@media(max-width:600px){.nt-root{padding:8px}.nt-tab{letter-spacing:.06em;font-size:11px;padding:12px 4px}.nt-item{padding:14px 12px}}
</style>
<div class="nt-root" id="nt-root">
  <div class="nt-top">
    <h2 class="nt-h">Notifications</h2>
    <div class="nt-bell" title="Unread notifications">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
      <b class="zero" id="nt-count">0</b>
    </div>
  </div>
  <div class="nt-tabs">
    <button class="nt-tab on" id="nt-tab-all" type="button">All notifications</button>
    <button class="nt-tab" id="nt-tab-set" type="button">Notification settings</button>
  </div>
  <div id="nt-view-all">
    <div class="nt-bar">
      <div class="nt-filter">
        <button class="nt-chip on" id="nt-f-all" type="button">All</button>
        <button class="nt-chip" id="nt-f-unread" type="button">Unread</button>
      </div>
      <button class="nt-link" id="nt-readall" type="button" disabled>Mark all as read</button>
    </div>
    <div class="nt-list" id="nt-list"><div class="nt-empty">Loading...</div></div>
  </div>
  <div id="nt-view-set" style="display:none" class="nt-set">
    <p>Choose which notifications you want to receive.</p>
    <div id="nt-switches"></div>
  </div>
  <div class="nt-foot">Powered by Huemono &#10022;</div>
</div>
<script>
(function () {
  var BASE = '__BASE__';
  var root = document.getElementById('nt-root');
  var listEl = document.getElementById('nt-list');
  var countEl = document.getElementById('nt-count');
  var readAllBtn = document.getElementById('nt-readall');
  var switchesEl = document.getElementById('nt-switches');
  var state = { items: [], prefs: { all: true, order: true, repair: true, chat: true }, unread: 0, filter: 'all', loaded: false };

  var qs = new URLSearchParams(window.location.search);
  var map = { font: '--nt-font', text: '--nt-text', accent: '--nt-accent', accent_text: '--nt-accent-text', border: '--nt-border', radius: '--nt-radius' };
  Object.keys(map).forEach(function (k) {
    var v = qs.get(k);
    if (!v || v.length > 60) return;
    if (/^[0-9a-fA-F]{3,8}$/.test(v) && k !== 'font' && k !== 'radius') v = '#' + v;
    if (/^[A-Za-z0-9#%.,() '"_-]+$/.test(v)) root.style.setProperty(map[k], v);
  });

  var ICONS = {
    repair: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z"/></svg>',
    order: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    chat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>'
  };

  var SWITCHES = [
    { key: 'all', label: 'All notifications', sub: '' },
    { key: 'order', label: 'Order details', sub: 'Order placed, paid and shipped' },
    { key: 'repair', label: 'Repair items', sub: 'Updates on your repair requests' },
    { key: 'chat', label: 'Live chat messages', sub: 'Replies from our support team' }
  ];

  function ago(iso) {
    var s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'Just now';
    var m = Math.floor(s / 60);
    if (m < 60) return m + (m === 1 ? ' minute ago' : ' minutes ago');
    var h = Math.floor(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    var d = Math.floor(h / 24);
    if (d < 7) return d + (d === 1 ? ' day ago' : ' days ago');
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function safeUrl(u) {
    if (!u) return '';
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') return u;
    if (u.indexOf('https://') === 0) return u;
    return '';
  }

  function post(payload) {
    return fetch(BASE + '/notif-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  function setCount(n) {
    state.unread = n;
    countEl.textContent = n > 99 ? '99+' : String(n);
    countEl.className = n > 0 ? '' : 'zero';
    readAllBtn.disabled = n === 0;
  }

  function renderList() {
    listEl.innerHTML = '';
    var items = state.items.filter(function (n) { return state.filter === 'all' || !n.read; });
    if (!items.length) {
      var e = document.createElement('div');
      e.className = 'nt-empty';
      e.innerHTML = state.filter === 'unread'
        ? '<strong>You are all caught up</strong>No unread notifications.'
        : '<strong>No notifications yet</strong>Updates about your orders, repairs and messages will show up here.';
      listEl.appendChild(e);
      return;
    }
    items.forEach(function (n) {
      var link = safeUrl(n.url);
      var row = document.createElement('div');
      row.className = 'nt-item' + (n.read ? '' : ' unread') + (link ? ' link' : '');
      var ic = document.createElement('div');
      ic.className = 'nt-ic';
      ic.innerHTML = ICONS[n.type] || ICONS.chat;
      var main = document.createElement('div');
      main.className = 'nt-main';
      var r1 = document.createElement('div');
      r1.className = 'nt-row1';
      var t = document.createElement('div');
      t.className = 'nt-title';
      t.textContent = n.title;
      var time = document.createElement('div');
      time.className = 'nt-time';
      time.textContent = ago(n.createdAt);
      r1.appendChild(t);
      r1.appendChild(time);
      var b = document.createElement('div');
      b.className = 'nt-body';
      b.textContent = n.body;
      main.appendChild(r1);
      main.appendChild(b);
      if (link) {
        var more = document.createElement('span');
        more.className = 'nt-more';
        more.textContent = 'View details';
        main.appendChild(more);
      }
      var dot = document.createElement('div');
      dot.className = 'nt-dot' + (n.read ? ' off' : '');
      row.appendChild(ic);
      row.appendChild(main);
      row.appendChild(dot);
      row.addEventListener('click', function () {
        if (!n.read) {
          n.read = true;
          setCount(Math.max(0, state.unread - 1));
          post({ action: 'read', id: n.id }).catch(function () {});
          row.className = row.className.replace(' unread', '');
          dot.className = 'nt-dot off';
        }
        if (link) window.location.href = link;
      });
      listEl.appendChild(row);
    });
  }

  function renderSwitches() {
    switchesEl.innerHTML = '';
    SWITCHES.forEach(function (s) {
      var on = state.prefs[s.key] !== false;
      var row = document.createElement('div');
      row.className = 'nt-sw' + (s.key === 'all' ? ' all' : '');
      var label = document.createElement('span');
      label.innerHTML = '';
      label.appendChild(document.createTextNode(s.label));
      if (s.sub) {
        var sm = document.createElement('small');
        sm.textContent = s.sub;
        label.appendChild(sm);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nt-tg' + (on ? ' on' : '');
      btn.setAttribute('aria-label', s.label);
      btn.innerHTML = '<i></i>';
      btn.disabled = s.key !== 'all' && state.prefs.all === false;
      btn.addEventListener('click', function () {
        var next = !(state.prefs[s.key] !== false);
        state.prefs[s.key] = next;
        renderSwitches();
        post({ action: 'pref', type: s.key, enabled: next }).catch(function () {});
      });
      row.appendChild(label);
      row.appendChild(btn);
      switchesEl.appendChild(row);
    });
  }

  function load() {
    return fetch(BASE + '/notif-data', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(function (r) {
        if (r.status === 401) return null;
        return r.json();
      })
      .then(function (data) {
        if (!data) {
          listEl.innerHTML = '<div class="nt-empty"><strong>Please log in</strong>Log in to see your notifications.</div>';
          return;
        }
        state.items = data.notifications || [];
        state.prefs = data.prefs || state.prefs;
        state.loaded = true;
        setCount(data.unread || 0);
        renderList();
        renderSwitches();
      })
      .catch(function () {
        if (!state.loaded) listEl.innerHTML = '<div class="nt-empty">Could not load notifications. Please refresh.</div>';
      });
  }

  function show(view) {
    var all = view === 'all';
    document.getElementById('nt-view-all').style.display = all ? '' : 'none';
    document.getElementById('nt-view-set').style.display = all ? 'none' : '';
    document.getElementById('nt-tab-all').className = 'nt-tab' + (all ? ' on' : '');
    document.getElementById('nt-tab-set').className = 'nt-tab' + (all ? '' : ' on');
  }
  document.getElementById('nt-tab-all').addEventListener('click', function () { show('all'); });
  document.getElementById('nt-tab-set').addEventListener('click', function () { show('set'); });

  function setFilter(f) {
    state.filter = f;
    document.getElementById('nt-f-all').className = 'nt-chip' + (f === 'all' ? ' on' : '');
    document.getElementById('nt-f-unread').className = 'nt-chip' + (f === 'unread' ? ' on' : '');
    renderList();
  }
  document.getElementById('nt-f-all').addEventListener('click', function () { setFilter('all'); });
  document.getElementById('nt-f-unread').addEventListener('click', function () { setFilter('unread'); });

  readAllBtn.addEventListener('click', function () {
    state.items.forEach(function (n) { n.read = true; });
    setCount(0);
    renderList();
    post({ action: 'read_all' }).catch(function () {});
  });

  load();
  setInterval(function () { if (!document.hidden && state.loaded) load(); }, 30000);
})();
</script>
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const raw = url.searchParams.get("path_prefix") || "";
  const proxyPath = /^\/(apps|a|community|tools)\/[A-Za-z0-9_-]{1,30}$/.test(raw)
    ? raw
    : "/apps/messages";

  return new Response(PAGE.replace("__BASE__", proxyPath), {
    headers: {
      "Content-Type": "application/liquid; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
