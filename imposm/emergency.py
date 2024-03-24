from funcs import table, type_col, str_col

table(
    "emer_firestations",
    {"amenity": ["fire_station"]},
    ["points", "polygons"],
    columns=[
        type_col,
        str_col("name"),
        str_col("short_name"),
        str_col("fire_station:type:FR"),
        str_col("operator"),
        str_col("ref"),
        str_col("ref:FR:SDIS:GRPT"),
        str_col("ref:FR:SDIS:CIE"),
        str_col("ref:FR:SDIS:PC_CIE"),
        str_col("ref:FR:SDIS:EM_GRPT"),
        str_col("ref:FR:SDIS")
    ],
)

table(
    "emer_hydrants",
    {"emergency": ["fire_hydrant"]},
    "point",
    columns=[
        type_col,
        str_col("fire_hydrant:type"),
        str_col("operator"),
        str_col("ref"),
        str_col("fire_hydrant:position"),
        str_col("fire_hydrant:diameter"),
        str_col("flow_rate"),
        str_col("water_source")
    ],
)

table(
    "emer_aed",
    {"emergency": ["defibrillator"]},
    "point",
    columns=[
        str_col("name"),
        str_col("operator"),
        str_col("defibrillator"),
        str_col("access"),
        str_col("location"),
        str_col("defibrillator:location"),
        str_col("description"),
        str_col("indoor")
    ],
)