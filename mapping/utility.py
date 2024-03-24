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
    "utility_support",
    {
        "man_made": ["utility_pole"],
        "construction:man_made": ["utility_pole"],
    },
    "point",
    columns=[
        type_col,
        bool_col("location:transition", "transition"),
        str_col("construction:power", "construction"),
    ],
)

table(
    "utility_marker",
    {"marker": ["__any__"]},
    "point",
    columns=[
        str_col("utility"),
        str_col("colour"),
        str_col("material"),
        type_col
    ],
)