"use client";

import Image from "next/image";
import { useState } from "react";

const MAX_DIMENSION = 900;
const MAX_BYTES = 700_000;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read cloth sample image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load cloth sample image."));
    image.src = source;
  });
}

function dataUrlBytes(dataUrl: string) {
  return Math.ceil((dataUrl.length * 3) / 4);
}

async function compressImage(file: File) {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare cloth sample photo.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.78;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrlBytes(dataUrl) > MAX_BYTES && quality > 0.35) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

export function ClothSamplePhotoField({ currentImageUrl }: { currentImageUrl?: string }) {
  const [preview, setPreview] = useState(currentImageUrl ?? "");
  const [dataUrl, setDataUrl] = useState("");
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState("");

  async function updatePhoto(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const nextDataUrl = await compressImage(file);
      setDataUrl(nextDataUrl);
      setPreview(nextDataUrl);
      setRemove(false);
    } catch {
      setError("Could not read this photo. Please take or choose the cloth sample photo again.");
    }
  }

  return (
    <div className="grid gap-3 rounded-md border border-[#eadfce] bg-white p-4">
      <input type="hidden" name="clothSampleDataUrl" value={remove ? "" : dataUrl} />
      {remove ? <input type="hidden" name="removeClothSample" value="1" /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#4c1525]">Cloth sample photo</p>
          <p className="text-xs text-[#7c6d66]">Replace or remove the store-copy cloth reference.</p>
        </div>
        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-[#d8c7b4] bg-white px-4 py-2 text-sm font-semibold text-[#2c2522] transition hover:bg-[#f7efe2]">
          Choose photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => void updatePhoto(event.target.files?.[0])}
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-start">
        <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-md border border-dashed border-[#d8c7b4] bg-[#fffdf8]">
          {preview && !remove ? (
            <Image src={preview} alt="Cloth sample preview" width={220} height={150} unoptimized className="max-h-44 w-full object-cover" />
          ) : (
            <span className="px-4 text-center text-sm text-[#7c6d66]">No cloth sample photo</span>
          )}
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#4c1525]">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={remove}
            onChange={(event) => {
              setRemove(event.target.checked);
              if (event.target.checked) {
                setDataUrl("");
              }
            }}
          />
          Remove current cloth sample
        </label>
      </div>
      {error ? <p className="text-sm font-semibold text-[#a83232]">{error}</p> : null}
    </div>
  );
}
