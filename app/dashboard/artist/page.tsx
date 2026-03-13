import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabaseClient";

/**
 * Artist dashboard index page.
 * Redirects to the profile page which is the main entry point.
 */
export default async function ArtistDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Middleware handles auth, but double-check here
  if (!session) {
    redirect("/login");
  }

  // Redirect to profile page
  redirect("/dashboard/artist/profile");
}
