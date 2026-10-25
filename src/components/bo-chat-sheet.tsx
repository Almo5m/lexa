"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { BoIcon } from "@/components/icons";
import { BoChat } from "@/components/bo-chat";
import { useBoCompanion } from "@/components/bo-companion-context";
import { useT } from "@/lib/i18n/provider";

/** The navigation entry that opens Bo's chat from any page. */
export function BoChatLauncher({ children, className, tour }: { children?: ReactNode; className?: string; tour?: string }) {
  const { t } = useT();
  const { openChat } = useBoCompanion();
  return (
    <button type="button" className={className} data-tour={tour} onClick={openChat}>
      {children ?? (
        <>
          <BoIcon />
          {t("nav.lexa")}
        </>
      )}
    </button>
  );
}

/** The chat sheet itself. One copy lives in the app, and any button or Bo's menu opens it. */
export function BoChatHost() {
  const { t } = useT();
  const { chatOpen, closeChat } = useBoCompanion();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (chatOpen && !dialog.open) dialog.showModal();
    if (!chatOpen && dialog.open) dialog.close();
  }, [chatOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) closeChat();
    };
    dialog.addEventListener("click", onBackdrop);
    dialog.addEventListener("close", closeChat);
    return () => {
      dialog.removeEventListener("click", onBackdrop);
      dialog.removeEventListener("close", closeChat);
    };
  }, [closeChat]);

  return (
    <dialog ref={dialogRef} className="bo-sheet" aria-label={t("brand.ai")}>
      <div className="flex h-[88dvh] max-h-[760px] flex-col">
        <BoChat layout="sheet" onClose={closeChat} />
      </div>
    </dialog>
  );
}
