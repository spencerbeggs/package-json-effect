import { describe, expect, it } from "vitest";
import { Dependency } from "../../src/domain/Dependency.js";
import { DevDependency } from "../../src/domain/DevDependency.js";
import { OptionalDependency } from "../../src/domain/OptionalDependency.js";
import { PeerDependency } from "../../src/domain/PeerDependency.js";

describe("Dependency", () => {
	it("creates a dependency with name and specifier", () => {
		const dep = new Dependency({ name: "lodash", specifier: "^4.0.0" });
		expect(dep.name).toBe("lodash");
		expect(dep.specifier).toBe("^4.0.0");
		expect(dep._tag).toBe("Dependency");
	});

	it("detects local dependencies", () => {
		const dep = new Dependency({ name: "local", specifier: "file:../local" });
		expect(dep.isLocal).toBe(true);
		expect(dep.isGit).toBe(false);
	});

	it("detects git dependencies", () => {
		const dep = new Dependency({ name: "git-pkg", specifier: "git+https://github.com/user/repo.git" });
		expect(dep.isGit).toBe(true);
		expect(dep.isLocal).toBe(false);
	});

	it("detects range dependencies", () => {
		const dep = new Dependency({ name: "pkg", specifier: "^1.0.0" });
		expect(dep.isRange).toBe(true);
		expect(dep.isTag).toBe(false);
	});

	it("detects tag dependencies", () => {
		const dep = new Dependency({ name: "pkg", specifier: "latest" });
		expect(dep.isTag).toBe(true);
		expect(dep.isRange).toBe(false);
	});
});

describe("DevDependency", () => {
	it("has _tag DevDependency", () => {
		const dep = new DevDependency({ name: "vitest", specifier: "^1.0.0" });
		expect(dep._tag).toBe("DevDependency");
	});
});

describe("PeerDependency", () => {
	it("has _tag PeerDependency", () => {
		const dep = new PeerDependency({ name: "effect", specifier: "^3.0.0", isOptional: false });
		expect(dep._tag).toBe("PeerDependency");
		expect(dep.isOptional).toBe(false);
	});
});

describe("OptionalDependency", () => {
	it("has _tag OptionalDependency", () => {
		const dep = new OptionalDependency({ name: "fsevents", specifier: "^2.0.0" });
		expect(dep._tag).toBe("OptionalDependency");
	});
});
