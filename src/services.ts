import QRCodeStyling from "qr-code-styling";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import Papa from "papaparse";
import JSZip from "jszip";
import { paiLink } from "./constants";

export function getColoredSvgBase64(fillColor: string): string {
  const svg = `
    <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <g id="Layer 1">
        <path fill-rule="evenodd" fill="${fillColor}" d="m20 0c11 0 20 9 20 20 0 11-9 20-20 20-11 0-20-9-20-20 0-11 9-20 20-20zm-6.9 38.8l1.6-9c11.3 0 17.9-5.4 17.9-13.8 0.1-6.5-4.9-9.4-10.3-9.4h-8.7l-3.2 17.9h-9.9q0.7 2.8 2.1 5.3h6.8l-1.2 6.3q2.2 1.7 4.9 2.7z"/>
        <path fill-rule="evenodd" fill="${fillColor}" d="m18.3 11.1h3.6c3.7 0 5.1 2 5.1 5 0 5.7-4.2 8.4-9.4 8.4h-1.8z"/>
      </g>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function generateQRCodeBlob(
  value: string,
  fillColor: string
): Promise<Blob> {
  const logo = getColoredSvgBase64(fillColor);

  const qrCode = new QRCodeStyling({
    width: 800,
    height: 800,
    data: value,
    image: logo,
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 20,
      hideBackgroundDots: true,
    },
    dotsOptions: {
      color: fillColor,
      type: "dots",
      roundSize: true,
    },
    cornersSquareOptions: {
      type: "extra-rounded",
      color: fillColor,
    },
    cornersDotOptions: {
      type: "square",
      color: fillColor,
    },
    backgroundOptions: {
      color: "transparent",
    },
  });

  const raw = await qrCode.getRawData("svg");
  return raw as Blob;
}

export async function selectCSVFile(): Promise<string | null> {
  const filePath = await open({
    multiple: false,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });

  if (!filePath) return null;

  const content = await readTextFile(filePath as string);
  return content;
}

export async function generateQrZip(
  content: string,
  color: string
): Promise<Blob> {
  const parsed = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
  });

  const zip = new JSZip();

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const id = row[1];
    if (!id) continue;

    const link = paiLink + id;

    try {
      const blob = await generateQRCodeBlob(link, color);
      zip.file(`qr_${id}.svg`, blob);
    } catch (err) {
      console.error("QR code generation error:", err);
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  return zipBlob;
}

export function saveBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
