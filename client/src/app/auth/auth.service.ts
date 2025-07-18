import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { BehaviorSubject, firstValueFrom, tap } from "rxjs";

const AUTHENTICATE_FUNCTION_URL = '/.netlify/functions/authenticate';
const JWT_STORAGE_KEY = 'jwt';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly http = inject(HttpClient);

    private readonly _authorized$ = new BehaviorSubject<boolean>(false);

    get isAuthorized$() {
        return this._authorized$.asObservable();
    }

    public async login(password: string): Promise<boolean> {
        const req$ = this.http.post<{token: string}>(
            AUTHENTICATE_FUNCTION_URL,
            { password }
        ).pipe(
            tap(({ token }) => {
                sessionStorage.setItem(JWT_STORAGE_KEY, token);
            }),
            tap(() => {
                this._authorized$.next(true);
            }),
        );

        try {
            await firstValueFrom(req$);
            return true;
        }
        catch (error: any) {
            console.error(error);
            return false;
        }
    }

    public logout() {
        sessionStorage.clear();
        this._authorized$.next(false);
    }
}
