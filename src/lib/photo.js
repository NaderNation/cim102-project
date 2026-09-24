// ---------- Photo helpers ----------

export function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ img, dataUrl: reader.result });
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// crude "quality" score: brightness balance + landscape-ish aspect ratio + resolution
export function scorePhoto(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const ratio = w / h;
  const canvas = document.createElement("canvas");
  const sampleSize = 40;
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  let data;
  try {
    data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
  } catch (e) {
    data = null;
  }
  let brightnessScore = 0.6;
  let contrastScore = 0.5;
  if (data) {
    let sum = 0;
    let sumSq = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum;
      sumSq += lum * lum;
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    const std = Math.sqrt(Math.max(variance, 0));
    // ideal mean brightness ~ 120-190
    brightnessScore = 1 - Math.min(Math.abs(mean - 150) / 150, 1);
    contrastScore = Math.min(std / 70, 1);
  }
  const idealRatio = 1.5; // 3:2 landscape, typical real-estate shot
  const ratioScore = 1 - Math.min(Math.abs(ratio - idealRatio) / idealRatio, 1);
  const resScore = Math.min((w * h) / (1600 * 1067), 1);
  const total = brightnessScore * 0.35 + contrastScore * 0.25 + ratioScore * 0.25 + resScore * 0.15;
  return Math.round(total * 100);
}

export function resizeForApi(img, maxDim = 480) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
  return dataUrl.split(",")[1]; // strip the "data:image/jpeg;base64," prefix
}

export async function shrinkForMarble(dataUrl, maxSide = 2048) {
  const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = dataUrl; });
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  let blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (blob.size > 3.5 * 1024 * 1024) blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.65));
  return blob;
}

export function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(",");
  const mime = /data:(.*);base64/.exec(meta)?.[1] || "image/jpeg";
  const bytes = atob(base64);
  const array = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) array[index] = bytes.charCodeAt(index);
  return new Blob([array], { type: mime });
}
