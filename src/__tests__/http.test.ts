import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
  beforeEach,
} from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHttpServer } from "../http/server.js";
import { state } from "../http/state.js";

const PORT = 39991;
const BASE = `http://127.0.0.1:${PORT}`;

let server: { close: () => void };
let testDir: string;
let envStore: Record<string, string>;

const mockSentMessages: Array<{ jid: string; text: string }> = [];
const mockSock = {
  sendMessage: async (jid: string, content: { text: string }) => {
    mockSentMessages.push({ jid, text: content.text });
  },
};

beforeAll(() => {
  testDir = join(tmpdir(), `reverb-http-test-${Date.now()}`);
  mkdirSync(testDir, { recursive: true });
  writeFileSync(join(testDir, "empty-mcp.json"), '{"mcpServers":{}}');

  envStore = { CLAUDE_BIN: "claude", HTTP_PORT: String(PORT) };

  server = createHttpServer({
    host: "127.0.0.1",
    port: PORT,
    readEnv: () => ({ ...envStore }),
    writeEnv: (values) => {
      Object.assign(envStore, values);
    },
    getSock: () => mockSock,
    onStop: vi.fn(),
    claudeBin: "claude",
    claudeCwd: testDir,
    claudeMcpConfig: join(testDir, "empty-mcp.json"),
  });
});

afterAll(() => {
  server.close();
  rmSync(testDir, { recursive: true, force: true });
});

// ─── /api/healthz ────────────────────────────────────────────────────────────

describe("GET /api/healthz", () => {
  it("returns 200 with ok: true", async () => {
    const res = await fetch(`${BASE}/api/healthz`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});

// ─── /api/status ─────────────────────────────────────────────────────────────

describe("GET /api/status", () => {
  it("returns 200 with expected shape", async () => {
    const res = await fetch(`${BASE}/api/status`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({
      connection: expect.any(String),
      processed: expect.any(Number),
      notified: expect.any(Number),
      uptimeMs: expect.any(Number),
      hasQr: expect.any(Boolean),
    });
  });

  it("connection starts as disconnected", async () => {
    const res = await fetch(`${BASE}/api/status`);
    const json = await res.json();
    expect(json.connection).toBe("disconnected");
  });

  it("uptimeMs is positive", async () => {
    const res = await fetch(`${BASE}/api/status`);
    const json = await res.json();
    expect(json.uptimeMs).toBeGreaterThan(0);
  });
});

// ─── /api/qr ─────────────────────────────────────────────────────────────────

describe("GET /api/qr", () => {
  it("returns 200 with qr: null when not pairing", async () => {
    const res = await fetch(`${BASE}/api/qr`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.qr).toBeNull();
  });
});

// ─── /api/config ─────────────────────────────────────────────────────────────

describe("GET /api/config", () => {
  it("returns 200 with values object", async () => {
    const res = await fetch(`${BASE}/api/config`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.values).toBeDefined();
    expect(typeof json.values).toBe("object");
  });

  it("exposes env values from readEnv", async () => {
    const res = await fetch(`${BASE}/api/config`);
    const json = await res.json();
    expect(json.values.CLAUDE_BIN).toBe("claude");
  });

  it("redacts keys named AUTH_TOKEN, API_KEY, SECRET", async () => {
    const original = { ...envStore };
    envStore.AUTH_TOKEN = "supersecret";
    envStore.API_KEY = "apikey123";
    envStore.SECRET = "topsecret";

    const res = await fetch(`${BASE}/api/config`);
    const json = await res.json();
    expect(json.values.AUTH_TOKEN).toBe("***");
    expect(json.values.API_KEY).toBe("***");
    expect(json.values.SECRET).toBe("***");

    // Restore
    Object.assign(envStore, original);
    delete envStore.AUTH_TOKEN;
    delete envStore.API_KEY;
    delete envStore.SECRET;
  });
});

describe("POST /api/config", () => {
  it("returns 200 and updates env store", async () => {
    const res = await fetch(`${BASE}/api/config`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ values: { SESSION_MODE: "none" } }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(envStore.SESSION_MODE).toBe("none");
  });

  it("returns 400 for invalid body", async () => {
    const res = await fetch(`${BASE}/api/config`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bad: "payload" }),
    });
    expect(res.status).toBe(400);
  });
});

// ─── /api/logs ───────────────────────────────────────────────────────────────

describe("GET /api/logs", () => {
  it("returns 200 with empty entries when no audit log exists", async () => {
    const res = await fetch(`${BASE}/api/logs`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.entries).toEqual([]);
  });

  it("respects limit query param (max 500)", async () => {
    const res = await fetch(`${BASE}/api/logs?limit=999`);
    expect(res.status).toBe(200);
  });
});

// ─── /api/stop ───────────────────────────────────────────────────────────────

describe("POST /api/stop", () => {
  it("returns 200 with stopping: true (process.exit mocked)", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as never);

    const res = await fetch(`${BASE}/api/stop`, { method: "POST" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.stopping).toBe(true);

    // Wait for the 100ms timeout in the handler
    await new Promise((r) => setTimeout(r, 150));
    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });
});

