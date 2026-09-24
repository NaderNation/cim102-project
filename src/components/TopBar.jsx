import React, { useEffect, useRef, useState } from "react";
import { Building2, Plus } from "../icons.jsx";

export default function TopBar({ view, onDashboard, onSelectListings, onCreateAccount, onSettings, onCreate }) {
  const [openMenu, setOpenMenu] = useState(null);
  const listingsRef = useRef(null);
  const mobileRef = useRef(null);

  useEffect(() => {
    if (!openMenu) return undefined;
    const closeOutside = (event) => {
      if (!listingsRef.current?.contains(event.target) && !mobileRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    const closeEscape = (event) => { if (event.key === "Escape") setOpenMenu(null); };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [openMenu]);

  const select = (action) => {
    setOpenMenu(null);
    action();
  };

  return (
    <header className="ef-topbar">
      <div className="ef-topbar-inner">
        <button className="ef-brand" onClick={() => select(onDashboard)} aria-label="EstateFlow home">
          <span className="ef-brand-mark"><Building2 size={18} /></span>
          <span>EstateFlow</span>
        </button>

        <nav className="ef-desktop-nav" aria-label="Main navigation">
          <button className={`ef-nav-link ${view === "dashboard" ? "is-active" : ""}`} onClick={() => select(onDashboard)}>Home</button>
          <div className="ef-menu-anchor" ref={listingsRef}>
            <button
              className={`ef-nav-link ${view === "public" ? "is-active" : ""}`}
              onClick={() => setOpenMenu(openMenu === "listings" ? null : "listings")}
              aria-haspopup="menu"
              aria-expanded={openMenu === "listings"}
            >
              Properties <span aria-hidden="true">⌄</span>
            </button>
            {openMenu === "listings" && (
              <div className="ef-nav-menu" role="menu">
                <button role="menuitem" onClick={() => select(() => onSelectListings("own"))}>Your listings</button>
                <button role="menuitem" onClick={() => select(() => onSelectListings("public"))}>Explore homes</button>
              </div>
            )}
          </div>
          <button className={`ef-nav-link ${view === "settings" ? "is-active" : ""}`} onClick={() => select(onSettings)}>Settings</button>
          <button className="ef-nav-link" onClick={() => select(onCreateAccount)}>Account</button>
        </nav>

        <button className="ef-topbar-cta" onClick={() => select(onCreate)}><Plus size={16} /> New property</button>

        <div className="ef-mobile-nav" ref={mobileRef}>
          <button
            className="ef-mobile-menu-button"
            onClick={() => setOpenMenu(openMenu === "mobile" ? null : "mobile")}
            aria-haspopup="menu"
            aria-expanded={openMenu === "mobile"}
            aria-label="Open navigation menu"
          >
            <span aria-hidden="true">☰</span><span>Menu</span>
          </button>
          {openMenu === "mobile" && (
            <div className="ef-nav-menu ef-mobile-menu" role="menu">
              <button role="menuitem" onClick={() => select(onDashboard)}>Home</button>
              <button role="menuitem" onClick={() => select(() => onSelectListings("own"))}>Your listings</button>
              <button role="menuitem" onClick={() => select(() => onSelectListings("public"))}>Explore homes</button>
              <button role="menuitem" onClick={() => select(onCreate)}>New property</button>
              <button role="menuitem" onClick={() => select(onSettings)}>Settings</button>
              <button role="menuitem" onClick={() => select(onCreateAccount)}>Account</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
