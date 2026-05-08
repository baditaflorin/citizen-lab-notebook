import { parse } from "exifr";
import { createId, type ImageMetadata } from "../../types";

const preferredFields = [
  "Make",
  "Model",
  "DateTimeOriginal",
  "CreateDate",
  "ModifyDate",
  "GPSLatitude",
  "GPSLongitude",
  "ImageWidth",
  "ImageHeight",
  "LensModel",
  "ExposureTime",
  "FNumber",
  "ISO",
];

function stringifyValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(stringifyValue).join(", ");
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
}

export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  const raw = (await parse(file, { xmp: true, iptc: true, gps: true, tiff: true })) as
    | Record<string, unknown>
    | undefined;
  const fields: Record<string, string> = {};

  if (raw) {
    for (const key of preferredFields) {
      if (key in raw && raw[key] !== undefined && raw[key] !== null) {
        fields[key] = stringifyValue(raw[key]);
      }
    }
  }

  if (Object.keys(fields).length === 0) {
    fields.Note = "No embedded EXIF/IPTC/XMP fields were detected by the browser parser.";
  }

  const previewUrl = await fileToDataUrl(file);

  return {
    id: createId("image"),
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    previewUrl,
    fields,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image preview"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
