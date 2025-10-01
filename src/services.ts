import QRCodeStyling from "qr-code-styling";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeFile } from "@tauri-apps/plugin-fs";
import Papa from "papaparse";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { QR_HEIGHT, QR_WIDTH } from "./constants";
import { showToast } from "./lib";
import { OutputFormat } from "./types";

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

export async function generateQRCodeBlob(value: string, fillColor: string) {
  const formatSelect = document.getElementById(
    "formatSelect"
  ) as HTMLSelectElement;

  const selectedFormat = formatSelect.value as OutputFormat;

  const logo = getColoredSvgBase64(fillColor);

  const qrCode = new QRCodeStyling({
    width: QR_WIDTH,
    height: QR_HEIGHT,
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

  const raw = await qrCode.getRawData(selectedFormat);

  return {
    blob: raw as Blob,
    extension: selectedFormat,
  };
}

export async function selectCSVFile(): Promise<string | null> {
  const filePath = await open({
    multiple: false,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });

  if (!filePath) {
    showToast("File selection canceled", "info");

    return null;
  }

  const content = await readTextFile(filePath as string);
  return content;
}

export async function generateQrZip(
  content: string,
  color: string
): Promise<Blob> {
  const formatSelect = document.getElementById(
    "formatSelect"
  ) as HTMLSelectElement;

  const linkInput = document.getElementById("linkInput") as HTMLInputElement;

  const selectedFormat = formatSelect.value as OutputFormat;

  const parsed = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
  });

  const hasFirstColumn = parsed.data.some((row) => row[0]?.trim().length > 0);
  const hasSecondColumn = parsed.data.some((row) => row[1]?.trim().length > 0);

  if (!hasFirstColumn && !hasSecondColumn) {
    showToast("No data found in first and second columns", "error");
    throw new Error("Invalid CSV format");
  }

  const columnIndex = hasFirstColumn ? 0 : 1;

  const zip = new JSZip();

  for (const row of parsed.data) {
    const id = row[columnIndex]?.trim();
    if (!id) continue;

    const link = linkInput.value + id;

    try {
      if (selectedFormat === "pdf") {
        const pdf = await generateQRCodePDF(link, color);
        zip.file(`qr_${id}.pdf`, pdf);
      } else {
        const { blob, extension } = await generateQRCodeBlob(link, color);
        zip.file(`qr_${id}.${extension}`, blob);
      }
    } catch (err) {
      showToast(`Error generating QR for ${id}`, "error");
      console.error("QR code generation error:", err);
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  return zipBlob;
}

export async function saveBlob(blob: Blob, filename: string) {
  const filePath = await save({
    defaultPath: filename,
    filters: [{ name: "ZIP", extensions: ["zip"] }],
  });

  if (!filePath) {
    showToast("Save canceled", "info");
    return;
  }

  const buffer = new Uint8Array(await blob.arrayBuffer());

  await writeFile(filePath, buffer);

  showToast("Successfully generated QR codes", "success");
}

export async function generateQRCodePDF(value: string, fillColor: string) {
  const { blob } = await generateQRCodeBlob(value, fillColor);

  const dataUrl = await blobToDataURL(blob);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [QR_WIDTH, QR_HEIGHT],
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, QR_WIDTH, QR_HEIGHT);

  return pdf.output("blob");
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
