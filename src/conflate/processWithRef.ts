import { LinzAddr, OsmAddr, Status, StatusDiagnostics } from '../types';
import { distanceBetween } from './helpers/geo';
import { validate } from './helpers/validate';

/** distance in metres beyond which we classify the address as `EXISTS_BUT_LOCATION_WRONG` */
const LOCATION_THRESHOLD = 300;

const isTruthy = <T>(x: T | undefined | false | null | 0): x is T => !!x;

/** swap suburb <=> hamlet */
const inverse = (linz: string) => {
  const [k, v] = linz.split('=');
  const swappedK = k === 'addr_hamlet' ? 'addr_suburb' : 'addr_hamlet';
  return [swappedK, v].join('=');
};

export function processWithRef(
  _addressId: string,
  linzAddr: LinzAddr,
  osmAddr: OsmAddr,
): { status: Status; diagnostics?: unknown } {
  if (osmAddr.checked) return { status: Status.PERFECT };

  const linzSuburb = `${
    linzAddr.suburb[0] === 'U' ? 'addr_suburb' : 'addr_hamlet'
  }=${linzAddr.suburb[1]}`;
  const osmSuburb = osmAddr.suburb
    ? `${osmAddr.suburb[0] === 'U' ? 'addr_suburb' : 'addr_hamlet'}=${
        osmAddr.suburb[1]
      }`
    : 0;

  const houseOk = linzAddr.housenumber === osmAddr.housenumber;
  const streetOk = linzAddr.street === osmAddr.street;
  const suburbOk = linzSuburb === osmSuburb;
  const waterOk = linzAddr.water === osmAddr.water;

  if (houseOk && streetOk && suburbOk && waterOk && !osmAddr.doubleSuburb) {
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
      osmAddr,
      linzAddr.suburb[1],
      !houseOk && `housenumber|${linzAddr.housenumber}|${osmAddr.housenumber}`,
      !streetOk && `street|${linzAddr.street}|${osmAddr.street}`,
      !suburbOk && `suburb|${linzSuburb}|${osmSuburb}`,

      // this is the buggy one (see #7) if it's a double suburb, the system may think `suburbOk` but it's wrong
      suburbOk &&
        osmAddr.doubleSuburb &&
        `suburb|${linzSuburb}|${inverse(linzSuburb)}`, // we want the wrong one to be in the diagnostic

      !waterOk &&
        `water|${+(linzAddr.water || false)}|${+(osmAddr.water || false)}`,
    ].filter(isTruthy) as StatusDiagnostics[Status.EXISTS_BUT_WRONG_DATA],
  });
}
