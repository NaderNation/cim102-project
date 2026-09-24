import { describe, it, expect } from "vitest";
import { TEMPLATES } from "./ads.js";

describe("TEMPLATES", () => {
  it("defines four ad templates", () => {
    expect(TEMPLATES).toHaveLength(4);
  });

  it("gives every template a name, dimensions, and a draw function", () => {
    for (const template of TEMPLATES) {
      expect(template.name, "template needs a name").toBeTruthy();
      expect(template.w, `${template.name} needs a width`).toBeGreaterThan(0);
      expect(template.h, `${template.name} needs a height`).toBeGreaterThan(0);
      expect(typeof template.draw, `${template.name}.draw must be a function`).toBe("function");
    }
  });

  it("keeps the expected template names", () => {
    expect(TEMPLATES.map((t) => t.name)).toEqual([
      "Instagram Post", "Story / Reel", "Print Flyer", "Just Sold / Badge",
    ]);
  });
});
