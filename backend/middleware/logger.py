import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("nammude_kerala")

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time_ms = (time.time() - start_time) * 1000
        client_ip = request.client.host if request.client else "unknown"
        
        logger.info(
            f"[{client_ip}] {request.method} {request.url.path} "
            f"- Status: {response.status_code} "
            f"({process_time_ms:.1f}ms)"
        )
        
        return response
