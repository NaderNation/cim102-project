import React from "react";
import { Globe2, Home, Plus } from "../icons.jsx";
import { formatPrice } from "../lib/format.js";
import MovingHouseCollage from "../components/MovingHouseCollage.jsx";

export default function Dashboard({ properties, onCreate, onSampleTour }) {
  const photoCount = properties.reduce((sum, property) => sum + (Number(property.photoCount) || 0), 0);
  const adCount = properties.reduce((sum, property) => sum + (Number(property.adCount) || 0), 0);
  const stats = [
    { label: "Listings", value: properties.length },
    { label: "Photos", value: photoCount },
    { label: "Ads ready", value: adCount },
  ];

  return (
    <div>
      <section className="ef-dashboard-hero" aria-labelledby="home-heading">
        <div className="ef-hero-copy">
          <div className="ef-section-kicker">YOUR PROPERTY WORKSPACE</div>
          <h1 id="home-heading">Present every property with clarity.</h1>
          <p>Build a listing, organize its photos, and prepare materials to share with clients.</p>
          <div className="ef-hero-actions">
            <button className="ef-primary-button" onClick={onCreate}><Plus size={17} /> Create property</button>
            <a className="ef-secondary-button" href="#listings-heading">View listings</a>
          </div>
          <div className="ef-hero-stats" aria-label="Workspace totals">
            {stats.map(({ label, value }) => (
              <div key={label} className="ef-hero-stat">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <MovingHouseCollage />
      </section>

      <button className="ef-tour-prompt" onClick={onSampleTour}>
        <span className="ef-tour-icon"><Globe2 size={20} /></span>
        <span className="ef-tour-copy">
          <strong>Explore a finished property tour</strong>
          <span>See how a property walkthrough looks before creating your own.</span>
        </span>
        <span className="ef-tour-action">Open tour <span aria-hidden="true">→</span></span>
      </button>

      <section aria-labelledby="listings-heading" className="ef-listings-section">
        <div className="ef-section-heading">
          <div>
            <div className="ef-section-kicker">PROPERTY PORTFOLIO</div>
            <h2 id="listings-heading">Your properties</h2>
            <p>All of the properties saved in this browser.</p>
          </div>
          {properties.length > 0 && <span className="ef-listing-count">{properties.length} listing{properties.length === 1 ? "" : "s"}</span>}
        </div>

        {properties.length === 0 ? (
          <div className="ef-empty-listings">
            <span className="ef-empty-icon"><Home size={25} /></span>
            <div>
              <h3>No properties yet</h3>
              <p>Add details and photos to create your first listing.</p>
            </div>
            <button className="ef-primary-button" onClick={onCreate}>Create your first property</button>
          </div>
        ) : (
          <div className="ef-property-grid">
            {properties.map((property) => (
              <article key={property.id} className="ef-property-card">
                {property.coverDataUrl ? (
                  <img src={property.coverDataUrl} alt="" className="ef-property-cover" />
                ) : (
                  <div className="ef-property-cover ef-property-placeholder" aria-hidden="true" />
                )}
                <div className="ef-property-body">
                  <span className="ef-property-type">{property.propertyType || "Property"}</span>
                  <h3>{property.address || "Address not added"}</h3>
                  {(property.beds || property.baths || property.sqft) && (
                    <div className="ef-property-features">
                      {property.beds && <span>{property.beds} beds</span>}
                      {property.baths && <span>{property.baths} baths</span>}
                      {property.sqft && <span>{property.sqft} sq ft</span>}
                    </div>
                  )}
                  <div className="ef-property-bottom">
                    <div><small>Price</small><strong>{formatPrice(property.price)}</strong></div>
                    <span>{property.photoCount || 0} photos · {property.adCount || 0} ads</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
