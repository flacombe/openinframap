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
    "pdm_boundary",
    {
        "boundary": ["administrative"]
    },
    "polygon",
    columns=[
        type_col,
        str_col("name"),
        int_col("admin_level")
    ],
)