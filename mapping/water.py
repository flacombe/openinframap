from funcs import table, type_col, str_col

table(
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

table(
    "inlets",
    {"inlet": ["__any__"]},
    "point",
    columns=[
        type_col,
        str_col("name"),
        str_col("operator"),
        str_col("height"),
        str_col("width"),
        str_col("length"),
        str_col("diameter"),
        str_col("substance"),
        str_col("flow_rate"),
        str_col("actuator"),
        str_col("handle")
    ],
)

table(
    "outlets",
    {"outlet": ["__any__"]},
    "point",
    columns=[
        type_col,
        str_col("name"),
        str_col("operator"),
        str_col("height"),
        str_col("width"),
        str_col("length"),
        str_col("diameter"),
        str_col("substance"),
        str_col("flow_rate"),
        str_col("actuator"),
        str_col("handle")
    ],
)