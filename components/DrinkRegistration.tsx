"use client";

import { useMemo, useRef, useState } from "react";
import { registerDrink, type DrinkType } from "@/utils/drink_service";

const TYPES: DrinkType[] = ["Øl", "Vin", "Shot", "Annet"];

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

  const typeButtonClass = (active: boolean) =>
    [
      "w-full",
      "rounded-xl",
      "border-2", // semi-thick
      "border-white",
      "bg-transparent",
      "text-white",
      "font-semibold",
      "py-4",
      "px-3",
      "flex",
      "items-center",
      "justify-center",
      "gap-2",
      "transition",
      "disabled:opacity-40",
      "disabled:cursor-not-allowed",
      active ? "ring-2 ring-white/60" : "hover:bg-white/10",
    ].join(" ");

  const actionButtonClass =
    "w-full py-3 rounded-xl border-2 border-white bg-transparent text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition";

  const submitButtonClass =
    "w-full py-3 rounded-xl bg-white text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition";

  const instruction = useMemo(() => {
    if (!selectedType) return "Velg en type drikke!";
    if (!photoFile) return "Ta et selfie med den.";
    return "Registrer drikken.";
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

      setPhotoFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to register drink");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-md space-y-4 text-white">
      <h2 className="text-lg font-semibold">Register a drink</h2>
      <p className="text-sm opacity-80">{instruction}</p>

      {/* Type selector (2x2) */}
      <div className="grid grid-cols-2 gap-3">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={typeButtonClass(selectedType === t)}
            onClick={() => {
              setSelectedType(t);
              setSuccessMsg(null);
              setErrorMsg(null);
            }}
            disabled={submitting}
          >
            {/* Icon placeholder (you'll replace later) */}
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/60 text-xs"
              title="icon placeholder"
            >
              +
            </span>
            <span>{t}</span>
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
          className={actionButtonClass}
        >
          {photoFile ? "Ta bilde på nytt?" : "Ta et selfie med drikken!"}
        </button>

        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Selfie preview"
            className="w-full rounded-xl border-2 border-white/60"
          />
        )}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className={submitButtonClass}
      >
        {submitting ? "Registrerer..." : "Registrer drikken!"}
      </button>

      {/* Messages */}
      {successMsg && <p className="text-sm text-green-300">{successMsg}</p>}
      {errorMsg && <p className="text-sm text-red-300">{errorMsg}</p>}
    </section>
  );
}