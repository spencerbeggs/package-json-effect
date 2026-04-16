import { Option } from "effect";
import { describe, expect, it } from "vitest";
import { PackageNameUtil } from "../../src/domain/PackageName.js";

describe("PackageNameUtil", () => {
	it("extracts scope from scoped name", () => {
		const result = PackageNameUtil.scope("@myorg/mypkg");
		expect(Option.isSome(result)).toBe(true);
		expect(Option.getOrThrow(result)).toBe("myorg");
	});

	it("returns None for unscoped name", () => {
		const result = PackageNameUtil.scope("lodash");
		expect(Option.isNone(result)).toBe(true);
	});

	it("extracts unscoped part from scoped name", () => {
		expect(PackageNameUtil.unscoped("@myorg/mypkg")).toBe("mypkg");
	});

	it("returns full name for unscoped name", () => {
		expect(PackageNameUtil.unscoped("lodash")).toBe("lodash");
	});

	it("detects scoped names", () => {
		expect(PackageNameUtil.isScoped("@scope/pkg")).toBe(true);
		expect(PackageNameUtil.isScoped("lodash")).toBe(false);
	});
});
