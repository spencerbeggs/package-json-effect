import type { Effect } from "effect";
import { Context } from "effect";
import type { Package } from "../domain/Package.js";
import type { PackageJsonDecodeError } from "../errors/PackageJsonDecodeError.js";
import type { PackageJsonNotFoundError } from "../errors/PackageJsonNotFoundError.js";
import type { PackageJsonParseError } from "../errors/PackageJsonParseError.js";
import type { PackageJsonReadError } from "../errors/PackageJsonReadError.js";

/**
 * Service for reading and parsing package.json from a source.
 */
export class PackageJsonReader extends Context.Tag("package-json-effect/PackageJsonReader")<
	PackageJsonReader,
	{
		readonly read: (
			source: string,
		) => Effect.Effect<
			Package,
			PackageJsonReadError | PackageJsonNotFoundError | PackageJsonParseError | PackageJsonDecodeError
		>;
	}
>() {}
