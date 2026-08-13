import { useRef, useState } from "react";

function WalkControls({
    moveRef,
}) {
    const padRef = useRef(null);

    const [stickPosition, setStickPosition] =
        useState({
            x: 0,
            y: 0,
        });

    const activePointerRef = useRef(null);

    const updateStick = (
        clientX,
        clientY
    ) => {
        const pad = padRef.current;

        if (!pad) return;

        const rect =
            pad.getBoundingClientRect();

        const centerX =
            rect.left + rect.width / 2;

        const centerY =
            rect.top + rect.height / 2;

        let deltaX =
            clientX - centerX;

        let deltaY =
            clientY - centerY;

        const maxRadius =
            rect.width * 0.32;

        const distance =
            Math.hypot(
                deltaX,
                deltaY
            );

        if (distance > maxRadius) {
            const scale =
                maxRadius / distance;

            deltaX *= scale;
            deltaY *= scale;
        }

        setStickPosition({
            x: deltaX,
            y: deltaY,
        });

        moveRef.current = {
            right:
                deltaX / maxRadius,

            forward:
                -deltaY / maxRadius,
        };
    };

    const handlePointerDown = (
        event
    ) => {
        event.stopPropagation();
        event.preventDefault();

        activePointerRef.current =
            event.pointerId;

        padRef.current?.setPointerCapture?.(
            event.pointerId
        );

        updateStick(
            event.clientX,
            event.clientY
        );
    };

    const handlePointerMove = (
        event
    ) => {
        if (
            activePointerRef.current !==
            event.pointerId
        ) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        updateStick(
            event.clientX,
            event.clientY
        );
    };

    const resetStick = (
        event
    ) => {
        if (
            activePointerRef.current !==
            event.pointerId
        ) {
            return;
        }

        activePointerRef.current = null;

        moveRef.current = {
            forward: 0,
            right: 0,
        };

        setStickPosition({
            x: 0,
            y: 0,
        });
    };

    return (
        <div
            ref={padRef}
            onPointerDown={
                handlePointerDown
            }
            onPointerMove={
                handlePointerMove
            }
            onPointerUp={
                resetStick
            }
            onPointerCancel={
                resetStick
            }
            style={{
                position: "absolute",

                left: "22px",
                bottom: "170px",

                width: "105px",
                height: "105px",

                borderRadius: "50%",

                background:
                    "rgba(255,255,255,0.18)",

                border:
                    "2px solid rgba(255,255,255,0.35)",

                backdropFilter:
                    "blur(4px)",

                touchAction: "none",

                zIndex: 50,
            }}
        >
            <div
                style={{
                    position: "absolute",

                    left: "50%",
                    top: "50%",

                    width: "42px",
                    height: "42px",

                    borderRadius: "50%",

                    background:
                        "rgba(255,255,255,0.8)",

                    boxShadow:
                        "0 2px 8px rgba(0,0,0,0.3)",

                    transform: `
                        translate(
                            calc(-50% + ${stickPosition.x}px),
                            calc(-50% + ${stickPosition.y}px)
                        )
                    `,

                    pointerEvents: "none",
                }}
            />
        </div>
    );
}

export default WalkControls;