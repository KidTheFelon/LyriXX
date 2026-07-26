import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ToggleSetting, ButtonGroupSetting, SliderSetting, ConfirmAction } from "./shared";

vi.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (k: string) => k, lang: "ru" }),
  getTranslation: (l: string, k: string) => k,
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue({ system: ["Arial", "Segoe UI"], custom: [] }),
}));

describe("ToggleSetting", () => {
  it("renders label and toggle", () => {
    const { getByText, getByRole } = render(
      <ToggleSetting
        label="spellCheck"
        checked={true}
        onChange={vi.fn()}
        onLabel="on"
        offLabel="off"
      />,
    );
    expect(getByText("spellCheck")).toBeTruthy();
    expect(getByRole("checkbox")).toBeTruthy();
  });

  it("click changes checkbox and calls onChange", () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <ToggleSetting
        label="spellCheck"
        checked={false}
        onChange={onChange}
        onLabel="on"
        offLabel="off"
      />,
    );
    fireEvent.click(getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("ButtonGroupSetting", () => {
  it("renders all options", () => {
    const { getByText } = render(
      <ButtonGroupSetting
        label="tabSize"
        value={4}
        options={[
          { value: 2, label: "2" },
          { value: 4, label: "4" },
        ]}
        onChange={vi.fn()}
      />,
    );
    expect(getByText("tabSize")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("4")).toBeTruthy();
  });

  it("clicking option calls onChange with option value", () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <ButtonGroupSetting
        label="tabSize"
        value={4}
        options={[
          { value: 2, label: "2" },
          { value: 4, label: "4" },
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByText("2"));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

describe("SliderSetting", () => {
  it("renders a range input with correct value", () => {
    const { getByRole } = render(
      <SliderSetting label="fontSize" value={13} min={11} max={24} step={1} onChange={vi.fn()} />,
    );
    const slider = getByRole("slider") as HTMLInputElement;
    expect(slider).toBeTruthy();
    expect(slider.value).toBe("13");
  });

  it("changing value calls onChange", () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <SliderSetting label="fontSize" value={13} min={11} max={24} step={1} onChange={onChange} />,
    );
    fireEvent.change(getByRole("slider"), { target: { value: "15" } });
    expect(onChange).toHaveBeenCalledWith(15);
  });
});

describe("ConfirmAction", () => {
  it("shows button initially", () => {
    const { getByText } = render(
      <ConfirmAction
        label="Clear DB"
        confirmMsg="Are you sure?"
        confirmYes="Yes"
        confirmNo="No"
        onConfirm={vi.fn()}
      />,
    );
    expect(getByText("Clear DB")).toBeTruthy();
  });

  it("click shows confirmation row", () => {
    const { getByText } = render(
      <ConfirmAction
        label="Clear DB"
        confirmMsg="Are you sure?"
        confirmYes="Yes"
        confirmNo="No"
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(getByText("Clear DB"));
    expect(getByText("Are you sure?")).toBeTruthy();
    expect(getByText("Yes")).toBeTruthy();
    expect(getByText("No")).toBeTruthy();
  });

  it("confirm calls onConfirm", () => {
    const onConfirm = vi.fn();
    const { getByText } = render(
      <ConfirmAction
        label="Clear DB"
        confirmMsg="Are you sure?"
        confirmYes="Yes"
        confirmNo="No"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(getByText("Clear DB"));
    fireEvent.click(getByText("Yes"));
    expect(onConfirm).toHaveBeenCalled();
  });
});
