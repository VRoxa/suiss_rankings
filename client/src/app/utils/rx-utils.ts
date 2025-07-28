import {
    combineLatest,
    filter,
    iif,
    map,
    Observable,
    startWith,
    switchMap,
    tap,
} from 'rxjs';
import { QueryResult } from '../domain/repositories/types/supabase.types';
import { Predicate } from '@angular/core';

type ObservableResult<T> = {
    [Key in keyof T]: Observable<T[Key]>;
};

export const mergeToObject = <TResult>(
    source: ObservableResult<TResult>
): Observable<TResult> => {
    const observables = Object.values(source) as Observable<any>[];
    return combineLatest([...observables]).pipe(
        map(
            (values) =>
                Object.keys(source).reduce(
                    (acc, key, i) => ({
                        ...acc,
                        [key]: values[i],
                    }),
                    {}
                ) as TResult
        )
    );
};

export const log = <T>(...messages: string[]) => {
    return (source: Observable<T>): Observable<T> => {
        return source.pipe(tap((x) => console.info(...messages, x)));
    };
};

export const loadingFromQuery = (
    source: Observable<QueryResult<any> | QueryResult<any>[]>
) => {
    return source.pipe(
        map((data) => {
            if (Array.isArray(data)) {
                return data.some(({ loading }) => loading);
            }

            return data.loading;
        }),
        startWith(true)
    );
};

export const dataFromQuery = <T>(
    source: Observable<QueryResult<T>>
): Observable<T[]> => {
    return source.pipe(
        map(({data}) => data),
        filter((data): data is T[] => !!data),
    );
}

export const sswitch = <TSource, TResult = TSource>(
    condition: Predicate<TSource>,
    whenTrue: (value: TSource) => Observable<TResult>,
    whenFalse: (value: TSource) => Observable<TResult>
) => {
    return (source: Observable<TSource>): Observable<TResult> => {
        return source.pipe(
            switchMap((value) =>
                iif(() =>
                    condition(value),
                    whenTrue(value),
                    whenFalse(value)
                )
            )
        );
    };
};

export const takeElementAt = <T>(index: number) => {
    return (source: Observable<T[]>): Observable<T> => {
        return source.pipe(map((collection) => collection[index]));
    };
};
