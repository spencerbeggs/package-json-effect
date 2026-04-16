/**
 * package-json-effect
 *
 * Effect-TS library for reading, writing, parsing, manipulating,
 * and transforming package.json data.
 *
 * @packageDocumentation
 */

export { Dependency, isGitSpecifier, isLocalSpecifier, isRangeSpecifier, isTagSpecifier } from "./domain/Dependency.js";
export { DevDependency } from "./domain/DevDependency.js";
export { OptionalDependency } from "./domain/OptionalDependency.js";
// Domain
export { Package } from "./domain/Package.js";
export { PackageNameUtil } from "./domain/PackageName.js";
export { PeerDependency } from "./domain/PeerDependency.js";
export {
	InvalidDependencySpecifierError,
	InvalidDependencySpecifierErrorBase,
} from "./errors/InvalidDependencySpecifierError.js";
// Errors
export { InvalidPackageNameError, InvalidPackageNameErrorBase } from "./errors/InvalidPackageNameError.js";
export { PackageJsonDecodeError, PackageJsonDecodeErrorBase } from "./errors/PackageJsonDecodeError.js";
export { PackageJsonNotFoundError, PackageJsonNotFoundErrorBase } from "./errors/PackageJsonNotFoundError.js";
export { PackageJsonParseError, PackageJsonParseErrorBase } from "./errors/PackageJsonParseError.js";
export { PackageJsonReadError, PackageJsonReadErrorBase } from "./errors/PackageJsonReadError.js";
export type { ValidationRuleFailure } from "./errors/PackageJsonValidationError.js";
export { PackageJsonValidationError, PackageJsonValidationErrorBase } from "./errors/PackageJsonValidationError.js";
export { PackageJsonWriteError, PackageJsonWriteErrorBase } from "./errors/PackageJsonWriteError.js";
export { CatalogResolverLive } from "./layers/CatalogResolverLive.js";
export { PackageJsonFormatterLive } from "./layers/PackageJsonFormatterLive.js";
export { PackageJsonLive } from "./layers/PackageJsonLive.js";
// Layers
export { PackageJsonReaderLive } from "./layers/PackageJsonReaderLive.js";
export { PackageJsonTransformerLive } from "./layers/PackageJsonTransformerLive.js";
export {
	PackageJsonValidatorLive,
	defaultRules,
	makePackageJsonValidatorLive,
} from "./layers/PackageJsonValidatorLive.js";
export { PackageJsonWriterLive } from "./layers/PackageJsonWriterLive.js";
export { WorkspaceResolverLive } from "./layers/WorkspaceResolverLive.js";
// Schemas
export { BinSchema } from "./schemas/bin.js";
export { DependencyMapSchema } from "./schemas/dependency-map.js";
// Schema types
export type { DependencySpecifier } from "./schemas/dependency-specifier.js";
export { isValidDependencySpecifier } from "./schemas/dependency-specifier.js";
export type { DevEngines } from "./schemas/dev-engines.js";
export { DevEngine, DevEnginesSchema } from "./schemas/dev-engines.js";
export { EnginesSchema } from "./schemas/engines.js";
export type { ExportsField } from "./schemas/exports-field.js";
export { ExportsFieldSchema } from "./schemas/exports-field.js";
export type { SpdxLicense as SpdxLicenseType } from "./schemas/license.js";
export { SpdxLicense } from "./schemas/license.js";
export type {
	PackageName as PackageNameType,
	ScopedPackageName as ScopedPackageNameType,
	UnscopedPackageName as UnscopedPackageNameType,
} from "./schemas/name.js";
export { PackageName, ScopedPackageName, UnscopedPackageName, isValidPackageName } from "./schemas/name.js";
export type { PackageJsonSchemaEncoded, PackageJsonSchemaType } from "./schemas/package-json.js";
export { PackageJsonSchema, makePackageJsonSchema } from "./schemas/package-json.js";
export { PackageManager, PackageManagerSchema } from "./schemas/package-manager.js";
export { Person, PersonSchema } from "./schemas/person.js";
export type { PublishConfig } from "./schemas/publish-config.js";
export { PublishConfigSchema } from "./schemas/publish-config.js";
export { ScriptsSchema } from "./schemas/scripts.js";
export { VersionSchema } from "./schemas/version.js";
export { CatalogResolver } from "./services/CatalogResolver.js";
export { PackageJsonFormatter } from "./services/PackageJsonFormatter.js";
// Services
export { PackageJsonReader } from "./services/PackageJsonReader.js";
export { PackageJsonTransformer } from "./services/PackageJsonTransformer.js";
export type { ValidationRule } from "./services/PackageJsonValidator.js";
export { PackageJsonValidator } from "./services/PackageJsonValidator.js";
export { PackageJsonWriter } from "./services/PackageJsonWriter.js";
export { WorkspaceResolver } from "./services/WorkspaceResolver.js";
