import { describe, it, expect } from "vitest";
import { formatNotification } from "../lib/notify.js";

describe("formatNotification", () => {
  it("includes the title", () => {
    const msg = formatNotification({ title: "Deploy failed" });
    expect(msg).toContain("Deploy failed");
  });

  it("uses correct emoji for each level", () => {
    expect(formatNotification({ title: "x", level: "error" })).toContain("🔴");
    expect(formatNotification({ title: "x", level: "warning" })).toContain("🟡");
    expect(formatNotification({ title: "x", level: "info" })).toContain("🔵");
    expect(formatNotification({ title: "x", level: "success" })).toContain("🟢");
  });

  it("uses ⚪ when no level is provided", () => {
    expect(formatNotification({ title: "x" })).toContain("⚪");
  });

  it("includes service when provided", () => {
    const msg = formatNotification({ title: "x", service: "api-server" });
    expect(msg).toContain("api-server");
  });

  it("omits service line when not provided", () => {
    const msg = formatNotification({ title: "x" });
    expect(msg).not.toMatch(/_\w+_/); // no italics service line
  });

  it("includes body when provided", () => {
    const msg = formatNotification({ title: "x", body: "details here" });
    expect(msg).toContain("details here");
  });

  it("omits body section when not provided", () => {
    const msg = formatNotification({ title: "x" });
    expect(msg).not.toContain("details");
  });

  it("includes reverb footer", () => {
    const msg = formatNotification({ title: "x" });
    expect(msg).toMatch(/— reverb · \d{2}:\d{2}/);
  });

  it("bolds the title with WhatsApp markdown", () => {
    const msg = formatNotification({ title: "Deploy failed" });
    expect(msg).toContain("*Deploy failed*");
  });
});
