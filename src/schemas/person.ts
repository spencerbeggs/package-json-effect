import { Schema } from "effect";

/**
 * Structured person object with name, optional email and url.
 */
export class Person extends Schema.Class<Person>("Person")({
	name: Schema.String,
	email: Schema.optional(Schema.String),
	url: Schema.optional(Schema.String),
}) {}

const parsePersonString = (s: string): Person => {
	const emailMatch = s.match(/<([^>]+)>/);
	const urlMatch = s.match(/\(([^)]+)\)/);
	let name = s;
	if (emailMatch) name = name.replace(emailMatch[0], "");
	if (urlMatch) name = name.replace(urlMatch[0], "");
	name = name.trim();
	const fields: { name: string; email?: string; url?: string } = { name };
	if (emailMatch) fields.email = emailMatch[1];
	if (urlMatch) fields.url = urlMatch[1];
	return new Person(fields, true);
};

const PersonFromString = Schema.transform(Schema.String, Schema.typeSchema(Person), {
	strict: true,
	decode: (s) => parsePersonString(s),
	encode: (p) => {
		let result = p.name;
		if (p.email) result += ` <${p.email}>`;
		if (p.url) result += ` (${p.url})`;
		return result;
	},
});

/**
 * Person field: either a string "Name email (url)" shorthand or a
 * structured object with name, email, and url fields.
 * Always decoded to the object form.
 */
export const PersonSchema = Schema.Union(Person, PersonFromString);
