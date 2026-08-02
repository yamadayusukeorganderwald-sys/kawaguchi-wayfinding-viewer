import { useState } from "react";
import { supabase } from "../lib/supabase";

const PLACE_TYPE_OPTIONS = [
    { value: "station", label: "駅" },
    { value: "shop", label: "店舗" },
    { value: "entrance", label: "入口" },
    { value: "landmark", label: "ランドマーク" },
    { value: "plaza", label: "広場" },
    { value: "crossing", label: "横断地点" },
];

function PlaceForm({
    onAddPlace,
    onUpdatePlace,
    onClose,
    initialPosition,
    editingPlace,
}) {

    const [name, setName] = useState(
        editingPlace?.name ?? ""
    );

    const [type, setType] = useState(
        editingPlace?.type ?? "observation"
    );

    const [placeTypes, setPlaceTypes] = useState(
        editingPlace?.place_type ?? []
    );

    const [level, setLevel] = useState(
        editingPlace?.level ?? 0
    );

    const [longitude, setLongitude] = useState(
        editingPlace
            ? String(editingPlace.longitude)
            : initialPosition
                ? String(initialPosition.longitude.toFixed(6))
                : ""
    );

    const [latitude, setLatitude] = useState(
        editingPlace
            ? String(editingPlace.latitude)
            : initialPosition
                ? String(initialPosition.latitude.toFixed(6))
                : ""
    );

    const [observation, setObservation] = useState(
        editingPlace?.observation ?? ""
    );

    const [problem, setProblem] = useState(
        editingPlace?.problem ?? ""
    );

    const [proposal, setProposal] = useState(
        editingPlace?.proposal ?? ""
    );

    const [imageFile, setImageFile] = useState(null);

    const [createEdges, setCreateEdges] = useState(false);

    const inputStyle = {
        width: "100%",
        padding: "10px",
        marginBottom: "10px",
        boxSizing: "border-box",
        fontSize: "16px",
    };

    const handlePlaceTypeChange = (value) => {
        setPlaceTypes((currentTypes) => {
            if (currentTypes.includes(value)) {
                return currentTypes.filter((type) => type !== value);
            }

            return [...currentTypes, value];
        });
    };



    const handleSubmit = async (event) => {
        event.preventDefault();

        const longitudeNumber = Number(longitude);
        const latitudeNumber = Number(latitude);

        if (
            !name.trim() ||
            Number.isNaN(longitudeNumber) ||
            Number.isNaN(latitudeNumber)
        ) {
            return;
        }

        let imageUrl = editingPlace?.image ?? "";

        if (imageFile) {
            const extension = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

            const { error: uploadError } = await supabase.storage
                .from("place-images")
                .upload(fileName, imageFile);

            if (uploadError) {
                console.error("画像アップロード失敗:", uploadError);
                alert("画像をアップロードできませんでした");
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from("place-images")
                .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;
        }

        const submittedPlace = {
            id: editingPlace
                ? editingPlace.id
                : `place-${Date.now()}`,

            name: name.trim(),
            type,
            place_type: placeTypes,
            level,
            longitude: longitudeNumber,
            latitude: latitudeNumber,
            height: editingPlace?.height ?? 500,
            image: imageUrl,
            observation: observation.trim(),
            problem: problem.trim(),
            proposal: proposal.trim(),

            createEdges,
        };

        if (editingPlace) {
            await onUpdatePlace(submittedPlace);
        } else {
            await onAddPlace(submittedPlace);
        }

        onClose();
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.35)",
            }}
        >
            <form
                onSubmit={handleSubmit}
                onClick={(event) => event.stopPropagation()}
                style={{
                    width: "min(360px, calc(100vw - 24px))",
                    boxSizing: "border-box",
                    padding: "24px",
                    borderRadius: "12px",
                    maxHeight: "80vh",
                    overflowY: "auto",
                    background: "#fff",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "18px",
                        }}
                    >
                        {editingPlace ? "地点編集" : "地点追加"}
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <button
                            type="submit"
                            style={{
                                padding: "6px 12px",
                                border: "none",
                                borderRadius: "6px",
                                background: "#2196f3",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            {editingPlace ? "保存" : "追加"}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                border: "none",
                                background: "transparent",
                                fontSize: "22px",
                                cursor: "pointer",
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="地点名"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    style={inputStyle}
                />

                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "10px",
                        cursor: "pointer",
                        fontSize: "14px",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={createEdges}
                        onChange={(event) =>
                            setCreateEdges(event.target.checked)
                        }
                    />

                    地点登録と同時にエッジも登録する
                </label>

                <select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    style={inputStyle}
                >
                    <option value="observation">観察地点</option>
                    <option value="route">目的地点</option>
                    <option value="junction">ルート設定用ポイント</option>
                </select>

                <div
                    style={{
                        marginBottom: "12px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            marginBottom: "6px",
                        }}
                    >
                        場所の属性
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "6px",
                        }}
                    >
                        {PLACE_TYPE_OPTIONS.map((option) => (
                            <label
                                key={option.value}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={placeTypes.includes(option.value)}
                                    onChange={() =>
                                        handlePlaceTypeChange(option.value)
                                    }
                                />

                                {option.label}
                            </label>
                        ))}
                    </div>
                </div>

                <select
                    value={level}
                    onChange={(event) => setLevel(Number(event.target.value))}
                    style={inputStyle}
                >
                    <option value={-1}>高さ_-1（地下）</option>
                    <option value={0}>高さ_1（地上）</option>
                    <option value={1}>高さ_2</option>
                    <option value={2}>高さ_3</option>
                    <option value={3}>高さ_4</option>
                </select>

                <input
                    type="number"
                    step="any"
                    placeholder="経度"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    style={inputStyle}
                />

                <input
                    type="number"
                    step="any"
                    placeholder="緯度"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    style={inputStyle}
                />

                <textarea
                    placeholder="観察"
                    value={observation}
                    onChange={(event) => setObservation(event.target.value)}
                    rows={3}
                    style={{
                        ...inputStyle,
                        resize: "vertical",
                    }}
                />

                <textarea
                    placeholder="課題"
                    value={problem}
                    onChange={(event) => setProblem(event.target.value)}
                    rows={3}
                    style={{
                        ...inputStyle,
                        resize: "vertical",
                    }}
                />

                <textarea
                    placeholder="改善案"
                    value={proposal}
                    onChange={(event) => setProposal(event.target.value)}
                    rows={3}
                    style={{
                        ...inputStyle,
                        marginBottom: "16px",
                        resize: "vertical",
                    }}
                />

                <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                        setImageFile(event.target.files[0] ?? null)
                    }
                    style={{
                        width: "100%",
                        marginBottom: "16px",
                        fontSize: "16px",
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                    }}
                >
                </div>
            </form>
        </div>
    );
}

export default PlaceForm;