"use client";

import { useMemo, useRef, useState } from "react";
import { registerDrink, type DrinkType } from "@/utils/drink_service";

const TYPES: DrinkType[] = ["Beer", "Wine", "Shot", "Other"];

export default function DrinkRegistration() {
  const [selectedType, setSelectedType] = useState<DrinkType | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canCapture = selectedType !== null;
  const canSubmit = selectedType !== null && photoFile !== null && !submitting;

  const buttonClass = (active: boolean) =>
    `flex-1 py-3 rounded border text-center font-medium ${
      active ? "bg-black text-white" : "bg-white"
    }`;

  const instruction = useMemo(() => {
    if (!selectedType) return "1) Choose a drink type.";
    if (!photoFile) return "2) Take a selfie with it.";
    return "3) Register the drink.";
  }, [selectedType, photoFile]);

  function onPickPhotoClick() {
    setErrorMsg(null);
    setSuccessMsg(null);
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMsg(null);
    setSuccessMsg(null);

    const f = e.target.files?.[0] ?? null;
    setPhotoFile(f);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit() {
    if (!selectedType || !photoFile) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await registerDrink({ type: selectedType, photoFile, amount: 1 });
      setSuccessMsg(`Registered: ${selectedType} ✅`);

      // Reset form (keep type optional—your choice)
      setPhotoFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      // Clear native file input so user can re-pick same image if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to register drink");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-md space-y-4">
      <h2 className="text-lg font-semibold">Register a drink</h2>
      <p className="text-sm opacity-70">{instruction}</p>

      {/* Type selector */}
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={buttonClass(selectedType === t)}
            onClick={() => {
              setSelectedType(t);
              setSuccessMsg(null);
              setErrorMsg(null);
            }}
            disabled={submitting}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Capture selfie */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={onFileChange}
        />

        <button
          type="button"
          onClick={onPickPhotoClick}
          disabled={!canCapture || submitting}
          className="w-full py-3 rounded border bg-white disabled:opacity-50"
        >
          {photoFile ? "Retake selfie" : "Take selfie"}
        </button>

        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Selfie preview"
            className="w-full rounded border"
          />
        )}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full py-3 rounded bg-black text-white disabled:opacity-50"
      >
        {submitting ? "Registering…" : "Register drink"}
      </button>

      {/* Messages */}
      {successMsg && <p className="text-sm text-green-700">{successMsg}</p>}
      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
    </section>
  );
}