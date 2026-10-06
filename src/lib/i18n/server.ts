import { cookies } from "next/headers";
import { parseLang, translate, type DictKey, type Lang } from "./dictionary";

export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get("lang")?.value);
}

export async function getT() {
  const lang = await getLang();
  return {
    lang,
    t: (key: DictKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
  };
}
