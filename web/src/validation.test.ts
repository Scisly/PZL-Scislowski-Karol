import { describe, expect, it } from "vitest";
import { validate, passwordError } from "./validation";
describe("domain form constraints", () => {
  it("rejects whitespace and reports named fields", () => {
    expect(
      validate(
        { name: "   ", deadline: "" },
        { name: { required: true, max: 200 }, deadline: { required: true } },
      ),
    ).toEqual({ name: "Uzupełnij to pole.", deadline: "Uzupełnij to pole." });
  });
  it("accepts optional dates but prevents task dates past project deadline", () => {
    expect(
      validate({ dueDate: "" }, { dueDate: { maxDate: "2026-12-01" } }),
    ).toEqual({});
    expect(
      validate(
        { dueDate: "2026-12-02" },
        { dueDate: { maxDate: "2026-12-01" } },
      ),
    ).toHaveProperty("dueDate");
  });
  it("checks password complexity without trimming passwords", () => {
    expect(passwordError("short")).toBeTruthy();
    expect(passwordError("Student!1234")).toBeUndefined();
  });
});
