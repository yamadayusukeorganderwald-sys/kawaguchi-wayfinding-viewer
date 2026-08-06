export function getEntityRepresentativePosition(
  selectedEntity,
  context = {}
) {
  if (!selectedEntity?.data) {
    return null;
  }

  const { type, data } = selectedEntity;
  const places = context.places ?? [];

  if (type === "place") {
    return {
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
    };
  }

  if (type === "edge") {
    const fromPlace = places.find(
      (place) => place.id === data.from
    );

    const toPlace = places.find(
      (place) => place.id === data.to
    );

    if (!fromPlace || !toPlace) {
      return null;
    }

    return {
      latitude:
        (Number(fromPlace.latitude) +
          Number(toPlace.latitude)) /
        2,

      longitude:
        (Number(fromPlace.longitude) +
          Number(toPlace.longitude)) /
        2,
    };
  }

  if (
    type === "area" ||
    type === "object"
  ) {
    const coordinates = data.coordinates;

    if (
      !Array.isArray(coordinates) ||
      coordinates.length === 0
    ) {
      return null;
    }

    const total = coordinates.reduce(
      (result, coordinate) => {
        const [longitude, latitude] =
          coordinate;

        return {
          latitude:
            result.latitude +
            Number(latitude),

          longitude:
            result.longitude +
            Number(longitude),
        };
      },
      {
        latitude: 0,
        longitude: 0,
      }
    );

    return {
      latitude:
        total.latitude /
        coordinates.length,

      longitude:
        total.longitude /
        coordinates.length,
    };
  }

  return null;
}