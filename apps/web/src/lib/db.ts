import { openDB } from "idb";
import type { Artifact, ChatMessage, ScenarioId } from "@dnevnik/shared";

export type PrivacyMode = "none" | "artifact" | "all";

export type SessionRecord = {
  id: string;
  mode: "interview" | "support" | "digitize";
  scenarioId?: ScenarioId;
  createdAt: string;
  messages?: ChatMessage[];
  artifact?: Artifact;
};

export type SettingsRecord = {
  id: "settings";
  privacyMode: PrivacyMode;
};

const dbPromise = openDB("dnevnik", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("sessions")) {
      db.createObjectStore("sessions", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("settings")) {
      db.createObjectStore("settings", { keyPath: "id" });
    }
  }
});

export async function getSettings(): Promise<SettingsRecord> {
  const db = await dbPromise;
  const stored = (await db.get("settings", "settings")) as SettingsRecord | undefined;
  return stored ?? { id: "settings", privacyMode: "artifact" };
}

export async function saveSettings(settings: SettingsRecord) {
  const db = await dbPromise;
  await db.put("settings", settings);
}

export async function saveSession(session: SessionRecord) {
  const db = await dbPromise;
  await db.put("sessions", session);
}

export async function listSessions(): Promise<SessionRecord[]> {
  const db = await dbPromise;
  return (await db.getAll("sessions")) as SessionRecord[];
}

export async function getSession(id: string): Promise<SessionRecord | undefined> {
  const db = await dbPromise;
  return (await db.get("sessions", id)) as SessionRecord | undefined;
}
