import { HashMap, Schema } from "effect";
import { BinSchema } from "./bin.js";
import { DependencyMapSchema } from "./dependency-map.js";
import { DevEnginesSchema } from "./dev-engines.js";
import { EnginesSchema } from "./engines.js";
import { ExportsFieldSchema } from "./exports-field.js";
import { PackageName } from "./name.js";
import { PackageManagerSchema } from "./package-manager.js";
import { PublishConfigSchema } from "./publish-config.js";
import { ScriptsSchema } from "./scripts.js";
import { VersionSchema } from "./version.js";

/**
 * Default field schemas for package.json. Each optional field uses
 * Schema.optionalWith to produce Option in the decoded type, or
 * defaults to an empty HashMap when absent.
 */
export const defaultFields = {
	name: PackageName,
	version: VersionSchema,
	description: Schema.optionalWith(Schema.String, { as: "Option" }),
	private: Schema.optionalWith(Schema.Boolean, { as: "Option" }),
	type: Schema.optionalWith(Schema.Literal("module", "commonjs"), { as: "Option" }),
	main: Schema.optionalWith(Schema.String, { as: "Option" }),
	license: Schema.optionalWith(Schema.String, { as: "Option" }),
	dependencies: Schema.optionalWith(DependencyMapSchema, {
		default: () => HashMap.empty<string, string>(),
	}),
	devDependencies: Schema.optionalWith(DependencyMapSchema, {
		default: () => HashMap.empty<string, string>(),
	}),
	peerDependencies: Schema.optionalWith(DependencyMapSchema, {
		default: () => HashMap.empty<string, string>(),
	}),
	optionalDependencies: Schema.optionalWith(DependencyMapSchema, {
		default: () => HashMap.empty<string, string>(),
	}),
	peerDependenciesMeta: Schema.optionalWith(
		Schema.Record({
			key: Schema.String,
			value: Schema.Struct({ optional: Schema.optional(Schema.Boolean) }),
		}),
		{ as: "Option" },
	),
	scripts: Schema.optionalWith(ScriptsSchema, {
		default: () => HashMap.empty<string, string>(),
	}),
	bin: Schema.optionalWith(BinSchema, { as: "Option" }),
	engines: Schema.optionalWith(EnginesSchema, { as: "Option" }),
	exports: Schema.optionalWith(ExportsFieldSchema, { as: "Option" }),
	publishConfig: Schema.optionalWith(PublishConfigSchema, { as: "Option" }),
	packageManager: Schema.optionalWith(PackageManagerSchema, { as: "Option" }),
	devEngines: Schema.optionalWith(DevEnginesSchema, { as: "Option" }),
};

/**
 * The core PackageJsonSchema with typed known fields and an open record
 * index signature that preserves unknown fields as unknown values.
 */
export const PackageJsonSchema = Schema.Struct(defaultFields, {
	key: Schema.String,
	value: Schema.Unknown,
});

/** Decoded type for PackageJsonSchema. */
export type PackageJsonSchemaType = Schema.Schema.Type<typeof PackageJsonSchema>;

/** Encoded type for PackageJsonSchema (plain JSON). */
export type PackageJsonSchemaEncoded = Schema.Schema.Encoded<typeof PackageJsonSchema>;

/**
 * Factory to create a PackageJsonSchema with custom field overrides.
 * Overridden fields replace the default schema for that field name.
 * Unknown fields are still preserved via the open record.
 */
export const makePackageJsonSchema = <F extends Schema.Struct.Fields>(overrides: F) => {
	const merged = { ...defaultFields, ...overrides };
	return Schema.Struct(merged as typeof defaultFields & F, { key: Schema.String, value: Schema.Unknown });
};
