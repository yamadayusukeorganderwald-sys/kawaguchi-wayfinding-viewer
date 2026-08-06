import {
    useEffect,
    useRef,
    useState,
} from "react";
import NearbyDiscoveryPopover from "./NearbyDiscoveryPopover";

import {
    FiEdit2,
    FiTrash2,
} from "react-icons/fi";
import { buildEntityViewModel } from "../utils/buildEntityViewModel";

const DetailRow = ({
    label,
    value,
    multiline = false,
    compact = false,
}) => {
    const textValue =
        value === null ||
            value === undefined ||
            value === ""
            ? "未設定"
            : String(value);

    const shouldUseMultiline =
        multiline &&
        textValue.length > 30;

    if (shouldUseMultiline) {
        return (
            <div
                style={{
                    padding: compact ? "5px 0" : "7px 0",
                }}
            >
                <div
                    style={{
                        marginBottom: "3px",
                        fontSize: compact ? "12px" : "12px",
                        fontWeight: 700,
                        color: "#666",
                    }}
                >
                    {label}
                </div>

                <div
                    style={{
                        fontSize: compact ? "13px" : "12px",
                        lineHeight: 1.6,
                        overflowWrap: "anywhere",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {textValue}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: compact
                    ? "78px minmax(0, 1fr)"
                    : "90px minmax(0, 1fr)",
                columnGap: "8px",
                alignItems: "start",
                padding: compact ? "4px 0" : "5px 0",
                fontSize: compact ? "13px" : "12px",
                lineHeight: 1.4,
            }}
        >
            <strong
                style={{
                    fontWeight: 700,
                    color: "#666",
                }}
            >
                {label}
            </strong>

            <span
                style={{
                    minWidth: 0,
                    overflowWrap: "anywhere",
                    color: "#222",
                }}
            >
                {textValue}
            </span>
        </div>
    );
};

function EntityPanel({
    selectedEntity,
    onEditEntity,
    onDeleteEntity,
    onSelectDiscovery,
    compact = false,
    showActions = true,
    context = {},
}) {
    const viewModel = buildEntityViewModel(
        selectedEntity,
        context
    );

    if (!viewModel) {
        return null;
    }

    const [showDiscoveries, setShowDiscoveries] =
        useState(false);

    const discoveryButtonRef = useRef(null);

    const [discoveryAnchorRect, setDiscoveryAnchorRect] =
        useState(null);

    const nearbyDiscoveries =
        viewModel?.nearbyDiscoveries ?? [];

    const hasNearbyDiscoveries =
        nearbyDiscoveries.length > 0;

    useEffect(() => {
        setShowDiscoveries(false);
    }, [
        selectedEntity?.type,
        selectedEntity?.data?.id,
    ]);

    const actionButtonStyle = {
        border: "none",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: compact ? "4px 0" : "6px 0",
        fontSize: compact ? "13px" : "14px",
        cursor: "pointer",
    };

    return (
        <div>
            <h2
                style={{
                    fontSize: compact ? "18px" : "20px",
                    margin: "0 0 6px",
                }}
            >
                {viewModel.title}
            </h2>

            <div
                style={{
                    fontSize: "11px",
                    color: "#666",
                    marginBottom: "12px",
                }}
            >
                {viewModel.typeLabel}
            </div>

            {viewModel.imageUrl && (
                <img
                    src={viewModel.imageUrl}
                    alt={viewModel.title}
                    style={{
                        display: "block",
                        width: "100%",
                        maxHeight: compact ? "160px" : "180px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "12px",
                    }}
                />
            )}

            {showActions && (
                <div
                    style={{
                        position: "relative",
                        marginBottom: "16px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() =>
                                onEditEntity(selectedEntity)
                            }
                            style={actionButtonStyle}
                        >
                            <FiEdit2 size={14} />
                            編集
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onDeleteEntity(selectedEntity)
                            }
                            style={{
                                ...actionButtonStyle,
                                color: "#c62828",
                            }}
                        >
                            <FiTrash2 size={14} />
                            削除
                        </button>

                        {hasNearbyDiscoveries && (
                            <button
                                ref={discoveryButtonRef}
                                type="button"
                                onClick={() => {
                                    const nextOpen = !showDiscoveries;

                                    if (
                                        nextOpen &&
                                        discoveryButtonRef.current
                                    ) {
                                        setDiscoveryAnchorRect(
                                            discoveryButtonRef.current.getBoundingClientRect()
                                        );
                                    }

                                    setShowDiscoveries(nextOpen);
                                }}
                                style={{
                                    ...actionButtonStyle,
                                    padding: "5px 10px",
                                    borderRadius: "8px",
                                    background: "#4fbd45",
                                    color: "#fff",
                                    fontWeight: 700,
                                }}
                            >
                                <img
                                    src="/icons/discovery_message_sprout_icon.svg"
                                    alt=""
                                    aria-hidden="true"
                                    style={{
                                        width: "17px",
                                        height: "17px",
                                    }}
                                />

                                発見({nearbyDiscoveries.length})
                            </button>
                        )}
                    </div>

                    {showDiscoveries && (
                        <NearbyDiscoveryPopover
                            discoveries={nearbyDiscoveries}
                            anchorRect={discoveryAnchorRect}
                            onClose={() =>
                                setShowDiscoveries(false)
                            }
                            onSelectDiscovery={(discovery) => {
                                setShowDiscoveries(false);
                                setDiscoveryAnchorRect(null);
                                onSelectDiscovery?.(discovery);
                            }}
                            compact={compact}
                        />
                    )}
                </div>
            )}

            <div>
                {viewModel.fields.map((field, index) => (
                    <DetailRow
                        key={`${field.label}-${index}`}
                        label={field.label}
                        value={field.value}
                        multiline={field.multiline}
                        compact={compact}
                    />
                ))}
            </div>
        </div>
    );
}

export default EntityPanel;