export const env = {
  get openaiApiKey() {
    return process.env.OPENAI_API_KEY;
  },
  get supabaseUrl() {
    return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  },
  get supabaseServiceKey() {
    return (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    );
  },
};

export const isConfigured = {
  get openai() {
    return Boolean(env.openaiApiKey);
  },
  get supabase() {
    return Boolean(env.supabaseUrl && env.supabaseServiceKey);
  },
};
