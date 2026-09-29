import { prisma } from "@/lib/prisma";
import CommitteeProfile from "./CommitteeProfile";

export default async function CommitteePage() {
  let committee =
    await prisma.committeeProfile.findFirst();

  /*
   * Create the single committee profile if it
   * does not exist yet.
   */
  if (!committee) {
    committee =
      await prisma.committeeProfile.create({
        data: {},
      });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      {/* =====================================================
          COMMITTEE HEADER
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
          PAGE TITLE
          ===================================================== */}

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Committee Office Bearers
        </h2>
      </div>

      {/* =====================================================
          COMMITTEE PROFILE
          ===================================================== */}

      <CommitteeProfile
        committee={committee}
      />
    </div>
  );
}