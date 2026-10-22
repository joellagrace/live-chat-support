import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

// Served at /apps/messages. Returned as Liquid so Shopify renders it inside
// the theme layout (header/footer), same approach as the Repair page.
// NOTE: Liquid processes this body, so it must never contain the Liquid
// delimiters (two opening curly braces, or curly-brace + percent).
// Also: no backticks / dollar-brace and no backslashes (this is a TS template literal).

const PAGE = `
<style>
.lc-root{--lc-font:inherit;--lc-text:#2b2b2b;--lc-muted:#8a8a8a;--lc-accent:#c98d77;--lc-accent-text:#fff;--lc-border:#ece5e2;--lc-card-bg:#fff;--lc-head-bg:#f6e9e4;--lc-body-bg:#fbfaf9;--lc-mine:#c98d77;--lc-radius:18px;--lc-online:#3fbf72;font-family:var(--lc-font);color:var(--lc-text);box-sizing:border-box;width:100%;max-width:980px;margin:0 auto;padding:12px}
.lc-root *{box-sizing:border-box;font-family:inherit}
.lc-card{background:var(--lc-card-bg);border:1px solid var(--lc-border);border-radius:var(--lc-radius);overflow:hidden;display:flex;flex-direction:column;height:min(680px,80vh);min-height:420px;box-shadow:0 2px 6px rgba(60,40,30,.04),0 14px 34px rgba(60,40,30,.07)}
.lc-head{background:var(--lc-head-bg);padding:16px 22px;display:flex;align-items:center;gap:14px;border-bottom:1px solid var(--lc-border)}
.lc-hav{position:relative;width:44px;height:44px;border-radius:50%;background:var(--lc-accent);color:var(--lc-accent-text);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;letter-spacing:.4px;flex-shrink:0}
.lc-hav i{position:absolute;right:0;bottom:0;width:12px;height:12px;border-radius:50%;background:var(--lc-online);border:2px solid var(--lc-head-bg)}
.lc-hav{overflow:visible}.lc-hav span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}.lc-hav img{position:absolute;inset:0;width:100%;height:100%;border-radius:50%;object-fit:cover;background:var(--lc-accent)}.lc-hav i{z-index:2}.lc-hmeta{flex:1;min-width:0}.lc-ondot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--lc-online);margin-right:6px}.lc-snd{border:1px solid var(--lc-border);background:#fff;color:var(--lc-muted);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;padding:0}.lc-snd:hover{color:var(--lc-text)}
.lc-avimg{position:relative;overflow:hidden}.lc-avimg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%}
.lc-htitle{font-weight:650;font-size:16px;line-height:1.2}
.lc-hsub{font-size:12.5px;color:var(--lc-muted);margin-top:3px;display:flex;align-items:center}
.lc-list{flex:1;overflow-y:auto;background:var(--lc-body-bg);padding:22px 22px 10px;display:flex;flex-direction:column;gap:2px;scroll-behavior:smooth}
.lc-day{align-self:center;font-size:11.5px;font-weight:600;color:var(--lc-muted);background:#fff;border:1px solid var(--lc-border);border-radius:20px;padding:4px 13px;margin:14px 0 8px}
.lc-line{display:flex;gap:10px;align-items:flex-end;margin-top:8px;animation:lcin .18s ease-out}
.lc-line.me{flex-direction:row-reverse}
.lc-av{width:30px;height:30px;border-radius:50%;background:var(--lc-accent);color:var(--lc-accent-text);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.lc-col{display:flex;flex-direction:column;max-width:72%;min-width:0}
.lc-line.me .lc-col{align-items:flex-end}
.lc-msg{padding:10px 15px;font-size:14.5px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere;border-radius:18px}
.lc-line.me .lc-msg{background:var(--lc-mine);color:var(--lc-accent-text);border-bottom-right-radius:6px}
.lc-line.them .lc-msg{background:#fff;border:1px solid var(--lc-border);border-bottom-left-radius:6px}
.lc-line.bot .lc-msg{background:#f3efed;border:1px dashed #dcd2cd;color:#5b514d}
.lc-line.pend .lc-msg{opacity:.65}
.lc-time{font-size:11px;color:var(--lc-muted);margin:4px 5px 0}
.lc-tag{font-size:10.5px;font-weight:600;color:var(--lc-muted);margin:0 5px 3px;letter-spacing:.3px;text-transform:uppercase}
.lc-typing{display:inline-flex;gap:4px;padding:13px 16px;background:#fff;border:1px solid var(--lc-border);border-radius:18px;border-bottom-left-radius:6px}
.lc-typing b{width:7px;height:7px;border-radius:50%;background:#c5bab5;animation:lcdot 1.2s infinite ease-in-out}
.lc-typing b:nth-child(2){animation-delay:.15s}
.lc-typing b:nth-child(3){animation-delay:.3s}
@keyframes lcdot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}
@keyframes lcin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.lc-empty{margin:auto;text-align:center;color:var(--lc-muted);font-size:14px;max-width:340px;line-height:1.55;padding:20px}
.lc-empty .ic{width:68px;height:68px;border-radius:50%;background:var(--lc-head-bg);display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
.lc-empty strong{display:block;color:var(--lc-text);font-size:16px;margin-bottom:6px}
.lc-err{color:#b3261e;font-size:12.5px;padding:0 20px 8px;background:var(--lc-card-bg)}
.lc-err:empty{display:none}
.lc-form{display:flex;gap:10px;align-items:flex-end;padding:14px 18px 16px;border-top:1px solid var(--lc-border);background:var(--lc-card-bg)}
.lc-box{flex:1;min-width:0;border:1px solid var(--lc-border);background:#faf8f7;border-radius:16px;padding:6px 14px;transition:border-color .12s,box-shadow .12s}
.lc-box:focus-within{border-color:var(--lc-accent);box-shadow:0 0 0 3px rgba(201,141,119,.2);background:#fff}
.lc-input,.lc-input:focus,.lc-input:hover,.lc-input:active{width:100%;border:0!important;outline:0!important;box-shadow:none!important;-webkit-appearance:none;appearance:none;border-radius:0!important;resize:none;background:transparent!important;font-size:14.5px;line-height:1.45;color:var(--lc-text);padding:7px 0!important;margin:0!important;max-height:130px;display:block;min-height:0;height:auto}
.lc-btn{border:0;background:var(--lc-accent);color:var(--lc-accent-text);border-radius:14px;height:46px;min-width:46px;padding:0 20px;font-weight:650;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;flex-shrink:0}
.lc-btn:hover:not(:disabled){filter:brightness(.96)}
.lc-btn:disabled{opacity:.5;cursor:default}
.lc-foot{font-size:11.5px;color:var(--lc-muted);text-align:center;padding:0 18px 12px;background:var(--lc-card-bg)}
@media(max-width:600px){.lc-root{padding:0}.lc-card{border-radius:0;border-left:0;border-right:0;height:84vh}.lc-col{max-width:84%}.lc-btn span{display:none}.lc-btn{padding:0;width:46px}.lc-list{padding:16px 12px 8px}}
</style>
<div class="lc-root" id="lc-root">
  <div class="lc-card">
    <div class="lc-head">
      <div class="lc-hav"><span>JG</span><img src="__APP__/avatar.png" alt="" onerror="this.style.display='none'"><i></i></div>
      <div class="lc-hmeta">
        <div class="lc-htitle">Live Chat Support</div>
        <div class="lc-hsub"><span class="lc-ondot"></span>Online</div>
      </div>
      <button type="button" class="lc-snd" id="lc-snd" title="Sound on/off" aria-label="Toggle notification sound">
        <svg id="lc-snd-on" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>
        <svg id="lc-snd-off" style="display:none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>
      </button>
    </div>
    <div class="lc-list" id="lc-list"><div class="lc-empty" id="lc-loading">Loading...</div></div>
    <div class="lc-err" id="lc-err"></div>
    <form class="lc-form" id="lc-form" autocomplete="off">
      <div class="lc-box"><textarea class="lc-input" id="lc-input" rows="1" maxlength="2000" placeholder="Type your message..."></textarea></div>
      <button class="lc-btn" id="lc-send" type="submit"><span>Send</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg></button>
    </form>
    <div class="lc-foot">Powered by Huemono ✦</div>
  </div>
</div>
<script>
(function () {
  var BASE = '__BASE__';
  var APP = '__APP__';
  var root = document.getElementById('lc-root');
  var list = document.getElementById('lc-list');
  var form = document.getElementById('lc-form');
  var input = document.getElementById('lc-input');
  var sendBtn = document.getElementById('lc-send');
  var errEl = document.getElementById('lc-err');
  var foot = root.querySelector('.lc-foot');

  // Optional style overrides from the URL (e.g. ?accent=c98d77&font=Georgia)
  var qs = new URLSearchParams(window.location.search);
  var map = { font: '--lc-font', text: '--lc-text', accent: '--lc-accent', accent_text: '--lc-accent-text', border: '--lc-border', card_bg: '--lc-card-bg', radius: '--lc-radius' };
  Object.keys(map).forEach(function (k) {
    var v = qs.get(k);
    if (!v || v.length > 60) return;
    if (/^[0-9a-fA-F]{3,8}$/.test(v) && k !== 'font' && k !== 'radius') v = '#' + v;
    if (/^[A-Za-z0-9#%.,() '"_-]+$/.test(v)) root.style.setProperty(map[k], v);
  });
  var acc = qs.get('accent');
  if (acc && /^[0-9a-fA-F]{3,8}$/.test(acc)) root.style.setProperty('--lc-mine', '#' + acc);

  // Notification sound (generated with WebAudio, no file). Browsers only allow
  // audio after the customer has interacted with the page once.
  var soundOn = true;
  try { if (localStorage.getItem('lc-sound') === 'off') soundOn = false; } catch (e) {}
  var actx = null;
  function unlockAudio() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) actx = new AC();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) {}
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, unlockAudio, { passive: true });
  });
  function tone(freq, start, dur) {
    var o = actx.createOscillator();
    var g = actx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, actx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + start + dur);
    o.connect(g);
    g.connect(actx.destination);
    o.start(actx.currentTime + start);
    o.stop(actx.currentTime + start + dur + 0.05);
  }
  function ding() {
    if (!soundOn || !actx || actx.state !== 'running') return;
    try { tone(880, 0, 0.18); tone(1318, 0.12, 0.28); } catch (e) {}
  }
  var sndBtn = document.getElementById('lc-snd');
  function paintSnd() {
    document.getElementById('lc-snd-on').style.display = soundOn ? '' : 'none';
    document.getElementById('lc-snd-off').style.display = soundOn ? 'none' : '';
  }
  paintSnd();
  sndBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    try { localStorage.setItem('lc-sound', soundOn ? 'on' : 'off'); } catch (e) {}
    paintSnd();
    unlockAudio();
    if (soundOn) ding();
  });
  var firstLoadDone = false;

  var seen = {};
  var held = {};
  var last = null;
  var loggedIn = true;
  var timer = null;
  var lastDay = '';
  var lastSender = '';
  var typingEl = null;

  function clock(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function dayLabel(iso) {
    var d = new Date(iso);
    var n = new Date();
    if (d.toDateString() === n.toDateString()) return 'Today';
    var y = new Date(n);
    y.setDate(n.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function nearBottom() {
    return list.scrollHeight - list.scrollTop - list.clientHeight < 120;
  }
  function scrollDown() { list.scrollTop = list.scrollHeight; }

  function clearPlaceholder() {
    var loading = document.getElementById('lc-loading');
    if (loading) loading.remove();
  }

  function render(m, pending) {
    clearPlaceholder();
    var key = new Date(m.createdAt).toDateString();
    if (key !== lastDay) {
      var day = document.createElement('div');
      day.className = 'lc-day';
      day.textContent = dayLabel(m.createdAt);
      insert(day);
      lastDay = key;
      lastSender = '';
    }
    var mine = m.sender === 'customer';
    var bot = m.sender === 'bot';
    var line = document.createElement('div');
    line.className = 'lc-line ' + (mine ? 'me' : bot ? 'them bot' : 'them') + (pending ? ' pend' : '');
    if (!mine) {
      var av = document.createElement('div');
      av.className = 'lc-av lc-avimg';
      av.innerHTML = 'JG<img src="' + APP + '/avatar.png" alt="" onerror="this.style.display=&quot;none&quot;">';
      if (lastSender === m.sender) av.style.visibility = 'hidden';
      line.appendChild(av);
    }
    var col = document.createElement('div');
    col.className = 'lc-col';
    if (bot) {
      var tag = document.createElement('div');
      tag.className = 'lc-tag';
      tag.textContent = 'Automated reply';
      col.appendChild(tag);
    }
    var bub = document.createElement('div');
    bub.className = 'lc-msg';
    bub.textContent = m.body;
    var time = document.createElement('div');
    time.className = 'lc-time';
    time.textContent = pending ? 'Sending...' : clock(m.createdAt);
    col.appendChild(bub);
    col.appendChild(time);
    line.appendChild(col);
    insert(line);
    lastSender = m.sender;
    return line;
  }

  function insert(el) {
    if (typingEl && typingEl.parentNode) list.insertBefore(el, typingEl);
    else list.appendChild(el);
  }

  function add(m) {
    if (seen[m.id] || held[m.id]) return false;
    seen[m.id] = true;
    var stick = nearBottom();
    render(m, false);
    if (!last || m.createdAt > last) last = m.createdAt;
    if (stick || m.sender === 'customer') scrollDown();
    return true;
  }

  function showEmpty() {
    if (list.querySelector('.lc-line')) return;
    clearPlaceholder();
    if (document.getElementById('lc-welcome')) return;
    var w = document.createElement('div');
    w.className = 'lc-empty';
    w.id = 'lc-welcome';
    w.innerHTML = '<div class="ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c98d77" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></div><strong>Hi, how can we help?</strong>Send us a message and our team will reply here. You will also get an email if you step away.';
    list.appendChild(w);
  }

  function removeWelcome() {
    var w = document.getElementById('lc-welcome');
    if (w) w.remove();
  }

  function showTyping() {
    if (typingEl) return;
    typingEl = document.createElement('div');
    typingEl.className = 'lc-line them';
    typingEl.innerHTML = '<div class="lc-av lc-avimg">JG<img src="' + APP + '/avatar.png" alt="" onerror="this.style.display=&quot;none&quot;"></div><div class="lc-typing"><b></b><b></b><b></b></div>';
    list.appendChild(typingEl);
    scrollDown();
  }
  function hideTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  function poll() {
    var url = BASE + '/poll?visible=' + (document.hidden ? '0' : '1') + (last ? '&after=' + encodeURIComponent(last) : '');
    return fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(function (r) {
        if (r.status === 401) { loggedIn = false; return null; }
        return r.json();
      })
      .then(function (data) {
        if (!data) {
          list.innerHTML = '<div class="lc-empty"><strong>Please log in</strong>Log in to your account to chat with us.</div>';
          form.style.display = 'none';
          foot.style.display = 'none';
          return;
        }
        var fresh = false;
        (data.messages || []).forEach(function (m) {
          removeWelcome();
          if (add(m) && m.sender === 'admin') fresh = true;
        });
        if (fresh && firstLoadDone) ding();
        firstLoadDone = true;
        showEmpty();
      })
      .catch(function () {});
  }

  function schedule() {
    clearTimeout(timer);
    if (!loggedIn) return;
    var delay = document.hidden ? 20000 : 3000;
    timer = setTimeout(function () { poll().then(schedule); }, delay);
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { poll(); }
    schedule();
  });

  function grow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 130) + 'px';
  }
  input.addEventListener('input', grow);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || sendBtn.disabled) return;
    errEl.textContent = '';
    sendBtn.disabled = true;
    removeWelcome();
    var pendEl = render({ id: 'tmp', sender: 'customer', body: text, createdAt: new Date().toISOString() }, true);
    input.value = '';
    grow();
    scrollDown();
    fetch(BASE + '/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) {
          if (pendEl.parentNode) pendEl.parentNode.removeChild(pendEl);
          input.value = text;
          grow();
          errEl.textContent = res.j.error || 'Could not send.';
          return;
        }
        if (pendEl.parentNode) pendEl.parentNode.removeChild(pendEl);
        lastSender = '';
        var prev = list.querySelectorAll('.lc-line');
        if (prev.length) lastSender = prev[prev.length - 1].classList.contains('me') ? 'customer' : 'other';
        var auto = res.j.auto;
        if (auto) held[auto.id] = true;
        add(res.j.message);
        if (auto) {
          showTyping();
          setTimeout(function () {
            hideTyping();
            delete held[auto.id];
            add(auto);
          }, 1300);
        }
      })
      .catch(function () {
        if (pendEl.parentNode) pendEl.parentNode.removeChild(pendEl);
        input.value = text;
        grow();
        errEl.textContent = 'Could not send. Please try again.';
      })
      .then(function () { sendBtn.disabled = false; input.focus(); });
  });

  poll().then(function () { scrollDown(); schedule(); });
})();
</script>
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.appProxy(request);

  // Docs advise not hardcoding the proxy path: use path_prefix from the query.
  const url = new URL(request.url);
  const raw = url.searchParams.get("path_prefix") || "";
  const proxyPath = /^\/(apps|a|community|tools)\/[A-Za-z0-9_-]{1,30}$/.test(raw)
    ? raw
    : "/apps/messages";

  const appUrl = (process.env.SHOPIFY_APP_URL || "").replace(/\/$/, "");
  const html = PAGE.split("__APP__").join(appUrl).replace("__BASE__", proxyPath);

  return new Response(html, {
    headers: {
      "Content-Type": "application/liquid; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
