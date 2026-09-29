import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type StaffInput = {
  id?: string;
  type: "TEACHING" | "NON_TEACHING";
  name?: string;
  address?: string;
  phone?: string;
  photo?: string;
};

type FacultyRequest = {
  teachingStaff?: StaffInput[];
  nonTeachingStaff?: StaffInput[];
};

/* =========================================================
   GET
   ========================================================= */

export async function GET() {
  try {
    const staff =
      await prisma.facultyStaff.findMany({
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

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error(
      "Faculty GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load faculty details.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   PUT
   ========================================================= */

export async function PUT(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as FacultyRequest;

    const teachingStaff =
      Array.isArray(body.teachingStaff)
        ? body.teachingStaff
        : [];

    const nonTeachingStaff =
      Array.isArray(body.nonTeachingStaff)
        ? body.nonTeachingStaff
        : [];

    const allStaff: StaffInput[] = [
      ...teachingStaff,
      ...nonTeachingStaff,
    ];

    /* =====================================================
       VALIDATE STAFF TYPE
       ===================================================== */

    const invalidType =
      allStaff.some(
        (staff) =>
          staff.type !== "TEACHING" &&
          staff.type !== "NON_TEACHING",
      );

    if (invalidType) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid faculty staff type.",
        },
        {
          status: 400,
        },
      );
    }

    /* =====================================================
       NORMALIZE DATA
       ===================================================== */

    const normalizedStaff =
      allStaff.map((staff, index) => ({
        id: staff.id,

        type: staff.type,

        name:
          typeof staff.name === "string"
            ? staff.name.trim() || null
            : null,

        address:
          typeof staff.address === "string"
            ? staff.address.trim() || null
            : null,

        phone:
          typeof staff.phone === "string"
            ? staff.phone.trim() || null
            : null,

        photo:
          typeof staff.photo === "string"
            ? staff.photo || null
            : null,

        displayOrder: index,
      }));

    /* =====================================================
       EXISTING IDS
       ===================================================== */

    const existingIds =
      normalizedStaff
        .map((staff) => staff.id)
        .filter(
          (
            id,
          ): id is string =>
            Boolean(id),
        );

    /* =====================================================
       SAVE EVERYTHING IN ONE TRANSACTION
       ===================================================== */

    await prisma.$transaction(
      async (tx) => {
        /*
         * Anything not submitted anymore has been
         * removed by the administrator.
         */
        if (existingIds.length > 0) {
          await tx.facultyStaff.deleteMany({
            where: {
              id: {
                notIn: existingIds,
              },
            },
          });
        } else {
          await tx.facultyStaff.deleteMany();
        }

        /*
         * Update existing staff and create new staff.
         */
        for (const staff of normalizedStaff) {
          const data = {
            type: staff.type,
            name: staff.name,
            address: staff.address,
            phone: staff.phone,
            photo: staff.photo,
            displayOrder:
              staff.displayOrder,
          };

          if (staff.id) {
            await tx.facultyStaff.update({
              where: {
                id: staff.id,
              },
              data,
            });
          } else {
            await tx.facultyStaff.create({
              data,
            });
          }
        }
      },
    );

    return NextResponse.json({
      success: true,
      message:
        "Faculty details saved successfully.",
    });
  } catch (error) {
    console.error(
      "Faculty update error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to save faculty details.",
      },
      {
        status: 500,
      },
    );
  }
}