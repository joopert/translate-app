import argparse
import json
import sys
from pathlib import Path

# Add the project root to sys.path to enable absolute imports
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from fastapi.openapi.utils import get_openapi  # noqa: E402

from backend.api import app  # noqa: E402
from backend.core.settings import settings  # noqa: E402


def output_openapi(output_path: str) -> None:
    with open(output_path, "w") as f:
        json.dump(
            get_openapi(
                title=app.title,
                version=app.version,
                openapi_version=app.openapi_version,
                description=app.description,
                routes=app.routes,
            ),
            f,
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "output_path",
        type=str,
        help="Path where the openapi.json file will be saved",
    )
    print(settings.api_root_path)
    args = parser.parse_args()

    output_openapi(args.output_path)
