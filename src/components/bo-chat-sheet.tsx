"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon, BoIcon } from "@/components/icons";
import { TutorChat } from "@/components/tutor-chat";
import { useT } from "@/lib/i18n/provider";
import { BoMascot } from "@/components/bo-mascot";

/** The navigation entry that opens Bo from any page. */
export function BoChatLauncher({
  children,
  className,
  tour,
}: {
  children?: ReactNode;
  className?: string;
  tour?: string;
}) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const closeOnBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", closeOnBackdrop);
    return () => dialog.removeEventListener("click", closeOnBackdrop);
  }, []);

  return (
    <>
      <button type="button" className={className} data-tour={tour} onClick={() => dialogRef.current?.showModal()}>
        {children ?? (
          <>
            <BoIcon />
            {t("nav.lexa")}
          </>
        )}
      </button>

      <dialog ref={dialogRef} className="bo-sheet" aria-label={t("brand.ai")}>
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <div className="flex items-center gap-3">
              <BoMascot mood="neutral" size={48} />
              <h2 className="text-xl font-semibold">{t("brand.ai")}</h2>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={t("common.close")}
              className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-paper-deep"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="overflow-y-auto px-5 pb-6 pt-4">
            <TutorChat />
          </div>
        </div>
      </dialog>
    </>
  );
}
