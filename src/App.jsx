
import Sidebar from "./components/Sidebar";
import MapViewer from "./components/MapViewer";
import { useState } from "react";
import { places } from "./data/places";
import PlaceForm from "./components/PlaceForm";

function App() {
  const [placeList, setPlaceList] = useState(places);
  const [place, setPlace] = useState(places[0]);
  const [showRoute, setShowRoute] = useState(false);
  const [routeAnchor, setRouteAnchor] = useState(null);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);

  const handleAddPlace = (newPlace) => {
    setPlaceList((currentPlaces) => [
      ...currentPlaces,
      newPlace,
    ]);

    setPlace(newPlace);
  };

  const handleUpdatePlace = (updatedPlace) => {
    setPlaceList((currentPlaces) =>
      currentPlaces.map((item) =>
        item.id === updatedPlace.id
          ? updatedPlace
          : item
      )
    );

    setPlace(updatedPlace);
  };

  const handleDeletePlace = (targetPlace) => {
    const confirmed = window.confirm(
      `「${targetPlace.name}」を削除しますか？`
    );

    if (!confirmed) return;

    const updatedPlaces = placeList.filter(
      (item) => item.id !== targetPlace.id
    );

    setPlaceList(updatedPlaces);

    if (routeAnchor?.id === targetPlace.id) {
      setRouteAnchor(null);
      setShowRoute(false);
    }

    if (place.id === targetPlace.id) {
      setPlace(updatedPlaces[0] ?? null);
    }
  };

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