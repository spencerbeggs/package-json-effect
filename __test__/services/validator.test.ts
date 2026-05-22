import { Cause, Chunk, Effect, Option, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { Package } from "../../src/domain/Package.js";
import type { PackageJsonValidationError } from "../../src/errors/PackageJsonValidationError.js";
import {
	PackageJsonValidatorLive,
	defaultRules,
	makePackageJsonValidatorLive,
	noLocalDepsRule,
	noUnresolvedDepsRule,
} from "../../src/layers/PackageJsonValidatorLive.js";
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

const run = (pkg: Package, layer: ReturnType<typeof makePackageJsonValidatorLive>) =>
	Effect.runSyncExit(
		Effect.gen(function* () {
			const v = yield* PackageJsonValidator;
			return yield* v.validate(pkg);
		}).pipe(Effect.provide(layer)),
	);

describe("PackageJsonValidatorLive", () => {
	it("passes for a well-formed package", async () => {
		const pkg = makePackage({
			name: "my-pkg",
			version: "1.0.0",
			license: "MIT",
			description: "A test package",
			repository: { type: "git", url: "https://github.com/example/my-pkg" },
		});

		const result = await Effect.runPromise(runValidator(pkg));
		expect(result.name).toBe("my-pkg");
	});

	it("fails when license is missing", async () => {
		const pkg = makePackage({
			name: "my-pkg",
			version: "1.0.0",
			repository: { type: "git", url: "https://github.com/example/my-pkg" },
		});
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
		const pkg = makePackage({
			name: "my-pkg",
			version: "1.0.0",
			license: "MIT",
			repository: { type: "git", url: "https://github.com/example/my-pkg" },
		});
		const exit = await Effect.runPromiseExit(runValidator(pkg));

		expect(exit._tag).toBe("Failure");
	});
});

describe("default rules", () => {
	it("includes has-repository and not-private and populates paths", () => {
		expect(defaultRules.map((r) => r.name)).toEqual(
			expect.arrayContaining(["has-license", "has-description", "has-repository", "not-private"]),
		);
		const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0", private: true });
		const exit = run(pkg, makePackageJsonValidatorLive({ rules: defaultRules }));
		expect(exit._tag).toBe("Failure");
		if (exit._tag === "Failure") {
			const first = Chunk.get(Cause.failures(exit.cause), 0);
			expect(first._tag).toBe("Some");
			if (first._tag === "Some") {
				const err = first.value as PackageJsonValidationError;
				const notPrivate = err.failures.find((f) => f.rule === "not-private");
				expect(notPrivate).toBeDefined();
				if (notPrivate) {
					expect(Option.getOrNull(notPrivate.path)).toBe("private");
				}
			}
		}
	});
});

describe("publish-readiness rules", () => {
	it("no-unresolved-deps fails on workspace:/catalog:", () => {
		const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({
			name: "p",
			version: "1.0.0",
			dependencies: { a: "workspace:*" },
		});
		const exit = run(pkg, makePackageJsonValidatorLive({ rules: [noUnresolvedDepsRule] }));
		expect(exit._tag).toBe("Failure");
	});

	it("no-local-deps fails on file:/link:/portal:", () => {
		const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({
			name: "p",
			version: "1.0.0",
			dependencies: { a: "link:../x" },
		});
		const exit = run(pkg, makePackageJsonValidatorLive({ rules: [noLocalDepsRule] }));
		expect(exit._tag).toBe("Failure");
	});
});
