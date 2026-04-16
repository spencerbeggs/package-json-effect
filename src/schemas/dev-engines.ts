import { Schema } from "effect";

const OnFail = Schema.Literal("warn", "error", "ignore");

/**
 * A single engine constraint with name, optional version, and optional onFail behavior.
 */
export class DevEngine extends Schema.Class<DevEngine>("DevEngine")({
	name: Schema.String,
	version: Schema.optionalWith(Schema.String, { as: "Option" }),
	onFail: Schema.optionalWith(OnFail, { as: "Option" }),
}) {}

const DevEngineOrArray = Schema.Union(DevEngine, Schema.Array(DevEngine));

/**
 * Schema for the devEngines field, modeling runtime and
 * package manager constraints with optional arrays.
 */
export const DevEnginesSchema = Schema.Struct({
	packageManager: Schema.optionalWith(DevEngineOrArray, { as: "Option" }),
	runtime: Schema.optionalWith(DevEngineOrArray, { as: "Option" }),
	os: Schema.optionalWith(DevEngineOrArray, { as: "Option" }),
	cpu: Schema.optionalWith(DevEngineOrArray, { as: "Option" }),
	libc: Schema.optionalWith(DevEngineOrArray, { as: "Option" }),
});

export type DevEngines = Schema.Schema.Type<typeof DevEnginesSchema>;
