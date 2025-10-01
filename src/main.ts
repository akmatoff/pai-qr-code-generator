import { PAI_LINK } from "./constants";
import { hideLoader, showLoader, showToast } from "./lib";
import { generateQrZip, saveBlob, selectCSVFile } from "./services";

window.addEventListener("DOMContentLoaded", () => {
  const linkInput = document.querySelector("#linkInput") as HTMLInputElement;

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

  linkInput.value = PAI_LINK;

  colorSelector.addEventListener("click", () => {
    colorPicker.click();
  });

  colorPicker.addEventListener("input", () => {
    selectedColorValue.textContent = colorPicker.value;
    colorDisplay.style.backgroundColor = colorPicker.value;
  });

  async function handleImport() {
    try {
      const content = await selectCSVFile();

      if (!content) return;

      showLoader();

      const zip = await generateQrZip(content, colorPicker.value);

      await saveBlob(zip, "qr_codes.zip");
    } catch (err) {
      showToast("Something went wrong", "error");
      console.error(err);
    } finally {
      hideLoader();
    }
  }

  importButton.addEventListener("click", handleImport);
});
