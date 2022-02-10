import { readFile, writeFile } from "fs/promises";

const storePath = "./store.json";

interface Store {
  access_token: string;
  refresh_token: string;
}

export async function writeToStore(data: unknown): Promise<void> {
  return writeFile(storePath, JSON.stringify(data));
}

export async function readStore(): Promise<Store> {
  return JSON.parse(await readFile(storePath, "utf8"));
}
