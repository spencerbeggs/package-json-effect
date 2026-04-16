import { Effect, Layer } from "effect";
import { WorkspaceResolver } from "../services/WorkspaceResolver.js";

/**
 * Default WorkspaceResolver: no-op passthrough.
 * Replace with a real implementation to resolve workspace: protocol specifiers.
 */
export const WorkspaceResolverLive: Layer.Layer<WorkspaceResolver> = Layer.succeed(
	WorkspaceResolver,
	WorkspaceResolver.of({
		resolve: (raw) => Effect.succeed(raw),
	}),
);
