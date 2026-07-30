import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { findShortestRoute } from "../utils/routeSearch";

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

function MapViewer({
    places,
    edges,
    place,
    setPlace,
    showRoute,
    setShowRoute,
    routeAnchor,
    setRouteAnchor,
    onMapClick,
    clickedPosition,
    onEdgeClick,
    selectedEdge,
}) {
    const cesiumContainer = useRef(null);
    const viewerRef = useRef(null);
    const entitiesRef = useRef([]);
    const edgeEntitiesRef = useRef([]);
    const routeEntitiesRef = useRef([]);
    const clickedMarkerRef = useRef(null);
    const currentPlaceRef = useRef(place);

    useEffect(() => {
        currentPlaceRef.current = place;
    }, [place]);

    useEffect(() => {
        const viewer = new Cesium.Viewer(cesiumContainer.current, {
            animation: false,
            timeline: false,
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

        handler.setInputAction((click) => {

            // クリックした場所にマーカーがあるか確認
            const picked = viewer.scene.pick(click.position);

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

            if (onMapClick) {
                onMapClick({
                    longitude,
                    latitude,
                    height,
                });
            }

            console.clear();

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
        };

    }, []);

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
                        width: isSelected ? 24 : 20,
                        height: isSelected ? 24 : 20,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    }
                    : undefined,
            });

            entity.place = item;
            entitiesRef.current.push(entity);
        });
    }, [places]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

        edgeEntitiesRef.current.forEach((entity) => {
            viewer.entities.remove(entity);
        });

        edgeEntitiesRef.current = [];

        edges.forEach((edge) => {

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

                    width: isSelected ? 8 : 4,
                    clampToGround: false,
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

    }, [edges, places, selectedEdge]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

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

    return (
        <div
            ref={cesiumContainer}
            style={{
                flex: 1,
                minWidth: 0,
                height: "100vh",
                position: "relative",
            }}
        />
    );
}

export default MapViewer;