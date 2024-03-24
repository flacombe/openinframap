from funcs import table, type_col, str_col

table(
    "marker",
    {"pipeline": ["marker"], "power": ["marker"], "marker": ["__any__"]},
    "point",
    columns=[type_col],
)

table(
    "pipeline",
    {"man_made": ["pipeline"], "construction:man_made": ["pipeline"]},
    "linestring",
    columns=[
        str_col("substance"),
        str_col("type"),
        str_col("construction:man_made", "construction"),
    ],
)

table(
    "petroleum_site",
    {
        "industrial": [
            "oil",
            "fracking",
            "oil_storage",
            "hydrocarbons",
            "oil sands",
            "oil_sands",
            "gas",
            "natural_gas",
            "wellsite",
            "well_cluster",
        ]
    },
    "polygon",
    columns=[
        str_col("operator"),
        str_col("utility"),
        str_col("ref"),
        type_col
    ],
)

table(
    "pipeline_gear",
    {"pipeline": ["valve", "flare", "surge_tank"]},
    "point",
    columns=[
        str_col("valve"),
        str_col("actuator"),
        str_col("handle"),
        str_col("operator"),
        type_col
    ],
)

table(
    "petroleum_well",
    {"man_made": ["petroleum_well", "oil_well"]},
    "point",
    columns=[type_col],
)

table(
    "pipeline_pumps",
    {"man_made": ["pump"]},
    "point",
    columns=[
        type_col,
        str_col("pump_mechanism"),
        str_col("mechanical_driver"),
        str_col("mechanical_coupling"),
        str_col("handle"),
        str_col("operator"),
        str_col("flow_rate"),
        str_col("pressure")
    ],
)