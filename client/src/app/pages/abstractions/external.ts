import { inject, Injector, runInInjectionContext } from "@angular/core";

export abstract class ExternalComponent {
    protected readonly injector = inject(Injector);

    protected async toService(fn: () => void): Promise<void>;
    protected async toService<T>(fn: () => T): Promise<T>;
    protected async toService<T>(fn: () => Promise<T>): Promise<T>;

    protected async toService<T>(
        fn: () => void | T | Promise<T>
    ): Promise<T | void> {
        const result = await runInInjectionContext(this.injector, fn);
        return result;
    }
}
