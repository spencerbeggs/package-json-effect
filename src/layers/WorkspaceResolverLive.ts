import { Effect, Layer, Option } from "effect";
import { WorkspaceResolver } from "../services/WorkspaceResolver.js";

/**
 * Default WorkspaceResolver: resolves nothing. Provide a real implementation
 * (e.g. backed by workspaces-effect) to resolve workspace: specifiers.
 *
 * @public
 */
export const WorkspaceResolverLive: Layer.Layer<WorkspaceResolver> = Layer.succeed(
	WorkspaceResolver,
	WorkspaceResolver.of({ versionOf: () => Effect.succeed(Option.none()) }),
);
