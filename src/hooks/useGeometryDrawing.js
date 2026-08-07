import { useEffect, useRef, useCallback } from "react";
import * as Cesium from "cesium";
import { InteractionMode } from "../constants/interactionMode";

export function useGeometryDrawing({
  viewerRef,
  viewerReady,
  interactionMode,
  drawingMethod,
  drawingGeometryPoints,
  setDrawingGeometryPoints,
  drawingGeometryState,
  setDrawingGeometryState,
  onGeometryDrawingComplete,
}) {
  console.log('[cylinder] useGeometryDrawing init', { drawingMethod, interactionMode });
  const drawingGeometryEntitiesRef = useRef([]);

  const clearDrawingGeometryEntities = useCallback(() => {
    const viewer = viewerRef.current;

    if (!viewer || viewer.isDestroyed()) {
      drawingGeometryEntitiesRef.current = [];
      return;
    }

    drawingGeometryEntitiesRef.current.forEach((entity) => {
      if (entity) {
        viewer.entities.remove(entity);
      }
    });

    drawingGeometryEntitiesRef.current = [];
  }, [viewerRef]);

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer || viewer.isDestroyed()) {
      drawingGeometryEntitiesRef.current = [];
      return;
    }

    clearDrawingGeometryEntities();

    const isDrawingMode =
      interactionMode === InteractionMode.GEOMETRY_DRAWING ||
      interactionMode === InteractionMode.GEOMETRY_EDITING ||
      interactionMode === InteractionMode.GEOMETRY_VERTEX_DRAGGING;

    if (!isDrawingMode || drawingGeometryPoints.length === 0) {
      return;
    }

    drawingGeometryPoints.forEach((point, index) => {
      const pointEntity = viewer.entities.add({
        id: `geometry-vertex-${index}`,
        position: Cesium.Cartesian3.fromDegrees(
          point.longitude,
          point.latitude,
          1
        ),
        point: {
          pixelSize: 8,
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          disableDepthTestDistance:
            Number.POSITIVE_INFINITY,
        },
      });

      drawingGeometryEntitiesRef.current.push(pointEntity);
    });

    if (drawingGeometryPoints.length >= 2) {
      const linePoints =
        (interactionMode === InteractionMode.GEOMETRY_EDITING ||
          interactionMode === InteractionMode.GEOMETRY_VERTEX_DRAGGING) &&
          drawingGeometryPoints.length >= 3
          ? [...drawingGeometryPoints, drawingGeometryPoints[0]]
          : drawingGeometryPoints;

      const linePositions = linePoints.map((point) =>
        Cesium.Cartesian3.fromDegrees(
          point.longitude,
          point.latitude,
          1
        )
      );

      const lineEntity = viewer.entities.add({
        polyline: {
          positions: linePositions,
          width: 2,
          material: Cesium.Color.YELLOW,
          clampToGround: false,
        },
      });

      drawingGeometryEntitiesRef.current.push(lineEntity);
    }

    if (drawingGeometryPoints.length >= 3) {
      const flatCoordinates = drawingGeometryPoints.flatMap((point) => [
        point.longitude,
        point.latitude,
      ]);

      const polygonEntity = viewer.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(
            flatCoordinates
          ),
          height: 0.5,
          material: Cesium.Color.YELLOW.withAlpha(0.35),
          outline: true,
          outlineColor: Cesium.Color.YELLOW,
        },
      });

      drawingGeometryEntitiesRef.current.push(polygonEntity);
    }

    return () => {
      clearDrawingGeometryEntities();
    };
  }, [
    viewerRef,
    viewerReady,
    interactionMode,
    drawingGeometryPoints,
    drawingMethod,
    drawingGeometryState,
    clearDrawingGeometryEntities,
  ]);

  // preview entity for center-radius (cylinder) mode
  const previewEntityRef = useRef(null);
  const isDraggingCenterRef = useRef(false);
  const centerCartesianRef = useRef(null);
  // store previous camera controller states so we can restore them after dragging
  const cameraControlsPrevRef = useRef(null);

  const handleLeftDown = useCallback(
    (click) => {
      console.log('[cylinder] LEFT_DOWN handler invoked', {
        drawingMethod,
        interactionMode,
        clickPosition: click?.position,
      });
      const viewer = viewerRef.current;

      if (
        !viewer ||
        viewer.isDestroyed() ||
        interactionMode !== InteractionMode.GEOMETRY_DRAWING ||
        drawingMethod !== "center-radius-height"
      ) {
        return false;
      }

      if (drawingGeometryState?.phase === "height") {
        setDrawingGeometryState((prev) => ({
          ...prev,
          phase: "complete",
        }));

        console.log("[cylinder] height complete", {
          radius: drawingGeometryState.radius,
          height: drawingGeometryState.height,
        });

        onGeometryDrawingComplete?.();

        return true;
      }

      // only start when clicking on background (avoid interfering with place/edge/object clicks)
      // caller should ensure this, but double-check here
      // click may be Cesium.ScreenSpaceEventHandler movement-like object with position
      let cartesian = viewer.scene.pickPosition(click.position);

      if (!cartesian) {
        cartesian = viewer.camera.pickEllipsoid(
          click.position,
          viewer.scene.globe.ellipsoid
        );
      }

      if (!cartesian) return false;

      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

      const centerLon = Cesium.Math.toDegrees(cartographic.longitude);
      const centerLat = Cesium.Math.toDegrees(cartographic.latitude);

      // save center and reset radius
      console.log('[cylinder] center', { longitude: centerLon, latitude: centerLat });
      setDrawingGeometryState((prev) => ({
        ...prev,
        phase: "radius",
        center: { longitude: centerLon, latitude: centerLat },
        radius: 0,
        heightStartMouseY: null,
      }));

      centerCartesianRef.current = Cesium.Cartesian3.fromDegrees(
        centerLon,
        centerLat,
        0
      );

      // immediately disable camera controls while user is dragging radius
      try {
        const controller = viewer.scene.screenSpaceCameraController;
        cameraControlsPrevRef.current = {
          enableRotate: controller.enableRotate,
          enableTranslate: controller.enableTranslate,
          enableZoom: controller.enableZoom,
          enableTilt: controller.enableTilt,
          enableLook: controller.enableLook,
        };

        controller.enableRotate = false;
        controller.enableTranslate = false;
        controller.enableTilt = false;
      } catch (e) {
        console.warn("Could not modify camera controller", e);
      }

      // create preview ellipse entity
      if (previewEntityRef.current && !viewer.isDestroyed()) {
        try {
          viewer.entities.remove(previewEntityRef.current);
        } catch (e) { }
        previewEntityRef.current = null;
      }

      previewEntityRef.current = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          centerLon,
          centerLat,
          0
        ),
        ellipse: {
          semiMajorAxis: 0,
          semiMinorAxis: 0,
          material: Cesium.Color.YELLOW.withAlpha(0.25),
          height: 0.5,
          outline: true,
          outlineColor: Cesium.Color.YELLOW,
        },
      });

      console.log('[cylinder] preview created', { previewId: previewEntityRef.current && previewEntityRef.current.id });

      isDraggingCenterRef.current = true;

      return true;
    },
    [
      viewerRef,
      interactionMode,
      drawingMethod,
      drawingGeometryState,
      setDrawingGeometryState
    ]
  );

  const handleMouseMove = useCallback(
    (movement) => {
      const viewer = viewerRef.current;

      if (
        !viewer ||
        viewer.isDestroyed() ||
        drawingMethod !== "center-radius-height"
      ) {
        return false;
      }

      // 高さフェーズ
      if (drawingGeometryState?.phase === "height") {
        const deltaY =
          drawingGeometryState.heightStartMouseY -
          movement.endPosition.y;

        const height = Math.max(0.5, deltaY * 0.2);

        setDrawingGeometryState((prev) => ({
          ...prev,
          height,
        }));

        console.log("height", height);

        console.log(
          "preview entity",
          previewEntityRef.current
        );

        if (previewEntityRef.current) {
          previewEntityRef.current.ellipse = undefined;

          const center = drawingGeometryState.center;

          previewEntityRef.current.position =
            Cesium.Cartesian3.fromDegrees(
              center.longitude,
              center.latitude,
              height / 2
            );

          previewEntityRef.current.cylinder =
            new Cesium.CylinderGraphics({
              length: height,
              topRadius: drawingGeometryState.radius,
              bottomRadius: drawingGeometryState.radius,
              material: Cesium.Color.YELLOW.withAlpha(0.35),
              outline: true,
              outlineColor: Cesium.Color.YELLOW,
            });
        }

        return true;
      }

      // 半径フェーズ
      if (
        !isDraggingCenterRef.current ||
        drawingGeometryState?.phase !== "radius"
      ) {
        return false;
      }

      // ↓ここから既存の半径計算をそのまま残す
      let cartesian = viewer.scene.pickPosition(
        movement.endPosition
      );

      if (!cartesian) {
        cartesian = viewer.camera.pickEllipsoid(
          movement.endPosition,
          viewer.scene.globe.ellipsoid
        );
      }

      if (!cartesian) return false;

      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);

      const currentCartesian = Cesium.Cartesian3.fromDegrees(lon, lat, 0);

      const centerCartesian = centerCartesianRef.current;

      if (!centerCartesian) {
        return false;
      }

      const distance = Cesium.Cartesian3.distance(centerCartesian, currentCartesian);

      // update state
      console.log('[cylinder] radius', distance);
      setDrawingGeometryState((prev) => ({
        ...prev,
        radius: distance,
      }));

      // update preview
      if (previewEntityRef.current && previewEntityRef.current.ellipse) {
        try {
          previewEntityRef.current.ellipse.semiMajorAxis = distance;
          previewEntityRef.current.ellipse.semiMinorAxis = distance;
        } catch (e) {
          // some Cesium properties are read-only wrappers — set by assigning a new object
          previewEntityRef.current.ellipse = {
            semiMajorAxis: distance,
            semiMinorAxis: distance,
            material: Cesium.Color.YELLOW.withAlpha(0.25),
            height: 0.5,
            outline: true,
            outlineColor: Cesium.Color.YELLOW,
          };
        }
      }
      return true;
    },
    [viewerRef, drawingMethod, drawingGeometryState, setDrawingGeometryState]
  );
  const handleLeftUp = useCallback(
    (click) => {
      console.log('[cylinder] LEFT_UP', { drawingMethod, isDragging: isDraggingCenterRef.current });
      const viewer = viewerRef.current;
      if (
        !viewer ||
        viewer.isDestroyed() ||
        !isDraggingCenterRef.current ||
        drawingMethod !== "center-radius-height"
      ) {
        return false;
      }

      // finalize radius and switch to height phase
      setDrawingGeometryState((prev) => ({
        ...prev,
        phase: "height",
        heightStartMouseY: click.position.y,
      }));

      // restore camera controls
      try {
        const controller = viewer.scene.screenSpaceCameraController;
        const prev = cameraControlsPrevRef.current;
        if (prev) {
          controller.enableRotate = !!prev.enableRotate;
          controller.enableTranslate = !!prev.enableTranslate;
          controller.enableTilt = !!prev.enableTilt;
          controller.enableZoom = !!prev.enableZoom;
          controller.enableLook = !!prev.enableLook;
        } else {
          // fallback: enable defaults
          controller.enableRotate = true;
          controller.enableTranslate = true;
          controller.enableTilt = true;
        }
      } catch (e) {
        console.warn("Could not restore camera controller", e);
      }

      isDraggingCenterRef.current = false;
      return true;
    },
    [viewerRef, drawingMethod, setDrawingGeometryState]
  );

  const handleLeftClick = useCallback(
    (click) => {

      console.log("[cylinder] handleLeftClick entered", {
        drawingMethod,
        phase: drawingGeometryState?.phase,
      });

      const viewer = viewerRef.current;

      if (
        !viewer ||
        viewer.isDestroyed() ||
        interactionMode !== InteractionMode.GEOMETRY_DRAWING
      ) {
        return false;
      }

      // 円柱：高さ確定
      if (
        drawingMethod === "center-radius-height" &&
        drawingGeometryState?.phase === "height"
      ) {

        setDrawingGeometryState((prev) => ({
          ...prev,
          phase: "complete",
        }));

        console.log("[cylinder] height complete", {
          radius: drawingGeometryState.radius,
          height: drawingGeometryState.height,
        });

        return true;
      }

      // polygon以外はここで終了
      if (drawingMethod !== "polygon") {
        return false;
      }

      // ↓ここから既存のpolygon処理をそのまま残す
      let cartesian = viewer.scene.pickPosition(click.position);

      if (!cartesian) {
        cartesian = viewer.camera.pickEllipsoid(
          click.position,
          viewer.scene.globe.ellipsoid
        );
      }

      if (!cartesian) return false;

      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

      setDrawingGeometryPoints((current) => [
        ...current,
        {
          longitude: Cesium.Math.toDegrees(
            cartographic.longitude
          ),
          latitude: Cesium.Math.toDegrees(
            cartographic.latitude
          ),
        },
      ]);
      return true;
    },
    [
      viewerRef,
      interactionMode,
      drawingMethod,
      drawingGeometryState,
      setDrawingGeometryPoints,
      setDrawingGeometryState
    ]
  );

  // ensure preview is removed when drawing state resets
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (!drawingGeometryState?.center) {
      if (previewEntityRef.current) {
        console.log('[cylinder] preview removed by cleanup');
        try {
          viewer.entities.remove(previewEntityRef.current);
        } catch (e) { }
        previewEntityRef.current = null;
      }
      centerCartesianRef.current = null;
      isDraggingCenterRef.current = false;

      // ensure camera controls are restored on cancel/reset
      try {
        const controller = viewer.scene.screenSpaceCameraController;
        const prev = cameraControlsPrevRef.current;
        if (prev) {
          controller.enableRotate = !!prev.enableRotate;
          controller.enableTranslate = !!prev.enableTranslate;
          controller.enableTilt = !!prev.enableTilt;
          controller.enableZoom = !!prev.enableZoom;
          controller.enableLook = !!prev.enableLook;
        } else {
          controller.enableRotate = true;
          controller.enableTranslate = true;
          controller.enableTilt = true;
        }
      } catch (e) {
        console.warn('Could not restore camera controller on cleanup', e);
      }
    }

    return () => { };
  }, [viewerRef, drawingGeometryState]);

  return {
    handleLeftClick,
    handleLeftDown,
    handleMouseMove,
    handleLeftUp,
    clearDrawingGeometryEntities,
  };
}
