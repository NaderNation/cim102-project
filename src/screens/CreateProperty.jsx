import React, { useRef } from "react";
import { C } from "../theme.js";
import Field from "../components/Field.jsx";

export default function CreateProperty({ draft, onChange, onImportFiles, importNotice, onSubmit, error }) {
  const importInputRef = useRef(null);
  return (
    <div className="max-w-lg">
      <div style={{ color: C.brassDark, fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }} className="text-xs font-bold tracking-widest mb-2">
        STEP 1 OF 3
      </div>
      <h1 style={{ color: C.ink }} className="text-3xl font-bold mb-6">
        Property details
      </h1>
      <div style={{ borderColor: C.line, background: C.paperDim }} className="border rounded-sm p-6">
        <Field label="ADDRESS" value={draft.address} onChange={onChange("address")} placeholder="123 Ocean Ave, Miami, FL" />
        <label className="block mb-4">
          <span style={{ color: C.inkSoft, fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }} className="text-xs font-bold tracking-wide block mb-1.5">
            PROPERTY TYPE
          </span>
          <select
            value={draft.propertyType}
            onChange={onChange("propertyType")}
            style={{ borderColor: C.line, background: C.paperDim, color: C.ink, fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }}
            className="w-full border rounded-sm px-3 py-2.5 text-sm outline-none"
          >
            <option value="House">House</option>
            <option value="Apartment">Apartment</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Field label="PRICE" value={draft.price} onChange={onChange("price")} placeholder="649000" />
          <Field label="SQ FT" value={draft.sqft} onChange={onChange("sqft")} placeholder="2100" />
          <Field label="BEDS" value={draft.beds} onChange={onChange("beds")} placeholder="3" />
          <Field label="BATHS" value={draft.baths} onChange={onChange("baths")} placeholder="2" />
        </div>
        <div style={{ borderColor: C.line, background: C.paperDim }} className="border rounded-sm p-3 mb-4">
          <div style={{ color: C.ink, fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }} className="text-sm font-bold mb-1">
            Import property files
          </div>
          <div style={{ color: C.inkSoft, fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }} className="text-xs mb-3">
            Select photos and housing specs together. We will sort them automatically.
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,.csv,.jpg,.jpeg,.png,.webp,image/*,application/json,text/csv"
            multiple
            className="hidden"
            onChange={(e) => {
              onImportFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            style={{ borderColor: C.brass, color: C.brassDark, fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }}
            className="border rounded-sm px-3 py-2 text-xs font-bold hover:opacity-80"
          >
            Choose files
          </button>
          {importNotice && (
            <div style={{ color: importNotice.includes("could not") || importNotice.includes("No supported") ? "#F3B9B0" : C.forest, fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }} className="text-xs font-semibold mt-2">
              {importNotice}
            </div>
          )}
          {draft.roomSpecs?.length > 0 && (
            <div style={{ color: C.inkSoft, fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }} className="text-[10px] mt-2">
              {draft.roomSpecs.length} room{draft.roomSpecs.length === 1 ? "" : "s"} ready for the floor plan
            </div>
          )}
        </div>
        {error && (
          <div style={{ color: "#F3B9B0", fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }} className="text-xs font-semibold mb-3">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={onSubmit}
          style={{ background: C.brass, color: "#FFFFFF", fontFamily: "'Urbanist', 'DM Sans', Arial, sans-serif" }}
          className="w-full mt-2 py-3 rounded-sm text-sm font-bold hover:opacity-90 transition"
        >
          Continue to photos →
        </button>
      </div>
    </div>
  );
}
