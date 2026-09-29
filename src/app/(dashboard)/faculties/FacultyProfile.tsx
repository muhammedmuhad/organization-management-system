"use client";

import {
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { PointerEvent as ReactPointerEvent, SyntheticEvent } from "react";
import { useState } from "react";

type StaffType =
  | "TEACHING"
  | "NON_TEACHING";

type StaffMember = {
  id: string;
  type: StaffType;
  name: string | null;
  address: string | null;
  phone: string | null;
  photo: string | null;
  displayOrder: number;
};

type EditableStaff = {
  id?: string;
  type: StaffType;
  name: string;
  address: string;
  phone: string;
  photo: string;
};

type FacultyProfileProps = {
  teachingStaff: StaffMember[];
  nonTeachingStaff: StaffMember[];
};

export default function FacultyProfile({
  teachingStaff,
  nonTeachingStaff,
}: FacultyProfileProps) {
  const [isEditing, setIsEditing] =
    useState(false);

  const [teaching, setTeaching] = useState<
    EditableStaff[]
  >(() =>
    teachingStaff.map(toEditableStaff),
  );

  const [nonTeaching, setNonTeaching] =
    useState<EditableStaff[]>(() =>
      nonTeachingStaff.map(toEditableStaff),
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  function toEditableStaff(
    member: StaffMember,
  ): EditableStaff {
    return {
      id: member.id,
      type: member.type,
      name: member.name ?? "",
      address: member.address ?? "",
      phone: member.phone ?? "",
      photo: member.photo ?? "",
    };
  }

  function createEmptyStaff(
    type: StaffType,
  ): EditableStaff {
    return {
      type,
      name: "",
      address: "",
      phone: "",
      photo: "",
    };
  }

  function startEditing() {
    setTeaching(
      teachingStaff.map(toEditableStaff),
    );

    setNonTeaching(
      nonTeachingStaff.map(toEditableStaff),
    );

    setError("");
    setSuccess("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setTeaching(
      teachingStaff.map(toEditableStaff),
    );

    setNonTeaching(
      nonTeachingStaff.map(toEditableStaff),
    );

    setError("");
    setSuccess("");
    setIsEditing(false);
  }

  function updateTeaching(
    index: number,
    field: keyof EditableStaff,
    value: string,
  ) {
    setTeaching((current) =>
      current.map((staff, i) =>
        i === index
          ? {
              ...staff,
              [field]: value,
            }
          : staff,
      ),
    );
  }

  function updateNonTeaching(
    index: number,
    field: keyof EditableStaff,
    value: string,
  ) {
    setNonTeaching((current) =>
      current.map((staff, i) =>
        i === index
          ? {
              ...staff,
              [field]: value,
            }
          : staff,
      ),
    );
  }

  function addTeachingStaff() {
    setTeaching((current) => [
      ...current,
      createEmptyStaff("TEACHING"),
    ]);
  }

  function addNonTeachingStaff() {
    setNonTeaching((current) => [
      ...current,
      createEmptyStaff("NON_TEACHING"),
    ]);
  }

  function deleteTeachingStaff(
    index: number,
  ) {
    setTeaching((current) =>
      current.filter((_, i) => i !== index),
    );
  }

  function deleteNonTeachingStaff(
    index: number,
  ) {
    setNonTeaching((current) =>
      current.filter((_, i) => i !== index),
    );
  }

  async function handlePhotoUpload(
    file: File | undefined,
    type: StaffType,
    index: number,
  ) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Photo must be smaller than 5 MB.",
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const photo = String(
        reader.result ?? "",
      );

      if (type === "TEACHING") {
        updateTeaching(
          index,
          "photo",
          photo,
        );
      } else {
        updateNonTeaching(
          index,
          "photo",
          photo,
        );
      }

      setError("");
    };

    reader.readAsDataURL(file);
  }

  async function saveChanges() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/faculties",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            teachingStaff: teaching,
            nonTeachingStaff: nonTeaching,
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to save faculty details.",
        );
      }

      setSuccess(
        "Faculty details saved successfully.",
      );

      setIsEditing(false);

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save faculty details.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-12">
      {/* =====================================================
          ERROR / SUCCESS
          ===================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* =====================================================
          TEACHING STAFF
          ===================================================== */}

      <section>
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900">
            Teaching Staff
          </h3>
        </div>

        {teaching.length === 0 && !isEditing ? (
          <EmptyStaff
            message="No teaching staff added."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {teaching.map(
              (staff, index) => (
                <StaffCard
                  key={
                    staff.id ??
                    `teaching-${index}`
                  }
                  staff={staff}
                  isEditing={isEditing}
                  onChange={(field, value) =>
                    updateTeaching(
                      index,
                      field,
                      value,
                    )
                  }
                  onDelete={() =>
                    deleteTeachingStaff(
                      index,
                    )
                  }
                  onPhotoChange={(file) =>
                    handlePhotoUpload(
                      file,
                      "TEACHING",
                      index,
                    )
                  }
                />
              ),
            )}
          </div>
        )}

        {isEditing && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={
                addTeachingStaff
              }
              className="inline-flex items-center gap-2 rounded-lg border border-green-600 px-5 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-50"
            >
              <Plus className="h-4 w-4" />
              Add Teaching Staff
            </button>
          </div>
        )}
      </section>

      {/* =====================================================
          NON-TEACHING STAFF
          ===================================================== */}

      <section>
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900">
            Non-Teaching Staff
          </h3>
        </div>

        {nonTeaching.length === 0 &&
        !isEditing ? (
          <EmptyStaff
            message="No non-teaching staff added."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {nonTeaching.map(
              (staff, index) => (
                <StaffCard
                  key={
                    staff.id ??
                    `non-teaching-${index}`
                  }
                  staff={staff}
                  isEditing={isEditing}
                  onChange={(field, value) =>
                    updateNonTeaching(
                      index,
                      field,
                      value,
                    )
                  }
                  onDelete={() =>
                    deleteNonTeachingStaff(
                      index,
                    )
                  }
                  onPhotoChange={(file) =>
                    handlePhotoUpload(
                      file,
                      "NON_TEACHING",
                      index,
                    )
                  }
                />
              ),
            )}
          </div>
        )}

        {isEditing && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={
                addNonTeachingStaff
              }
              className="inline-flex items-center gap-2 rounded-lg border border-green-600 px-5 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-50"
            >
              <Plus className="h-4 w-4" />
              Add Non-Teaching Staff
            </button>
          </div>
        )}
      </section>

      {/* =====================================================
          ACTIONS
          ===================================================== */}

      {!isEditing ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Pencil className="h-4 w-4" />
            Edit Faculties
          </button>
        </div>
      ) : (
        <div className="flex justify-end gap-3 border-t pt-6">
          <button
            type="button"
            onClick={cancelEditing}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          <button
            type="button"
            onClick={saveChanges}
            disabled={saving}
            className="rounded-lg bg-green-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STAFF CARD
   ========================================================= */

type StaffCardProps = {
  staff: EditableStaff;
  isEditing: boolean;
  onChange: (
    field: keyof EditableStaff,
    value: string,
  ) => void;
  onDelete: () => void;
  onPhotoChange: (
    file: File | undefined,
  ) => void;
};

function StaffCard({
  staff,
  isEditing,
  onChange,
  onDelete,
  onPhotoChange,
}: StaffCardProps) {
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
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {isEditing && (
        <button
          type="button"
          onClick={onDelete}
          title="Remove staff"
          className="absolute right-3 top-3 z-10 rounded-full bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <div className="p-5">
        <div className="flex justify-center">
          {staff.photo ? (
            <img
              src={staff.photo}
              alt={
                staff.name || "Staff photo"
              }
              className="h-28 w-28 rounded-full object-cover ring-1 ring-gray-200"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-400">
              No Photo
            </div>
          )}
        </div>

        {isEditing && (
          <div className="mt-4 flex justify-center">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
              <Upload className="h-4 w-4" />

              {staff.photo
                ? "Change Photo"
                : "Upload Photo"}

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
          </div>
        )}

        {isEditing ? (
          <div className="mt-5 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Name
              </label>

              <input
                type="text"
                value={staff.name}
                onChange={(event) =>
                  onChange(
                    "name",
                    event.target.value,
                  )
                }
                placeholder="Staff name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Address
              </label>

              <textarea
                value={staff.address}
                onChange={(event) =>
                  onChange(
                    "address",
                    event.target.value,
                  )
                }
                placeholder="Address"
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Phone
              </label>

              <input
                type="tel"
                value={staff.phone}
                onChange={(event) =>
                  onChange(
                    "phone",
                    event.target.value,
                  )
                }
                placeholder="Phone number"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 text-center">
            <h4 className="text-lg font-semibold text-gray-900">
              {staff.name || "Not Assigned"}
            </h4>

            {staff.address && (
              <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                {staff.address}
              </p>
            )}

            {staff.phone && (
              <p className="mt-2 text-sm text-gray-700">
                {staff.phone}
              </p>
            )}
          </div>
        )}
      </div>

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
   EMPTY STATE
   ========================================================= */

function EmptyStaff({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
      <p className="text-sm text-gray-500">
        {message}
      </p>
    </div>
  );
}