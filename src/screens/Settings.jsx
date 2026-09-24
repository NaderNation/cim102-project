import React, { useState, useEffect } from "react";
import { KeyRound, Check, AlertCircle, Loader2, ExternalLink } from "../icons.jsx";
import { C, SANS, SERIF } from "../theme.js";
import { loadApiKey, saveApiKey, clearApiKey, maskApiKey } from "../lib/settings.js";
import { worldlabsPrepareUpload } from "../lib/marble.js";
import { detectBackend } from "../lib/backend.js";

export default function Settings({ onBack, onStorageCleared }) {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverKey, setServerKey] = useState(false);
  const [test, setTest] = useState({ status: "idle" });
  const [mode, setMode] = useState(null);

  useEffect(() => {
    setKey(loadApiKey());
    detectBackend().then((info) => {
      setServerKey(info.serverKey);
      setMode(info.mode);
    });
  }, []);

  const persist = (value) => {
    const stored = saveApiKey(value);
    setKey(stored);
    setSaved(true);
    setTest({ status: "idle" });
    window.setTimeout(() => setSaved(false), 2000);
  };

  const runTest = async () => {
    setTest({ status: "running" });
    try {
      const health = await detectBackend();
      if (!health.serverKey && !key) {
        setTest({ status: "error", message: "No key to test. Paste one above, or set WORLDLABS_API_KEY in .env." });
        return;
      }
      // Cheapest authenticated call that proves the key is accepted.
      await worldlabsPrepareUpload(key, "estateflow-connection-test.jpg", "jpg");
      setTest({ status: "ok", message: "World Labs accepted this key." });
    } catch (error) {
      setTest({ status: "error", message: error.message || "The connection test failed." });
    }
  };

  const forget = () => {
    clearApiKey();
    setKey("");
    setTest({ status: "idle" });
  };

  const label = { color: C.ink, fontSize: 13, fontWeight: 700, fontFamily: SANS, display: "block", marginBottom: 6 };
  const card = { borderColor: C.line, background: C.card };

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.inkSoft, fontSize: 14, fontFamily: SANS, marginBottom: 18 }}
      >
        ← Back
      </button>

      <div style={{ color: C.brassDark, fontFamily: SANS }} className="text-xs font-bold tracking-widest flex items-center gap-2">
        <KeyRound size={14} /> SETTINGS
      </div>
      <h1 style={{ color: C.ink, fontFamily: SERIF }} className="text-4xl mt-2 mb-8">Keys &amp; storage</h1>

      <section style={card} className="border rounded-sm p-6 mb-6">
        <h2 style={{ color: C.ink, fontFamily: SERIF }} className="text-2xl mb-1">World Labs API key</h2>
        <p style={{ color: C.inkSoft, fontFamily: SANS }} className="text-sm mb-5">
          Needed to turn a photo into a 3D world. Get one at platform.worldlabs.ai.
          {mode === "direct" && " This is your own key and your own credits — generation is billed to you, not to whoever published this page."}
        </p>

        {serverKey ? (
          <div style={{ borderColor: C.line, background: C.paperDim }} className="border rounded-sm p-4 flex items-start gap-2">
            <Check size={16} style={{ color: C.forest, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ color: C.ink, fontFamily: SANS }} className="text-sm font-bold">Using the server&apos;s key</div>
              <p style={{ color: C.inkSoft, fontFamily: SANS }} className="text-sm mt-1">
                <code>WORLDLABS_API_KEY</code> is set in <code>.env</code>, so the backend signs requests for you.
                Nothing needs to be typed here, and no key is stored in this browser. This is the safer setup.
              </p>
            </div>
          </div>
        ) : (
          <>
            <label htmlFor="wl-key" style={label}>API key</label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <input
                id="wl-key"
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(event) => setKey(event.target.value)}
                onBlur={(event) => persist(event.target.value)}
                placeholder="Paste your World Labs API key"
                style={{ borderColor: C.line, fontFamily: SANS }}
                className="flex-1 min-w-[260px] border rounded-sm px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                style={{ color: C.brassDark, fontFamily: SANS }}
                className="text-xs font-bold px-3 py-2"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={runTest}
                disabled={test.status === "running"}
                style={{ background: C.brass, color: "#FFFFFF", fontFamily: SANS, opacity: test.status === "running" ? 0.7 : 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-bold"
              >
                {test.status === "running" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {test.status === "running" ? "Testing…" : "Test connection"}
              </button>
              {key && (
                <button
                  type="button"
                  onClick={forget}
                  style={{ color: C.inkSoft, fontFamily: SANS }}
                  className="text-xs font-bold underline"
                >
                  Forget this key
                </button>
              )}
              {saved && (
                <span style={{ color: C.forest, fontFamily: SANS }} className="text-xs font-bold inline-flex items-center gap-1">
                  <Check size={12} /> Saved
                </span>
              )}
              {key && !showKey && (
                <span style={{ color: C.inkSoft, fontFamily: SANS }} className="text-xs">Stored: {maskApiKey(key)}</span>
              )}
            </div>

            {test.status === "ok" && (
              <div style={{ color: C.forest, fontFamily: SANS }} className="text-sm mt-3 inline-flex items-center gap-1.5">
                <Check size={14} /> {test.message}
              </div>
            )}
            {test.status === "error" && (
              <div style={{ color: "#A4402F", fontFamily: SANS }} className="text-sm mt-3 flex items-start gap-1.5">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} /> {test.message}
              </div>
            )}

            <div style={{ borderColor: C.line }} className="border-t mt-5 pt-4">
              <p style={{ color: C.inkSoft, fontFamily: SANS }} className="text-xs leading-relaxed">
                <strong style={{ color: C.ink }}>This key is stored unencrypted in this browser.</strong>{" "}
                It stays on this device and is sent only to api.worldlabs.ai.
                Anyone who can run scripts on this page, or who uses this computer, can read it.
                Don&apos;t enter a key on a shared or public machine. For anything beyond a local demo,
                put the key in <code>.env</code> on the server instead — then this box disappears.
              </p>
            </div>
          </>
        )}
      </section>

      <section style={card} className="border rounded-sm p-6">
        <h2 style={{ color: C.ink, fontFamily: SERIF }} className="text-2xl mb-1">Saved data</h2>
        <p style={{ color: C.inkSoft, fontFamily: SANS }} className="text-sm mb-4">
          Listings and photos are saved in this browser so they survive a refresh. They are not uploaded anywhere
          and are not shared between devices or browsers.
        </p>
        <button
          type="button"
          onClick={onStorageCleared}
          style={{ borderColor: C.line, color: C.ink, fontFamily: SANS }}
          className="border px-4 py-2 rounded-sm text-sm font-bold"
        >
          Clear saved listings and photos
        </button>
      </section>

      <p style={{ color: C.inkSoft, fontFamily: SANS }} className="text-xs mt-6 inline-flex items-center gap-1">
        <ExternalLink size={12} /> Keys are managed at platform.worldlabs.ai/api-keys
      </p>
    </div>
  );
}
