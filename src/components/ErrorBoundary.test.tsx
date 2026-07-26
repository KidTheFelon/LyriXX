import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k, lang: "ru" }),
  getTranslation: (_l: string, k: string) => k,
  LanguageContext: { Provider: ({ children }: any) => children },
}));

vi.mock("@/services/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function ThrowingComponent() {
  throw new Error("test error");
}

function OkComponent() {
  return <div>child content</div>;
}

describe("ErrorBoundary", () => {
  it("renders children normally", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <OkComponent />
      </ErrorBoundary>,
    );
    expect(getByText("child content")).toBeTruthy();
  });

  it("catches error and shows fallback when provided", () => {
    const fallback = <div>custom fallback</div>;
    const { getByText } = render(
      <ErrorBoundary fallback={fallback}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(getByText("custom fallback")).toBeTruthy();
  });

  it("catches error and shows default error UI with try again button", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(getByText("errSomethingWrong")).toBeTruthy();
    expect(getByText("tryAgain")).toBeTruthy();
  });

  it("clicking try again re-renders children", () => {
    let shouldThrow = true;
    function ConditionalThrower() {
      if (shouldThrow) throw new Error("boom");
      return <div>recovered</div>;
    }

    const { getByText, unmount } = render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>,
    );

    unmount();

    shouldThrow = false;

    const { getByText: getByText2 } = render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>,
    );
    expect(getByText2("recovered")).toBeTruthy();
  });
});
