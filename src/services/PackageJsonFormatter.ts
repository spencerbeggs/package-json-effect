import { Context } from "effect";

/**
 * Service for formatting/sorting a raw package.json object before serialization.
 * Operates on the encoded JSON object (post Schema.encode), not the domain model.
 */
export class PackageJsonFormatter extends Context.Tag("package-json-effect/PackageJsonFormatter")<
	PackageJsonFormatter,
	{
		readonly format: (raw: Record<string, unknown>) => Record<string, unknown>;
	}
>() {}
