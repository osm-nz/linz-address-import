import { LinzAddr, OsmAddr, Status, StatusDiagnostics } from '../types';
import { distanceBetween } from './helpers/geo';
import { validate } from './helpers/validate';

/** distance in metres beyond which we classify the address as `EXISTS_BUT_LOCATION_WRONG` */
const LOCATION_THRESHOLD = 500;

const isTruthy = <T>(x: T | undefined | false | null | 0): x is T => !!x;

export function processWithRef(
  _addressId: string,
  linzAddr: LinzAddr,
  osmAddr: OsmAddr,
): { status: Status; diagnostics?: unknown } {
  if (osmAddr.checked) return { status: Status.PERFECT };

  const houseOk = linzAddr.housenumber === osmAddr.housenumber;
  const streetOk = linzAddr.street === osmAddr.street;
  const suburbOk = linzAddr.suburb[1] === osmAddr.suburb?.[1];
  const suburbTypeOk = linzAddr.suburb[0] === osmAddr.suburb?.[0];
  const waterOk = linzAddr.water === osmAddr.water;

  if (houseOk && streetOk && suburbOk && suburbTypeOk && waterOk) {
    // looks perfect - last check is if location is correct

    const offset = distanceBetween(
      linzAddr.lat,
      linzAddr.lng,
      osmAddr.lat,
      osmAddr.lng,
    );

    if (offset < LOCATION_THRESHOLD) return { status: Status.PERFECT };

    return validate({
      status: Status.EXISTS_BUT_LOCATION_WRONG,
      diagnostics: [
        Math.round(offset),
        osmAddr.osmId,
        linzAddr.lat,
        linzAddr.lng,
        osmAddr.lat,
        osmAddr.lng,
      ],
    });
  }

  // something is wrong in the data

  return validate({
    status: Status.EXISTS_BUT_WRONG_DATA,
    diagnostics: [
      osmAddr.osmId,
      !houseOk && `housenumber|${linzAddr.housenumber}|${osmAddr.housenumber}`,
      !streetOk && `street|${linzAddr.street}|${osmAddr.street}`,
      !suburbOk && `suburb|${linzAddr.suburb[1]}|${osmAddr.suburb?.[1] || 0}`,
      !waterOk && `water|${linzAddr.water || 0}|${osmAddr.water || 0}`,
      !suburbTypeOk &&
        `suburbType|${linzAddr.suburb[0]}|${osmAddr.suburb?.[0] || 0}`,
    ].filter(isTruthy) as StatusDiagnostics[Status.EXISTS_BUT_WRONG_DATA],
  });
}
