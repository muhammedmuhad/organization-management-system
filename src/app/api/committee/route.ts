import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Person = {
  name?: string;
  address?: string;
  phone?: string;
  photo?: string;
};

type CommitteeRequest = {
  president?: Person;
  generalSecretary?: Person;
  treasurer?: Person;
  vicePresidents?: Person[];
  secretaries?: Person[];
};

export async function PUT(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as CommitteeRequest;

    const {
      president,
      generalSecretary,
      treasurer,
      vicePresidents,
      secretaries,
    } = body;

    /* =====================================================
       VALIDATION
       ===================================================== */

    if (
      !president ||
      !generalSecretary ||
      !treasurer ||
      !Array.isArray(vicePresidents) ||
      vicePresidents.length !== 3 ||
      !Array.isArray(secretaries) ||
      secretaries.length !== 3
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid committee data.",
        },
        {
          status: 400,
        },
      );
    }

    /* =====================================================
       GET EXISTING COMMITTEE PROFILE
       ===================================================== */

    const committee =
      await prisma.committeeProfile.findFirst();

    /* =====================================================
       PREPARE DATABASE DATA
       ===================================================== */

    const data = {
      /* ---------------------------------------------------
         PRESIDENT
         --------------------------------------------------- */

      presidentName:
        president.name?.trim() || null,

      presidentAddress:
        president.address?.trim() || null,

      presidentPhone:
        president.phone?.trim() || null,

      presidentPhoto:
        president.photo || null,

      /* ---------------------------------------------------
         GENERAL SECRETARY
         --------------------------------------------------- */

      generalSecretaryName:
        generalSecretary.name?.trim() || null,

      generalSecretaryAddress:
        generalSecretary.address?.trim() || null,

      generalSecretaryPhone:
        generalSecretary.phone?.trim() || null,

      generalSecretaryPhoto:
        generalSecretary.photo || null,

      /* ---------------------------------------------------
         TREASURER
         --------------------------------------------------- */

      treasurerName:
        treasurer.name?.trim() || null,

      treasurerAddress:
        treasurer.address?.trim() || null,

      treasurerPhone:
        treasurer.phone?.trim() || null,

      treasurerPhoto:
        treasurer.photo || null,

      /* ---------------------------------------------------
         VICE PRESIDENT 1
         --------------------------------------------------- */

      vicePresident1Name:
        vicePresidents[0]?.name?.trim() ||
        null,

      vicePresident1Address:
        vicePresidents[0]?.address?.trim() ||
        null,

      vicePresident1Phone:
        vicePresidents[0]?.phone?.trim() ||
        null,

      vicePresident1Photo:
        vicePresidents[0]?.photo || null,

      /* ---------------------------------------------------
         VICE PRESIDENT 2
         --------------------------------------------------- */

      vicePresident2Name:
        vicePresidents[1]?.name?.trim() ||
        null,

      vicePresident2Address:
        vicePresidents[1]?.address?.trim() ||
        null,

      vicePresident2Phone:
        vicePresidents[1]?.phone?.trim() ||
        null,

      vicePresident2Photo:
        vicePresidents[1]?.photo || null,

      /* ---------------------------------------------------
         VICE PRESIDENT 3
         --------------------------------------------------- */

      vicePresident3Name:
        vicePresidents[2]?.name?.trim() ||
        null,

      vicePresident3Address:
        vicePresidents[2]?.address?.trim() ||
        null,

      vicePresident3Phone:
        vicePresidents[2]?.phone?.trim() ||
        null,

      vicePresident3Photo:
        vicePresidents[2]?.photo || null,

      /* ---------------------------------------------------
         SECRETARY 1
         --------------------------------------------------- */

      secretary1Name:
        secretaries[0]?.name?.trim() ||
        null,

      secretary1Address:
        secretaries[0]?.address?.trim() ||
        null,

      secretary1Phone:
        secretaries[0]?.phone?.trim() ||
        null,

      secretary1Photo:
        secretaries[0]?.photo || null,

      /* ---------------------------------------------------
         SECRETARY 2
         --------------------------------------------------- */

      secretary2Name:
        secretaries[1]?.name?.trim() ||
        null,

      secretary2Address:
        secretaries[1]?.address?.trim() ||
        null,

      secretary2Phone:
        secretaries[1]?.phone?.trim() ||
        null,

      secretary2Photo:
        secretaries[1]?.photo || null,

      /* ---------------------------------------------------
         SECRETARY 3
         --------------------------------------------------- */

      secretary3Name:
        secretaries[2]?.name?.trim() ||
        null,

      secretary3Address:
        secretaries[2]?.address?.trim() ||
        null,

      secretary3Phone:
        secretaries[2]?.phone?.trim() ||
        null,

      secretary3Photo:
        secretaries[2]?.photo || null,
    };

    /* =====================================================
       UPDATE EXISTING PROFILE
       ===================================================== */

    if (committee) {
      await prisma.committeeProfile.update({
        where: {
          id: committee.id,
        },

        data,
      });
    } else {
      /* ===================================================
         CREATE PROFILE IF NONE EXISTS
         =================================================== */

      await prisma.committeeProfile.create({
        data,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Committee details saved successfully.",
    });
  } catch (error) {
    console.error(
      "Committee update error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to save committee details.",
      },
      {
        status: 500,
      },
    );
  }
}