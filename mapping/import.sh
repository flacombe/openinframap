#!/bin/bash

# Provide DB connection string for host
if [ -z $1 ]; then
    echo "Please provide DB connection string for host"
    exit 1
fi
if [ -z $2 ]; then
    echo "Please provide DB connection string for docker"
    exit 1
fi

# Update OSM data
if [ ! -z $3 ]; then
    rm -f /data/files/imposm3/osm.pbf
    curl -o /data/files/imposm3/osm.pbf $3
fi

# Views cleanup
psql -d $1 -f ../schema/functions.sql
psql -d $1 -f ../schema/views_clean.sql

# Imposm3 import
docker run --rm --name=imposm_import -v /opt/openinframap/imposm3:/opt/imposm3 -v /data/files/imposm3:/data/files/imposm3 --network=oim-internal oim/imposm3:latest import -connection $2 -deployproduction -config /opt/imposm3/imposm.conf -read /data/files/imposm3/osm.pbf -write -optimize -overwritecache -diff

# Views install
psql -d $1 -f ../schema/views.sql

echo "Import finished, now launch imposm container for contiuous updates"