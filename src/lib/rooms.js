// ---------- Room classification ----------
// Real AI vision classification via the Anthropic API (no key needed in this environment).
// Dimensions are NOT estimated from the photo — a 2D image has no reliable scale reference,
// so square footage / room dimensions are always left to the user to type in.
import { C } from "../theme.js";
import { resizeForApi } from "./photo.js";
import { validHexColor } from "./format.js";

export const ROOM_TYPES = [
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Bathroom",
  "Dining Room",
  "Office",
  "Laundry Room",
  "Hallway",
  "Garage",
  "Balcony / Patio",
  "Exterior",
  "Other",
];

export const ROOM_COLORS = {
  Bedroom: "#6E5A8C",
  "Living Room": "#3C6E8C",
  Kitchen: "#B5622E",
  Bathroom: "#3E8C7E",
  "Dining Room": "#8C6E2E",
  Office: "#566B8C",
  "Laundry Room": "#6B7F72",
  Hallway: "#8C765B",
  Garage: "#60656B",
  "Balcony / Patio": "#66834D",
  Exterior: C.forest,
  Other: C.inkSoft,
};

export async function classifyRoomWithAI(img) {
  const base64 = resizeForApi(img);
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
            {
              type: "text",
              text: `Analyze this real-estate photo as a property listing specialist. Reply with ONLY one valid JSON object, no markdown fences and no other text, in exactly this shape: {"roomType":"<one of ${JSON.stringify(
                ROOM_TYPES
              )}>","confidence":<number 0 to 1>,"features":["<up to 5 clearly visible features>"],"condition":"<one of excellent, good, fair, needs attention, unclear>","bestListingDescription":"<one concise factual sentence, or empty string>","design":{"style":"<one of modern, traditional, coastal, industrial, farmhouse, luxury, minimal, eclectic, unclear>","wallColor":"<#RRGGBB or empty>","floorColor":"<#RRGGBB or empty>","lighting":"<one of warm, cool, natural, mixed, unclear>","camera":{"fov":<number 40 to 80>,"elevation":"<one of low, eye-level, high>"}}}. Identify the primary area shown, not the furniture. Use "Exterior" for yard, facade, driveway, or building exterior; use "Balcony / Patio" for an outdoor private living area. Use "Other" when the area is unclear. Only report features and colors that are visibly present. Do not guess dimensions, materials, room counts, price, or condition beyond what is visible. Keep features factual and do not mention people or personal belongings.`,
            },
          ],
        },
      ],
    }),
  });
  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  const raw = (textBlock?.text || "").replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(raw);
  const roomType = ROOM_TYPES.includes(parsed.roomType) ? parsed.roomType : "Other";
  const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;
  const allowedConditions = ["excellent", "good", "fair", "needs attention", "unclear"];
  const features = Array.isArray(parsed.features)
    ? parsed.features.filter((feature) => typeof feature === "string").map((feature) => feature.trim()).filter(Boolean).slice(0, 5)
    : [];
  const condition = allowedConditions.includes(parsed.condition) ? parsed.condition : "unclear";
  const bestListingDescription = typeof parsed.bestListingDescription === "string" ? parsed.bestListingDescription.trim().slice(0, 180) : "";
  const design = parsed.design || {};
  const styles = ["modern", "traditional", "coastal", "industrial", "farmhouse", "luxury", "minimal", "eclectic", "unclear"];
  const lighting = ["warm", "cool", "natural", "mixed", "unclear"];
  return {
    roomType,
    confidence: Math.max(0, Math.min(confidence, 1)),
    features,
    condition,
    bestListingDescription,
    design: {
      style: styles.includes(design.style) ? design.style : "unclear",
      wallColor: validHexColor(design.wallColor, "#E8E4DC"),
      floorColor: validHexColor(design.floorColor, "#B9A78C"),
      lighting: lighting.includes(design.lighting) ? design.lighting : "unclear",
      camera: { fov: Math.max(40, Math.min(Number(design.camera?.fov) || 55, 80)), elevation: design.camera?.elevation || "eye-level" },
    },
  };
}

export function normalizeRoomSpecs(value) {
  const source = Array.isArray(value) ? value : value?.rooms;
  if (!Array.isArray(source)) return [];
  return source
    .map((room) => ({
      name: String(room.name || room.roomType || room.type || "Room").trim(),
      length: Number(room.length || room.depth || 0),
      width: Number(room.width || 0),
      x: room.x !== undefined ? Number(room.x) : undefined,
      z: room.z !== undefined ? Number(room.z) : undefined,
      wallColor: room.wallColor || room.colors?.walls,
      floorColor: room.floorColor || room.colors?.floor,
      style: room.style || room.designStyle || "",
      ceilingHeight: Number(room.ceilingHeight || 9),
    }))
    .filter((room) => room.name && room.length > 0 && room.width > 0);
}
