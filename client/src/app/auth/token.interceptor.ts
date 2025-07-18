import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { AUTHORIZE_FUNCTION_URL } from './endpoints';
import { throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
    if (req.url !== AUTHORIZE_FUNCTION_URL) {
        return next(req);
    }
    
    const auth = inject(AuthService);
    const token = auth.token;
    if (!token) {
        return throwError(() => new Error('Could not authorize. JWT token not found'))
    }

    return next(req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
        },
    }));
};
