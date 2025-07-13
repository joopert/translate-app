from urllib.parse import urlparse


def basic_normalize(url: str):
    # Add protocol if missing
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed = urlparse(url)

    # Remove www
    hostname = parsed.hostname.replace("www.", "") if parsed.hostname else ""

    # Reconstruct with normalized hostname
    return f"{parsed.scheme}://{hostname}{parsed.path}"
