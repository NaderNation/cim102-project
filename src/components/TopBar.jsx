import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Building2, KeyRound } from "../icons.jsx";
import { C, SANS } from "../theme.js";

export default function TopBar({ view, onDashboard, onSelectListings, onCreateAccount, onSettings }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  const pick = (which) => { setOpen(false); onSelectListings(which); };
  const item = { display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "12px 16px", borderRadius: 10, fontFamily: SANS };
  return (
    <header style={{ background: "rgba(251,252,250,0.94)", borderBottom: `1px solid ${C.line}`, backdropFilter: "blur(12px)", position: "sticky", top: "env(safe-area-inset-top, 0px)", zIndex: 20, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontFamily: SANS }}>
      <style>{".ef-menu-item:hover,.ef-menu-item:focus-visible{background:#EEF3EF!important;outline:none}"}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ background: C.paperDim, width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Building2 size={20} color={C.brass} />
        </div>
        <div>
          <div style={{ color: C.ink, letterSpacing: "0.12em", fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>ESTATEFLOW</div>
          <div style={{ color: C.inkSoft, fontSize: 12, letterSpacing: "0.02em", marginTop: 2 }}>property intelligence studio</div>
        </div>
        <div ref={wrapRef} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            style={{ background: C.paperDim, color: C.forest, border: `1.5px solid ${C.forest}`, borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}
          >
            View listings
          </button>
          {open && (
            <div role="menu" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, width: 300, maxWidth: "calc(100vw - 48px)", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, boxShadow: "0 16px 40px rgba(23,32,29,0.16)", padding: "16px 12px 12px", zIndex: 30 }}>
              <div style={{ color: C.forest, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", padding: "0 16px 8px" }}>WHICH LISTINGS?</div>
              <button role="menuitem" className="ef-menu-item" onClick={() => pick("public")} style={item}>
                <div style={{ color: C.ink, fontSize: 16, fontWeight: 700 }}>View public listings</div>
                <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 2 }}>Explore available properties</div>
              </button>
              <button role="menuitem" className="ef-menu-item" onClick={() => pick("own")} style={item}>
                <div style={{ color: C.ink, fontSize: 16, fontWeight: 700 }}>View your own listings</div>
                <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 2 }}>Your saved EstateFlow properties</div>
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {view !== "dashboard" && view !== "public" && (
          <button onClick={onDashboard} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, fontSize: 14, display: "flex", alignItems: "center", gap: 6, fontFamily: SANS }}>
            <ArrowLeft size={16} /> Dashboard
          </button>
        )}
        {view !== "settings" && (
          <button onClick={onSettings} aria-label="Settings" style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, fontSize: 14, display: "flex", alignItems: "center", gap: 6, fontFamily: SANS }}>
            <KeyRound size={16} /> Settings
          </button>
        )}
        <button onClick={onCreateAccount} style={{ background: C.brassDark, color: "#FFFFFF", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>
          Create account
        </button>
      </div>
    </header>
  );
}
