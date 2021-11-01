import { Chart, getBestChart } from '..';

const charts: Chart[] = [
  {
    encChartName: "South Pacific Ocean - Tonga - Nuku'alofa Harbour",
    category: '14k-122k',
    rank: 1,
    bbox: {
      maxLat: -21.1025,
      minLat: -21.14417,
      maxLng: -175.15,
      minLng: -175.21167,
    },
  },
  {
    encChartName:
      "South Pacific Ocean - Tonga - Approaches to Nuku'alofa Harbour",
    category: '122k-190k',
    rank: 2,
    bbox: {
      maxLat: -20.92667,
      minLat: -21.19333,
      maxLng: -175.11333,
      minLng: -175.29667,
    },
  },
  {
    encChartName:
      "South Pacific Ocean - Tonga - Approaches to Tongatapu Including 'Eua",
    category: '190k-1350k',
    rank: 3,
    bbox: {
      maxLat: -20.9,
      minLat: -21.4833333,
      maxLng: -174.7666667,
      minLng: -175.7166667,
    },
  },
  {
    encChartName: 'South Pacific Ocean - Samoa Islands to Tonga including Niue',
    category: '1350k-11500k',
    rank: 4,
    bbox: {
      maxLat: -12,
      minLat: -26,
      maxLng: -168.1,
      minLng: -177.56667,
    },
  },
  {
    encChartName:
      'South Pacific Ocean - New Zealand to Fiji and Samoa Islands - West',
    category: '115mil-and-smaller',
    rank: 5,
    bbox: {
      maxLat: -7.5,
      minLat: -37.92333,
      maxLng: -167,
      minLng: -180,
    },
  },
];

describe('getBestChart', () => {
  it('identifies the most detailed chart available for a location', () => {
    expect(getBestChart(charts, -21.1202, -175.1731)?.encChartName).toBe(
      "South Pacific Ocean - Tonga - Nuku'alofa Harbour",
    );

    expect(getBestChart(charts, -21.1372, -175.1043)?.encChartName).toBe(
      "South Pacific Ocean - Tonga - Approaches to Tongatapu Including 'Eua",
    );
  });
});
