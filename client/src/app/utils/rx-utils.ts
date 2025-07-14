import { combineLatest, filter, map, Observable, startWith, tap } from "rxjs"
import { QueryResult } from "../domain/repositories/types/supabase.types";

type ObservableResult<T> = {
    [Key in keyof T]: Observable<T[Key]>;
};

export const mergeToObject = <TResult>(source: ObservableResult<TResult>): Observable<TResult> => {
    const observables = Object.values(source) as Observable<any>[];
    return combineLatest([...observables]).pipe(
        map(values => Object
            .keys(source)
            .reduce(
                (acc, key, i) => ({
                    ...acc,
                    [key]: values[i]
                }), 
                {}
            ) as TResult)
    )
}

export const log = <T>(...messages: string[]) => {
    return (source: Observable<T>): Observable<T> => {
        return source.pipe(
            tap(x => console.info(...messages, x)),
        );
    }
}

export const loadingFromQuery = (source: Observable<QueryResult<any> | QueryResult<any>[]>) => {
    return source.pipe(
        map(data => {
            if (Array.isArray(data)) {
                return data.some(({loading}) => loading);
            }

            return data.loading;
        }),
        startWith(true),
    );
}
