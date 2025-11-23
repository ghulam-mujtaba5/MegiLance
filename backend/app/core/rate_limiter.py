# @AI-HINT: Simple rate limiter for API endpoints
# Stub for now - can be enhanced later with Redis/SlowAPI

from functools import wraps


def api_rate_limit(*args, **kwargs):
    """Stub rate limiter decorator - does nothing for now"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    
    # Handle both @api_rate_limit and @api_rate_limit()
    if len(args) == 1 and callable(args[0]):
        return decorator(args[0])
    return decorator
