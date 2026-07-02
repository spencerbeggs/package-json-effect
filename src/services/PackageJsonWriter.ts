import type { Effect } from "effect";
import { Context } from "effect";
import type { Package } from "../domain/Package.js";
import type { PackageJsonWriteError } from "../errors/PackageJsonWriteError.js";

/**
 * Service for writing package.json to a target.
 *
 * @public
 */
export class PackageJsonWriter extends Context.Tag("package-json-effect/PackageJsonWriter")<
	PackageJsonWriter,
	{
		readonly write: (target: string, pkg: Package) => Effect.Effect<void, PackageJsonWriteError>;
	}
>() {}
