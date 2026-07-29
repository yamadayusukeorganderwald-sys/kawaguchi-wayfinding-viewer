import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { findShortestRoute } from "../utils/routeSearch";

function MapViewer({
    places,
    edges,
    place,
    setPlace,
    showRoute,
    routeAnchor,
    onMapClick,
    clickedPosition,
}) {
    const cesiumContainer = useRef(null);
    const viewerRef = useRef(null);
    const entitiesRef = useRef([]);
    const routeEntitiesRef = useRef([]);
    const clickedMarkerRef = useRef(null);

    useEffect(() => {
        const viewer = new Cesium.Viewer(cesiumContainer.current, {
            animation: false,
            timeline: false,
        });

        viewerRef.current = viewer;

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

        const routeEntity = viewer.entities.add({
            show: false,

            polyline: {
                positions: [],
                material: Cesium.Color.DODGERBLUE.withAlpha(0.8),
                width: 8,
                clampToGround: true,
            },
        });

        routeEntitiesRef.current.push(routeEntity);

        const resizeTimer = setTimeout(() => {
            if (!viewer.isDestroyed()) {
                viewer.resize();
            }
        }, 0);

        return () => {
            clearTimeout(resizeTimer);

            handler.destroy();
            viewer.destroy();

            viewerRef.current = null;
            entitiesRef.current = [];
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
            const isSelected = item.id === place.id;

            const entity = viewer.entities.add({
                name: item.name,

                position: Cesium.Cartesian3.fromDegrees(
                    item.longitude,
                    item.latitude
                ),

                point: {
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
                },

                label: {
                    text: item.name,
                    font: "16px sans-serif",
                    pixelOffset: new Cesium.Cartesian2(0, -35),
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 3,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                },
            });

            entity.place = item;
            entitiesRef.current.push(entity);
        });
    }, [places]);

    useEffect(() => {
        const viewer = viewerRef.current;

        if (!viewer || viewer.isDestroyed()) return;

        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                place.longitude,
                place.latitude,
                place.height
            ),
            duration: 2,
        });

        entitiesRef.current.forEach((entity) => {
            const isSelected = entity.place.id === place.id;
            const isRoute = entity.place.type === "route";

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
        });
    }, [place]);

    useEffect(() => {
        const entity = routeEntitiesRef.current[0];

        if (!entity) return;

        if (
            !showRoute ||
            !routeAnchor ||
            routeAnchor.id === place.id
        ) {
            entity.show = false;
            return;
        }

        const routeResult = findShortestRoute(
            routeAnchor.id,
            place.id,
            places,
            edges
        );

        if (!routeResult) {
            entity.show = false;
            return;
        }

        entity.polyline.positions =
            routeResult.positions.map(([lon, lat]) =>
                Cesium.Cartesian3.fromDegrees(lon, lat, 5)
            );

        entity.show = true;
    }, [
        showRoute,
        routeAnchor,
        place,
        places,
        edges,
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