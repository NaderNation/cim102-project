import React from "react";
import { Globe2 } from "../icons.jsx";
import { C, SANS, SERIF } from "../theme.js";
import SplatViewer from "../components/SplatViewer.jsx";

// A pre-generated Marble world shipped with the project. It needs no API key,
// no network, and no generation wait, so the walkthrough can always be shown.
// The file is served from public/ — see README for why it is not committed.
// BASE_URL is "/" locally and "/<repo>/" on GitHub Pages, so this resolves
// correctly whether the app is served from a domain root or a subfolder.
export const SAMPLE_SPLAT_URL = `${import.meta.env.BASE_URL}sample/ceramic.spz`;

// Stands in for a Marble world object. The placement numbers are the defaults
// from lib/splat.js; this sample carries no semantics metadata of its own.
const SAMPLE_WORLD = {
  world_id: "sample-ceramic",
  display_name: "Sample interior",
  assets: { splats: { spz_urls: { full_res: SAMPLE_SPLAT_URL } } },
};

export default function SampleTour({ onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.inkSoft, fontSize: 14, fontFamily: SANS, marginBottom: 18 }}
      >
        ← Back
      </button>

      <div style={{ color: C.brassDark, fontFamily: SANS }} className="text-xs font-bold tracking-widest flex items-center gap-2">
        <Globe2 size={14} /> SAMPLE PROPERTY
      </div>
      <h1 style={{ color: C.ink, fontFamily: SERIF }} className="text-4xl mt-2 mb-2">Walk through a finished tour</h1>
      <p style={{ color: C.inkSoft, fontFamily: SANS }} className="text-sm mb-6 max-w-2xl">
        This is a real World Labs Marble reconstruction, generated from a single photograph and shipped with the
        project. It loads straight from this machine — no API key, no credits, no waiting. It is what a listing
        photo becomes after the Marble step.
      </p>

      <SplatViewer world={SAMPLE_WORLD} url={SAMPLE_SPLAT_URL} label="the sample interior" />

      <p style={{ color: C.inkSoft, fontFamily: SANS }} className="text-xs mt-4 max-w-2xl">
        The scene is a reconstruction, not a measured survey. Detail falls away at the edges of what the original
        photograph could see — walking outward will find that boundary.
      </p>
    </div>
  );
}
