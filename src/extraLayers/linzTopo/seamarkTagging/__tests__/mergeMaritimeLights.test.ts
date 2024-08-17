import type { GeoJsonFeature } from '../../../../types.js';
import { mergeMaritimeLights } from '../mergeMaritimeLights.js';

describe('mergeMaritimeLights', () => {
  it('can merge lights', () => {
    // example from https://wiki.osm.org/Seamarks/Sectored_and_Directional_Lights
    const lights: GeoJsonFeature[] = [
      {
        id: '1',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-36.1234, 174.1234] },
        properties: {
          name: 'MAC 500',
          'ref:linz:hydrographic_id': '4001',
          source: 'LINZ;Approaches to Waitangi Chart',
          height: '38',
          'seamark:type': 'light_major',
          'seamark:light:character': 'Fl',
          'seamark:light:colour': 'green',
          'seamark:light:group': '2',
          'seamark:light:period': '10',
          'seamark:light:sector_end': '260',
          'seamark:light:sector_start': '230',
        },
      },
      {
        id: '2',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-36.1234, 174.1234] },
        properties: {
          name: 'MAC 500',
          'ref:linz:hydrographic_id': '4002',
          source: 'LINZ;Approaches to Waitangi Chart',
          height: '38',
          'seamark:type': 'light_major',
          'seamark:light:character': 'Fl',
          'seamark:light:colour': 'white',
          'seamark:light:group': '2',
          'seamark:light:period': '10',
          'seamark:light:sector_end': '280',
          'seamark:light:sector_start': '260',
        },
      },
      {
        id: '3',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-36.1234, 174.123411] },
        properties: {
          name: 'MAC 500',
          'ref:linz:hydrographic_id': '4003',
          source: 'Insert X',
          height: '38',
          'seamark:type': 'light_major',
          'seamark:light:character': 'Fl',
          'seamark:light:colour': 'red',
          'seamark:light:group': '2',
          'seamark:light:period': '10',
          'seamark:light:sector_end': '310',
          'seamark:light:sector_start': '280',
        },
      },
    ];

    expect(
      mergeMaritimeLights({ size: 'large', features: lights }).features,
    ).toStrictEqual([
      {
        id: '1;2;3',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-36.1234, 174.1234] },
        properties: {
          'seamark:light:1:character': 'Fl',
          'seamark:light:1:colour': 'green',
          'seamark:light:1:group': '2',
          'seamark:light:1:period': '10',
          'seamark:light:1:sector_end': '260',
          'seamark:light:1:sector_start': '230',

          'seamark:light:2:character': 'Fl',
          'seamark:light:2:colour': 'white',
          'seamark:light:2:group': '2',
          'seamark:light:2:period': '10',
          'seamark:light:2:sector_end': '280',
          'seamark:light:2:sector_start': '260',

          'seamark:light:3:character': 'Fl',
          'seamark:light:3:colour': 'red',
          'seamark:light:3:group': '2',
          'seamark:light:3:period': '10',
          'seamark:light:3:sector_end': '310',
          'seamark:light:3:sector_start': '280',

          // other tags are merged normally
          'seamark:type': 'light_major',
          height: '38',
          name: 'MAC 500',
          'ref:linz:hydrographic_id': '4001;4002;4003',
          source: 'LINZ;Approaches to Waitangi Chart;Insert X',
        },
      },
    ]);
  });

  it('updates tags for single sectored lights', () => {
    const lights: GeoJsonFeature[] = [
      {
        id: '1',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-36, 174] },
        properties: {
          name: '12/28',
          'seamark:light:colour': 'pink',
          'seamark:light:sector_end': '260',
          'seamark:light:sector_start': '230',
        },
      },
      {
        id: '2',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-37, 175] },
        properties: {
          name: '23/50',
          'seamark:light:visibility': 'bright af',
        },
      },
    ];

    expect(
      mergeMaritimeLights({ size: 'large', features: lights }).features,
    ).toStrictEqual([
      {
        id: '1', // NO.1 is sectored because it has sector tags
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-36, 174] },
        properties: {
          name: '12/28',
          'seamark:light:1:colour': 'pink',
          'seamark:light:1:sector_end': '260',
          'seamark:light:1:sector_start': '230',
        },
      },
      {
        id: '2', // NO.2 is not sectored since it is a normal light
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-37, 175] },
        properties: {
          name: '23/50',
          'seamark:light:visibility': 'bright af',
        },
      },
    ]);
  });
});
