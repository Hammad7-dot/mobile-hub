"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { Trash, UploadSimple } from "@phosphor-icons/react";

export default function ProductImageUploader({ initialImages = [], slug = "product" }: { initialImages?: string[]; slug?: string }) {
  const [images, setImages] = useState(initialImages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 6) { setError("A product can have up to 6 images."); return; }
    setBusy(true); setError("");
    const body = new FormData();
    body.set("slug", slug);
    files.forEach(file => body.append("files", file));
    try {
      const response = await fetch("/api/admin/product-images", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      setImages(current => [...current, ...result.urls]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed"); }
    finally { setBusy(false); event.target.value = ""; }
  }

  return <div className="product-image-uploader">
    <input type="hidden" name="images" value={JSON.stringify(images)}/>
    <div className="uploaded-image-grid">{images.map((url, index) => <div key={url}><Image src={url} alt={`Product image ${index + 1}`} fill sizes="120px"/><button type="button" onClick={() => setImages(current => current.filter(image => image !== url))} aria-label="Remove image"><Trash/></button>{index === 0 && <span>Primary</span>}</div>)}</div>
    <label className="upload-control"><UploadSimple/>{busy ? "Uploading…" : "Upload product images"}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={upload}/></label>
    <small>JPEG, PNG or WebP. Maximum 5 MB each and 6 images per product.</small>
    {error && <p className="form-error">{error}</p>}
  </div>;
}