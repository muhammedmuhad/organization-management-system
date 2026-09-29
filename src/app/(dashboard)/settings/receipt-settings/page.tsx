import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Hash,
  Save,
} from "lucide-react";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

async function saveReceiptSettings(formData: FormData) {
  "use server";

  const receiptPrefix = String(
    formData.get("receiptPrefix") || "",
  )
    .trim()
    .toUpperCase();

  if (!receiptPrefix) {
    throw new Error("Receipt prefix is required.");
  }

  if (!/^[A-Z0-9-]+$/.test(receiptPrefix)) {
    throw new Error(
      "Receipt prefix can contain only letters, numbers and hyphens.",
    );
  }

  if (receiptPrefix.length > 20) {
    throw new Error(
      "Receipt prefix must not exceed 20 characters.",
    );
  }

  const existing =
    await prisma.systemConfiguration.findFirst({
      select: {
        id: true,
      },
    });

  if (existing) {
    await prisma.systemConfiguration.update({
      where: {
        id: existing.id,
      },
      data: {
        receiptPrefix,
      },
    });
  } else {
    await prisma.systemConfiguration.create({
      data: {
        mahalluName: "Pandarakkandy Mahallu",
        receiptPrefix,
      },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/settings/receipt-settings");
  revalidatePath("/finance/membership");
}

export default async function ReceiptSettingsPage() {
  const configuration =
    await prisma.systemConfiguration.findFirst({
      select: {
        receiptPrefix: true,
      },
    });

  const receiptPrefix =
    configuration?.receiptPrefix?.trim() || "RCPT";

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

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Receipt Settings
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Configure the prefix used when generating membership
              receipt numbers.
            </p>
          </div>
        </div>
      </div>

      <form action={saveReceiptSettings}>
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Receipt Numbering
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                The prefix is combined with the system-generated
                receipt sequence.
              </p>
            </div>

            <div className="max-w-xl">
              <label
                htmlFor="receiptPrefix"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Receipt Prefix
              </label>

              <div className="relative">
                <Hash className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="receiptPrefix"
                  name="receiptPrefix"
                  type="text"
                  required
                  maxLength={20}
                  defaultValue={receiptPrefix}
                  placeholder="RCPT"
                  className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-sm font-medium uppercase text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Letters, numbers and hyphens only. Maximum 20
                characters.
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-purple-100 bg-purple-50 px-5 py-4">
              <p className="text-sm font-medium text-purple-900">
                Example receipt number
              </p>

              <p className="mt-1 text-xl font-bold tracking-wide text-purple-950">
                {receiptPrefix}-000001
              </p>

              <p className="mt-1 text-sm text-purple-800">
                The number after the prefix is generated automatically
                from the receipt sequence.
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Save className="h-4 w-4" />
              Save Receipt Settings
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}