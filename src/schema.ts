/**
 * package-json-effect/schema
 *
 * Advanced schema exports for extending and customizing PackageJsonSchema.
 *
 * @packageDocumentation
 */

export { BinSchema } from "./schemas/bin.js";
export { DependencyMapSchema } from "./schemas/dependency-map.js";
export type { DependencySpecifier as DependencySpecifierType } from "./schemas/dependency-specifier.js";
export { DependencySpecifier, decodeSpecifier, isValidDependencySpecifier } from "./schemas/dependency-specifier.js";
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
