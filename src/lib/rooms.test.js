import { describe, it, expect } from "vitest";
import { ROOM_TYPES, ROOM_COLORS, normalizeRoomSpecs } from "./rooms.js";

describe("ROOM_TYPES", () => {
  it("has a colour defined for every room type", () => {
    for (const type of ROOM_TYPES) {
      expect(ROOM_COLORS[type], `missing colour for ${type}`).toBeDefined();
    }
  });

  it("lists twelve types ending in Other", () => {
    expect(ROOM_TYPES).toHaveLength(12);
    expect(ROOM_TYPES.at(-1)).toBe("Other");
  });
});

describe("normalizeRoomSpecs", () => {
  it("returns an empty array for a non-array input", () => {
    expect(normalizeRoomSpecs(null)).toEqual([]);
    expect(normalizeRoomSpecs("nope")).toEqual([]);
  });

  it("reads rooms from a { rooms: [...] } wrapper", () => {
    const result = normalizeRoomSpecs({ rooms: [{ name: "Kitchen", length: 12, width: 10 }] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Kitchen");
  });

  it("accepts a bare array", () => {
    const result = normalizeRoomSpecs([{ name: "Den", length: 9, width: 8 }]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Den");
  });

  it("drops rooms without positive length and width", () => {
    const result = normalizeRoomSpecs([
      { name: "Good", length: 10, width: 10 },
      { name: "NoWidth", length: 10 },
      { name: "Zero", length: 0, width: 0 },
    ]);
    expect(result.map((r) => r.name)).toEqual(["Good"]);
  });

  it("accepts roomType and depth as aliases", () => {
    const result = normalizeRoomSpecs([{ roomType: "Office", depth: 11, width: 9 }]);
    expect(result[0].name).toBe("Office");
    expect(result[0].length).toBe(11);
  });

  it("defaults ceiling height to 9 feet", () => {
    const result = normalizeRoomSpecs([{ name: "Den", length: 9, width: 8 }]);
    expect(result[0].ceilingHeight).toBe(9);
  });
});
