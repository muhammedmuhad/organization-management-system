import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

interface RouteProps {
  params: Promise<{
    id: string;
    memberId: string;
  }>;
}

export async function DELETE(
  _request: Request,
  { params }: RouteProps,
) {
  try {
    const { id, memberId } = await params;

    const member = await prisma.householdMember.findFirst({
      where: {
        id: memberId,
        householdId: id,
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          error: "Household member not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.householdMember.delete({
      where: {
        id: memberId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Household member permanently deleted.",
    });
  } catch (error) {
    console.error("Delete member error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete household member.",
      },
      {
        status: 500,
      },
    );
  }
}