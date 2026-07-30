import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import MapViewer from "./components/MapViewer";
import PlaceForm from "./components/PlaceForm";
import EdgeList from "./components/EdgeList";
import EdgeForm from "./components/EdgeForm";



const toAppEdge = (edge) => ({
  id: edge.id,
  from: edge.from,
  to: edge.to,
  distance: edge.distance,
  walkingTime: edge.walking_time,
  movement_type: edge.movement_type,
  road_context: edge.road_context,
  bidirectional: edge.bidirectional,
});

const toDatabaseEdge = (edge) => ({
  id: edge.id,
  from: edge.from,
  to: edge.to,
  distance: edge.distance,
  walking_time: edge.walkingTime,
  movement_type: edge.movement_type,
  road_context: edge.road_context,
  bidirectional: edge.bidirectional,
});

function App() {
  const [placeList, setPlaceList] = useState([]);
  const [place, setPlace] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeAnchor, setRouteAnchor] = useState(null);

  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);

  const [edgeList, setEdgeList] = useState([]);
  const [showEdgeForm, setShowEdgeForm] = useState(false);
  const [editingEdge, setEditingEdge] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [initialEdge, setInitialEdge] = useState(null);

  const isMobile = window.innerWidth < 768;

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [
        { data: places, error: placesError },
        { data: edges, error: edgesError },
      ] = await Promise.all([
        supabase.from("places").select("*"),
        supabase.from("edges").select("*"),
      ]);

      if (placesError) {
        console.error("placesの取得に失敗:", placesError);
      } else {
        const loadedPlaces = places ?? [];
        setPlaceList(loadedPlaces);
        setPlace(loadedPlaces[0] ?? null);
      }

      if (edgesError) {
        console.error("edgesの取得に失敗:", edgesError);
      } else {
        setEdgeList((edges ?? []).map(toAppEdge));
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  const closePlaceForm = () => {
    setShowPlaceForm(false);
    setEditingPlace(null);
    setClickedPosition(null);
  };

  const closeEdgeForm = () => {
    setShowEdgeForm(false);
    setEditingEdge(null);
    setInitialEdge(null);
  };

  const handleOpenEdgeForm = () => {
    if (!routeAnchor || !place) {
      setEditingEdge(null);
      setInitialEdge(null);
      setShowEdgeForm(true);
      return;
    }

    const existingEdge = edgeList.find((edge) => {
      const sameDirection =
        edge.from === routeAnchor.id &&
        edge.to === place.id;

      const reverseDirection =
        edge.bidirectional &&
        edge.from === place.id &&
        edge.to === routeAnchor.id;

      return sameDirection || reverseDirection;
    });

    if (existingEdge) {
      setEditingEdge(existingEdge);
      setInitialEdge(null);
    } else {
      setEditingEdge(null);
      setInitialEdge({
        from: routeAnchor.id,
        to: place.id,
      });
    }

    setShowEdgeForm(true);
  };

  const handleEdgeClick = (edge) => {
    setSelectedEdge(edge);
  };

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

    setPlaceList((currentPlaces) => [...currentPlaces, data]);
    setPlace(data);
    closePlaceForm();
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
      alert("地点を更新できませんでした");
      return;
    }

    setPlaceList((currentPlaces) =>
      currentPlaces.map((item) => (item.id === data.id ? data : item))
    );

    setPlace(data);

    if (routeAnchor?.id === data.id) {
      setRouteAnchor(data);
    }

    closePlaceForm();
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
      alert("地点を削除できませんでした");
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

    closePlaceForm();
  };

  const handleAddEdge = async (newEdge) => {
    const { data, error } = await supabase
      .from("edges")
      .insert(toDatabaseEdge(newEdge))
      .select()
      .single();

    if (error) {
      console.error("Edgeの追加に失敗:", error);
      alert("Edgeを追加できませんでした");
      return;
    }

    setEdgeList((currentEdges) => [
      ...currentEdges,
      toAppEdge(data),
    ]);

    closeEdgeForm();
  };

  const handleUpdateEdge = async (updatedEdge) => {
    const { data, error } = await supabase
      .from("edges")
      .update(toDatabaseEdge(updatedEdge))
      .eq("id", updatedEdge.id)
      .select()
      .single();

    if (error) {
      console.error("Edgeの更新に失敗:", error);
      alert("Edgeを更新できませんでした");
      return;
    }

    const savedEdge = toAppEdge(data);

    setEdgeList((currentEdges) =>
      currentEdges.map((edge) =>
        edge.id === savedEdge.id ? savedEdge : edge
      )
    );

    closeEdgeForm();
  };

  const handleDeleteEdge = async (targetEdge) => {
    const confirmed = window.confirm(
      "このEdgeを削除しますか？"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("edges")
      .delete()
      .eq("id", targetEdge.id);

    if (error) {
      console.error("Edgeの削除に失敗:", error);
      alert("Edgeを削除できませんでした");
      return;
    }

    setEdgeList((currentEdges) =>
      currentEdges.filter((edge) => edge.id !== targetEdge.id)
    );

    if (editingEdge?.id === targetEdge.id) {
      closeEdgeForm();
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (placeList.length === 0) {
    return <div>地点データがありません。</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        width: "100vw",
        height: "100dvh",
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
        isMobile={isMobile}

        selectedEdge={selectedEdge}
        setSelectedEdge={setSelectedEdge}
        onEditEdge={(edge) => {
          setEditingEdge(edge);
          setInitialEdge(null);
          setShowEdgeForm(true);
        }}
        onDeleteEdge={handleDeleteEdge}
      />

      <MapViewer
        places={placeList}
        edges={edgeList}
        place={place}
        setPlace={(selectedPlace) => {
          setPlace(selectedPlace);
          setSelectedEdge(null);
        }}
        showRoute={showRoute}
        setShowRoute={setShowRoute}
        routeAnchor={routeAnchor}
        setRouteAnchor={setRouteAnchor}
        onMapClick={setClickedPosition}
        clickedPosition={clickedPosition}
        onEdgeClick={handleEdgeClick}
        selectedEdge={selectedEdge}
        isMobile={isMobile}
      />

      <EdgeList
        edges={edgeList}
        places={placeList}
        setShowEdgeForm={setShowEdgeForm}
        setEditingEdge={setEditingEdge}
        onOpenEdgeForm={handleOpenEdgeForm}
        onDeleteEdge={handleDeleteEdge}
        setShowPlaceForm={setShowPlaceForm}
        setEditingPlace={setEditingPlace}

        place={place}
        routeAnchor={routeAnchor}
        setRouteAnchor={setRouteAnchor}
        showRoute={showRoute}
        setShowRoute={setShowRoute}
      />

      {showPlaceForm && (
        <PlaceForm
          onAddPlace={handleAddPlace}
          onUpdatePlace={handleUpdatePlace}
          onClose={closePlaceForm}
          initialPosition={clickedPosition}
          editingPlace={editingPlace}
        />
      )}

      {showEdgeForm && (
        <EdgeForm
          places={placeList}
          editingEdge={editingEdge}
          initialEdge={initialEdge}
          onSave={handleAddEdge}
          onUpdate={handleUpdateEdge}
          onClose={closeEdgeForm}
        />
      )}
    </div>
  );
}

export default App;