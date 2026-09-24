import React from "react";

const mkIcon = (paths) => ({ size = 24, color = "currentColor", strokeWidth = 2, style, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    {paths.map((d, i) => <path key={i} d={d} />)}
  </svg>
);
export const Home = mkIcon(["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"]);
export const Upload = mkIcon(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M17 8 12 3 7 8","M12 3v12"]);
export const Plus = mkIcon(["M5 12h14","M12 5v14"]);
export const ArrowLeft = mkIcon(["m12 19-7-7 7-7","M19 12H5"]);
export const Sparkles = mkIcon(["m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"]);
export const Download = mkIcon(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"]);
export const Check = mkIcon(["M20 6 9 17l-5-5"]);
export const ImageOff = mkIcon(["M2 2l20 20","M10.41 10.41a2 2 0 1 1-2.83-2.83","M13.5 13.5 6 21","M18 12l3 3","M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59","M21 15V5a2 2 0 0 0-2-2H9"]);
export const Building2 = mkIcon(["M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z","M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2","M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2","M10 6h4","M10 10h4","M10 14h4","M10 18h4"]);

export const Globe2 = mkIcon(["M22 12a10 10 0 1 1-20 0a10 10 0 0 1 20 0z","M2 12h20","M12 2a15 15 0 0 1 4 10a15 15 0 0 1-4 10a15 15 0 0 1-4-10a15 15 0 0 1 4-10z"]);
export const KeyRound = mkIcon(["M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z","M16.5 7.5h.01"]);
export const Loader2 = mkIcon(["M21 12a9 9 0 1 1-6.219-8.56"]);
export const ExternalLink = mkIcon(["M15 3h6v6","M10 14 21 3","M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"]);
export const AlertCircle = mkIcon(["M22 12a10 10 0 1 1-20 0a10 10 0 0 1 20 0z","M12 8v4","M12 16h.01"]);
