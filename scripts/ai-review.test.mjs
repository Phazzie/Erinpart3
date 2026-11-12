import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clipDiff, commentDestination, deliverReview, reviewDecision, reviewPrompt } from "./ai-review.mjs";

describe("ai review", () => {
  it("skips when the key is missing and reviews when it is set", () => {
    assert.equal(reviewDecision({}).action, "skip");
    assert.equal(reviewDecision({ XAI_API_KEY: "  " }).action, "skip");
    assert.equal(reviewDecision({ XAI_API_KEY: "xai-test" }).action, "review");
  });

  it("clips a huge diff and keeps a short one", () => {
    assert.equal(clipDiff("small"), "small");
    const huge = "a".repeat(20_000);
    const clipped = clipDiff(huge);
    assert.equal(clipped.endsWith("[diff truncated]"), true);
    assert.equal(clipped.length < huge.length, true);
  });

  it("comments on Origin when there is a pull request number", () => {
    assert.equal(commentDestination({ PR_NUMBER: "8" }), "origin");
    assert.equal(commentDestination({}), "stdout");
  });

  it("prints the review and resolves when the Origin CLI is missing", async () => {
    const lines = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalPath = process.env.PATH;
    console.log = (...args) => lines.push(args.join(" "));
    console.error = () => {};
    process.env.PATH = "/usr/bin:/bin";
    try {
      await deliverReview({ PR_NUMBER: "8" }, "hello review");
    } finally {
      process.env.PATH = originalPath;
      console.log = originalLog;
      console.error = originalError;
    }
    const output = lines.join("\n");
    assert.match(output, /hello review/);
    assert.match(output, /Origin CLI is missing|Origin comment failed/);
  });

  it("asks for bugs rather than style notes", () => {
    const prompt = reviewPrompt("diff --git a/src/core/services/task.service.ts");
    assert.match(prompt, /security|data loss|session sync|auth/i);
    assert.match(prompt, /diff --git a\/src\/core\/services\/task\.service\.ts/);
  });
});
