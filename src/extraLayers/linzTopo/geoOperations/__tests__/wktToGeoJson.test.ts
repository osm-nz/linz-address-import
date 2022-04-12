import { wktToGeoJson } from '../wktToGeoJson';

describe('wktToGeoJson', () => {
  it('can parse Points', () => {
    expect(
      wktToGeoJson('POINT (168.37451472413 -46.1262499101384)'),
    ).toStrictEqual({
      type: 'Point',
      coordinates: [168.37451472413, -46.1262499101384],
    });
  });

  it('can parse Linestrings', () => {
    expect(
      wktToGeoJson(
        'LINESTRING (169.177030009869 -52.6024155341355,169.176335687358 -52.6025011595969,169.175711403283 -52.6024179908122)',
      ),
    ).toStrictEqual({
      type: 'LineString',
      coordinates: [
        // note: order is reversed
        [169.175711403283, -52.6024179908122],
        [169.176335687358, -52.6025011595969],
        [169.177030009869, -52.6024155341355],
      ],
    });
  });

  it('can parse Polygons', () => {
    expect(
      wktToGeoJson(
        'POLYGON ((175.349248175965 -36.1824229736652,175.35212691306 -36.1829710959257,175.351808520263 -36.1841715965386,175.349035400868 -36.1837272128319,175.349248175965 -36.1824229736652))',
      ),
    ).toStrictEqual({
      type: 'Polygon',
      coordinates: [
        [
          [175.349248175965, -36.1824229736652],
          [175.35212691306, -36.1829710959257],
          [175.351808520263, -36.1841715965386],
          [175.349035400868, -36.1837272128319],
          [175.349248175965, -36.1824229736652],
        ],
      ],
    });
  });

  it('can parse MultiPolygons', () => {
    expect(
      wktToGeoJson(
        'MULTIPOLYGON (((173.260217795195 -35.1205477105971,173.260221045875 -35.1205454497697)),((173.261662765546 -35.1196749748853,173.26165466687 -35.1197176351918)))',
      ),
    ).toStrictEqual({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [173.260217795195, -35.1205477105971],
            [173.260221045875, -35.1205454497697],
          ],
        ],
        [
          [
            [173.261662765546, -35.1196749748853],
            [173.26165466687, -35.1197176351918],
          ],
        ],
      ],
    });
  });

  it("converts MultiPolygons to Polygons if they're simple", () => {
    expect(
      wktToGeoJson(
        'MULTIPOLYGON (((175.349248175965 -36.1824229736652,175.35212691306 -36.1829710959257,175.351808520263 -36.1841715965386,175.349035400868 -36.1837272128319,175.349248175965 -36.1824229736652)))',
      ),
    ).toStrictEqual({
      type: 'Polygon',
      coordinates: [
        [
          [175.349248175965, -36.1824229736652],
          [175.35212691306, -36.1829710959257],
          [175.351808520263, -36.1841715965386],
          [175.349035400868, -36.1837272128319],
          [175.349248175965, -36.1824229736652],
        ],
      ],
    });
  });

  it('does NOT convert huge LineStrings into MultiPolygons', () => {
    // ideally we would do this but RapiD does't support this yet
    // and we've never encountered a huge LineString anyway
    expect(
      wktToGeoJson(
        'LINESTRING (1 2,3 4,5 6,7 8,9 10,11 12,13 14,15 16)',
        'test_long_way',
      ),
    ).toStrictEqual({
      type: 'LineString',
      coordinates: [
        [15, 16],
        [13, 14],
        [11, 12],
        [9, 10],
        [7, 8],
        [5, 6],
        [3, 4],
        [1, 2],
      ],
    });
  });

  it('converts huge Polygons into MultiPolygons with small outer ways', () => {
    expect(
      wktToGeoJson('POLYGON ((1 2,3 4,5 6,7 8,9 10,11 12,13 14))'),
    ).toStrictEqual({
      type: 'MultiPolygon',
      coordinates: [
        [
          // outer way 1:
          [
            [1, 2],
            [3, 4],
            [5, 6],
            [7, 8],
          ],
        ],
        [
          // outer way 2:
          [
            [9, 10],
            [11, 12],
            [13, 14],
          ],
        ],
      ],
    });
  });
  it('converts huge Polygons with huge holes into MultiPolygons with small outer ways', () => {
    expect(
      wktToGeoJson(
        'POLYGON ((1 2,3 4,5 6,7 8,9 10,11 12,13 14),(15 16,17 18,19 20,21 22,23 24,25 26,27 28))',
      ),
    ).toStrictEqual({
      type: 'MultiPolygon',
      coordinates: [
        [
          // outer way 1:
          [
            [1, 2],
            [3, 4],
            [5, 6],
            [7, 8],
          ],
          // inner way 1:
          [
            [15, 16],
            [17, 18],
            [19, 20],
            [21, 22],
          ],
          // inner way 2:
          [
            [23, 24],
            [25, 26],
            [27, 28],
          ],
        ],
        [
          // outer way 2:
          [
            [9, 10],
            [11, 12],
            [13, 14],
          ],
        ],
      ],
    });
  });

  it('simplifies ways with lots of close points', () => {
    // this example is ref:linz:topo50_id=1397565 (embankment)
    const WKT =
      'LINESTRING (174.340292252418 -36.3134421631288,174.340759985337 -36.3135512973808,174.340784477726 -36.3135577970782,174.340808325631 -36.3135657123814,174.340831404321 -36.3135750018915,174.341547439677 -36.3138898476984,174.341934161828 -36.3139936793458,174.342189076959 -36.3139972625264,174.342434278462 -36.3138736578672,174.342858546833 -36.3136412799371,174.342882504003 -36.3136292480304,174.342907561391 -36.3136187864195,174.34293356218 -36.3136099605766,174.34354561498 -36.3134248816007,174.343561850593 -36.3134203298819,174.343578338397 -36.3134164167298,174.34424290639 -36.3132726734075,174.3442489163 -36.3132714187429,174.344254952295 -36.3132702489685,174.344865734399 -36.313156419488,174.34505728904 -36.3130719019356,174.345187637221 -36.3127782292789,174.34526482589 -36.3124028007591,174.345239447132 -36.3121446110669,174.344967430714 -36.3113133012778,174.344965717748 -36.3113078521439,174.344964136347 -36.3113023770217,174.344867460422 -36.3109523048259,174.344862161304 -36.3109284462904,174.344859356142 -36.3109043118942,174.344815880136 -36.310225125917,174.344723072813 -36.3096766161912,174.344491743772 -36.3092149727567,174.34449170977 -36.3092149048769,174.34449167579 -36.3092148369901,174.344350853284 -36.3089333963257,174.344339172662 -36.308906231353,174.344330892835 -36.3088782598915,174.344326096132 -36.3088497600813,174.344324830246 -36.308821015316,174.34432710776 -36.3087923114248,174.344332906024 -36.3087639338299,174.344342167378 -36.3087361647089,174.344354799726 -36.3087092801885,174.344370677454 -36.3086835475987,174.344556520706 -36.3084165535383,174.344678697894 -36.3081242353718,174.344727321591 -36.307860812035,174.344734293988 -36.3078326899511,174.34474468271 -36.3078052673767,174.344758385027 -36.307778815472,174.344775265445 -36.3077535957987,174.344993075639 -36.3074636051731,174.345150130394 -36.3071350648354,174.345324454431 -36.3067651479006,174.345342855104 -36.3065417429993,174.345281229742 -36.3063987644695,174.34517182252 -36.3062312954817,174.344733181838 -36.3059219386118,174.343723643752 -36.3053667093852,174.34323514007 -36.3051658299892,174.343234186396 -36.3051654363626,174.343233234187 -36.305165040419,174.343113352903 -36.3051150074337)';

    expect(wktToGeoJson(WKT, 'test_long_way', true).coordinates).toHaveLength(
      25,
    ); // cf. original has 64
  });

  it('can parse 3D points', () => {
    expect(wktToGeoJson('POINT Z (170.6977569 -45.749434 0)')).toStrictEqual({
      type: 'Point',
      coordinates: [170.6977569, -45.749434],
    });
  });

  it('can simplify MultiLineStrings with only a single member', () => {
    expect(
      wktToGeoJson(
        'MULTILINESTRING Z ((184.8475468 -21.133391 0,184.8475841 -21.132725 0,184.8476105 -21.1318873 0))',
      ),
    ).toStrictEqual({
      type: 'LineString',
      coordinates: [
        // TODO: should we deal with the antimeridian issue here or in RapiD?
        [184.8476105, -21.1318873],
        [184.8475841, -21.132725],
        [184.8475468, -21.133391],
      ],
    });
  });

  it('can simplify MultiPoints with only a single member', () => {
    expect(
      wktToGeoJson('MULTIPOINT Z ((174.6767094 -56.657093 0))'),
    ).toStrictEqual({
      type: 'Point',
      coordinates: [174.6767094, -56.657093],
    });
  });

  describe('antimeridian issue', () => {
    it('fixes longitudes for points', () => {
      expect(wktToGeoJson('POINT (184.1 -46.2)', 'sea/')).toStrictEqual({
        type: 'Point',
        coordinates: [-175.9, -46.2],
      });
    });

    it('fixes longitudes for lines', () => {
      expect(
        wktToGeoJson('LINESTRING (188.1 -52.4,188.2 -52.4)', 'sea/'),
      ).toStrictEqual({
        type: 'LineString',
        coordinates: [
          [-171.8, -52.4],
          [-171.9, -52.4],
        ],
      });
    });

    it('fixes longitudes for polygons', () => {
      expect(
        wktToGeoJson(
          'POLYGON ((188.3 -36.1,188.3 -36.2,188.3 -36.3,188.3 -36.1))',
          'sea/',
        ),
      ).toStrictEqual({
        type: 'Polygon',
        coordinates: [
          [
            [-171.7, -36.1],
            [-171.7, -36.2],
            [-171.7, -36.3],
            [-171.7, -36.1],
          ],
        ],
      });
    });

    it('fixes longitudes for multipolygons', () => {
      expect(
        wktToGeoJson(
          'MULTIPOLYGON (((190 -35,190 -35.1)),((190 -35.2,190 -35.3)))',
          'sea/',
        ),
      ).toStrictEqual({
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-170, -35],
              [-170, -35.1],
            ],
          ],
          [
            [
              [-170, -35.2],
              [-170, -35.3],
            ],
          ],
        ],
      });
    });
  });
});