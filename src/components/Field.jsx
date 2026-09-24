import React from "react";
import { C } from "../theme.js";

export default function Field({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span style={{ color: C.inkSoft, fontFamily: "Arial, sans-serif" }} className="text-xs font-bold tracking-wide block mb-1.5">
        {label}
      </span>
      <input
        {...props}
        style={{ borderColor: C.line, background: "#FBF9F4", color: C.ink, fontFamily: "Arial, sans-serif" }}
        className="w-full border rounded-sm px-3 py-2.5 text-sm outline-none focus:ring-2"
      />
    </label>
  );
}
