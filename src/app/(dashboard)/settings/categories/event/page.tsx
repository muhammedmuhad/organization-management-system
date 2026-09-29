import Link from "next/link";
import { ArrowLeft, Plus, Power, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function createEventCategory(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const description =
    String(formData.get("description") || "").trim() || null;
  const displayOrder =
    Number.parseInt(String(formData.get("displayOrder") || "0"), 10) || 0;

  if (!name) throw new Error("Category name is required.");
  if (displayOrder < 0) throw new Error("Display order cannot be negative.");

  const existing = await prisma.eventCategoryMaster.findUnique({
    where: { name },
  });

  if (existing) {
    throw new Error("An event category with this name already exists.");
  }

  await prisma.eventCategoryMaster.create({
    data: {
      name,
      description,
      displayOrder,
      isActive: true,
    },
  });

  revalidatePath("/settings/categories/event");
}

async function toggleEventCategory(id: string, isActive: boolean) {
  "use server";

  await prisma.eventCategoryMaster.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/settings/categories/event");
}

async function deleteEventCategory(id: string) {
  "use server";

  const usageCount = await prisma.event.count({
    where: { categoryId: id },
  });

  if (usageCount > 0) {
    throw new Error(
      "This event category cannot be deleted because it is already used by events.",
    );
  }

  await prisma.eventCategoryMaster.delete({
    where: { id },
  });

  revalidatePath("/settings/categories/event");
}

export default async function EventCategoriesPage() {
  const categories = await prisma.eventCategoryMaster.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  const activeCount = categories.filter((item) => item.isActive).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/settings/categories"
          className="mt-1 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to categories"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Event Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage categories used to classify Mahallu events.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Categories" value={categories.length} />
        <SummaryCard label="Active" value={activeCount} />
        <SummaryCard label="Inactive" value={inactiveCount} />
      </div>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Add Event Category</h2>

        <form action={createEventCategory} className="mt-5 grid gap-4 md:grid-cols-4">
          <input
            name="name"
            required
            placeholder="Category name"
            className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <input
            name="description"
            placeholder="Description"
            className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500 md:col-span-2"
          />

          <div className="flex gap-2">
            <input
              name="displayOrder"
              type="number"
              min="0"
              defaultValue="0"
              className="w-24 rounded-lg border px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {categories.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-gray-500">
            No event categories have been created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {category.description || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {category.displayOrder}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          category.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <form
                          action={toggleEventCategory.bind(
                            null,
                            category.id,
                            !category.isActive,
                          )}
                        >
                          <button
                            type="submit"
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
                              category.isActive
                                ? "text-orange-600 hover:bg-orange-50"
                                : "text-green-700 hover:bg-green-50"
                            }`}
                          >
                            <Power className="h-4 w-4" />
                            {category.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>

                        <form action={deleteEventCategory.bind(null, category.id)}>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}