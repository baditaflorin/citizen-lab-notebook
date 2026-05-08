import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { type Experiment, experimentSchema } from "../types";

interface CitizenLabNotebookDB extends DBSchema {
  experiments: {
    key: string;
    value: Experiment;
    indexes: {
      "by-updated": string;
    };
  };
}

const dbName = "citizen-lab-notebook";
const dbVersion = 1;

let dbPromise: Promise<IDBPDatabase<CitizenLabNotebookDB>> | undefined;

function getDB(): Promise<IDBPDatabase<CitizenLabNotebookDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CitizenLabNotebookDB>(dbName, dbVersion, {
      upgrade(db) {
        const store = db.createObjectStore("experiments", { keyPath: "id" });
        store.createIndex("by-updated", "updatedAt");
      },
    });
  }

  return dbPromise;
}

export async function saveExperiment(experiment: Experiment): Promise<void> {
  const parsed = experimentSchema.parse(experiment);
  const db = await getDB();
  await db.put("experiments", parsed);
}

export async function listExperiments(): Promise<Experiment[]> {
  const db = await getDB();
  const records = await db.getAllFromIndex("experiments", "by-updated");
  return records.map((record) => experimentSchema.parse(record)).reverse();
}

export async function deleteExperiment(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("experiments", id);
}

export function exportExperimentJson(experiment: Experiment): string {
  return JSON.stringify(experimentSchema.parse(experiment), null, 2);
}

export function importExperimentJson(contents: string): Experiment {
  return experimentSchema.parse(JSON.parse(contents));
}
