import { describe, it, expect } from "vitest";
import { dataUrlToBlob } from "./photo.js";

describe("dataUrlToBlob", () => {
  it("decodes base64 payload into a Blob of the right size", () => {
    // "hello" base64-encoded is "aGVsbG8="
    const blob = dataUrlToBlob("data:text/plain;base64,aGVsbG8=");
    expect(blob.size).toBe(5);
  });

  it("reads the MIME type from the data URL", () => {
    const blob = dataUrlToBlob("data:image/png;base64,aGVsbG8=");
    expect(blob.type).toBe("image/png");
  });

  it("falls back to image/jpeg when the MIME type is absent", () => {
    const blob = dataUrlToBlob("data:;base64,aGVsbG8=");
    expect(blob.type).toBe("image/jpeg");
  });
});
