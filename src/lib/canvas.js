// ---------- Canvas drawing primitives ----------
import { C } from "../theme.js";
import { ROOM_COLORS } from "./rooms.js";
import { formatPrice, formatRoomDimensions } from "./format.js";

export function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const tr = w / h;
  let sx, sy, sw, sh;
  if (ir > tr) {
    sh = img.height;
    sw = sh * tr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / tr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  let curY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      ctx.fillText(line, x, curY);
      line = words[i] + " ";
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, curY);
}

// One ad per detected room — photo, room label, and (if the user typed one in) dimensions.
export function drawRoomHighlight(ctx, W, H, p, img, room) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  const photoH = H * 0.64;
  drawCover(ctx, img, 0, 0, W, photoH);

  ctx.fillStyle = ROOM_COLORS[room.roomType] || C.brass;
  ctx.fillRect(0, photoH, W, 10);

  ctx.fillStyle = C.ink;
  ctx.font = "600 60px 'Playfair Display', serif";
  ctx.fillText(room.roomType || "Room", 56, photoH + 96);

  let nextY = photoH + 148;
  const roomDimensions = formatRoomDimensions(room);
  if (roomDimensions) {
    ctx.font = "400 36px 'Playfair Display', serif";
    ctx.fillStyle = C.inkSoft;
    ctx.fillText(roomDimensions, 56, nextY);
    nextY += 46;
  }

  if (room.bestListingDescription) {
    ctx.font = "400 28px Arial, sans-serif";
    ctx.fillStyle = C.inkSoft;
    wrapText(ctx, room.bestListingDescription, 56, nextY, W - 112, 34);
    nextY += 42;
  }

  ctx.font = "400 30px 'Playfair Display', serif";
  ctx.fillStyle = C.inkSoft;
  wrapText(ctx, p.address || "Address on request", 56, nextY, W - 112, 38);

  ctx.font = "600 34px 'Playfair Display', serif";
  ctx.fillStyle = C.brassDark;
  ctx.fillText(formatPrice(p.price), 56, H - 48);
}

export function drawFloorPlan(ctx, W, H, property, rooms) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.ink;
  ctx.font = "600 56px 'Playfair Display', serif";
  ctx.fillText(property.propertyType === "Apartment" ? "Apartment Floor Plan" : "House Floor Plan", 64, 82);
  ctx.fillStyle = C.inkSoft;
  ctx.font = "400 28px Arial, sans-serif";
  ctx.fillText(property.address || "Property layout", 64, 126);

  const area = { x: 64, y: 170, w: W - 128, h: H - 250 };
  const maxArea = Math.max(...rooms.map((room) => room.length * room.width), 1);
  const columns = rooms.length > 4 ? 3 : 2;
  const rows = Math.ceil(rooms.length / columns);
  const gap = 18;
  const cellW = (area.w - gap * (columns - 1)) / columns;
  const cellH = (area.h - gap * (rows - 1)) / rows;

  rooms.forEach((room, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = area.x + column * (cellW + gap);
    const y = area.y + row * (cellH + gap);
    const roomArea = room.length * room.width;
    const fill = roomArea / maxArea > 0.65 ? "#D9E2D2" : "#E9E0CE";
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, cellW, cellH);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, cellW, cellH);
    ctx.fillStyle = C.ink;
    ctx.font = "600 30px 'Playfair Display', serif";
    ctx.fillText(room.name, x + 22, y + 48);
    ctx.fillStyle = C.inkSoft;
    ctx.font = "400 24px Arial, sans-serif";
    ctx.fillText(`${room.length} × ${room.width} ft`, x + 22, y + 88);
    ctx.fillText(`${roomArea.toLocaleString()} sq ft`, x + 22, y + 122);
  });
}
