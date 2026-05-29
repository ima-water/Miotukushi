const SUPABASE_URL = 'https://orostnlovaoyzvozzjeu.supabase.co';
const SUPABASE_ANON = 'sb_publishable_VaIEHsGSIKnpNlkp5V0Leg_Drfx2Vnj';

// 🔴 名前を supabase から supabaseClient に変更！
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON
);