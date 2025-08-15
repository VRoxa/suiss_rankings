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
import { getConfiguration, saveConfiguration } from '../../domain/services/configuration.service';
import { Configuration } from '../models/configuration.model';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { FormsModule } from '@angular/forms';
import { exportData } from '../../domain/services/export-data.service';
import { importData } from '../../domain/services/import-data.service';

interface SettingsViewModel {
    configuration: Configuration;
    wippingDatabase: boolean;
    savingConfiguration: boolean;
    exportingData: boolean;
    importingData: boolean;
}

@Component({
    selector: 'sr-settings',
    imports: [
        CommonModule,
        FormsModule,
        NzFlexModule,
        NzButtonModule,
        NzIconModule,
        NzPopconfirmModule,
        NzSpinModule,
        NzSkeletonModule,
        NzDividerModule,
        NzInputNumberModule,
    ],
    providers: [NzNotificationService],
    template: `
        @if (vm$ | async; as vm) {
            <ng-template #configuration>
                <nz-input-number class="input"
                    [(ngModel)]="vm.configuration.goalsPerMatch"
                    nzMin="0"
                    nzMax="10"
                >
                    <span nzInputAddonBefore class="input__prefix">Goles por partida</span>
                </nz-input-number>

                 <nz-input-number class="input"
                    [(ngModel)]="vm.configuration.maxRounds"
                    nzMin="0"
                >
                    <span nzInputAddonBefore class="input__prefix">Rondas</span>
                </nz-input-number>

                <nz-input-number class="input"
                    [(ngModel)]="vm.configuration.knockoutRound"
                    nzMin="0"
                    [nzMax]="vm.configuration.maxRounds"
                >
                    <span nzInputAddonBefore class="input__prefix">Ronda de <i>knock-out</i></span>
                </nz-input-number>

                <nz-divider nzText="Puntuación"></nz-divider>

                <nz-input-number class="input"
                    [(ngModel)]="vm.configuration.scorePoints.fullWin"
                    nzMin="0"
                >
                    <span nzInputAddonBefore class="input__prefix">Victoria cruce</span>
                    <span nzInputAddonAfter>pts</span>
                </nz-input-number>

                <nz-input-number class="input"
                    [(ngModel)]="vm.configuration.scorePoints.winGame"
                    nzMin="0"
                >
                    <span nzInputAddonBefore class="input__prefix">Victoria partida</span>
                    <span nzInputAddonAfter>pts</span>
                </nz-input-number>

                <nz-input-number class="input"
                    [(ngModel)]="vm.configuration.scorePoints.loseGame"
                    nzMax="0"
                >
                    <span nzInputAddonBefore class="input__prefix">Derrota partida</span>
                    <span nzInputAddonAfter>pts</span>
                </nz-input-number>

                <nz-input-number class="input"
                    [(ngModel)]="vm.configuration.scorePoints.goalDifference"
                    nzMin="0"
                >
                    <span nzInputAddonBefore class="input__prefix">Diferencia de goles</span>
                    <span nzInputAddonAfter>pts</span>
                </nz-input-number>

                <div class="save-config">
                    <button nz-button
                        nzType="primary"
                        (click)="saveConfiguration(vm.configuration)"
                        [nzLoading]="vm.savingConfiguration"
                    >
                        Guardar configuración
                    </button>
                </div>
            </ng-template>

            @if (vm.savingConfiguration) {
                <nz-spin nzTip="Guardando configuración...">
                    <ng-container *ngTemplateOutlet="configuration"></ng-container>
                </nz-spin>
            }
            @else {
                <ng-container *ngTemplateOutlet="configuration"></ng-container>
            }

            <nz-divider nzText="Danger zone"></nz-divider>

            <div nz-flex [nzVertical]="true" nzAlign="center" nzGap="middle">
                <div nz-flex nzAlign="center" [style.width.%]="100" nzGap="small">
                    <button nz-button
                        nzType="primary"
                        [nzLoading]="vm.exportingData"
                        (click)="exportData()"
                    >
                        <nz-icon nzType="export" nzTheme="outline" />
                        {{ vm.exportingData ? 'Exportando datos...' : 'Exportar datos' }}
                    </button>

                    <button nz-button
                        nzType="primary"
                        [nzLoading]="vm.importingData"
                        (click)="importFileInput.click()"
                    >
                        {{ vm.exportingData ? 'Importando datos...' : 'Importar datos' }}
                        <nz-icon nzType="import" nzTheme="outline" />

                        <input type="file" #importFileInput hidden (change)="importData($event)">
                    </button>
                </div>

                <button
                    nz-button
                    nzDanger
                    nzType="primary"
                    [nzLoading]="vm.wippingDatabase"
                    nzSize="large"
                    nz-popconfirm
                    nzPopconfirmPlacement="bottom"
                    nzPopconfirmTitle="¿Borrar permanentemente todos los datos (parejas, rondas y cruces)?"
                    (nzOnConfirm)="wipeDatabase()"
                    [nzOkButtonProps]="{ nzDanger: true }"
                >
                    <nz-icon nzType="warning" nzTheme="fill" />
                    {{ vm.wippingDatabase ? 'Limpiando base de datos...' : 'Borrar datos' }}
                </button>
            </div>
        }
        @else {
            <div class="loading">
                <nz-spin>
                    <nz-skeleton />
                </nz-spin>
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

            .input {
                width: 100%;

                &__prefix {
                    display: block;
                    width: 10rem;
                    text-align: start;
                }
            }

            .save-config {
                display: flex;
                flex-direction: row-reverse;
                margin-top: 1rem;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent extends ExternalComponent {
    private readonly notification = inject(NzNotificationService);
    private readonly ref = inject(NzModalRef);

    wippingDatabase$$ = new BehaviorSubject<boolean>(false);
    savingConfiguration$$ = new BehaviorSubject<boolean>(false);
    exportingData$$ = new BehaviorSubject<boolean>(false);
    importingData$$ = new BehaviorSubject<boolean>(false);

    configuration$ = this.toService<Configuration>(getConfiguration);

    vm$ = mergeToObject<SettingsViewModel>({
        configuration: from(this.configuration$),
        wippingDatabase: this.wippingDatabase$$,
        savingConfiguration: this.savingConfiguration$$,
        exportingData: this.exportingData$$,
        importingData: this.importingData$$,
    });

    async wipeDatabase() {
        this.wippingDatabase$$.next(true);
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
                    { nzPlacement: 'bottom' },
                );
            } finally {
                this.wippingDatabase$$.next(false);
                this.ref.close();
            }
        });
    }

    async saveConfiguration(configuration: Configuration) {
        this.savingConfiguration$$.next(true);
        await this.toService(async () => {
            try {
                await saveConfiguration(configuration);

                this.notification.success('Configuración guardada correctamente', '', {
                    nzPlacement: 'bottom',
                });
            }
            catch (error) {
                console.error(error);
                this.notification.error(
                    'Ha ocurrido un error',
                    'No se ha guardado la configuración correctamente',
                    { nzPlacement: 'bottom' },
                );
            }
            finally {
                this.savingConfiguration$$.next(false);
            }
        });
    }
    
    async exportData() {
        this.exportingData$$.next(true);
        await this.toService(async () => {
            try {
                await exportData();

                this.notification.success('Datos exportados correctamente', '', {
                    nzPlacement: 'bottom',
                });
            }
            catch (error) {
                console.error(error);
                this.notification.error(
                    'Ha ocurrido un error',
                    'No se han podido exportar los datos correctamente',
                    { nzPlacement: 'bottom' },
                );
            }
            finally {
                this.exportingData$$.next(false);
            }
        });
    }

    async importData({ target }: Event) {
        this.importingData$$.next(true);
        await this.toService(async () => {
            try {
                const [file] = (target as HTMLInputElement).files!;
                await importData(file);

                this.notification.success('Datos importados correctamente', '', {
                    nzPlacement: 'bottom',
                });
            }
            catch (error) {
                console.error(error);
                this.notification.error(
                    'Ha ocurrido un error',
                    'No se han podido importar los datos correctamente',
                    { nzPlacement: 'bottom' },
                );
            }
            finally {
                this.importingData$$.next(false);
            }
        });
    }
}
