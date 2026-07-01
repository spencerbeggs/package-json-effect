import { Option, Schema } from "effect";
import type { Range } from "semver-effect";
import type { DependencyProtocol, DependencyProtocolGetters } from "./Dependency.js";
import {
	isGitSpecifier,
	isLocalSpecifier,
	isRangeSpecifier,
	isTagSpecifier,
	parseRangeOption,
	protocolOf,
} from "./Dependency.js";

/**
 * A `peerDependencies` entry pairing a package name, version specifier, and optionality flag.
 *
 * @public
 */
export class PeerDependency
	extends Schema.TaggedClass<PeerDependency>()("PeerDependency", {
		name: Schema.String,
		specifier: Schema.String,
		isOptional: Schema.Boolean,
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
