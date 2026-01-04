import { createClient } from '@supabase/supabase-js';

// 1. Die Adresse deiner Datenbank
const SUPABASE_URL = 'https://sgofclixezlfxaiugcuy.supabase.co'; 

// 2. Dein Anon-Schlüssel (fest im Code verbaut)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb2ZjbGl4ZXpsZnhhaXVnY3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjYxMTMsImV4cCI6MjA4MzEwMjExM30.OBK9yZ2HfYUYH5RZWoLyEBg8XSN_iti_fo8jEHjUcPA'; 

// 3. Erstellung des Supabase-Clients für die gesamte App
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Hilfsfunktionen zum Datenmanagement
 */
export const fetchTableData = async (tableName: string) => {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error(`Fehler beim Laden von ${tableName}:`, error.message);
    return null;
  }
};

export const insertData = async (tableName: string, row: any) => {
  try {
    const { data, error } = await supabase.from(tableName).insert([row]).select();
    if (error) throw error;
    return data ? data[0] : null;
  } catch (error: any) {
    console.error(`Fehler beim Speichern in ${tableName}:`, error.message);
    return null;
  }
};