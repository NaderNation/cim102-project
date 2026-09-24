import React from "react";
import { Plus, Download } from "../icons.jsx";
import { C } from "../theme.js";
import VirtualTour from "./VirtualTour.jsx";
import ThreeDPropertyTour from "../components/ThreeDPropertyTour.jsx";
import MarbleWorldTour from "../components/MarbleWorldTour.jsx";

export default function Results({ ads, photos, draft, onDownload, onDownloadAll, onNew }) {
  return (
    <div>
      <div style={{ color: C.brassDark, fontFamily: "Arial, sans-serif" }} className="text-xs font-bold tracking-widest mb-2">
        STEP 3 OF 3 — DONE
      </div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <h1 style={{ color: C.ink }} className="text-3xl font-bold">
          {draft.address || "Your"} ad set
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => onDownloadAll("jpg")}
            style={{ background: C.ink, color: C.paper, fontFamily: "Arial, sans-serif" }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-semibold hover:opacity-90 transition"
          >
            <Download size={16} /> JPG all
          </button>
          <button
            onClick={() => onDownloadAll("pdf")}
            style={{ background: C.brass, color: "#FFFFFF", fontFamily: "Arial, sans-serif" }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-semibold hover:opacity-90 transition"
          >
            <Download size={16} /> PDF all
          </button>
          <button
            onClick={onNew}
            style={{ background: C.brass, color: "#FFFFFF", fontFamily: "Arial, sans-serif" }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-semibold hover:opacity-90 transition"
          >
            <Plus size={16} /> New property
          </button>
        </div>
      </div>

      <VirtualTour photos={photos} draft={draft} />
      <ThreeDPropertyTour photos={photos} draft={draft} />
      <MarbleWorldTour photos={photos} draft={draft} />

      <div className="grid sm:grid-cols-2 gap-6">
        {ads.map((ad) => (
          <div key={ad.id} style={{ borderColor: C.line, background: C.paperDim }} className="border rounded-sm overflow-hidden">
            <div style={{ background: "#141410" }} className="flex items-center justify-center p-3">
              <img src={ad.dataUrl} alt={ad.name} className="max-h-72 object-contain" />
            </div>
            <div className="p-3 flex items-center justify-between" style={{ fontFamily: "Arial, sans-serif" }}>
              <div>
                <div style={{ color: C.ink }} className="text-sm font-bold">{ad.name}</div>
                <div style={{ color: C.inkSoft }} className="text-xs">{ad.w}×{ad.h}</div>
              </div>
              <div className="flex gap-1.5">
                {[
                  ["png", "PNG"],
                  ["jpg", "JPG"],
                  ["pdf", "PDF"],
                ].map(([format, label]) => (
                  <button
                    key={format}
                    onClick={() => onDownload(ad, format)}
                    aria-label={`Download ${ad.name} as ${label}`}
                    style={{ borderColor: C.brass, color: C.brassDark }}
                    className="border rounded-sm px-2 py-1.5 text-xs font-bold flex items-center gap-1 hover:opacity-80"
                  >
                    <Download size={12} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
