import React, { useEffect } from "react";
import { C, SANS, SERIF } from "../theme.js";

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(23,32,29,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, maxWidth: 560, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
        <h2 style={{ margin: "0 0 14px", fontFamily: SERIF, fontSize: 24, color: C.ink }}>{title}</h2>
        {children}
        <button onClick={onClose} style={{ marginTop: 16, background: C.brassDark, color: "#FFFFFF", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Close</button>
      </div>
    </div>
  );
}
