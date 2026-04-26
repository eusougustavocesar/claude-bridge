import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";

// ── Mocks (hoisted) ──────────────────────────────────────────────────────────

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

import { spawn } from "node:child_process";
import { parseIntervalMs, scheduleInterval, scheduleCron } from "../monitors/scheduler.js";
import { loadMonitors } from "../monitors/index.js";
import { runHttpCheck } from "../monitors/http.js";
import { runShellCheck } from "../monitors/shell.js";
import { parseNotifyRoutes } from "../http/server.js";
import type { HttpMonitor, ShellMonitor, MonitorState } from "../monitors/types.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any;

function makeSock() {
  return { sendMessage: vi.fn().mockResolvedValue(undefined) };
}

function makeState(last: MonitorState["last"] = "unknown"): MonitorState {
  return { last };
}

function makeHttpMonitor(overrides: Partial<HttpMonitor> = {}): HttpMonitor {
  return {
    name: "test-http",
    type: "http",
    url: "http://localhost:3000/health",
    jid: "55@s.whatsapp.net",
    interval: "5m",
    ...overrides,
  };
}

function makeShellMonitor(overrides: Partial<ShellMonitor> = {}): ShellMonitor {
  return {
    name: "test-shell",
    type: "shell",
    cmd: "echo hello",
    jid: "55@s.whatsapp.net",
    interval: "5m",
    ...overrides,
  };
}

function makeSpawnMock(stdout: string, stderr: string, exitCode: number) {
  const child = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    stdin: { write: vi.fn(), end: vi.fn() },
    on: vi.fn(),
  };

  vi.mocked(spawn).mockReturnValue(child as any);

  // Simulate async data emission via microtask
  child.stdout.on.mockImplementation((event: string, handler: (d: Buffer) => void) => {
    if (event === "data" && stdout) setTimeout(() => handler(Buffer.from(stdout)), 0);
  });
  child.stderr.on.mockImplementation((event: string, handler: (d: Buffer) => void) => {
    if (event === "data" && stderr) setTimeout(() => handler(Buffer.from(stderr)), 0);
  });
  child.on.mockImplementation((event: string, handler: (code: number) => void) => {
    if (event === "close") setTimeout(() => handler(exitCode), 0);
  });

  return child;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── parseIntervalMs ──────────────────────────────────────────────────────────

describe("parseIntervalMs", () => {
  it("parses milliseconds (ms)", () => {
    expect(parseIntervalMs("500ms")).toBe(500);
  });

  it("parses seconds (s)", () => {
    expect(parseIntervalMs("30s")).toBe(30_000);
  });

  it("parses minutes (m)", () => {
    expect(parseIntervalMs("5m")).toBe(300_000);
  });

  it("parses hours (h)", () => {
    expect(parseIntervalMs("2h")).toBe(7_200_000);
  });

  it("parses days (d)", () => {
    expect(parseIntervalMs("1d")).toBe(86_400_000);
  });

  it("parses decimal values", () => {
    expect(parseIntervalMs("0.5h")).toBe(1_800_000);
  });

  it("throws on unknown unit", () => {
    expect(() => parseIntervalMs("5w")).toThrow('Invalid interval: "5w"');
  });

  it("throws on empty string", () => {
    expect(() => parseIntervalMs("")).toThrow();
  });

  it("throws on plain number with no unit", () => {
    expect(() => parseIntervalMs("5000")).toThrow();
  });
});

// ── scheduleInterval ─────────────────────────────────────────────────────────

describe("scheduleInterval", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires immediately on first call", () => {
    const fn = vi.fn();
    const stop = scheduleInterval(fn, "1m");
    expect(fn).toHaveBeenCalledTimes(1);
    stop();
  });

  it("fires again after each interval", () => {
    const fn = vi.fn();
    const stop = scheduleInterval(fn, "1m");
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_000);
    expect(fn).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(60_000);
    expect(fn).toHaveBeenCalledTimes(3);
    stop();
  });

  it("stop() prevents further calls", () => {
    const fn = vi.fn();
    const stop = scheduleInterval(fn, "1m");
    stop();
    vi.advanceTimersByTime(120_000);
    expect(fn).toHaveBeenCalledTimes(1); // only the immediate call
  });
});

// ── scheduleCron ─────────────────────────────────────────────────────────────

describe("scheduleCron", () => {
  it("returns a stop function", () => {
    const stop = scheduleCron(() => {}, "*/5 * * * *");
    expect(typeof stop).toBe("function");
    stop();
  });

  it("throws on invalid cron pattern", () => {
    expect(() => scheduleCron(() => {}, "not-a-cron")).toThrow();
  });
});

