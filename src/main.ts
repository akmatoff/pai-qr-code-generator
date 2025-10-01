import { generateQrZip, saveBlob, selectCSVFile } from "./services";

window.addEventListener("DOMContentLoaded", () => {
  const importButton = document.querySelector(
    "#importButton"
  ) as HTMLButtonElement;
  const colorPicker = document.querySelector(
    "#colorPicker"
  ) as HTMLInputElement;

  importButton.addEventListener("click", async () => {
    const content = await selectCSVFile();

    if (!content) return;

    const zip = await generateQrZip(content, colorPicker.value);

    saveBlob(zip, "qr_codes.zip");
  });
});
