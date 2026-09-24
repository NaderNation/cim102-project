import React from "react";
import { Upload, Sparkles, Check, ImageOff } from "../icons.jsx";
import { C } from "../theme.js";
import { ROOM_TYPES, ROOM_COLORS } from "../lib/rooms.js";
import VirtualTour from "./VirtualTour.jsx";
import ThreeDPropertyTour from "../components/ThreeDPropertyTour.jsx";
import MarbleWorldTour from "../components/MarbleWorldTour.jsx";

export default function UploadPhotos({
  photos,
  topScore,
  busy,
  onDrop,
  onPick,
  fileInputRef,
  handleFiles,
  onGenerate,
  hasImportedSpecs,
  importNotice,
  propertyType,
  draft,
  address,
  onRoomChange,
  onDimensionsChange,
  onRoomMeasurementChange,
}) {
  const bestCount = Math.min(6, photos.length);
  const stillClassifying = photos.some((p) => p.classifying);

  const roomCounts = {};
  photos.forEach((p) => {
    if (p.roomType && p.roomType !== "Other") {
      roomCounts[p.roomType] = (roomCounts[p.roomType] || 0) + 1;
    }
  });

  return (
    <div>
      <div style={{ color: C.brassDark, fontFamily: "Arial, sans-serif" }} className="text-xs font-bold tracking-widest mb-2">
        STEP 2 OF 3 {address ? `· ${address}` : ""}
      </div>
      <h1 style={{ color: C.ink }} className="text-3xl font-bold mb-6">
        Upload photos
      </h1>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={onPick}
        style={{ borderColor: C.brass, background: C.paperDim }}
        className="border-2 border-dashed rounded-sm p-12 text-center cursor-pointer hover:opacity-90 transition"
      >
        <Upload size={32} color={C.brassDark} className="mx-auto mb-3" />
        <div style={{ color: C.ink, fontFamily: "Arial, sans-serif" }} className="font-semibold mb-1">
          Drag photos here, or click to browse
        </div>
        <div style={{ color: C.inkSoft, fontFamily: "Arial, sans-serif" }} className="text-xs">
          Each photo is auto-scored for quality and auto-tagged by room
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {busy && (
        <div style={{ color: C.inkSoft, fontFamily: "Arial, sans-serif" }} className="text-sm mt-4">
          Reading photos…
        </div>
      )}

      {importNotice && photos.length > 0 && (
        <div style={{ color: C.forest, fontFamily: "Arial, sans-serif" }} className="text-xs font-semibold mt-4">
          ✓ {importNotice}
        </div>
      )}

      {(photos.length > 0 || hasImportedSpecs) && (
        <div className="mt-8">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <div style={{ color: C.ink, fontFamily: "Arial, sans-serif" }} className="text-sm font-bold">
              {photos.length} photo{photos.length > 1 ? "s" : ""} uploaded · ranked by AI quality score
            </div>
            {stillClassifying && (
              <div style={{ color: C.brassDark, fontFamily: "Arial, sans-serif" }} className="text-xs font-semibold">
                Identifying rooms…
              </div>
            )}
          </div>

          {Object.keys(roomCounts).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5 mt-3">
              {Object.entries(roomCounts).map(([room, count]) => (
                <div
                  key={room}
                  style={{ background: ROOM_COLORS[room] || C.brassDark, color: "#F3EFE6", fontFamily: "Arial, sans-serif" }}
                  className="text-xs font-bold px-3 py-1.5 rounded-sm"
                >
                  {room} · {count}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((p, i) => (
              <div key={p.id} style={{ borderColor: C.line, background: C.paperDim }} className="border rounded-sm overflow-hidden">
                <div className="relative">
                  <img src={p.dataUrl} alt="" className="w-full h-32 object-cover" />
                  {i < bestCount ? (
                    <div
                      style={{ background: C.forest, color: "#F3EFE6", fontFamily: "Arial, sans-serif" }}
                      className="absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5"
                    >
                      <Check size={10} /> BEST
                    </div>
                  ) : null}
                  <div
                    style={{ background: "rgba(20,18,14,0.75)", color: "#F3EFE6", fontFamily: "Arial, sans-serif" }}
                    className="absolute bottom-1 right-1 text-xs font-bold px-1.5 py-0.5 rounded-sm"
                  >
                    {p.score}
                  </div>
                </div>
                <div className="p-2.5" style={{ fontFamily: "Arial, sans-serif" }}>
                  <label className="block mb-2">
                    <span style={{ color: C.inkSoft }} className="text-xs font-bold tracking-wide block mb-1">
                      {p.classifying ? "IDENTIFYING…" : "ROOM"}
                    </span>
                    <select
                      value={p.roomType || ""}
                      disabled={p.classifying}
                      onChange={(e) => onRoomChange(p.id, e.target.value)}
                      style={{ borderColor: C.line, background: C.paperDim, color: C.ink }}
                      className="w-full border rounded-sm px-2 py-1.5 text-xs outline-none disabled:opacity-50"
                    >
                      <option value="" disabled>
                        {p.classifying ? "Analyzing…" : "Choose room"}
                      </option>
                      {ROOM_TYPES.map((rt) => (
                        <option key={rt} value={rt}>
                          {rt}
                        </option>
                      ))}
                    </select>
                    {!p.classifying && p.roomConfidence !== null && (
                      <div style={{ color: C.inkSoft }} className="text-[10px] mt-1">
                        Analysis confidence: {Math.round(p.roomConfidence * 100)}%
                      </div>
                    )}
                  </label>
                  <label className="block">
                    <span style={{ color: C.inkSoft }} className="text-xs font-bold tracking-wide block mb-1">
                      ROOM DIMENSIONS (FT)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={p.length}
                        onChange={(e) => onRoomMeasurementChange(p.id, "length", e.target.value)}
                        placeholder="Length"
                        aria-label={`${p.roomType || "Room"} length in feet`}
                        style={{ borderColor: C.line, background: C.paperDim, color: C.ink }}
                        className="w-full border rounded-sm px-2 py-1.5 text-xs outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={p.width}
                        onChange={(e) => onRoomMeasurementChange(p.id, "width", e.target.value)}
                        placeholder="Width"
                        aria-label={`${p.roomType || "Room"} width in feet`}
                        style={{ borderColor: C.line, background: C.paperDim, color: C.ink }}
                        className="w-full border rounded-sm px-2 py-1.5 text-xs outline-none"
                      />
                    </div>
                    {Number(p.length) > 0 && Number(p.width) > 0 && (
                      <div style={{ color: C.brassDark }} className="text-xs mt-1 font-semibold">
                        {Number(p.length) * Number(p.width)} sq ft
                      </div>
                    )}
                    <input
                      type="text"
                      value={p.dimensions}
                      onChange={(e) => onDimensionsChange(p.id, e.target.value)}
                      placeholder="Notes, e.g. bay window"
                      aria-label={`${p.roomType || "Room"} dimension notes`}
                      style={{ borderColor: C.line, background: C.paperDim, color: C.ink }}
                      className="w-full border rounded-sm px-2 py-1.5 text-xs outline-none mt-1.5"
                    />
                    {!p.classifying && (p.features?.length > 0 || p.bestListingDescription) && (
                      <div style={{ borderColor: C.line, color: C.inkSoft }} className="border-t mt-2 pt-2 text-[10px] leading-4">
                        {p.features?.length > 0 && <div><strong>Visible:</strong> {p.features.join(", ")}</div>}
                        {p.bestListingDescription && <div className="mt-1"><strong>Listing note:</strong> {p.bestListingDescription}</div>}
                      </div>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div style={{ color: C.inkSoft, fontFamily: "Arial, sans-serif" }} className="text-xs mt-3 max-w-xl">
            {photos.length > 0
              ? "Room type is AI-detected from each photo. Enter length and width to calculate room area; the measurements are added to that room's highlight ad."
              : "Imported room dimensions are ready. Generate the floor-plan model now, or add photos to create visual ads too."}
          </div>

          <VirtualTour photos={photos} draft={{ propertyType }} />
          <ThreeDPropertyTour photos={photos} draft={draft} />
          <MarbleWorldTour photos={photos} draft={draft} />

          <button
            onClick={onGenerate}
            disabled={busy}
            style={{ background: C.brass, color: "#FFFFFF", fontFamily: "Arial, sans-serif" }}
            className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            <Sparkles size={18} /> Generate ad set
          </button>
        </div>
      )}

      {photos.length === 0 && !busy && (
        <div style={{ color: C.inkSoft, fontFamily: "Arial, sans-serif" }} className="text-xs mt-4 flex items-center gap-2">
          <ImageOff size={14} /> No photos yet
        </div>
      )}
    </div>
  );
}
