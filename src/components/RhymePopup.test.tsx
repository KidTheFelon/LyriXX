import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RhymePopup } from "./RhymePopup";
import type { RhymeWord } from "@/hooks/useRhymes";

const mockRhymes: RhymeWord[] = [
  { word: "дом", score: 5, syllables: "1" },
  { word: "сон", score: 15, syllables: "1" },
];

describe("RhymePopup", () => {
  it("shows loading state", () => {
    const { container } = render(
      <RhymePopup
        rhymes={[]}
        loading={true}
        error={null}
        activeIndex={0}
        position={{ top: 100, left: 100 }}
        onSelect={vi.fn()}
        onInsert={vi.fn()}
        onHover={vi.fn()}
      />,
    );

    expect(container.querySelector(".rhyme-popup__loading")!.textContent).toBe("Поиск...");
  });

  it("shows error state", () => {
    const { container } = render(
      <RhymePopup
        rhymes={[]}
        loading={false}
        error="Ошибка сети"
        activeIndex={0}
        position={{ top: 100, left: 100 }}
        onSelect={vi.fn()}
        onInsert={vi.fn()}
        onHover={vi.fn()}
      />,
    );

    expect(container.querySelector(".rhyme-popup__empty")!.textContent).toBe("Ошибка сети");
  });

  it("shows empty state", () => {
    const { container } = render(
      <RhymePopup
        rhymes={[]}
        loading={false}
        error={null}
        activeIndex={0}
        position={{ top: 100, left: 100 }}
        onSelect={vi.fn()}
        onInsert={vi.fn()}
        onHover={vi.fn()}
      />,
    );

    expect(container.querySelector(".rhyme-popup__empty")!.textContent).toBe("Нет рифм");
  });

  it("renders rhyme items", () => {
    const { container } = render(
      <RhymePopup
        rhymes={mockRhymes}
        loading={false}
        error={null}
        activeIndex={0}
        position={{ top: 100, left: 100 }}
        onSelect={vi.fn()}
        onInsert={vi.fn()}
        onHover={vi.fn()}
      />,
    );

    const items = container.querySelectorAll(".rhyme-popup__item");
    expect(items).toHaveLength(2);
    expect(items[0].querySelector(".rhyme-popup__word")!.textContent).toBe("дом");
    expect(items[1].querySelector(".rhyme-popup__word")!.textContent).toBe("сон");
  });

  it("highlights active item", () => {
    const { container } = render(
      <RhymePopup
        rhymes={mockRhymes}
        loading={false}
        error={null}
        activeIndex={1}
        position={{ top: 100, left: 100 }}
        onSelect={vi.fn()}
        onInsert={vi.fn()}
        onHover={vi.fn()}
      />,
    );

    const activeItem = container.querySelector(".rhyme-popup__item--active");
    expect(activeItem).toBeTruthy();
    expect(activeItem!.querySelector(".rhyme-popup__word")!.textContent).toBe("сон");
  });

  it("calls onSelect on mousedown", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    const { container } = render(
      <RhymePopup
        rhymes={mockRhymes}
        loading={false}
        error={null}
        activeIndex={0}
        position={{ top: 100, left: 100 }}
        onSelect={onSelect}
        onInsert={vi.fn()}
        onHover={vi.fn()}
      />,
    );

    const items = container.querySelectorAll(".rhyme-popup__item");
    await user.click(items[0]);
    expect(onSelect).toHaveBeenCalledWith(mockRhymes[0]);
  });

  it("calls onInsert when insert button is clicked", async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();

    const { container } = render(
      <RhymePopup
        rhymes={mockRhymes}
        loading={false}
        error={null}
        activeIndex={0}
        position={{ top: 100, left: 100 }}
        onSelect={vi.fn()}
        onInsert={onInsert}
        onHover={vi.fn()}
      />,
    );

    const insertBtn = container.querySelector(".rhyme-popup__insert-btn")!;
    await user.click(insertBtn);
    expect(onInsert).toHaveBeenCalledWith(mockRhymes[0]);
  });

  it("renders insert button on each item", () => {
    const { container } = render(
      <RhymePopup
        rhymes={mockRhymes}
        loading={false}
        error={null}
        activeIndex={0}
        position={{ top: 100, left: 100 }}
        onSelect={vi.fn()}
        onInsert={vi.fn()}
        onHover={vi.fn()}
      />,
    );

    const insertBtns = container.querySelectorAll(".rhyme-popup__insert-btn");
    expect(insertBtns).toHaveLength(2);
  });
});
