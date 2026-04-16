import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { DependencySpecifier } from "../../src/schemas/dependency-specifier.js";

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
