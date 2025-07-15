import { SupabaseClient } from "@supabase/supabase-js";

export type Entity = {
    id: number;
}

export type TableName = 'participant' | 'match' | 'round';

export type QueryResult<T> = {
    loading: boolean;
    data: T[] | null;
}

export type AddingEntity<TEntity> = Omit<TEntity, 'id'>;

export type ClientFromType = ReturnType<SupabaseClient['from']>;
export type Query = (builder: ClientFromType) => ReturnType<ClientFromType['select']> | ReturnType<ReturnType<ClientFromType['select']>['single']>
