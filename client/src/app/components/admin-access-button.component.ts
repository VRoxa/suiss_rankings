import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { BehaviorSubject, map, merge, Subject } from 'rxjs';
import { mergeToObject } from '../utils/rx-utils';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { AuthService } from '../auth/auth.service';

interface AdminAccessButtonViewModel {
    isAuthorized: boolean;
    wrongPassword: boolean;
    hidePassword: boolean;
    loading: boolean;
    popoverClosed: boolean;
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
                [nzType]="vm.isAuthorized ? 'primary' : 'default'"

                nz-popover
                nzPopoverPlacement="bottomRight"
                nzPopoverTitle="Acceso administrador"
                [nzPopoverContent]="adminAccessPopover"
                [nzPopoverVisible]="vm.popoverClosed"
                (nzPopoverVisibleChange)="popoverVisible$$.next($event)"
                [nzPopoverBackdrop]="true"
            >
                <nz-icon nzType="user-o"></nz-icon>
            </button>

            <ng-template #adminAccessPopover>
                @if (vm.isAuthorized) {
                    <button
                        nz-button
                        (click)="logout()"
                        nzDanger
                    >
                        Salir de modo administrador
                        <nz-icon nzType="user-delete"/>
                    </button>
                }
                @else {
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
                                (keyup)="vm.wrongPassword && onWrongPassword$$.next(false)"
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

                    <ng-template #passwordIcon>
                        <nz-icon
                            [nzType]="vm.hidePassword ? 'eye' : 'eye-invisible'"
                            (click)="hidePassword$$.next(!vm.hidePassword)"
                        />
                    </ng-template>
                }
            </ng-template>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAccessButtonComponent {
    private readonly notification = inject(NzNotificationService);
    private readonly auth = inject(AuthService);

    onWrongPassword$$ = new BehaviorSubject<boolean>(false);
    hidePassword$$ = new BehaviorSubject<boolean>(true);
    manualLoading$$ = new BehaviorSubject<boolean>(false);
    popoverVisible$$ = new BehaviorSubject<boolean>(false);
    closePopover$$ = new Subject<void>();

    vm$ = mergeToObject<AdminAccessButtonViewModel>({
        isAuthorized: this.auth.isAuthorized$,
        wrongPassword: this.onWrongPassword$$,
        hidePassword: this.hidePassword$$,
        loading: this.manualLoading$$,
        popoverClosed: merge(
            this.popoverVisible$$,
            this.closePopover$$.pipe(map(() => false)),
        ),
    });

    async validatePassword(password: string) {
        this.manualLoading$$.next(true);
        const valid = await this.auth.login(password);
        this.manualLoading$$.next(false);

        if (valid) {
            this.notification.success(
                'Contraseña válida',
                '',
                { nzPlacement: 'bottom' }
            );

            this.closePopover$$.next();
            return;
        }

        this.onWrongPassword$$.next(true);
        this.notification.error(
            'Acceso denegado',
            '',
            { nzPlacement: 'bottom' }
        );
    }

    logout() {
        this.auth.logout();
        this.closePopover$$.next();
    }
}
