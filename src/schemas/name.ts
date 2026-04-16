import { Schema } from "effect";

/**
 * Validates a string as a valid npm package name.
 *
 * Rules: max 214 chars, lowercase, URL-safe characters only,
 * cannot start with . or _ (unless scoped).
 */
export const isValidPackageName = (s: string): boolean => {
	if (s.length === 0 || s.length > 214) return false;
	if (s.startsWith("@")) {
		const slashIndex = s.indexOf("/");
		if (slashIndex === -1 || slashIndex === 1 || slashIndex === s.length - 1) return false;
		if (s.indexOf("/", slashIndex + 1) !== -1) return false;
		const scope = s.slice(1, slashIndex);
		const name = s.slice(slashIndex + 1);
		return isValidNameChars(scope) && isValidNameChars(name);
	}
	if (s.startsWith(".") || s.startsWith("_")) return false;
	return isValidNameChars(s);
};

const isValidNameChars = (s: string): boolean => /^[a-z0-9._-]+$/.test(s);

/**
 * A valid npm scoped package name (starts with \@scope/).
 */
export const ScopedPackageName = Schema.String.pipe(
	Schema.filter((s) => (s.startsWith("@") && isValidPackageName(s)) || "Expected a scoped package name (@scope/name)"),
	Schema.brand("ScopedPackageName"),
);

/** Branded type for scoped package names. */
export type ScopedPackageName = Schema.Schema.Type<typeof ScopedPackageName>;

/**
 * A valid npm unscoped package name (does not start with \@).
 */
export const UnscopedPackageName = Schema.String.pipe(
	Schema.filter((s) => (!s.startsWith("@") && isValidPackageName(s)) || "Expected an unscoped package name"),
	Schema.brand("UnscopedPackageName"),
);

/** Branded type for unscoped package names. */
export type UnscopedPackageName = Schema.Schema.Type<typeof UnscopedPackageName>;

/**
 * A valid npm package name, either scoped or unscoped.
 */
export const PackageName = Schema.Union(ScopedPackageName, UnscopedPackageName);

/** Branded type for any valid package name. */
export type PackageName = Schema.Schema.Type<typeof PackageName>;