// ─── /api/notify ─────────────────────────────────────────────────────────────

describe("POST /api/notify", () => {
  beforeEach(() => {
    mockSentMessages.length = 0;
    envStore.NOTIFY_JID = "5500000000000@s.whatsapp.net";
    delete envStore.NOTIFY_TOKEN;
    state.connection = "connected";
  });

  // ── happy path ──────────────────────────────────────────────────────────────

  it("returns 200 with ok: true and sent: true", async () => {
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Deploy ok" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.sent).toBe(true);
  });

  it("dispatches exactly one WhatsApp message per call", async () => {
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "ping" }),
    });
    expect(mockSentMessages).toHaveLength(1);
  });

  it("message text contains the title", async () => {
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Deploy ok", level: "success", service: "api" }),
    });
    expect(mockSentMessages[0].text).toContain("Deploy ok");
  });

  it("message text contains the correct level emoji", async () => {
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x", level: "error" }),
    });
    expect(mockSentMessages[0].text).toContain("🔴");
  });

  it("message text contains service in italic format", async () => {
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x", service: "my-service" }),
    });
    expect(mockSentMessages[0].text).toContain("_my-service_");
  });

  it("message text contains body when provided", async () => {
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x", body: "server stopped unexpectedly" }),
    });
    expect(mockSentMessages[0].text).toContain("server stopped unexpectedly");
  });

  it("message text contains reverb footer", async () => {
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x" }),
    });
    expect(mockSentMessages[0].text).toMatch(/— reverb · \d{2}:\d{2}/);
  });

  // ── JID resolution ──────────────────────────────────────────────────────────

  it("uses NOTIFY_JID from env as target", async () => {
    envStore.NOTIFY_JID = "5511111111111@s.whatsapp.net";
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x" }),
    });
    expect(mockSentMessages[0].jid).toBe("5511111111111@s.whatsapp.net");
  });

  it("`to` field overrides NOTIFY_JID", async () => {
    envStore.NOTIFY_JID = "5511111111111@s.whatsapp.net";
    const override = "5599999999999@s.whatsapp.net";
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x", to: override }),
    });
    expect(mockSentMessages[0].jid).toBe(override);
  });

  it("returns 400 when no JID is resolvable", async () => {
    delete envStore.NOTIFY_JID;
    // state.me is null in tests (no real WhatsApp connection)
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "no jid" }),
    });
    expect(res.status).toBe(400);
  });

  // ── NOTIFY_ROUTES routing ───────────────────────────────────────────────────

  it("routes to jid from NOTIFY_ROUTES when service matches", async () => {
    envStore.NOTIFY_ROUTES = "api:5511111111111@s.whatsapp.net";
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x", service: "api" }),
    });
    expect(mockSentMessages[0].jid).toBe("5511111111111@s.whatsapp.net");
  });

  it("NOTIFY_ROUTES is overridden by explicit `to` field", async () => {
    envStore.NOTIFY_ROUTES = "api:5511111111111@s.whatsapp.net";
    const override = "5599999999999@s.whatsapp.net";
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x", service: "api", to: override }),
    });
    expect(mockSentMessages[0].jid).toBe(override);
  });

  it("falls back to NOTIFY_JID when service is not in NOTIFY_ROUTES", async () => {
    envStore.NOTIFY_ROUTES = "db:5522222222222@s.whatsapp.net";
    envStore.NOTIFY_JID = "5500000000000@s.whatsapp.net";
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "x", service: "api" }),
    });
    expect(mockSentMessages[0].jid).toBe("5500000000000@s.whatsapp.net");
  });

  // ── counter ─────────────────────────────────────────────────────────────────

  it("increments notified counter on success", async () => {
    const before = await fetch(`${BASE}/api/status`)
      .then((r) => r.json())
      .then((j) => j.notified as number);

    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "counter test" }),
    });

    const after = await fetch(`${BASE}/api/status`)
      .then((r) => r.json())
      .then((j) => j.notified as number);

    expect(after).toBe(before + 1);
  });

  // ── validation ──────────────────────────────────────────────────────────────

  it("returns 400 when title is missing", async () => {
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "no title here" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when title is an empty string", async () => {
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is invalid JSON", async () => {
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json at all",
    });
    expect(res.status).toBe(400);
  });

  // ── auth ────────────────────────────────────────────────────────────────────

  it("returns 401 when token is set and Authorization header is wrong", async () => {
    envStore.NOTIFY_TOKEN = "secret123";
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer wrong" },
      body: JSON.stringify({ title: "test" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is set and Authorization header is absent", async () => {
    envStore.NOTIFY_TOKEN = "secret123";
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "test" }),
    });
    expect(res.status).toBe(401);
  });

  it("accepts correct bearer token", async () => {
    envStore.NOTIFY_TOKEN = "secret123";
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer secret123" },
      body: JSON.stringify({ title: "authorized" }),
    });
    expect(res.status).toBe(200);
  });

  it("allows requests without auth when no token is configured", async () => {
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "open" }),
    });
    expect(res.status).toBe(200);
  });

  // ── not connected ───────────────────────────────────────────────────────────

  it("returns 503 when socket exists but WhatsApp is not connected", async () => {
    state.connection = "disconnected";
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "test" }),
    });
    expect(res.status).toBe(503);
    expect(mockSentMessages).toHaveLength(0);
  });

  it("returns 503 when getSock returns null", async () => {
    const { createHttpServer: createServer } = await import("../http/server.js");
    const nullSockServer = createServer({
      host: "127.0.0.1",
      port: 39992,
      readEnv: () => ({ NOTIFY_JID: "5500@s.whatsapp.net" }),
      writeEnv: () => {},
      getSock: () => null,
      claudeBin: "claude",
      claudeCwd: testDir,
      claudeMcpConfig: join(testDir, "empty-mcp.json"),
    });
    const res = await fetch("http://127.0.0.1:39992/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "test" }),
    });
    expect(res.status).toBe(503);
    nullSockServer.close();
  });

  it("does not dispatch a message when returning 503", async () => {
    const { createHttpServer: createServer } = await import("../http/server.js");
    const nullSockServer = createServer({
      host: "127.0.0.1",
      port: 39993,
      readEnv: () => ({ NOTIFY_JID: "5500@s.whatsapp.net" }),
      writeEnv: () => {},
      getSock: () => null,
      claudeBin: "claude",
      claudeCwd: testDir,
      claudeMcpConfig: join(testDir, "empty-mcp.json"),
    });
    await fetch("http://127.0.0.1:39993/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "test" }),
    });
    expect(mockSentMessages).toHaveLength(0);
    nullSockServer.close();
  });
});

// ─── 404 handling ────────────────────────────────────────────────────────────

describe("unknown routes", () => {
  it("returns JSON error for unknown API route", async () => {
    const res = await fetch(`${BASE}/api/nonexistent`);
    // Hono returns 404 for unregistered routes
    expect(res.status).toBe(404);
  });
});
