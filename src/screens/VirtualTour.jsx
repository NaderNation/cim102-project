import React, { useState } from "react";
import { C } from "../theme.js";

export default function VirtualTour({ photos, draft }) {
  const tourPhotos = photos.filter((photo) => photo.dataUrl);
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = tourPhotos[activeIndex];

  if (!tourPhotos.length) return null;

  const goToRoom = (index) => setActiveIndex((index + tourPhotos.length) % tourPhotos.length);
  const roomName = activePhoto.roomType && activePhoto.roomType !== "Other" ? activePhoto.roomType : `Interior ${activeIndex + 1}`;

  return (
    <section style={{ borderColor: C.line, background: C.card }} className="border rounded-sm overflow-hidden mb-10">
      <div className="p-6 pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div style={{ color: C.brassDark }} className="text-xs font-bold tracking-widest">INTERACTIVE PROPERTY TOUR</div>
          <h2 style={{ color: C.ink }} className="text-3xl mt-2">Walk through {draft.propertyType?.toLowerCase() || "the property"}</h2>
          <p style={{ color: C.inkSoft }} className="text-sm mt-2">Move between analyzed rooms using the navigation points.</p>
        </div>
        <div style={{ color: C.forest, background: C.paperDim }} className="text-xs font-bold px-3 py-2 rounded-full">
          {tourPhotos.length} connected spaces
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="relative overflow-hidden rounded-[18px] bg-[#17201d] h-[360px] sm:h-[500px]" style={{ perspective: "1200px" }}>
          <img
            src={activePhoto.dataUrl}
            alt={`${roomName} virtual tour view`}
            className="w-full h-full object-cover"
            style={{ transform: "scale(1.06) rotateY(-1deg)", filter: "saturate(.9) contrast(1.04)" }}
          />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(15,27,23,.48), transparent 35%, transparent 70%, rgba(15,27,23,.3))" }} />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span style={{ background: C.card, color: C.forest }} className="px-3 py-1.5 rounded-full text-xs font-bold shadow">
              {roomName}
            </span>
            {activePhoto.condition && activePhoto.condition !== "unclear" && (
              <span style={{ background: "rgba(255,255,255,.9)", color: C.inkSoft }} className="px-3 py-1.5 rounded-full text-xs font-semibold">
                {activePhoto.condition}
              </span>
            )}
          </div>
          <button
            onClick={() => goToRoom(activeIndex - 1)}
            aria-label="Previous room"
            style={{ background: "rgba(255,255,255,.9)", color: C.ink }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full text-2xl"
          >
            ‹
          </button>
          <button
            onClick={() => goToRoom(activeIndex + 1)}
            aria-label="Next room"
            style={{ background: "rgba(255,255,255,.9)", color: C.ink }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full text-2xl"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
            <div style={{ color: "white" }} className="max-w-md text-sm drop-shadow">
              {activePhoto.bestListingDescription || activePhoto.features?.join(" · ") || "Analyzed interior view"}
            </div>
            <div style={{ color: "white" }} className="text-xs font-bold whitespace-nowrap">{activeIndex + 1} / {tourPhotos.length}</div>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pt-4 pb-1">
          {tourPhotos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => goToRoom(index)}
              aria-label={`Go to ${photo.roomType}`}
              style={{ borderColor: index === activeIndex ? C.brass : C.line, background: index === activeIndex ? C.paperDim : C.card }}
              className="flex-none border rounded-xl p-1.5 text-left"
            >
              <img src={photo.dataUrl} alt="" className="w-20 h-14 object-cover rounded-lg" />
              <span style={{ color: C.ink }} className="block text-[11px] font-bold mt-1 px-0.5">{photo.roomType}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
