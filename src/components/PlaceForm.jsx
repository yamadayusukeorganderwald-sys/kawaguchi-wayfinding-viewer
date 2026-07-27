import { useState } from "react";

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

    const [description, setDescription] = useState(
        editingPlace?.description ?? ""
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

    const handleSubmit = (event) => {
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

        const submittedPlace = {
            id: editingPlace
                ? editingPlace.id
                : `place-${Date.now()}`,

            name: name.trim(),
            type,
            longitude: longitudeNumber,
            latitude: latitudeNumber,
            height: editingPlace?.height ?? 500,
            description: description.trim(),
            image: editingPlace?.image ?? "",
            observation: observation.trim(),
            problem: problem.trim(),
            proposal: proposal.trim(),
        };

        if (editingPlace) {
            onUpdatePlace(submittedPlace);
        } else {
            onAddPlace(submittedPlace);
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
                    width: "360px",
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

                <input
                    type="text"
                    placeholder="地点名"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px",
                        boxSizing: "border-box",
                    }}
                />

                <select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px",
                        boxSizing: "border-box",
                    }}
                >
                    <option value="observation">観察地点</option>
                    <option value="route">ルート地点</option>
                </select>

                <input
                    type="number"
                    step="any"
                    placeholder="経度"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px",
                        boxSizing: "border-box",
                    }}
                />

                <input
                    type="number"
                    step="any"
                    placeholder="緯度"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "16px",
                        boxSizing: "border-box",
                    }}
                />

                <textarea
                    placeholder="説明"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={2}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px",
                        boxSizing: "border-box",
                        resize: "vertical",
                    }}
                />

                <textarea
                    placeholder="観察"
                    value={observation}
                    onChange={(event) => setObservation(event.target.value)}
                    rows={3}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px",
                        boxSizing: "border-box",
                        resize: "vertical",
                    }}
                />

                <textarea
                    placeholder="課題"
                    value={problem}
                    onChange={(event) => setProblem(event.target.value)}
                    rows={3}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px",
                        boxSizing: "border-box",
                        resize: "vertical",
                    }}
                />

                <textarea
                    placeholder="改善案"
                    value={proposal}
                    onChange={(event) => setProposal(event.target.value)}
                    rows={3}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "16px",
                        boxSizing: "border-box",
                        resize: "vertical",
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: "9px 16px",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            background: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        キャンセル
                    </button>

                    <button
                        type="submit"
                        style={{
                            padding: "9px 16px",
                            border: "none",
                            borderRadius: "6px",
                            background: "#2196f3",
                            color: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        {editingPlace ? "保存" : "追加"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default PlaceForm;