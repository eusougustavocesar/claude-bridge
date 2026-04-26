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
  });

  it("returns 200 and sends message when connected", async () => {
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Deploy ok", level: "success", service: "api" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.sent).toBe(true);
    expect(mockSentMessages).toHaveLength(1);
    expect(mockSentMessages[0].text).toContain("Deploy ok");
    expect(mockSentMessages[0].text).toContain("🟢");
  });

  it("returns 400 when title is missing", async () => {
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "no title here" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 401 when token is wrong", async () => {
    envStore.NOTIFY_TOKEN = "secret123";
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer wrong",
      },
      body: JSON.stringify({ title: "test" }),
    });
    expect(res.status).toBe(401);
  });

  it("accepts correct bearer token", async () => {
    envStore.NOTIFY_TOKEN = "secret123";
    const res = await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer secret123",
      },
      body: JSON.stringify({ title: "authorized" }),
    });
    expect(res.status).toBe(200);
  });

  it("uses `to` field in body as target JID", async () => {
    const targetJid = "5599999999999@s.whatsapp.net";
    await fetch(`${BASE}/api/notify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "custom jid", to: targetJid }),
    });
    expect(mockSentMessages[0]?.jid).toBe(targetJid);
  });

  it("returns 503 when getSock returns null", async () => {
    // Create a second server on a different port with getSock: () => null
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
});

// ─── 404 handling ────────────────────────────────────────────────────────────

describe("unknown routes", () => {
  it("returns JSON error for unknown API route", async () => {
    const res = await fetch(`${BASE}/api/nonexistent`);
    // Hono returns 404 for unregistered routes
    expect(res.status).toBe(404);
  });
});
