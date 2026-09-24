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
  const [active, setActive] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockUnavailable, setLockUnavailable] = useState(false);
  const activeRef = useRef(false);
  const controlsRef = useRef(null);

  const bundledScene = typeof url === "string" && url.startsWith("/");
  const [backend, setBackend] = useState(null);
  useEffect(() => {
    if (bundledScene) return undefined;
    let active = true;
    hasBackend().then((available) => { if (active) setBackend(available); });
    return () => { active = false; };
  }, [bundledScene]);

  // Bundled scenes use their local URL immediately. Remote scenes wait for
  // backend detection so they are not fetched through the wrong route.
  const source = bundledScene ? url : backend === null ? null : splatFetchUrl(url || null, { backend });

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
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";

    activeRef.current = false;
    setActive(false);
    setLocked(false);
    setLockUnavailable(false);

    // --- look ---
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    const look = (dx, dy) => {
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= dx * LOOK_SENSITIVITY;
      euler.x -= dy * LOOK_SENSITIVITY;
      euler.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, euler.x));
      camera.quaternion.setFromEuler(euler);
    };
    const onMouseMove = (event) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      look(event.movementX, event.movementY);
    };
    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    const onPointerDown = (event) => {
      if (!activeRef.current || document.pointerLockElement === renderer.domElement) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture?.(event.pointerId);
      renderer.domElement.style.cursor = "grabbing";
      mount.focus({ preventScroll: true });
    };
    const onPointerMove = (event) => {
      if (!dragging) return;
      look(event.clientX - previousX, event.clientY - previousY);
      previousX = event.clientX;
      previousY = event.clientY;
    };
    const onPointerUp = (event) => {
      dragging = false;
      renderer.domElement.style.cursor = "grab";
      if (renderer.domElement.hasPointerCapture?.(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    };

    // --- move ---
    const keys = new Set();
    const MOVEMENT_KEYS = new Set([
      "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    ]);
    const onKeyDown = (event) => {
      if (!activeRef.current || (document.pointerLockElement !== renderer.domElement && !mount.contains(document.activeElement))) return;
      if (event.code === "Escape" && document.pointerLockElement !== renderer.domElement) {
        activeRef.current = false;
        keys.clear();
        setActive(false);
        return;
      }
      if (!MOVEMENT_KEYS.has(event.code) && event.code !== "ShiftLeft" && event.code !== "ShiftRight") return;
      // Arrow keys scroll the page otherwise, yanking the viewport while walking.
      if (MOVEMENT_KEYS.has(event.code)) event.preventDefault();
      keys.add(event.code);
    };
    const onKeyUp = (event) => keys.delete(event.code);
    const onWindowBlur = () => keys.clear();

    const requestLock = () => {
      mount.focus({ preventScroll: true });
      if (!renderer.domElement.requestPointerLock) {
        setLockUnavailable(true);
        return;
      }
      try {
        renderer.domElement.requestPointerLock()?.catch?.(() => setLockUnavailable(true));
      } catch {
        setLockUnavailable(true);
      }
    };
    const onLockChange = () => {
      const isLocked = document.pointerLockElement === renderer.domElement;
      setLocked(isLocked);
      if (!isLocked) keys.clear(); // otherwise a key held during exit sticks
    };
    const onLockError = () => setLockUnavailable(true);

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointerlockerror", onLockError);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);

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

    const keepInBounds = () => {
      camera.position.y = eyeHeight;
      const offset = camera.position.clone().sub(origin);
      offset.y = 0;
      if (offset.length() > ROAM_RADIUS_M) {
        offset.setLength(ROAM_RADIUS_M);
        camera.position.set(origin.x + offset.x, eyeHeight, origin.z + offset.z);
      }
    };

    const move = (code, distance) => {
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() > 0) forward.normalize();
      right.crossVectors(forward, camera.up).normalize();
      if (code === "KeyW" || code === "ArrowUp") camera.position.addScaledVector(forward, distance);
      if (code === "KeyS" || code === "ArrowDown") camera.position.addScaledVector(forward, -distance);
      if (code === "KeyD" || code === "ArrowRight") camera.position.addScaledVector(right, distance);
      if (code === "KeyA" || code === "ArrowLeft") camera.position.addScaledVector(right, -distance);
      keepInBounds();
    };
    controlsRef.current = {
      step: (code) => { move(code, 0.55); mount.focus({ preventScroll: true }); },
      clearKeys: () => keys.clear(),
      requestLock,
      reset: () => { camera.position.copy(origin); camera.rotation.set(0, 0, 0); mount.focus({ preventScroll: true }); },
    };

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const speed = WALK_SPEED * (keys.has("ShiftLeft") || keys.has("ShiftRight") ? RUN_MULTIPLIER : 1) * delta;

      if (activeRef.current) {
        if (keys.has("KeyW") || keys.has("ArrowUp")) move("KeyW", speed);
        if (keys.has("KeyS") || keys.has("ArrowDown")) move("KeyS", speed);
        if (keys.has("KeyD") || keys.has("ArrowRight")) move("KeyD", speed);
        if (keys.has("KeyA") || keys.has("ArrowLeft")) move("KeyA", speed);
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
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockError);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("resize", onResize);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock?.();
      scene.traverse((object) => object.dispose?.());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      controlsRef.current = null;
    };
  }, [source, world]);

  const exitLook = useCallback(() => document.exitPointerLock?.(), []);

  const startExploring = () => {
    activeRef.current = true;
    setActive(true);
    mountRef.current?.focus({ preventScroll: true });
  };

  const pauseExploring = () => {
    activeRef.current = false;
    controlsRef.current?.clearKeys();
    exitLook();
    setActive(false);
  };

  if (!source) return null;

  return (
    <div className="w-full">
      <div
        ref={mountRef}
        style={{ background: "#0D1512", height: 420 }}
        className="relative w-full rounded-[18px] overflow-hidden"
        role="application"
        aria-label={label ? `3D walkthrough of ${label}` : "3D walkthrough"}
        tabIndex={0}
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

        {status === "ready" && !active && (
          <button
            onClick={startExploring}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: "rgba(13,21,18,.55)", border: "none", cursor: "pointer" }}
          >
            <span style={{ color: "#FFFFFF", fontFamily: SANS }} className="text-base font-bold">Start exploring</span>
            <span style={{ color: "rgba(255,255,255,.7)", fontFamily: SANS }} className="text-xs">
              Drag to look · W A S D or arrow keys to move
            </span>
          </button>
        )}
        {status === "ready" && active && (
          <div className="ef-viewer-pad" aria-label="Walkthrough movement controls">
            <button aria-label="Move forward" onClick={() => controlsRef.current?.step("KeyW")}>↑</button>
            <div>
              <button aria-label="Move left" onClick={() => controlsRef.current?.step("KeyA")}>←</button>
              <button aria-label="Move backward" onClick={() => controlsRef.current?.step("KeyS")}>↓</button>
              <button aria-label="Move right" onClick={() => controlsRef.current?.step("KeyD")}>→</button>
            </div>
          </div>
        )}
      </div>

      {status === "ready" && active && (
        <div className="ef-viewer-toolbar">
          <span>{locked ? "Mouse look active · Esc to release" : "Drag to look · W A S D or arrows to walk · Shift to move faster"}</span>
          <div>
            <button onClick={() => controlsRef.current?.reset()}>Reset view</button>
            {!locked && !lockUnavailable && <button onClick={() => controlsRef.current?.requestLock()}>Use mouse look</button>}
            <button onClick={pauseExploring}>Pause</button>
          </div>
        </div>
      )}
    </div>
  );
}
