import React from "react";
import { Home, Plus, Globe2 } from "../icons.jsx";
import { C, SANS, SERIF } from "../theme.js";
import { formatPrice } from "../lib/format.js";
import AnimatedPropertyAdvisor from "../components/AnimatedPropertyAdvisor.jsx";

export default function Dashboard({ properties, onCreate, onSampleTour }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <AnimatedPropertyAdvisor />
      </div>
      <button
        onClick={onSampleTour}
        style={{ borderColor: C.line, background: C.card, fontFamily: SANS, textAlign: "left", width: "100%" }}
        className="border rounded-sm p-5 mb-8 flex items-center gap-4 cursor-pointer hover:opacity-90 transition"
      >
        <span style={{ background: C.paperDim, borderRadius: 12, padding: 12, display: "flex" }}>
          <Globe2 size={22} style={{ color: C.forest }} />
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ color: C.ink, fontWeight: 700, fontSize: 16, display: "block" }}>
            Walk through a sample property
          </span>
          <span style={{ color: C.inkSoft, fontSize: 14, display: "block", marginTop: 2 }}>
            A finished Marble 3D tour, ready now — no API key or waiting
          </span>
        </span>
        <span style={{ color: C.brassDark, fontWeight: 700, fontSize: 14 }}>Open →</span>
      </button>

      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div style={{ color: C.brassDark, fontFamily: "Arial, sans-serif" }} className="text-xs font-bold tracking-widest mb-2">
            PROPERTIES
          </div>
          <h1 style={{ color: C.ink, fontFamily: SERIF }} className="text-4xl font-bold">
            Your listings
          </h1>
        </div>
        <button
          onClick={onCreate}
          style={{ background: C.ink, color: C.paper, fontFamily: "Arial, sans-serif" }}
          className="flex items-center gap-2 px-5 py-3 rounded-sm text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={18} /> Create Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div
          style={{ borderColor: C.line, background: C.paperDim }}
          className="border rounded-sm p-16 text-center"
        >
          <Home size={36} color={C.brassDark} className="mx-auto mb-4" />
          <div style={{ color: C.ink }} className="text-xl font-bold mb-2">
            No properties yet
          </div>
          <div style={{ color: C.inkSoft, fontFamily: "Arial, sans-serif" }} className="text-sm mb-6 max-w-sm mx-auto">
            Add your first listing's details and photos — a full ad set generates in seconds.
          </div>
          <button
            onClick={onCreate}
            style={{ background: C.brassDark, color: "#FFFFFF", fontFamily: SANS, display: "block", margin: "0 auto", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            className="hover:opacity-90 transition"
          >
            Create your first property
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {properties.map((p) => (
            <div key={p.id} style={{ borderColor: C.line, background: C.paperDim }} className="border rounded-sm overflow-hidden">
              {p.coverDataUrl && <img src={p.coverDataUrl} alt="" className="w-full h-40 object-cover" />}
              <div className="p-4" style={{ fontFamily: "Arial, sans-serif" }}>
                <div style={{ color: C.ink, fontFamily: "Georgia, serif" }} className="font-bold text-lg">
                  {formatPrice(p.price)}
                </div>
                <div style={{ color: C.inkSoft }} className="text-sm mb-2">{p.address || "No address"}</div>
                <div style={{ color: C.brassDark }} className="text-xs font-semibold">
                  {p.adCount} ads generated · {p.photoCount} photos
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
