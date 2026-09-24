// ---------- Asset download + PDF assembly ----------

export function downloadCanvasAsset(ad, format, address) {
  const safeAddress = (address || "property").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const link = document.createElement("a");
  link.download = `${safeAddress}-${ad.id}.${format}`;

  if (format === "jpg") {
    const canvas = document.createElement("canvas");
    canvas.width = ad.w;
    canvas.height = ad.h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, ad.w, ad.h);
    const image = new Image();
    image.onload = () => {
      ctx.drawImage(image, 0, 0, ad.w, ad.h);
      link.href = canvas.toDataURL("image/jpeg", 0.92);
      document.body.appendChild(link);
      link.click();
      link.remove();
    };
    image.src = ad.dataUrl;
    return;
  }

  if (format === "pdf") {
    const canvas = document.createElement("canvas");
    canvas.width = ad.w;
    canvas.height = ad.h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, ad.w, ad.h);
    const image = new Image();
    image.onload = () => {
      ctx.drawImage(image, 0, 0, ad.w, ad.h);
      const jpeg = canvas.toDataURL("image/jpeg", 0.92).split(",")[1];
      const pdf = createImagePdf(jpeg, ad.w, ad.h);
      link.href = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    };
    image.src = ad.dataUrl;
    return;
  }

  link.href = ad.dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function createImagePdf(base64Jpeg, imageWidth, imageHeight) {
  const encoder = new TextEncoder();
  const jpegBytes = Uint8Array.from(atob(base64Jpeg), (character) => character.charCodeAt(0));
  const pageWidth = 612;
  const pageHeight = Math.max(792, Math.round((pageWidth * imageHeight) / imageWidth));
  const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ`;
  const objects = [
    { text: "<< /Type /Catalog /Pages 2 0 R >>" },
    { text: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    { text: `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`, binary: jpegBytes, suffix: "\nendstream" },
  ];
  const chunks = [encoder.encode("%PDF-1.4\n")];
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(chunks.reduce((total, chunk) => total + chunk.length, 0));
    chunks.push(encoder.encode(`${index + 1} 0 obj\n`));
    if (typeof object === "string") chunks.push(encoder.encode(`${object}\nendobj\n`));
    else chunks.push(encoder.encode(object.text), object.binary || new Uint8Array(), encoder.encode(`${object.suffix || ""}\nendobj\n`));
  });
  const xref = chunks.reduce((total, chunk) => total + chunk.length, 0);
  let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    trailer += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  chunks.push(encoder.encode(`${trailer}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(length);
  let position = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, position);
    position += chunk.length;
  });
  return result;
}
