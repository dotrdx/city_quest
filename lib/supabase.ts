import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://lgyzzublwqlutfvnbtbv.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneXp6dWJsd3FsdXRmdm5idGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDQ5MjksImV4cCI6MjA5MjA4MDkyOX0.vp-wibTW_QU7c4xSjavQqdkEivP4Bo4OeOg0yoHaAXw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
