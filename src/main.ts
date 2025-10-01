import { generateQrZip, saveBlob, selectCSVFile } from "./services";

window.addEventListener("DOMContentLoaded", () => {
  const importButton = document.querySelector(
    "#importButton"
  ) as HTMLButtonElement;

  const colorPicker = document.querySelector(
    "#colorPicker"
  ) as HTMLInputElement;

  const selectedColorValue = document.querySelector(
    "#selectedColorValue"
  ) as HTMLInputElement;

  const colorSelector = document.querySelector(
    ".color-selector"
  ) as HTMLDivElement;

  const colorDisplay = document.querySelector(
    ".color-display"
  ) as HTMLDivElement;

  colorSelector.addEventListener("click", () => {
    colorPicker.click();
  });

  colorPicker.addEventListener("input", () => {
    selectedColorValue.textContent = colorPicker.value;
    colorDisplay.style.backgroundColor = colorPicker.value;
  });

  importButton.addEventListener("click", async () => {
    const content = await selectCSVFile();

    if (!content) return;

    const zip = await generateQrZip(content, colorPicker.value);

    await saveBlob(zip, "qr_codes.zip");
  });
});
