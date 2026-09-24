import React from "react";
import { Home, Plus } from "../icons.jsx";
import { formatPrice } from "../lib/format.js";
import { FEATURED_HOME, demoListingFor } from "../lib/demoListings.js";
import MovingHouseCollage from "../components/MovingHouseCollage.jsx";

export default function Dashboard({ properties, onCreate, onOpenProperty, onSampleTour }) {
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

      <section className="ef-featured-section" aria-labelledby="featured-heading">
        <div className="ef-section-heading">
          <div><div className="ef-section-kicker">FEATURED DEMO HOME</div><h2 id="featured-heading">Explore a home online</h2><p>Preview a listing and its prepared walkthrough before planning a visit.</p></div>
        </div>
        <div className="ef-featured-card">
          <img src={FEATURED_HOME.coverUrl} alt="Illustrative exterior of Harbor View Residence" />
          <div className="ef-featured-copy">
            <span className="ef-property-type">Illustrative listing</span>
            <h3>{FEATURED_HOME.title}</h3>
            <p>{FEATURED_HOME.address} · {FEATURED_HOME.beds} beds · {FEATURED_HOME.baths} baths · {FEATURED_HOME.sqft} sq ft</p>
            <strong>{formatPrice(FEATURED_HOME.price)}</strong>
            <div className="ef-featured-actions">
              <button className="ef-primary-button" onClick={() => onOpenProperty(FEATURED_HOME)}>View listing</button>
              <button className="ef-secondary-button" onClick={onSampleTour}>Open 3D tour</button>
            </div>
            <small>Photo and 3D interior are illustrative demo assets.</small>
          </div>
        </div>
      </section>

      <section aria-labelledby="listings-heading" className="ef-listings-section">
        <div className="ef-section-heading">
          <div>
            <div className="ef-section-kicker">PROPERTY PORTFOLIO</div>
            <h2 id="listings-heading">Your properties</h2>
            <p>Properties you add are saved in this browser.</p>
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
                {(property.coverDataUrl || property.coverUrl) ? (
                  <img src={property.coverDataUrl || property.coverUrl} alt="" className="ef-property-cover" />
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
                  {demoListingFor(property) && <span className="ef-demo-label">Prepared 3D tour included</span>}
                  <button className="ef-card-link" onClick={() => onOpenProperty(property)}>View property →</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
