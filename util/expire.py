from pathlib import Path
import subprocess
import os

pathlist = Path("/home/osm/imposm-expire").glob("**/*.tiles")
for path in pathlist:
    print(path)
    subprocess.run(
        [
            "/home/osm/go/bin/tegola",
            "cache",
            "purge",
            "tile-list",
            path,
            "--config",
            "/home/osm/styles/config.toml",
            "--max-zoom",
            "17",
            "--min-zoom",
            "7",
        ]
    )
    os.remove(path)
