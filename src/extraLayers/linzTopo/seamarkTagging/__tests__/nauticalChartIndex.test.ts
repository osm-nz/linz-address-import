import whichPolygon from 'which-polygon';
import { type Chart, getBestChart } from '../index.js';
import type { GeoJson } from '../../../../types.js';
import mockChartIndex from './mockChartIndex.geo.json';

const query = whichPolygon(mockChartIndex as GeoJson<Chart>);

describe('getBestChart', () => {
  it('identifies the most detailed chart available for a location', () => {
    expect(getBestChart(query, -21.1202, -175.1731)?.encChartName).toBe(
      "South Pacific Ocean - Tonga - Nuku'alofa Harbour",
    );

    expect(getBestChart(query, -21.1372, -175.1043)?.encChartName).toBe(
      "South Pacific Ocean - Tonga - Approaches to Tongatapu Including 'Eua",
    );
  });
});
