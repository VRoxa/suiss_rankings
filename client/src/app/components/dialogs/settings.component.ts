import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { BehaviorSubject, from } from 'rxjs';
import { mergeToObject } from '../../utils/rx-utils';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { ExternalComponent } from '../../pages/abstractions/external';
import { resetDatabase } from '../../domain/services/reset-database.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { getConfiguration } from '../../domain/services/configuration.service';
import { Configuration } from '../models/configuration.model';

interface SettingsViewModel {
    configuration: Configuration;
    loading: boolean;
}

@Component({
    selector: 'sr-settings',
    imports: [
        CommonModule,
        NzFlexModule,
        NzButtonModule,
        NzIconModule,
        NzPopconfirmModule,
    ],
    providers: [NzNotificationService],
    template: `
        @if (vm$ | async; as vm) {
            <div nz-flex [nzVertical]="true" nzAlign="center">
                <button
                    nz-button
                    nzDanger
                    nzType="primary"
                    nzShape="round"
                    [nzLoading]="vm.loading"
                    nzSize="large"
                    nz-popconfirm
                    nzPopconfirmPlacement="bottom"
                    nzPopconfirmTitle="¿Borrar permanentemente todos los datos (parejas, rondas y cruces)?"
                    (nzOnConfirm)="wipeDatabase()"
                    [nzOkButtonProps]="{ nzDanger: true }"
                >
                    <nz-icon nzType="warning" nzTheme="fill" />
                    {{ vm.loading ? 'Limpiando base de datos...' : 'Borrar datos' }}
                </button>
            </div>
        }
    `,
    styles: [
        `
            // NOTE - Revisit the need of ::ng-deep
            ::ng-deep .cdk-overlay-pane {
                max-width: 85%;

                .ant-popover-inner-content {
                    width: 100%;
                }
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent extends ExternalComponent {
    private readonly notification = inject(NzNotificationService);
    private readonly ref = inject(NzModalRef);

    manualLoading$$ = new BehaviorSubject<boolean>(false);

    configuration$ = this.toService<Configuration>(getConfiguration);

    vm$ = mergeToObject<SettingsViewModel>({
        configuration: from(this.configuration$),
        loading: this.manualLoading$$,
    });

    async wipeDatabase() {
        this.manualLoading$$.next(true);
        await this.toService(async () => {
            try {
                await resetDatabase();
                this.notification.success('Datos borrados correctamente', '', {
                    nzPlacement: 'bottom',
                });
            } catch (error) {
                console.error(error);
                this.notification.error(
                    'Ha ocurrido un error',
                    'No se han borrado los datos, o han sido borrados parcialmente',
                    { nzPlacement: 'bottom' }
                );
            } finally {
                this.manualLoading$$.next(false);
                this.ref.close();
            }
        });
    }
}
