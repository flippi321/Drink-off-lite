"use client";

import { useMemo, useRef, useState } from "react";
import { registerDrink, type DrinkType } from "@/utils/drink_service";

const TYPES: DrinkType[] = ["Øl", "Vin", "Shot", "Annet"];

/* ---------------- Icons ---------------- */

function BeerIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h8v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z" />
      <path d="M14 10h2a2 2 0 0 1 0 4h-2" />
      <path d="M7 5h6v3H7z" />
    </svg>
  );
}

function WineIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12v4a6 6 0 0 1-12 0V3z" />
      <path d="M12 13v6" />
      <path d="M8 21h8" />
    </svg>
  );
}

function ShotIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3h8l-2 14H10L8 3z" />
      <path d="M9 3h6" />
    </svg>
  );
}

function OtherIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function getIcon(type: DrinkType) {
  switch (type) {
    case "Øl":
      return <BeerIcon />;
    case "Vin":
      return <WineIcon />;
    case "Shot":
      return <ShotIcon />;
    default:
      return <OtherIcon />;
  }
}

/* ---------------- Component ---------------- */

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
      "border-2",
      "border-white",
      "bg-transparent",
      "text-white",
      "font-semibold",
      "py-4",
      "px-3",
      "flex",
      "items-center",
      "justify-center",
      "gap-3",
      "transition",
      "disabled:opacity-40",
      "disabled:cursor-not-allowed",
      active ? "ring-2 ring-white/60 bg-white/10" : "hover:bg-white/10",
    ].join(" ");

  const collapsedTypeButtonClass =
    [
      "w-full",
      "rounded-xl",
      "border-2",
      "border-white",
      "bg-transparent",
      "text-white",
      "font-semibold",
      "py-3", // flatter / less height
      "px-4",
      "flex",
      "items-center",
      "justify-center",
      "gap-3",
      "transition",
      "hover:bg-white/10",
      "disabled:opacity-40",
      "disabled:cursor-not-allowed",
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
      setSuccessMsg(`Registrert: ${selectedType} ✅`);

      setPhotoFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Kunne ikke registrere drikken");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-md space-y-4 text-white">
      <h2 className="text-lg font-semibold">Registrer en drikk</h2>
      <p className="text-sm opacity-80">{instruction}</p>

      {/* Type selector */}
      {!selectedType ? (
        // 2x2 Type Grid (initial)
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={typeButtonClass(false)}
              onClick={() => {
                setSelectedType(t);
                setSuccessMsg(null);
                setErrorMsg(null);
              }}
              disabled={submitting}
            >
              {getIcon(t)}
              <span>{t}</span>
            </button>
          ))}
        </div>
      ) : (
        // Collapsed selector (after choosing)
        <button
          type="button"
          className={collapsedTypeButtonClass}
          onClick={() => {
            setSelectedType(null);
            setPhotoFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setSuccessMsg(null);
            setErrorMsg(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          disabled={submitting}
        >
          <span className="shrink-0 opacity-90">{getIcon(selectedType)}</span>
          <span className="text-sm md:text-base">
            Du har valgt <span className="font-extrabold">{selectedType}</span>. Trykk her for å bytte!
          </span>
        </button>
      )}

      {/* Camera */}
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

      {successMsg && <p className="text-sm text-green-300">{successMsg}</p>}
      {errorMsg && <p className="text-sm text-red-300">{errorMsg}</p>}
    </section>
  );
}