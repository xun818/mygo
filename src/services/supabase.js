// supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://njflakkfmfjuwtsjhmmv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZmxha2tmbWZqdXd0c2pobW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc3ODAsImV4cCI6MjA1OTUyMzc4MH0.ciopAdSBvCoq7Ae-yQ1jWPEjxPh69Q5NTYowbpOLnI4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);