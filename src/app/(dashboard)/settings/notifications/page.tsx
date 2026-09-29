import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  MessageSquare,
  Save,
} from "lucide-react";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

const SETTINGS_KEYS = {
  enabled: "notifications_enabled",
  smsEnabled: "notifications_sms_enabled",
  eventEnabled: "notifications_event_enabled",
  paymentEnabled: "notifications_payment_enabled",
  systemEnabled: "notifications_system_enabled",
} as const;

async function getSetting(
  key: string,
  defaultValue: boolean,
) {
  const setting = await prisma.setting.findUnique({
    where: { key },
    select: { value: true },
  });

  if (!setting) {
    return defaultValue;
  }

  return setting.value === "true";
}

async function saveNotificationSettings(
  formData: FormData,
) {
  "use server";

  const values = {
    [SETTINGS_KEYS.enabled]:
      formData.get("notificationsEnabled") === "on",

    [SETTINGS_KEYS.smsEnabled]:
      formData.get("smsEnabled") === "on",

    [SETTINGS_KEYS.eventEnabled]:
      formData.get("eventNotifications") === "on",

    [SETTINGS_KEYS.paymentEnabled]:
      formData.get("paymentNotifications") === "on",

    [SETTINGS_KEYS.systemEnabled]:
      formData.get("systemNotifications") === "on",
  };

  for (const [key, value] of Object.entries(values)) {
    await prisma.setting.upsert({
      where: { key },
      update: {
        value: String(value),
      },
      create: {
        key,
        value: String(value),
      },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/settings/notifications");
}

export default async function NotificationsSettingsPage() {
  const [
    notificationsEnabled,
    smsEnabled,
    eventNotifications,
    paymentNotifications,
    systemNotifications,
  ] = await Promise.all([
    getSetting(SETTINGS_KEYS.enabled, true),
    getSetting(SETTINGS_KEYS.smsEnabled, false),
    getSetting(SETTINGS_KEYS.eventEnabled, true),
    getSetting(SETTINGS_KEYS.paymentEnabled, true),
    getSetting(SETTINGS_KEYS.systemEnabled, true),
  ]);

  return (
    <div className="space-y-6">
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
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Configure notification and SMS-related settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form action={saveNotificationSettings}>
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Notification Settings
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Control which notification channels and notification
              categories are enabled for the system.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            <SettingRow
              name="notificationsEnabled"
              label="Enable Notifications"
              description="Allow the system to create and process notifications."
              checked={notificationsEnabled}
              icon={
                <Bell className="h-5 w-5" />
              }
            />

            <SettingRow
              name="smsEnabled"
              label="SMS Notifications"
              description="Allow SMS notifications when an SMS provider is configured."
              checked={smsEnabled}
              icon={
                <MessageSquare className="h-5 w-5" />
              }
            />
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Notification Types
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enable or disable notification categories used by the
              Mahallu system.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            <SettingRow
              name="eventNotifications"
              label="Event Notifications"
              description="Notifications related to Mahallu events and event activities."
              checked={eventNotifications}
              icon={
                <CheckCircle2 className="h-5 w-5" />
              }
            />

            <SettingRow
              name="paymentNotifications"
              label="Payment & Membership Notifications"
              description="Notifications related to payments, membership collections and dues."
              checked={paymentNotifications}
              icon={
                <CheckCircle2 className="h-5 w-5" />
              }
            />

            <SettingRow
              name="systemNotifications"
              label="System Notifications"
              description="Administrative and system-related notifications."
              checked={systemNotifications}
              icon={
                <CheckCircle2 className="h-5 w-5" />
              }
            />
          </div>
        </section>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

function SettingRow({
  name,
  label,
  description,
  checked,
  icon,
}: {
  name: string;
  label: string;
  description: string;
  checked: boolean;
  icon: React.ReactNode;
}) {
  return (
    <label
      htmlFor={name}
      className="flex cursor-pointer items-center justify-between gap-6 p-6 transition hover:bg-gray-50"
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          {icon}
        </div>

        <div>
          <p className="font-medium text-gray-900">
            {label}
          </p>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <div className="relative shrink-0">
        <input
          id={name}
          name={name}
          type="checkbox"
          defaultChecked={checked}
          className="peer sr-only"
        />

        <div className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-green-600" />

        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </div>
    </label>
  );
}