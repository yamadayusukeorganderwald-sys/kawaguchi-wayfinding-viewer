import { createPortal } from "react-dom";

function NearbyDiscoveryPopover({
    discoveries,
    anchorRect,
    onClose,
    onSelectDiscovery,
    compact = false,
}) {
    if (
        !discoveries?.length ||
        !anchorRect
    ) {
        return null;
    }

    return createPortal(
        <div
            style={{
                position: "fixed",

                left: compact
                    ? "24px"
                    : `${anchorRect.right + 16}px`,

                bottom: compact
                    ? `${window.innerHeight - anchorRect.top + 14}px`
                    : "auto",

                top: compact
                    ? "auto"
                    : `${Math.max(
                        16,
                        anchorRect.top - 30
                    )}px`,

                width: compact
                    ? "calc(100vw - 48px)"
                    : "360px",

                maxHeight: compact
                    ? "42dvh"
                    : "calc(100dvh - 32px)",

                boxSizing: "border-box",
                zIndex: 10000,

                padding: compact
                    ? "12px"
                    : "14px",

                border: "4px solid #4fbd45",
                borderRadius: "18px",
                background: "#fff",
                boxShadow:
                    "0 8px 24px rgba(0, 0, 0, 0.22)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "10px",
                }}
            >
                <strong
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: compact ? "13px" : "14px",
                    }}
                >
                    <img
                        src="/icons/discovery_message_sprout_icon.svg"
                        alt=""
                        aria-hidden="true"
                        style={{
                            width: "20px",
                            height: "20px",
                        }}
                    />

                    近くの発見（{discoveries.length}）
                </strong>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="近くの発見を閉じる"
                    style={{
                        border: "none",
                        background: "transparent",
                        padding: "4px",
                        fontSize: "18px",
                        lineHeight: 1,
                        cursor: "pointer",
                    }}
                >
                    ×
                </button>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: compact ? "32dvh" : "360px",
                    overflowY: "auto",
                    overscrollBehavior: "contain",
                }}
            >
                {discoveries.map(({ discovery, distance }) => (
                    <button
                        key={discovery.id}
                        type="button"
                        onClick={() => onSelectDiscovery?.(discovery)}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            boxSizing: "border-box",
                            border: "1px solid #ddd",
                            borderRadius: "12px",
                            background: "#fff",
                            textAlign: "left",
                            cursor: "pointer",
                        }}
                    >
                        <div
                            style={{
                                fontSize: compact ? "13px" : "14px",
                                fontWeight: 700,
                                lineHeight: 1.4,
                            }}
                        >
                            {discovery.message || "内容未記入"}
                        </div>

                        <div
                            style={{
                                marginTop: "3px",
                                fontSize: "12px",
                                color: "#777",
                            }}
                        >
                            約{Math.round(distance)}m
                        </div>
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );
}

export default NearbyDiscoveryPopover;