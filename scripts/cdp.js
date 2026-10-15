// scripts/cdp.js — minimal Chrome DevTools Protocol client used by the verify scripts.
//
// Needs a Chrome already listening for the protocol. Start one with:
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//     --remote-debugging-port=9222 about:blank
// The port can be moved with CDP_PORT.
//
// Node 20 only exposes the global WebSocket behind a flag; Node 22+ has it built in, so the
// guard below names the flag instead of failing with "WebSocket is not defined".
const CDP_PORT = process.env.CDP_PORT || 9222;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

if (typeof WebSocket === 'undefined') {
  console.error('This Node has no global WebSocket — on Node 20 the flag is required:');
  console.error('  node --experimental-websocket scripts/verify-entities.js');
  process.exit(2);
}

async function listTargets() {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
  return res.json();
}

class Client {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
    this.logs = [];
    this.errors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => {
      this.ws.addEventListener('open', res, { once: true });
      this.ws.addEventListener('error', () => rej(new Error('WebSocket error — wrong debug URL?')), { once: true });
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
        return;
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = (msg.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        this.logs.push(`[${msg.params.type}] ${text}`);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        this.errors.push(msg.params.exceptionDetails?.exception?.description || JSON.stringify(msg.params));
      }
    });
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    return this;
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }
      }, 30000);
    });
  }

  async goto(url, waitMs = 2500) {
    await this.send('Page.navigate', { url });
    await sleep(waitMs);
    return this;
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval threw');
    return r.result.value;
  }

  // Click the first element matching the predicate and return the predicate's own report.
  freshErrors() { const e = this.errors.slice(); this.errors = []; return e; }
  close() { try { this.ws.close(); } catch {} }
}

async function openClient(urlIncludes) {
  const targets = await listTargets();
  const pages = targets.filter(t => t.type === 'page');
  const page = (urlIncludes && pages.find(t => (t.url || '').includes(urlIncludes))) || pages[0];
  if (!page) throw new Error('No page target. Launch Chrome with --remote-debugging-port=9222');
  const client = new Client(page.webSocketDebuggerUrl);
  client.targetId = page.id;
  return client.connect();
}

// Open a brand-new tab and attach to it. A long-lived tab can end up holding a stale HMR
// module graph after the dev server recompiles (every route renders an empty #__next), which
// looks exactly like a broken page. A fresh tab always mounts.
async function newTab(url = 'about:blank') {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURI(url)}`, { method: 'PUT' });
  const target = await res.json();
  if (!target.webSocketDebuggerUrl) throw new Error(`Could not open a tab: ${JSON.stringify(target).slice(0, 200)}`);
  const client = new Client(target.webSocketDebuggerUrl);
  client.targetId = target.id;
  return client.connect();
}

module.exports = { openClient, newTab, listTargets, sleep, Client };
