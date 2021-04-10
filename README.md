# LINZ to OSM Street Address Import (2021 update)

[![Test](https://github.com/osm-nz/linz-address-import/actions/workflows/ci.yml/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/ci.yml)
[![Changelog](https://github.com/osm-nz/linz-address-import/actions/workflows/changelog.yml/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/changelog.yml)
[![Sync](https://github.com/osm-nz/linz-address-import/actions/workflows/sync.yml/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/sync.yml)
[![Coverage Status](https://coveralls.io/repos/github/osm-nz/linz-address-import/badge.svg?branch=main)](https://coveralls.io/github/osm-nz/linz-address-import?branch=main)

Street address data from [Land Information New Zealand (LINZ)](https://linz.govt.nz) was [first imported into OpenStreetMap in 2017](https://wiki.openstreetmap.org/wiki/LINZ/Address_Import). Since then, the imported data has become out of date.

This project aims to update the address data, and set up a system to reguarly update addresses in OSM, by conflating them with [the data from LINZ](https://data.linz.govt.nz/layer/3353).

> 🌏 For more information, please see [the wiki page](<https://wiki.openstreetmap.org/wiki/Import/New_Zealand_Street_Addresses_(2021)>) for this project. The rest of this document contains only technical detail. Continue reading if you wish to contribute to the code

# The fork of RapiD

This is modified version of the [RapiD editor](https://github.com/facebookincubator/rapid), which is a modified version of the [iD editor](https://github.com/openstreetmap/iD).

The source code is in a separate repository ([see here](https://github.com/osm-nz/RapiD)). It is available at [linz-addr.kyle.kiwi](https://linz-addr.kyle.kiwi)

![Sreenshot of the fork of RapiD](https://linz-addr.kyle.kiwi/img/header.png)

# Setup

If you want to contribute to the code, the following needs to be done manually:

1. Clone this repository
2. Download [nodejs v15](https://nodejs.org) or later
3. Go to https://data.linz.govt.nz/layer/3353
4. Select & download that layer as CSV, using projection "NZGD2000 (EPSG:4167 Geographic)"
5. Save the file to the CDN, or save it in the folder in this repository called `./data`. Name the file `linz.csv`

The remaining steps are done automatically by the CI

6. Run `npm install`
7. Download the planet file (for just NZ) by running `npm run download-planet`. This will create `./data/osm.pbf`
8. Start the preprocess script by running `npm run preprocess`. This will take ca. 2.5 minutes and create `./data/osm.json` and `./data/linz.json`
9. Start the confate script by running `npm run conflate`. This will take circa. 2 minutes and create `./data/status.json`
10. Start the action script by running `npm run action`. This will take 20 seconds and generate a ton of files in the `./out` folder
11. Upload the contents of the `./out` folder to the CDN by running `npm run upload`. This will take ca. 4 minutes

## Tests

There are end-to-end tests than run based on [a mock planet file](src/__tests__/mock/planet.xml) and [a mock linz CSV file](src/__tests__/mock/linz-dump.csv).

To start the test, run `npm test`. If it changes the contents of the snapshot folder, commit those changes.
