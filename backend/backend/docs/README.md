.gitignore comes from [text](https://github.com/github/gitignore/blob/main/Python.gitignore)

# Add items to pyproject.toml

uv add paddle-python-sdk --optional paddle

uv add pycognito aioboto3 --optional cognito
uv add --group cognito types-aioboto3

uv add --dev ruff mypy



uv tree --outdated



in docker use uv sync --no-dev (dev would be installed by default)


core dependencies are always installed (those are used at runtime)
`uv sync --no-dev`

optional dependencies are installed with --extra (those are used at runtime)
`uv sync --extra auth-cognito --extra payments-polar --no-dev`

dev dependencies are installed with --dev (those are ONLY used at development time). Underneath will install core dependencies and dev deps
`uv sync`


optional dependencies AND their specific dev dependencies (so this points to project.optional-dependencies.auth-cognito dependency-groups.auth-cognito)
`uv sync --extra auth-cognito --group auth-cognito`

to install all extras and dev dependencies use:
`uv sync --all-packages`


use python 3.13 as venv
`uv venv --python 3.13`




# Getting Started
Install devbox
devbox shell
devbox run setup  # all deps are installed, complete codebase works now.
