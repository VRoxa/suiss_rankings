import { inject, Injector, runInInjectionContext } from "@angular/core";

export abstract class ExternalComponent {
    protected readonly injector = inject(Injector);

    protected toService(
        fn: () => void | Promise<void>
    ) {
        runInInjectionContext(this.injector, fn);
    }
}
