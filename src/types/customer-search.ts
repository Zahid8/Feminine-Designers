import type { MeasurementValue } from "@/types/domain";

export interface ReturningCustomerMatch {
  id: string;
  customerCode: string;
  fullName: string;
  phonePrimary: string;
  measurements: MeasurementValue[];
}
