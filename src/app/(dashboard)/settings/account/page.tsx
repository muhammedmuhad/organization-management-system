import Link from "next/link";
import {
  ArrowLeft,
  LockKeyhole,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

import AccountSecurityForm from "./AccountSecurityForm";

export default async function AccountSecurityPage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as { id?: string }).id;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      fullName: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/settings"
          className="mt-1 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to settings"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-700">
              <LockKeyhole className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Account Security
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your login username and password.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Account */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="border-b border-gray-200 pb-5">
          <h2 className="font-semibold text-gray-900">
            Current Account
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Account information currently associated with your login.
          </p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Full Name
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {user.fullName}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Role
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {user.role}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Current Username
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {user.username}
            </p>
          </div>
        </div>
      </section>

      {/* Security Form */}
      <AccountSecurityForm
        currentUsername={user.username}
      />
    </div>
  );
}