import { SupabaseClient } from "@supabase/supabase-js";
import { Query, TableName } from "./types/supabase.types";

export class DisposableSupabaseService {

    constructor(private readonly client: SupabaseClient) {}

    get raw() {
        return this.client;
    }
    
    getAll<TEntity>(tableName: TableName): Promise<TEntity[]> {
        return this._get(
            tableName,
            builder => builder.select('*'),
        );
    }

    get<TEntity>(tableName: TableName, query: Query): Promise<TEntity[]> {
        return this._get(tableName, query);
    }

    private _get<TEntity>(tableName: TableName, query: Query): Promise<TEntity[]> {
        return new Promise((resolve, reject) => {
            const builder = this.client.from(tableName);
            query(builder).then(({error, data}) => {
                if (!!error) {
                    reject(error);
                }
    
                resolve((data || []) as TEntity[]);
            });
        });
    }
}