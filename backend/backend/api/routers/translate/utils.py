from beanie import Document
from cachetools import TTLCache  # type: ignore
from fastapi import Header, HTTPException
from pydantic import AnyUrl

from backend.core.settings import settings
from backend.core.settings.enums import Environment
from backend.utils.log import logger


class Site(Document):
    """Site model for storing registered domains and their siteIds"""

    domain: str  # example.com
    site_id: str  # random uuid
    owner_id: str | None = None  # tenant
    active: bool = True

    class Settings:
        name = "sites"

    @classmethod
    async def find_by_domain_and_site_id(cls, domain: str, site_id: str) -> "Site | None":
        """Find a site by domain and site_id"""
        return await cls.find_one({"domain": domain, "site_id": site_id, "active": True})

    @classmethod
    async def is_valid(cls, domain: str, site_id: str) -> bool:
        """Check if a domain and site_id combination is valid"""
        site: Site | None = await cls.find_by_domain_and_site_id(domain, site_id)
        return site is not None


site_cache: TTLCache[str, Site] = TTLCache(maxsize=1000, ttl=3600)  # Cache up to 1000 mappings for 1 hour


async def verify_site(
    x_site_id: str = Header(..., description="Site identifier")
    if settings.environment != Environment.LOCAL
    else Header(settings.widget.default_x_site_id, description="Site identifier"),
    origin: str | None = Header(None, description="Request origin"),
) -> Site:
    """Verify that the request is coming from a registered site"""
    logger.info(f"Verifying site {x_site_id=} from {origin=}")

    # Allow localhost for development
    if settings.environment == Environment.LOCAL:
        origin = settings.widget.default_origin
        logger.info("Local environment, skipping site verification")

    if not origin:
        raise HTTPException(status_code=403, detail="Invalid origin")

    origin_url = AnyUrl(origin)
    if not origin_url.host or "." not in origin_url.host:
        # does not contain a TLD, so people could do something like http://localhost which could have security issues.
        raise HTTPException(status_code=403, detail="Invalid origin")

    domain = origin_url.host
    logger.info(f"Found {domain=}/{x_site_id=}")

    site = site_cache.get(x_site_id)
    if site is None:
        # not found in cache, retrieve from db
        logger.info(f"Lookup {domain=}/{x_site_id=}")
        site = await Site.find_by_domain_and_site_id(domain, x_site_id)
        if not site:
            logger.info(f"Lookup {domain=}/{x_site_id=}: Not found")
            raise HTTPException(status_code=403, detail="Invalid site_id or domain")

        site_cache[x_site_id] = site

    if site.domain != domain:
        raise HTTPException(status_code=403, detail="Invalid site_id or domain")

    return site