// ── loadMonitors ─────────────────────────────────────────────────────────────

describe("loadMonitors", () => {
  const tmpFile = join(tmpdir(), `reverb_test_monitors_${Date.now()}.json`);

  afterEach(() => {
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
  });

  it("returns empty array when file does not exist", () => {
    expect(loadMonitors("/nonexistent/path/monitors.json")).toEqual([]);
  });

  it("returns parsed array from valid JSON", () => {
    const monitors = [makeHttpMonitor()];
    writeFileSync(tmpFile, JSON.stringify(monitors));
    expect(loadMonitors(tmpFile)).toEqual(monitors);
  });

  it("throws when JSON is invalid", () => {
    writeFileSync(tmpFile, "{ not valid json }");
    expect(() => loadMonitors(tmpFile)).toThrow("Failed to load monitors config");
  });

  it("throws when JSON is not an array", () => {
    writeFileSync(tmpFile, JSON.stringify({ name: "oops" }));
    expect(() => loadMonitors(tmpFile)).toThrow("monitors.json must be an array");
  });

  it("returns multiple monitors", () => {
    const monitors = [makeHttpMonitor(), makeShellMonitor()];
    writeFileSync(tmpFile, JSON.stringify(monitors));
    expect(loadMonitors(tmpFile)).toHaveLength(2);
  });
});

// ── runHttpCheck ─────────────────────────────────────────────────────────────

describe("runHttpCheck", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends down alert when fetch throws (network error)", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("ECONNREFUSED"));
    const sock = makeSock();
    const state = makeState();
    await runHttpCheck(makeHttpMonitor(), state, sock as any, logger);
    expect(sock.sendMessage).toHaveBeenCalledOnce();
    const text = sock.sendMessage.mock.calls[0][1].text as string;
    expect(text).toContain("test-http caiu");
  });

  it("sends down alert when response is non-2xx", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    const sock = makeSock();
    await runHttpCheck(makeHttpMonitor(), makeState(), sock as any, logger);
    const text = sock.sendMessage.mock.calls[0][1].text as string;
    expect(text).toContain("caiu");
  });

  it("does not send alert on first check when service is up", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    const sock = makeSock();
    await runHttpCheck(makeHttpMonitor(), makeState("unknown"), sock as any, logger);
    expect(sock.sendMessage).not.toHaveBeenCalled();
  });

  it("does not send duplicate down alerts on consecutive failures", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    const sock = makeSock();
    const state = makeState("down");
    await runHttpCheck(makeHttpMonitor(), state, sock as any, logger);
    expect(sock.sendMessage).not.toHaveBeenCalled();
  });

  it("sends recovery alert when service comes back up", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    const sock = makeSock();
    const state = makeState("down");
    await runHttpCheck(makeHttpMonitor(), state, sock as any, logger);
    const text = sock.sendMessage.mock.calls[0][1].text as string;
    expect(text).toContain("recuperado");
  });

  it("updates state from unknown to down on first failure", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    const state = makeState("unknown");
    await runHttpCheck(makeHttpMonitor(), state, makeSock() as any, logger);
    expect(state.last).toBe("down");
  });

  it("updates state from unknown to up on first success", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    const state = makeState("unknown");
    await runHttpCheck(makeHttpMonitor(), state, makeSock() as any, logger);
    expect(state.last).toBe("up");
  });

  it("updates state from down to up on recovery", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    const state = makeState("down");
    await runHttpCheck(makeHttpMonitor(), state, makeSock() as any, logger);
    expect(state.last).toBe("up");
  });

  it("sends to the monitor's configured jid", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("fail"));
    const sock = makeSock();
    const monitor = makeHttpMonitor({ jid: "custom-jid@s.whatsapp.net" });
    await runHttpCheck(monitor, makeState(), sock as any, logger);
    expect(sock.sendMessage.mock.calls[0][0]).toBe("custom-jid@s.whatsapp.net");
  });

  it("aborts fetch after configured timeout and treats it as down", async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(fetch).mockImplementation(((_url: string, opts: RequestInit) => {
      capturedSignal = opts?.signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        (opts?.signal as AbortSignal)?.addEventListener("abort", () => {
          reject(new DOMException("aborted", "AbortError"));
        });
      });
    }) as any);

    const monitor = makeHttpMonitor({ timeout: 50 });
    const sock = makeSock();
    await runHttpCheck(monitor, makeState(), sock as any, logger);

    expect(capturedSignal?.aborted).toBe(true);
    // Treated as down — alert sent
    const text = sock.sendMessage.mock.calls[0][1].text as string;
    expect(text).toContain("caiu");
  });
});

