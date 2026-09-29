import { prisma } from "@/lib/prisma";
import FacultyProfile from "./FacultyProfile";

export default async function FacultiesPage() {
  const staff = await prisma.facultyStaff.findMany({
    orderBy: [
      {
        type: "asc",
      },
      {
        displayOrder: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  const teachingStaff = staff.filter(
    (member) => member.type === "TEACHING",
  );

  const nonTeachingStaff = staff.filter(
    (member) => member.type === "NON_TEACHING",
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-wide text-green-700">
          PANDARAKKANDY MAHALLU COMMITTEE
        </h1>

        <p className="mt-1 text-lg text-gray-700">
          Under Pandarakkandy Palli Thanveerul Islam
          Madrassa &amp; Dars Committee
        </p>

        <div className="mt-3 text-sm leading-5 text-gray-700">
          <p>Central Kannancode</p>
          <p>Thuvvakkunnu PO, Kannur</p>
        </div>

        <div className="mt-1 text-sm font-medium text-gray-700">
          SNo : 386/91
        </div>
      </div>

      {/* =====================================================
          FACULTY PROFILE
          ===================================================== */}

      <FacultyProfile
        teachingStaff={teachingStaff}
        nonTeachingStaff={nonTeachingStaff}
      />
    </div>
  );
}