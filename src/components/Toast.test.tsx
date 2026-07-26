import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ToastContainer, ToastData } from "./Toast";

vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k, lang: "ru" }),
  getTranslation: (_l: string, k: string) => k,
  LanguageContext: { Provider: ({ children }: any) => children },
}));

vi.mock("./Icons", () => ({
  IconClose: ({ size }: { size: number }) => <span data-testid="icon-close" data-size={size} />,
}));

vi.mock("@/constants", () => ({
  TOAST_VISIBLE_DURATION_MS: 100,
  TOAST_CLOSE_ANIM_MS: 50,
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("ToastContainer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing with empty toasts array", () => {
    const { container } = render(<ToastContainer toasts={[]} onRemove={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders toast with message and close button", () => {
    const toasts: ToastData[] = [{ id: "1", message: "Hello World", type: "info" }];
    const { getByText, getAllByRole } = render(
      <ToastContainer toasts={toasts} onRemove={vi.fn()} />,
    );
    expect(getByText("Hello World")).toBeTruthy();
    const alerts = getAllByRole("alert");
    expect(alerts.length).toBe(1);
  });

  it("toast has correct type class", () => {
    const toasts: ToastData[] = [{ id: "1", message: "Error!", type: "error" }];
    const { getByText } = render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />);
    const toast = getByText("Error!").closest("[role='alert']")!;
    expect(toast.className).toContain("toast--error");
  });

  it("success type class", () => {
    const toasts: ToastData[] = [{ id: "1", message: "OK", type: "success" }];
    const { getByText } = render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />);
    const toast = getByText("OK").closest("[role='alert']")!;
    expect(toast.className).toContain("toast--success");
  });

  it("click close button calls onRemove after animation", () => {
    const onRemove = vi.fn();
    const toasts: ToastData[] = [{ id: "42", message: "Bye", type: "info" }];
    const { getByText } = render(<ToastContainer toasts={toasts} onRemove={onRemove} />);
    const toast = getByText("Bye").closest("[role='alert']")!;
    const closeBtn = toast.querySelector(".toast-close")!;
    fireEvent.click(closeBtn);
    vi.advanceTimersByTime(100 + 50);
    expect(onRemove).toHaveBeenCalledWith("42");
  });

  it("toast has role=alert", () => {
    const toasts: ToastData[] = [{ id: "1", message: "Test", type: "info" }];
    const { getByText } = render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />);
    expect(getByText("Test").closest("[role='alert']")).toBeTruthy();
  });
});
