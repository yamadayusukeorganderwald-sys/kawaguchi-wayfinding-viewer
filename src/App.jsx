import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import MapViewer from "./components/MapViewer";
import PlaceForm from "./components/PlaceForm";
import EdgeList from "./components/EdgeList";
import EdgeForm from "./components/EdgeForm";
import MobileBottomBar from "./components/MobileBottomBar";
import MobileToolbar from "./components/MobileToolbar";



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

const calculateDistanceMeters = (
  fromLongitude,
  fromLatitude,
  toLongitude,
  toLatitude
) => {
  const earthRadius = 6371000;

  const toRadians = (degrees) =>
    degrees * Math.PI / 180;

  const latitude1 = toRadians(fromLatitude);
  const latitude2 = toRadians(toLatitude);

  const latitudeDifference = toRadians(
    toLatitude - fromLatitude
  );

  const longitudeDifference = toRadians(
    toLongitude - fromLongitude
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(latitude1) *
    Math.cos(latitude2) *
    Math.sin(longitudeDifference / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return Math.round(earthRadius * c);
};

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

  const [edgeSplitMode, setEdgeSplitMode] = useState("idle");
  const [splitTargetEdge, setSplitTargetEdge] = useState(null);
  const [splitPreviewPosition, setSplitPreviewPosition] = useState(null);

  const [cameraResetRequest, setCameraResetRequest] = useState(0);
  const [skipCameraMoveRequest, setSkipCameraMoveRequest] = useState(0);

  const [showMobileDetails, setShowMobileDetails] = useState(false);

  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const handleChange = (event) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

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

        const initialPlace =
          loadedPlaces.find((item) => item.id === "entrance") ??
          loadedPlaces[0] ??
          null;

        setPlace(initialPlace);
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

  useEffect(() => {
    if (!isMobile) return;
    if (!routeAnchor || !place) return;
    if (routeAnchor.id === place.id) return;

    setShowRoute(true);
  }, [isMobile, routeAnchor, place]);

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

  const handleMobileAdd = () => {
    const canCreateEdge =
      routeAnchor &&
      place &&
      routeAnchor.id !== place.id;

    if (canCreateEdge) {
      handleOpenEdgeForm();
      return;
    }

    setEditingPlace(null);
    setShowPlaceForm(true);
  };

  const handleClearRoute = () => {
    setRouteAnchor(null);
    setShowRoute(false);
  };

  const handleEdgeClick = (edge) => {
    setSelectedEdge(edge);
  };

  const handleStartEdgeSplit = () => {
    if (!selectedEdge) {
      alert("分割するEdgeを選択してください");
      return;
    }

    setSplitTargetEdge(selectedEdge);
    setEdgeSplitMode("selectingOnEdge");
    setSplitPreviewPosition(null);
  };

  const handleCancelEdgeSplit = () => {
    setEdgeSplitMode("idle");
    setSplitTargetEdge(null);
    setSplitPreviewPosition(null);
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

    setEdgeList((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          edge.from !== targetPlace.id &&
          edge.to !== targetPlace.id
      )
    );

    if (routeAnchor?.id === targetPlace.id) {
      setRouteAnchor(null);
      setShowRoute(false);
    }

    if (place?.id === targetPlace.id) {
      setSkipCameraMoveRequest((current) => current + 1);
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

  const handleConfirmEdgeSplit = async ({
    edge,
    splitPosition,
    newPointPosition,
  }) => {

    const newPlace = {
      id: crypto.randomUUID(),
      name: "新規地点",
      type: "junction",

      longitude: newPointPosition.longitude,
      latitude: newPointPosition.latitude,
      level: newPointPosition.level,

      description: "",
      observation: "",
      problem: "",
      proposal: "",
      image: "",
    };

    const { data: savedPlace, error: placeError } =
      await supabase
        .from("places")
        .insert(newPlace)
        .select()
        .single();

    if (placeError) {
      console.error(
        "分割地点の追加に失敗:",
        placeError
      );

      alert("分割地点を保存できませんでした");
      setEdgeSplitMode("placingNewPoint");
      return;
    }

    const fromPlace = placeList.find(
      (item) => item.id === edge.from
    );

    const toPlace = placeList.find(
      (item) => item.id === edge.to
    );

    if (!fromPlace || !toPlace) {
      alert("元Edgeの地点情報が見つかりませんでした");
      return;
    }

    const distanceFromToNew = calculateDistanceMeters(
      fromPlace.longitude,
      fromPlace.latitude,
      savedPlace.longitude,
      savedPlace.latitude
    );

    const distanceNewToTo = calculateDistanceMeters(
      savedPlace.longitude,
      savedPlace.latitude,
      toPlace.longitude,
      toPlace.latitude
    );

    const walkingTimeFromToNew = Math.max(
      1,
      Math.round(distanceFromToNew / 1.2)
    );

    const walkingTimeNewToTo = Math.max(
      1,
      Math.round(distanceNewToTo / 1.2)
    );

    const newEdges = [
      {
        id: crypto.randomUUID(),
        from: edge.from,
        to: savedPlace.id,
        distance: distanceFromToNew,
        walkingTime: walkingTimeFromToNew,
        movement_type: edge.movement_type,
        road_context: edge.road_context,
        bidirectional: edge.bidirectional,
      },
      {
        id: crypto.randomUUID(),
        from: savedPlace.id,
        to: edge.to,
        distance: distanceNewToTo,
        walkingTime: walkingTimeNewToTo,
        movement_type: edge.movement_type,
        road_context: edge.road_context,
        bidirectional: edge.bidirectional,
      },
    ];

    const { data: savedEdges, error: edgesError } =
      await supabase
        .from("edges")
        .insert(newEdges.map(toDatabaseEdge))
        .select();

    if (edgesError) {
      console.error(
        "分割後Edgeの追加に失敗:",
        edgesError
      );

      alert("分割後のEdgeを保存できませんでした");
      return;
    }

    const { error: deleteEdgeError } =
      await supabase
        .from("edges")
        .delete()
        .eq("id", edge.id);

    if (deleteEdgeError) {
      console.error(
        "元Edgeの削除に失敗:",
        deleteEdgeError
      );

      alert("元のEdgeを削除できませんでした");
      return;
    }

    setPlaceList((currentPlaces) => [
      ...currentPlaces,
      savedPlace,
    ]);

    setEdgeList((currentEdges) => [
      ...currentEdges.filter(
        (item) => item.id !== edge.id
      ),
      ...savedEdges.map(toAppEdge),
    ]);

    setPlace(savedPlace);
    setSelectedEdge(null);
    setShowRoute(false);
    setRouteAnchor(null);

    setEdgeSplitMode("idle");
    setSplitTargetEdge(null);
    setSplitPreviewPosition(null);
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
        flexDirection: "row",
        width: "100vw",
        height: "100dvh",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {!isMobile && (
        <div
          style={{
            width: "280px",
            height: "100%",
            position: "relative",
            zIndex: 10,
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
        </div>
      )}
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
        skipCameraMoveRequest={skipCameraMoveRequest}

        edgeSplitMode={edgeSplitMode}
        setEdgeSplitMode={setEdgeSplitMode}
        splitTargetEdge={splitTargetEdge}
        splitPreviewPosition={splitPreviewPosition}
        setSplitPreviewPosition={setSplitPreviewPosition}
        onConfirmEdgeSplit={handleConfirmEdgeSplit}
        cameraResetRequest={cameraResetRequest}
        onBackgroundClick={() => {
          setSelectedEdge(null);

          if (isMobile) {
            setShowMobileDetails(false);
          }
        }}
      />

      {isMobile && (
        <MobileBottomBar
          place={place}
          selectedEdge={selectedEdge}
          setShowPlaceForm={setShowPlaceForm}
          setEditingPlace={setEditingPlace}
          onDeletePlace={handleDeletePlace}
          onEditEdge={(edge) => {
            setEditingEdge(edge);
            setInitialEdge(null);
            setShowEdgeForm(true);
          }}
          onDeleteEdge={handleDeleteEdge}
          showDetails={showMobileDetails}
          setShowDetails={setShowMobileDetails}
        />
      )}

      {isMobile && (
        <MobileToolbar
          canSplitEdge={Boolean(selectedEdge)}
          isSplittingEdge={edgeSplitMode !== "idle"}

          hasRouteAnchor={Boolean(routeAnchor)}
          showRoute={showRoute}

          onAdd={handleMobileAdd}

          onSplitEdge={handleStartEdgeSplit}
          onCancelSplit={handleCancelEdgeSplit}

          onSetRouteAnchor={() => {
            if (!place) return;

            setRouteAnchor(place);
            setShowRoute(false);
          }}

          onClearRoute={handleClearRoute}

          onResetCamera={() => {
            setCameraResetRequest((current) => current + 1);
          }}
        />
      )}

      {!isMobile && (
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
          isMobile={isMobile}

          selectedEdge={selectedEdge}
          edgeSplitMode={edgeSplitMode}
          onStartEdgeSplit={handleStartEdgeSplit}
          onCancelEdgeSplit={handleCancelEdgeSplit}
        />
      )}

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