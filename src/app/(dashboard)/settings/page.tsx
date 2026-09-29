import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Receipt,
  Tags,
  Bell,
  ShieldCheck,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";

const settingItems = [
  {
    href: "/settings/general",
    title: "General Information",
    description: "Manage Mahallu name, address and contact information.",
    icon: Building2,
    iconClass: "bg-green-50 text-green-700",
  },
  {
    href: "/settings/financial-year",
    title: "Financial Year",
    description:
      "Configure the financial year used for reports and financial records.",
    icon: CalendarDays,
    iconClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/settings/receipt-settings",
    title: "Receipt Settings",
    description:
      "Configure receipt numbering and receipt-related settings.",
    icon: Receipt,
    iconClass: "bg-purple-50 text-purple-700",
  },
  {
    href: "/settings/categories",
    title: "Categories",
    description:
      "Manage categories used throughout the Mahallu system.",
    icon: Tags,
    iconClass: "bg-orange-50 text-orange-700",
  },
  {
    href: "/settings/notifications",
    title: "Notifications",
    description:
      "Configure notification and SMS-related settings.",
    icon: Bell,
    iconClass: "bg-yellow-50 text-yellow-700",
  },
  {
    href: "/settings/account",
    title: "Account Security",
    description:
      "Change your login username and password securely.",
    icon: LockKeyhole,
    iconClass: "bg-red-50 text-red-700",
  },
  {
    href: "/settings/audit-logs",
    title: "Audit Logs",
    description:
      "Review important system actions and administrative activity.",
    icon: ShieldCheck,
    iconClass: "bg-gray-100 text-gray-700",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Settings
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your Mahallu system configuration.
        </p>
      </div>

      {/* Settings Choices */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            System Settings
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select a setting to view or update its configuration.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {settingItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-[150px] flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${item.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" />
                </div>

                <div className="mt-5">
                  <h3 className="text-base font-semibold text-gray-900">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 text-sm leading-5 text-gray-500">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}