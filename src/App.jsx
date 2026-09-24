import React, { useState, useRef, useEffect } from "react";
import { C, SANS } from "./theme.js";
import { fileToImage, scorePhoto } from "./lib/photo.js";
import { classifyRoomWithAI, normalizeRoomSpecs } from "./lib/rooms.js";
import { buildAds } from "./lib/adGeneration.js";
import { downloadCanvasAsset } from "./lib/download.js";
import TopBar from "./components/TopBar.jsx";
import Modal from "./components/Modal.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import PublicListings from "./screens/PublicListings.jsx";
import CreateProperty from "./screens/CreateProperty.jsx";
import UploadPhotos from "./screens/UploadPhotos.jsx";
import Results from "./screens/Results.jsx";
import Settings from "./screens/Settings.jsx";
import SampleTour from "./screens/SampleTour.jsx";
import {
  loadProperties, saveProperties, savePhotos, loadStoredPhotos,
  hydratePhotos, clearPhotos, StorageError,
} from "./lib/storage.js";
import {
  normalizeWorldLabsKey, worldlabsCheckProxy, worldlabsPrepareUpload,
  worldlabsUploadFile, worldlabsGenerateWorld, worldlabsPollOperation,
  worldlabsBrowserError,
} from "./lib/marble.js";


// ---------- Helpers ----------






// ---------- Ad templates ----------
// Each template draws onto a canvas given (ctx, W, H, property, img)






