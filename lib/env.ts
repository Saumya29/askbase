export const env = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
};

export const isConfigured = {
  openai: Boolean(env.openaiApiKey),
  supabase: Boolean(env.supabaseUrl && env.supabaseServiceKey),
};
