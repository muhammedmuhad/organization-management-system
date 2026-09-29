"use client";

import type { ReactNode, PointerEvent as ReactPointerEvent, SyntheticEvent } from "react";
import { useState } from "react";
import {
  Pencil,
  Upload,
  X,
  Save,
} from "lucide-react";

type Committee = {
  id: string;

  presidentName: string | null;
  presidentAddress: string | null;
  presidentPhone: string | null;
  presidentPhoto: string | null;

  generalSecretaryName: string | null;
  generalSecretaryAddress: string | null;
  generalSecretaryPhone: string | null;
  generalSecretaryPhoto: string | null;

  treasurerName: string | null;
  treasurerAddress: string | null;
  treasurerPhone: string | null;
  treasurerPhoto: string | null;

  vicePresident1Name: string | null;
  vicePresident1Address: string | null;
  vicePresident1Phone: string | null;
  vicePresident1Photo: string | null;

  vicePresident2Name: string | null;
  vicePresident2Address: string | null;
  vicePresident2Phone: string | null;
  vicePresident2Photo: string | null;

  vicePresident3Name: string | null;
  vicePresident3Address: string | null;
  vicePresident3Phone: string | null;
  vicePresident3Photo: string | null;

  secretary1Name: string | null;
  secretary1Address: string | null;
  secretary1Phone: string | null;
  secretary1Photo: string | null;

  secretary2Name: string | null;
  secretary2Address: string | null;
  secretary2Phone: string | null;
  secretary2Photo: string | null;

  secretary3Name: string | null;
  secretary3Address: string | null;
  secretary3Phone: string | null;
  secretary3Photo: string | null;
};

type Person = {
  name: string;
  address: string;
  phone: string;
  photo: string;
};

type CommitteeState = {
  president: Person;
  generalSecretary: Person;
  treasurer: Person;
  vicePresidents: Person[];
  secretaries: Person[];
};

/* =========================================================
   HELPERS
   ========================================================= */

function emptyPerson(): Person {
  return {
    name: "",
    address: "",
    phone: "",
    photo: "",
  };
}

