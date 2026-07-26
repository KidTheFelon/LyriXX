import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import { ConfirmModal } from "./ConfirmModal";

vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k, lang: "ru" }),
  getTranslation: (_l: string, k: string) => k,
  LanguageContext: { Provider: ({ children }: any) => children },
}));

vi.mock("@/constants", () => ({
  MODAL_ANIM_DURATION_MS: 50,
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("ConfirmModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when open=false (initial state)", () => {
    const { container } = render(
      <ConfirmModal
        open={false}
        title="T"
        message="M"
        confirmLabel="OK"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows title, message, and confirmLabel when open", async () => {
    const { getByText } = render(
      <ConfirmModal
        open={true}
        title="Delete?"
        message="Are you sure?"
        confirmLabel="Yes, delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(getByText("Delete?")).toBeTruthy();
    expect(getByText("Are you sure?")).toBeTruthy();
    expect(getByText("Yes, delete")).toBeTruthy();
  });

  it("click confirm calls onConfirm after animation", async () => {
    const onConfirm = vi.fn();
    const { getByText } = render(
      <ConfirmModal
        open={true}
        title="T"
        message="M"
        confirmLabel="OK"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    await act(async () => {
      fireEvent.click(getByText("OK"));
    });
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("click cancel calls onCancel after animation", async () => {
    const onCancel = vi.fn();
    const { getByText } = render(
      <ConfirmModal
        open={true}
        title="T"
        message="M"
        confirmLabel="OK"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    const cancelBtn = document.body.querySelector(".modal-btn-cancel")!;
    await act(async () => {
      fireEvent.click(cancelBtn);
    });
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("danger mode adds danger class to confirm button", async () => {
    const { getByText } = render(
      <ConfirmModal
        open={true}
        title="T"
        message="M"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        danger
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    const btn = getByText("Delete");
    expect(btn.className).toContain("modal-btn-danger");
  });
});
