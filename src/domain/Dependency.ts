import { Schema } from "effect";

/** Returns true if the specifier points to a local file path. */
export const isLocalSpecifier = (s: string): boolean => s.startsWith("file:");

/** Returns true if the specifier points to a git repository. */
export const isGitSpecifier = (s: string): boolean =>
	s.startsWith("git+") || s.startsWith("git://") || s.startsWith("github:");

/** Returns true if the specifier is a semver range. */
export const isRangeSpecifier = (s: string): boolean => /^[\d^~>=<*xX|]/.test(s);

/** Returns true if the specifier is a dist-tag (e.g. "latest", "next"). */
export const isTagSpecifier = (s: string): boolean => {
	if (isLocalSpecifier(s) || isGitSpecifier(s) || isRangeSpecifier(s)) return false;
	if (s.startsWith("http")) return false;
	if (s.startsWith("npm:") || s.startsWith("catalog:") || s.startsWith("workspace:")) return false;
	if (s.includes("/")) return false;
	return /^[a-zA-Z]/.test(s);
};

export class Dependency extends Schema.TaggedClass<Dependency>()("Dependency", {
	name: Schema.String,
	specifier: Schema.String,
}) {
	get isLocal(): boolean {
		return isLocalSpecifier(this.specifier);
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
