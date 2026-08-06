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
import GeometryForm from "./components/GeometryForm";

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

  const [selectedEntity, setSelectedEntity] = useState(null);

  const [initialEdge, setInitialEdge] = useState(null);

  const [discoveryList, setDiscoveryList] = useState([]);
  const [pendingDiscovery, setPendingDiscovery] = useState(null);

  const [areaList, setAreaList] = useState([]);
  const [objectList, setObjectList] = useState([]);
  const [spaceList, setSpaceList] = useState([]);

  const [drawingGeometryPoints, setDrawingGeometryPoints] = useState([]);
  const [showGeometryForm, setShowGeometryForm] = useState(false);
  const [editingGeometry, setEditingGeometry] = useState(null);
  const [editingGeometryVertexIndex, setEditingGeometryVertexIndex] = useState(null);

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

        // Objects
        try {
          const { data: objects, error: objectsError } =
            await supabase
              .from("objects")
              .select("*");

          if (objectsError) {
            throw objectsError;
          }

          console.log("objects", objects);
          setObjectList(objects ?? []);
        } catch (objectError) {
          console.error(
            "objectsの取得に失敗:",
            objectError
          );

          setObjectList([]);
        }

        // Spaces
        try {
          const { data: spaces, error: spacesError } =
            await supabase
              .from("spaces")
              .select("*");

          if (spacesError) {
            throw spacesError;
          }

          console.log("spaces", spaces);
          setSpaceList(spaces ?? []);
        } catch (spaceError) {
          console.error(
            "spacesの取得に失敗:",
            spaceError
          );

          setSpaceList([]);
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

  const handlePlaceSelect = (selectedPlace) => {
    if (!selectedPlace) return;

    setPlace(selectedPlace);

    setSelectedEntity({
      type: "place",
      data: selectedPlace,
    });

    setSelectedEdge(null);
    setIsCurrentPositionSelected(false);
    setClickedPosition(null);
  };

  const handleEdgeClick = (edge) => {
    setSelectedEdge(edge);

    setSelectedEntity({
      type: "edge",
      data: edge,
    });

    setIsCurrentPositionSelected(false);
    setClickedPosition(null);
  };

  const handleObjectClick = (object) => {
    setSelectedEntity({
      type: "object",
      data: object,
    });
    setShowMobileDetails(true);
    setSelectedEdge(null);
    setIsCurrentPositionSelected(false);
    setClickedPosition(null);
  };

  const handleAreaClick = (area) => {
    setSelectedEntity({
      type: "area",
      data: area,
    });

    setSelectedEdge(null);
    setIsCurrentPositionSelected(false);
    setClickedPosition(null);

    if (isMobile) {
      setShowMobileDetails(true);
    }
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

      observation: updatedPlace.observation,
      problem: updatedPlace.problem,
      proposal: updatedPlace.proposal,

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

    setSelectedEntity({
      type: "place",
      data,
    });

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

  const handleStartGeometryDrawing = () => {
    setDrawingGeometryPoints([]);
    setInteractionMode(
      InteractionMode.GEOMETRY_DRAWING
    );
  };

  const handleStartGeometryEditing = () => {
    if (drawingGeometryPoints.length < 3) {
      alert("形状は3点以上で作成してください");
      return;
    }

    setInteractionMode(
      InteractionMode.GEOMETRY_EDITING
    );
  };

  const handleOpenGeometryForm = () => {
    if (drawingGeometryPoints.length < 3) {
      alert("形状は3点以上で作成してください");
      return;
    }

    setShowGeometryForm(true);
  };

  const resetGeometryEditing = () => {
    setShowGeometryForm(false);
    setEditingGeometry(null);
    setDrawingGeometryPoints([]);
    setEditingGeometryVertexIndex(null);
    setInteractionMode(InteractionMode.IDLE);
  };

  const createArea = async (geometry, options = {}) => {
    const coordinates =
      options.coordinates ??
      drawingGeometryPoints.map((point) => [
        point.longitude,
        point.latitude,
      ]);

    const {
      id: _id,
      geometryKind,
      geometryType,
      ...commonData
    } = geometry;

    const { data, error } = await supabase
      .from("areas")
      .insert({
        ...commonData,
        area_type: geometryType,
        coordinates,

        space_id:
          options.spaceId ?? null,

        visibility_mode:
          options.visibilityMode ??
          "always",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      flatCoordinates:
        data.coordinates.flat(),
    };
  };

  const createObject = async (
    geometry,
    options = {}
  ) => {
    const coordinates =
      options.coordinates ??
      drawingGeometryPoints.map((point) => [
        point.longitude,
        point.latitude,
      ]);

    const {
      id: _id,
      geometryKind,
      geometryType,
      extruded_height,
      ...commonData
    } = geometry;

    const { data, error } = await supabase
      .from("objects")
      .insert({
        ...commonData,
        object_type: geometryType,
        coordinates,
        height: extruded_height,

        space_id:
          options.spaceId ?? null,

        is_space_shell:
          options.isSpaceShell ?? false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  const shrinkCoordinates = (
    coordinates,
    scale = 0.96
  ) => {
    const center = coordinates.reduce(
      (result, [longitude, latitude]) => ({
        longitude:
          result.longitude + longitude,
        latitude:
          result.latitude + latitude,
      }),
      {
        longitude: 0,
        latitude: 0,
      }
    );

    center.longitude /= coordinates.length;
    center.latitude /= coordinates.length;

    return coordinates.map(
      ([longitude, latitude]) => [
        center.longitude +
        (longitude - center.longitude) * scale,

        center.latitude +
        (latitude - center.latitude) * scale,
      ]
    );
  };

  const createSpace = async (geometry) => {
    const {
      id: _id,
      geometryKind,
      geometryType,
      name,
      description,
    } = geometry;

    const { data, error } = await supabase
      .from("spaces")
      .insert({
        name,
        space_type: geometryType,
        description,
        parent_space_id: null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  const handleSaveGeometry = async (geometry) => {
    if (
      editingGeometry &&
      geometry.geometryKind === "object"
    ) {
      return handleUpdateObject(geometry);
    }

    if (
      editingGeometry &&
      geometry.geometryKind === "area"
    ) {
      return handleUpdateArea(geometry);
    }

    if (geometry.geometryKind === "area") {
      return handleSaveArea(geometry);
    }

    if (geometry.geometryKind === "object") {
      return handleSaveObject(geometry);
    }

    if (geometry.geometryKind === "space") {
      return handleSaveSpace(geometry);
    }

    console.error(
      "不明な形状種別です:",
      geometry.geometryKind
    );

    alert("保存種類を判定できませんでした");
  };

  const handleSaveArea = async (
    geometry
  ) => {
    try {
      const area =
        await createArea(geometry);

      setAreaList((current) => [
        ...current,
        area,
      ]);

      resetGeometryEditing();

      console.log(
        "Area保存完了",
        area
      );
    } catch (error) {
      console.error(
        "Area保存失敗:",
        error
      );

      alert(
        `Areaを保存できませんでした\n${error.message}`
      );
    }
  };

  const handleSaveObject = async (
    geometry
  ) => {
    try {
      const object =
        await createObject(geometry);

      setObjectList((current) => [
        ...current,
        object,
      ]);

      resetGeometryEditing();

      console.log(
        "Object保存完了",
        object
      );
    } catch (error) {
      console.error(
        "Object保存失敗:",
        error
      );

      alert(
        `Objectを保存できませんでした\n${error.message}`
      );
    }
  };

  const handleUpdateArea = async (geometry) => {
    const {
      id,
      geometryKind,
      geometryType,
      flatCoordinates,
      ...commonData
    } = geometry;

    const updateData = {
      ...commonData,
      area_type: geometryType,
    };

    const { data, error } = await supabase
      .from("areas")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(
        "Area更新失敗:",
        error
      );

      alert(
        `Areaを更新できませんでした\n${error.message}`
      );

      return;
    }

    const savedArea = {
      ...data,
      flatCoordinates:
        data.coordinates?.flat() ?? [],
    };

    setAreaList((current) =>
      current.map((area) =>
        area.id === savedArea.id
          ? savedArea
          : area
      )
    );

    setSelectedEntity({
      type: "area",
      data: savedArea,
    });

    resetGeometryEditing();

    console.log(
      "Area更新完了",
      savedArea
    );
  };

  const handleUpdateObject = async (geometry) => {
    const {
      id,
      geometryKind,
      geometryType,
      extruded_height,
      ...commonData
    } = geometry;

    const { data, error } = await supabase
      .from("objects")
      .update({
        ...commonData,
        object_type: geometryType,
        height: extruded_height,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(
        "Object更新失敗:",
        error
      );

      alert(
        `Objectを更新できませんでした\n${error.message}`
      );

      return;
    }

    setObjectList((current) =>
      current.map((object) =>
        object.id === data.id
          ? data
          : object
      )
    );

    setSelectedEntity({
      type: "object",
      data,
    });

    setEditingGeometry(null);
    resetGeometryEditing();

    console.log(
      "Object更新完了",
      data
    );
  };

  const handleDeleteArea = async (targetArea) => {
    const confirmed = window.confirm(
      `「${targetArea.name}」を削除しますか？`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("areas")
      .delete()
      .eq("id", targetArea.id);

    if (error) {
      console.error(
        "Area削除失敗:",
        error
      );

      alert(
        `Areaを削除できませんでした\n${error.message}`
      );

      return;
    }

    setAreaList((current) =>
      current.filter(
        (area) => area.id !== targetArea.id
      )
    );

    if (
      selectedEntity?.type === "area" &&
      selectedEntity.data.id === targetArea.id
    ) {
      setSelectedEntity(null);
    }

    if (editingGeometry?.id === targetArea.id) {
      resetGeometryEditing();
    }

    console.log(
      "Area削除完了",
      targetArea
    );
  };

  const handleDeleteObject = async (targetObject) => {
    const confirmed = window.confirm(
      `「${targetObject.name}」を削除しますか？`
    );

    if (!confirmed) return;

    const isSpaceShell =
      targetObject.is_space_shell &&
      targetObject.space_id;

    try {
      if (isSpaceShell) {
        // Space外殻ObjectならSpaceごと削除
        const { error: spaceError } = await supabase
          .from("spaces")
          .delete()
          .eq("id", targetObject.space_id);

        if (spaceError) {
          throw spaceError;
        }

        setSpaceList((current) =>
          current.filter(
            (space) => space.id !== targetObject.space_id
          )
        );

        setObjectList((current) =>
          current.filter(
            (object) =>
              object.space_id !== targetObject.space_id
          )
        );

        setAreaList((current) =>
          current.filter(
            (area) =>
              area.space_id !== targetObject.space_id
          )
        );
      } else {
        // 単独ObjectならObjectだけ削除
        const { error: objectError } = await supabase
          .from("objects")
          .delete()
          .eq("id", targetObject.id);

        if (objectError) {
          throw objectError;
        }

        setObjectList((current) =>
          current.filter(
            (object) => object.id !== targetObject.id
          )
        );
      }

      setSelectedEntity(null);
      setEditingGeometry(null);

      console.log("Object削除完了", targetObject);
    } catch (error) {
      console.error("Object削除失敗:", error);

      alert(
        `Objectを削除できませんでした\n${error.message}`
      );
    }
  };

  const handleEditEntity = (entity) => {
    if (!entity) return;

    if (entity.type === "place") {
      setEditingPlace(entity.data);
      setShowPlaceForm(true);
      return;
    }

    if (
      entity.type === "object" ||
      entity.type === "area"
    ) {
      setEditingGeometry(entity.data);
      setShowGeometryForm(true);
      return;
    }

    console.warn(
      "編集未対応のEntityです:",
      entity.type
    );
  };

  const handleDeleteEntity = (entity) => {
    if (!entity) return;

    if (entity.type === "place") {
      handleDeletePlace(entity.data);
      return;
    }

    if (entity.type === "object") {
      handleDeleteObject(entity.data);
      return;
    }

    if (entity.type === "area") {
      handleDeleteArea(entity.data);
      return;
    }

    console.warn(
      "削除未対応のEntityです:",
      entity.type
    );
  };

  const handleSaveSpace = async (geometry) => {
    let createdSpace = null;
    let createdObject = null;
    let createdArea = null;

    try {
      const outerCoordinates =
        drawingGeometryPoints.map((point) => [
          point.longitude,
          point.latitude,
        ]);

      const innerCoordinates =
        shrinkCoordinates(
          outerCoordinates,
          0.96
        );

      // ① Space本体を作る
      createdSpace =
        await createSpace(geometry);

      // ② 外殻Objectを作る
      createdObject =
        await createObject(
          geometry,
          {
            spaceId: createdSpace.id,
            isSpaceShell: true,
            coordinates:
              outerCoordinates,
          }
        );

      // ③ 内部Areaを作る
      createdArea =
        await createArea(
          {
            ...geometry,
            geometryType: "passage",
            name: `${geometry.name} 内部`,
            extruded_height: 0,
          },
          {
            spaceId: createdSpace.id,
            visibilityMode:
              "parent_selected",
            coordinates:
              innerCoordinates,
          }
        );

      setSpaceList((current) => [
        ...current,
        createdSpace,
      ]);

      setObjectList((current) => [
        ...current,
        createdObject,
      ]);

      setAreaList((current) => [
        ...current,
        createdArea,
      ]);

      resetGeometryEditing();

      console.log(
        "Space保存完了",
        {
          space: createdSpace,
          object: createdObject,
          area: createdArea,
        }
      );
    } catch (error) {
      console.error(
        "Space保存失敗:",
        error
      );

      // 途中まで作成された場合の掃除
      if (createdArea?.id) {
        await supabase
          .from("areas")
          .delete()
          .eq("id", createdArea.id);
      }

      if (createdObject?.id) {
        await supabase
          .from("objects")
          .delete()
          .eq("id", createdObject.id);
      }

      if (createdSpace?.id) {
        await supabase
          .from("spaces")
          .delete()
          .eq("id", createdSpace.id);
      }

      alert(
        `Spaceを保存できませんでした\n${error.message}`
      );
    }
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

            onEditEntity={handleEditEntity}
            onDeleteEntity={handleDeleteEntity}
            onSelectPlace={handlePlaceSelect}

            selectedEdge={selectedEdge}
            selectedEntity={selectedEntity}
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
        objects={objectList}

        drawingGeometryPoints={drawingGeometryPoints}
        setDrawingGeometryPoints={setDrawingGeometryPoints}
        editingGeometryVertexIndex={editingGeometryVertexIndex}
        setEditingGeometryVertexIndex={setEditingGeometryVertexIndex}

        place={place}
        setPlace={handlePlaceSelect}
        showRoute={showRoute}
        setShowRoute={setShowRoute}
        routeAnchor={routeAnchor}
        setRouteAnchor={setRouteAnchor}
        onMapClick={setClickedPosition}
        clickedPosition={clickedPosition}
        onEdgeClick={handleEdgeClick}
        onAreaClick={handleAreaClick}
        onObjectClick={handleObjectClick}
        selectedEdge={selectedEdge}
        selectedEntity={selectedEntity}
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
          setSelectedEntity(null);
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
          selectedEntity={selectedEntity}

          isCurrentPositionSelected={isCurrentPositionSelected}
          currentPosition={currentPosition}

          onEditEntity={handleEditEntity}
          onDeleteEntity={handleDeleteEntity}

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

          interactionMode={interactionMode}

          hasRouteAnchor={Boolean(routeAnchor)}
          showRoute={showRoute}

          onAdd={handleMobileAdd}

          onStartGeometryDrawing={handleStartGeometryDrawing}
          onStartGeometryEditing={handleStartGeometryEditing}
          onOpenGeometryForm={handleOpenGeometryForm}

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

          onStartGeometryDrawing={handleStartGeometryDrawing}
          onStartGeometryEditing={handleStartGeometryEditing}
          onOpenGeometryForm={handleOpenGeometryForm}
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

      {showGeometryForm && (
        <GeometryForm
          editingGeometry={editingGeometry}
          onSave={handleSaveGeometry}
          onClose={() =>
            setShowGeometryForm(false)
          }
        />
      )}

      {import.meta.env.DEV && (
        <DeveloperTools />
      )}

    </div>
  );
}

export default App;