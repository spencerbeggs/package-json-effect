import { Layer } from "effect";
import { PackageJsonFormatter } from "../services/PackageJsonFormatter.js";

const KEY_ORDER: ReadonlyArray<string> = [
	"$schema",
	"name",
	"version",
	"private",
	"description",
	"keywords",
	"homepage",
	"bugs",
	"repository",
	"funding",
	"license",
	"author",
	"contributors",
	"type",
	"imports",
	"exports",
	"main",
	"module",
	"browser",
	"bin",
	"man",
	"files",
	"directories",
	"workspaces",
	"scripts",
	"config",
	"dependencies",
	"devDependencies",
	"peerDependencies",
	"peerDependenciesMeta",
	"optionalDependencies",
	"bundleDependencies",
	"overrides",
	"engines",
	"devEngines",
	"os",
	"cpu",
	"publishConfig",
	"packageManager",
];

const DEPENDENCY_KEYS = new Set([
	"dependencies",
	"devDependencies",
	"peerDependencies",
	"optionalDependencies",
	"bundleDependencies",
]);

const sortKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
	const known: Array<[string, unknown]> = [];
	const unknown: Array<[string, unknown]> = [];

	for (const key of Object.keys(obj)) {
		if (KEY_ORDER.includes(key)) {
			known.push([key, obj[key]]);
		} else {
			unknown.push([key, obj[key]]);
		}
	}

	known.sort((a, b) => KEY_ORDER.indexOf(a[0]) - KEY_ORDER.indexOf(b[0]));
	unknown.sort((a, b) => a[0].localeCompare(b[0]));

	const result: Record<string, unknown> = {};
	for (const [key, value] of [...known, ...unknown]) {
		if (DEPENDENCY_KEYS.has(key) && value !== null && typeof value === "object" && !Array.isArray(value)) {
			const sorted = Object.keys(value as Record<string, unknown>)
				.sort((a, b) => a.localeCompare(b))
				.reduce(
					(acc, k) => {
						acc[k] = (value as Record<string, unknown>)[k];
						return acc;
					},
					{} as Record<string, unknown>,
				);
			result[key] = sorted;
		} else {
			result[key] = value;
		}
	}
	return result;
};

export const PackageJsonFormatterLive: Layer.Layer<PackageJsonFormatter> = Layer.succeed(
	PackageJsonFormatter,
	PackageJsonFormatter.of({
		format: sortKeys,
	}),
);
