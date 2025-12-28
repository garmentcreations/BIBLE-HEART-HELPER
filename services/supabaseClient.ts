import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zfzhthsncvjtyuxyfshq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmenRoaHNuY3ZqdHl1eHlmc2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzY5NzUsImV4cCI6MjA4MjUxMjk3NX0.PVzVDtBWd-fZXaSM7r3CePV81BKRTPff7qBdSKVRJq8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
