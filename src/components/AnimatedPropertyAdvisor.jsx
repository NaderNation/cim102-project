import React, { useRef, useEffect } from "react";

const TILE_SVGS = {
  a: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 210 140'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#BFD9EA'/><stop offset='1' stop-color='#EAF3F7'/></linearGradient></defs><rect width='210' height='140' fill='url(#s)'/><rect y='100' width='210' height='40' fill='#8DB596'/><rect x='50' y='52' width='110' height='58' fill='#F3EBDD'/><path d='M40 54 105 16 170 54z' fill='#1D4D43'/><rect x='94' y='76' width='22' height='34' fill='#8A5A3C'/><rect x='62' y='66' width='22' height='18' fill='#9CC3D8'/><rect x='126' y='66' width='22' height='18' fill='#9CC3D8'/></svg>",
  b: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 210 140'><rect width='210' height='140' fill='#E8E4DC'/><rect y='104' width='210' height='36' fill='#B9A78C'/><rect x='118' y='20' width='64' height='56' fill='#BFD9EA' stroke='#fff' stroke-width='5'/><rect x='24' y='70' width='96' height='34' rx='10' fill='#5F7F9C'/><rect x='24' y='58' width='96' height='22' rx='8' fill='#7395B2'/><rect x='60' y='108' width='90' height='10' rx='5' fill='#D9C9A8'/></svg>",
  c: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 210 140'><rect width='210' height='140' fill='#F1F0EA'/><rect y='108' width='210' height='32' fill='#C9BBA0'/><rect x='10' y='18' width='190' height='34' fill='#1D4D43'/><rect x='10' y='70' width='190' height='40' fill='#2E6B5D'/><rect x='40' y='84' width='130' height='24' rx='3' fill='#FBFCFA'/><circle cx='70' cy='8' r='6' fill='#D6B584'/><circle cx='140' cy='8' r='6' fill='#D6B584'/></svg>",
  d: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 210 140'><rect width='210' height='140' fill='#DDE6EE'/><rect y='108' width='210' height='32' fill='#C7B79A'/><rect x='20' y='26' width='92' height='30' rx='6' fill='#8DA6BC'/><rect x='24' y='58' width='150' height='40' rx='8' fill='#F8FBF8'/><rect x='24' y='70' width='150' height='28' rx='8' fill='#B9CEC1'/><rect x='140' y='16' width='50' height='40' fill='#EAF3F7' stroke='#fff' stroke-width='4'/></svg>",
};
const ADVISOR_CSS = `
.advisor-stage{position:relative;height:clamp(220px,34vw,340px);border-radius:28px;overflow:hidden;isolation:isolate;background:linear-gradient(135deg,#E3EEE7 0%,#F4F8F5 55%,#DDE8F2 100%);box-shadow:0 18px 40px rgba(23,32,29,.10)}
.property-collage{position:absolute;inset:-14% -6%;display:flex;flex-direction:column;justify-content:center;gap:16px;transform:rotate(-4deg);opacity:.92;z-index:0}
.property-collage-track{display:flex;gap:16px;width:max-content}
.property-collage-track-one{animation:ef-marquee-left 48s linear infinite}
.property-collage-track-two{animation:ef-marquee-right 56s linear infinite}
.property-tile{flex:0 0 auto;width:210px;height:140px;border-radius:16px;background-size:cover;background-position:center;border:4px solid rgba(255,255,255,.88);box-shadow:0 8px 20px rgba(23,32,29,.16)}
${Object.entries(TILE_SVGS).map(([k, v]) => `.property-tile-${k}{background-image:url("data:image/svg+xml,${encodeURIComponent(v)}")}`).join("\n")}
.advisor-stage::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at 50% 62%,rgba(251,252,250,.6),rgba(251,252,250,0) 62%)}
.advisor-webgl{position:absolute;inset:0;z-index:2}
.advisor-fallback{display:none}
@keyframes ef-marquee-left{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes ef-marquee-right{from{transform:translateX(-50%)}to{transform:translateX(0)}}
@media (prefers-reduced-motion:reduce){.property-collage-track{animation:none}}
`;

