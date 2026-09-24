import React from "react";
import { Home, Plus, Globe2, Upload, Sparkles } from "../icons.jsx";
import { C, SANS, SERIF } from "../theme.js";
import { formatPrice } from "../lib/format.js";
import AnimatedPropertyAdvisor from "../components/AnimatedPropertyAdvisor.jsx";

export default function Dashboard({ properties, onCreate, onSampleTour }) {
  const photoCount = properties.reduce((sum, property) => sum + (Number(property.photoCount) || 0), 0);
  const adCount = properties.reduce((sum, property) => sum + (Number(property.adCount) || 0), 0);
  const stats = [
    { label: "Saved listings", value: properties.length, detail: "Properties in this browser", icon: Home },
    { label: "Photos analyzed", value: photoCount, detail: "Across your saved listings", icon: Upload },
    { label: "Ads created", value: adCount, detail: "Ready to download", icon: Sparkles },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <AnimatedPropertyAdvisor />
      </div>

      <section className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div style={{ color: C.brass, fontFamily: SANS }} className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.18em]">
            <span aria-hidden="true" style={{ width: 22, height: 2, background: C.brass, display: "inline-block" }} />
            ESTATEFLOW WORKSPACE
          </div>
          <h1 style={{ color: C.ink, fontFamily: SERIF }} className="m-0 text-4xl font-semibold tracking-tight sm:text-5xl">
            Your listings, at a glance
          </h1>
          <p style={{ color: C.inkSoft, fontFamily: SANS }} className="mb-0 mt-3 max-w-2xl text-sm leading-6 sm:text-base">
            Organize your properties, review the photos you have analyzed, and pick up where you left off.
          </p>
        </div>
        <button
          onClick={onCreate}
          style={{ background: C.brass, color: "#FFFFFF", fontFamily: SANS }}
          className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold hover:opacity-90"
        >
          <Plus size={18} /> Create Property
        </button>
      </section>

      <section aria-label="Workspace summary" className="mb-8 grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} style={{ borderColor: C.line, background: C.paperDim }} className="flex min-w-0 items-center gap-4 rounded-xl border p-5 sm:p-6">
            <span style={{ background: "rgba(112,59,247,.16)", color: C.brass }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
              <Icon size={21} />
            </span>
            <div className="min-w-0">
              <div style={{ color: C.inkSoft, fontFamily: SANS }} className="text-xs font-semibold">{label}</div>
              <div style={{ color: C.ink, fontFamily: SANS }} className="mt-1 text-2xl font-bold leading-none">{value}</div>
              <div style={{ color: C.inkSoft, fontFamily: SANS }} className="mt-2 truncate text-xs">{detail}</div>
            </div>
          </div>
        ))}
      </section>

      <button
        onClick={onSampleTour}
        style={{ borderColor: C.line, background: C.paperDim, fontFamily: SANS, textAlign: "left", width: "100%" }}
        className="mb-10 flex cursor-pointer items-center gap-4 rounded-xl border p-5 transition hover:border-[#703BF7] sm:p-6"
      >
        <span style={{ background: "rgba(112,59,247,.16)", borderRadius: 12, padding: 12, display: "flex", color: C.brass }}>
          <Globe2 size={22} />
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ color: C.ink, fontWeight: 700, fontSize: 16, display: "block" }}>
            Walk through a sample property
          </span>
          <span style={{ color: C.inkSoft, fontSize: 14, display: "block", marginTop: 4 }}>
            Explore a finished 3D tour before starting your own — no API key or wait required.
          </span>
        </span>
        <span style={{ color: C.brass, fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>Open tour <span aria-hidden="true">→</span></span>
      </button>

      <section aria-labelledby="listings-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div style={{ color: C.brass, fontFamily: SANS }} className="mb-2 text-xs font-bold tracking-[0.18em]">PROPERTY PORTFOLIO</div>
            <h2 id="listings-heading" style={{ color: C.ink, fontFamily: SERIF }} className="m-0 text-3xl font-semibold tracking-tight sm:text-4xl">Your properties</h2>
          </div>
          {properties.length > 0 && <span style={{ color: C.inkSoft, fontFamily: SANS }} className="text-sm">{properties.length} listing{properties.length === 1 ? "" : "s"}</span>}
        </div>

        {properties.length === 0 ? (
          <div style={{ borderColor: C.line, background: C.paperDim }} className="rounded-xl border p-10 text-center sm:p-16">
            <span style={{ background: "rgba(112,59,247,.16)", color: C.brass }} className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl">
              <Home size={30} />
            </span>
            <div style={{ color: C.ink, fontFamily: SANS }} className="mb-2 text-xl font-bold">No properties yet</div>
            <div style={{ color: C.inkSoft, fontFamily: SANS }} className="mx-auto mb-6 max-w-md text-sm leading-6">
              Add a listing to start organizing its photos, room details, virtual tour, and downloadable marketing materials.
            </div>
            <button
              onClick={onCreate}
              style={{ background: C.brass, color: "#FFFFFF", fontFamily: SANS, border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              className="hover:opacity-90"
            >
              Create your first property
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <article key={property.id} style={{ borderColor: C.line, background: C.paperDim }} className="overflow-hidden rounded-xl border">
                {property.coverDataUrl ? (
                  <img src={property.coverDataUrl} alt="" className="h-52 w-full object-cover" />
                ) : (
                  <div aria-hidden="true" style={{ background: "linear-gradient(135deg,#262626 0%,#1a1a1a 52%,#2a2050 100%)" }} className="h-52 w-full" />
                )}
                <div className="p-5">
                  <div style={{ color: C.brass, fontFamily: SANS }} className="mb-2 text-xs font-bold tracking-wider">{property.propertyType || "PROPERTY"}</div>
                  <div style={{ color: C.ink, fontFamily: SANS }} className="text-xl font-bold">{formatPrice(property.price)}</div>
                  <div style={{ color: C.inkSoft, fontFamily: SANS }} className="mb-4 mt-1 text-sm">{property.address || "Address not added"}</div>
                  <div style={{ borderColor: C.line }} className="flex flex-wrap gap-2 border-t pt-4">
                    <span style={{ background: C.paper, color: C.inkSoft, fontFamily: SANS }} className="rounded-lg px-3 py-2 text-xs">{property.photoCount || 0} photos</span>
                    <span style={{ background: C.paper, color: C.inkSoft, fontFamily: SANS }} className="rounded-lg px-3 py-2 text-xs">{property.adCount || 0} ads ready</span>
                    {(property.beds || property.baths || property.sqft) && (
                      <span style={{ background: C.paper, color: C.inkSoft, fontFamily: SANS }} className="rounded-lg px-3 py-2 text-xs">
                        {[property.beds && `${property.beds} bd`, property.baths && `${property.baths} ba`, property.sqft && `${property.sqft} sq ft`].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
