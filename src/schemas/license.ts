import { Schema } from "effect";
import spdxParse from "spdx-expression-parse";

const isValidSpdx = (s: string): boolean => {
	if (s === "UNLICENSED") return true;
	if (s.startsWith("SEE LICENSE IN ") && s.length > 15) return true;
	try {
		spdxParse(s);
		return true;
	} catch {
		return false;
	}
};

/**
 * A valid SPDX license identifier, expression, "UNLICENSED",
 * or "SEE LICENSE IN filename".
 */
export const SpdxLicense = Schema.String.pipe(
	Schema.filter((s) => isValidSpdx(s) || "Expected a valid SPDX license identifier or expression"),
	Schema.brand("SpdxLicense"),
);

/** Branded type for SPDX license strings. */
export type SpdxLicense = Schema.Schema.Type<typeof SpdxLicense>;
