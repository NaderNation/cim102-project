import React from "react";
import { C, SANS, SERIF } from "../theme.js";

export default function PublicListings() {
  return (
    <div>
      <div style={{ color: C.brassDark, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", marginBottom: 8 }}>EXPLORE</div>
      <h1 style={{ color: C.ink, fontFamily: SERIF, fontSize: 40, fontWeight: 700, margin: "0 0 24px" }}>Public listings</h1>
      <div style={{ background: C.paperDim, border: `1px solid ${C.line}`, borderRadius: 12, padding: 48, textAlign: "center", fontFamily: SANS }}>
        <div style={{ color: C.ink, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No public listings yet</div>
        <div style={{ color: C.inkSoft, fontSize: 14, maxWidth: 380, margin: "0 auto" }}>Public browsing isn't connected yet. Properties agents choose to share will appear here.</div>
      </div>
    </div>
  );
}
