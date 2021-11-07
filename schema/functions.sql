CREATE EXTENSION IF NOT EXISTS intarray;
CREATE EXTENSION IF NOT EXISTS hstore;

-- Drop all views here so that imposm3 can swap tables around
DROP VIEW IF EXISTS substation;
DROP VIEW IF EXISTS power_plant;
DROP MATERIALIZED VIEW IF EXISTS power_substation_relation;
DROP MATERIALIZED VIEW IF EXISTS power_plant_relation;

-- Convert a power value into a numeric value in watts
CREATE OR REPLACE FUNCTION convert_power(value TEXT) RETURNS NUMERIC IMMUTABLE RETURNS NULL ON NULL INPUT AS $$
DECLARE
  parts TEXT[];
  val NUMERIC;
BEGIN
  parts := regexp_matches(upper(value), '([0-9]+[\.,]?[0-9]*)[ ]?([KMG]?W)?', '');
  val := replace(parts[1], ',', '.');
  IF parts[2] = 'KW' THEN
    val := val * 1e3;
  ELSIF parts[2] = 'MW' THEN
    val := val * 1e6;
  ELSIF parts[2] = 'GW' THEN
    val := val * 1e9;
  END IF;
  RETURN val;
END
$$ LANGUAGE plpgsql;

-- Select the highest voltage from a semicolon-delimited list
CREATE OR REPLACE FUNCTION convert_voltage(value TEXT) RETURNS NUMERIC IMMUTABLE RETURNS NULL ON NULL INPUT AS $$
DECLARE
  parts TEXT[];
BEGIN
  parts := regexp_matches(value, '([0-9][0-9\.,]+)[;]?.*', '');
  RETURN replace(parts[1], ',', '.');
END
$$ LANGUAGE plpgsql;

-- Get the nth element of a semicolon-delimited list
CREATE OR REPLACE FUNCTION nth_semi(input TEXT, index INTEGER) RETURNS TEXT IMMUTABLE AS $$
DECLARE
    parts TEXT[];
BEGIN
    parts = string_to_array(input, ';');
    RETURN parts[index];
END
$$ LANGUAGE plpgsql;

-- Get the first element of a semicolon-delimited list
CREATE OR REPLACE FUNCTION first_semi(input TEXT) RETURNS TEXT IMMUTABLE AS $$
DECLARE
    parts TEXT[];
BEGIN
    parts = string_to_array(input, ';');
    RETURN parts[1];
END
$$ LANGUAGE plpgsql;

-- Return an array of voltage values (in kV) for a power line
CREATE OR REPLACE FUNCTION line_voltages(voltage TEXT, circuits INTEGER)
RETURNS INTEGER[] IMMUTABLE
AS $$
DECLARE
    parts TEXT[];
    voltage_int INTEGER;
    retval INTEGER[];
BEGIN
    parts = string_to_array(voltage, ';');
    IF array_length(parts::anyarray, 1) > 1 THEN
	FOR I IN array_lower(parts::anyarray, 1)..array_upper(parts::anyarray, 1) LOOP
	  retval[I] = convert_voltage(parts[I]) / 1000;
	END LOOP;
    ELSIF circuits IS NOT NULL THEN
	voltage_int = convert_voltage(voltage) / 1000;
	FOR I IN 1..circuits LOOP
	  retval[I] = voltage_int;
	END LOOP;
    ELSE
	retval[1] = convert_voltage(voltage) / 1000;
    END IF;

    return retval;
END
$$ LANGUAGE plpgsql;

-- Combine two voltage fields into one
CREATE OR REPLACE FUNCTION combine_voltage(a TEXT, b TEXT) RETURNS TEXT IMMUTABLE AS $$
DECLARE
    parts INT[];
BEGIN
    parts = string_to_array(a, ';')::INT[];
    parts = array_cat(parts, string_to_array(b, ';')::INT[]);
    RETURN array_to_string(uniq(sort_desc(parts)), ';');
END
$$ LANGUAGE plpgsql;

-- Aggregate to combine voltages into one delimited voltage field
DROP AGGREGATE IF EXISTS voltage_agg(TEXT);
CREATE AGGREGATE voltage_agg (TEXT)
(
    sfunc = combine_voltage,
    stype = TEXT,
    initcond = ''
);

