import {
    APP_INITIALIZER,
    ApplicationConfig,
    inject,
    provideAppInitializer,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { SupabaseClientProvider } from './domain/repositories/supabase.service';
import { firstValueFrom, tap } from 'rxjs';

registerLocaleData(es);

const initializeSupabaseClient = async () => {
    const http = inject(HttpClient);
    const clientProvider = inject(SupabaseClientProvider);

    const req$ = http.get<{
        supabaseKey: string,
        supabaseUrl: string
    }>('/.netlify/functions/provide-credentials').pipe(
        tap(credentials => {
            const { supabaseKey, supabaseUrl } = credentials;
            clientProvider.initialize(supabaseUrl, supabaseKey);
        }),
    );

    await firstValueFrom(req$);
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes, withComponentInputBinding()),
        provideNzI18n(es_ES),
        provideAnimationsAsync(),
        provideHttpClient(withFetch()),
        SupabaseClientProvider,
        provideAppInitializer(initializeSupabaseClient),
    ],
};
