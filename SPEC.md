# osmPatchFile format

This tool generates `osmPatchFile`s, which are geojson files that [our fork of RapiD](https://github.com/osm-nz/RapiD) uses to `add`, `edit`, `move`, or `delete` OSM feaures.

Other tools can generate files in the same format. Users can add their own osmPatchFile files in the editor.

```jsonc
{
  "type": "FeatureCollection",
  "features": [
    // 1️⃣ to add a feature, the `id` should not start with `SPECIAL_`
    {
      "type": "Feature",
      "id": "70103",
      "geometry": {
        // these geometrys are allowed: Point, LineString, Polygon, MulitPolygon
        // MultiPoint and MultiLineString are not supported.
        "type": "Point",
        "coordinates": [175.103, -36.9]
      },
      "properties": {
        // you do not specify __osmId here, since you are creating a new feature

        // specify the tags to add here.
        "amenity": "theatre"

        // you cannot delete tags obviously, since you are creating a new feaure
      }
    },

    // 2️⃣ to edit a feature, the `id` should start with `SPECIAL_EDIT_`
    //    You can only edit the tags, not the geometry (although you can
    //    move nodes, see example 3).
    {
      "type": "Feature",
      "id": "SPECIAL_EDIT_123",
      "geometry": {
        // approximate current geometry is required. It could be a centroid, or
        // one of the nodes of the way, or just a rough coordinate. Or a way.
        // It is only used to move the map to the approximate location.
        "type": "Polygon",
        "coordinates": [
          [
            [174.944, -36.8],
            [174.945, -36.8]
          ]
        ]
      },
      "properties": {
        "__osmId": "r123",

        // any OSM tags to add/change go here. See the section about "Tags" below
        "amenity": "theatre",
        "name": "🗑️"
      }
    },

    // 3️⃣ to move a node, the `id` should start with `SPECIAL_MOVE_`
    //    It's geometry must be a LineString with two points, the first
    //    point is the current location, and the second point is the new
    //    location. Only works for nodes.
    {
      "type": "Feature",
      "id": "SPECIAL_MOVE_124",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [174.90300000000002, -36], // old location
          [174.903, -36.9] // new location
        ]
      },
      "properties": {
        "__osmId": "n124" // required

        // You can't change tags at the same time as moving a feautre. Thus,
        // there is no point in putting tags here, but you can. The system doesn't care.
      }
    },

    // 4️⃣ To delete a feature, the `id` should start with `SPECIAL_EDIT_`
    {
      "type": "Feature",
      "id": "SPECIAL_DELETE_125",
      "geometry": {
        // approximate current geometry is required. It could be a centroid, or
        // one of the nodes of the way, or just a rough coordinate. Or a way.
        // It is only used to move the map to the approximate location.
        "type": "Point",
        "coordinates": [174.922, -36.9]
      },
      "properties": {
        "__osmId": "w125" // required

        // there is no point in putting tags here, but you can. The system doesn't care.
      }
    }
  ]
}
```

# Tags

The `properties` of a geojson item must contain `__osmId`, unless you are creating a new feature. All other `properties` are OSM tags.

However, the tags are a **diff**. This means:

1. Any specified tags will override the tag if it exists, or add the tag if it doesn't exist
2. Any tags that exist on the OSM feature, but not in `properties` will be retained
3. To remove a tag, set the value to `🗑️`
