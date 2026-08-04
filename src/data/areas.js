import { supabase } from "../lib/supabase";

const toAppArea = (area) => ({
  ...area,

  // [[経度, 緯度], ...] → [経度, 緯度, 経度, 緯度, ...]
  flatCoordinates: area.coordinates.flatMap(
    ([longitude, latitude]) => [
      longitude,
      latitude,
    ]
  ),
});

export async function loadAreas() {
  const { data, error } = await supabase
    .from("areas")
    .select("*");

  if (error) throw error;

  return (data ?? []).map(toAppArea);
}