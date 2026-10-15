import { describe, expect, it } from "vitest";
import { initialsFor } from "./initials";

describe("initialsFor", () => {
  it("uses the first letters of the first two words", () => {
    expect(initialsFor("Anshu Agrawal")).toBe("AA");
    expect(initialsFor("natasha")).toBe("N");
  });

  it("skips symbols and digits", () => {
    expect(initialsFor("Tanya + Sharmila ganguli")).toBe("TS");
    expect(initialsFor("1")).toBe("?");
  });
});