export default function AnimatedPropertyAdvisor() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || typeof THREE === "undefined") return undefined;

    const width = mount.clientWidth || 220;
    const height = mount.clientHeight || 180;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 100);
    camera.position.set(0, 1.42, 6.9);
    camera.lookAt(0, 1.12, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.replaceChildren(renderer.domElement);
    mount.closest(".advisor-stage")?.classList.add("has-webgl");

    scene.add(new THREE.HemisphereLight(0xf8fbf8, 0x1d4d43, 2.4));
    const keyLight = new THREE.DirectionalLight(0xffe0b2, 3.2);
    keyLight.position.set(3, 6, 5);
    scene.add(keyLight);

    const avatar = new THREE.Group();
    avatar.position.y = -0.05;
    avatar.scale.setScalar(0.82);
    scene.add(avatar);

    const suit = new THREE.MeshStandardMaterial({ color: 0x1d4d43, roughness: 0.62 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0xf8fbf8, roughness: 0.72 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xc98f6d, roughness: 0.78 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x17201d, roughness: 0.85 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xd6b584, roughness: 0.52, metalness: 0.16 });
    const boardMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fbf8, roughness: 0.84 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 0.78, 5, 12), suit);
    torso.position.y = 0.55;
    torso.scale.set(0.86, 1, 0.58);
    avatar.add(torso);

    const collar = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 4), shirt);
    collar.position.set(0, 1.02, 0.34);
    collar.rotation.x = Math.PI;
    avatar.add(collar);

    const headGroup = new THREE.Group();
    headGroup.position.y = 1.63;
    avatar.add(headGroup);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14), skin);
    head.scale.set(0.88, 1.05, 0.88);
    headGroup.add(head);
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.43, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), hair);
    hairCap.position.y = 0.08;
    hairCap.scale.set(0.98, 0.8, 0.98);
    headGroup.add(hairCap);

    const makeArm = (side) => {
      const arm = new THREE.Group();
      arm.position.set(side * 0.58, 0.78, 0);
      arm.rotation.z = side * -0.18;
      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.62, 4, 8), suit);
      sleeve.position.y = -0.34;
      arm.add(sleeve);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), skin);
      hand.position.y = -0.75;
      arm.add(hand);
      avatar.add(arm);
      return arm;
    };
    const leftArm = makeArm(-1);
    const rightArm = makeArm(1);

    const board = new THREE.Group();
    board.position.set(0.77, 0.35, 0.46);
    board.rotation.set(-0.12, -0.18, -0.12);
    const boardFace = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.07), boardMaterial);
    board.add(boardFace);
    const boardLine = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.045, 0.075), brass);
    boardLine.position.set(-0.08, 0.12, 0.05);
    board.add(boardLine);
    const boardLineTwo = boardLine.clone();
    boardLineTwo.scale.x = 0.68;
    boardLineTwo.position.set(-0.16, -0.02, 0.05);
    board.add(boardLineTwo);
    avatar.add(board);

    const marker = new THREE.Group();
    const markerBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), brass);
    markerBall.position.y = 0.1;
    marker.add(markerBall);
    const markerStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 8), brass);
    markerStem.position.y = -0.08;
    marker.add(markerStem);
    marker.position.set(-1.02, 1.2, 0.2);
    avatar.add(marker);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.94, 1.05, 0.08, 32), new THREE.MeshStandardMaterial({ color: 0xb9cec1, roughness: 0.88 }));
    base.position.y = -0.48;
    avatar.add(base);

    const onResize = () => {
      const w = mount.clientWidth || width, h = mount.clientHeight || height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    let animationFrame;
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      avatar.position.y = -0.08 + Math.sin(elapsed * 1.8) * 0.07;
      const presentation = Math.sin(elapsed * 0.78);
      const gesture = Math.sin(elapsed * 1.56);
      const pointingRight = Math.max(0, presentation);
      const pointingLeft = Math.max(0, -presentation);
      avatar.position.x = presentation * 0.22;
      avatar.rotation.y = presentation * 0.2;
      headGroup.rotation.y = presentation * 0.3;
      headGroup.rotation.z = gesture * 0.025;
      leftArm.rotation.z = -0.18 + pointingLeft * 1.18 + gesture * 0.08;
      rightArm.rotation.z = 0.18 - pointingRight * 1.18 - gesture * 0.08;
      leftArm.position.x = -0.58 - pointingLeft * 0.08;
      rightArm.position.x = 0.58 + pointingRight * 0.08;
      board.position.y = 0.35 + Math.sin(elapsed * 1.8 + 0.5) * 0.04;
      marker.position.x = -1.02 + Math.cos(elapsed * 1.2) * 0.08 + pointingLeft * 0.14;
      marker.position.y = 1.2 + Math.sin(elapsed * 1.2) * 0.12 + pointingLeft * 0.08;
      marker.rotation.z = Math.sin(elapsed * 1.1) * 0.14;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrame);
      renderer.dispose();
      mount.replaceChildren();
    };
  }, []);

  return (
    <div aria-hidden="true" className="advisor-stage">
      <style>{ADVISOR_CSS}</style>
      <div className="property-collage">
        {[["one", ["a", "b", "c", "d"]], ["two", ["c", "a", "d", "b"]]].map(([track, order]) => (
          <div key={track} className={`property-collage-track property-collage-track-${track}`}>
            {[0, 1, 2, 3].flatMap(() => order).map((tile, i) => <div key={i} className={`property-tile property-tile-${tile}`} />)}
          </div>
        ))}
      </div>
      <div ref={mountRef} className="advisor-webgl" />
      <div className="advisor-fallback">
      <div className="advisor-avatar">
        <div className="advisor-marker"><span /></div>
        <div className="advisor-head"><div className="advisor-hair" /><div className="advisor-eye advisor-eye-left" /><div className="advisor-eye advisor-eye-right" /></div>
        <div className="advisor-body"><div className="advisor-collar" /></div>
        <div className="advisor-arm advisor-arm-left" />
        <div className="advisor-arm advisor-arm-right" />
        <div className="advisor-board"><i /><i /></div>
        <div className="advisor-platform" />
      </div>
      </div>
    </div>
  );
}
