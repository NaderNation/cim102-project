import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import "./index.css";
import App from "./App.jsx";

window.THREE = THREE; // the app's 3D avatar and tour read THREE as a global

createRoot(document.getElementById("root")).render(<App />);
