import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

const WALK_SPEED = 5;
const EYE_HEIGHT = 1.65;
const LOOK_SENSITIVITY = 0.003;

export const useWalkMode = ({
    viewerRef,
    enabled,
    baseHeight = 0,
    isMobile = false,
}) => {
    const keysRef = useRef({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
    });

    const walkHeightRef = useRef(
        baseHeight + EYE_HEIGHT
    );

    useEffect(() => {
        const viewer = viewerRef.current;

        if (
            !viewer ||
            viewer.isDestroyed() ||
            !enabled
        ) {
            return;
        }

        const controller =
            viewer.scene.screenSpaceCameraController;

        /*
         * 歩行モード中は
         * Cesium標準のカメラ移動を止める
         */
        controller.enableRotate = false;
        controller.enableTranslate = false;
        controller.enableZoom = false;
        controller.enableTilt = false;

        const current =
            viewer.camera.positionCartographic;

        walkHeightRef.current =
            baseHeight + EYE_HEIGHT;

        const walkPosition =
            Cesium.Cartesian3.fromRadians(
                current.longitude,
                current.latitude,
                baseHeight + EYE_HEIGHT
            );

        viewer.camera.setView({
            destination: walkPosition,
            orientation: {
                heading: viewer.camera.heading,
                pitch: Cesium.Math.toRadians(-5),
                roll: 0,
            },
        });

        /*
         * Lookだけは後でマウス視線操作に使う可能性があるので
         * 一旦false
         */
        controller.enableLook = false;

        const handleKeyDown = (event) => {
            switch (event.code) {
                case "KeyW":
                case "ArrowUp":
                    keysRef.current.forward = true;
                    break;

                case "KeyS":
                case "ArrowDown":
                    keysRef.current.backward = true;
                    break;

                case "KeyA":
                case "ArrowLeft":
                    keysRef.current.left = true;
                    break;

                case "KeyD":
                case "ArrowRight":
                    keysRef.current.right = true;
                    break;

                case "KeyR":
                    keysRef.current.up = true;
                    break;

                case "KeyF":
                    keysRef.current.down = true;
                    break;

                default:
                    break;
            }
        };

        const handleKeyUp = (event) => {
            switch (event.code) {
                case "KeyW":
                case "ArrowUp":
                    keysRef.current.forward = false;
                    break;

                case "KeyS":
                case "ArrowDown":
                    keysRef.current.backward = false;
                    break;

                case "KeyA":
                case "ArrowLeft":
                    keysRef.current.left = false;
                    break;

                case "KeyD":
                case "ArrowRight":
                    keysRef.current.right = false;
                    break;

                case "KeyR":
                    keysRef.current.up = false;
                    break;

                case "KeyF":
                    keysRef.current.down = false;
                    break;

                default:
                    break;
            }
        };

        let isLooking = false;
        let lastMouseX = 0;
        let lastMouseY = 0;

        const handlePointerDown = (event) => {
            if (event.pointerType === "mouse" && event.button !== 0) {
                return;
            }

            const canvas =
                viewer.scene.canvas;

            const rect =
                canvas.getBoundingClientRect();

            const localX =
                event.clientX - rect.left;

            /*
             * スマホでは右半分だけ
             * 視点操作として使用
             */
            if (
                isMobile &&
                localX < rect.width * 0.5
            ) {
                return;
            }

            isLooking = true;

            lastMouseX = event.clientX;
            lastMouseY = event.clientY;

            canvas.setPointerCapture?.(
                event.pointerId
            );
        };

        const handlePointerMove = (event) => {
            if (!isLooking) return;

            console.log("WALK pointer move");

            const deltaX =
                event.clientX - lastMouseX;

            const deltaY =
                event.clientY - lastMouseY;

            lastMouseX = event.clientX;
            lastMouseY = event.clientY;

            const camera = viewer.camera;

            const sensitivity =
                isMobile
                    ? LOOK_SENSITIVITY * 1.4
                    : LOOK_SENSITIVITY;

            const horizontalAmount =
                Math.abs(deltaX) * sensitivity;

            const verticalAmount =
                Math.abs(deltaY) * sensitivity;

            if (deltaX > 0) {
                camera.lookRight(horizontalAmount);
            } else if (deltaX < 0) {
                camera.lookLeft(horizontalAmount);
            }

            if (deltaY > 0) {
                camera.lookDown(verticalAmount);
            } else if (deltaY < 0) {
                camera.lookUp(verticalAmount);
            }
            // ロールを毎回リセット
            camera.setView({
                destination: camera.position,
                orientation: {
                    heading: camera.heading,
                    pitch: camera.pitch,
                    roll: 0,
                },
            });
        };

        const handlePointerUp = (event) => {
            isLooking = false;

            viewer.scene.canvas.releasePointerCapture?.(
                event.pointerId
            );
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        window.addEventListener(
            "keyup",
            handleKeyUp
        );

        viewer.scene.canvas.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        viewer.scene.canvas.addEventListener(
            "pointermove",
            handlePointerMove
        );

        viewer.scene.canvas.addEventListener(
            "pointerup",
            handlePointerUp
        );

        viewer.scene.canvas.addEventListener(
            "pointercancel",
            handlePointerUp
        );

        let animationFrameId;
        let previousTime = performance.now();

        const update = (currentTime) => {
            if (
                !viewerRef.current ||
                viewerRef.current.isDestroyed()
            ) {
                return;
            }

            const deltaTime =
                (currentTime - previousTime) / 1000;

            previousTime = currentTime;

            const movementDistance =
                WALK_SPEED * deltaTime;

            const camera = viewer.camera;
            const keys = keysRef.current;

            if (keys.up) {
                walkHeightRef.current +=
                    movementDistance;
            }

            if (keys.down) {
                walkHeightRef.current -=
                    movementDistance;
            }

            if (keys.forward) {
                camera.moveForward(
                    movementDistance
                );
            }

            if (keys.backward) {
                camera.moveBackward(
                    movementDistance
                );
            }

            if (keys.left) {
                camera.moveLeft(
                    movementDistance
                );
            }

            if (keys.right) {
                camera.moveRight(
                    movementDistance
                );
            }

            /*
             * 移動後、高さだけ歩行目線に固定
             */
            if (
                keys.forward ||
                keys.backward ||
                keys.left ||
                keys.right ||
                keys.up ||
                keys.down
            ) {
                const cartographic =
                    camera.positionCartographic;

                camera.position =
                    Cesium.Cartesian3.fromRadians(
                        cartographic.longitude,
                        cartographic.latitude,
                        walkHeightRef.current
                    );
            }

            animationFrameId =
                requestAnimationFrame(update);
        };

        animationFrameId =
            requestAnimationFrame(update);

        return () => {
            cancelAnimationFrame(
                animationFrameId
            );

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

            window.removeEventListener(
                "keyup",
                handleKeyUp
            );

            viewer.scene.canvas.removeEventListener(
                "pointerdown",
                handlePointerDown
            );

            viewer.scene.canvas.removeEventListener(
                "pointermove",
                handlePointerMove
            );

            viewer.scene.canvas.removeEventListener(
                "pointerup",
                handlePointerUp
            );

            viewer.scene.canvas.removeEventListener(
                "pointercancel",
                handlePointerUp
            );

            keysRef.current = {
                forward: false,
                backward: false,
                left: false,
                right: false,
                up: false,
                down: false,
            };

            /*
             * 通常カメラ操作へ戻す
             */
            if (
                viewerRef.current &&
                !viewerRef.current.isDestroyed()
            ) {
                const nextController =
                    viewerRef.current.scene
                        .screenSpaceCameraController;

                nextController.enableRotate = true;
                nextController.enableTranslate = true;
                nextController.enableZoom = true;
                nextController.enableTilt = true;
                nextController.enableLook = true;
            }
        };
    }, [
        viewerRef,
        enabled,
        baseHeight,
        isMobile,
    ]);
};