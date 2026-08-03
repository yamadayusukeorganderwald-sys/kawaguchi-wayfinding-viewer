import { supabase } from "../lib/supabase";

export async function loadDiscoveries() {
  const { data, error } = await supabase
    .from("discoveries")
    .select("*");

  if (error) throw error;

  return data;
}