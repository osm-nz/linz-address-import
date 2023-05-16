// Even the new address dataset from LINZ still doesn't use official names everywhere...
// We no longer need to use the FENZ/NZGB translation table, since there's only a handfull missing.
export const nzgbNamesTable: Record<string, string> = {
  Wanaka: 'Wānaka', // https://gazetteer.linz.govt.nz/place/6876
  Aria: 'Āria', // https://gazetteer.linz.govt.nz/place/58484
  'Waihi Beach': 'Waihī Beach', // https://gazetteer.linz.govt.nz/place/45650
  Okura: 'Ōkura', // https://gazetteer.linz.govt.nz/place/4158
  Waiwhetu: 'Waiwhetū', // https://gazetteer.linz.govt.nz/place/6861
  Omihi: 'Ōmihi', // https://gazetteer.linz.govt.nz/place/57299
  Mokau: 'Mōkau', // https://gazetteer.linz.govt.nz/place/58487
  Waimata: 'Waimatā', // https://gazetteer.linz.govt.nz/place/46170
  Rarangi: 'Rārangi', // https://gazetteer.linz.govt.nz/place/38060
  Patea: 'Pātea', // https://gazetteer.linz.govt.nz/place/35685
  'Ngakuta Bay': 'Ngākuta Bay', // https://gazetteer.linz.govt.nz/place/32356
  'Totara Vale': 'Tōtara Vale', // https://gazetteer.linz.govt.nz/place/6380
  'Te Hapara': 'Te Hāpara', // https://gazetteer.linz.govt.nz/place/42310
  Okitu: 'Okitū', // https://gazetteer.linz.govt.nz/place/33352
  Makaraka: 'Mākaraka', // https://gazetteer.linz.govt.nz/place/27337
  Otorohanga: 'Ōtorohanga', // https://gazetteer.linz.govt.nz/place/58486
  'Te Kuiti': 'Te Kūiti', // https://gazetteer.linz.govt.nz/place/58492
  Paremoremo: 'Pāremoremo', // https://gazetteer.linz.govt.nz/place/4460
  Manutuke: 'Manutūkē', // https://gazetteer.linz.govt.nz/place/28721
  Matawai: 'Mātāwai', // https://gazetteer.linz.govt.nz/place/29215
  Ngatapa: 'Ngātapa', // https://gazetteer.linz.govt.nz/place/32504
  Patutahi: 'Pātūtahi', // https://gazetteer.linz.govt.nz/place/35756
  'Te Mahia': 'Te Māhia', // https://gazetteer.linz.govt.nz/place/42665
  Orewa: 'Ōrewa', // https://gazetteer.linz.govt.nz/place/34087
  Whangaparaoa: 'Whangaparāoa', // https://gazetteer.linz.govt.nz/place/48115

  Opotiki: 'Ōpōtiki', // // only included here for unit tests. It's correct in the LINZ dataset
};
