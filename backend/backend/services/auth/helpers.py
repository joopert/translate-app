import secrets
import string


def generate_password(length: int | None = None) -> str:
    if length is None:
        length = 12

    # Define character sets
    letters = string.ascii_letters
    digits = string.digits
    symbols = "!@#$%^&*"

    # Generate password ensuring at least one symbol
    # First, generate one symbol
    password = [secrets.choice(symbols)]

    # Generate remaining characters
    all_chars = letters + digits + symbols
    password.extend(secrets.choice(all_chars) for _ in range(length - 1))

    # Shuffle to make sure the symbol isn't always first
    password_list = list(password)
    secrets.SystemRandom().shuffle(password_list)

    return "".join(password_list)
