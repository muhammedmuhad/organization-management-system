import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  ChevronRight,
} from "lucide-react";

const categoryItems = [

  {
    href: "/finance/income-categories?type=income",
    title: "Income Categories",
    description:
      "Manage categories used to classify general income transactions.",
    icon: TrendingUp,
    iconClass: "bg-green-50 text-green-700",
  },
  {
    href: "/finance/income-categories?type=expense",
    title: "Expense Categories",
    description:
      "Manage categories used to classify general expense transactions.",
    icon: TrendingDown,
    iconClass: "bg-red-50 text-red-600",
  },
  {
    href: "/settings/categories/event",
    title: "Event Categories",
    description:
      "Manage categories used to classify Mahallu events.",
    icon: CalendarDays,
    iconClass: "bg-blue-50 text-blue-700",
  },
];

export default function CategoriesSettingsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">
            Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Select the type of categories you want to manage.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Category Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Each category type is managed separately so financial,
            membership and event records remain clearly organized.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {categoryItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-[155px] items-start justify-between rounded-xl border border-gray-200 p-5 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                <div>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${item.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-base font-semibold text-gray-900">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 max-w-md text-sm leading-5 text-gray-500">
                    {item.description}
                  </p>
                </div>

                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}