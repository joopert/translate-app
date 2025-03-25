HTTP_ONLY	SECURE	SAME_SITE	DOMAIN	Cookie Access	Cross-Origin Requests	HTTPS Required	Use Case
TRUE	FALSE	lax	localhost	JS cannot read, browser sends	Same-origin + top-level navigation only	No	Standard secure cookies for localhost dev
TRUE	FALSE	strict	localhost	JS cannot read, browser sends	Same-origin requests only	No	Maximum security for localhost dev
TRUE	FALSE	none	localhost	JS cannot read, browser sends	All requests (including cross-origin)	No¹	Testing cross-origin on localhost
TRUE	TRUE	lax	localhost	JS cannot read, browser sends	Same-origin + top-level navigation only	Yes²	Simulating production on localhost with HTTPS
TRUE	TRUE	strict	localhost	JS cannot read, browser sends	Same-origin requests only	Yes²	Maximum security with HTTPS on localhost
TRUE	TRUE	none	localhost	JS cannot read, browser sends	All requests (including cross-origin)	Yes	Cross-origin testing with HTTPS on localhost
FALSE	FALSE	lax	localhost	JS can read, browser sends	Same-origin + top-level navigation only	No	When frontend needs to read token
FALSE	FALSE	strict	localhost	JS can read, browser sends	Same-origin requests only	No	Frontend reads token, high security
FALSE	FALSE	none	localhost	JS can read, browser sends	All requests (including cross-origin)	No¹	Frontend reads token, cross-origin testing
FALSE	TRUE	lax	localhost	JS can read, browser sends	Same-origin + top-level navigation only	Yes²	Frontend reads token, HTTPS simulation
FALSE	TRUE	strict	localhost	JS can read, browser sends	Same-origin requests only	Yes²	Frontend reads token, max security with HTTPS
FALSE	TRUE	none	localhost	JS can read, browser sends	All requests (including cross-origin)	Yes	Frontend reads token, cross-origin with HTTPS

# Important Notes
¹ SameSite=None without Secure: Modern browsers are increasingly requiring the Secure flag when SameSite=None, even on localhost. Chrome will accept this combination on localhost for development purposes, but other browsers might reject it.

² Secure flag on localhost: Normally requires HTTPS, but most browsers make an exception for localhost and will still set/send cookies with the Secure flag even over HTTP on localhost.

# Attribute Explanations:
HTTP_ONLY=true: JavaScript cannot access the cookie content (recommended for auth tokens)
HTTP_ONLY=false: JavaScript can read and manipulate the cookie
SECURE=true: Cookie only sent over HTTPS connections
SECURE=false: Cookie sent over both HTTP and HTTPS
SAME_SITE=strict: Cookie only sent for same-site requests
SAME_SITE=lax: Cookie sent for same-site requests and top-level navigations (clicks, form submissions)
SAME_SITE=none: Cookie sent for all requests, including cross-site (requires Secure=true in production)
DOMAIN=localhost: Cookie available across all subdomains of localhost regardless of port

# Recommended Combinations
Local Development: HTTP_ONLY=true, SECURE=false, SAME_SITE=lax, DOMAIN=localhost
Production: HTTP_ONLY=true, SECURE=true, SAME_SITE=lax, DOMAIN=yourdomain.com
Cross-Origin API in Production: HTTP_ONLY=true, SECURE=true, SAME_SITE=none, DOMAIN=api.yourdomain.com
