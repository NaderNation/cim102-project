import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { SplatMesh, SplatFileType, SparkRenderer } from "@sparkjsdev/spark";
import { Loader2, AlertCircle } from "../icons.jsx";
import { C, SANS } from "../theme.js";
import { splatFetchUrl, splatPlacement, formatBytes } from "../lib/splat.js";
import { hasBackend } from "../lib/backend.js";

// Walk speed in metres per second, and how far the camera may stray from where
// it started. Marble reconstructions are a bubble; past its edge the scene
// visibly falls apart, so the camera is eased back rather than let out.
const WALK_SPEED = 2.4;
const RUN_MULTIPLIER = 2.2;
const ROAM_RADIUS_M = 6;
const LOOK_SENSITIVITY = 0.0022;
const PITCH_LIMIT = Math.PI / 2 - 0.05;

/**
 * Fetch with progress. The splat can be tens of megabytes, so an indeterminate
 * spinner is not good enough — the viewer reports real percentages.
 */
async function fetchSplatWithProgress(url, onProgress, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Could not load the 3D scene (${response.status}).`);
  const total = Number(response.headers.get("content-length")) || 0;
  if (!response.body || !total) {
    const buffer = await response.arrayBuffer();
    onProgress({ loaded: buffer.byteLength, total: buffer.byteLength, percent: 100 });
    return new Uint8Array(buffer);
  }
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress({ loaded, total, percent: Math.round((loaded / total) * 100) });
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

export default function SplatViewer({ world, url, label }) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [progress, setProgress] = useState({ percent: 0, loaded: 0, total: 0 });
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);

  const [backend, setBackend] = useState(null);
  useEffect(() => { hasBackend().then(setBackend); }, []);

  // Wait for detection before choosing a URL, so the splat is never fetched
  // through a proxy that does not exist (or fetched twice).
  const source = backend === null ? null : splatFetchUrl(url || null, { backend });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !source) return undefined;

    let disposed = false;
    let frame = 0;
    const controller = new AbortController();
    const { scale, eyeHeight } = splatPlacement(world);

    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.05, 400);
    camera.position.set(0, eyeHeight, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x0d1512, 1);
    // Spark draws splats through a SparkRenderer that must live in the scene:
    // a SplatMesh on its own renders nothing at all.
    const spark = new SparkRenderer({ renderer });
    scene.add(spark);

    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    // --- look ---
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    const onMouseMove = (event) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= event.movementX * LOOK_SENSITIVITY;
      euler.x -= event.movementY * LOOK_SENSITIVITY;
      euler.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, euler.x));
      camera.quaternion.setFromEuler(euler);
    };

    // --- move ---
    const keys = new Set();
    const MOVEMENT_KEYS = new Set([
      "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    ]);
    const onKeyDown = (event) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      // Arrow keys scroll the page otherwise, yanking the viewport while walking.
      if (MOVEMENT_KEYS.has(event.code)) event.preventDefault();
      keys.add(event.code);
    };
    const onKeyUp = (event) => keys.delete(event.code);

    const requestLock = () => renderer.domElement.requestPointerLock?.();
    const onLockChange = () => {
      const isLocked = document.pointerLockElement === renderer.domElement;
      setLocked(isLocked);
      if (!isLocked) keys.clear(); // otherwise a key held during exit sticks
    };

    renderer.domElement.addEventListener("click", requestLock);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    const onResize = () => {
      if (disposed) return;
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const origin = new THREE.Vector3(0, eyeHeight, 0);
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const clock = new THREE.Clock();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const speed = WALK_SPEED * (keys.has("ShiftLeft") || keys.has("ShiftRight") ? RUN_MULTIPLIER : 1) * delta;

      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() > 0) forward.normalize();
      right.crossVectors(forward, camera.up).normalize();

      if (keys.has("KeyW") || keys.has("ArrowUp")) camera.position.addScaledVector(forward, speed);
      if (keys.has("KeyS") || keys.has("ArrowDown")) camera.position.addScaledVector(forward, -speed);
      if (keys.has("KeyD") || keys.has("ArrowRight")) camera.position.addScaledVector(right, speed);
      if (keys.has("KeyA") || keys.has("ArrowLeft")) camera.position.addScaledVector(right, -speed);

      // Stay at eye height and inside the reconstructed bubble.
      camera.position.y = eyeHeight;
      const offset = camera.position.clone().sub(origin);
      offset.y = 0;
      if (offset.length() > ROAM_RADIUS_M) {
        offset.setLength(ROAM_RADIUS_M);
        camera.position.set(origin.x + offset.x, eyeHeight, origin.z + offset.z);
      }

      renderer.render(scene, camera);
    };

    setStatus("loading");
    setError("");
    setProgress({ percent: 0, loaded: 0, total: 0 });

    fetchSplatWithProgress(source, setProgress, controller.signal)
      .then((fileBytes) => {
        if (disposed) return;
        // Spark infers the format from the URL extension, which a blob: URL does
        // not have — so hand it the bytes and say what they are.
        const splat = new SplatMesh({ fileBytes, fileType: SplatFileType.SPZ });
        splat.scale.setScalar(scale);
        // Marble splats are authored Y-down relative to three.js. Verified
        // against the sample world: without this the scene renders inverted.
        splat.rotation.x = Math.PI;
        scene.add(splat);
        animate();
        splat.initialized
          .then(() => { if (!disposed) setStatus("ready"); })
          .catch(() => { if (!disposed) { setError("The 3D scene could not be decoded."); setStatus("error"); } });
      })
      .catch((loadError) => {
        if (disposed || loadError.name === "AbortError") return;
        setError(loadError.message || "The 3D scene could not be loaded.");
        setStatus("error");
      });

    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("click", requestLock);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock?.();
      scene.traverse((object) => object.dispose?.());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [source, world]);

  const exitLook = useCallback(() => document.exitPointerLock?.(), []);

  if (!source) return null;

  return (
    <div className="w-full">
      <div
        ref={mountRef}
        style={{ background: "#0D1512", height: 420 }}
        className="relative w-full rounded-[18px] overflow-hidden"
        role="application"
        aria-label={label ? `3D walkthrough of ${label}` : "3D walkthrough"}
      >
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <Loader2 size={26} className="animate-spin" style={{ color: "#FFFFFF" }} />
            <div style={{ color: "#FFFFFF", fontFamily: SANS }} className="text-sm">
              Loading the 3D scene… {progress.percent > 0 ? `${progress.percent}%` : ""}
            </div>
            <div style={{ width: 220, height: 4, background: "rgba(255,255,255,.18)", borderRadius: 2 }}>
              <div style={{ width: `${progress.percent}%`, height: "100%", background: C.brass, borderRadius: 2, transition: "width .2s" }} />
            </div>
            {progress.total > 0 && (
              <div style={{ color: "rgba(255,255,255,.55)", fontFamily: SANS }} className="text-xs">
                {formatBytes(progress.loaded)} of {formatBytes(progress.total)}
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-8">
            <AlertCircle size={20} style={{ color: "#F3B9B0" }} />
            <div style={{ color: "#F3B9B0", fontFamily: SANS }} className="text-sm max-w-md">{error}</div>
          </div>
        )}

        {status === "ready" && !locked && (
          <button
            onClick={() => mountRef.current?.querySelector("canvas")?.requestPointerLock?.()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: "rgba(13,21,18,.55)", border: "none", cursor: "pointer" }}
          >
            <span style={{ color: "#FFFFFF", fontFamily: SANS }} className="text-base font-bold">Click to walk through</span>
            <span style={{ color: "rgba(255,255,255,.7)", fontFamily: SANS }} className="text-xs">
              W A S D or arrow keys to move · mouse to look · Shift to move faster · Esc to stop
            </span>
          </button>
        )}
      </div>

      {status === "ready" && locked && (
        <div className="flex items-center justify-between gap-4 mt-2">
          <span style={{ color: C.inkSoft, fontFamily: SANS }} className="text-xs">
            W A S D to move · mouse to look · Shift to move faster · Esc to stop
          </span>
          <button onClick={exitLook} style={{ color: C.brassDark, fontFamily: SANS }} className="text-xs font-bold underline">
            Stop walking
          </button>
        </div>
      )}
    </div>
  );
}
