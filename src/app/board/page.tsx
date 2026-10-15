import { redirect } from "next/navigation";

/** The workshop board now lives on the dashboard. */
export default function BoardPage() {
  redirect("/dashboard?view=board#work-area");
}
