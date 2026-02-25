import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Redirect to the user's jogador page
  redirect(`/jogador/${user.id}`)
}
