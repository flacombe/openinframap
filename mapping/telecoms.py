from funcs import (
    table,
    relation_tables,
    generalized_table,
    str_col,
    int_col,
    bool_col,
    type_col,
)


table(
    "telecom_cable",
    {
        "telecom": ["line", "cable"],
        "construction:telecom": ["line", "cable"],
    },
    "linestring",
    columns=[
        str_col("location"),
        str_col("operator"),
        type_col
    ],
)

table(
    "telecom_sites",
    {
        "telecom": ["data_center", "data_centre", "exchange", "connection_point", "distribution_point"]
    },
    ["points", "polygons"],
    columns=[
        str_col("operator"),
        str_col("connection_point"),
        str_col("ref"),
        type_col
    ],
)

table(
    "telecom_towers",
    {"man_made": ["mast", "tower", "communications_tower"]},
    "point",
    columns=[
        str_col("height"),
        str_col("operator"),
        type_col
    ],
)