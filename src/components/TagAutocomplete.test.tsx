import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagAutocomplete } from "./TagAutocomplete";
import type { SongTag } from "@/types/songTags";

const mockItems = [
  {
    label: "Куплет",
    tag: {
      id: "verse",
      label: "Куплет",
      color: "#4fc3f7",
      colorDark: "#4fc3f7",
      aliases: ["куплет"],
    } as SongTag,
  },
  {
    label: "Припев",
    tag: {
      id: "chorus",
      label: "Припев",
      color: "#81c784",
      colorDark: "#81c784",
      aliases: ["припев"],
    } as SongTag,
  },
];

describe("TagAutocomplete", () => {
  it("renders items", () => {
    const { container } = render(
      <TagAutocomplete
        items={mockItems}
        activeIndex={0}
        position={{ top: 100, left: 100 }}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />,
    );

    expect(container.querySelector(".tag-ac-label")!.textContent).toBe("Куплет");
    expect(container.querySelectorAll(".tag-autocomplete-item")).toHaveLength(2);
  });

  it("highlights active item", () => {
    const { container } = render(
      <TagAutocomplete
        items={mockItems}
        activeIndex={1}
        position={{ top: 100, left: 100 }}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />,
    );

    const activeItem = container.querySelector(".tag-autocomplete-item.active");
    expect(activeItem).toBeTruthy();
    expect(activeItem!.querySelector(".tag-ac-label")!.textContent).toBe("Припев");
  });

  it("calls onSelect on mousedown", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    const { container } = render(
      <TagAutocomplete
        items={mockItems}
        activeIndex={0}
        position={{ top: 100, left: 100 }}
        onSelect={onSelect}
        onHover={vi.fn()}
      />,
    );

    const items = container.querySelectorAll(".tag-autocomplete-item");
    await user.click(items[0]);
    expect(onSelect).toHaveBeenCalledWith(mockItems[0].tag);
  });
});
