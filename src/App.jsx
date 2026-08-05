import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import MapViewer from "./components/MapViewer";
import PlaceForm from "./components/PlaceForm";
import EdgeList from "./components/EdgeList";
import EdgeForm from "./components/EdgeForm";
import MobileBottomBar from "./components/MobileBottomBar";
import MobileToolbar from "./components/MobileToolbar";
import EdgeConnectionModal from "./components/EdgeConnectionModal";
import { loadDiscoveries } from "./data/discoveries";
import DiscoveryForm from "./components/DiscoveryForm";
import DiscoveryDetail from "./components/DiscoveryDetail";
import DiscoveryConnectionModal from "./components/DiscoveryConnectionModal";
import { createImageFileName } from "./utils/imageFileName";
import DeveloperTools from "./components/DeveloperTools";
import { InteractionMode } from "./constants/interactionMode";
import { loadAreas } from "./data/areas";
import AreaForm from "./components/AreaForm";

const toAppEdge = (edge) => ({
  id: edge.id,
  from: edge.from,
  to: edge.to,
  distance: edge.distance,
  walkingTime: edge.walking_time,
  movement_type: edge.movement_type,
  road_context: edge.road_context,
  road_name: edge.road_name ?? "",
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
  road_name: edge.road_name || null,
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
  const [showDiscoveryForm, setShowDiscoveryForm] = useState(false);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);
  const [discoveryPosition, setDiscoveryPosition] = useState(null);
  const [selectedDiscovery, setSelectedDiscovery] = useState(null);
  const [editingDiscovery, setEditingDiscovery] = useState(null);

  const [edgeList, setEdgeList] = useState([]);
  const [showEdgeForm, setShowEdgeForm] = useState(false);
  const [editingEdge, setEditingEdge] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [initialEdge, setInitialEdge] = useState(null);

  const [discoveryList, setDiscoveryList] = useState([]);
  const [pendingDiscovery, setPendingDiscovery] = useState(null);
  const [areaList, setAreaList] = useState([]);
  const [drawingAreaPoints, setDrawingAreaPoints] = useState([]);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [editingAreaVertexIndex, setEditingAreaVertexIndex] = useState(null);

  const [interactionMode, setInteractionMode] =
    useState(InteractionMode.IDLE);
  const [splitTargetEdge, setSplitTargetEdge] = useState(null);
  const [splitPreviewPosition, setSplitPreviewPosition] = useState(null);

  const [cameraResetRequest, setCameraResetRequest] = useState(0);
  const [skipCameraMoveRequest, setSkipCameraMoveRequest] = useState(0);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isCurrentPositionSelected, setIsCurrentPositionSelected] =
    useState(false);
  const [edgeConnectionPlace, setEdgeConnectionPlace] =
    useState(null);

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
      setIsLoading(true);

      try {
        // Places
        const { data: places, error: placesError } = await supabase
          .from("places")
          .select("*");

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

        // Edges
        const { data: edges, error: edgesError } = await supabase
          .from("edges")
          .select("*");

        if (edgesError) {
          console.error("edgesの取得に失敗:", edgesError);
        } else {
          setEdgeList((edges ?? []).map(toAppEdge));
        }

        // Discoveries
        try {
          const discoveries = await loadDiscoveries();
          console.log("discoveries", discoveries);
          setDiscoveryList(discoveries ?? []);
        } catch (discoveryError) {
          console.error(
            "discoveriesの取得に失敗:",
            discoveryError
          );

          // Discoveryだけ失敗してもアプリは表示する
          setDiscoveryList([]);
        }

        // Areas
        try {
          const areas = await loadAreas();
          console.log("areas", areas);
          setAreaList(areas ?? []);
        } catch (areaError) {
          console.error(
            "areasの取得に失敗:",
            areaError
          );

          setAreaList([]);
        }

      } catch (error) {
        console.error("初期データの取得中にエラー:", error);
      } finally {
        setIsLoading(false);
      }
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

  const handleOpenPlaceForm = () => {
    setEditingPlace(null);

    if (isCurrentPositionSelected && currentPosition) {
      setClickedPosition({
        longitude: currentPosition.longitude,
        latitude: currentPosition.latitude,
        height: 0,
      });
    }
    setShowPlaceForm(true);
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

    handleOpenPlaceForm();
  };

  const handleClearRoute = () => {
    setRouteAnchor(null);
    setShowRoute(false);
  };

  const handleEdgeClick = (edge) => {
    setSelectedEdge(edge);
    setIsCurrentPositionSelected(false);
    setClickedPosition(null);
  };

  const handleStartEdgeSplit = () => {
    if (!selectedEdge) {
      alert("分割するEdgeを選択してください");
      return;
    }

    setSplitTargetEdge(selectedEdge);
    setInteractionMode(InteractionMode.EDGE_SPLIT_SELECTING);
    setSplitPreviewPosition(null);
  };

  const handleCancelEdgeSplit = () => {
    setInteractionMode(InteractionMode.IDLE);
    setSplitTargetEdge(null);
    setSplitPreviewPosition(null);
  };

  const handleAddPlace = async (newPlace) => {
    const {
      createEdges,
      ...placeData
    } = newPlace;

    const { data, error } = await supabase
      .from("places")
      .insert(placeData)
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

    if (createEdges) {
      setEdgeConnectionPlace(data);
    }

    closePlaceForm();
  };

  const handleUpdatePlace = async (updatedPlace) => {
    const updateData = {
      name: updatedPlace.name,
      latitude: updatedPlace.latitude,
      longitude: updatedPlace.longitude,
      height: updatedPlace.height,
      type: updatedPlace.type,
      place_type: updatedPlace.place_type,
      level: updatedPlace.level,
      description: updatedPlace.description,
      image_url: updatedPlace.image_url,
    };

    const { data, error } = await supabase
      .from("places")
      .update(updateData)
      .eq("id", updatedPlace.id)
      .select()
      .single();

    if (error) {
      console.error("地点の更新に失敗:", error);
      alert(`地点を更新できませんでした\n${error.message}`);
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
      setInteractionMode(InteractionMode.EDGE_SPLIT_PLACING);
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
        road_name: edge.road_name ?? "",
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
        road_name: edge.road_name ?? "",
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

    setInteractionMode(InteractionMode.IDLE);
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

  const handleStartAreaDrawing = () => {
    setDrawingAreaPoints([]);
    setInteractionMode(InteractionMode.AREA_DRAWING);
  };

  const handleStartAreaEditing = () => {
    if (drawingAreaPoints.length < 3) {
      alert("Areaは3点以上で作成してください");
      return;
    }

    setInteractionMode(InteractionMode.AREA_EDITING);
  };

  const handleOpenAreaForm = () => {
    if (drawingAreaPoints.length < 3) {
      alert("Areaは3点以上で作成してください");
      return;
    }

    setShowAreaForm(true);
  };

  const handleSaveArea = async (area) => {
    const coordinates = drawingAreaPoints.map((point) => [
      point.longitude,
      point.latitude,
    ]);

    const { data, error } = await supabase
      .from("areas")
      .insert({
        ...area,
        coordinates,
      })
      .select()
      .single();

    if (error) {
      console.error("Area保存失敗:", error);
      alert(`Areaを保存できませんでした\n${error.message}`);
      return;
    }

    setAreaList((current) => [
      ...current,
      {
        ...data,
        flatCoordinates: data.coordinates.flat(),
      },
    ]);

    setShowAreaForm(false);
    setDrawingAreaPoints([]);
    setEditingAreaVertexIndex(null);
    setInteractionMode(InteractionMode.IDLE);

    console.log("Area保存完了", data);
  };

  const handleUpdateDiscovery = async (updatedDiscovery) => {
    const {
      imageFile,
      ...discoveryData
    } = updatedDiscovery;

    let imageUrl = discoveryData.image_url ?? null;

    try {
      if (imageFile) {
        const uploadedImagePath = createImageFileName(
          "discovery",
          updatedDiscovery.id
        );

        const { error: uploadError } =
          await supabase.storage
            .from("discovery-images")
            .upload(
              uploadedImagePath,
              imageFile,
              {
                cacheControl: "3600",
                upsert: true,
                contentType: imageFile.type,
              }
            );

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } =
          supabase.storage
            .from("discovery-images")
            .getPublicUrl(uploadedImagePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("discoveries")
        .update({
          latitude: discoveryData.latitude,
          longitude: discoveryData.longitude,
          height: discoveryData.height,
          message: discoveryData.message,
          image_url: imageUrl,
          connected_place_id:
            discoveryData.connected_place_id,
          connected_edge_id:
            discoveryData.connected_edge_id,
        })
        .eq("id", updatedDiscovery.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setDiscoveryList((currentDiscoveries) =>
        currentDiscoveries.map((item) =>
          item.id === data.id ? data : item
        )
      );

      setEditingDiscovery(null);
      setShowDiscoveryForm(false);
      setDiscoveryPosition(null);
    } catch (error) {
      console.error("発見の更新に失敗:", error);

      alert(
        `発見を更新できませんでした\n${error?.message ?? JSON.stringify(error)
        }`
      );
    }
  };

  const handleSaveDiscovery = async (
    discovery,
    connectedPlaceId = null,
    connectedEdgeId = null
  ) => {
    const discoveryId = crypto.randomUUID();
    const {
      imageFile,
      ...discoveryData
    } = discovery;

    let imageUrl = null;
    let uploadedImagePath = null;

    try {
      if (imageFile) {
        uploadedImagePath = createImageFileName(
          "discovery",
          discoveryId
        );

        const { error: uploadError } =
          await supabase.storage
            .from("discovery-images")
            .upload(
              uploadedImagePath,
              imageFile,
              {
                cacheControl: "3600",
                upsert: false,
                contentType: imageFile.type,
              }
            );

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } =
          supabase.storage
            .from("discovery-images")
            .getPublicUrl(uploadedImagePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("discoveries")
        .insert({
          id: discoveryId,
          ...discoveryData,
          image_url: imageUrl,
          connected_place_id: connectedPlaceId,
          connected_edge_id: connectedEdgeId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setDiscoveryList((currentDiscoveries) => [
        ...currentDiscoveries,
        data,
      ]);

      setPendingDiscovery(null);
      setDiscoveryPosition(null);
      setClickedPosition(null);
    } catch (error) {
      console.error("発見の保存に失敗:", error);

      if (uploadedImagePath) {
        await supabase.storage
          .from("discovery-images")
          .remove([uploadedImagePath]);
      }

      alert("発見を保存できませんでした");
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
            clickedPosition={clickedPosition}

            selectedEdge={selectedEdge}
            setSelectedEdge={setSelectedEdge}
            onEditEdge={(edge) => {
              setEditingEdge(edge);
              setInitialEdge(null);
              setShowEdgeForm(true);
            }}
            onDeleteEdge={handleDeleteEdge}
            isCurrentPositionSelected={isCurrentPositionSelected}
            currentPosition={currentPosition}
          />
        </div>
      )}
      <MapViewer
        places={placeList}
        edges={edgeList}
        discoveries={discoveryList}
        areas={areaList}

        drawingAreaPoints={drawingAreaPoints}
        setDrawingAreaPoints={setDrawingAreaPoints}
        editingAreaVertexIndex={editingAreaVertexIndex}
        setEditingAreaVertexIndex={setEditingAreaVertexIndex}

        place={place}
        setPlace={(selectedPlace) => {
          setPlace(selectedPlace);
          setSelectedEdge(null);
          setIsCurrentPositionSelected(false);
          setClickedPosition(null);
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
        gpsEnabled={gpsEnabled}
        setGpsEnabled={setGpsEnabled}
        currentPosition={currentPosition}
        setCurrentPosition={setCurrentPosition}
        isCurrentPositionSelected={isCurrentPositionSelected}
        showDiscoveryForm={showDiscoveryForm}
        setShowDiscoveryForm={setShowDiscoveryForm}
        discoveryPosition={discoveryPosition}
        setDiscoveryPosition={setDiscoveryPosition}
        selectedDiscovery={selectedDiscovery}
        setSelectedDiscovery={setSelectedDiscovery}
        onPlaceMove={handleUpdatePlace}
        onCurrentPositionClick={() => {
          setIsCurrentPositionSelected(true);
          setSelectedEdge(null);
          setClickedPosition(null);

        }}

        skipCameraMoveRequest={skipCameraMoveRequest}

        interactionMode={interactionMode}
        setInteractionMode={setInteractionMode}
        splitTargetEdge={splitTargetEdge}
        splitPreviewPosition={splitPreviewPosition}
        setSplitPreviewPosition={setSplitPreviewPosition}
        onConfirmEdgeSplit={handleConfirmEdgeSplit}
        cameraResetRequest={cameraResetRequest}
        onBackgroundClick={() => {
          setSelectedEdge(null);
          setIsCurrentPositionSelected(false);

          if (isMobile) {
            setShowMobileDetails(false);
          }
        }}
      />

      {isMobile && (
        <MobileBottomBar
          place={place}
          selectedEdge={selectedEdge}
          isCurrentPositionSelected={isCurrentPositionSelected}
          currentPosition={currentPosition}
          setShowPlaceForm={setShowPlaceForm}
          setEditingPlace={setEditingPlace}
          onDeletePlace={handleDeletePlace}
          clickedPosition={clickedPosition}
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
          isSplittingEdge={
            interactionMode === InteractionMode.EDGE_SPLIT_SELECTING ||
            interactionMode === InteractionMode.EDGE_SPLIT_PLACING ||
            interactionMode === InteractionMode.EDGE_SPLIT_CONFIRMING
          }

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

          onOpenPlaceForm={handleOpenPlaceForm}

          place={place}
          routeAnchor={routeAnchor}
          setRouteAnchor={setRouteAnchor}
          showRoute={showRoute}
          setShowRoute={setShowRoute}
          isMobile={isMobile}

          selectedEdge={selectedEdge}
          interactionMode={interactionMode}
          onStartEdgeSplit={handleStartEdgeSplit}
          onCancelEdgeSplit={handleCancelEdgeSplit}

          onStartAreaDrawing={handleStartAreaDrawing}
          onStartAreaEditing={handleStartAreaEditing}
          onOpenAreaForm={handleOpenAreaForm}
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

      {showDiscoveryForm && (
        <DiscoveryForm
          position={discoveryPosition}
          onClose={() => {
            setShowDiscoveryForm(false);
            setDiscoveryPosition(null);
            setEditingDiscovery(null);
          }}
          onSave={async (discovery) => {
            if (editingDiscovery) {
              await handleUpdateDiscovery(discovery);
              return;
            }

            setPendingDiscovery(discovery);
            setShowDiscoveryForm(false);
          }}
          editingDiscovery={editingDiscovery}
        />
      )}

      {selectedDiscovery && (
        <DiscoveryDetail
          discovery={selectedDiscovery}
          onClose={() => setSelectedDiscovery(null)}
          places={placeList}
          edges={edgeList}
          onDelete={async () => {
            const confirmed = window.confirm(
              "この発見を削除しますか？"
            );

            if (!confirmed) return;

            const { error } = await supabase
              .from("discoveries")
              .delete()
              .eq("id", selectedDiscovery.id);

            if (error) {
              console.error("発見の削除に失敗:", error);
              alert("発見を削除できませんでした");
              return;
            }

            setDiscoveryList((currentDiscoveries) =>
              currentDiscoveries.filter(
                (item) => item.id !== selectedDiscovery.id
              )
            );

            setSelectedDiscovery(null);
          }}
          onEdit={() => {
            setEditingDiscovery(selectedDiscovery);
            setSelectedDiscovery(null);
            setShowDiscoveryForm(true);
          }}
        />
      )}

      {pendingDiscovery && (
        <DiscoveryConnectionModal
          discovery={pendingDiscovery}
          places={placeList}
          edges={edgeList}
          onConfirm={async ({
            connectedPlaceId,
            connectedEdgeId,
          }) => {
            await handleSaveDiscovery(
              pendingDiscovery,
              connectedPlaceId,
              connectedEdgeId
            );
          }}
          onSkip={async () => {
            await handleSaveDiscovery(
              pendingDiscovery,
              null,
              null
            );
          }}
          onClose={() => {
            setPendingDiscovery(null);
          }}
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

      {edgeConnectionPlace && (
        <EdgeConnectionModal
          newPlace={edgeConnectionPlace}
          places={placeList}
          onConfirm={async (selectedPlaceIds) => {
            if (!edgeConnectionPlace) return;

            const newEdges = selectedPlaceIds.map((placeId) => {
              const targetPlace = placeList.find(
                (place) => place.id === placeId
              );

              if (!targetPlace) return null;

              const distance = calculateDistanceMeters(
                edgeConnectionPlace.longitude,
                edgeConnectionPlace.latitude,
                targetPlace.longitude,
                targetPlace.latitude
              );

              const walkingTime = Math.max(
                1,
                Math.round(distance / 1.2)
              );

              return {
                id: crypto.randomUUID(),
                from: edgeConnectionPlace.id,
                to: targetPlace.id,
                distance,
                walkingTime,
                movement_type: "walk",
                road_context: "pedestrian_only",
                bidirectional: true,
              };
            }).filter(Boolean);

            if (newEdges.length === 0) {
              setEdgeConnectionPlace(null);
              return;
            }

            const { data, error } = await supabase
              .from("edges")
              .insert(newEdges.map(toDatabaseEdge))
              .select();

            if (error) {
              console.error(error);
              alert("Edge登録に失敗しました");
              return;
            }

            setEdgeList((currentEdges) => [
              ...currentEdges,
              ...data.map(toAppEdge),
            ]);

            setEdgeConnectionPlace(null);
          }}
          onSkip={() => {
            setEdgeConnectionPlace(null);
          }}
        />
      )}

      {showAreaForm && (
        <AreaForm
          onSave={handleSaveArea}
          onClose={() => setShowAreaForm(false)}
        />
      )}

      {import.meta.env.DEV && (
        <DeveloperTools />
      )}

    </div>
  );
}

export default App;