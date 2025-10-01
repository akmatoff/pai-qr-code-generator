import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

export function showToast(message: string, type: "error" | "success" | "info") {
  const style: Record<typeof type, Record<string, string>> = {
    success: {
      background: "var(--success-color)",
      color: "white",
    },
    error: {
      background: "var(--danger-color)",
      color: "white",
    },
    info: {
      background: "var(--content-color)",
      color: "var(--foreground-color)",
    },
  };

  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "center",
    stopOnFocus: true,
    style: {
      ...style[type],
      borderRadius: "16px",
      padding: "8px 16px",
      fontSize: "12px",
    },
  }).showToast();
}

export function showLoader(message = "Please wait, generating QR-codes...") {
  const loader = document.getElementById("loader") as HTMLDivElement;
  loader.classList.remove("hidden");
  loader.querySelector("p")!.textContent = message;
}

export function hideLoader() {
  const loader = document.getElementById("loader") as HTMLDivElement;
  loader.classList.add("hidden");
}
