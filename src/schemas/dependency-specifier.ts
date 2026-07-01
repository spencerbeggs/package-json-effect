import { Effect, Schema } from "effect";
import { InvalidDependencySpecifierError } from "../errors/InvalidDependencySpecifierError.js";

/**
 * Validates a dependency version specifier.
 *
 * Accepts semver ranges, exact versions, dist-tags, URLs,
 * git refs, GitHub shorthand, file paths, and npm/catalog/workspace protocols.
 *
 * @public
 */
export const isValidDependencySpecifier = (s: string): boolean => {
	if (s.length === 0) return false;
	// Protocols
	if (s.startsWith("file:")) return true;
	if (s.startsWith("link:")) return true;
	if (s.startsWith("portal:")) return true;
	if (s.startsWith("git+")) return true;
	if (s.startsWith("git://")) return true;
	if (s.startsWith("github:")) return true;
	if (s.startsWith("gist:")) return true;
	if (s.startsWith("bitbucket:")) return true;
	if (s.startsWith("gitlab:")) return true;
	if (s.startsWith("http://") || s.startsWith("https://")) return true;
	if (s.startsWith("npm:")) return true;
	if (s.startsWith("catalog:")) return true;
	if (s.startsWith("workspace:")) return true;
	// GitHub shorthand: user/repo or user/repo#ref
	if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(#.*)?$/.test(s)) return true;
	// Semver-ish: starts with digit, ^, ~, >=, <=, >, <, =, *, or is a tag
	if (/^[\d^~>=<*|xX]/.test(s)) return true;
	// Tags: alphanumeric strings like "latest", "next", "beta"
	if (/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(s)) return true;
	return false;
};

/**
 * A valid dependency version specifier.
 *
 * @public
 */
export const DependencySpecifier = Schema.String.pipe(
	Schema.filter((s) => isValidDependencySpecifier(s) || "Expected a valid dependency specifier"),
	Schema.brand("DependencySpecifier"),
);

/**
 * Branded type for dependency specifiers.
 *
 * @public
 */
export type DependencySpecifier = Schema.Schema.Type<typeof DependencySpecifier>;

/**
 * Opt-in decoder: validate a string as a DependencySpecifier, failing with a
 * typed InvalidDependencySpecifierError instead of a Schema ParseError.
 *
 * @public
 */
export const decodeSpecifier = (input: string): Effect.Effect<DependencySpecifier, InvalidDependencySpecifierError> =>
	Schema.decodeUnknown(DependencySpecifier)(input).pipe(
		Effect.mapError(
			() => new InvalidDependencySpecifierError({ input, reason: "Not a recognized dependency specifier" }),
		),
	);
