import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExternalComponent } from '../pages/abstractions/external';
import { mergeToObject } from '../utils/rx-utils';
import { BehaviorSubject } from 'rxjs';
import { NzButtonModule } from "ng-zorro-antd/button";
import { CommonModule } from '@angular/common';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { rollbackRound } from '../domain/services/rollback-round.service';
import { Router } from '@angular/router';

type RollbackRoundButtonComponentViewModel = {
    rollingBack: boolean;
}

@Component({
    selector: 'sr-rollback-button',
    imports: [
        CommonModule,
        NzButtonModule,
        NzPopconfirmModule,
    ],
    providers: [NzNotificationService],
    template: `
        @if (vm$ | async; as vm) {
            <button nz-button
                nzType="primary"
                nzShape="round"
                nzDanger
                [nzLoading]="vm.rollingBack"

                nz-popconfirm
                nzPopconfirmPlacement="bottomRight"
                nzPopconfirmTitle="¿Hacer rollback? Se elmininará la ronda actual."
                (nzOnConfirm)="rollbackRound()"
                [nzOkButtonProps]="{ nzDanger: true }"
            >
                Rollback
            </button>
        }
    `,
    styles: [``],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RollbackRoundButtonComponent extends ExternalComponent {
    private readonly notification = inject(NzNotificationService);
    private readonly router = inject(Router);
    
    rollingBack$$ = new BehaviorSubject<boolean>(false);

    vm$ = mergeToObject<RollbackRoundButtonComponentViewModel>({
        rollingBack: this.rollingBack$$,
    });

    async rollbackRound() {
        this.rollingBack$$.next(true);
        await this.toService(async () => {
            try {
                await rollbackRound();
                this.notification.success('Rollback completado', '', {
                    nzPlacement: 'bottom',
                });

                this.router.navigate(['/participants']);
            } catch (error) {
                console.error(error);
                this.notification.error(
                    'Ha ocurrido un error',
                    'No se ha podido completar el rollback de la ronda actual',
                    { nzPlacement: 'bottom' },
                );
            } finally {
                this.rollingBack$$.next(false);
            }
        })
    }
}
