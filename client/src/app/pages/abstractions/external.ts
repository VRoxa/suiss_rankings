import { inject, Injector, runInInjectionContext } from "@angular/core";

export abstract class ExternalComponent {
    protected readonly injector = inject(Injector);

    protected async toService<T>(
        fn: () => void | Promise<T>
    ): Promise<T | void> {
        const result = await runInInjectionContext(this.injector, fn);
        if (result) {
            return result;
        }
    }
}
