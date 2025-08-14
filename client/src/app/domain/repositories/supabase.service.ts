import { Injectable, inject } from "@angular/core";
import { createClient, SupabaseClient as Client } from "@supabase/supabase-js";
import { defer, from, map, Observable, shareReplay, startWith, switchMap } from "rxjs";
import { AddingEntity, Entity, Query, QueryResult, TableName } from "./types/supabase.types";
import { DisposableSupabaseService } from "./disposable-supabase.service";

@Injectable({
    providedIn: 'root'
})
export class SupabaseClientProvider {
    private _client!: Client;

    get client() {
        return this._client;
    }

    initialize(
        supabaseUrl: string,
        supabaseKey: string,
    ) {
        this._client = createClient(
            supabaseUrl,
            supabaseKey,
        );
    }
}

@Injectable({
    providedIn: 'root'
})
export class SupabaseRepository {

    private readonly client = inject(SupabaseClientProvider).client;

    get disposable() {
        return new DisposableSupabaseService(this.client);
    }

    async update<TEntity extends Entity>(tableName: TableName, record: TEntity): Promise<void> {
        const { error } = await this.client
            .from(tableName)
            .update(record)
            .eq('id', record.id);

        if (!!error) {
            throw new Error(`Error updating record to ${tableName}. ${error.message}`);
        }
    }

    async add<TEntity>(tableName: TableName, record: AddingEntity<TEntity>): Promise<number> {
        const { error, data } = await this.client
            .from(tableName)
            .insert(record)
            .select('id');

        if (!!error) {
            throw new Error(`Error inserting new records to ${tableName}. ${error.message}`);
        }

        if (!data) {
            throw new Error(`Error updating table ${tableName}. Null data retruned`);
        }
        
        return data[0]?.id ?? 0;
    }

    async addAll<TEntity>(tableName: TableName, record: AddingEntity<TEntity>[]): Promise<number[]> {
        const { error, data } = await this.client
            .from(tableName)
            .insert(record)
            .select('id');

        if (!!error) {
            throw new Error(`Error inserting new records to ${tableName}. ${error.message}`);
        }

        if (!data) {
            throw new Error(`Error updating table ${tableName}. Null data retruned`);
        }

        return data.map(({ id }) => id);
    }

    getAll<TEntity>(tableName: TableName): Observable<QueryResult<TEntity>> {
        return this._get(
            tableName,
            builder => builder.select('*'),
        );
    }

    get<TEntity>(tableName: TableName, query: Query): Observable<QueryResult<TEntity>> {
        return this._get(tableName, query);
    }

    private _get<TEntity>(tableName: TableName, query: Query): Observable<QueryResult<TEntity>> {
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
            shareReplay(1),
            startWith(void 0), // Force trigger first data loading
            switchMap(() => defer(() =>
                from(
                    query(
                        this.client.from<string, TEntity>(tableName)
                    )
                )).pipe(
                    map<any, QueryResult<TEntity>>(({ data, error }) => {
                        if (!!error) {
                            throw new Error(error.message);
                        }

                        return {
                            data: data || [],
                            loading: false,
                        };
                    }),
                    startWith({
                        data: null,
                        loading: true,
                    }),
                )
            ),
            shareReplay(1)
        );
    }
}