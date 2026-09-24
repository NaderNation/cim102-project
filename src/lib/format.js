// ---------- Formatters ----------

export function formatPrice(price) {
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  if (!n) return price || "$—";
  return "$" + n.toLocaleString();
}

export function validHexColor(value, fallback = "#B9CEC1") {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export function formatRoomDimensions(room) {
  const length = Number(room.length);
  const width = Number(room.width);
  const area = length > 0 && width > 0 ? length * width : 0;
  const measured = length > 0 && width > 0 ? `${length} × ${width} ft · ${area.toLocaleString()} sq ft` : "";
  return [measured, room.dimensions].filter(Boolean).join(" · ");
}

