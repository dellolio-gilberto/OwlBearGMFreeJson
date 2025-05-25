// Rimuovi l'import di TTRPG_URL
// import { TTRPG_URL } from "../config.ts";

export async function uploadJsonFile(file: File, proxyUrl?: string): Promise<void> {
  if (file.type !== "application/json") {
    throw new Error("Il file deve essere un JSON.");
  }

  if (!proxyUrl) {
    throw new Error("Proxy URL not configured. Please set it up in settings.");
  }

  try {
    const text = await file.text();
    const json = JSON.parse(text);

    if (typeof json.source === "string" && !json.source.endsWith(" - NoTA")) {
      json.source = json.source + " - NoTA";
    }

    const response = await fetch(`${proxyUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Errore dal server:", result);
      throw new Error(result.error || "Errore nella POST");
    }

    console.log("Upload completato:", result);
  } catch (err) {
    console.error("Errore durante l'upload:", err);
    throw err;
  }
}