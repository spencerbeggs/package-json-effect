import { Effect, Option, Schema } from "effect";
import type { Range } from "semver-effect";
import { parseRange } from "semver-effect";

export type DependencyProtocol =
	| "range"
	| "tag"
	| "git"
	| "url"
	| "npm"
	| "file"
	| "link"
	| "portal"
	| "catalog"
	| "workspace"
	| "unknown";

/** The shared protocol-classification getters implemented by every Dependency variant. */
export interface DependencyProtocolGetters {
	readonly protocol: Option.Option<DependencyProtocol>;
	readonly range: Option.Option<Range>;
	readonly isLocal: boolean;
	readonly isLink: boolean;
	readonly isPortal: boolean;
	readonly isCatalog: boolean;
	readonly isWorkspace: boolean;
	readonly isUnresolved: boolean;
	readonly isGit: boolean;
	readonly isRange: boolean;
	readonly isTag: boolean;
}

const isBarePath = (s: string): boolean =>
	s.startsWith("./") || s.startsWith("../") || s.startsWith("~/") || s.startsWith("/");

/** Returns true if the specifier points to a local path (file:, link:, portal:, or a bare path). */
export const isLocalSpecifier = (s: string): boolean =>
	s.startsWith("file:") || s.startsWith("link:") || s.startsWith("portal:") || isBarePath(s);

/** Bare GitHub shorthand `user/repo[#ref]`, excluding local-path-looking strings. */
const isGitHubShorthand = (s: string): boolean =>
	!s.startsWith(".") && !s.startsWith("~") && !s.startsWith("/") && /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(#.*)?$/.test(s);

/** Returns true if the specifier resolves to a git source (git URLs and hosted-git shorthands). */
export const isGitSpecifier = (s: string): boolean =>
	s.startsWith("git+") ||
	s.startsWith("git://") ||
	s.startsWith("github:") ||
	s.startsWith("gist:") ||
	s.startsWith("bitbucket:") ||
	s.startsWith("gitlab:") ||
	isGitHubShorthand(s);

/** Returns true if the specifier is a parseable semver range. */
export const isRangeSpecifier = (s: string): boolean => Option.isSome(parseRangeOption(s));

/** Returns true if the specifier is a dist-tag (e.g. "latest", "next"). */
export const isTagSpecifier = (s: string): boolean => protocolOf(s) === "tag";

/** Parse the specifier as a semver Range, returning None when it is not a range. */
export const parseRangeOption = (s: string): Option.Option<Range> => Effect.runSync(Effect.option(parseRange(s)));

/** Classify a specifier string into a single protocol; "unknown" for unrecognized input. */
export const protocolOf = (s: string): DependencyProtocol => {
	if (s.startsWith("catalog:")) return "catalog";
	if (s.startsWith("workspace:")) return "workspace";
	if (s.startsWith("link:")) return "link";
	if (s.startsWith("portal:")) return "portal";
	if (s.startsWith("file:") || isBarePath(s)) return "file";
	if (s.startsWith("npm:")) return "npm";
	if (isGitSpecifier(s)) return "git";
	if (s.startsWith("http://") || s.startsWith("https://")) return "url";
	if (Option.isSome(parseRangeOption(s))) return "range";
	if (/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(s)) return "tag";
	return "unknown";
};

export class Dependency
	extends Schema.TaggedClass<Dependency>()("Dependency", {
		name: Schema.String,
		specifier: Schema.String,
	})
	implements DependencyProtocolGetters
{
	get protocol(): Option.Option<DependencyProtocol> {
		return this.specifier.length === 0 ? Option.none() : Option.some(protocolOf(this.specifier));
	}
	get range(): Option.Option<Range> {
		return parseRangeOption(this.specifier);
	}
	get isLocal(): boolean {
		return isLocalSpecifier(this.specifier);
	}
	get isLink(): boolean {
		return this.specifier.startsWith("link:");
	}
	get isPortal(): boolean {
		return this.specifier.startsWith("portal:");
	}
	get isCatalog(): boolean {
		return this.specifier.startsWith("catalog:");
	}
	get isWorkspace(): boolean {
		return this.specifier.startsWith("workspace:");
	}
	get isUnresolved(): boolean {
		return this.isCatalog || this.isWorkspace;
	}
	get isGit(): boolean {
		return isGitSpecifier(this.specifier);
	}
	get isRange(): boolean {
		return isRangeSpecifier(this.specifier);
	}
	get isTag(): boolean {
		return isTagSpecifier(this.specifier);
	}
}

/** A Dependency whose specifier is an unresolved catalog: or workspace: protocol. */
export type UnresolvedDependency = Dependency & { readonly isUnresolved: true };

/** Type guard narrowing any dependency-like value to UnresolvedDependency, preserving the concrete type. */
export const isUnresolvedDependency = <T extends { readonly isUnresolved: boolean }>(
	dep: T,
): dep is T & { readonly isUnresolved: true } => dep.isUnresolved === true;
