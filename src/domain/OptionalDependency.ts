import { Schema } from "effect";

export class OptionalDependency extends Schema.TaggedClass<OptionalDependency>()("OptionalDependency", {
	name: Schema.String,
	specifier: Schema.String,
}) {}
