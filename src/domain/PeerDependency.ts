import { Schema } from "effect";

export class PeerDependency extends Schema.TaggedClass<PeerDependency>()("PeerDependency", {
	name: Schema.String,
	specifier: Schema.String,
	isOptional: Schema.Boolean,
}) {}
