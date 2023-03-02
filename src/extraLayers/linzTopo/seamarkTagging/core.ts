import { GeoJsonCoords } from '../../../types';
import { MapCat } from './const';
import { cleanSource, cleanDate, cleanSequence } from './helpers';
import { AllSeamarkProps, OSMSeamarkTypes } from './types';

/**
 * Seamark tags are quiet complicated. This function is used for all seamark layers.
 */
export const seamarkTagging =
  (type: OSMSeamarkTypes) =>
  (
    data: AllSeamarkProps,
    _id: string,
    chartName: string | undefined,
    geometryType: GeoJsonCoords['type'],
  ): Record<string, string | undefined> => {
    const tags = {
      //
      // standard tags on many features
      //
      name: data.nobjnm || data.objnam, // we don't use seamark:name, see https://wiki.osm.org/Talk:Key:seamark:name
      description: data.ninfom || data.inform || data.ntxtds || data.txtdsc,

      // The ID is nearly always a number, except when a feature it split at the
      // boundary between two charts. Then LINZ gives it a 3-letter suffix like AAA.
      'ref:linz:hydrographic_id': `${+data.fidn || data.fidn}`,

      source: cleanSource(data.sorind, chartName),
      'source:date': cleanDate(data.sordat),
      start_date: cleanDate(data.datsta),
      end_date: cleanDate(data.datend),

      //
      // generic seamark tags
      //
      'seamark:type': type === 'light' ? 'light_minor' : type,

      [`seamark:${type}:picture`]: data.picrep,
      [`seamark:${type}:height`]: data.height || data.verlen,
      [`seamark:${type}:colour`]: data.colour
        ?.split(',')
        .map((x) => MapCat('COLOUR', x))
        .join(';'),
      [`seamark:${type}:colour_pattern`]: MapCat('COLPAT', data.colpat),
      [`seamark:${type}:condition`]: MapCat('CONDTN', data.condtn),
      [`seamark:${type}:water_level`]: MapCat('WATLEV', data.watlev),
      [`seamark:${type}:reflectivity`]: MapCat('CONRAD', data.conrad),
      [`seamark:${type}:restriction`]: data.restrn
        ?.split(',')
        .map((x) => MapCat('RESTRN', x))
        .join(';'),
      [`seamark:${type}:system`]: MapCat('MARSYS', data.marsys),
      [`seamark:${type}:period_start`]: data.persta,
      [`seamark:${type}:period_end`]: data.perend,
      [`seamark:${type}:status`]: data.status
        ?.split(',')
        .map((x) => MapCat('STATUS', x))
        .join(';'),
      [`seamark:${type}:visibility`]: MapCat('LITVIS', data.litvis),
      [`seamark:${type}:conspicuity`]: MapCat('CONVIS', data.convis),
      [`seamark:${type}:channel`]: data.comcha,
      [`seamark:${type}:traffic_flow`]: MapCat('TRAFIC', data.trafic),
      [`seamark:${type}:surface_qualification`]: MapCat('NATQUA', data.natqua),
      [`seamark:${type}:shape`]:
        MapCat('TOPSHP', data.topshp) ||
        MapCat('BOYSHP', data.boyshp) ||
        MapCat('BCNSHP', data.bcnshp),

      //
      // misc seamark tags
      //
      depth: data.valsou && `${+data.valsou}`,
      'depth:source_quality': MapCat('QUASOU', data.quasou),
      'depth:accuracy': data.souacc,
      'depth:exposition': MapCat('EXPSOU', data.expsou),
      'depth:technique': MapCat('TECSOU', data.tecsou),

      height: data.verlen || data.height,
      'height:accuracy': data.veracc,
      'width:accuracy': data.horacc,

      material: data.natcon
        ?.split(',')
        .map((x) => MapCat('NATCON', x))
        .join(';'),
      [`seamark:${type}:construction`]: data.natcon
        ?.split(',')
        .map((x) => MapCat('NATCON', x))
        .join(';'),

      surface: MapCat('NATSUR', data.natsur),
      [`seamark:${type}:surface`]: MapCat('NATSUR', data.natsur),

      ele: data.elevat,
      [`seamark:${type}:elevation`]: data.elevat,

      direction: data.orient,
      [`seamark:${type}:orientation`]: data.orient,

      //
      // Sx/Lx - lights/horns/radar
      //
      [`seamark:${type}:multiple`]: data.mltylt && `${+data.mltylt}`,
      [`seamark:${type}:range`]: data.valnmr && `${+data.valnmr}`,
      [`seamark:${type}:group`]: data.siggrp?.match(/\((\d+)\)/)?.[1], // format is `(123)`, we want `123`
      [`seamark:${type}:period`]: data.sigper,
      [`seamark:${type}:frequency`]: data.sigfrq,
      [`seamark:${type}:sequence`]: data.sigseq && cleanSequence(data.sigseq),
      [`seamark:${type}:wavelength`]: data.radwal,
      [`seamark:${type}:generation`]: MapCat('SIGGEN', data.siggen),
      // we don't include the sector numbers for these two, since they're added when lights are merged
      [`seamark:${type}:sector_start`]: data.sectr1 && `${+data.sectr1}`,
      [`seamark:${type}:sector_end`]: data.sectr2 && `${+data.sectr2}`,

      //
      // category
      //
      [`seamark:${type}:category`]:
        MapCat('CATCBL', data.catcbl) ||
        data.catach
          ?.split(',')
          .map((x) => MapCat('CATACH', x))
          .join(';') ||
        MapCat('CATDPG', data.catdpg) ||
        MapCat('CATHLK', data.cathlk) ||
        MapCat('CATPLE', data.catple) ||
        MapCat('CATPYL', data.catpyl) ||
        MapCat('CATRAS', data.catras) ||
        MapCat('CATRSC', data.catrsc) ||
        MapCat('CATWED', data.catwed) ||
        data.catlit
          ?.split(',')
          .map((x) => MapCat('CATLIT', x))
          .join(';') ||
        MapCat('CATFOG', data.catfog) ||
        MapCat('CATMOR', data.catmor) ||
        MapCat('CATRTB', data.catrtb) ||
        data.catspm
          ?.split(',')
          .map((x) => MapCat('CATSPM', x))
          .join(';') ||
        MapCat('CATOBS', data.catobs) ||
        MapCat('CATDIS', data.catdis) ||
        MapCat('CATLAM', data.catlam) ||
        MapCat('CATCAM', data.catcam) ||
        MapCat('CATREA', data.catrea) ||
        MapCat('CATBRG', data.catbrg) ||
        MapCat('CATROS', data.catros) ||
        MapCat('CATPIL', data.catpil) ||
        MapCat('CATWRK', data.catwrk) ||
        MapCat('CATNAV', data.catnav) ||
        MapCat('CATTRK', data.cattrk) ||
        MapCat('CATFIF', data.catfif) ||
        MapCat('CATPIP', data.catpip) ||
        MapCat('CATWAT', data.catwat) ||
        MapCat('CATSCF', data.catscf) ||
        MapCat('CATHAF', data.cathaf) ||
        MapCat('CATPRA', data.catpra) ||
        MapCat('CLSNAM', data.clsnam) ||
        MapCat('CATOFP', data.catofp),

      //
      // tags specific to a small number of layers
      //
      [`seamark:${type}:character`]: MapCat('LITCHR', data.litchr),
      [`seamark:${type}:product`]: MapCat('PRODCT', data.prodct),
      [`seamark:${type}:radius`]: data.radius,
      [`seamark:${type}:exhibition`]: MapCat('EXCLIT', data.exclit),
      [`seamark:${type}:depth_buried`]: data.burdep && `${+data.burdep}`,

      // bridges
      [`seamark:${type}:clearance_width`]: data.horclr && `${+data.horclr}`,
      [`seamark:${type}:clearance_height`]: data.verclr && `${+data.verclr}`,
      [`seamark:${type}:clearance_height_closed`]:
        data.verccl && `${+data.verccl}`,
      [`seamark:${type}:clearance_height_open`]:
        data.vercop && `${+data.vercop}`,
    };

    //
    // add extra non-seamark tags
    //
    if (type === 'fishing_facility') tags.leisure = 'fishing';
    if (type === 'pylon') tags['bridge:support'] = 'pier';
    if (type === 'hulk') tags.building = 'yes';
    if (type === 'rescue_station') tags.emergency = 'lifeboat_station';
    if (type === 'spring') tags.natural = 'spring';
    if (type === 'rock') tags.natural = 'rock';
    // if (type === 'light') tags.man_made = 'lighthouse'; // mappers can add this manually if appropriate

    if (type === 'pontoon') {
      tags.man_made = 'pier';
      tags.floating = 'yes';
      if (geometryType !== 'LineString') tags.area = 'yes';
    }

    if (type === 'pipeline_submarine') {
      tags.man_made = 'pipeline';
      tags.location = 'underwater';
      tags.layer = '-1';
      tags.oneway = 'yes'; // add by default, can remove when mapping if it's not obvious
      tags.substance = tags[`seamark:${type}:product`];

      if (!tags.substance && tags[`seamark:${type}:category`] === 'sewer') {
        tags.substance = 'sewage';
      }
    }

    if (type === 'cable_submarine') {
      if (MapCat('CATCBL', data.catcbl) === 'power') {
        tags.power = 'cable';
      } else {
        tags.communication = 'line';
      }
      tags.location = 'underwater';
      tags.layer = '-1';
    }

    if (tags[`seamark:${type}:category`] === 'odas') {
      tags.man_made = 'monitoring_station';
    }

    if (type === 'wreck') {
      tags.historic = 'wreck';
      tags['wreck:type'] = 'ship';
    }

    if (type === 'platform') {
      if (MapCat('CATOFP', data.catofp) === 'fpso') {
        tags.man_made = 'floating_storage';
      } else {
        tags.man_made = 'offshore_platform';
      }
    }

    if (tags['seamark:harbour:category'] === 'marina') tags.leisure = 'marina';

    if (tags['seamark:small_craft_facility:category'] === 'slipway') {
      tags.leisure = 'slipway';
    }

    if (type === 'production_area') {
      if (MapCat('CATPRA', data.catpra) === 'quarry') {
        tags.landuse = 'quarry';
        tags.resource = tags['seamark:production_area:product'];
      } else {
        tags.landuse = 'industrial';
        tags.product = tags['seamark:production_area:product'];
      }
    }

    // this isn't logical. Mappers can add the tag when required
    // if (type.startsWith('beacon_')) tags.man_made = 'beacon';

    if (tags['seamark:mooring:category'] === 'dolphin') {
      tags.man_made = 'dolphin';
    }

    if (tags.surface === 'coral') {
      tags.natural = 'reef';
      tags.reef = 'coral';
    }

    if (tags[`seamark:${type}:traffic_flow`] === 'two-way' && tags.direction) {
      // for two-way points, change the direction tag to point in both directions
      // we don't touch `seamark:*:direction`, just `direction`
      tags.direction += `;${Math.round((+tags.direction + 180) % 360)}`;
    }

    //
    // delete some tag combinations
    //

    // surface=rock is pointless for natural=rock
    if (tags.natural === 'rock' && tags.surface === 'rock') delete tags.surface;

    // seamark:rock:surface=rock is pointless for seamark:type=rock
    if (
      tags['seamark:type'] === 'rock' &&
      tags['seamark:rock:surface'] === 'rock'
    ) {
      delete tags['seamark:rock:surface'];
    }

    // delete depth:source_quality=unknown if there is no depth=* tag
    if (tags['depth:source_quality'] === 'unknown' && !tags.depth) {
      delete tags['depth:source_quality'];
    }

    // For Virtual AtoNs, and real AtoNs with AIS, LINZ puts the mmsi in the description
    const mmsiRegex = /AIS AtoN, MMSI (\d+)/i;
    const [, mmsiMatch] = tags.description?.match(mmsiRegex) || [];
    if (mmsiMatch) {
      // always radio_station for some reason, except on virtual AtoNs
      const radioType =
        type === 'virtual_aton' ? 'virtual_aton' : 'radio_station';

      tags[`seamark:${radioType}:mmsi`] = mmsiMatch;
      tags.description = tags.description!.replace(mmsiRegex, '').trim();
    }

    // seamark materials are different to the standard material=* tag
    if (tags.material === 'concreted') tags.material = 'concrete';
    if (tags.material === 'wooden') tags.material = 'wood';

    // delete falsy values
    for (const k in tags) if (!tags[k]) delete tags[k];

    return tags;
  };
