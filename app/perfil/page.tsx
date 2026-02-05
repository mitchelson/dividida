import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfilePageClient } from "@/components/profile-page"

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  return <ProfilePageClient initialProfile={profile} userEmail={user.email || ""} />
}
