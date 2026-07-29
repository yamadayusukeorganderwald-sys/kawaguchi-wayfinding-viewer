import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import MapViewer from "./components/MapViewer";
import { useState } from "react";
import PlaceForm from "./components/PlaceForm";

function App() {

  useEffect(() => {
    async function loadPlaces() {
      const { data, error } = await supabase
        .from("places")
        .select("*");

      if (error) {
        console.error("placesの取得に失敗:", error);
        return;
      }

      setPlaceList(data);

      if (data.length > 0) {
        setPlace(data[0]);
      }
    }

    loadPlaces();
  }, []);

  const [placeList, setPlaceList] = useState([]);
  const [place, setPlace] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeAnchor, setRouteAnchor] = useState(null);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);

  const handleAddPlace = async (newPlace) => {
    const { data, error } = await supabase
      .from("places")
      .insert(newPlace)
      .select()
      .single();

    if (error) {
      console.error("地点の追加に失敗:", error);
      alert("地点を保存できませんでした");
      return;
    }

    setPlaceList((currentPlaces) => [
      ...currentPlaces,
      data,
    ]);

    setPlace(data);
    setShowPlaceForm(false);
    setClickedPosition(null);
  };

  const handleUpdatePlace = async (updatedPlace) => {
    const { data, error } = await supabase
      .from("places")
      .update(updatedPlace)
      .eq("id", updatedPlace.id)
      .select()
      .single();

    if (error) {
      console.error("地点の更新に失敗:", error);
      alert("更新できませんでした");
      return;
    }

    setPlaceList((currentPlaces) =>
      currentPlaces.map((item) =>
        item.id === data.id ? data : item
      )
    );

    setPlace(data);
    setShowPlaceForm(false);
    setEditingPlace(null);
  };

  const handleDeletePlace = async (targetPlace) => {
    const confirmed = window.confirm(
      `「${targetPlace.name}」を削除しますか？`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("places")
      .delete()
      .eq("id", targetPlace.id);

    if (error) {
      console.error("地点の削除に失敗:", error);
      alert("削除できませんでした");
      return;
    }

    const updatedPlaces = placeList.filter(
      (item) => item.id !== targetPlace.id
    );

    setPlaceList(updatedPlaces);

    if (routeAnchor?.id === targetPlace.id) {
      setRouteAnchor(null);
      setShowRoute(false);
    }

    if (place?.id === targetPlace.id) {
      setPlace(updatedPlaces[0] ?? null);
    }

    setEditingPlace(null);
    setShowPlaceForm(false);
  };

  if (!place) {
    return <div>読み込み中...</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <Sidebar
        place={place}
        setPlace={setPlace}
        routeAnchor={routeAnchor}
        setRouteAnchor={setRouteAnchor}
        showRoute={showRoute}
        setShowRoute={setShowRoute}
        places={placeList}
        setShowPlaceForm={setShowPlaceForm}
        setEditingPlace={setEditingPlace}
        onDeletePlace={handleDeletePlace}
      />

      <MapViewer
        places={placeList}
        place={place}
        setPlace={setPlace}
        showRoute={showRoute}
        routeAnchor={routeAnchor}
        onMapClick={setClickedPosition}
        clickedPosition={clickedPosition}
      />

      {showPlaceForm && (
        <PlaceForm
          onAddPlace={handleAddPlace}
          onUpdatePlace={handleUpdatePlace}
          onClose={() => setShowPlaceForm(false)}
          initialPosition={clickedPosition}
          editingPlace={editingPlace}
        />
      )}

    </div>
  );
}

export default App;