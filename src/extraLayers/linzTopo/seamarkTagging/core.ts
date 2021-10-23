import { MapCat } from './const';
import { cleanSource, cleanDate } from './helpers';
import { AllSeamarkProps, OSMSeamarkTypes } from './types';

/**
 * Seamark tags are quiet complicated. This function is used for all seamark layers.
 */
export const seamarkTagging =
  (type: OSMSeamarkTypes) =>
  (data: AllSeamarkProps): Record<string, string | undefined> => {
    const tags = {
      //
      // standard tags on many features
      //
      name: data.nobjnm || data.objnam, // we don't use seamark:name, see https://wiki.osm.org/Talk:Key:seamark:name
      description: data.ninfom || data.inform || data.ntxtds || data.txtdsc,
      'ref:linz:hydrographic_id': `${+data.fidn}`,
      source: cleanSource(data.sorind),
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
      [`seamark:${type}:construction`]: data.natcon,
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
      [`seamark:${type}:surface`]: MapCat('NATSUR', data.natsur),
      [`seamark:${type}:traffic_flow`]: MapCat('TRAFIC', data.trafic),
      [`seamark:${type}:surface_qualification`]: MapCat('NATQUA', data.natqua),
      [`seamark:${type}:shape`]:
        MapCat('TOPSHP', data.topshp) ||
        MapCat('BOYSHP', data.boyshp) ||
        MapCat('BCNSHP', data.bcnshp),

      //
      // misc seamark tags
      //
      depth: data.valsou,
      'depth:source_quality': MapCat('QUASOU', data.quasou),
      'depth:accuracy': data.souacc,
      'depth:exposition': MapCat('EXPSOU', data.expsou),
      'depth:technique': MapCat('TECSOU', data.tecsou),

      height: data.verlen || data.height,
      'height:accuracy': data.veracc,

      ele: data.elevat,
      [`seamark:${type}:elevation`]: data.elevat,

      direction: data.orient,
      [`seamark:${type}:orientation`]: data.orient,

      //
      // Sx/Lx - lights/horns/radar
      //
      [`seamark:${type}:multiple`]: data.mltylt,
      [`seamark:${type}:range`]: data.valnmr,
      [`seamark:${type}:group`]: data.siggrp,
      [`seamark:${type}:period`]: data.sigper,
      [`seamark:${type}:frequency`]: data.sigfrq,
      [`seamark:${type}:sequence`]: data.sigseq,
      [`seamark:${type}:wavelength`]: data.radwal,
      [`seamark:${type}:wavelength`]: MapCat('SIGGEN', data.siggen),

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
        MapCat('CATROS', data.catros) ||
        MapCat('CATPIL', data.catpil) ||
        MapCat('CATWRK', data.catwrk) ||
        MapCat('CATFIF', data.catfif) ||
        MapCat('CATOFP', data.catofp),

      //
      // tags specific to a small number of layers
      //
      [`seamark:${type}:character`]: MapCat('LITCHR', data.litchr),
      [`seamark:${type}:product`]: MapCat('PRODCT', data.prodct),
      [`seamark:${type}:radius`]: data.radius,
      [`seamark:${type}:exhibition`]: MapCat('EXCLIT', data.exclit),
    };

    //
    // the SECTR1 & SECTR2 attributes get used differently for lights
    //
    if (type === 'light') {
      tags[`seamark:${type}:1:sector_start`] = data.sectr1;
      tags[`seamark:${type}:2:sector_end`] = data.sectr2;
    } else {
      tags[`seamark:${type}:sector_start`] = data.sectr1;
      tags[`seamark:${type}:sector_end`] = data.sectr2;
    }

    //
    // add extra non-seamark tags
    //
    if (type === 'fishing_facility') tags.leisure = 'fishing';
    if (type === 'pylon') tags['bridge:support'] = 'pier';
    if (type === 'rescue_station') tags.emergency = 'lifeboat_station';
    if (type === 'spring') tags.natural = 'spring';
    if (type === 'rock') tags.natural = 'rock';
    if (type === 'cable_submarine') {
      tags.communication = 'line';
      tags.location = 'underwater';
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
    if (type.startsWith('beacon_')) tags.man_made = 'beacon';

    return tags;
  };
