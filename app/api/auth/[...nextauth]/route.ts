import NextAuth from "next-auth"
import type { NextRequest } from "next/server"
import { getAuthOptions } from "@/lib/auth"

async function auth(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  const params = await ctx.params
  return NextAuth(req, { params }, getAuthOptions(req))
}

export { auth as GET, auth as POST }
