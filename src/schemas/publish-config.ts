import { Schema } from "effect";

/**
 * Schema for the publishConfig field with typed known fields
 * and an open record for arbitrary extensions like targets.
 */
export const PublishConfigSchema = Schema.Struct(
	{
		access: Schema.optionalWith(Schema.Literal("public", "restricted"), { as: "Option" }),
		directory: Schema.optionalWith(Schema.String, { as: "Option" }),
		registry: Schema.optionalWith(Schema.String, { as: "Option" }),
		linkDirectory: Schema.optionalWith(Schema.Boolean, { as: "Option" }),
	},
	{ key: Schema.String, value: Schema.Unknown },
);

export type PublishConfig = Schema.Schema.Type<typeof PublishConfigSchema>;
