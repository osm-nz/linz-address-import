import { uniq } from '../../../common';
import { ExtraLayers, GeoJsonFeature } from '../../../types';

export function mergeMaritimeLights({
  features,
  ...layer
}: ExtraLayers[string]): ExtraLayers[string] {
  const tempFeatures: Record<string, GeoJsonFeature[]> = {};
  for (const f of features) {
    const [lng, lat] = f.geometry.coordinates as [number, number];

    // round to nearest 0.05seconds of latitude/longitude in case the points are slightly off
    // same logic as in stackLinzData.ts
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    tempFeatures[key] ||= [];
    tempFeatures[key].push(f);
  }

  const flatNewFeatures: Record<string, GeoJsonFeature> = {};
  for (const coordKey in tempFeatures) {
    const lights = tempFeatures[coordKey];
    if (lights.length === 1) {
      // easy. only one light at this location
      const oldTags = lights[0].properties;
      if (oldTags['seamark:light:sector_start']) {
        // this is a sectored light with only one sector.
        // we still need to change all seamark:light:* to seamark:light:1:*
        const newTags: typeof oldTags = {};
        for (const k in oldTags) {
          if (k.startsWith('seamark:light:')) {
            const keySuffix = k.split(':')[2];
            newTags[`seamark:light:1:${keySuffix}`] = oldTags[k];
          } else {
            newTags[k] = oldTags[k];
          }
        }
        flatNewFeatures[coordKey] = {
          ...lights[0],
          properties: newTags,
        };
      } else {
        // simple, unsectored light
        flatNewFeatures[coordKey] = lights[0];
      }
    } else {
      // more complex. There are multiple lights here.
      const newTags: Record<string, string> = {};
      for (let index = 0; index < lights.length; index += 1) {
        const lx = lights[index];
        for (const key in lx.properties) {
          const value = lx.properties[key];
          if (!value) continue;

          if (key.startsWith('seamark:light:')) {
            // 1️⃣ seamark:light:XX=* tags get merged in a special way
            // they end up as seamark:light:1:XX=* and seamark:light:2:XX=*
            const keySuffix = key.split(':')[2];
            newTags[`seamark:light:${index + 1}:${keySuffix}`] = value;
          } else if (key in newTags && newTags[key] !== value) {
            // 2️⃣ conflicting values for a non seamark:light tag - so merge normally with a semi
            const newValue = [...newTags[key].split(';'), value]
              .filter(uniq)
              .join(';');
            newTags[key] = newValue;
          } else {
            // 3️⃣ values do not conflict or value not in survivor yet
            newTags[key] = value;
          }
        }
      }
      flatNewFeatures[coordKey] = {
        ...lights[0], // take `geometry` and `type` from the first one
        id: lights.map((x) => x.id).join(';'),
        properties: newTags,
      };
    }
  }

  return { ...layer, features: Object.values(flatNewFeatures) };
}
