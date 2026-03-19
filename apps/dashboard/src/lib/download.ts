import { isDesktopApp } from "@vendcfo/desktop-client/platform";

export async function downloadFile(url: string, filename: string) {
  if (!isDesktopApp()) {
    // Web mode - normal download
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Desktop mode - fetch through the webview (which has cookies/session),
  // then save the blob natively to ~/Downloads via Tauri fs plugin.
  const downloadUrl =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `${window.location.origin}${url}`;

  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`,
    );
  }

  const blob = await response.blob();

  const { nativeSaveFile } = await import("@vendcfo/desktop-client/core");

  try {
    await nativeSaveFile(blob, filename);
  } catch (error) {
    console.error("[downloadFile] Failed to save file:", error);
    throw error;
  }
}
