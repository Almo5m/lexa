// Every variable is read with its full literal name. Next.js only replaces
// `process.env.NEXT_PUBLIC_...` written out in full when it builds the browser code,
// so a lookup by a computed name comes back empty in the browser.
function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: () => required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};

export const serverEnv = {
  supabaseServiceKey: () => required(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
  geminiApiKey: () => required(process.env.GEMINI_API_KEY, "GEMINI_API_KEY"),
};
