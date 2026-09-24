import React, { useState, useCallback, useEffect } from "react";
import { Sparkles, Check, Globe2, KeyRound, Loader2, ExternalLink, AlertCircle } from "../icons.jsx";
import { C } from "../theme.js";
import { shrinkForMarble } from "../lib/photo.js";
import { loadApiKey, saveApiKey } from "../lib/settings.js";
import { detectBackend } from "../lib/backend.js";
import { normalizeWorldLabsKey, worldlabsCheckProxy, worldlabsPrepareUpload, worldlabsUploadFile, worldlabsGenerateWorld, worldlabsPollOperation, worldlabsBrowserError } from "../lib/marble.js";
import PanoViewer from "./PanoViewer.jsx";
import SplatViewer from "./SplatViewer.jsx";
import { pickSplatUrl, hasSplat } from "../lib/splat.js";

export default function MarbleWorldTour({ photos, draft }) {
  const tourPhotos = photos.filter((photo) => photo.dataUrl);
  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [showKey, setShowKey] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [worlds, setWorlds] = useState({});
  const [serverKey, setServerKey] = useState(false);
  const [quality, setQuality] = useState("100k");
  const [mode, setMode] = useState(null); // null = still detecting
  useEffect(() => {
    detectBackend().then((info) => {
      setServerKey(info.serverKey);
      setMode(info.mode);
    });
  }, []);

  if (!tourPhotos.length) return null;
  const activePhoto = tourPhotos[activeIndex];
  const state = worlds[activePhoto.id] || { status: "idle" };
  const roomName = activePhoto.roomType && activePhoto.roomType !== "Other" ? activePhoto.roomType : `Interior ${activeIndex + 1}`;
  const setPhotoState = (photoId, patch) => setWorlds((previous) => ({ ...previous, [photoId]: { ...(previous[photoId] || {}), ...patch } }));

  const generate = async (photo) => {
    const normalizedApiKey = normalizeWorldLabsKey(apiKey);
    try {
      setPhotoState(photo.id, { status: "uploading", error: null });
      const health = await worldlabsCheckProxy();
      if (!normalizedApiKey && !health.serverKey) throw new Error("Add your World Labs API key first.");
      const blob = await shrinkForMarble(photo.dataUrl);
      const extension = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const { media_asset: mediaAsset, upload_info: uploadInfo } = await worldlabsPrepareUpload(normalizedApiKey, `${photo.id}.${extension}`, extension);
      await worldlabsUploadFile(uploadInfo, blob);
      const mediaAssetId = mediaAsset.media_asset_id || mediaAsset.id;
      if (!mediaAssetId) throw new Error("World Labs did not return a media asset ID after upload.");
      setPhotoState(photo.id, { status: "generating" });
      const label = `${draft.address || "Property"} - ${photo.roomType || "room"}`;
      const roomContext = [
        `Create an explorable real-estate interior reconstruction of this ${photo.roomType || "room"}.`,
        photo.bestListingDescription,
        photo.features?.length ? `Visible features: ${photo.features.join(", ")}.` : "",
        photo.length && photo.width ? `Approximate room size: ${photo.length} by ${photo.width} feet.` : "",
        "Preserve the camera-facing architecture, materials, lighting, and spatial layout from the reference photo. Make it feel like a polished property tour, with realistic scale and walkable room continuity.",
      ].filter(Boolean).join(" ");
      const { operation_id: operationId } = await worldlabsGenerateWorld(normalizedApiKey, mediaAssetId, label, roomContext);
      setPhotoState(photo.id, { status: "polling" });
      const world = await worldlabsPollOperation(normalizedApiKey, operationId);
      setPhotoState(photo.id, { status: "done", world });
    } catch (error) {
      setPhotoState(photo.id, { status: "error", error: worldlabsBrowserError(error) });
    }
  };

  const statusLabel = {
    uploading: "Uploading photo...",
    generating: "Starting world generation...",
    polling: "Generating explorable 3D world - this can take a few minutes...",
  }[state.status];

  const openExternalUrl = useCallback((url) => {
    if (!url) return;
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (popup) popup.opener = null;
  }, []);

  return (
    <section style={{ borderColor: C.line, background: C.card }} className="border rounded-sm overflow-hidden mb-10">
      <div className="p-6 pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div style={{ color: C.brassDark }} className="text-xs font-bold tracking-widest flex items-center gap-2"><Globe2 size={14} /> WORLD LABS MARBLE TOUR</div>
          <h2 style={{ color: C.ink }} className="text-3xl mt-2">Explore {roomName} in 3D</h2>
          <p style={{ color: C.inkSoft }} className="text-sm mt-2 max-w-xl">Turn a property photo into an interactive World Labs Marble reconstruction. Your API key stays in this browser session.</p>
        </div>
        <div style={{ color: C.forest, background: C.paperDim }} className="text-xs font-bold px-3 py-2 rounded-full">{tourPhotos.length} rooms available</div>
      </div>
      <div className="px-6 pb-6">
        {!serverKey && (
        <div style={{ borderColor: C.line }} className="border rounded-sm p-3 mb-4 flex items-center gap-2 flex-wrap">
          <KeyRound size={16} style={{ color: C.inkSoft }} />
          <input type={showKey ? "text" : "password"} value={apiKey} onChange={(event) => setApiKey(event.target.value)} onBlur={(event) => setApiKey(saveApiKey(event.target.value))} placeholder="Paste your World Labs API key" style={{ borderColor: C.line }} className="flex-1 min-w-[220px] border rounded-sm px-3 py-2 text-sm" />
          <button type="button" onClick={() => setShowKey((value) => !value)} style={{ color: C.brassDark }} className="text-xs font-bold px-2 py-2">{showKey ? "Hide" : "Show"}</button>
          <span style={{ color: C.inkSoft }} className="text-xs">{mode === "direct" ? "Your own key, saved in this browser and sent straight to api.worldlabs.ai. Generation is billed to you." : "Saved in this browser; sent only to api.worldlabs.ai. Manage it in Settings."}</span>
          <button type="button" onClick={() => openExternalUrl("https://marble.worldlabs.ai")} style={{ color: C.brassDark }} className="inline-flex items-center gap-1 text-xs font-bold underline"><ExternalLink size={12} /> Confirm in Marble</button>
        </div>
        )}
        <div className="flex gap-3 overflow-x-auto pb-3 mb-3">
          {tourPhotos.map((photo, index) => {
            const photoState = worlds[photo.id] || { status: "idle" };
            return <button key={photo.id} onClick={() => setActiveIndex(index)} aria-label={`Select ${photo.roomType || `room ${index + 1}`}`} style={{ borderColor: index === activeIndex ? C.brass : C.line, background: index === activeIndex ? C.paperDim : C.card }} className="flex-none border rounded-xl p-1.5 text-left relative"><img src={photo.dataUrl} alt="" className="w-20 h-14 object-cover rounded-lg" /><span style={{ color: C.ink }} className="block text-[11px] font-bold mt-1 px-0.5">{photo.roomType || `Room ${index + 1}`}</span>{photoState.status === "done" && <span style={{ background: C.brass }} className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"><Check size={10} color="#fff" /></span>}</button>;
          })}
        </div>
        <div className="relative overflow-hidden rounded-[18px] bg-[#17201d] min-h-[280px] flex items-center justify-center p-6">
          {state.status === "done" && state.world ? <div className="w-full flex flex-col items-center gap-3">{hasSplat(state.world) ? <SplatViewer world={state.world} url={pickSplatUrl(state.world, quality)} label={roomName} /> : <PanoViewer url={state.world.assets?.pano_url || state.world.assets?.imagery?.pano_url} thumbnail={state.world.assets?.thumbnail_url} alt={`${roomName} 3D world`} />}<div className="flex items-center gap-4 text-xs"><span style={{ color: "rgba(255,255,255,.7)" }}>{hasSplat(state.world) ? "Click the scene to walk through it" : "Drag to look around · scroll to zoom"}</span>{hasSplat(state.world) && <span style={{ color: "rgba(255,255,255,.7)" }}>Quality: {["100k", "500k", "full_res"].map((q) => <button key={q} onClick={() => setQuality(q)} style={{ color: quality === q ? "#FFFFFF" : "rgba(255,255,255,.5)", fontWeight: quality === q ? 700 : 400, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>{q === "full_res" ? "full" : q}</button>)}</span>}<button onClick={() => generate(activePhoto)} style={{ color: "rgba(255,255,255,.7)" }} className="underline">Regenerate this room</button>{state.world.world_marble_url && <button onClick={() => openExternalUrl(state.world.world_marble_url)} style={{ color: "rgba(255,255,255,.7)" }} className="underline">Open full version</button>}</div></div> : state.status === "uploading" || state.status === "generating" || state.status === "polling" ? <div className="flex flex-col items-center gap-3 text-center" style={{ color: "white" }}><Loader2 size={28} className="animate-spin" /><div className="text-sm">{statusLabel}</div><div style={{ color: "rgba(255,255,255,.62)" }} className="text-xs max-w-sm">EstateFlow is sending the selected room photo and spatial context to Marble.</div></div> : <div className="flex flex-col items-center gap-4 text-center"><img src={activePhoto.dataUrl} alt={roomName} className="max-h-56 rounded-lg object-contain opacity-70" />{state.status === "error" && <div style={{ color: "#F3B9B0" }} className="text-xs flex items-center gap-1.5 max-w-md"><AlertCircle size={14} /> {state.error}</div>}<button onClick={() => generate(activePhoto)} style={{ background: C.brass, color: "#FFFFFF" }} className="inline-flex items-center gap-2 px-5 py-3 rounded-sm text-sm font-bold hover:opacity-90 transition"><Sparkles size={16} /> Generate 3D world from this photo</button></div>}
        </div>
      </div>
    </section>
  );
}
