import { describe, it, expect } from "vitest";
import { buildTourRooms, layoutTourRooms } from "./tour.js";

describe("buildTourRooms", () => {
  it("falls back to generic spaces when photos carry no measurements", () => {
    const rooms = buildTourRooms({ roomSpecs: [] }, [{ id: "a" }, { id: "b" }]);
    expect(rooms).toHaveLength(2);
    expect(rooms[0].name).toBe("Space 1");
    expect(rooms[0].length).toBe(12);
    expect(rooms[0].width).toBe(10);
  });

  it("uses measured rooms when photos carry them", () => {
    const rooms = buildTourRooms({ roomSpecs: [] }, [
      { id: "a", roomType: "Kitchen", length: 14, width: 11 },
    ]);
    expect(rooms[0].name).toBe("Kitchen");
    expect(rooms[0].length).toBe(14);
  });

  it("prefers imported room specs over photo measurements", () => {
    const rooms = buildTourRooms(
      { roomSpecs: [{ name: "Parlour", length: 20, width: 15 }] },
      [{ id: "a", roomType: "Kitchen", length: 14, width: 11 }],
    );
    expect(rooms.map((r) => r.name)).toEqual(["Parlour"]);
  });
});

describe("layoutTourRooms", () => {
  it("returns a { rooms, width, depth } layout, not a bare array", () => {
    const layout = layoutTourRooms([{ name: "Kitchen", length: 12, width: 10 }]);
    expect(Array.isArray(layout)).toBe(false);
    expect(layout).toHaveProperty("rooms");
    expect(layout).toHaveProperty("width");
    expect(layout).toHaveProperty("depth");
  });

  it("lays out one entry per input room", () => {
    const layout = layoutTourRooms([
      { name: "Kitchen", length: 12, width: 10 },
      { name: "Bedroom", length: 11, width: 10 },
    ]);
    expect(layout.rooms).toHaveLength(2);
  });

  it("gives every laid-out room x and z coordinates", () => {
    const layout = layoutTourRooms([{ name: "Kitchen", length: 12, width: 10 }]);
    expect(typeof layout.rooms[0].x).toBe("number");
    expect(typeof layout.rooms[0].z).toBe("number");
  });

  it("survives an empty room list without throwing", () => {
    const layout = layoutTourRooms([]);
    expect(layout.rooms).toEqual([]);
  });
});
