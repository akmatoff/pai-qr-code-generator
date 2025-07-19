function getColoredSvgDataUrl(fillColor) {
  const svg = `
    <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
	<g id="Layer 1">
		<g id="&lt;Group&gt;">
			<path fill-rule="evenodd" fill="${fillColor}" d="m20 0c11 0 20 9 20 20 0 11-9 20-20 20-11 0-20-9-20-20 0-11 9-20 20-20zm-6.9 38.8l1.6-9c11.3 0 17.9-5.4 17.9-13.8 0.1-6.5-4.9-9.4-10.3-9.4h-8.7l-3.2 17.9h-9.9q0.7 2.8 2.1 5.3h6.8l-1.2 6.3q2.2 1.7 4.9 2.7z"/>
			<path fill-rule="evenodd" d=""/>
			<path fill-rule="evenodd" fill="${fillColor}" d="m18.3 11.1h3.6c3.7 0 5.1 2 5.1 5 0 5.7-4.2 8.4-9.4 8.4h-1.8z"/>
		</g>
	</g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

window.addEventListener("DOMContentLoaded", () => {
  const importButton = document.querySelector(".import-button");
  const colorPicker = document.querySelector("#colorPicker");

  const paiLink = "https://pai.kg/qr/?id=";

  const generateQRCodeBlob = (value) => {
    return new Promise((resolve, reject) => {
      const selectedColor = colorPicker.value;
      const logo = getColoredSvgDataUrl(selectedColor);

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
          color: selectedColor,
          type: "dots",
          roundSize: true,
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          color: selectedColor,
        },
        cornersDotOptions: {
          type: "square",
          color: selectedColor,
        },
        backgroundOptions: {
          color: "transparent",
        },
      });

      qrCode
        .getRawData("svg")
        .then((blob) => resolve(blob))
        .catch(reject);
    });
  };

  importButton.addEventListener("click", async () => {
    const result = await window.electronAPI.openFile();
    if (!result) {
      console.log("No file selected");
      return;
    }

    const parsed = Papa.parse(result.content, {
      header: false,
      skipEmptyLines: true,
    });

    const zip = new JSZip();

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const id = row[1];
      const link = paiLink + id;

      try {
        const blob = await generateQRCodeBlob(link);
        zip.file(`qr_${id}.svg`, blob);
      } catch (err) {
        console.error("QR code generation error:", err);
      }
    }

    zip.generateAsync({ type: "blob" }).then((content) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "qr_codes.zip";
      link.click();
      URL.revokeObjectURL(link.href);
    });
  });
});
