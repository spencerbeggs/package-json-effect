import type { Effect, Option } from "effect";
import { Context } from "effect";
import type { DependencyResolutionError } from "../errors/DependencyResolutionError.js";

/**
 * Resolves workspace: protocol specifiers. Given a workspace package name,
 * returns its concrete version (without range modifier), or None if it cannot
 * be resolved (default no-op behavior).
 */
export class WorkspaceResolver extends Context.Tag("package-json-effect/WorkspaceResolver")<
	WorkspaceResolver,
	{
		readonly versionOf: (packageName: string) => Effect.Effect<Option.Option<string>, DependencyResolutionError>;
	}
>() {}
