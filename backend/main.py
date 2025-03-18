import importlib.util


def is_package_installed(package_name: str) -> bool:
    spec = importlib.util.find_spec(package_name)
    if not spec:
        raise ImportError(f"{package_name} is not installed")

    return True


x = is_package_installed("paddle_billing")
print(x)
