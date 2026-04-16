import { Option } from "effect";

/**
 * Utility functions for working with package name strings.
 */
export const PackageNameUtil = {
	scope: (name: string): Option.Option<string> => {
		if (!name.startsWith("@")) return Option.none();
		const slashIndex = name.indexOf("/");
		if (slashIndex === -1) return Option.none();
		return Option.some(name.slice(1, slashIndex));
	},

	unscoped: (name: string): string => {
		if (!name.startsWith("@")) return name;
		const slashIndex = name.indexOf("/");
		return slashIndex === -1 ? name : name.slice(slashIndex + 1);
	},

	isScoped: (name: string): boolean => name.startsWith("@"),
};
