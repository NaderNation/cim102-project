// ---------- Ad templates ----------
// Each template draws onto a canvas given (ctx, W, H, property, img)
import { C } from "../theme.js";
import { drawCover, roundRect, wrapText } from "./canvas.js";
import { formatPrice } from "./format.js";

export const TEMPLATES = [
  {
    id: "ig-post",
    name: "Instagram Post",
    w: 1080,
    h: 1080,
    draw: (ctx, W, H, p, img) => {
      drawCover(ctx, img, 0, 0, W, H);
      const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
      grad.addColorStop(0, "rgba(20,18,14,0)");
      grad.addColorStop(1, "rgba(20,18,14,0.88)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // eyebrow badge
      ctx.fillStyle = C.brass;
      roundRect(ctx, 56, 56, 220, 56, 28);
      ctx.fill();
      ctx.fillStyle = "#141410";
      ctx.font = "700 24px 'DM Sans', sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText("JUST LISTED", 78, 84);

      ctx.fillStyle = "#F3EFE6";
      ctx.font = "600 76px 'Playfair Display', serif";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(formatPrice(p.price), 56, H - 260);

      ctx.font = "400 34px 'Playfair Display', serif";
      wrapText(ctx, p.address || "Address on request", 56, H - 200, W - 112, 42);

      ctx.font = "600 30px Arial, sans-serif";
      ctx.fillStyle = "#E7DFCB";
      const stats = `${p.beds || "–"} bd  ·  ${p.baths || "–"} ba  ·  ${p.sqft ? Number(p.sqft).toLocaleString() : "–"} sqft`;
      ctx.fillText(stats, 56, H - 96);
    },
  },
  {
    id: "ig-story",
    name: "Story / Reel",
    w: 1080,
    h: 1920,
    draw: (ctx, W, H, p, img) => {
      drawCover(ctx, img, 0, 0, W, H);
      const grad = ctx.createLinearGradient(0, H * 0.55, 0, H);
      grad.addColorStop(0, "rgba(20,18,14,0)");
      grad.addColorStop(1, "rgba(20,18,14,0.92)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      const topGrad = ctx.createLinearGradient(0, 0, 0, 220);
      topGrad.addColorStop(0, "rgba(20,18,14,0.55)");
      topGrad.addColorStop(1, "rgba(20,18,14,0)");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 220);

      ctx.fillStyle = "#F3EFE6";
      ctx.font = "600 46px 'Playfair Display', serif";
      ctx.fillText("NEW ON THE MARKET", 64, 130);

      ctx.fillStyle = C.brass;
      ctx.font = "600 104px 'Playfair Display', serif";
      ctx.fillText(formatPrice(p.price), 64, H - 420);

      ctx.fillStyle = "#F3EFE6";
      ctx.font = "400 44px Georgia, serif";
      wrapText(ctx, p.address || "Address on request", 64, H - 340, W - 128, 54);

      ctx.font = "600 40px Arial, sans-serif";
      ctx.fillStyle = "#E7DFCB";
      const stats = `${p.beds || "–"} bd   ${p.baths || "–"} ba   ${p.sqft ? Number(p.sqft).toLocaleString() : "–"} sqft`;
      ctx.fillText(stats, 64, H - 160);

      ctx.strokeStyle = "#F3EFE6";
      ctx.lineWidth = 3;
      roundRect(ctx, 64, H - 100, W - 128, 2, 2);
      ctx.stroke();
      ctx.font = "500 30px Arial, sans-serif";
      ctx.fillStyle = "#C9BFA3";
      ctx.fillText("SWIPE UP FOR FULL TOUR", 64, H - 56);
    },
  },
  {
    id: "flyer",
    name: "Print Flyer",
    w: 1080,
    h: 1350,
    draw: (ctx, W, H, p, img) => {
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, W, H);
      const photoH = H * 0.58;
      drawCover(ctx, img, 0, 0, W, photoH);

      ctx.fillStyle = C.brass;
      ctx.fillRect(0, photoH, W, 10);

      ctx.fillStyle = C.ink;
      ctx.font = "600 58px 'Playfair Display', serif";
      ctx.fillText(formatPrice(p.price), 56, photoH + 100);

      ctx.font = "400 34px 'Playfair Display', serif";
      ctx.fillStyle = C.inkSoft;
      wrapText(ctx, p.address || "Address on request", 56, photoH + 150, W - 112, 42);

      // stat blocks
      const stats = [
        ["BEDS", p.beds || "–"],
        ["BATHS", p.baths || "–"],
        ["SQ FT", p.sqft ? Number(p.sqft).toLocaleString() : "–"],
      ];
      const blockW = (W - 112) / 3;
      stats.forEach((s, i) => {
        const bx = 56 + i * blockW;
        const by = photoH + 220;
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, blockW - 24, 140);
        ctx.fillStyle = C.brassDark;
        ctx.font = "600 54px 'Playfair Display', serif";
        ctx.fillText(String(s[1]), bx + 24, by + 78);
        ctx.fillStyle = C.inkSoft;
        ctx.font = "600 22px Arial, sans-serif";
        ctx.fillText(s[0], bx + 24, by + 116);
      });

      ctx.fillStyle = C.ink;
      ctx.font = "700 30px Georgia, serif";
      ctx.fillText("Contact your agent to schedule a private showing", 56, H - 48);
    },
  },
  {
    id: "square-badge",
    name: "Just Sold / Badge",
    w: 1080,
    h: 1080,
    draw: (ctx, W, H, p, img) => {
      ctx.fillStyle = C.forest;
      ctx.fillRect(0, 0, W, H);
      const pad = 60;
      const photoSize = W - pad * 2;
      const photoH = photoSize * 0.62;
      drawCover(ctx, img, pad, pad, photoSize, photoH);

      ctx.fillStyle = "#F3EFE6";
      ctx.font = "600 40px 'Playfair Display', serif";
      ctx.fillText("JUST LISTED", pad, pad + photoH + 66);

      ctx.font = "600 68px 'Playfair Display', serif";
      ctx.fillStyle = C.brass;
      ctx.fillText(formatPrice(p.price), pad, pad + photoH + 140);

      ctx.font = "400 32px 'Playfair Display', serif";
      ctx.fillStyle = "#E7DFCB";
      wrapText(ctx, p.address || "Address on request", pad, pad + photoH + 190, photoSize, 40);

      ctx.font = "600 30px Arial, sans-serif";
      ctx.fillStyle = "#CBD6C4";
      const stats = `${p.beds || "–"} bd  ·  ${p.baths || "–"} ba  ·  ${p.sqft ? Number(p.sqft).toLocaleString() : "–"} sqft`;
      ctx.fillText(stats, pad, H - pad + 6);
    },
  },
];
