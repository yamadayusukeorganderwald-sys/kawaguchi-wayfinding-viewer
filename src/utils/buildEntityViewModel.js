const PLACE_TYPE_LABELS = {
    station: "駅",
    shop: "店舗",
    entrance: "入口",
    landmark: "ランドマーク",
    plaza: "広場",
    crossing: "横断地点",
};

const PLACE_ROLE_LABELS = {
    route: "目的地点",
    junction: "ルート設定用ポイント",
    observation: "観察地点",
};

const AREA_TYPE_LABELS = {
    plaza: "広場",
    passage: "通路",
    sidewalk: "歩道",
    park: "公園",
};

const OBJECT_TYPE_LABELS = {
    building: "建物",
    stairs: "階段",
    tree: "樹木",
    bench: "ベンチ",
};

const VISIBILITY_MODE_LABELS = {
    always: "常時表示",
    parent_selected: "親Space選択時",
};

const buildPlaceViewModel = (place) => {
    const placeTypes = Array.isArray(place.place_type)
        ? place.place_type
            .map((type) => PLACE_TYPE_LABELS[type] ?? type)
            .join("、")
        : PLACE_TYPE_LABELS[place.place_type] ??
        place.place_type ??
        "未設定";

    return {
        title: place.name || "名称未設定地点",

        typeLabel:
            PLACE_ROLE_LABELS[place.type] ??
            "地点",

        imageUrl:
            place.image_url ??
            place.image ??
            null,

        fields: [
            {
                label: "分類",
                value: placeTypes,
            },
            {
                label: "レベル",
                value:
                    place.level !== null &&
                        place.level !== undefined
                        ? String(place.level)
                        : "未設定",
            },
            {
                label: "説明",
                value: place.description || "未記入",
            },
            {
                label: "観察",
                value: place.observation || "未記入",
            },
            {
                label: "課題",
                value: place.problem || "未記入",
            },
            {
                label: "改善案",
                value: place.proposal || "未記入",
            },
        ],
    };
};

const buildObjectViewModel = (object) => {
    return {
        title: object.name || "名称未設定Object",

        typeLabel:
            OBJECT_TYPE_LABELS[object.object_type] ??
            object.object_type ??
            "Object",

        imageUrl:
            object.image_url ??
            object.image ??
            null,

        fields: [
            {
                label: "基準高さ",
                value: `${object.base_height ?? 0} m`,
            },
            {
                label: "高さ",
                value: `${object.height ?? 0} m`,
            },
            {
                label: "説明",
                value: object.description || "未記入",
                multiline: true,
            },

            ...(object.is_space_shell
                ? [
                    {
                        label: "状態",
                        value: "Space外殻",
                    },
                ]
                : []),
        ],
    };
};

const buildAreaViewModel = (area) => {
    return {
        title: area.name || "名称未設定Area",

        typeLabel:
            AREA_TYPE_LABELS[area.area_type] ??
            area.area_type ??
            "Area",

        imageUrl:
            area.image_url ??
            area.image ??
            null,

        fields: [
            {
                label: "基準高さ",
                value: `${area.base_height ?? 0} m`,
            },
            {
                label: "説明",
                value: area.description || "未記入",
                multiline: true,
            },

            ...(area.visibility_mode
                ? [
                    {
                        label: "表示条件",
                        value:
                            VISIBILITY_MODE_LABELS[
                            area.visibility_mode
                            ] ?? area.visibility_mode,
                    },
                ]
                : []),

            ...(area.space_id
                ? [
                    {
                        label: "所属",
                        value: "Space内部",
                    },
                ]
                : []),
        ],
    };
};

export const buildEntityViewModel = (
    selectedEntity,
    context = {}
) => {
    if (!selectedEntity?.data) {
        return null;
    }

    const { type, data } = selectedEntity;

    switch (type) {
        case "place":
            return buildPlaceViewModel(data);

        case "object":
            return buildObjectViewModel(data);

        case "area":
            return buildAreaViewModel(data);

        default:
            console.warn(
                "表示未対応のEntityです:",
                type,
                context
            );

            return null;
    }
};