// LINZ has finally updated the address dataset to use official names.
// This means we don't need the FENZ/NZGB translation table anymore.
// This file lists a few exceptions that remain for historic reasons.
export const nzgbNamesTable: Record<string, string> = {
  // These 3 were erroneously added by us a few years ago. To
  // avoid disruption, we haven't corrected them yet.
  'Waihi Beach': 'Waihī Beach', // https://gazetteer.linz.govt.nz/place/45650
  Omihi: 'Ōmihi', // https://gazetteer.linz.govt.nz/place/57299
  Orewa: 'Ōrewa', // https://gazetteer.linz.govt.nz/place/34087

  // these ones have always been wrong in OSM, for now we want
  // to avoid changing them due to the unnecessary disruption.
  'Saint Heliers': 'St Heliers',
  'St Andrews': 'Saint Andrews',
  'St Johns': 'Saint Johns',

  // recently gazetted & not in the address dataset yet
  Ranui: 'Rānui', // https://gazetteer.linz.govt.nz/place/59450
  Otaua: 'Ōtaua', // https://gazetteer.linz.govt.nz/place/34462
  'Lake Rotoma': 'Lake Rotomā', // https://gazetteer.linz.govt.nz/place/7431
  'Lake Okareka': 'Lake Ōkareka', // https://gazetteer.linz.govt.nz/place/7385
  Ngahape: 'Ngāhape', // https://gazetteer.linz.govt.nz/place/32282
  Peketa: 'Peketā', // https://gazetteer.linz.govt.nz/place/57309
  Orakei: 'Ōrākei', // https://gazetteer.linz.govt.nz/place/33996
  Pohuehue: 'Pōhuehue', // https://gazetteer.linz.govt.nz/place/36359

  Opotiki: 'Ōpōtiki', // // only included here for unit tests. It's correct in the LINZ dataset
};
