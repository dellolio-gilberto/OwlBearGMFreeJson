// Rimuovi l'import di TTRPG_URL
// import { TTRPG_URL } from "../config.ts";

export async function uploadJsonFile(file: File, proxyUrl?: string): Promise<void> {
  if (file.type !== "application/json") {
    throw new Error("File needs to be a JSON.");
  }

  if (!proxyUrl) {
    throw new Error("Proxy URL not configured. Please set it up in settings.");
  }

  try {
    const text = await file.text();
    const json = JSON.parse(text);

    if (typeof json.source === "string" && !json.source.endsWith(" - NoTA"))
      json.source = json.source + " - NoTA";

    if (typeof json.slug === "string" && !json.slug.endsWith("-nota"))
      json.slug = json.slug + "-nota";

    const response = await fetch(`${proxyUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Server Error:", result);
      throw new Error(result.error || "Failed to upload JSON file.");
    }

  } catch (err) {
    console.error("Error uploading JSON file:", err);
    throw err;
  }
}