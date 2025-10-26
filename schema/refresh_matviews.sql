/* OpenInfraMap */
REFRESH MATERIALIZED VIEW CONCURRENTLY power_plant_relation;
REFRESH MATERIALIZED VIEW CONCURRENTLY power_substation_relation;

/* gespot */
UPDATE osm_power_line SET tags=(tags::hstore - 'circuits'::text) where tags->'circuits' !~ '^ *[-+]?[0-9]*([.][0-9]+)?[0-9]*(([eE][-+]?)[0-9]+)? *$';

/* PDM enedis */
REFRESH MATERIALIZED VIEW pdm_boundary;
REFRESH MATERIALIZED VIEW pdm_project_poteaux;
REFRESH MATERIALIZED VIEW pdm_project_substations;

/* PDM FTTH */
REFRESH MATERIALIZED VIEW pdm_project_connpoints;
REFRESH MATERIALIZED VIEW pdm_project_exchanges;