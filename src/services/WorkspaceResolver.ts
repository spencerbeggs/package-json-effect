import type { Effect } from "effect";
import { Context } from "effect";

/**
 * Service for resolving workspace: protocol references in dependency maps.
 * Operates on the encoded JSON object before formatting.
 * Default implementation is a no-op passthrough.
 */
export class WorkspaceResolver extends Context.Tag("package-json-effect/WorkspaceResolver")<
	WorkspaceResolver,
	{
		readonly resolve: (raw: Record<string, unknown>) => Effect.Effect<Record<string, unknown>>;
	}
>() {}
