function getPlaceById(id, places) {
  return places.find((place) => place.id === id);
}

function getNeighbors(placeId, edges) {
  const neighbors = [];

  edges.forEach((edge) => {
    if (edge.from === placeId) {
      neighbors.push({
        id: edge.to,
        edge,
      });
    }

    if (edge.bidirectional && edge.to === placeId) {
      neighbors.push({
        id: edge.from,
        edge,
      });
    }
  });

  return neighbors;
}

function findShortestRoute(
  fromId,
  toId,
  places,
  edges
) {
  const costs = {};
  const previous = {};
  const previousEdge = {};
  const unvisited = new Set(
    places.map((place) => place.id)
  );

  places.forEach((place) => {
    costs[place.id] = Infinity;
  });

  costs[fromId] = 0;

  while (unvisited.size > 0) {
    let currentId = null;
    let currentCost = Infinity;

    unvisited.forEach((id) => {
      if (costs[id] < currentCost) {
        currentId = id;
        currentCost = costs[id];
      }
    });

    if (
      currentId === null ||
      currentCost === Infinity
    ) {
      break;
    }

    if (currentId === toId) {
      break;
    }

    unvisited.delete(currentId);

    const neighbors = getNeighbors(
      currentId,
      edges
    );

    neighbors.forEach(
      ({ id: neighborId, edge }) => {
        if (!unvisited.has(neighborId)) return;

        const newCost =
          costs[currentId] + edge.walkingTime;

        if (newCost < costs[neighborId]) {
          costs[neighborId] = newCost;
          previous[neighborId] = currentId;
          previousEdge[neighborId] = edge;
        }
      }
    );
  }

  if (costs[toId] === Infinity) {
    return null;
  }

  const path = [];
  const routeEdges = [];
  let currentId = toId;

  while (currentId) {
    path.unshift(currentId);

    if (currentId === fromId) {
      break;
    }

    const edge = previousEdge[currentId];

    if (edge) {
      routeEdges.unshift(edge);
    }

    currentId = previous[currentId];
  }

  if (path[0] !== fromId) {
    return null;
  }

  const positions = path
    .map((id) => getPlaceById(id, places))
    .filter(Boolean)
    .map((place) => [
      place.longitude,
      place.latitude,
    ]);

  return {
    path,
    positions,
    edges: routeEdges,
    totalWalkingTime: costs[toId],
  };
}

export { findShortestRoute };