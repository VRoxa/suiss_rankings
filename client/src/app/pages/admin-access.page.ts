import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzIconModule } from "ng-zorro-antd/icon";
import { BehaviorSubject } from "rxjs";
import { mergeToObject } from "../utils/rx-utils";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzMessageService } from "ng-zorro-antd/message";
import { environment } from "../environments/environment";

interface AdminAccessPageViewModel {
    wrongPassword: boolean;
    adminAccess: boolean;
    hidePassword: boolean;
    loading: boolean;
}

@Component({
    selector: 'sr-admin-access',
    imports: [
        CommonModule,
        NzButtonModule,
        NzIconModule,
        NzInputModule,
    ],
    providers: [
        NzMessageService,
    ],
    template: `
        @if (vm$ | async; as vm) {
            <div class="container">
                <div class="container__admin">
                    <button
                        nz-button
                        nzSize="large"
                        nzType="primary"
                        (click)="onAdminAcess$$.next(true)"
                    >
                        Acceder como administrador
                    </button>

                    @if (vm.adminAccess) {
                        <div class="container__admin-input">
                            <nz-input-group [nzSuffix]="passwordIcon" [nzStatus]="vm.wrongPassword ? 'error' : ''">
                                <input nz-input
                                    #passwordInput
                                    [type]="vm.hidePassword ? 'password' : 'text'"
                                    placeholder="Contraseña"
                                    (keyup)="onWrongPassword$$.next(false)"
                                    (keyup.enter)="validatePassword(passwordInput.value)"
                                />
                            </nz-input-group>

                            <button nz-button
                                nzType="primary"
                                (click)="validatePassword(passwordInput.value)"
                                [nzLoading]="vm.loading"
                                [nzDanger]="vm.wrongPassword"
                            >
                                <nz-icon nzType="vertical-left"/>
                            </button>
                        </div>
                    }

                </div>

                <button
                    nz-button
                    nzSize="large"
                    nzType="text"
                >
                    Continuar como jugador
                    <nz-icon nzType="vertical-left"></nz-icon>
                </button>
            </div>

            <ng-template #passwordIcon>
                <nz-icon
                    [nzType]="vm.hidePassword ? 'eye' : 'eye-invisible'"
                    (click)="hidePassword$$.next(!vm.hidePassword)"
                />
            </ng-template>
        }
    `,
    styles: [
        `
            .container {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 3rem;

                height: 70%;
                width: 100%;

                padding: 0 5rem;

                &__admin {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;

                    &-input {
                        display: flex;
                        width: 100%;
                    }
                }
            }
        `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAccessPage {
    private readonly message = inject(NzMessageService);

    onWrongPassword$$ = new BehaviorSubject<boolean>(false);
    onAdminAcess$$ = new BehaviorSubject<boolean>(false);
    hidePassword$$ = new BehaviorSubject<boolean>(true);
    manualLoading$$ = new BehaviorSubject<boolean>(false);

    vm$ = mergeToObject<AdminAccessPageViewModel>({
        wrongPassword: this.onWrongPassword$$,
        adminAccess: this.onAdminAcess$$,
        hidePassword: this.hidePassword$$,
        loading: this.manualLoading$$,
    });

    validatePassword(password: string) {
        this.manualLoading$$.next(true);
        setTimeout(() => {
            const { adminPassword } = environment;
            
            if (password === adminPassword) {
                this.message.success('Contraseña válida');

                // TODO - Store state and navigate to /
            }
            else {
                this.onWrongPassword$$.next(true);
                this.message.error('Contraseña inválida');
            }

            this.manualLoading$$.next(false);
        }, 1000);
    }
}
