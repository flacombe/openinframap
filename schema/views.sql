CREATE MATERIALIZED VIEW power_substation_relation AS
    SELECT rel.osm_id, ST_ConvexHull(ST_Union(mem.geometry))::geometry(Geometry,3857) AS geometry, rel.tags -> 'name' AS name,
        combine_voltage(rel.voltage, voltage_agg(mem.tags -> 'voltage')) AS voltage,
        rel.tags -> 'frequency' AS frequency,
        combine_field(rel.tags -> 'substation', field_agg(mem.tags -> 'substation')) AS substation,
        combine_field(rel.tags -> 'operator', field_agg(mem.tags -> 'operator')) AS operator,
	rel.tags, rel.construction
        FROM osm_power_substation_relation as rel, osm_power_substation_relation_member as mem
        WHERE mem.osm_id = rel.osm_id
        GROUP BY rel.osm_id, rel.tags -> 'name', rel.voltage, rel.tags -> 'frequency',
			rel.tags -> 'substation', rel.tags -> 'operator', rel.tags, rel.construction;

-- Unique index required for concurrent matview refresh
CREATE UNIQUE INDEX power_substation_relation_idx ON power_substation_relation(osm_id);
CREATE INDEX power_substation_relation_geom ON power_substation_relation USING GIST (geometry);

ANALYZE power_substation_relation;

CREATE OR REPLACE VIEW substation AS
    SELECT osm_id, geometry, tags -> 'name' AS name, voltage, substation, tags, construction
                  FROM osm_power_substation
    UNION ALL
    SELECT osm_id, geometry, name, voltage, substation, tags, construction
                  FROM power_substation_relation;

CREATE MATERIALIZED VIEW power_plant_relation AS
    SELECT rel.osm_id, simplify_boundary(ST_Collect(mem.geometry)) AS geometry, 
        (rel.tags -> 'name') AS name, rel.output, rel.source, rel.tags, rel.construction
        FROM osm_power_plant_relation as rel, osm_power_plant_relation_member as mem
        WHERE mem.osm_id = rel.osm_id
        GROUP BY rel.osm_id, rel.tags -> 'name', rel.output, rel.source, rel.tags, rel.construction;

-- Unique index required for concurrent matview refresh
CREATE UNIQUE INDEX power_plant_relation_idx ON power_plant_relation(osm_id);
CREATE INDEX power_plant_relation_geom ON power_plant_relation USING GIST (geometry);

ANALYZE power_plant_relation;

CREATE OR REPLACE VIEW power_plant AS
    SELECT osm_id, geometry, tags -> 'name' AS name, output, source, tags, construction
              FROM osm_power_plant
    UNION
    SELECT osm_id, geometry, name, output, source, tags, construction
              FROM power_plant_relation;

/* Projets enedis */
CREATE MATERIALIZED VIEW pdm_boundary AS 
  SELECT id, osm_id, type, name, admin_level, tags, geometry AS geom, ST_PointOnSurface(geometry)::GEOMETRY(Point, 3857) AS centre
  FROM osm_pdm_boundary
  WHERE admin_level IN (4, 6, 8);
  CREATE INDEX ON pdm_boundary using gist(geom);
  CREATE INDEX ON pdm_boundary using gist(centre);
  CREATE INDEX ON pdm_boundary using btree(osm_id);

CREATE MATERIALIZED VIEW pdm_project_poteaux AS 
  SELECT osm_primitive_id(osm_id, geometry) AS osm_id, osm_id AS gid, tags->'name' AS name, hstore_to_json(tags) AS tags, geometry AS geom
  FROM osm_power_tower 
  WHERE type IN ('pole', 'tower') AND tags->'operator'='Enedis' AND St_geometryType(geometry)='ST_Point';

CREATE VIEW pdm_project_poteaux_other AS 
  SELECT osm_primitive_id(osm_id, geometry) AS osm_id, osm_id AS gid, tags->'name' AS name, hstore_to_json(tags) AS tags, geometry AS geom
  FROM osm_power_tower 
  WHERE type IN ('pole', 'tower') AND tags->'operator' IS NOT NULL AND tags->'operator'!='Enedis' AND St_geometryType(geometry)='ST_Point';

