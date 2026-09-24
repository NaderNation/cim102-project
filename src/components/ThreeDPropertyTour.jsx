import React, { useState, useRef, useEffect } from "react";
import { C } from "../theme.js";
import { buildTourRooms, layoutTourRooms } from "../lib/tour.js";

export default function ThreeDPropertyTour({ draft, photos }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const layout = layoutTourRooms(buildTourRooms(draft, photos).slice(0, 12));
  const rooms = layout.rooms;
  const [activeRoom, setActiveRoom] = useState(0);
  const selectedRoom = rooms[activeRoom];
  const selectedPhoto = photos.find((photo) => photo.roomType === selectedRoom?.name);

  useEffect(() => {
    if (!mountRef.current || !rooms.length || typeof THREE === "undefined") return undefined;
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = 440;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#17201d");
    const camera = new THREE.PerspectiveCamera(rooms[activeRoom]?.design?.camera?.fov || 48, width / height, 0.1, 1000);
    camera.position.set(14, 15, 16);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.replaceChildren(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const lighting = rooms[activeRoom]?.design?.lighting;
    const skyColor = lighting === "warm" ? 0xffe0b2 : lighting === "cool" ? 0xd7e7ff : 0xf8fbf8;
    scene.add(new THREE.HemisphereLight(skyColor, 0x17201d, lighting === "natural" ? 2.6 : 2.1));
    const keyLight = new THREE.DirectionalLight(skyColor, lighting === "natural" ? 3 : 2.5);
    keyLight.position.set(8, 18, 10);
    scene.add(keyLight);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(32, layout.width + 8), Math.max(26, layout.depth + 8)),
      new THREE.MeshStandardMaterial({ color: 0xe8eee9, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const group = new THREE.Group();
    const roomMeshes = [];
    rooms.forEach((room, index) => {
      const x = room.x;
      const z = room.z;
      const roomWidth = room.width;
      const roomDepth = room.depth;
      const floorColor = room.floorColor || room.design?.floorColor || (index === activeRoom ? 0x1d4d43 : 0xb9cec1);
      const material = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.72, transparent: true, opacity: 0.9 });
      const roomMesh = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.35, roomDepth), material);
      roomMesh.position.set(x, 0.2, z);
      roomMesh.userData.roomIndex = index;
      group.add(roomMesh);
      const wallMaterial = new THREE.MeshStandardMaterial({ color: room.wallColor || room.design?.wallColor || (index === activeRoom ? 0xd8b675 : 0x33544a), transparent: true, opacity: 0.52 });
      const walls = [
        [roomWidth, 2.8, 0.16, x, 1.4, z - roomDepth / 2],
        [roomWidth, 2.8, 0.16, x, 1.4, z + roomDepth / 2],
        [0.16, 2.8, roomDepth, x - roomWidth / 2, 1.4, z],
        [0.16, 2.8, roomDepth, x + roomWidth / 2, 1.4, z],
      ].map(([wallWidth, wallHeight, wallDepth, wallX, wallY, wallZ]) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth), wallMaterial);
        wall.position.set(wallX, wallY, wallZ);
        wall.userData.roomIndex = index;
        group.add(wall);
        return wall;
      });
      if (room.photo?.dataUrl) {
        const texture = new THREE.TextureLoader().load(room.photo.dataUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
        const photoMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
        const photoPlane = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(2.4, roomWidth * 0.72), Math.max(1.5, roomDepth * 0.42)), photoMaterial);
        photoPlane.rotation.x = -Math.PI / 2;
        photoPlane.position.set(x, 0.42, z);
        photoPlane.userData.roomIndex = index;
        group.add(photoPlane);
      }
      roomMeshes.push({ roomMesh, walls, x, z });
    });
    scene.add(group);
    sceneRef.current = { camera, renderer, scene, group, roomMeshes };

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let yaw = 0.72;
    let pitch = 0.72;
    let distance = 25;
    const updateCamera = () => {
      const target = roomMeshes[activeRoom] || roomMeshes[0];
      const targetX = target?.x || 0;
      const targetZ = target?.z || 0;
      camera.position.set(
        targetX + Math.sin(yaw) * Math.cos(pitch) * distance,
        Math.sin(pitch) * distance,
        targetZ + Math.cos(yaw) * Math.cos(pitch) * distance
      );
      camera.lookAt(targetX, 0, targetZ);
    };
    updateCamera();
    const onPointerDown = (event) => { dragging = true; lastX = event.clientX; lastY = event.clientY; renderer.domElement.setPointerCapture(event.pointerId); };
    const onPointerMove = (event) => {
      if (!dragging) return;
      yaw -= (event.clientX - lastX) * 0.008;
      pitch = Math.max(0.28, Math.min(1.35, pitch + (event.clientY - lastY) * 0.008));
      lastX = event.clientX;
      lastY = event.clientY;
      updateCamera();
    };
    const onPointerUp = () => { dragging = false; };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onClick = (event) => {
      if (Math.abs(event.clientX - lastX) > 4 || Math.abs(event.clientY - lastY) > 4) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(group.children, false).find((item) => item.object.userData.roomIndex !== undefined);
      if (hit) setActiveRoom(hit.object.userData.roomIndex);
    };
    const onWheel = (event) => { distance = Math.max(12, Math.min(38, distance + event.deltaY * 0.02)); updateCamera(); };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });
    let animationFrame;
    const animate = () => { animationFrame = requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();
    const resize = () => { const nextWidth = mount.clientWidth; camera.aspect = nextWidth / height; camera.updateProjectionMatrix(); renderer.setSize(nextWidth, height); };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.dispose();
      mount.replaceChildren();
    };
  }, [rooms.length, activeRoom]);

  if (!rooms.length) return null;
  return (
    <section style={{ borderColor: C.line, background: C.card }} className="border rounded-sm overflow-hidden mb-10">
      <div className="p-6 pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div style={{ color: C.brassDark }} className="text-xs font-bold tracking-widest">3D PROPERTY MODEL</div>
          <h2 style={{ color: C.ink }} className="text-3xl mt-2">Explore the {draft.propertyType?.toLowerCase() || "property"}</h2>
          <p style={{ color: C.inkSoft }} className="text-sm mt-2">Drag to orbit. Scroll to zoom. Select a room to move through the layout.</p>
        </div>
        <div style={{ color: C.forest, background: C.paperDim }} className="text-xs font-bold px-3 py-2 rounded-full">Three.js model</div>
      </div>
      <div className="px-6 pb-6">
        <div ref={mountRef} className="w-full h-[440px] rounded-[18px] overflow-hidden" />
        <div style={{ background: C.paperDim, borderColor: C.line }} className="border rounded-xl mt-4 p-4 flex gap-4 items-center">
          {selectedPhoto ? (
            <img src={selectedPhoto.dataUrl} alt={`${selectedRoom.name} reference`} className="w-24 h-20 object-cover rounded-lg flex-none" />
          ) : (
            <div style={{ background: C.brass, color: "white" }} className="w-24 h-20 rounded-lg flex items-center justify-center text-xs font-bold text-center flex-none">MODEL<br />VIEW</div>
          )}
          <div>
            <div style={{ color: C.ink }} className="font-bold">{selectedRoom.name}</div>
            <div style={{ color: C.inkSoft }} className="text-xs mt-1">{selectedRoom.length} × {selectedRoom.width} ft · {(selectedRoom.length * selectedRoom.width).toLocaleString()} sq ft</div>
            {(selectedRoom.style || selectedRoom.design?.style) && <div style={{ color: C.inkSoft }} className="text-xs mt-1">Design: {selectedRoom.style || selectedRoom.design.style}</div>}
            {selectedRoom.design?.lighting && selectedRoom.design.lighting !== "unclear" && <div style={{ color: C.inkSoft }} className="text-xs mt-1">Lighting: {selectedRoom.design.lighting}</div>}
            <div style={{ color: C.inkSoft }} className="text-xs mt-1">Click a room volume to focus it. Photo-linked rooms show their analyzed reference image.</div>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pt-4">
          {rooms.map((room, index) => (
            <button key={`${room.name}-${index}`} onClick={() => setActiveRoom(index)} style={{ background: index === activeRoom ? C.brass : C.paperDim, color: index === activeRoom ? "#fff" : C.ink }} className="flex-none rounded-full px-3 py-2 text-xs font-bold">
              {room.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
