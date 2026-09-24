import React, { useState, useRef, useEffect } from "react";

export default function PanoViewer({ url, thumbnail, alt }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(!url);
  useEffect(() => {
    const mount = mountRef.current;
    if (!url || !mount || typeof THREE === "undefined") { setFailed(true); return undefined; }
    let disposed = false;
    const w = mount.clientWidth || 640, h = mount.clientHeight || 360;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1100);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    const el = renderer.domElement;
    el.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab";
    mount.replaceChildren(el);
    const geometry = new THREE.SphereGeometry(500, 64, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x17201d });
    scene.add(new THREE.Mesh(geometry, material));
    const load = (src, onFail) =>
      new THREE.TextureLoader().setCrossOrigin("anonymous").load(
        src,
        (tex) => { if (disposed) return; tex.colorSpace = THREE.SRGBColorSpace; material.map = tex; material.color.set(0xffffff); material.needsUpdate = true; },
        undefined,
        () => (onFail ? onFail() : !disposed && setFailed(true))
      );
    load(url, () => load(`/api/marble-image?url=${encodeURIComponent(url)}`)); // direct first, then via the backend
    let lon = 0, lat = 0, drag = null;
    const down = (e) => { drag = { x: e.clientX, y: e.clientY, lon, lat }; el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; };
    const move = (e) => { if (!drag) return; lon = drag.lon - (e.clientX - drag.x) * 0.15; lat = Math.max(-85, Math.min(85, drag.lat + (e.clientY - drag.y) * 0.15)); };
    const up = () => { drag = null; el.style.cursor = "grab"; };
    const wheel = (e) => { e.preventDefault(); camera.fov = Math.max(35, Math.min(95, camera.fov + e.deltaY * 0.05)); camera.updateProjectionMatrix(); };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    const onResize = () => { const nw = mount.clientWidth || w, nh = mount.clientHeight || h; renderer.setSize(nw, nh); camera.aspect = nw / nh; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", onResize);
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!drag) lon += 0.03;
      const phi = THREE.MathUtils.degToRad(90 - lat), theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(500 * Math.sin(phi) * Math.cos(theta), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(theta));
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      material.map?.dispose(); material.dispose(); geometry.dispose(); renderer.dispose();
      mount.replaceChildren();
    };
  }, [url]);
  if (failed) return thumbnail ? <img src={thumbnail} alt={alt} className="max-h-72 rounded-lg object-contain" /> : <div style={{ color: "#F3B9B0" }} className="text-sm">The 3D view couldn't load.</div>;
  return <div ref={mountRef} role="img" aria-label={alt} style={{ width: "100%", height: 380, borderRadius: 12, overflow: "hidden", background: "#17201d" }} />;
}
