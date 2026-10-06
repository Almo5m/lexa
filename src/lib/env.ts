function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const publicEnv = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};

export const serverEnv = {
  supabaseServiceKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  geminiApiKey: () => required("GEMINI_API_KEY"),
};
