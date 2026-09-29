import Link from "next/link";
import { ArrowLeft, Building2, Mail, MapPin, Phone, Save } from "lucide-react";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

async function saveGeneralInformation(formData: FormData) {
  "use server";

  const mahalluName = String(formData.get("mahalluName") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!mahalluName) {
    throw new Error("Mahallu name is required.");
  }

  const existing = await prisma.systemConfiguration.findFirst({
    select: { id: true },
  });

  if (existing) {
    await prisma.systemConfiguration.update({
      where: { id: existing.id },
      data: {
        mahalluName,
        address: address || null,
        phone: phone || null,
        email: email || null,
      },
    });
  } else {
    await prisma.systemConfiguration.create({
      data: {
        mahalluName,
        address: address || null,
        phone: phone || null,
        email: email || null,
      },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/settings/general");
}

export default async function GeneralInformationPage() {
  const configuration =
    await prisma.systemConfiguration.findFirst({
      select: {
        mahalluName: true,
        address: true,
        phone: true,
        email: true,
      },
    });

  return (
    <div className="space-y-6">
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
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                General Information
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your Mahallu name and contact information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form action={saveGeneralInformation}>
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Mahallu Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                These details can be used throughout the admin panel,
                receipts and reports.
              </p>
            </div>

            <div className="space-y-6">
              {/* Mahallu Name */}
              <div>
                <label
                  htmlFor="mahalluName"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Mahallu Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="mahalluName"
                  name="mahalluName"
                  type="text"
                  required
                  defaultValue={configuration?.mahalluName ?? ""}
                  placeholder="Enter Mahallu name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Address
                </label>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-gray-400" />

                  <textarea
                    id="address"
                    name="address"
                    rows={4}
                    defaultValue={configuration?.address ?? ""}
                    placeholder="Enter Mahallu address"
                    className="w-full resize-none rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-gray-900"
                  >
                    Phone
                  </label>

                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={configuration?.phone ?? ""}
                      placeholder="Enter phone number"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-900"
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={configuration?.email ?? ""}
                      placeholder="Enter email address"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}