from funcs import (
    table,
    relation_tables,
    generalized_table,
    str_col,
    int_col,
    bool_col,
    type_col
)


table(
    "landuse_forests",
    {
        "landuse": ["forest"],
        "natural": ["wood"]
    },
    "polygon",
    columns=[
        type_col,
        str_col("name"),
        str_col("leaf_type"),
        str_col("leaf_cycle")
    ],
)