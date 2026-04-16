import { Cause, Chunk, Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { Package } from "../../src/domain/Package.js";
import type { PackageJsonValidationError } from "../../src/errors/PackageJsonValidationError.js";
import { PackageJsonValidatorLive } from "../../src/layers/PackageJsonValidatorLive.js";
import { PackageJsonSchema } from "../../src/schemas/package-json.js";
import { PackageJsonValidator } from "../../src/services/PackageJsonValidator.js";

const makePackage = (json: Record<string, unknown>) => {
	const decoded = Schema.decodeUnknownSync(PackageJsonSchema)(json);
	return new Package(decoded);
};

const runValidator = (pkg: Package) =>
	Effect.gen(function* () {
		const validator = yield* PackageJsonValidator;
		return yield* validator.validate(pkg);
	}).pipe(Effect.provide(PackageJsonValidatorLive));

describe("PackageJsonValidatorLive", () => {
	it("passes for a well-formed package", async () => {
		const pkg = makePackage({
			name: "my-pkg",
			version: "1.0.0",
			license: "MIT",
			description: "A test package",
		});

		const result = await Effect.runPromise(runValidator(pkg));
		expect(result.name).toBe("my-pkg");
	});

	it("fails when license is missing", async () => {
		const pkg = makePackage({ name: "my-pkg", version: "1.0.0" });
		const exit = await Effect.runPromiseExit(runValidator(pkg));

		expect(exit._tag).toBe("Failure");
		if (exit._tag === "Failure") {
			const failures = Cause.failures(exit.cause);
			const first = Chunk.get(failures, 0);
			expect(first._tag).toBe("Some");
			if (first._tag === "Some") {
				const err = first.value as PackageJsonValidationError;
				expect(err._tag).toBe("PackageJsonValidationError");
				expect(err.failures.some((f) => f.rule === "has-license")).toBe(true);
			}
		}
	});

	it("fails when description is missing", async () => {
		const pkg = makePackage({ name: "my-pkg", version: "1.0.0", license: "MIT" });
		const exit = await Effect.runPromiseExit(runValidator(pkg));

		expect(exit._tag).toBe("Failure");
	});
});
