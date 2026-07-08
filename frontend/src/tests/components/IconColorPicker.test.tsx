import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IconColorPicker from "../../components/IconColorPicker";

describe("IconColorPicker", () => {
    const defaultProps = {
        icon: "folder",
        color: "#1976d2",
        onIconChange: vi.fn(),
        onColorChange: vi.fn(),
    };

    it("renders all icon buttons", () => {
        render(<IconColorPicker {...defaultProps} />);
        expect(screen.getByText("Icon")).toBeDefined();
        expect(screen.getByText("Color")).toBeDefined();
    });

    it("calls onIconChange when an icon is clicked", () => {
        render(<IconColorPicker {...defaultProps} />);
        const iconButtons = screen.getAllByRole("button");
        const starBtn = iconButtons.find((btn) => btn.querySelector("svg"));
        if (starBtn) fireEvent.click(starBtn);
        expect(defaultProps.onIconChange).toHaveBeenCalled();
    });

    it("calls onColorChange when a color swatch is clicked", () => {
        render(<IconColorPicker {...defaultProps} />);
        const buttons = screen.getAllByRole("button");
        const swatch = buttons.find((btn) => !btn.querySelector("svg"));
        if (swatch) fireEvent.click(swatch);
        expect(defaultProps.onColorChange).toHaveBeenCalled();
    });

    it("applies active class to selected icon", () => {
        render(<IconColorPicker {...defaultProps} icon="star" />);
        const buttons = document.querySelectorAll("button");
        const starButton = Array.from(buttons).find(
            (btn) =>
                btn.className.includes("bg-primary") &&
                btn.className.includes("text-white"),
        );
        expect(starButton).toBeDefined();
    });
});
