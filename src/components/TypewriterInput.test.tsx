import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { TypewriterInput } from "./TypewriterInput";

vi.mock("framer-motion", () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/utils/charUtils", () => ({
  computeCharIds: (val: string) => val.split("").map((_, i) => i),
}));

describe("TypewriterInput", () => {
  it("renders an input element", () => {
    const { container } = render(<TypewriterInput value="" onChange={vi.fn()} />);
    const input = container.querySelector("input");
    expect(input).not.toBeNull();
  });

  it("displays placeholder", () => {
    const { getByPlaceholderText } = render(
      <TypewriterInput value="" onChange={vi.fn()} placeholder="Type here..." />,
    );
    expect(getByPlaceholderText("Type here...")).toBeTruthy();
  });

  it("shows value in the input", () => {
    const { container } = render(<TypewriterInput value="hello world" onChange={vi.fn()} />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("hello world");
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    const { container } = render(<TypewriterInput value="" onChange={onChange} />);
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "a" } });
    expect(onChange).toHaveBeenCalledWith("a");
  });
});