function createInitialState(
  committee: Committee,
): CommitteeState {
  return {
    president: {
      name: committee.presidentName || "",
      address: committee.presidentAddress || "",
      phone: committee.presidentPhone || "",
      photo: committee.presidentPhoto || "",
    },

    generalSecretary: {
      name:
        committee.generalSecretaryName || "",
      address:
        committee.generalSecretaryAddress || "",
      phone:
        committee.generalSecretaryPhone || "",
      photo:
        committee.generalSecretaryPhoto || "",
    },

    treasurer: {
      name: committee.treasurerName || "",
      address:
        committee.treasurerAddress || "",
      phone: committee.treasurerPhone || "",
      photo: committee.treasurerPhoto || "",
    },

    vicePresidents: [
      {
        name:
          committee.vicePresident1Name || "",
        address:
          committee.vicePresident1Address || "",
        phone:
          committee.vicePresident1Phone || "",
        photo:
          committee.vicePresident1Photo || "",
      },
      {
        name:
          committee.vicePresident2Name || "",
        address:
          committee.vicePresident2Address || "",
        phone:
          committee.vicePresident2Phone || "",
        photo:
          committee.vicePresident2Photo || "",
      },
      {
        name:
          committee.vicePresident3Name || "",
        address:
          committee.vicePresident3Address || "",
        phone:
          committee.vicePresident3Phone || "",
        photo:
          committee.vicePresident3Photo || "",
      },
    ],

    secretaries: [
      {
        name:
          committee.secretary1Name || "",
        address:
          committee.secretary1Address || "",
        phone:
          committee.secretary1Phone || "",
        photo:
          committee.secretary1Photo || "",
      },
      {
        name:
          committee.secretary2Name || "",
        address:
          committee.secretary2Address || "",
        phone:
          committee.secretary2Phone || "",
        photo:
          committee.secretary2Photo || "",
      },
      {
        name:
          committee.secretary3Name || "",
        address:
          committee.secretary3Address || "",
        phone:
          committee.secretary3Phone || "",
        photo:
          committee.secretary3Photo || "",
      },
    ],
  };
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function CommitteeProfile({
  committee,
}: {
  committee: Committee;
}) {
  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState<CommitteeState>(
      createInitialState(committee),
    );

  const [error, setError] =
    useState("");

  /* =======================================================
     UPDATE SINGLE PERSON
     ======================================================= */

  function updatePerson(
    section:
      | "president"
      | "generalSecretary"
      | "treasurer",
    field: keyof Person,
    value: string,
  ) {
    setForm((current) => ({
      ...current,

      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  /* =======================================================
     UPDATE GROUP PERSON
     ======================================================= */

  function updateArrayPerson(
    section:
      | "vicePresidents"
      | "secretaries",
    index: number,
    field: keyof Person,
    value: string,
  ) {
    setForm((current) => ({
      ...current,

      [section]: current[section].map(
        (person, personIndex) =>
          personIndex === index
            ? {
                ...person,
                [field]: value,
              }
            : person,
      ),
    }));
  }

  /* =======================================================
     CANCEL
     ======================================================= */

  function cancelEdit() {
    setForm(
      createInitialState(committee),
    );

    setError("");
    setEditing(false);
  }

  /* =======================================================
     SAVE
     ======================================================= */

  async function saveChanges() {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/committee",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(form),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Failed to save committee details.",
        );
      }

      window.location.reload();
    } catch (error) {
      console.error(
        "Committee save error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save committee details.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="space-y-10">
      {/* ===================================================
          PRESIDENT / GENERAL SECRETARY / TREASURER
          =================================================== */}

      <section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <PersonCard
            title="President"
            person={form.president}
            editing={editing}
            onChange={(field, value) =>
              updatePerson(
                "president",
                field,
                value,
              )
            }
          />

          <PersonCard
            title="General Secretary"
            person={form.generalSecretary}
            editing={editing}
            onChange={(field, value) =>
              updatePerson(
                "generalSecretary",
                field,
                value,
              )
            }
          />

          <PersonCard
            title="Treasurer"
            person={form.treasurer}
            editing={editing}
            onChange={(field, value) =>
              updatePerson(
                "treasurer",
                field,
                value,
              )
            }
          />
        </div>
      </section>

      {/* ===================================================
          VICE PRESIDENTS
          =================================================== */}

      <section>
        <h3 className="mb-5 text-center text-lg font-bold text-gray-900">
          Vice Presidents
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {form.vicePresidents.map(
            (person, index) => (
              <PersonCard
                key={`vp-${index}`}
                person={person}
                editing={editing}
                onChange={(
                  field,
                  value,
                ) =>
                  updateArrayPerson(
                    "vicePresidents",
                    index,
                    field,
                    value,
                  )
                }
              />
            ),
          )}
        </div>
      </section>

      {/* ===================================================
          SECRETARIES
          =================================================== */}

      <section>
        <h3 className="mb-5 text-center text-lg font-bold text-gray-900">
          Secretaries
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {form.secretaries.map(
            (person, index) => (
              <PersonCard
                key={`secretary-${index}`}
                person={person}
                editing={editing}
                onChange={(
                  field,
                  value,
                ) =>
                  updateArrayPerson(
                    "secretaries",
                    index,
                    field,
                    value,
                  )
                }
              />
            ),
          )}
        </div>
      </section>

      {/* ===================================================
          ERROR
          =================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ===================================================
          ACTION BUTTONS
          BOTTOM RIGHT ONLY
          =================================================== */}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
        {!editing ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              setEditing(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Pencil className="h-4 w-4" />

            Edit Committee
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />

              Cancel
            </button>

            <button
              type="button"
              onClick={saveChanges}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PERSON CARD
   ========================================================= */

function PersonCard({
  title,
  person,
  editing,
  onChange,
}: {
  title?: string;
  person: Person;
  editing: boolean;
  onChange: (
    field: keyof Person,
    value: string,
  ) => void;
}) {
  const [cropSource, setCropSource] =
    useState<string | null>(null);

  function handlePhotoSelect(
    file: File | undefined,
  ) {
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setCropSource(
        String(reader.result || ""),
      );
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {title && (
        <h3 className="mb-4 text-center text-lg font-bold text-gray-900">
          {title}
        </h3>
      )}

      <div className="flex justify-center">
        <div className="relative">
          {person.photo ? (
            <img
              src={person.photo}
              alt={
                person.name ||
                "Committee member"
              }
              className="h-32 w-32 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-400">
              No Photo
            </div>
          )}

          {editing && (
            <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white shadow-md transition hover:bg-gray-800">
              <Upload className="h-4 w-4" />

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  handlePhotoSelect(
                    event.target.files?.[0],
                  );
                  event.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-5 space-y-4">
          <Field
            label="Name"
            value={person.name}
            onChange={(value) =>
              onChange("name", value)
            }
          />

          <Field
            label="Address"
            value={person.address}
            textarea
            onChange={(value) =>
              onChange("address", value)
            }
          />

          <Field
            label="Phone Number"
            value={person.phone}
            onChange={(value) =>
              onChange("phone", value)
            }
          />
        </div>
      ) : (
        <div className="mt-5 space-y-2 text-center">
          <p className="text-base font-semibold text-gray-900">
            {person.name || "Not Assigned"}
          </p>

          {person.address && (
            <p className="whitespace-pre-line text-sm leading-5 text-gray-600">
              {person.address}
            </p>
          )}

          {person.phone && (
            <p className="text-sm text-gray-700">
              {person.phone}
            </p>
          )}

          {!person.address &&
            !person.phone &&
            !person.name && (
              <p className="text-sm text-gray-400">
                No details added
              </p>
            )}
        </div>
      )}

      {cropSource && (
        <PhotoCropper
          source={cropSource}
          onCancel={() =>
            setCropSource(null)
          }
          onSave={(photo) => {
            onChange("photo", photo);
            setCropSource(null);
          }}
        />
      )}
    </div>
  );
}


function PhotoCropper({
  source,
  onCancel,
  onSave,
}: {
  source: string;
  onCancel: () => void;
  onSave: (photo: string) => void;
}) {
  const cropSize = 256;
  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  });
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });
  const [positionStart, setPositionStart] = useState({
    x: 0,
    y: 0,
  });

  function clampPosition(
    x: number,
    y: number,
    width = imageSize.width,
    height = imageSize.height,
  ) {
    return {
      x: Math.min(0, Math.max(cropSize - width, x)),
      y: Math.min(0, Math.max(cropSize - height, y)),
    };
  }

  function handleImageLoad(
    event: SyntheticEvent<HTMLImageElement>,
  ) {
    const image = event.currentTarget;
    const scale = Math.max(
      cropSize / image.naturalWidth,
      cropSize / image.naturalHeight,
    );
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;

    setImageSize({ width, height });
    setPosition({
      x: (cropSize - width) / 2,
      y: (cropSize - height) / 2,
    });
  }

  function handlePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (!imageSize.width) {
      return;
    }

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
    setDragging(true);
    setDragStart({
      x: event.clientX,
      y: event.clientY,
    });
    setPositionStart(position);
  }

  function handlePointerMove(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (!dragging) {
      return;
    }

    const next = clampPosition(
      positionStart.x +
        event.clientX -
        dragStart.x,
      positionStart.y +
        event.clientY -
        dragStart.y,
    );

    setPosition(next);
  }

  function finishDrag() {
    setDragging(false);
  }

  function saveCrop() {
    if (!imageSize.width || !imageSize.height) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement(
        "canvas",
      );
      canvas.width = cropSize;
      canvas.height = cropSize;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.drawImage(
        image,
        position.x,
        position.y,
        imageSize.width,
        imageSize.height,
      );

      onSave(
        canvas.toDataURL(
          "image/jpeg",
          0.92,
        ),
      );
    };
    image.src = source;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Adjust Photo
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Drag the photo to position it.
          </p>
        </div>

        <div className="flex justify-center">
          <div
            className="relative h-64 w-64 touch-none cursor-grab overflow-hidden rounded-full bg-gray-100 active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
          >
            <img
              src={source}
              alt="Adjust photo"
              onLoad={handleImageLoad}
              draggable={false}
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                width: imageSize.width || "auto",
                height: imageSize.height || "auto",
                left: position.x,
                top: position.y,
              }}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveCrop}
            disabled={!imageSize.width}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INPUT FIELD
   ========================================================= */

function Field({
  label,
  value,
  onChange,
  textarea = false,
}: {
  label: string;

  value: string;

  onChange: (
    value: string,
  ) => void;

  textarea?: boolean;
}) {
  const className =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100";

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
      </label>

      {textarea ? (
        <textarea
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          rows={3}
          className={className}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          className={className}
        />
      )}
    </div>
  );
}