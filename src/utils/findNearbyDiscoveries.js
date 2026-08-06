const EARTH_RADIUS = 6371000;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    EARTH_RADIUS *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

export function findNearbyDiscoveries(
  latitude,
  longitude,
  discoveries,
  maxDistance = 50
) {
  return discoveries
    .map((discovery) => {
      const distance =
        calculateDistance(
          latitude,
          longitude,
          discovery.latitude,
          discovery.longitude
        );

      return {
        discovery,
        distance,
      };
    })
    .filter(
      (item) =>
        item.distance <= maxDistance
    )
    .sort(
      (a, b) =>
        a.distance - b.distance
    )
    .slice(0, 5);
}