"use server";

import { createDiagnosisFromForm } from "./persistence";

export async function submitDiagnosisAction(formData: FormData) {
  return createDiagnosisFromForm(formData);
}
