import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "./logger";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

describe("logger", () => {
  beforeEach(() => {
    logger.getBuffer().forEach(() => {
      (logger as unknown as { getBuffer: () => { splice: (s: number, l: number) => void } })
        .getBuffer()
        .splice(0, 500);
    });
  });

  it("debug adds entry to buffer", () => {
    logger.debug("TEST", "hello");
    const buf = logger.getBuffer();
    const entry = buf[buf.length - 1];
    expect(entry).toBeDefined();
    expect(entry.level).toBe("debug");
    expect(entry.tag).toBe("TEST");
    expect(entry.message).toBe("hello");
    expect(entry.source).toBe("frontend");
    expect(entry.time).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });

  it("info adds entry to buffer", () => {
    logger.info("TAG", "msg");
    const buf = logger.getBuffer();
    const entry = buf[buf.length - 1];
    expect(entry.level).toBe("info");
  });

  it("warn adds entry to buffer", () => {
    logger.warn("TAG", "msg");
    const buf = logger.getBuffer();
    const entry = buf[buf.length - 1];
    expect(entry.level).toBe("warn");
  });

  it("error adds entry to buffer", () => {
    logger.error("TAG", "msg");
    const buf = logger.getBuffer();
    const entry = buf[buf.length - 1];
    expect(entry.level).toBe("error");
  });

  it("entries have correct format", () => {
    logger.info("FMT", "test message");
    const buf = logger.getBuffer();
    const entry = buf[buf.length - 1];
    expect(entry).toEqual({
      time: expect.stringMatching(/^\d{2}:\d{2}:\d{2}\.\d{3}$/),
      level: "info",
      tag: "FMT",
      message: "test message",
      source: "frontend",
    });
  });

  it("message includes extra args", () => {
    logger.info("T", "base", "arg1", "arg2");
    const buf = logger.getBuffer();
    const entry = buf[buf.length - 1];
    expect(entry.message).toBe("base arg1 arg2");
  });

  it("subscribe gets notified", () => {
    const listener = vi.fn();
    logger.subscribe(listener);
    logger.info("SUB", "event");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ level: "info", tag: "SUB", message: "event" }),
    );
  });

  it("unsubscribe stops notifications", () => {
    const listener = vi.fn();
    const unsub = logger.subscribe(listener);
    unsub();
    logger.info("SUB", "after unsub");
    expect(listener).not.toHaveBeenCalled();
  });

  it("getBuffer returns the buffer", () => {
    const buf = logger.getBuffer();
    expect(Array.isArray(buf)).toBe(true);
  });

  it("buffer does not exceed 500 entries", () => {
    for (let i = 0; i < 501; i++) {
      logger.debug("CAP", `${i}`);
    }
    expect(logger.getBuffer().length).toBe(500);
  });

  it("flushNow calls invoke", async () => {
    logger.info("FL", "flush me");
    const { invoke } = await import("@tauri-apps/api/core");
    logger.flushNow();
    await vi.waitFor(() => {
      expect(invoke).toHaveBeenCalledWith(
        "write_frontend_log",
        expect.objectContaining({ line: expect.any(String) }),
      );
    });
  });
});