-- Combine two fields with a semicolon
CREATE OR REPLACE FUNCTION combine_field(a TEXT, b TEXT) RETURNS TEXT IMMUTABLE AS $$
DECLARE
BEGIN
    IF a = '' OR a IS NULL THEN
        RETURN b;
    ELSIF b = '' OR b IS NULL THEN
        RETURN a;
    END IF;
    RETURN a || ';' || b;   
END
$$ LANGUAGE plpgsql;

DROP AGGREGATE IF EXISTS field_agg(TEXT);
CREATE AGGREGATE field_agg (TEXT)
(
    sfunc = combine_field,
    stype = TEXT,
    initcond = ''
);

CREATE OR REPLACE FUNCTION plant_label(name TEXT, output TEXT, source TEXT) RETURNS TEXT IMMUTABLE AS $$
DECLARE
    out_v INTEGER;
BEGIN
    out_v = round(convert_power(output) / 1e6);
    IF name = '' THEN
        RETURN '';
    ELSIF name != '' AND output = '' AND source = '' THEN
        RETURN name;
    ELSIF name != '' AND output != '' AND source = '' THEN
        RETURN name || E'\n (' || out_v || ' MW)';
    ELSE
        RETURN name || E'\n (' || source || ', ' || out_v || ' MW)';
    END IF;
END
$$ LANGUAGE plpgsql;

-- Get the area of a geometry in square meters.
CREATE OR REPLACE FUNCTION area_sqm(geom GEOMETRY) RETURNS DOUBLE PRECISION IMMUTABLE AS $$
DECLARE
BEGIN
	IF ST_GeometryType(geom) != 'ST_Polygon' THEN
		RETURN 0;
	END IF;
	RETURN ST_Area(Geography(ST_Transform(geom, 4326)));
END
$$ LANGUAGE plpgsql;


-- Estimate the output of a generator:type=solar (in watts) from its geometry.
CREATE OR REPLACE FUNCTION solar_output(geom GEOMETRY) RETURNS DOUBLE PRECISION IMMUTABLE AS $$
DECLARE
BEGIN
	IF ST_GeometryType(geom) = 'ST_Point' THEN
		RETURN 4000; -- Assume point generators have a fixed output of 4 kW
	END IF;
	RETURN area_sqm(geom) * 150; -- 150 W/m^2
END
$$ LANGUAGE plpgsql;

-- Convert a number of modules (as text) into an output (in watts)
CREATE OR REPLACE FUNCTION modules_output(modules TEXT) RETURNS DOUBLE PRECISION IMMUTABLE RETURNS NULL ON NULL INPUT AS $$
DECLARE
BEGIN
	BEGIN
		RETURN modules::INTEGER * 700;
	EXCEPTION WHEN OTHERS THEN
		RETURN NULL;
	END;
END
$$ LANGUAGE plpgsql;

-- Rendering functions

create or replace function ZRes (z integer)
    returns float
    returns null on null input
    language sql immutable as
$func$
select (40075016.6855785/(256*2^z));
$func$;

create or replace function ZRes (z float)
    returns float
    returns null on null input
    language sql immutable as
$func$
select (40075016.6855785/(256*2^z));
$func$;

create or replace function osm_url (tags HSTORE)
    returns text
    immutable
    returns null on null input AS $$
SELECT COALESCE(tags -> 'website', tags -> 'contact:website', tags -> 'url');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION osm_primitive_id(osm_id BIGINT, geom geometry) RETURNS varchar LANGUAGE plpgsql
AS $$
DECLARE
BEGIN
  IF osm_id < 0 THEN
    RETURN CONCAT('relation/', -osm_id);
  ELSIF St_GeometryType(geom)='ST_Point' THEN 
    RETURN CONCAT('node/', osm_id);
  ELSE
    RETURN CONCAT('way/', osm_id);
  END IF;
END
$$;


-- Generate the outline of a distributed power plant
-- ST_ConcaveHull can fail on some geometries. This function tries it, but falls back to a simple buffer otherwise.
create or replace function simplify_boundary (geometry geometry)
    returns geometry
    immutable
    returns null on null input as $$
begin
	return st_buffer(st_concavehull(geometry, 0.95), 10);
EXCEPTION
	WHEN SQLSTATE 'XX000' THEN
		RETURN st_buffer(geometry, 10);
end
$$ language plpgsql;
