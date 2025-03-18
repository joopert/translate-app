"""Helper utilities for working with Beanie ODM."""

from typing import TypeVar, cast

from beanie import Document, Link

T = TypeVar("T", bound=Document)


def create_link_beanie_workaround(document: T) -> Link[T]:
    """
    Create a link to a document that satisfies both type checking and runtime.
    This is a helper function that handles the mismatch between Beanie's type
    annotations (which use Link[T]) and runtime behavior (which accepts T directly).
    Args:
        document: The document to link to
    Returns:
        A properly typed link to the document for type checking purposes
    """
    # This function just returns the document itself, but with the correct
    # type annotation to satisfy the type checker
    return cast(Link[T], document)
