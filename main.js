const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs");

const appIcon = nativeImage.createFromPath(path.join(__dirname, "/icon.png"));

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    title: "Pai Qr Code Generator",
    resizable: false,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("dialog:openFile", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "CSV", extensions: ["csv"] }],
    properties: ["openFile"],
  });

  if (canceled || filePaths.length === 0) return null;

  const content = fs.readFileSync(filePaths[0], "utf-8");
  return { filePath: filePaths[0], content };
});
