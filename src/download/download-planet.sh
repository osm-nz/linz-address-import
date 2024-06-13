mkdir -p data
cd data
rm -rf osm.pbf

PLANET_URL="http://download.geofabrik.de/australia-oceania/new-zealand-latest.osm.pbf"

curl -L $PLANET_URL --output osm.pbf
