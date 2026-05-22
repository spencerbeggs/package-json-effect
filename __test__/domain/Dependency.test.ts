import { Option } from "effect";
import { describe, expect, it } from "vitest";
import { Dependency, isUnresolvedDependency, protocolOf } from "../../src/domain/Dependency.js";
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

describe("Dependency protocol taxonomy", () => {
	const protoOf = (s: string) => Option.getOrNull(new Dependency({ name: "x", specifier: s }).protocol);

	it("classifies every protocol", () => {
		expect(protoOf("^1.0.0")).toBe("range");
		expect(protoOf("1.2.3")).toBe("range");
		expect(protoOf("latest")).toBe("tag");
		expect(protoOf("git+https://github.com/u/r.git")).toBe("git");
		expect(protoOf("https://example.com/p.tgz")).toBe("url");
		expect(protoOf("npm:lodash@^4")).toBe("npm");
		expect(protoOf("file:../local")).toBe("file");
		expect(protoOf("link:../local")).toBe("link");
		expect(protoOf("portal:../local")).toBe("portal");
		expect(protoOf("catalog:silk")).toBe("catalog");
		expect(protoOf("workspace:*")).toBe("workspace");
	});

	it("classifies bare GitHub shorthand as git", () => {
		expect(protocolOf("user/repo")).toBe("git");
		expect(protocolOf("user/repo#main")).toBe("git");
	});

	it("classifies hosted-git prefixes as git", () => {
		expect(protocolOf("github:u/r")).toBe("git");
		expect(protocolOf("gist:abc")).toBe("git");
		expect(protocolOf("bitbucket:u/r")).toBe("git");
		expect(protocolOf("gitlab:u/r")).toBe("git");
	});

	it("classifies bare local paths as file", () => {
		expect(protocolOf("./foo")).toBe("file");
		expect(protocolOf("../foo")).toBe("file");
		expect(protocolOf("~/foo")).toBe("file");
		expect(protocolOf("/abs/p")).toBe("file");
	});

	it("classifies unrecognized specifiers as unknown", () => {
		expect(protocolOf("!!garbage")).toBe("unknown");
		expect(protocolOf("patch:lodash")).toBe("unknown");
	});

	it("exposes convenience getters", () => {
		const link = new Dependency({ name: "x", specifier: "link:../l" });
		expect(link.isLocal).toBe(true);
		expect(link.isLink).toBe(true);
		expect(link.isPortal).toBe(false);
		expect(link.isUnresolved).toBe(false);

		const portal = new Dependency({ name: "x", specifier: "portal:../p" });
		expect(portal.isLocal).toBe(true);
		expect(portal.isPortal).toBe(true);
		expect(portal.isLink).toBe(false);

		const cat = new Dependency({ name: "x", specifier: "catalog:silk" });
		expect(cat.isCatalog).toBe(true);
		expect(cat.isUnresolved).toBe(true);
		expect(isUnresolvedDependency(cat)).toBe(true);
		expect(isUnresolvedDependency(link)).toBe(false);

		const barePath = new Dependency({ name: "x", specifier: "../foo" });
		expect(barePath.isLocal).toBe(true);
		expect(barePath.isGit).toBe(false);

		const ghShorthand = new Dependency({ name: "x", specifier: "user/repo" });
		expect(ghShorthand.isGit).toBe(true);
		expect(ghShorthand.isLocal).toBe(false);
	});

	it("parses a semver range via semver-effect", () => {
		const dep = new Dependency({ name: "x", specifier: "^1.2.0" });
		expect(Option.isSome(dep.range)).toBe(true);
		const tag = new Dependency({ name: "x", specifier: "latest" });
		expect(Option.isNone(tag.range)).toBe(true);
	});
});
