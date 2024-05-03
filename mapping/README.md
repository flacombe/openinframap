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