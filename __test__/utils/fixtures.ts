import { resolve } from "node:path";

const FIXTURES = resolve(import.meta.dirname, "../integration/fixtures");

export const fixtureDir = (...segments: string[]) => resolve(FIXTURES, ...segments);

export const fixturePath = (name: string) => resolve(FIXTURES, name, "package.json");
