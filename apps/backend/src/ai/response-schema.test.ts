import { describe, it, expect } from "vitest";
import { parseLLMResponse } from "./response-schema";

describe("parseLLMResponse", () => {
  it("parses a clean JSON object", () => {
    const raw = JSON.stringify({
      summary: "API failed.",
      possible_cause: "Upstream outage.",
      recommended_action: "Check upstream status.",
    });
    const result = parseLLMResponse(raw);
    expect(result.summary).toBe("API failed.");
  });

  it("strips markdown code fences before parsing", () => {
    const raw = "```json\n" + JSON.stringify({
      summary: "s",
      possible_cause: "c",
      recommended_action: "a",
    }) + "\n```";
    const result = parseLLMResponse(raw);
    expect(result.summary).toBe("s");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseLLMResponse("not json")).toThrow();
  });

  it("throws when required fields are missing", () => {
    expect(() => parseLLMResponse(JSON.stringify({ summary: "s" }))).toThrow();
  });
});
