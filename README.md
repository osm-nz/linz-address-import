# LINZ to OSM Street Address Import (2021 update)

[![Test](https://github.com/osm-nz/linz-address-import/actions/workflows/ci.yml/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/ci.yml)
[![Sync](https://github.com/osm-nz/linz-address-import/actions/workflows/sync.yml/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/sync.yml)
[![Changeset Watch](https://github.com/osm-nz/linz-address-import/actions/workflows/changesetWatch.yml/badge.svg)](https://github.com/osm-nz/linz-address-import/actions/workflows/changesetWatch.yml)
[![Coverage Status](https://coveralls.io/repos/github/osm-nz/linz-address-import/badge.svg?branch=main)](https://coveralls.io/github/osm-nz/linz-address-import?branch=main)
![Lines of code](https://sloc.xyz/github/osm-nz/linz-address-import)
![](https://img.shields.io/badge/dynamic/json?url=https://osm-conflation-engine.kyle.kiwi/api/run_history/ref%3Alinz%3Aaddress_id&query=$.result.timestamp&label=Last%20Sync&color=31c654)

Street address data from [Land Information New Zealand (LINZ)](https://linz.govt.nz) was [first imported into OpenStreetMap in 2017](https://wiki.openstreetmap.org/wiki/LINZ/Address_Import). Since then, the imported data has become out of date.

This project aims to update the address data, and set up a system to reguarly update addresses in OSM, by conflating them with [the data from LINZ](https://data.linz.govt.nz/layer/105689).

Most of the conflation logic is handled by the general purpose [osm-conflation-engine](https://github.com/osm-nz/osm-conflation-engine) tool.
This repository contains only the configuration and scripts which are LINZ-specific.

> 🌏 For more information, please see [the wiki page](https://osm.wiki/LINZ/Address_Import) for this project. The rest of this document contains only technical detail. Continue reading if you wish to contribute to the code

# Operation

If all status badges at the top of this document are green, then the script is automatically running once a week (on Friday morning NZ time).
The results can be viewed and actioned from [the homepage of osm-conflation-engine](https://osm-nz.github.io/osm-conflation-engine).

# Setup

If you want to use the code to manually run the process, follow these steps:

1. Clone this repository
2. Download [nodejs v26](https://nodejs.org) or later
3. Create an account for [OpenAddresses.io](https://OpenAddresses.io)
4. Then create a file called `.env` in this folder, with the following content:
   ```ini
   OPEN_ADDRESSES_USERNAME="XXXXX"
   OPEN_ADDRESSES_PASSWORD="XXXXX"
   ```
   (replacing `XXXXX` with your real credentials)
5. Run `npm install`
6. Run `npm run download-linz` to download the requested export
7. Download the planet file (for just NZ) by running `npm run download-planet`. This will create `./data/osm.pbf`
8. Start the preprocess script by running `npm run preprocess`. This will take ca. 2.5 minutes and create `./data/osm.json` and `./data/linz.json`
9. Start the confate script by running `npm run conflate`. This will take 30 seconds and create `./data/status.json`. Some computationally expensive diagnostics are only generated if you run `npm run conflate -- --full`, which takes 20 times longer.
10. Start the action script by running `npm run action`. This will take 20 seconds and generate a ton of files in the `./out` folder
11. Upload the contents of the `./out` folder to the CDN by running `npm run upload`. This will take ca. 4 minutes

## Tests

There are end-to-end tests than run based on [a mock planet file](src/__tests__/mock/planet.xml) and [a mock OpenAddresses dataset](src/__tests__/mock/linz-dump.jsonl).

You need to install [osmium-tool](https://osmcode.org/osmium-tool/) globally before you can run unit tests.

To start the test, run `npm test`. If it changes the contents of the snapshot folder, commit those changes.
