import { useEffect, useRef, useState } from "react";
import { compressImage } from "../utils/imageCompression";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function DiscoveryForm({
    position,
    editingDiscovery,
    onSave,
    onClose,
}) {
    const [message, setMessage] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!editingDiscovery) return;

        setMessage(editingDiscovery.message);

        if (editingDiscovery.image_url) {
            setImagePreviewUrl(editingDiscovery.image_url);
        }
    }, [editingDiscovery]);

    const fileInputRef = useRef(null);

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("画像ファイルを選択してください");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            alert("画像は10MB以下にしてください");
            event.target.value = "";
            return;
        }

        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }

        setImageFile(file);
        setImagePreviewUrl(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }

        setImageFile(null);
        setImagePreviewUrl("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isSaving) return;

        const trimmedMessage = message.trim();

        if (!trimmedMessage) {
            alert("発見したことを書いてください");
            return;
        }

        const targetPosition = position ?? editingDiscovery;

        if (!targetPosition) {
            alert("発見地点を取得できていません");
            return;
        }

        setIsSaving(true);

        try {
            const compressedImage = imageFile
                ? await compressImage(imageFile)
                : null;

            if (imageFile && compressedImage) {
                console.log(
                    "発見画像圧縮:",
                    `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
                    "→",
                    `${(compressedImage.size / 1024).toFixed(0)} KB`
                );
            }

            await onSave({
                id: editingDiscovery?.id,
                latitude: targetPosition.latitude,
                longitude: targetPosition.longitude,
                height: targetPosition.height ?? 0,
                message: trimmedMessage,
                imageFile: compressedImage,
                image_url: editingDiscovery?.image_url ?? null,
                connected_place_id:
                    editingDiscovery?.connected_place_id ?? null,
                connected_edge_id:
                    editingDiscovery?.connected_edge_id ?? null,
            });
        } catch (error) {
            console.error("発見の保存に失敗:", error);
            alert("発見を保存できませんでした");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.35)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                zIndex: 10000,
            }}
            onClick={() => {
                if (!isSaving) {
                    onClose();
                }
            }}
        >
            <form
                onSubmit={handleSubmit}
                onClick={(event) => event.stopPropagation()}
                style={{
                    boxSizing: "border-box",
                    width: "100%",
                    maxWidth: "520px",
                    maxHeight: "90dvh",
                    overflowY: "auto",
                    padding: "20px",
                    paddingBottom:
                        "calc(20px + env(safe-area-inset-bottom))",
                    background: "#ffffff",
                    borderRadius: "20px 20px 0 0",
                    boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: "13px",
                                color: "#4CAF50",
                                fontWeight: "bold",
                            }}
                        >
                            🌱 発見
                        </div>

                        <h2
                            style={{
                                margin: "4px 0 0",
                                fontSize: "20px",
                            }}
                        >
                            何を見つけましたか？
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        aria-label="閉じる"
                        style={{
                            flexShrink: 0,
                            width: "36px",
                            height: "36px",
                            border: "none",
                            borderRadius: "50%",
                            background: "#f2f2f2",
                            fontSize: "20px",
                            cursor: isSaving
                                ? "default"
                                : "pointer",
                            opacity: isSaving ? 0.5 : 1,
                        }}
                    >
                        ×
                    </button>
                </div>

                <textarea
                    value={message}
                    onChange={(event) =>
                        setMessage(event.target.value)
                    }
                    placeholder="ここから夕日がきれい"
                    rows={4}
                    disabled={isSaving}
                    style={{
                        boxSizing: "border-box",
                        width: "100%",
                        padding: "14px",
                        border: "1px solid #cccccc",
                        borderRadius: "12px",
                        fontSize: "16px",
                        lineHeight: 1.5,
                        resize: "none",
                    }}
                />

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isSaving}
                    style={{
                        display: "none",
                    }}
                />

                {!imagePreviewUrl && (
                    <button
                        type="button"
                        onClick={() =>
                            fileInputRef.current?.click()
                        }
                        disabled={isSaving}
                        style={{
                            width: "100%",
                            minHeight: "52px",
                            marginTop: "12px",
                            padding: "0 16px",
                            border: "1px dashed #8bcf8e",
                            borderRadius: "12px",
                            background: "#f4fbf4",
                            color: "#357a38",
                            fontSize: "15px",
                            fontWeight: "bold",
                            cursor: isSaving
                                ? "default"
                                : "pointer",
                        }}
                    >
                        📷 写真を追加
                    </button>
                )}

                {imagePreviewUrl && (
                    <div
                        style={{
                            position: "relative",
                            marginTop: "12px",
                            overflow: "hidden",
                            borderRadius: "14px",
                            background: "#eeeeee",
                        }}
                    >
                        <img
                            src={imagePreviewUrl}
                            alt="選択した写真"
                            style={{
                                display: "block",
                                width: "100%",
                                maxHeight: "280px",
                                objectFit: "cover",
                            }}
                        />

                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={isSaving}
                            aria-label="写真を削除"
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                width: "36px",
                                height: "36px",
                                border: "none",
                                borderRadius: "50%",
                                background:
                                    "rgba(255,255,255,0.92)",
                                boxShadow:
                                    "0 2px 8px rgba(0,0,0,0.25)",
                                fontSize: "18px",
                                cursor: "pointer",
                            }}
                        >
                            ×
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={isSaving}
                            style={{
                                position: "absolute",
                                left: "10px",
                                bottom: "10px",
                                minHeight: "36px",
                                padding: "0 14px",
                                border: "none",
                                borderRadius: "18px",
                                background:
                                    "rgba(255,255,255,0.92)",
                                boxShadow:
                                    "0 2px 8px rgba(0,0,0,0.25)",
                                fontWeight: "bold",
                                cursor: "pointer",
                            }}
                        >
                            写真を変更
                        </button>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                        width: "100%",
                        height: "50px",
                        marginTop: "16px",
                        border: "none",
                        borderRadius: "25px",
                        background: isSaving
                            ? "#a5d6a7"
                            : "#4CAF50",
                        color: "#ffffff",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: isSaving
                            ? "default"
                            : "pointer",
                    }}
                >
                    {isSaving
                        ? editingDiscovery
                            ? "発見を更新しています..."
                            : "発見を残しています..."
                        : editingDiscovery
                            ? "発見を更新"
                            : "この発見を残す"}
                </button>
            </form>
        </div>
    );
}

export default DiscoveryForm;