import React from "react";
import { C } from "../theme.js";
import { formatPrice } from "../lib/format.js";
import { demoListingFor } from "../lib/demoListings.js";

function mapUrls(latitude, longitude) {
  return {
    full: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=12/${latitude}/${longitude}`,
  };
}

export default function PropertyDetail({ property, onBack, onTour }) {
  const demo = property.id === "sample-harbor-view" ? property : demoListingFor(property);
  const title = demo?.title || property.address;
  const cover = property.coverDataUrl || property.coverUrl || demo?.coverUrl;
  const map = demo ? mapUrls(demo.latitude, demo.longitude) : null;

  return (
    <div className="ef-detail-page">
      <button className="ef-text-back" onClick={onBack}>← Back to homes</button>
      <div className="ef-detail-head">
        <div>
          <div className="ef-section-kicker">{demo ? "ILLUSTRATIVE LISTING" : "SAVED ON THIS DEVICE"}</div>
          <h1>{title}</h1>
          <p>{property.address}</p>
        </div>
        <strong>{formatPrice(property.price)}</strong>
      </div>
      {cover && <img className="ef-detail-cover" src={cover} alt={`Exterior illustration for ${title}`} />}
      <div className="ef-detail-grid">
        <section className="ef-detail-panel">
          <h2>Explore this home</h2>
          <div className="ef-detail-facts">
            <span>{property.beds || "—"} beds</span><span>{property.baths || "—"} baths</span><span>{property.sqft || "—"} sq ft</span>
          </div>
          <p>{demo?.description || "This listing is saved in your browser. Add more photos and listing details to develop the presentation."}</p>
          {demo && <p className="ef-illustrative-note">Demo note: the exterior image, location and 3D interior are illustrative assets. They are not a verified view of one real home.</p>}
          {demo && <button className="ef-primary-button" onClick={onTour}>Open 3D walkthrough</button>}
        </section>
        <section className="ef-detail-panel">
          <h2>Location</h2>
          {map ? (
            <>
              <p>Approximate sample area: {demo.location}</p>
              <a className="ef-map-preview" href={map.full} target="_blank" rel="noopener noreferrer" aria-label={`Open a map of the approximate sample area near ${demo.location}`}>
                <span className="ef-map-pin" aria-hidden="true">⌖</span>
                <strong>{demo.location}</strong>
                <span>Open area map ↗</span>
              </a>
            </>
          ) : <p>A map can be added after this listing has a verified location.</p>}
        </section>
      </div>
    </div>
  );
}
