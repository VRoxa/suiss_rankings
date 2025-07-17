import { inject, Injector, runInInjectionContext } from "@angular/core";

export abstract class ExternalComponent {
    protected readonly injector = inject(Injector);

    protected async toService(
        fn: () => void | Promise<void>
    ): Promise<void> {
        await runInInjectionContext(this.injector, fn);
    }
}
