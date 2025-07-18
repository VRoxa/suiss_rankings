import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { BehaviorSubject } from 'rxjs';
import { mergeToObject } from '../utils/rx-utils';
import { environment } from '../../environments/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFlexModule } from 'ng-zorro-antd/flex';

interface AdminAccessButtonViewModel {
    wrongPassword: boolean;
    hidePassword: boolean;
    loading: boolean;
}

@Component({
    selector: 'sr-admin-access-button',
    imports: [
        CommonModule,
        NzFlexModule,
        NzButtonModule,
        NzIconModule,
        NzPopoverModule,
        NzInputModule,
    ],
    providers: [NzNotificationService],
    template: `
        @if (vm$ | async; as vm) {
            <button
                nz-button
                nzSize="small"
                nzShape="circle"

                nz-popover
                nzPopoverPlacement="bottomRight"
                nzPopoverTitle="Acceso administrador"
                [nzPopoverContent]="adminAccessPopover"
                [nzPopoverBackdrop]="true"
            >
                <nz-icon nzType="user-o"></nz-icon>
            </button>

            <ng-template #adminAccessPopover>
                <div nz-flex>
                    <nz-input-group
                        [nzSuffix]="passwordIcon"
                        [nzStatus]="vm.wrongPassword ? 'error' : ''"
                    >
                        <input
                            nz-input
                            #passwordInput
                            [type]="vm.hidePassword ? 'password' : 'text'"
                            placeholder="Contraseña"
                            (keyup)="onWrongPassword$$.next(false)"
                            (keyup.enter)="validatePassword(passwordInput.value)"
                        />
                    </nz-input-group>

                    <button
                        nz-button
                        nzType="primary"
                        (click)="validatePassword(passwordInput.value)"
                        [nzLoading]="vm.loading"
                        [nzDanger]="vm.wrongPassword"
                    >
                        <nz-icon nzType="vertical-left" />
                    </button>
                </div>
            </ng-template>

            <ng-template #passwordIcon>
                <nz-icon
                    [nzType]="vm.hidePassword ? 'eye' : 'eye-invisible'"
                    (click)="hidePassword$$.next(!vm.hidePassword)"
                />
            </ng-template>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAccessButtonComponent {
    private readonly notification = inject(NzNotificationService);

    onWrongPassword$$ = new BehaviorSubject<boolean>(false);
    hidePassword$$ = new BehaviorSubject<boolean>(true);
    manualLoading$$ = new BehaviorSubject<boolean>(false);

    vm$ = mergeToObject<AdminAccessButtonViewModel>({
        wrongPassword: this.onWrongPassword$$,
        hidePassword: this.hidePassword$$,
        loading: this.manualLoading$$,
    });

    validatePassword(password: string) {
        this.manualLoading$$.next(true);
        setTimeout(() => {
            const adminPassword = 'Test';

            if (password === adminPassword) {
                this.notification.success(
                    'Contraseña válida',
                    '',
                    { nzPlacement: 'bottom' }
                );

                // TODO - Store state and navigate to /
            } else {
                this.onWrongPassword$$.next(true);
                this.notification.error(
                    'Acceso denegado',
                    '',
                    { nzPlacement: 'bottom' }
                );
            }

            this.manualLoading$$.next(false);
        }, 1000);
    }
}
