import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { findShortestRoute } from "../utils/routeSearch";
import { getClosestPointOnSegment } from "../utils/geometry";
import { InteractionMode } from "../constants/interactionMode";

const LEVEL_HEIGHTS = {
    [-1]: -5,
    [0]: 0,
    [1]: 2.5,
    [2]: 5,
    [3]: 7.5,
};

const getLevelHeight = (level) => {
    return LEVEL_HEIGHTS[Number(level)] ?? 0;
};

const getMovementColor = (movementType) => {
    switch (movementType) {
        case "stairs":
            return Cesium.Color.ORANGE;

        case "ramp":
            return Cesium.Color.LIMEGREEN;

        case "escalator":
            return Cesium.Color.YELLOW;

        case "elevator":
            return Cesium.Color.MEDIUMPURPLE;

        case "level":
        default:
            return Cesium.Color.DODGERBLUE;
    }
};

const CURRENT_LOCATION_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path
    d="M32 5 L56 55 L32 45 L8 55 Z"
    fill="#1a73e8"
    stroke="#ffffff"
    stroke-width="5"
    stroke-linejoin="round"
  />
</svg>
`;

const CURRENT_LOCATION_ICON_URL =
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        CURRENT_LOCATION_ICON
    )}`;

function MapViewer({
    places,
    edges,
    discoveries,

    place,
    setPlace,
    showRoute,

    setShowDiscoveryForm,
    setDiscoveryPosition,

    setShowRoute,
    routeAnchor,
    setRouteAnchor,
    onMapClick,
    clickedPosition,
    onEdgeClick,
    selectedEdge,
    isMobile,
    onBackgroundClick,
    cameraResetRequest,
    skipCameraMoveRequest,
    isCurrentPositionSelected,
    onCurrentPositionClick,

    interactionMode,
    setInteractionMode,
    splitTargetEdge,
    splitPreviewPosition,
    setSplitPreviewPosition,
    onConfirmEdgeSplit,
    gpsEnabled,
    setGpsEnabled,
    currentPosition,
    setCurrentPosition,
    setSelectedDiscovery,
    onPlaceMove,
}) {
    const cesiumContainer = useRef(null);
    const viewerRef = useRef(null);
    const currentPositionEntityRef = useRef(null);
    const gpsWatchIdRef = useRef(null);
    const onCurrentPositionClickRef =
        useRef(onCurrentPositionClick);
    const isCurrentPositionSelectedRef = useRef(isCurrentPositionSelected);
    const entitiesRef = useRef([]);
    const edgeEntitiesRef = useRef([]);
    const discoveryEntitiesRef = useRef([]);
    const routeEntitiesRef = useRef([]);
    const clickedMarkerRef = useRef(null);
    const currentPlaceRef = useRef(place);

    const placeLongPressTimerRef = useRef(null);
    const pressedPlaceRef = useRef(null);
    const draggingPlaceEntityRef = useRef(null);
    const draggingConnectedEdgesRef = useRef([]);

    const splitPreviewRef = useRef(null);
    const newPointPreviewRef = useRef(null);
    const newPointPositionRef = useRef(null);
    const draggingPlacePositionRef = useRef(null);
    const splitPreviewPositionRef = useRef(null);
    const interactionModeRef = useRef(interactionMode);
    const splitTargetEdgeRef = useRef(splitTargetEdge);
    const placesRef = useRef(places);
    const splitEdgePreviewRefs = useRef([]);
    const onConfirmEdgeSplitRef = useRef(onConfirmEdgeSplit);
    const onBackgroundClickRef = useRef(onBackgroundClick);
    const onMapClickRef = useRef(onMapClick);
    const previousPlaceIdRef = useRef(place?.id ?? null);
    const lastSkipCameraMoveRequestRef = useRef(skipCameraMoveRequest);
    const hasFocusedCurrentPositionRef = useRef(false);
    const previousCurrentPositionSelectedRef =
        useRef(false);

    useEffect(() => {
        interactionModeRef.current = interactionMode;
    }, [interactionMode]);

    useEffect(() => {
        splitTargetEdgeRef.current = splitTargetEdge;
    }, [splitTargetEdge]);

    useEffect(() => {
        placesRef.current = places;
    }, [places]);

    useEffect(() => {
        currentPlaceRef.current = place;
    }, [place]);

    useEffect(() => {
        onConfirmEdgeSplitRef.current = onConfirmEdgeSplit;
    }, [onConfirmEdgeSplit]);

    useEffect(() => {
        onBackgroundClickRef.current = onBackgroundClick;
    }, [onBackgroundClick]);

    useEffect(() => {
        onMapClickRef.current = onMapClick;
    }, [onMapClick]);

    useEffect(() => {
        onCurrentPositionClickRef.current =
            onCurrentPositionClick;
    }, [onCurrentPositionClick]);

    useEffect(() => {
        isCurrentPositionSelectedRef.current =
            isCurrentPositionSelected;
    }, [isCurrentPositionSelected]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

        const controller =
            viewer.scene.screenSpaceCameraController;

        const isMapInteractionLocked =
            interactionMode === InteractionMode.EDGE_SPLIT_SELECTING ||
            interactionMode === InteractionMode.EDGE_SPLIT_PLACING ||
            interactionMode === InteractionMode.PLACE_DRAGGING;

        controller.enableRotate = !isMapInteractionLocked;
        controller.enableTranslate = !isMapInteractionLocked;
        controller.enableZoom = !isMapInteractionLocked;
        controller.enableTilt = !isMapInteractionLocked;
        controller.enableLook = !isMapInteractionLocked;
    }, [interactionMode]);

    useEffect(() => {
        const viewer = new Cesium.Viewer(cesiumContainer.current, {
            animation: false,
            timeline: false,

            homeButton: false,
            baseLayerPicker: false,
            navigationHelpButton: false,
            fullscreenButton: false,
            geocoder: false,
            sceneModePicker: false,
            projectionPicker: false,

            infoBox: false,
            selectionIndicator: false,
        });

        viewerRef.current = viewer;

        const logCameraPosition = (event) => {
            if (event.key.toLowerCase() !== "p") return;

            const cameraPosition = viewer.camera.positionCartographic;

            console.log({
                longitude: Cesium.Math.toDegrees(
                    cameraPosition.longitude
                ),
                latitude: Cesium.Math.toDegrees(
                    cameraPosition.latitude
                ),
                height: cameraPosition.height,
                heading: Cesium.Math.toDegrees(
                    viewer.camera.heading
                ),
                pitch: Cesium.Math.toDegrees(
                    viewer.camera.pitch
                ),
                roll: Cesium.Math.toDegrees(
                    viewer.camera.roll
                ),
            });
        };

        window.addEventListener("keydown", logCameraPosition);

        viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(
                139.72037679953405,
                35.797475765617214,
                476.506342001156
            ),
            orientation: {
                heading: Cesium.Math.toRadians(
                    5.464909766623306
                ),
                pitch: Cesium.Math.toRadians(
                    -35.37597053029679
                ),
                roll: 0,
            },
        });

        const handler = new Cesium.ScreenSpaceEventHandler(
            viewer.scene.canvas
        );

        handler.setInputAction((movement) => {
            const picked = viewer.scene.pick(movement.position);

            if (!picked?.id?.place) {
                return;
            }

            pressedPlaceRef.current = picked.id.place;

            placeLongPressTimerRef.current = window.setTimeout(() => {
                const pressedPlace = pressedPlaceRef.current;

                if (!pressedPlace) return;

                const draggingEntity = entitiesRef.current.find(
                    (entity) => entity.place?.id === pressedPlace.id
                );

                if (!draggingEntity) return;

                draggingPlaceEntityRef.current = draggingEntity;

                draggingConnectedEdgesRef.current =
                    edgeEntitiesRef.current.filter(
                        (entity) =>
                            entity.edge &&
                            (
                                entity.edge.from === pressedPlace.id ||
                                entity.edge.to === pressedPlace.id
                            )
                    );

                draggingPlacePositionRef.current = {
                    longitude: pressedPlace.longitude,
                    latitude: pressedPlace.latitude,
                    level: pressedPlace.level,
                };

                setPlace(pressedPlace);
                setInteractionMode(InteractionMode.PLACE_DRAGGING);

                console.log("地点ドラッグ開始");
            }, 500);
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        handler.setInputAction(() => {
            if (placeLongPressTimerRef.current !== null) {
                clearTimeout(placeLongPressTimerRef.current);
                placeLongPressTimerRef.current = null;
            }

            if (
                interactionModeRef.current ===
                InteractionMode.PLACE_DRAGGING
            ) {
                const draggedPlace = pressedPlaceRef.current;
                const draggedPosition = draggingPlacePositionRef.current;

                if (draggedPlace && draggedPosition && onPlaceMove) {
                    onPlaceMove({
                        ...draggedPlace,
                        longitude: draggedPosition.longitude,
                        latitude: draggedPosition.latitude,
                    });
                }

                draggingPlaceEntityRef.current = null;
                draggingPlacePositionRef.current = null;

                setInteractionMode(InteractionMode.IDLE);

                console.log("地点ドラッグ終了");
            }

            pressedPlaceRef.current = null;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        handler.setInputAction((click) => {

            // エッジ上の分割位置を確定
            if (
                interactionModeRef.current === InteractionMode.EDGE_SPLIT_SELECTING
            ) {
                const previewPosition =
                    splitPreviewPositionRef.current;

                if (!previewPosition) return;

                setSplitPreviewPosition(previewPosition);

                if (splitPreviewRef.current) {
                    viewer.entities.remove(
                        splitPreviewRef.current
                    );
                    splitPreviewRef.current = null;
                }

                setInteractionMode(InteractionMode.EDGE_SPLIT_PLACING);

                return;
            }

            // 新しい地点の位置を確定
            if (
                interactionModeRef.current === InteractionMode.EDGE_SPLIT_PLACING
            ) {
                const newPointPosition =
                    newPointPositionRef.current;

                const splitPosition =
                    splitPreviewPositionRef.current;

                const edge =
                    splitTargetEdgeRef.current;

                if (
                    !newPointPosition ||
                    !splitPosition ||
                    !edge
                ) {
                    return;
                }

                setInteractionMode(InteractionMode.EDGE_SPLIT_CONFIRMING);

                if (onConfirmEdgeSplitRef.current) {
                    onConfirmEdgeSplitRef.current({
                        edge,
                        splitPosition,
                        newPointPosition,
                    });
                }

                return;
            }

            // クリックした場所にマーカーがあるか確認
            const picked = viewer.scene.pick(click.position);

            // 現在地マーカーをクリック
            if (picked?.id?.isCurrentPosition) {
                onCurrentPositionClickRef.current?.(
                    picked.id.currentPosition
                );

                return;
            }

            // 🌱 Discoveryをクリック
            if (picked?.id?.discovery) {
                setSelectedDiscovery(picked.id.discovery);
                return;
            }

            // マーカーをクリックした場合
            if (picked && picked.id && picked.id.place) {
                setPlace(picked.id.place);
                return;
            }

            // Edgeをクリック
            if (picked && picked.id && picked.id.edge) {
                if (onEdgeClick) {
                    onEdgeClick(picked.id.edge);
                }

                return;
            }

            // 地点やEdgeではない、地図背景をクリックした場合
            if (onBackgroundClickRef.current) {
                onBackgroundClickRef.current();
            }

            // 地図上のクリック位置を3D座標として取得
            let cartesian = viewer.scene.pickPosition(click.position);

            // 取得できなかった場合の予備処理
            if (!cartesian) {
                cartesian = viewer.camera.pickEllipsoid(
                    click.position,
                    viewer.scene.globe.ellipsoid
                );
            }

            if (!cartesian) return;

            // 3D座標を緯度・経度に変換
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

            const longitude = Cesium.Math.toDegrees(cartographic.longitude);
            const latitude = Cesium.Math.toDegrees(cartographic.latitude);
            const height = cartographic.height;

            onMapClickRef.current?.({
                longitude,
                latitude,
                height,
            });

            //console.clear();

            console.log({
                longitude,
                latitude,
                height,
            });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(
            (click) => {
                const picked = viewer.scene.pick(click.position);

                if (!picked || !picked.id || !picked.id.place) {
                    return;
                }

                const startPlace = currentPlaceRef.current;
                const clickedPlace = picked.id.place;

                if (!startPlace || startPlace.id === clickedPlace.id) {
                    return;
                }

                setRouteAnchor(startPlace);
                setPlace(clickedPlace);
                setShowRoute(true);
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK,
            Cesium.KeyboardEventModifier.SHIFT
        );

        handler.setInputAction((movement) => {
            const mode = interactionModeRef.current;

            // エッジ上の分割位置を選んでいる状態
            if (mode === InteractionMode.EDGE_SPLIT_SELECTING) {
                const edge = splitTargetEdgeRef.current;

                if (!edge) return;

                const currentPlaces = placesRef.current;

                const fromPlace = currentPlaces.find(
                    (p) => p.id === edge.from
                );

                const toPlace = currentPlaces.find(
                    (p) => p.id === edge.to
                );

                if (!fromPlace || !toPlace) return;

                let cartesian =
                    viewer.scene.pickPosition(
                        movement.endPosition
                    );

                if (!cartesian) {
                    cartesian =
                        viewer.camera.pickEllipsoid(
                            movement.endPosition,
                            viewer.scene.globe.ellipsoid
                        );
                }

                if (!cartesian) return;

                const cartographic =
                    Cesium.Cartographic.fromCartesian(cartesian);

                const mouse = {
                    x: Cesium.Math.toDegrees(
                        cartographic.longitude
                    ),
                    y: Cesium.Math.toDegrees(
                        cartographic.latitude
                    ),
                };

                const closest =
                    getClosestPointOnSegment(
                        mouse,
                        {
                            x: fromPlace.longitude,
                            y: fromPlace.latitude,
                        },
                        {
                            x: toPlace.longitude,
                            y: toPlace.latitude,
                        }
                    );

                updateSplitPreview(
                    closest.x,
                    closest.y,
                    fromPlace.level
                );

                return;
            }

            // 新しい地点を自由配置している状態
            if (mode === InteractionMode.EDGE_SPLIT_PLACING) {
                let cartesian =
                    viewer.scene.pickPosition(
                        movement.endPosition
                    );

                if (!cartesian) {
                    cartesian =
                        viewer.camera.pickEllipsoid(
                            movement.endPosition,
                            viewer.scene.globe.ellipsoid
                        );
                }

                if (!cartesian) return;

                const cartographic =
                    Cesium.Cartographic.fromCartesian(cartesian);

                const fixedPosition =
                    splitPreviewPositionRef.current;

                if (!fixedPosition) return;

                updateNewPointPreview(
                    Cesium.Math.toDegrees(
                        cartographic.longitude
                    ),
                    Cesium.Math.toDegrees(
                        cartographic.latitude
                    ),
                    fixedPosition.level
                );
            }

            if (mode === InteractionMode.PLACE_DRAGGING) {
                const draggingEntity =
                    draggingPlaceEntityRef.current;

                const draggingPlace =
                    pressedPlaceRef.current;

                if (!draggingEntity || !draggingPlace) return;

                let cartesian =
                    viewer.scene.pickPosition(
                        movement.endPosition
                    );

                if (!cartesian) {
                    cartesian =
                        viewer.camera.pickEllipsoid(
                            movement.endPosition,
                            viewer.scene.globe.ellipsoid
                        );
                }

                if (!cartesian) return;

                const cartographic =
                    Cesium.Cartographic.fromCartesian(cartesian);

                const nextPosition = {
                    longitude: Cesium.Math.toDegrees(
                        cartographic.longitude
                    ),
                    latitude: Cesium.Math.toDegrees(
                        cartographic.latitude
                    ),
                    level: draggingPlace.level,
                };

                draggingPlacePositionRef.current = nextPosition;

                draggingEntity.position =
                    Cesium.Cartesian3.fromDegrees(
                        nextPosition.longitude,
                        nextPosition.latitude,
                        getLevelHeight(nextPosition.level)
                    );



                draggingConnectedEdgesRef.current.forEach((entity) => {
                    const edge = entity.edge;

                    const fromPlace = placesRef.current.find(
                        (p) => p.id === edge.from
                    );

                    const toPlace = placesRef.current.find(
                        (p) => p.id === edge.to
                    );

                    if (!fromPlace || !toPlace) return;

                    const from =
                        edge.from === draggingPlace.id
                            ? nextPosition
                            : fromPlace;

                    const to =
                        edge.to === draggingPlace.id
                            ? nextPosition
                            : toPlace;

                    entity.polyline.positions = [
                        Cesium.Cartesian3.fromDegrees(
                            from.longitude,
                            from.latitude,
                            getLevelHeight(from.level)
                        ),
                        Cesium.Cartesian3.fromDegrees(
                            to.longitude,
                            to.latitude,
                            getLevelHeight(to.level)
                        ),
                    ];
                });
                return;
            }

        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        const resizeTimer = setTimeout(() => {
            if (!viewer.isDestroyed()) {
                viewer.resize();
            }
        }, 0);

        return () => {
            clearTimeout(resizeTimer);

            window.removeEventListener(
                "keydown",
                logCameraPosition
            );

            handler.destroy();
            viewer.destroy();

            viewerRef.current = null;
            entitiesRef.current = [];
            edgeEntitiesRef.current = [];
            routeEntitiesRef.current = [];
            discoveryEntitiesRef.current = [];
        };

    }, []);

    useEffect(() => {
        if (!gpsEnabled) {
            hasFocusedCurrentPositionRef.current = false;

            if (gpsWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(gpsWatchIdRef.current);
                gpsWatchIdRef.current = null;
            }

            setCurrentPosition(null);
            return;
        }

        if (!navigator.geolocation) {
            alert("この端末ではGPSを利用できません");
            setGpsEnabled(false);
            return;
        }

        gpsWatchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                console.log(position.coords);

                const nextPosition = {
                    longitude: position.coords.longitude,
                    latitude: position.coords.latitude,
                    accuracy: position.coords.accuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp,
                };

                setCurrentPosition(nextPosition);

                if (!hasFocusedCurrentPositionRef.current) {
                    hasFocusedCurrentPositionRef.current = true;

                    onCurrentPositionClickRef.current?.(
                        nextPosition
                    );
                }
            },
            (error) => {
                console.error("GPS取得に失敗:", error);

                if (error.code === error.PERMISSION_DENIED) {
                    alert("位置情報の利用が許可されていません");
                } else {
                    alert("現在位置を取得できませんでした");
                }

                setGpsEnabled(false);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 10000,
            }
        );

        return () => {
            if (gpsWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(gpsWatchIdRef.current);
                gpsWatchIdRef.current = null;
            }
        };
    }, [gpsEnabled, setCurrentPosition, setGpsEnabled]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

        // GPS OFF、または座標がまだない場合は現在地表示を消す
        if (!gpsEnabled || !currentPosition) {
            if (currentPositionEntityRef.current) {
                viewer.entities.remove(
                    currentPositionEntityRef.current
                );

                currentPositionEntityRef.current = null;
            }

            return;
        }

        const getRectangleCoordinates = () => {
            const center = Cesium.Cartesian3.fromDegrees(
                currentPosition.longitude,
                currentPosition.latitude,
                4
            );

            const metersPerPixel = viewer.camera.getPixelSize(
                new Cesium.BoundingSphere(center, 1),
                viewer.scene.drawingBufferWidth,
                viewer.scene.drawingBufferHeight
            );

            const markerPixelSize =
                isCurrentPositionSelectedRef.current ? 60 : 40;

            const markerSizeMeters =
                metersPerPixel * markerPixelSize;

            const latitudeOffset =
                markerSizeMeters / 111320 / 2;

            const longitudeOffset =
                markerSizeMeters /
                (
                    111320 *
                    Math.cos(
                        Cesium.Math.toRadians(
                            currentPosition.latitude
                        )
                    )
                ) /
                2;

            return Cesium.Rectangle.fromDegrees(
                currentPosition.longitude - longitudeOffset,
                currentPosition.latitude - latitudeOffset,
                currentPosition.longitude + longitudeOffset,
                currentPosition.latitude + latitudeOffset
            );
        };

        // 初回だけEntityを作る
        if (!currentPositionEntityRef.current) {
            const currentLocationEntity =
                viewer.entities.add({
                    name: "現在地",

                    rectangle: {
                        coordinates: new Cesium.CallbackProperty(
                            getRectangleCoordinates,
                            false
                        ),
                        height: 4,

                        material:
                            new Cesium.ImageMaterialProperty({
                                image: "/icons/current_location_arrow.svg",
                                transparent: true,
                                color: new Cesium.Color(
                                    1.0,
                                    1.0,
                                    1.0,
                                    0.8
                                ),
                            }),
                    },
                });

            currentLocationEntity.isCurrentPosition = true;
            currentLocationEntity.currentPosition =
                currentPosition;

            currentPositionEntityRef.current =
                currentLocationEntity;

            return;
        }
        currentPositionEntityRef.current.currentPosition =
            currentPosition;

    }, [gpsEnabled, currentPosition]);

    useEffect(() => {
        const viewer = viewerRef.current;

        const becameSelected =
            !previousCurrentPositionSelectedRef.current &&
            isCurrentPositionSelected;

        previousCurrentPositionSelectedRef.current =
            isCurrentPositionSelected;

        if (!becameSelected) return;
        if (!viewer || viewer.isDestroyed()) return;
        if (!currentPosition) return;

        const targetPosition = Cesium.Cartesian3.fromDegrees(
            currentPosition.longitude,
            currentPosition.latitude,
            4
        );

        viewer.camera.cancelFlight();

        viewer.camera.flyToBoundingSphere(
            new Cesium.BoundingSphere(targetPosition, 1),
            {
                offset: new Cesium.HeadingPitchRange(
                    Cesium.Math.toRadians(315),
                    Cesium.Math.toRadians(-45),
                    220
                ),
                duration: 1.2,
            }
        );
    }, [
        isCurrentPositionSelected,
        currentPosition,
    ]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

        // 以前の地点マーカーをすべて削除
        entitiesRef.current.forEach((entity) => {
            viewer.entities.remove(entity);
        });

        entitiesRef.current = [];

        // 最新のplacesからマーカーを作り直す
        places.forEach((item) => {
            const isRoute = item.type === "route";
            const isJunction = item.type === "junction";
            const isSelected = item.id === place.id;
            const isStart = routeAnchor?.id === item.id;

            const entity = viewer.entities.add({
                name: item.name,

                position: Cesium.Cartesian3.fromDegrees(
                    item.longitude,
                    item.latitude,
                    getLevelHeight(item.level)
                ),

                point: isJunction
                    ? undefined
                    : {
                        pixelSize: isSelected
                            ? isRoute
                                ? 15
                                : 11
                            : isRoute
                                ? 12
                                : 8,

                        color: isSelected
                            ? Cesium.Color.LIME
                            : isRoute
                                ? Cesium.Color.RED
                                : Cesium.Color.GRAY,

                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 1,
                        disableDepthTestDistance:
                            Number.POSITIVE_INFINITY,
                    },

                label: isJunction
                    ? undefined
                    : {
                        text: item.name,
                        font: "16px sans-serif",
                        pixelOffset: new Cesium.Cartesian2(0, -35),
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 3,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    },

                billboard: isJunction
                    ? {
                        image: "/icons/junction.svg",
                        width: isSelected ? 20 : 13,
                        height: isSelected ? 20 : 13,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    }
                    : undefined,
            });

            entity.place = item;
            entitiesRef.current.push(entity);

            if (isStart) {
                const startMarker = viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(
                        item.longitude,
                        item.latitude,
                        getLevelHeight(item.level)
                    ),

                    billboard: {
                        image: "/icons/start_focus_frame.svg",
                        width: 48,
                        height: 48,

                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,

                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    },
                });

                entitiesRef.current.push(startMarker);
            }
        });
    }, [places, routeAnchor]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

        discoveryEntitiesRef.current.forEach((entity) => {
            viewer.entities.remove(entity);
        });

        discoveryEntitiesRef.current = [];

        discoveries.forEach((item) => {
            if (
                typeof item.longitude !== "number" ||
                typeof item.latitude !== "number"
            ) {
                console.warn(
                    "座標が不正なDiscoveryをスキップ:",
                    item
                );
                return;
            }

            const entity = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(
                    item.longitude,
                    item.latitude,
                    typeof item.height === "number"
                        ? item.height
                        : 0
                ),

                billboard: {
                    image: "/icons/discovery_message_sprout_icon.svg",
                    width: 36,
                    height: 36,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,

                    disableDepthTestDistance: Number.POSITIVE_INFINITY,

                    // ←追加
                    distanceDisplayCondition:
                        new Cesium.DistanceDisplayCondition(
                            0,
                            350
                        ),
                },
            });

            entity.discovery = item;
            discoveryEntitiesRef.current.push(entity);
        });

    }, [discoveries]);

    const isPlacingSplit =
        interactionMode === InteractionMode.EDGE_SPLIT_PLACING;

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

        edgeEntitiesRef.current.forEach((entity) => {
            viewer.entities.remove(entity);
        });

        edgeEntitiesRef.current = [];

        edges.forEach((edge) => {

            const isSplitTarget =
                isPlacingSplit &&
                splitTargetEdge?.id === edge.id;

            if (isSplitTarget) return;

            const fromPlace = places.find(
                (place) => place.id === edge.from
            );

            const toPlace = places.find(
                (place) => place.id === edge.to
            );

            if (!fromPlace || !toPlace) return;

            const isSelected = selectedEdge?.id === edge.id;

            const entity = viewer.entities.add({
                polyline: {
                    positions: [
                        Cesium.Cartesian3.fromDegrees(
                            fromPlace.longitude,
                            fromPlace.latitude,
                            getLevelHeight(fromPlace.level)
                        ),
                        Cesium.Cartesian3.fromDegrees(
                            toPlace.longitude,
                            toPlace.latitude,
                            getLevelHeight(toPlace.level)
                        ),
                    ],

                    material: isSelected
                        ? Cesium.Color.CYAN.withAlpha(1)
                        : Cesium.Color.WHITE.withAlpha(0.75),

                    width: isSelected ? 6 : 3,
                    clampToGround: false
                },
            });

            entity.edge = edge;
            edgeEntitiesRef.current.push(entity);

            const hitEntity = viewer.entities.add({
                polyline: {
                    positions: [
                        Cesium.Cartesian3.fromDegrees(
                            fromPlace.longitude,
                            fromPlace.latitude,
                            getLevelHeight(fromPlace.level)
                        ),
                        Cesium.Cartesian3.fromDegrees(
                            toPlace.longitude,
                            toPlace.latitude,
                            getLevelHeight(toPlace.level)
                        ),
                    ],

                    material: Cesium.Color.WHITE.withAlpha(0.01),
                    width: 18,
                    clampToGround: false,
                },
            });

            hitEntity.edge = edge;
            edgeEntitiesRef.current.push(hitEntity);
        });

    }, [
        edges,
        places,
        selectedEdge,
        isPlacingSplit,
        splitTargetEdge,
    ]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;
        if (!place) return;

        const shouldSkipCameraMove =
            lastSkipCameraMoveRequestRef.current !==
            skipCameraMoveRequest;

        if (shouldSkipCameraMove) {
            lastSkipCameraMoveRequestRef.current =
                skipCameraMoveRequest;

            previousPlaceIdRef.current = place.id;
            return;
        }

        // 同じ地点ではカメラを動かさない
        if (previousPlaceIdRef.current === place.id) {
            return;
        }

        previousPlaceIdRef.current = place.id;

        const targetPosition = Cesium.Cartesian3.fromDegrees(
            place.longitude,
            place.latitude,
            getLevelHeight(place.level)
        );

        viewer.camera.flyToBoundingSphere(
            new Cesium.BoundingSphere(targetPosition, 1),
            {
                offset: new Cesium.HeadingPitchRange(
                    viewer.camera.heading,
                    viewer.camera.pitch,
                    220
                ),
                duration: 1.2,
            }
        );


        entitiesRef.current.forEach((entity) => {
            // 起点リングなど、placeを持たないEntityは除外
            if (!entity.place) return;

            const isSelected = entity.place.id === place.id;
            const isRoute = entity.place.type === "route";
            const isJunction = entity.place.type === "junction";

            if (isJunction) {
                if (entity.billboard) {
                    entity.billboard.width = isSelected ? 24 : 20;
                    entity.billboard.height = isSelected ? 24 : 20;
                }

                return;
            }

            if (entity.point) {
                entity.point.pixelSize = isSelected
                    ? isRoute
                        ? 15
                        : 11
                    : isRoute
                        ? 12
                        : 8;

                entity.point.color = isSelected
                    ? Cesium.Color.LIME
                    : isRoute
                        ? Cesium.Color.RED
                        : Cesium.Color.GRAY;
            }
        });
    }, [place]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

        // 前回表示したルート線をすべて削除
        routeEntitiesRef.current.forEach((entity) => {
            viewer.entities.remove(entity);
        });

        routeEntitiesRef.current = [];

        if (
            !showRoute ||
            !routeAnchor ||
            !place ||
            routeAnchor.id === place.id
        ) {
            return;
        }

        const routeResult = findShortestRoute(
            routeAnchor.id,
            place.id,
            places,
            edges
        );

        if (!routeResult) {
            return;
        }

        routeResult.edges.forEach((routeEdge, index) => {

            const isSelectedEdge =
                selectedEdge?.id === routeEdge.id;

            if (isSelectedEdge) return;

            const fromPlace = places.find(
                (item) => item.id === routeResult.path[index]
            );

            const toPlace = places.find(
                (item) => item.id === routeResult.path[index + 1]
            );

            if (!fromPlace || !toPlace) return;

            const routeEntity = viewer.entities.add({
                polyline: {
                    positions: [
                        Cesium.Cartesian3.fromDegrees(
                            fromPlace.longitude,
                            fromPlace.latitude,
                            getLevelHeight(fromPlace.level)
                        ),
                        Cesium.Cartesian3.fromDegrees(
                            toPlace.longitude,
                            toPlace.latitude,
                            getLevelHeight(toPlace.level)
                        ),
                    ],

                    material: getMovementColor(
                        routeEdge.movement_type
                    ).withAlpha(0.9),

                    width: 9,
                    clampToGround: false,
                },
            });
            routeEntitiesRef.current.push(routeEntity);
        });
    }, [
        showRoute,
        routeAnchor,
        place,
        places,
        edges,
        selectedEdge,
    ]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;
        if (!clickedPosition) return;

        // 前のクリック演出が残っていたら削除
        if (clickedMarkerRef.current) {
            viewer.entities.remove(clickedMarkerRef.current);
            clickedMarkerRef.current = null;
        }

        const startTime = performance.now();
        const duration = 900;

        const clickEffect = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
                clickedPosition.longitude,
                clickedPosition.latitude,
                clickedPosition.height + 2
            ),

            label: {
                text: "＋",
                font: "bold 30px sans-serif",
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
        });

        clickedMarkerRef.current = clickEffect;

        let animationFrameId;

        const animate = (currentTime) => {
            if (
                !viewerRef.current ||
                viewerRef.current.isDestroyed() ||
                !clickEffect.label
            ) {
                return;
            }

            const progress = Math.min(
                (currentTime - startTime) / duration,
                1
            );

            // 少し大きくなる
            clickEffect.label.scale = 0.7 + progress * 0.8;

            // 徐々に透明になる
            const alpha = 1 - progress;

            clickEffect.label.fillColor =
                Cesium.Color.YELLOW.withAlpha(alpha);

            clickEffect.label.outlineColor =
                Cesium.Color.BLACK.withAlpha(alpha);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                viewer.entities.remove(clickEffect);

                if (clickedMarkerRef.current === clickEffect) {
                    clickedMarkerRef.current = null;
                }
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);

            if (
                clickedMarkerRef.current &&
                viewerRef.current &&
                !viewerRef.current.isDestroyed()
            ) {
                viewerRef.current.entities.remove(
                    clickedMarkerRef.current
                );

                clickedMarkerRef.current = null;
            }
        };
    }, [clickedPosition]);

    const updateSplitPreview = (longitude, latitude, level = 0) => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

        const previewPosition = {
            longitude,
            latitude,
            level,
        };

        // マウスが示している最新の位置を保存
        splitPreviewPositionRef.current = previewPosition;

        if (splitPreviewRef.current) {
            viewer.entities.remove(splitPreviewRef.current);
        }

        splitPreviewRef.current = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
                longitude,
                latitude,
                getLevelHeight(level)
            ),

            point: {
                pixelSize: 14,
                color: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                disableDepthTestDistance:
                    Number.POSITIVE_INFINITY,
            },
        });
    };

    const updateNewPointPreview = (
        longitude,
        latitude,
        level = 0
    ) => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

        const newPointPosition = {
            longitude,
            latitude,
            level,
        };

        newPointPositionRef.current = newPointPosition;

        if (newPointPreviewRef.current) {
            viewer.entities.remove(
                newPointPreviewRef.current
            );
        }

        newPointPreviewRef.current = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
                longitude,
                latitude,
                getLevelHeight(level)
            ),

            point: {
                pixelSize: 12,
                color: Cesium.Color.LIME,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                disableDepthTestDistance:
                    Number.POSITIVE_INFINITY,
            },
        });

        splitEdgePreviewRefs.current.forEach((entity) => {
            viewer.entities.remove(entity);
        });

        splitEdgePreviewRefs.current = [];

        const edge = splitTargetEdgeRef.current;
        const currentPlaces = placesRef.current;

        if (!edge) return;

        const fromPlace = currentPlaces.find(
            (p) => p.id === edge.from
        );

        const toPlace = currentPlaces.find(
            (p) => p.id === edge.to
        );

        if (!fromPlace || !toPlace) return;

        const newPointCartesian =
            Cesium.Cartesian3.fromDegrees(
                longitude,
                latitude,
                getLevelHeight(level)
            );

        const fromPreviewEdge = viewer.entities.add({
            polyline: {
                positions: [
                    Cesium.Cartesian3.fromDegrees(
                        fromPlace.longitude,
                        fromPlace.latitude,
                        getLevelHeight(fromPlace.level)
                    ),
                    newPointCartesian,
                ],
                material: Cesium.Color.LIME.withAlpha(0.9),
                width: 6,
                clampToGround: false,
            },
        });

        const toPreviewEdge = viewer.entities.add({
            polyline: {
                positions: [
                    newPointCartesian,
                    Cesium.Cartesian3.fromDegrees(
                        toPlace.longitude,
                        toPlace.latitude,
                        getLevelHeight(toPlace.level)
                    ),
                ],
                material: Cesium.Color.LIME.withAlpha(0.9),
                width: 6,
                clampToGround: false,
            },
        });

        splitEdgePreviewRefs.current = [
            fromPreviewEdge,
            toPreviewEdge,
        ];

    };

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;
        if (interactionMode !== InteractionMode.IDLE) return;

        if (splitPreviewRef.current) {
            viewer.entities.remove(
                splitPreviewRef.current
            );
            splitPreviewRef.current = null;
        }

        if (newPointPreviewRef.current) {
            viewer.entities.remove(
                newPointPreviewRef.current
            );
            newPointPreviewRef.current = null;
        }

        splitEdgePreviewRefs.current.forEach((entity) => {
            viewer.entities.remove(entity);
        });

        splitEdgePreviewRefs.current = [];
        splitPreviewPositionRef.current = null;
        newPointPositionRef.current = null;
    }, [interactionMode]);

    const focusSelectedPlace = () => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed() || !place) {
            return;
        }

        const targetPosition = Cesium.Cartesian3.fromDegrees(
            place.longitude,
            place.latitude,
            getLevelHeight(place.level)
        );

        viewer.camera.flyToBoundingSphere(
            new Cesium.BoundingSphere(targetPosition, 1),
            {
                offset: new Cesium.HeadingPitchRange(
                    Cesium.Math.toRadians(315), // 左上（北西）
                    Cesium.Math.toRadians(-45), // 45°見下ろし
                    220
                ),
                duration: 1.2,
            }
        );
    };

    useEffect(() => {
        if (cameraResetRequest === 0) return;

        focusSelectedPlace();
    }, [cameraResetRequest]);

    return (
        <div
            style={{
                flex: 1,
                minWidth: 0,
                height: "100%",
                position: "relative",
            }}
        >
            <div
                ref={cesiumContainer}
                style={{
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                }}
            />

            <button
                type="button"
                onClick={() => setGpsEnabled((current) => !current)}
                title={gpsEnabled ? "GPSをOFFにする" : "GPSをONにする"}
                style={{
                    position: "absolute",
                    top: "16px",
                    left: "16px",
                    minWidth: "104px",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "21px",
                    border: "none",
                    background: gpsEnabled
                        ? "rgba(30, 136, 229, 0.95)"
                        : "rgba(255, 255, 255, 0.95)",
                    color: gpsEnabled ? "#fff" : "#333",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    zIndex: 20,
                }}
            >
                {gpsEnabled ? "● GPS ON" : "○ GPS OFF"}
            </button>

            {interactionMode === InteractionMode.PLACE_DRAGGING && (
                <div
                    style={{
                        position: "absolute",
                        top: "66px",
                        left: "16px",
                        padding: "6px 10px",
                        borderRadius: "10px",
                        background: "rgba(0, 0, 0, 0.72)",
                        color: "#fff",
                        fontSize: "12px",
                        lineHeight: "1.3",
                        zIndex: 20,
                        pointerEvents: "none",
                    }}
                >
                    <div>📍 地点移動中</div>
                    <div
                        style={{
                            fontSize: "10px",
                            opacity: 0.75,
                        }}
                    >
                        指を離すと保存
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();

                    // GPS ONなら現在地
                    if (currentPosition) {
                        setDiscoveryPosition({
                            longitude: currentPosition.longitude,
                            latitude: currentPosition.latitude,
                            height: 2,
                        });

                        setShowDiscoveryForm(true);
                        return;
                    }

                    // GPS OFFなら、最後にタップした未登録地点
                    if (clickedPosition) {
                        setDiscoveryPosition({
                            longitude: clickedPosition.longitude,
                            latitude: clickedPosition.latitude,
                            height: clickedPosition.height ?? 0,
                        });

                        setShowDiscoveryForm(true);
                        return;
                    }

                    alert("先に地図上の発見した場所をタップしてください");
                }}
                title="発見"
                style={{
                    position: "absolute",
                    right: "16px",
                    bottom: isMobile ? "64px" : "24px",
                    width: "64px",
                    height: "64px",
                    padding: 0,
                    border: "none",
                    borderRadius: "50%",
                    background: "transparent",
                    cursor: "pointer",
                    zIndex: 9999,
                    touchAction: "manipulation",
                    pointerEvents: "auto",
                }}
            >
                <img
                    src="/icons/discovery_sprout_button.svg"
                    alt="発見"
                    draggable={false}
                    style={{
                        display: "block",
                        width: "64px",
                        height: "64px",
                        pointerEvents: "none",
                    }}
                />
            </button>

            {!isMobile && (
                <button
                    type="button"
                    onClick={focusSelectedPlace}
                    title="選択地点に戻る"
                    style={{
                        position: "absolute",
                        right: "24px",
                        bottom: "32px",
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(255,255,255,0.95)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        fontSize: "22px",
                        cursor: "pointer",
                        zIndex: 20,
                    }}
                >
                    ◎
                </button>
            )}
        </div>
    );
}

export default MapViewer;