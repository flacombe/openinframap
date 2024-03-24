# OpenInfraMap Database

The OpenInfraMap database is a subset of OSM replicated by [imposm3](https://imposm.org).

## DB Setup
### Development
There's a Docker Compose file in the root of the repository which is primarily intended for testing
new Imposm configuration. If you're just testing changes to the live website or styles, there's no
need to run this - you can just use the live tileserver.

You'll need an OSM export file in PBF format. You're probably best off using a Geofabrik subset
rather than the full planet for testing.

First, start the DB container:

    docker compose up db

This will also create the "osm" database and import [functions.sql](../schema/functions.sql).

Now you can run imposm to import the data:

    docker compose run --rm --build -v $PWD/greater-london-latest.osm.pbf:/data.osm.pbf imposm import -connection postgis://osm:osm@db/osm -mapping /mapping.json -read /data.osm.pbf -write -optimize -deployproduction

Now create the views from [views.sql](../schema/views.sql) - you can open the postgres console with:

    docker compose exec db psql -U osm osm

### Production
Production config is likely to be more complex and I can't provide support for it. (The live 
OpenInfraMap instance is run as containers using Kubernetes.)

I suggest creating separate Postgres user accounts for imposm and for the tile server.

## Additional data
The [web backend](../web-backend) requires country EEZ boundaries to be imported into the `countries`
schema in the same database as the OSM data, so that offshore wind farms can be attributed to the
correct country. These are sourced from the marineregions.org
[Marine and Land Zones](https://marineregions.org/sources.php#unioneezcountry) dataset.

    shp2pgsql -s 4326 -d ./EEZ_land_union_v4_202410.shp countries.country_eez > ./country_eez.sql

We create a materialized view from this, using `ST_Subdivide` to improve indexing performance:

    CREATE MATERIALIZED VIEW countries.country_eez_sub AS
    SELECT country_eez.gid,
        country_eez."union",
        country_eez.mrgid_eez,
        country_eez.territory1,
        country_eez.mrgid_ter1,
        country_eez.iso_ter1,
        country_eez.iso_sov1,
        country_eez.pol_type,
        ST_Subdivide(ST_Transform(country_eez.geom, 3857)) AS geom
    FROM countries.country_eez
    WHERE country_eez."union"::text <> 'Antarctica'::text;

    CREATE INDEX country_eez_sub_geom ON countries.country_eez_sub USING GIST (geom);
    CREATE INDEX country_eez_sub_iso_sov1 ON countries.country_eez_sub(iso_sov1);
    CREATE INDEX country_eez_sub_iso_ter1 ON countries.country_eez_sub(iso_ter1);

    CREATE MATERIALIZED VIEW countries.country_eez_3857 AS
    SELECT country_eez.gid,
        country_eez."union",
        country_eez.mrgid_eez,
        country_eez.territory1,
        country_eez.mrgid_ter1,
        country_eez.iso_ter1,
        country_eez.iso_sov1,
        country_eez.pol_type,
        ST_Transform(country_eez.geom, 3857) AS geom
    FROM countries.country_eez
    WHERE country_eez."union"::text <> 'Antarctica'::text;

    CREATE INDEX country_eez_3857_geom ON countries.country_eez_3857 USING GIST (geom);
This is a Docker implementation to run imposm3 both in import or coninuous update for [OpenInfraMap](https://openinframap.org).

## Build

Build is done using the provided Dockerfile at the root of this repository (not in this directory).

```
docker build -f Dockerfile -t oim/imposm3:latest .
```

Build script will produce an up to date `mapping.json` file according to mapping python files.  
There is no need to generate this file manually.

Imposm version is defined by the base image usedin this project.  
See https://github.com/openinframap/imposm3-docker

## Volumes

Imposm3 stores its cache, expire and diff resources in `/data/files/imposm3` directory that should be a shared volume.

Mounted directory can be owned by any user and must be owner by 10001 group as well. It requires to have write group privilege.

## Run

This image can be run in two different modes.

### Import

A one-shot run that use a pbf file to import it in a Postgresql database with postgis enabled.  

To import a new pbf file from an URL
```
docker run -it --rm --name=imposm -v /data/files/imposm3:/data/files/imposm3 --network=oim-internal -e DB_URL=postgres://user:password@pgsqldb:5432/database -e OSM_FILE=https://download.geofabrik.de/europe/france-latest.osm.pbf oim/imposm3:latest import
```

To only refresh the database with existing pbf file
```
docker run -it --rm --name=imposm -v /data/files/imposm3:/data/files/imposm3 --network=oim-internal -e DB_URL=postgres://user:password@pgsqldb:5432/database oim/imposm3:latest import
```

* DBURL: A valid connection string to reach postgresql backend
* OSM_FILE: A valid URL to download a fresh pbf file to import in the postgresql backend

### Update

Continuous update takes minute diffs from main osm servers and update the previously imported postgresql database.

```
docker run -d --rm --name=imposm -v /data/files/imposm3:/data/files/imposm3 --network=oim-internal -e DB_URL=postgres://user:password@pgsqldb:5432/database oim/imposm3:latest run
```

Update container normally runs continously. To reload database, kill it first before running import one.  
Update container have to be relaunched once import finished. 
