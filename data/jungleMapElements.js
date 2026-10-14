// Procedural jungle element generation for the OG rebuilt frontend
// Adapted from UPDATED client — supports buildings as large entities

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Entity sizing — buildings get large reservations so trees don't overlap them
export const getEntitySizing = (type) => {
  if (type === 'building') return { iconSize: 7, totalSpace: 9 };
  if (type === 'community') return { iconSize: 3, totalSpace: 5 };
  return { iconSize: 1, totalSpace: 3 }; // user
};

// Generate natural elements for a given map area
export const generateMapElements = (minX, maxX, minY, maxY, allEntities) => {
  const components = [];
  const occupiedPositions = new Set();
  const bigTreePositions = new Set();

  const getEntityZone = (x, y) => {
    for (const entity of allEntities) {
      const sizing = getEntitySizing(entity.type);
      const iconSize = sizing.iconSize;
      const totalSpace = sizing.totalSpace;

      const spaceEndX = entity.gridX + totalSpace - 1;
      const spaceEndY = entity.gridY + totalSpace - 1;

      if (x < entity.gridX || x > spaceEndX || y < entity.gridY || y > spaceEndY) continue;

      const iconEndX = entity.gridX + iconSize - 1;
      const iconEndY = entity.gridY + iconSize - 1;

      if (entity.type === 'user') {
        if (x === entity.gridX && y === entity.gridY) {
          return { zone: 'user-icon', entity, sizing };
        }
        return { zone: 'user-buffer', entity, sizing };
      } else {
        const inIcon = x >= entity.gridX && x <= iconEndX && y >= entity.gridY && y <= iconEndY;
        if (inIcon) {
          const onEdge = x === entity.gridX || x === iconEndX || y === entity.gridY || y === iconEndY;
          return { zone: onEdge ? 'community-icon-border' : 'community-icon-center', entity, sizing };
        }
        return { zone: 'community-buffer', entity, sizing };
      }
    }
    return { zone: 'unoccupied' };
  };

  const checkNaturalCollision2x2 = (x, y) => {
    for (let dx = -1; dx <= 0; dx++) {
      for (let dy = -1; dy <= 0; dy++) {
        if (occupiedPositions.has(`${x + dx},${y + dy}`)) return true;
      }
    }
    return false;
  };

  const canBigTreeSpawn = (x, y) => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (bigTreePositions.has(`${x + dx},${y + dy}`)) return false;
      }
    }
    return true;
  };

  const isAdjacentToCommunityIcon = (x, y) => {
    for (let dx = -1; dx <= 0; dx++) {
      for (let dy = -1; dy <= 0; dy++) {
        for (let ax = -1; ax <= 1; ax++) {
          for (let ay = -1; ay <= 1; ay++) {
            const z = getEntityZone(x + dx + ax, y + dy + ay);
            if (z.zone === 'community-icon-center' || z.zone === 'community-icon-border') return true;
          }
        }
      }
    }
    return false;
  };

  // PASS 1: 2×2 trees on grid vertices
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const seed = x * 1000 + y;
      const rand = seededRandom(seed);

      let canSpawnBigTree = true;
      let canSpawnSmallTree = true;
      let lowestSpawnChance = 1.0;
      let blocked = false;
      let touchesCommunityIcon = false;
      let allUnoccupied = true;

      for (let dx = -1; dx <= 0 && !blocked; dx++) {
        for (let dy = -1; dy <= 0 && !blocked; dy++) {
          const zoneInfo = getEntityZone(x + dx, y + dy);

          switch (zoneInfo.zone) {
            case 'user-icon':
            case 'community-icon-center':
              blocked = true;
              break;
            case 'community-icon-border':
              touchesCommunityIcon = true;
              canSpawnBigTree = false;
              allUnoccupied = false;
              lowestSpawnChance = Math.min(lowestSpawnChance, 0.40);
              break;
            case 'community-buffer':
              canSpawnBigTree = false;
              allUnoccupied = false;
              lowestSpawnChance = Math.min(lowestSpawnChance, 0.55);
              break;
            case 'user-buffer':
              allUnoccupied = false;
              lowestSpawnChance = Math.min(lowestSpawnChance, 0.60);
              break;
            default:
              lowestSpawnChance = Math.min(lowestSpawnChance, 0.83);
              break;
          }
        }
      }

      if (blocked) continue;

      if (touchesCommunityIcon && canSpawnSmallTree) {
        for (let dx = -1; dx <= 0; dx++) {
          for (let dy = -1; dy <= 0; dy++) {
            const z = getEntityZone(x + dx, y + dy);
            if (z.zone !== 'community-icon-border') {
              canSpawnSmallTree = false;
              break;
            }
          }
          if (!canSpawnSmallTree) break;
        }
        if (!canSpawnSmallTree) continue;
      }

      if (canSpawnBigTree && isAdjacentToCommunityIcon(x, y)) {
        canSpawnBigTree = false;
      }

      if (!allUnoccupied && checkNaturalCollision2x2(x, y)) continue;

      if (rand < lowestSpawnChance) {
        const typeRand = seededRandom(seed + 777);

        if (canSpawnBigTree && typeRand < 0.43 && (allUnoccupied || canBigTreeSpawn(x, y))) {
          const variant = seededRandom(seed + 999) < 0.5 ? 1 : 2;
          components.push({ id: `big-tree-${x}-${y}`, type: 'big-tree', variant, gridX: x, gridY: y });
          bigTreePositions.add(`${x},${y}`);
          for (let dx = -1; dx <= 0; dx++) {
            for (let dy = -1; dy <= 0; dy++) {
              occupiedPositions.add(`${x + dx},${y + dy}`);
            }
          }
        } else if (canSpawnSmallTree && typeRand >= 0.43) {
          const isPalm = seededRandom(seed + 888) < 0.25;
          const variant = seededRandom(seed + 777) < 0.5 ? 1 : 2;
          components.push({
            id: `${isPalm ? 'palm' : 'small-tree'}-${x}-${y}`,
            type: isPalm ? 'palm' : 'small-tree',
            variant: isPalm ? undefined : variant,
            gridX: x,
            gridY: y
          });
          for (let dx = -1; dx <= 0; dx++) {
            for (let dy = -1; dy <= 0; dy++) {
              occupiedPositions.add(`${x + dx},${y + dy}`);
            }
          }
        }
      }
    }
  }

  // PASS 2: 1×1 ground cover
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const seed = x * 2000 + y + 5000;
      const rand = seededRandom(seed);
      const zoneInfo = getEntityZone(x, y);

      let spawnChance = 0;

      switch (zoneInfo.zone) {
        case 'user-icon':
        case 'community-icon-center':
        case 'community-icon-border':
          continue;
        case 'community-buffer':
          spawnChance = 0.35;
          break;
        case 'user-buffer':
          spawnChance = 0.45;
          break;
        default:
          spawnChance = 0.83;
          break;
      }

      if (!zoneInfo.zone || zoneInfo.zone === 'unoccupied') {
        // layer on top in wilderness
      } else if (occupiedPositions.has(`${x},${y}`)) continue;

      if (rand < spawnChance) {
        const typeRand = seededRandom(seed + 12345);
        let type;
        if (typeRand < 0.33) type = 'shrub';
        else if (typeRand < 0.66) type = 'rock';
        else type = 'flowers';

        components.push({
          id: `${type}-${x}-${y}`,
          type,
          gridX: x + 0.5,
          gridY: y + 0.5
        });
        occupiedPositions.add(`${x},${y}`);
      }
    }
  }

  return components;
};

export const getElementSize = (element, gridSize) => {
  if (element.type === 'big-tree') {
    return gridSize * 0.95 * 2;
  } else if (element.type === 'small-tree' || element.type === 'palm') {
    return gridSize * 0.62 * 2;
  } else {
    return gridSize * 1.0;
  }
};
