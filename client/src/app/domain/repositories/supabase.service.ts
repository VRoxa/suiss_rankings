import { Injectable, inject } from "@angular/core";
import { createClient, SupabaseClient as Client } from "@supabase/supabase-js";
import { environment } from "../../environments/environment";
import { defer, from, map, Observable, shareReplay, startWith, Subject, switchMap, tap } from "rxjs";
import { FetchBackend } from "@angular/common/http";

type QueryResult<T> = {
    data: T[] | null,
    error: any
}

type AddingEntity<TEntity> = Omit<TEntity, 'id'>;

@Injectable({
    providedIn: 'root'
})
export class SupabaseClientProvider {
    private readonly _client: Client;

    constructor() {
        this._client = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    public get client() {
        return this._client;
    }
}

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {

    private readonly client = inject(SupabaseClientProvider).client;

    async add<TEntity>(tableName: string, record: AddingEntity<TEntity> | AddingEntity<TEntity>[]): Promise<any> {
        const { data, error } = await this.client
            .from(tableName)
            .insert(record);

        if (!!error) {
            console.error(`Error inserting new record to ${tableName}`, error);
            return null;
        }

        return data;
    }

    get<TEntity>(tableName: string): Observable<TEntity[]> {
        const changes$ = new Observable<void>(subscriber => {
            const channel = this.client.channel(`public:${tableName}`);
            const onChange$ = channel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tableName },
                (payload) => {
                    console.info(`Realtime change detected in ${tableName}:`, payload.eventType)
                    subscriber.next();
                }
            );

            const subscription = onChange$.subscribe((status, error) => {
                if (status === 'CHANNEL_ERROR' || !!error) {
                    subscriber.error(
                        new Error(`(${status}) Supabase Realtime Channel Error: ${error?.message}`)
                    );
                }
            });

            return () => {
                console.log(`Unsubscribing from Supabase channel: public:${tableName}`);
                subscription?.unsubscribe();
                this.client.removeChannel(channel);
            }
        });

        return changes$.pipe(
            startWith(void 0),
            switchMap(() => defer(() =>
                from(
                    this.client.from(tableName).select('*')
                )).pipe(
                    map(({ data, error }) => {
                        if (!!error) {
                            throw new Error(error.message);
                        }

                        return data || [];
                    }),
                )
            ),
            tap(x => console.log('received new data from table', tableName, x)),
            shareReplay({ bufferSize: 1, refCount: true })
        );
    }
}