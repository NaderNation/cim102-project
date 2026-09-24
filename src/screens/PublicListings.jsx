import React from "react";
import { C, SANS, SERIF } from "../theme.js";
import { formatPrice } from "../lib/format.js";
import { FEATURED_HOME, demoListingFor } from "../lib/demoListings.js";

export default function PublicListings({ properties, onOpenProperty }) {
  const listings = [FEATURED_HOME, ...properties];
  return (
    <div>
      <div style={{ color: C.brassDark, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", marginBottom: 8 }}>EXPLORE</div>
      <h1 style={{ color: C.ink, fontFamily: SERIF, fontWeight: 700, margin: "0 0 10px" }} className="text-3xl sm:text-4xl">Explore homes</h1>
      <p style={{ color: C.inkSoft, fontFamily: SANS }} className="mb-6 text-sm">Open a listing, check its location, and preview an available walkthrough before visiting.</p>
      <div className="ef-property-grid">
        {listings.map((property) => {
          const demo = property.id === FEATURED_HOME.id ? FEATURED_HOME : demoListingFor(property);
          return (
            <article key={property.id} className="ef-property-card">
              {(property.coverDataUrl || property.coverUrl || demo?.coverUrl) ? <img src={property.coverDataUrl || property.coverUrl || demo.coverUrl} alt="" className="ef-property-cover" /> : <div className="ef-property-cover ef-property-placeholder" />}
              <div className="ef-property-body">
                <span className="ef-property-type">{demo ? "Illustrative demo" : "Saved on this device"}</span>
                <h3>{demo?.title || property.address || "Untitled property"}</h3>
                <p className="ef-catalog-address">{property.address}</p>
                <div className="ef-property-features"><span>{property.beds || "—"} beds</span><span>{property.baths || "—"} baths</span><span>{property.sqft || "—"} sq ft</span></div>
                <div className="ef-property-bottom"><div><small>{demo ? "Sample price" : "Price"}</small><strong>{formatPrice(property.price)}</strong></div></div>
                <button className="ef-card-link" onClick={() => onOpenProperty(property)}>View listing →</button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="ef-catalog-note">The featured listing is included for everyone. Properties you add are visible only in this browser until shared storage is connected.</p>
    </div>
  );
}
