import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { isAdmin } from "@/lib/admin"
import { fetchMatches, fetchServers } from "@/lib/api"
import { AdminPanel } from "@/components/admin-panel"
import { Shield } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const session = await getServerSession(getAuthOptions())

  if (!session || !isAdmin(session)) {
    redirect("/")
  }

  const [matches, servers] = await Promise.all([
    fetchMatches(),
    fetchServers(),
  ])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <section className="mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage matches and servers
            </p>
          </div>
        </div>
      </section>

      <div className="animate-fade-in-up stagger-1">
        <AdminPanel matches={matches} servers={servers} />
      </div>
    </div>
  )
}
