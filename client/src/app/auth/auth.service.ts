import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom, tap } from 'rxjs';
import { AUTHENTICATE_FUNCTION_URL, AUTHORIZE_FUNCTION_URL } from './endpoints';

const JWT_STORAGE_KEY = 'jwt';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);

    private readonly _authorized$ = new BehaviorSubject<boolean>(false);

    get isAuthorized$() {
        return this._authorized$.asObservable();
    }

    get token() {
        return sessionStorage.getItem(JWT_STORAGE_KEY);
    }

    async checkInitialAuthorization() {
        const req$ = this.http
            .get<{ status: 'valid' }>(AUTHORIZE_FUNCTION_URL)
            .pipe(
                filter(({ status }) => status === 'valid'),
                tap(() => this._authorized$.next(true))
            );

        try {
            await firstValueFrom(req$);
            console.log('authorized');
        } catch (error: any) {
            console.error(error);
        }
    }

    async login(password: string): Promise<boolean> {
        const req$ = this.http
            .post<{ token: string }>(AUTHENTICATE_FUNCTION_URL, { password })
            .pipe(
                tap(({ token }) => {
                    sessionStorage.setItem(JWT_STORAGE_KEY, token);
                }),
                tap(() => {
                    this._authorized$.next(true);
                })
            );

        try {
            await firstValueFrom(req$);
            return true;
        } catch (error: any) {
            console.error(error);
            return false;
        }
    }

    logout() {
        sessionStorage.clear();
        this._authorized$.next(false);
    }
}
