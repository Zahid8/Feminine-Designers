import { describe, expect, it } from "vitest";
import {
  parseGarmentTypeFormData,
  parseMeasurementFieldFormData,
  parseMeasurementTemplateFormData
} from "@/services/settings/settings-form-parser";

describe("settings form parsers", () => {
  it("parses a new garment type name", () => {
    const formData = new FormData();
    formData.set("name", "Sharara");

    expect(parseGarmentTypeFormData(formData)).toEqual({ name: "Sharara" });
  });

  it("parses a new measurement template", () => {
    const formData = new FormData();
    formData.set("name", "Sharara measurements");
    formData.set("garmentCategories", "Sharara, Suit");
    formData.set("description", "Lower garment template");

    expect(parseMeasurementTemplateFormData(formData)).toEqual({
      name: "Sharara measurements",
      garmentCategories: ["Sharara", "Suit"],
      description: "Lower garment template"
    });
  });

  it("parses a new measurement field for an existing template", () => {
    const formData = new FormData();
    formData.set("templateId", "tmpl-general");
    formData.set("fieldKey", "ankle_round");
    formData.set("displayCode", "AR");
    formData.set("displayLabel", "AR");
    formData.set("longLabel", "Ankle Round");
    formData.set("inputType", "number");
    formData.set("unit", "in");
    formData.set("isRequired", "on");

    expect(parseMeasurementFieldFormData(formData)).toMatchObject({
      templateId: "tmpl-general",
      fieldKey: "ankle_round",
      displayCode: "AR",
      displayLabel: "AR",
      longLabel: "Ankle Round",
      inputType: "number",
      unit: "in",
      isRequired: true
    });
  });
});