// ---------- UI ----------
export default function App() {
  const [view, setView] = useState("dashboard");
  const [modal, setModal] = useState(null); // null | "account" | "disclosure" // dashboard | create | upload | results
  const [properties, setProperties] = useState([]);
  const [draft, setDraft] = useState({ address: "", price: "", beds: "", baths: "", sqft: "", propertyType: "House", roomSpecs: [] });
  const [photos, setPhotos] = useState([]); // {id, img, dataUrl, score}
  const [busy, setBusy] = useState(false);
  const [ads, setAds] = useState([]); // {id, name, dataUrl, w, h}
  const [activeProperty, setActiveProperty] = useState(null);
  const [importNotice, setImportNotice] = useState("");
  const [storageError, setStorageError] = useState("");
  const [restored, setRestored] = useState(false);
  const fileInputRef = useRef(null);

  // Restore saved work once, on first mount. Photos need their img element
  // rebuilt from the stored data URL before anything can draw them.
  useEffect(() => {
    let cancelled = false;
    setProperties(loadProperties());
    loadStoredPhotos()
      .then(hydratePhotos)
      .then((restoredPhotos) => {
        if (!cancelled && restoredPhotos.length) {
          setPhotos(restoredPhotos.sort((a, b) => b.score - a.score));
        }
      })
      .catch(() => { /* no saved photos, or storage unavailable */ })
      .finally(() => { if (!cancelled) setRestored(true); });
    return () => { cancelled = true; };
  }, []);

  // Persist listings whenever they change, but never before the restore has
  // finished — an early write would save [] over real saved data.
  useEffect(() => {
    if (!restored) return;
    try {
      saveProperties(properties);
      setStorageError("");
    } catch (error) {
      setStorageError(error instanceof StorageError ? error.message : "Could not save your listings.");
    }
  }, [properties, restored]);

  useEffect(() => {
    if (!restored) return;
    savePhotos(photos).catch((error) => {
      setStorageError(error instanceof StorageError ? error.message : "Could not save your photos.");
    });
  }, [photos, restored]);

  const startCreate = () => {
    setDraft({ address: "", price: "", beds: "", baths: "", sqft: "", propertyType: "House", roomSpecs: [] });
    setPhotos([]);
    setAds([]);
    setImportNotice("");
    setView("create");
  };

  const handleDraftChange = (field) => (e) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }));

  const importHousingSpecs = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = file.name.toLowerCase().endsWith(".csv")
          ? String(reader.result)
              .trim()
              .split(/\r?\n/)
              .slice(1)
              .map((line) => {
                const [name, length, width] = line.split(",");
                return { name, length, width };
              })
          : JSON.parse(String(reader.result));
        const roomSpecs = normalizeRoomSpecs(parsed);
        if (!roomSpecs.length) throw new Error("No valid rooms");
        const importedType = Array.isArray(parsed) ? "House" : parsed.propertyType;
        setDraft((current) => ({
          ...current,
          propertyType: importedType === "Apartment" ? "Apartment" : current.propertyType,
          beds: parsed.beds || current.beds,
          baths: parsed.baths || current.baths,
          sqft: parsed.sqft || current.sqft,
          roomSpecs,
        }));
        setFormError("");
        setImportNotice(`${roomSpecs.length} room specification${roomSpecs.length === 1 ? "" : "s"} imported.`);
      } catch (e) {
        setFormError("Could not read that file. Use JSON or CSV room specs with name, length, and width.");
        setImportNotice("The housing specs file could not be imported.");
      }
    };
    reader.readAsText(file);
  };

  const importFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name));
    const specFiles = files.filter((file) => /\.(json|csv)$/i.test(file.name) || file.type === "application/json" || file.type === "text/csv");
    const unsupportedCount = files.length - imageFiles.length - specFiles.length;

    if (!files.length) return;
    if (specFiles.length) specFiles.forEach((file) => importHousingSpecs(file));
    if (imageFiles.length) handleFiles(imageFiles);
    if (!specFiles.length && !imageFiles.length) {
      setImportNotice("No supported files found. Choose photos, JSON, or CSV files.");
    } else if (unsupportedCount > 0) {
      setImportNotice(`${imageFiles.length} photo${imageFiles.length === 1 ? "" : "s"} and ${specFiles.length} spec file${specFiles.length === 1 ? "" : "s"} imported. ${unsupportedCount} unsupported file${unsupportedCount === 1 ? "" : "s"} skipped.`);
    }
  };

  const [formError, setFormError] = useState("");

  const goToUpload = () => {
    if (!draft.address.trim() || !draft.price.trim()) {
      setFormError("Please fill in at least the address and price.");
      return;
    }
    setFormError("");
    setView("upload");
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setBusy(true);
    const loaded = [];
    for (const f of files) {
      try {
        const { img, dataUrl } = await fileToImage(f);
        const score = scorePhoto(img);
        loaded.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          img,
          dataUrl,
          score,
          roomType: null,
          roomConfidence: null,
          classifying: true,
          dimensions: "",
          length: "",
          width: "",
          features: [],
          condition: "unclear",
          bestListingDescription: "",
          design: { style: "unclear", wallColor: "#E8E4DC", floorColor: "#B9A78C", lighting: "unclear", camera: { fov: 55, elevation: "eye-level" } },
        });
      } catch (e) {
        // skip unreadable file
      }
    }
    setPhotos((prev) => [...prev, ...loaded].sort((a, b) => b.score - a.score));
    setImportNotice(`${loaded.length} photo${loaded.length === 1 ? "" : "s"} imported successfully${loaded.length < files.length ? `; ${files.length - loaded.length} could not be read` : ""}.`);
    setBusy(false);
    classifyPhotos(loaded);
  };

  // Runs room classification one photo at a time (kept sequential to stay gentle on rate limits)
  // and streams each result into state as it resolves, so the UI updates progressively.
  const classifyPhotos = async (photoList) => {
    for (const ph of photoList) {
      try {
        const { roomType, confidence, features, condition, bestListingDescription, design } = await classifyRoomWithAI(ph.img);
        setPhotos((prev) =>
          prev.map((x) =>
            x.id === ph.id
              ? { ...x, roomType, roomConfidence: confidence, features, condition, bestListingDescription, design, classifying: false }
              : x
          )
        );
      } catch (e) {
        setPhotos((prev) =>
          prev.map((x) =>
            x.id === ph.id
              ? { ...x, roomType: "Other", roomConfidence: 0, features: [], condition: "unclear", bestListingDescription: "", design: { style: "unclear", wallColor: "#E8E4DC", floorColor: "#B9A78C", lighting: "unclear", camera: { fov: 55, elevation: "eye-level" } }, classifying: false }
              : x
          )
        );
      }
    }
  };

  const updatePhoto = (id, patch) => {
    setPhotos((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const generateAds = () => {
    if (!photos.length && !draft.roomSpecs?.length) return;
    setBusy(true);
    const { ads: allAds, best } = buildAds(draft, photos);
    setAds(allAds);

    const savedProperty = {
      id: `${Date.now()}`,
      ...draft,
      photoCount: photos.length,
      bestScore: best[0]?.score ?? 0,
      adCount: allAds.length,
      coverDataUrl: best[0]?.dataUrl,
    };
    setProperties((prev) => [savedProperty, ...prev]);
    setActiveProperty(savedProperty);
    setBusy(false);
    setView("results");
  };

  const downloadAd = (ad, format = "png") => downloadCanvasAsset(ad, format, draft.address);

  const downloadAll = (format = "png") => {
    ads.forEach((ad, i) => setTimeout(() => downloadAd(ad, format), i * 250));
  };

  const bestPhotos = [...photos].sort((a, b) => b.score - a.score);
  const topScore = bestPhotos[0]?.score;

  return (
    <div
      style={{ background: C.paper, minHeight: "100%", color: C.ink, fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }}
      className="estateflow-app w-full min-h-screen"
    >
      <TopBar
        view={view}
        onDashboard={() => setView("dashboard")}
        onSelectListings={(which) => setView(which === "public" ? "public" : "dashboard")}
        onCreateAccount={() => setModal("account")}
        onSettings={() => setView("settings")}
      />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {storageError && (
          <div
            role="alert"
            style={{ borderColor: "#653733", background: "#2A1919", color: "#F3B9B0", fontFamily: SANS }}
            className="border rounded-sm px-4 py-3 mb-6 text-sm flex items-start justify-between gap-4"
          >
            <span>{storageError}</span>
            <button onClick={() => setStorageError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}>Dismiss</button>
          </div>
        )}
        {view === "dashboard" && (
          <Dashboard properties={properties} onCreate={startCreate} onSampleTour={() => setView("sample")} />
        )}

        {view === "public" && <PublicListings />}

        {view === "create" && (
            <CreateProperty
              draft={draft}
              onChange={handleDraftChange}
              onImportSpecs={importHousingSpecs}
              onImportFiles={importFiles}
              importNotice={importNotice}
              onSubmit={goToUpload}
              error={formError}
            />
        )}

        {view === "upload" && (
          <UploadPhotos
            photos={bestPhotos}
            topScore={topScore}
            busy={busy}
            onDrop={onDrop}
            onPick={() => fileInputRef.current?.click()}
            fileInputRef={fileInputRef}
            handleFiles={handleFiles}
            onGenerate={generateAds}
            hasImportedSpecs={draft.roomSpecs?.length > 0}
            importNotice={importNotice}
            propertyType={draft.propertyType}
            draft={draft}
            address={draft.address}
            onRoomChange={(id, roomType) => updatePhoto(id, { roomType, roomConfidence: 1 })}
            onDimensionsChange={(id, dimensions) => updatePhoto(id, { dimensions })}
            onRoomMeasurementChange={(id, field, value) => updatePhoto(id, { [field]: value })}
          />
        )}

        {view === "sample" && <SampleTour onBack={() => setView("dashboard")} />}

        {view === "settings" && (
          <Settings
            onBack={() => setView("dashboard")}
            onStorageCleared={() => {
              setProperties([]);
              setPhotos([]);
              setAds([]);
              clearPhotos().catch(() => { /* already gone */ });
            }}
          />
        )}

        {view === "results" && (
          <Results ads={ads} photos={photos} draft={draft} onDownload={downloadAd} onDownloadAll={downloadAll} onNew={startCreate} />
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "28px 24px", textAlign: "center", marginTop: 48 }}>
        <button
          onClick={() => setModal("disclosure")}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.inkSoft, textDecoration: "underline", fontSize: 14, fontFamily: SANS }}
        >
          AI visualization disclosure
        </button>
      </footer>

      {modal === "disclosure" && (
        <Modal title="AI-Generated 3D Visualization Disclosure" onClose={() => setModal(null)}>
          <div style={{ color: C.ink, fontSize: 14, lineHeight: 1.6, fontFamily: SANS }}>
            <p style={{ margin: "0 0 12px" }}>
              3D visualizations and room labels in EstateFlow are generated by artificial intelligence from a limited set of photographs. They are interpretive representations, not exact depictions of a property. Layout, dimensions, proportions, finishes, furnishings, lighting, views, and areas not shown in the original photographs may differ from the actual property. Room sizes and square footage are approximate and should not be relied upon.
            </p>
            <p style={{ margin: "0 0 12px" }}>
              Visualizations are provided for illustrative and marketing purposes only. They are not a survey, floor plan, appraisal, inspection, or warranty of any kind. Buyers and renters should verify all features, measurements, and conditions through an in-person visit and their own inspection before making any decision.
            </p>
            <p style={{ margin: "0 0 4px", color: C.inkSoft }}>
              EstateFlow, its licensors, and the listing agent or broker make no representations or warranties regarding accuracy or completeness and are not liable for decisions made in reliance on these visualizations, to the fullest extent permitted by law.
            </p>
          </div>
        </Modal>
      )}
      {modal === "account" && (
        <Modal title="Create account" onClose={() => setModal(null)}>
          <p style={{ color: C.ink, fontSize: 14, lineHeight: 1.6, margin: "0 0 4px", fontFamily: SANS }}>
            Accounts aren't connected yet. For now, your listings live only in this browser tab and are cleared when you refresh.
          </p>
        </Modal>
      )}
    </div>
  );
}






