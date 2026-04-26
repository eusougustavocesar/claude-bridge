import { describe, it, expect } from "vitest";
import { formatNotification } from "../lib/notify.js";

// ─── emoji per level ─────────────────────────────────────────────────────────

describe("formatNotification — level emoji", () => {
  it("uses 🔴 for error", () => {
    expect(formatNotification({ title: "x", level: "error" })).toContain("🔴");
  });

  it("uses 🟡 for warning", () => {
    expect(formatNotification({ title: "x", level: "warning" })).toContain("🟡");
  });

  it("uses 🔵 for info", () => {
    expect(formatNotification({ title: "x", level: "info" })).toContain("🔵");
  });

  it("uses 🟢 for success", () => {
    expect(formatNotification({ title: "x", level: "success" })).toContain("🟢");
  });

  it("uses ⚪ when level is omitted", () => {
    expect(formatNotification({ title: "x" })).toContain("⚪");
  });

  it("emoji appears on the first line", () => {
    const firstLine = formatNotification({ title: "Fired", level: "error" }).split("\n")[0];
    expect(firstLine).toContain("🔴");
  });
});

// ─── title ───────────────────────────────────────────────────────────────────

describe("formatNotification — title", () => {
  it("includes the title text", () => {
    expect(formatNotification({ title: "Deploy failed" })).toContain("Deploy failed");
  });

  it("bolds the title with WhatsApp * markers", () => {
    expect(formatNotification({ title: "Deploy failed" })).toContain("*Deploy failed*");
  });

  it("title appears on the first line", () => {
    const firstLine = formatNotification({ title: "My Alert" }).split("\n")[0];
    expect(firstLine).toContain("My Alert");
  });

  it("handles titles with special characters", () => {
    const msg = formatNotification({ title: "CPU > 90% (critical!)" });
    expect(msg).toContain("CPU > 90% (critical!)");
  });
});

// ─── service ─────────────────────────────────────────────────────────────────

describe("formatNotification — service", () => {
  it("includes the service name when provided", () => {
    expect(formatNotification({ title: "x", service: "api-server" })).toContain("api-server");
  });

  it("wraps service in WhatsApp italic _ markers", () => {
    expect(formatNotification({ title: "x", service: "api-server" })).toContain("_api-server_");
  });

  it("service appears on the second line", () => {
    const lines = formatNotification({ title: "x", service: "svc" }).split("\n");
    expect(lines[1]).toBe("_svc_");
  });

  it("omits service line when not provided", () => {
    const msg = formatNotification({ title: "x" });
    expect(msg).not.toMatch(/_\w[\w-]*_/);
  });
});

// ─── body ────────────────────────────────────────────────────────────────────

describe("formatNotification — body", () => {
  it("includes the body text when provided", () => {
    expect(formatNotification({ title: "x", body: "details here" })).toContain("details here");
  });

  it("omits body content when not provided", () => {
    const msg = formatNotification({ title: "x" });
    const lines = msg.split("\n").filter(Boolean);
    // Only first line (title) and last line (footer) when no service/body
    expect(lines).toHaveLength(2);
  });

  it("preserves newlines within body text", () => {
    const msg = formatNotification({ title: "x", body: "line1\nline2" });
    expect(msg).toContain("line1\nline2");
  });
});

// ─── footer ──────────────────────────────────────────────────────────────────

describe("formatNotification — footer", () => {
  it("contains the reverb attribution", () => {
    expect(formatNotification({ title: "x" })).toContain("— reverb ·");
  });

  it("footer matches HH:MM time format", () => {
    expect(formatNotification({ title: "x" })).toMatch(/— reverb · \d{2}:\d{2}/);
  });

  it("footer is the last non-empty line", () => {
    const lines = formatNotification({ title: "x" }).split("\n").filter(Boolean);
    expect(lines[lines.length - 1]).toMatch(/— reverb · \d{2}:\d{2}/);
  });
});

// ─── full payload ─────────────────────────────────────────────────────────────

describe("formatNotification — full payload", () => {
  it("includes all fields in correct order", () => {
    const msg = formatNotification({
      title: "Deploy failed",
      body: "api-server stopped after 3 retries",
      level: "error",
      service: "api-server",
    });

    const lines = msg.split("\n");
    expect(lines[0]).toBe("🔴 *Deploy failed*");
    expect(lines[1]).toBe("_api-server_");
    expect(msg).toContain("api-server stopped after 3 retries");
    expect(msg).toMatch(/— reverb · \d{2}:\d{2}/);
  });

  it("produces consistent output for identical inputs (deterministic title/service/body)", () => {
    const payload = { title: "Test", body: "body", level: "info" as const, service: "svc" };
    const a = formatNotification(payload);
    const b = formatNotification(payload);
    // Strip timestamps before comparing
    const strip = (s: string) => s.replace(/\d{2}:\d{2}/, "HH:MM");
    expect(strip(a)).toBe(strip(b));
  });
});
