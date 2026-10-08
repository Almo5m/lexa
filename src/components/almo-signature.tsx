import { getT } from "@/lib/i18n/server";

const PAGE_URL = "https://www.facebook.com/share/1HvQMbwYYV/";

export async function AlmoSignature() {
  const { t } = await getT();
  return (
    <footer className="mt-16 border-t border-line px-5 py-6 text-sm text-ink-faint">
      <p>
        {t("footer.credit")}{" "}
        <a
          href={PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ink underline decoration-violet decoration-2 underline-offset-4"
        >
          AL-MO
        </a>
      </p>
      <p className="mt-1">© Moaz (AlMo). All Rights Reserved.</p>
    </footer>
  );
}
