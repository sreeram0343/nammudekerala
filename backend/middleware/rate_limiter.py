import time
from typing import Dict, Tuple
from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse

class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_tokens: int = 100, refill_rate: float = 2.0):
        """
        Token Bucket Rate Limiter.
        max_tokens: Maximum capacity of the bucket per IP.
        refill_rate: Tokens added per second.
        """
        super().__init__(app)
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate  # tokens per second
        self.buckets: Dict[str, Tuple[float, float]] = {}  # ip -> (current_tokens, last_update_time)

    def _get_current_tokens(self, ip: str) -> float:
        now = time.time()
        if ip not in self.buckets:
            self.buckets[ip] = (float(self.max_tokens), now)
            return float(self.max_tokens)

        tokens, last_update = self.buckets[ip]
        # Calculate how many tokens were generated since last request
        elapsed = now - last_update
        new_tokens = min(float(self.max_tokens), tokens + elapsed * self.refill_rate)
        self.buckets[ip] = (new_tokens, now)
        return new_tokens

    async def dispatch(self, request: Request, call_next):
        # Allow websockets and static uploads to bypass rate limiting
        if request.url.path == "/ws" or request.url.path.startswith("/uploads"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        
        tokens = self._get_current_tokens(client_ip)
        
        if tokens < 1.0:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. You have hit our production rate limit. Please wait and try again."
                }
            )
            
        # Consume 1 token
        current_tokens, last_update = self.buckets[client_ip]
        self.buckets[client_ip] = (current_tokens - 1.0, last_update)
        
        response = await call_next(request)
        return response
