import { Effect, Option } from "effect";
import { describe, expect, it } from "vitest";
import { InvalidDependencySpecifierError } from "../../src/errors/InvalidDependencySpecifierError.js";
import { InvalidPackageNameError } from "../../src/errors/InvalidPackageNameError.js";
import { PackageJsonDecodeError } from "../../src/errors/PackageJsonDecodeError.js";
import { PackageJsonNotFoundError } from "../../src/errors/PackageJsonNotFoundError.js";
import { PackageJsonParseError } from "../../src/errors/PackageJsonParseError.js";
import { PackageJsonReadError } from "../../src/errors/PackageJsonReadError.js";
import { PackageJsonValidationError } from "../../src/errors/PackageJsonValidationError.js";
import { PackageJsonWriteError } from "../../src/errors/PackageJsonWriteError.js";

describe("InvalidPackageNameError", () => {
	it("has correct _tag", () => {
		const err = new InvalidPackageNameError({ input: ".bad", reason: "Cannot start with ." });
		expect(err._tag).toBe("InvalidPackageNameError");
	});

	it("produces a human-readable message", () => {
		const err = new InvalidPackageNameError({ input: ".bad", reason: "Cannot start with ." });
		expect(err.message).toContain(".bad");
		expect(err.message).toContain("Cannot start with .");
	});

	it("is catchable by tag in Effect", () => {
		const program = Effect.fail(new InvalidPackageNameError({ input: "BAD", reason: "Must be lowercase" })).pipe(
			Effect.catchTag("InvalidPackageNameError", (e) => Effect.succeed(e.input)),
		);
		expect(Effect.runSync(program)).toBe("BAD");
	});
});

describe("InvalidDependencySpecifierError", () => {
	it("has correct _tag and message", () => {
		const err = new InvalidDependencySpecifierError({ input: "???", reason: "Unrecognized format" });
		expect(err._tag).toBe("InvalidDependencySpecifierError");
		expect(err.message).toContain("???");
	});
});

describe("PackageJsonParseError", () => {
	it("has correct _tag and message", () => {
		const err = new PackageJsonParseError({ input: "{bad json", position: Option.some(1) });
		expect(err._tag).toBe("PackageJsonParseError");
		expect(err.message).toContain("position 1");
	});

	it("handles no position", () => {
		const err = new PackageJsonParseError({ input: "{bad", position: Option.none() });
		expect(err.message).not.toContain("position");
	});
});

describe("PackageJsonDecodeError", () => {
	it("has correct _tag", () => {
		const err = new PackageJsonDecodeError({ input: { name: 123 }, message: "Expected string" });
		expect(err._tag).toBe("PackageJsonDecodeError");
	});
});

describe("PackageJsonReadError", () => {
	it("has correct _tag and source", () => {
		const err = new PackageJsonReadError({ source: "/foo/package.json", cause: "EACCES" });
		expect(err._tag).toBe("PackageJsonReadError");
		expect(err.source).toBe("/foo/package.json");
		expect(err.message).toContain("/foo/package.json");
	});
});

describe("PackageJsonWriteError", () => {
	it("has correct _tag and target", () => {
		const err = new PackageJsonWriteError({ target: "/foo/package.json", cause: "EACCES" });
		expect(err._tag).toBe("PackageJsonWriteError");
		expect(err.target).toBe("/foo/package.json");
		expect(err.message).toContain("/foo/package.json");
	});
});

describe("PackageJsonNotFoundError", () => {
	it("has correct _tag and source", () => {
		const err = new PackageJsonNotFoundError({ source: "/missing/package.json" });
		expect(err._tag).toBe("PackageJsonNotFoundError");
		expect(err.message).toContain("/missing/package.json");
	});
});

describe("PackageJsonValidationError", () => {
	it("has correct _tag and failures", () => {
		const err = new PackageJsonValidationError({
			failures: [
				{ rule: "has-license", message: "Missing license field", path: Option.some("license") },
				{ rule: "not-private", message: "Package is private", path: Option.none() },
			],
		});
		expect(err._tag).toBe("PackageJsonValidationError");
		expect(err.failures).toHaveLength(2);
		expect(err.message).toContain("has-license");
		expect(err.message).toContain("not-private");
	});
});
