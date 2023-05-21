DROP VIEW IF EXISTS substation;
DROP MATERIALIZED VIEW IF EXISTS power_substation_relation;

DROP VIEW IF EXISTS power_plant;
DROP MATERIALIZED VIEW IF EXISTS power_plant_relation;

/* Projects enedis */
DROP MATERIALIZED VIEW pdm_boundary CASCADE;
DROP MATERIALIZED VIEW pdm_project_poteaux;
DROP VIEW pdm_project_poteaux_other;
DROP VIEW pdm_project_poteaux_noop;
DROP MATERIALIZED VIEW pdm_project_substations;