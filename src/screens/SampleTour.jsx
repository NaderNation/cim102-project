import React, { useMemo, useState } from "react";
import { Globe2 } from "../icons.jsx";
import { C, SANS, SERIF } from "../theme.js";
import SplatViewer from "../components/SplatViewer.jsx";

export default function SampleTour({ listing, onBack, backLabel = "Back to listing" }) {
  const [showAlternate, setShowAlternate] = useState(false);
  const activeUrl = showAlternate ? listing.alternateTourUrl : listing.tourUrl;
  const world = useMemo(() => ({
    world_id: `${listing.id}${showAlternate ? "-alternate" : ""}`,
    display_name: listing.title,
    assets: { splats: { spz_urls: { full_res: activeUrl } } },
  }), [listing.id, listing.title, activeUrl, showAlternate]);

  return (
    <div>
      <button onClick={onBack} className="ef-text-back">← {backLabel}</button>
      <div style={{ color: C.brassDark, fontFamily: SANS }} className="text-xs font-bold tracking-widest flex items-center gap-2">
        <Globe2 size={14} /> PREPARED DEMO TOUR
      </div>
      <h1 style={{ color: C.ink, fontFamily: SERIF }} className="text-3xl sm:text-4xl mt-2 mb-2">Walk through {listing.title}</h1>
      <p style={{ color: C.inkSoft, fontFamily: SANS }} className="text-sm mb-6 max-w-2xl">
        This prebuilt scene loads from the website. It skips the live generation request while still showing how a visitor can look around and move through a reconstructed interior.
      </p>
      {listing.alternateTourUrl && (
        <div className="ef-tour-choices" role="group" aria-label="Prepared scene choices">
          <button className={!showAlternate ? "is-selected" : ""} onClick={() => setShowAlternate(false)}>Working house interior</button>
          <button className={showAlternate ? "is-selected" : ""} onClick={() => setShowAlternate(true)}>Alternate supplied scan</button>
        </div>
      )}
      {showAlternate && <p className="ef-scan-note">This second supplied scan currently appears incomplete in the viewer. It is included for comparison; use the working interior for the class walkthrough.</p>}
      <SplatViewer key={activeUrl} world={world} url={activeUrl} label={listing.title} />
      <p style={{ color: C.inkSoft, fontFamily: SANS }} className="text-xs mt-4 max-w-2xl">
        Illustrative demo: the interior, exterior photo and location are separate sample assets. A real listing would need verified property imagery and details.
      </p>
    </div>
  );
}
