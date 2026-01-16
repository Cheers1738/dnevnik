import { describe, expect, it } from "vitest";
import { buildStubArtifact } from "../src/llm/stub.js";

describe("buildStubArtifact", () => {
  it("returns deterministic artifact with 5 quotes", () => {
    const artifact = buildStubArtifact({
      messages: [],
      mode: "support"
    });

    expect(artifact.quotes).toHaveLength(5);
    expect(artifact.chapter_title).toBeDefined();
  });
});
