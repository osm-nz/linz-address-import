import type { Geometry } from 'geojson';
import taginfo from '../../../taginfo.json';

const BASE_URL = 'https://batch.openaddresses.io';
const HEADERS = {
  'User-Agent': taginfo.project.project_url,
};

export namespace OpenAddresses {
  interface Outputs {
    cache: boolean;
    output: boolean;
    pmtiles: boolean;
    preview: boolean;
    validated: boolean;
  }

  export interface Layer {
    id: number;
    fabric: boolean;
    source: string;
    updated: number;
    layer: string;
    name: string;
    job: number;
    output: Outputs;
    size: number;
    map: number;
  }

  export interface Job {
    id: number;
    run: number;
    map: null;
    created: number;
    source: string;
    source_name: string;
    layer: string;
    name: string;
    output: Outputs;
    loglink: string;
    status: 'Success';
    stats: {
      counts: {
        city: number;
        unit: number;
        number: number;
        region: number;
        street: number;
        district: number;
        postcode: number;
      };
      validity: {
        valid: number;
        failures: {
          number: number;
          street: number;
          geometry: number;
        };
      };
    };
    count: number;
    bounds: Geometry;
    version: string;
    size: number;
    license: false;
    s3: string;
    s3_validated: string;
    pmtiles_url: string;
  }
}

export async function getAuthToken(username: string, password: string) {
  const result = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: {
      'Content-Type': 'application/json',
      ...HEADERS,
    },
  }).then((r) => r.json() as Promise<{ token: string }>);
  return result.token;
}

export async function listLayers() {
  return fetch(`${BASE_URL}/api/data`, {
    headers: HEADERS,
  }).then((r) => r.json() as Promise<OpenAddresses.Layer[]>);
}

export async function getJob(jobId: number) {
  return fetch(`${BASE_URL}/api/job/${jobId}`, {
    headers: HEADERS,
  }).then((r) => r.json() as Promise<OpenAddresses.Job>);
}

export function download(jobId: number, token: string) {
  const downloadUrl = `${BASE_URL}/api/job/${jobId}/output/source.geojson.gz?token=${token}`;
  return fetch(downloadUrl, { headers: HEADERS });
}
