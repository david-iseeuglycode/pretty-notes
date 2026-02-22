import { HttpInterceptorFn } from '@angular/common/http';

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'GET') return next(req);
  const token = getCsrfToken();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { 'X-CSRF-Token': token } }));
};
