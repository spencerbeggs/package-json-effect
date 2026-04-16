import { Schema } from "effect";
import { isGitSpecifier, isLocalSpecifier, isRangeSpecifier, isTagSpecifier } from "./Dependency.js";

export class DevDependency extends Schema.TaggedClass<DevDependency>()("DevDependency", {
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
