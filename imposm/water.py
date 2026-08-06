from funcs import table, type_col, str_col

table(
    "water_treatment_plant",
    {"man_made": ["water_works", "desalination_plant"]},
    "polygon",
    columns=[type_col, str_col("name")],
)

table(
    "wastewater_plant",
    {"man_made": ["wastewater_plant"]},
    "polygon",
    columns=[type_col, str_col("name")],
)

table("water_tower", {"man_made": ["water_tower"]}, ["points", "polygons"])

table("water_well", {"man_made": ["water_well"]}, ["points", "polygons"])

table (
    "waterways",
    {"waterway": ["canal", "pressurised", "river", "stream", "ditch", "drain"]},
    "linestring",
    columns=[
        type_col,
        str_col("name"),
        str_col("usage"),
        str_col("operator"),
        str_col("man_made"),
        str_col("tunnel"),
        str_col("bridge"),
        str_col("intermittent"),
        str_col("diameter"),
        str_col("substance")
    ],
)

table(
    "waterways_obstacles",
    {"waterway": ["dam", "weir"]},
    ["linestrings","polygons"],
    columns=[
        type_col,
        str_col("name"),
        str_col("operator"),
        str_col("height")
    ],
)

table(
    "waterways_landmarks",
    {"waterway": ["waterfall"], "ford": ["yes"]},
    ["points"],
    columns=[
        str_col("waterway"),
        str_col("ford"),
        str_col("name"),
        str_col("height")
    ],
)

table(
    "waterbodies",
    {"water": ["reservoir", "basin", "pond", "wastewater"]},
    "polygon",
    columns=[
        str_col("name"),
        str_col("operator"),
        str_col("capacity"),
        str_col("water"),
        str_col("basin"),
        str_col("intermittent")
    ],
)
