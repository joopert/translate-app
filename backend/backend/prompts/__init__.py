from typing import Any

from jinja2 import StrictUndefined, Template

# from pydantic import BaseModel


def get_template(template_name: str, vars: dict[str, Any]) -> str:
    """Get and render a template with provided variables.

    Args:
        template_name: Name of the template or path to template file
        vars: Variables to use in the template rendering

    Returns:
        The rendered template as a string
    """
    print(vars)
    # Map template names to their full paths
    template_map = {
        "main": "backend/backend/prompts/main.jinja2",
    }

    # Get the full template path
    template_path = template_map.get(template_name, template_name)

    # Convert the model to a dictionary
    # template_vars = vars.model_dump()

    # Read and render the template
    with open(template_path) as f:
        template = Template(f.read(), undefined=StrictUndefined)

    return template.render(**vars)


# prompt = template.render(
#     context="https://example.com",
#     summary=True,
#     expertise_level="advanced",
#     additional_context="The user is interested in the technical aspects."
# )
