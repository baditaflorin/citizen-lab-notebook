import { FileImage, Trash2 } from "lucide-react";
import { useState } from "react";
import { Section } from "../../components/Section";
import type { ImageMetadata } from "../../types";
import { extractImageMetadata } from "./metadata";

interface ImagePanelProps {
  images: ImageMetadata[];
  onAddImage: (image: ImageMetadata) => void;
  onDeleteImage: (id: string) => void;
}

export function ImagePanel({ images, onAddImage, onDeleteImage }: ImagePanelProps) {
  const [status, setStatus] = useState("Upload an experiment photo to extract browser-readable metadata.");

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      setStatus(`Reading metadata from ${file.name}`);
      const metadata = await extractImageMetadata(file);
      onAddImage(metadata);
      setStatus(`Metadata extracted from ${file.name}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Image metadata extraction failed");
    }
  }

  return (
    <Section title="Image Metadata" eyebrow="ExifTool-style browser extraction">
      <label className="file-button">
        <FileImage size={16} />
        Upload image
        <input type="file" accept="image/*" onChange={(event) => handleFile(event.target.files?.[0])} />
      </label>

      <p className="status-line">{status}</p>

      <div className="image-list">
        {images.length === 0 ? <p className="empty-state">No images inspected yet.</p> : null}
        {images.map((image) => (
          <article className="image-card" key={image.id}>
            {image.previewUrl ? <img src={image.previewUrl} alt="" /> : null}
            <div>
              <div className="card-title-row">
                <strong>{image.name}</strong>
                <button className="icon-only" type="button" onClick={() => onDeleteImage(image.id)} aria-label="Delete image metadata">
                  <Trash2 size={16} />
                </button>
              </div>
              <small>
                {image.type} · {Math.round(image.size / 1024)} KB
              </small>
              <dl className="metadata-grid">
                {Object.entries(image.fields).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
