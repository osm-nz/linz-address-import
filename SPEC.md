# osmPatchFile format

This tool generates `osmPatchFile`s, which are geojson files that [our fork of RapiD](https://github.com/osm-nz/RapiD) uses to `add`, `edit`, `move`, or `delete` OSM feaures.

Other tools can generate files in the same format. Users can add their own osmPatchFile files in the editor.

```jsonc
{
  "type": "FeatureCollection",
  "features": [
    // 1️⃣ to add a feature, do not specify the `__action` property
    {
      "type": "Feature",
      "id": "abc", // for create, you don't specify an OSM ID, so this ID is just any unique string.
      "geometry": {
        // these geometrys are allowed: Point, LineString, Polygon, MulitPolygon
        // MultiPoint and MultiLineString are not supported.
        "type": "Point",
        "coordinates": [175.103, -36.9]
      },
      "properties": {
        // you do not specify __action here, since you are creating a new feature

        // specify the tags to add here.
        "amenity": "theatre"

        // you cannot delete tags obviously, since you are creating a new feaure
      }
    },

    // 2️⃣ to edit a feature, set `__action` to `edit`. You can only edit the tags,
    //    not the geometry (although you can move nodes, see example 3).
    {
      "type": "Feature",
      "id": "r123", // required - the OSM id of the feature
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
        "__action": "edit", // required

        // any OSM tags to add/change go here. See the section about "Tags" below
        "amenity": "theatre",
        "name": "🗑️"
      }
    },

    // 3️⃣ to move a node, set `__action` to `move`.
    //    It's geometry must be a LineString with two points, the first
    //    point is the current location, and the second point is the new
    //    location. Only works for nodes.
    {
      "type": "Feature",
      "id": "n124", // required - the OSM id of the feature
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [174.90300000000002, -36], // old location
          [174.903, -36.9] // new location
        ]
      },
      "properties": {
        "__action": "move" // required

        // You can't change tags at the same time as moving a feautre. Thus,
        // there is no point in putting tags here, but you can. The system doesn't care.
      }
    },

    // 4️⃣ To delete a feature, set `__action` to `delete`.
    {
      "type": "Feature",
      "id": "w125", // required - the OSM id of the feature
      "geometry": {
        // approximate current geometry is required. It could be a centroid, or
        // one of the nodes of the way, or just a rough coordinate. Or a way.
        // It is only used to move the map to the approximate location.
        "type": "Point",
        "coordinates": [174.922, -36.9]
      },
      "properties": {
        "__action": "delete" // required

        // there is no point in putting tags here, but you can. The system doesn't care.
      }
    }
  ]
}
```

# Tags

The `properties` of a geojson item must contain `__action`, unless you are creating a new feature. All other `properties` are OSM tags.

However, the tags are a **diff**. This means:

1. Any tags specified in the patch file will override the tag if it exists on the OSM feature, or add the tag if it doesn't exist.
2. Any tags that exist on the OSM feature, but not in `properties` will be retained.
3. To remove a tag, set the value to `🗑️`