// ── runShellCheck ─────────────────────────────────────────────────────────────

describe("runShellCheck", () => {
  it("sends stdout as message on exit 0", async () => {
    makeSpawnMock("hello from script", "", 0);
    const sock = makeSock();
    await runShellCheck(makeShellMonitor(), sock as any, logger);
    expect(sock.sendMessage).toHaveBeenCalledOnce();
    expect(sock.sendMessage.mock.calls[0][1].text).toContain("hello from script");
  });

  it("is silent when exit 0 and stdout is empty", async () => {
    makeSpawnMock("", "", 0);
    const sock = makeSock();
    await runShellCheck(makeShellMonitor(), sock as any, logger);
    expect(sock.sendMessage).not.toHaveBeenCalled();
  });

  it("is silent when exit 0 and stdout is only whitespace", async () => {
    makeSpawnMock("   \n  ", "", 0);
    const sock = makeSock();
    await runShellCheck(makeShellMonitor(), sock as any, logger);
    expect(sock.sendMessage).not.toHaveBeenCalled();
  });

  it("sends error alert on non-zero exit code", async () => {
    makeSpawnMock("", "something went wrong", 1);
    const sock = makeSock();
    await runShellCheck(makeShellMonitor(), sock as any, logger);
    expect(sock.sendMessage).toHaveBeenCalledOnce();
    const text = sock.sendMessage.mock.calls[0][1].text as string;
    expect(text).toContain("falhou");
    expect(text).toContain("exit 1");
  });

  it("includes stderr in error alert when non-zero", async () => {
    makeSpawnMock("", "database unreachable", 2);
    const sock = makeSock();
    await runShellCheck(makeShellMonitor(), sock as any, logger);
    const text = sock.sendMessage.mock.calls[0][1].text as string;
    expect(text).toContain("database unreachable");
  });

  it("falls back to stdout in error alert when stderr is empty", async () => {
    makeSpawnMock("partial output", "", 1);
    const sock = makeSock();
    await runShellCheck(makeShellMonitor(), sock as any, logger);
    const text = sock.sendMessage.mock.calls[0][1].text as string;
    expect(text).toContain("partial output");
  });

  it("sends error alert when spawn throws", async () => {
    const child = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: vi.fn(),
    };
    vi.mocked(spawn).mockReturnValue(child as any);
    child.on.mockImplementation((event: string, handler: (err: Error) => void) => {
      if (event === "error") setTimeout(() => handler(new Error("ENOENT")), 0);
    });

    const sock = makeSock();
    await runShellCheck(makeShellMonitor(), sock as any, logger);
    expect(sock.sendMessage).toHaveBeenCalledOnce();
    const text = sock.sendMessage.mock.calls[0][1].text as string;
    expect(text).toContain("falhou ao executar");
  });

  it("sends to the monitor's configured jid", async () => {
    makeSpawnMock("output", "", 0);
    const sock = makeSock();
    const monitor = makeShellMonitor({ jid: "my-jid@s.whatsapp.net" });
    await runShellCheck(monitor, sock as any, logger);
    expect(sock.sendMessage.mock.calls[0][0]).toBe("my-jid@s.whatsapp.net");
  });

  it("uses sh -c to run the command", async () => {
    makeSpawnMock("ok", "", 0);
    await runShellCheck(makeShellMonitor({ cmd: "echo hello" }), makeSock() as any, logger);
    expect(vi.mocked(spawn)).toHaveBeenCalledWith(
      "sh",
      ["-c", "echo hello"],
      expect.anything()
    );
  });
});

// ── parseNotifyRoutes ────────────────────────────────────────────────────────

describe("parseNotifyRoutes", () => {
  it("returns empty object for empty string", () => {
    expect(parseNotifyRoutes("")).toEqual({});
  });

  it("parses a single service:jid pair", () => {
    expect(parseNotifyRoutes("api:55@s.whatsapp.net")).toEqual({
      api: "55@s.whatsapp.net",
    });
  });

  it("parses multiple service:jid pairs", () => {
    expect(parseNotifyRoutes("api:jid1,db:jid2")).toEqual({
      api: "jid1",
      db: "jid2",
    });
  });

  it("ignores entries without a colon", () => {
    expect(parseNotifyRoutes("api:jid1,broken,db:jid2")).toEqual({
      api: "jid1",
      db: "jid2",
    });
  });

  it("ignores entries where colon is the first character", () => {
    expect(parseNotifyRoutes(":jid1,api:jid2")).toEqual({ api: "jid2" });
  });

  it("trims whitespace from service and jid", () => {
    expect(parseNotifyRoutes(" api : jid1 ")).toEqual({ api: "jid1" });
  });
});
