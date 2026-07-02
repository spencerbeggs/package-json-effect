/**
 * package-json-effect
 *
 * Effect-TS library for reading, writing, parsing, manipulating,
 * and transforming package.json data.
 *
 * @packageDocumentation
 */

export type {
	DependencyProtocol,
	DependencyProtocolGetters,
	UnresolvedDependency,
} from "./domain/Dependency.js";
// Domain
export {
	Dependency,
	isGitSpecifier,
	isLocalSpecifier,
	isRangeSpecifier,
	isTagSpecifier,
	isUnresolvedDependency,
	parseRangeOption,
	protocolOf,
} from "./domain/Dependency.js";
export { DevDependency } from "./domain/DevDependency.js";
export { OptionalDependency } from "./domain/OptionalDependency.js";
export { Package } from "./domain/Package.js";
export { PackageNameUtil } from "./domain/PackageName.js";
export { PeerDependency } from "./domain/PeerDependency.js";

// Errors
export { DependencyResolutionError, DependencyResolutionErrorBase } from "./errors/DependencyResolutionError.js";
export {
	InvalidDependencySpecifierError,
	InvalidDependencySpecifierErrorBase,
} from "./errors/InvalidDependencySpecifierError.js";
export { InvalidPackageNameError, InvalidPackageNameErrorBase } from "./errors/InvalidPackageNameError.js";
export { InvalidSpdxLicenseError, InvalidSpdxLicenseErrorBase } from "./errors/InvalidSpdxLicenseError.js";
export { PackageJsonDecodeError, PackageJsonDecodeErrorBase } from "./errors/PackageJsonDecodeError.js";
export { PackageJsonNotFoundError, PackageJsonNotFoundErrorBase } from "./errors/PackageJsonNotFoundError.js";
export { PackageJsonParseError, PackageJsonParseErrorBase } from "./errors/PackageJsonParseError.js";
export { PackageJsonReadError, PackageJsonReadErrorBase } from "./errors/PackageJsonReadError.js";
export type { ValidationRuleFailure } from "./errors/PackageJsonValidationError.js";
export { PackageJsonValidationError, PackageJsonValidationErrorBase } from "./errors/PackageJsonValidationError.js";
export { PackageJsonWriteError, PackageJsonWriteErrorBase } from "./errors/PackageJsonWriteError.js";

// Layers
export { CatalogResolverLive } from "./layers/CatalogResolverLive.js";
export { PackageJsonFormatterLive } from "./layers/PackageJsonFormatterLive.js";
export { PackageJsonLive } from "./layers/PackageJsonLive.js";
export { PackageJsonReaderLive } from "./layers/PackageJsonReaderLive.js";
export { PackageJsonTransformerLive } from "./layers/PackageJsonTransformerLive.js";
export {
	PackageJsonValidatorLive,
	defaultRules,
	makePackageJsonValidatorLive,
	noLocalDepsRule,
	noUnresolvedDepsRule,
} from "./layers/PackageJsonValidatorLive.js";
export { PackageJsonWriterLive } from "./layers/PackageJsonWriterLive.js";
export { WorkspaceResolverLive } from "./layers/WorkspaceResolverLive.js";
// Schema classes referenced by domain signatures
export { DevEngine } from "./schemas/dev-engines.js";
// Re-export branded TS types referenced by domain signatures
export type { PackageName, ScopedPackageName, UnscopedPackageName } from "./schemas/name.js";
export { PackageManager } from "./schemas/package-manager.js";

// Services
export { CatalogResolver } from "./services/CatalogResolver.js";
export { PackageJsonFormatter } from "./services/PackageJsonFormatter.js";
export { PackageJsonReader } from "./services/PackageJsonReader.js";
export { PackageJsonTransformer } from "./services/PackageJsonTransformer.js";
export type { RuleFailure, ValidationRule } from "./services/PackageJsonValidator.js";
export { PackageJsonValidator } from "./services/PackageJsonValidator.js";
export { PackageJsonWriter } from "./services/PackageJsonWriter.js";
export { WorkspaceResolver } from "./services/WorkspaceResolver.js";
