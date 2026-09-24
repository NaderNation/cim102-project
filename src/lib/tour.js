// ---------- Tour geometry ----------
import { normalizeRoomSpecs } from "./rooms.js";

export function buildTourRooms(draft, photos) {
  const imported = normalizeRoomSpecs(draft.roomSpecs);
  if (imported.length) {
    return imported.map((room) => ({
      ...room,
      photo: photos.find((photo) => photo.roomType === room.name || photo.roomType?.toLowerCase() === room.name.toLowerCase()),
      design: room.design || photos.find((photo) => photo.roomType === room.name)?.design,
    }));
  }
  const measured = photos
    .filter((photo) => photo.roomType && photo.roomType !== "Other")
    .map((photo) => ({ name: photo.roomType, length: Number(photo.length) || 12, width: Number(photo.width) || 10, photo, design: photo.design }));
  return measured.length ? measured : photos.map((photo, index) => ({ name: `Space ${index + 1}`, length: 12, width: 10 }));
}

export function layoutTourRooms(rooms) {
  const scale = 0.55;
  const gap = 0.45;
  const maxRowWidth = Math.max(24, Math.min(42, Math.sqrt(rooms.reduce((sum, room) => sum + room.length * room.width, 0)) * scale * 1.65));
  let cursorX = 0;
  let cursorZ = 0;
  let rowDepth = 0;
  const laidOut = rooms.map((room) => {
    const width = Math.max(3.2, Number(room.width) * scale);
    const depth = Math.max(3.2, Number(room.length) * scale);
    if (room.x !== undefined && room.z !== undefined) {
      return { ...room, x: Number(room.x) * scale, z: Number(room.z) * scale, width, depth };
    }
    if (cursorX > 0 && cursorX + width > maxRowWidth) {
      cursorX = 0;
      cursorZ += rowDepth + gap;
      rowDepth = 0;
    }
    const positioned = { ...room, x: cursorX + width / 2, z: cursorZ + depth / 2, width, depth };
    cursorX += width + gap;
    rowDepth = Math.max(rowDepth, depth);
    return positioned;
  });
  const minX = Math.min(...laidOut.map((room) => room.x - room.width / 2), 0);
  const minZ = Math.min(...laidOut.map((room) => room.z - room.depth / 2), 0);
  const maxX = Math.max(...laidOut.map((room) => room.x + room.width / 2), 1);
  const maxZ = Math.max(...laidOut.map((room) => room.z + room.depth / 2), 1);
  return {
    rooms: laidOut.map((room) => ({ ...room, x: room.x - (minX + maxX) / 2, z: room.z - (minZ + maxZ) / 2 })),
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}
