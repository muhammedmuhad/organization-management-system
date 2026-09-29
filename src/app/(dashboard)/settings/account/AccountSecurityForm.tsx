"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  KeyRound,
  Save,
  UserRound,
} from "lucide-react";

import {
  updateAccountSecurity,
  type AccountSecurityState,
} from "../actions";

const initialState: AccountSecurityState = {
  success: false,
  message: "",
};

export default function AccountSecurityForm({
  currentUsername,
}: {
  currentUsername: string;
}) {
  const [state, formAction, pending] =
    useActionState(
      updateAccountSecurity,
      initialState,
    );

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  useEffect(() => {
    if (state.success) {
      const timer = window.setTimeout(() => {
        window.location.reload();
      }, 1500);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [state.success]);

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-5">
        <h2 className="font-semibold text-gray-900">
          Change Login Credentials
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter your current password to update your login credentials.
        </p>
      </div>

      <div className="space-y-6 p-6">
        {/* Current Password */}
        <div>
          <label
            htmlFor="currentPassword"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Current Password
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              id="currentPassword"
              name="currentPassword"
              type={
                showCurrentPassword
                  ? "text"
                  : "password"
              }
              required
              autoComplete="current-password"
              placeholder="Enter your current password"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-11 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

            <button
              type="button"
              onClick={() =>
                setShowCurrentPassword(
                  (value) => !value,
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              aria-label={
                showCurrentPassword
                  ? "Hide current password"
                  : "Show current password"
              }
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Username */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Username
              </h3>

              <p className="text-xs text-gray-500">
                Leave unchanged if you only want to change the password.
              </p>
            </div>
          </div>

          <label
            htmlFor="newUsername"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            New Username
          </label>

          <input
            id="newUsername"
            name="newUsername"
            type="text"
            defaultValue={currentUsername}
            autoComplete="username"
            maxLength={50}
            placeholder="Enter new username"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />

          <p className="mt-1.5 text-xs text-gray-500">
            Use at least 3 characters. Letters, numbers, dots,
            underscores and hyphens are allowed.
          </p>
        </div>

        {/* Password */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <KeyRound className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Password
              </h3>

              <p className="text-xs text-gray-500">
                Leave these fields empty if you only want to change the username.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  placeholder="Enter new password"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 pr-11 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      (value) => !value,
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={
                    showNewPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-xs text-gray-500">
                Minimum 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  placeholder="Confirm new password"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 pr-11 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value,
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {state.message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              state.success
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {state.message}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
        <a
          href="/settings"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </a>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />

          {pending
            ? "Saving..."
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}