# LINZ to OSM Street Address Import (2021 update)

[![Test](https://github.com/osm-nz/linz-address-import/actions/workflows/ci.yml/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/ci.yml)
[![Changelog](https://github.com/osm-nz/linz-address-import/actions/workflows/changelog.yml/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/changelog.yml)
[![Request LINZ Export](https://github.com/osm-nz/linz-address-import/workflows/Request%20LINZ%20Export/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/request-linz-export.yml)
[![Sync](https://github.com/osm-nz/linz-address-import/actions/workflows/sync.yml/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/sync.yml)
[![Changeset Watch](https://github.com/osm-nz/linz-address-import/actions/workflows/changesetWatch.yml/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/changesetWatch.yml)
[![Coverage Status](https://coveralls.io/repos/github/osm-nz/linz-address-import/badge.svg?branch=main)](https://coveralls.io/github/osm-nz/linz-address-import?branch=main)
![Lines of code](https://sloc.xyz/github/osm-nz/linz-address-import)

Street address data from [Land Information New Zealand (LINZ)](https://linz.govt.nz) was [first imported into OpenStreetMap in 2017](https://wiki.openstreetmap.org/wiki/LINZ/Address_Import). Since then, the imported data has become out of date.

This project aims to update the address data, and set up a system to reguarly update addresses in OSM, by conflating them with [the data from LINZ](https://data.linz.govt.nz/layer/105689).

> 🚩 This repository also contains the code used to import topographic and hydrographic data from LINZ. For more info, see the [the wiki page](https://wiki.osm.org/LINZ).

> 🌏 For more information, please see [the wiki page](<https://wiki.openstreetmap.org/wiki/Import/New_Zealand_Street_Addresses_(2021)>) for this project. The rest of this document contains only technical detail. Continue reading if you wish to contribute to the code

# The fork of RapiD

This is modified version of the [RapiD editor](https://github.com/facebookincubator/rapid), which is a modified version of the [iD editor](https://github.com/openstreetmap/iD).

The source code is in a separate repository ([see here](https://github.com/osm-nz/RapiD)). It is available at [osm-nz.github.io](https://osm-nz.github.io)

![Sreenshot of the fork of RapiD](https://user-images.githubusercontent.com/16009897/138576782-df5a7223-cbee-4d3f-9a0f-f7a61d637540.png)

# Operation

If all five status badges at the top of this document are green, then the script is automatically running once a week (on Friday morning NZ time). The results can be viewed and actioned from [osm-nz.github.io](https://osm-nz.github.io)

# Setup

If you want to use the code to manually run the process, follow these steps:

1. Clone this repository
2. Download [nodejs v20.11](https://nodejs.org) or later
3. Generate an API from https://data.linz.govt.nz/my/api with "Full access to Exports Access"
   1. Then create a file called `.env` in this folder, and add `LINZ_API_KEY=XXXXX`, where `XXXXX` is the token you just generated.
4. Run `npm install`
5. Run `npm run request-linz-export` to request an export from the LDS, and wait for it to be generated
6. Run `npm run download-linz` to download the requested export
7. Download the planet file (for just NZ) by running `npm run download-planet`. This will create `./data/osm.pbf`
8. Start the preprocess script by running `npm run preprocess`. This will take ca. 2.5 minutes and create `./data/osm.json` and `./data/linz.json`
9. Start the confate script by running `npm run conflate`. This will take 30 seconds and create `./data/status.json`. Some computationally expensive diagnostics are only generated if you run `npm run conflate -- --full`, which takes 20 times longer.
10. Start the action script by running `npm run action`. This will take 20 seconds and generate a ton of files in the `./out` folder
11. Upload the contents of the `./out` folder to the CDN by running `npm run upload`. This will take ca. 4 minutes

## Tests

There are end-to-end tests than run based on [a mock planet file](src/__tests__/mock/planet.xml) and [a mock linz CSV file](src/__tests__/mock/linz-dump.csv).

You need to install [osmium-tool](https://osmcode.org/osmium-tool/) globally before you can run unit tests.

To start the test, run `npm test`. If it changes the contents of the snapshot folder, commit those changes.

## Process

![Flowchart](https://wiki.openstreetmap.org/wiki/Special:FilePath/LINZ_Address_Conflation_Flowchart.png)
