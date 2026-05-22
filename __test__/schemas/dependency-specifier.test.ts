import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { DependencySpecifier, decodeSpecifier } from "../../src/schemas/dependency-specifier.js";

describe("DependencySpecifier schema", () => {
	it("accepts semver ranges", () => {
		expect(Schema.decodeUnknownSync(DependencySpecifier)("^1.0.0")).toBe("^1.0.0");
		expect(Schema.decodeUnknownSync(DependencySpecifier)("~2.3.4")).toBe("~2.3.4");
		expect(Schema.decodeUnknownSync(DependencySpecifier)(">=1.0.0 <2.0.0")).toBe(">=1.0.0 <2.0.0");
		expect(Schema.decodeUnknownSync(DependencySpecifier)("1.2.3")).toBe("1.2.3");
		expect(Schema.decodeUnknownSync(DependencySpecifier)("*")).toBe("*");
		expect(Schema.decodeUnknownSync(DependencySpecifier)("1.x")).toBe("1.x");
	});

	it("accepts tags", () => {
		expect(Schema.decodeUnknownSync(DependencySpecifier)("latest")).toBe("latest");
		expect(Schema.decodeUnknownSync(DependencySpecifier)("next")).toBe("next");
	});

	it("accepts URL specifiers", () => {
		expect(Schema.decodeUnknownSync(DependencySpecifier)("https://example.com/pkg.tgz")).toBe(
			"https://example.com/pkg.tgz",
		);
	});

	it("accepts git specifiers", () => {
		expect(Schema.decodeUnknownSync(DependencySpecifier)("git+https://github.com/user/repo.git")).toBe(
			"git+https://github.com/user/repo.git",
		);
		expect(Schema.decodeUnknownSync(DependencySpecifier)("git+ssh://git@github.com/user/repo.git")).toBe(
			"git+ssh://git@github.com/user/repo.git",
		);
	});

	it("accepts hosted-git prefixes", () => {
		expect(Schema.decodeUnknownSync(DependencySpecifier)("github:u/r")).toBe("github:u/r");
		expect(Schema.decodeUnknownSync(DependencySpecifier)("gist:abc")).toBe("gist:abc");
		expect(Schema.decodeUnknownSync(DependencySpecifier)("bitbucket:u/r")).toBe("bitbucket:u/r");
		expect(Schema.decodeUnknownSync(DependencySpecifier)("gitlab:u/r")).toBe("gitlab:u/r");
	});

	it("rejects unrecognized specifiers", () => {
		expect(() => Schema.decodeUnknownSync(DependencySpecifier)("!!garbage")).toThrow();
		expect(() => Schema.decodeUnknownSync(DependencySpecifier)("patch:lodash")).toThrow();
	});

	it("accepts GitHub shorthand", () => {
		expect(Schema.decodeUnknownSync(DependencySpecifier)("user/repo")).toBe("user/repo");
		expect(Schema.decodeUnknownSync(DependencySpecifier)("user/repo#branch")).toBe("user/repo#branch");
	});

	it("accepts file paths", () => {
		expect(Schema.decodeUnknownSync(DependencySpecifier)("file:../local-pkg")).toBe("file:../local-pkg");
	});

	it("accepts npm: protocol", () => {
		expect(Schema.decodeUnknownSync(DependencySpecifier)("npm:lodash@^4.0.0")).toBe("npm:lodash@^4.0.0");
	});

	it("accepts catalog: protocol (future-proof)", () => {
		expect(Schema.decodeUnknownSync(DependencySpecifier)("catalog:silk")).toBe("catalog:silk");
	});

	it("accepts workspace: protocol (future-proof)", () => {
		expect(Schema.decodeUnknownSync(DependencySpecifier)("workspace:*")).toBe("workspace:*");
	});

	it("rejects empty string", () => {
		expect(() => Schema.decodeUnknownSync(DependencySpecifier)("")).toThrow();
	});
});

describe("decodeSpecifier", () => {
	it("returns the branded value for a valid specifier", () => {
		const result = Effect.runSync(decodeSpecifier("^1.0.0"));
		expect(result).toBe("^1.0.0");
	});

	it("fails with InvalidDependencySpecifierError for an empty string", () => {
		const exit = Effect.runSyncExit(decodeSpecifier(""));
		expect(exit._tag).toBe("Failure");
		if (exit._tag === "Failure") {
			const cause = exit.cause;
			if (cause._tag === "Fail") {
				expect(cause.error._tag).toBe("InvalidDependencySpecifierError");
			} else {
				throw new Error("Expected Fail cause");
			}
		}
	});
});