CREATE VIEW pdm_project_poteaux_noop AS 
  SELECT osm_primitive_id(osm_id, geometry) AS osm_id, osm_id AS gid, tags->'name' AS name, hstore_to_json(tags) AS tags, geometry AS geom
  FROM osm_power_tower 
  WHERE type IN ('pole', 'tower') AND tags->'operator' IS NULL AND St_geometryType(geometry)='ST_Point';

  CREATE INDEX ON pdm_project_poteaux using gist(geom);
  CREATE INDEX ON pdm_project_poteaux using btree(osm_id);

CREATE MATERIALIZED VIEW pdm_project_substations AS 
  SELECT osm_id, gid, name, hstore_to_json(tags) AS tags, ST_Centroid(geometry) AS geom
  FROM (
    SELECT osm_primitive_id(osm_id, geometry) AS osm_id, osm_id AS gid, tags->'name' AS name, tags, geometry
    FROM osm_power_substation
    where tags->'operator'='Enedis' AND tags->'substation'='minor_distribution'
    UNION SELECT osm_primitive_id(osm_id, geometry) AS osm_id, osm_id AS gid, tags->'name' AS name, tags, geometry
    FROM osm_power_tower where tags->'operator'='Enedis' AND (tags->'substation'='minor_distribution' OR tags->'substation'='minor_distribution')
  ) data;

CREATE INDEX ON pdm_project_substations using gist(geom);
CREATE INDEX ON pdm_project_substations using btree(osm_id);

/* OpenInfraMap views */
CREATE OR REPLACE VIEW power_plant_relation_by_geom_type AS
    SELECT rel.osm_id, ST_Collect(mem.geometry) AS geometry,
        (rel.tags -> 'name') AS name, rel.output, rel.source, rel.tags, rel.construction
	FROM osm_power_plant_relation AS rel, osm_power_plant_relation_member AS mem
	WHERE mem.osm_id = rel.osm_id
	GROUP BY rel.osm_id, ST_GeometryType(mem.geometry), rel.tags -> 'name', rel.output, rel.source, rel.tags, rel.construction;


/* Dispatch power line query to the appropriate generalised table based on zoom. */
CREATE OR REPLACE FUNCTION power_lines(zoom INT, search_geom geometry) RETURNS
	TABLE (osm_id bigint,
		geometry geometry(LineString, 3857),
		type character varying,
		location character varying,
		line character varying,
		voltage character varying,
		circuits integer,
		frequency character varying,
		construction character varying,
		tunnel boolean,
		voltages REAL[],
		tags hstore)
	LANGUAGE plpgsql
AS $$
DECLARE
BEGIN
	IF zoom < 5 THEN
		RETURN QUERY SELECT osm_power_line_gen_500.osm_id, osm_power_line_gen_500.geometry, 
			osm_power_line_gen_500.type, osm_power_line_gen_500.location,
			osm_power_line_gen_500.line, osm_power_line_gen_500.voltage,
			osm_power_line_gen_500.circuits, osm_power_line_gen_500.frequency,
			osm_power_line_gen_500.construction, osm_power_line_gen_500.tunnel,
			line_voltages(osm_power_line_gen_500.voltage, osm_power_line_gen_500.circuits) AS voltages,
			osm_power_line_gen_500.tags
			FROM osm_power_line_gen_500
			WHERE osm_power_line_gen_500.geometry && search_geom;
	ELSIF zoom < 6 THEN
		RETURN QUERY SELECT osm_power_line_gen_100.osm_id, osm_power_line_gen_100.geometry, 
			osm_power_line_gen_100.type, osm_power_line_gen_100.location,
			osm_power_line_gen_100.line, osm_power_line_gen_100.voltage,
			osm_power_line_gen_100.circuits, osm_power_line_gen_100.frequency,
			osm_power_line_gen_100.construction, osm_power_line_gen_100.tunnel,
			line_voltages(osm_power_line_gen_100.voltage, osm_power_line_gen_100.circuits) AS voltages,
			osm_power_line_gen_100.tags
			FROM osm_power_line_gen_100
			WHERE osm_power_line_gen_100.geometry && search_geom;
	ELSE
		RETURN QUERY SELECT osm_power_line.osm_id, osm_power_line.geometry, 
			osm_power_line.type, osm_power_line.location, osm_power_line.line,
			osm_power_line.voltage, osm_power_line.circuits, osm_power_line.frequency,
			osm_power_line.construction, osm_power_line.tunnel,
			line_voltages(osm_power_line.voltage, osm_power_line.circuits) AS voltages,
			osm_power_line.tags
			FROM osm_power_line
			WHERE osm_power_line.geometry && search_geom;
	END IF;
END
$$;
