import time
import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
 
from app.database.database import SessionLocal   
from app.repositories import monitoring_repository as repo
from app.utils.monitoring_alerts import check_and_alert_error_rate  
 

SKIP_PATTERNS = [re.compile(r"^/api/health"), re.compile(r"^/docs"), re.compile(r"^/openapi.json")]
 
SENSITIVE_KEYS = ("password", "token", "secret", "authorization", "card")
 
 
def _sanitize(detail: str) -> str:
    if not detail:
        return detail
    lowered = detail.lower()
    if any(k in lowered for k in SENSITIVE_KEYS):
        return "Request failed (details redacted)"
    return detail[:500]
 
 
class PerformanceLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if any(p.match(request.url.path) for p in SKIP_PATTERNS):
            return await call_next(request)
 
        start = time.time()
        error_detail = None
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            status_code = 500
            error_detail = str(exc)
            response = None
 
        elapsed_ms = int((time.time() - start) * 1000)
 
    
        user = getattr(request.state, "current_user", None)
        company_id = user.get("company_id") if user else None
        user_id = user.get("user_id") if user else None
 
        db = SessionLocal()
        try:
            repo.log_api_performance(
                db, endpoint=request.url.path, method=request.method,
                status_code=status_code, response_time_ms=elapsed_ms,
                company_id=company_id, user_id=user_id,
                error_detail=_sanitize(error_detail) if error_detail else None,
            )
 
            if status_code >= 500:
                repo.record_error(
                    db, category="API", component=request.url.path,
                    message=_sanitize(error_detail) or f"HTTP {status_code}",
                    severity="High" if status_code >= 500 else "Medium",
                    endpoint_or_job=f"{request.method} {request.url.path}",
                    company_id=company_id,
                )
 
            check_and_alert_error_rate(db, company_id)
        finally:
            db.close()
 
        if response is None:
            raise exc  
        return response