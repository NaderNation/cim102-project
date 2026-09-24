// ---------- Ad set generation ----------
// Pure given (draft, photos): builds every canvas asset and returns them.
// State wiring (busy flags, view changes, saved properties) stays in App.
import { TEMPLATES } from "./ads.js";
import { drawRoomHighlight, drawFloorPlan } from "./canvas.js";
import { normalizeRoomSpecs } from "./rooms.js";

export function buildAds(draft, photos) {
    const best = [...photos].sort((a, b) => b.score - a.score);
    const results = photos.length
      ? TEMPLATES.map((tpl, i) => {
          const photo = best[i % best.length];
          const canvas = document.createElement("canvas");
          canvas.width = tpl.w;
          canvas.height = tpl.h;
          const ctx = canvas.getContext("2d");
          tpl.draw(ctx, tpl.w, tpl.h, draft, photo.img);
          return {
            id: tpl.id,
            name: tpl.name,
            dataUrl: canvas.toDataURL("image/png"),
            w: tpl.w,
            h: tpl.h,
          };
        })
      : [];

    // One highlight ad per distinct room detected — uses the best-scoring photo in that room.
    const roomGroups = {};
    photos.forEach((ph) => {
      if (!ph.roomType || ph.roomType === "Other") return;
      if (!roomGroups[ph.roomType] || ph.score > roomGroups[ph.roomType].score) {
        roomGroups[ph.roomType] = ph;
      }
    });
    const roomAds = Object.entries(roomGroups)
      .slice(0, 6)
      .map(([roomType, photo]) => {
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext("2d");
        drawRoomHighlight(ctx, 1080, 1350, draft, photo.img, {
          roomType,
          dimensions: photo.dimensions,
          length: photo.length,
          width: photo.width,
          features: photo.features,
          bestListingDescription: photo.bestListingDescription,
        });
        return {
          id: `room-${roomType}`,
          name: `${roomType} Highlight`,
          dataUrl: canvas.toDataURL("image/png"),
          w: 1080,
          h: 1350,
        };
      });

    const importedRooms = normalizeRoomSpecs(draft.roomSpecs);
    const measuredRooms = Object.values(roomGroups)
      .map((photo) => ({ name: photo.roomType, length: Number(photo.length), width: Number(photo.width) }))
      .filter((room) => room.length > 0 && room.width > 0);
    const modelRooms = importedRooms.length ? importedRooms : measuredRooms;
    const modelAd = modelRooms.length
      ? (() => {
          const canvas = document.createElement("canvas");
          canvas.width = 1600;
          canvas.height = 1000;
          drawFloorPlan(canvas.getContext("2d"), 1600, 1000, draft, modelRooms);
          return { id: "floor-plan", name: `${draft.propertyType} Floor Plan`, dataUrl: canvas.toDataURL("image/png"), w: 1600, h: 1000 };
        })()
      : null;
  const allAds = [...results, ...roomAds, ...(modelAd ? [modelAd] : [])];
  return { ads: allAds, best };
}
