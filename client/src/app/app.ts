import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AdminAccessButtonComponent } from './components/admin-access-button.component';
import { SettingsComponent } from './components/dialogs/settings.component';
import { AuthService } from './auth/auth.service';
import { mergeToObject } from './utils/rx-utils';
import { ParticipantPerformanceComponent } from './components/dialogs/participant-performance.component';
import { InformationContentComponent } from './components/dialogs/information-content.component';

interface AppViewModel {
    isAuthorized: boolean;
}

@Component({
    selector: 'app-root',
    imports: [
    AdminAccessButtonComponent,
    RouterOutlet,
    RouterModule,
    CommonModule,
    NzMenuModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzPopoverModule,
    NzInputModule,
],
    template: `
        @if (vm$ | async; as vm) {
            <div class="header">
                <ul nz-menu nzMode="horizontal">
                    <li nz-menu-item>
                        <a routerLink="/participants">Clasificación</a>
                    </li>
                    <li nz-menu-item>
                        <a routerLink="/round">Rondas</a>
                    </li>
                </ul>
    
                <div class="header__buttons">

                    <button
                        nz-button
                        nzSize="small"
                        nzShape="circle"
                        (click)="openParticipantPerformance()"    
                    >
                        <nz-icon nzType="line-chart"/>
                    </button>

                    <button
                        nz-button
                        nzSize="small"
                        nzShape="circle"
                        (click)="openInfoModal()"
                    >
                        <nz-icon nzType="question-o"></nz-icon>
                    </button>
    
                    @if (vm.isAuthorized) {
                        <button
                            nz-button
                            nzSize="small"
                            nzShape="circle"
                            (click)="openSettingsModal()"
                        >
                            <nz-icon nzType="setting"></nz-icon>
                        </button>
                    }
    
                    <sr-admin-access-button />
                </div>
            </div>
        }

        <router-outlet></router-outlet>
    `,
    styles: [
        `
            html,
            body {
                margin: 0;
                padding: 0;
                height: 100vh;
                width: 100vw;
            }

            app-root {
                display: block;
                height: 100vh;
                width: 100vw;
                position: fixed;
                top: 0;
                left: 0;
            }

            router-outlet {
                height: 100%;
                width: 100%;
                box-sizing: border-box;
            }

            .header {
                position: sticky;
                top: 0;
                z-index: 999; // NzModal backdrop is z-index 1000, so just below that.
                background-color: var(--sr-background-default);

                display: flex;
                justify-content: space-between;
                align-items: center;

                &__buttons {
                    margin-right: 1rem;

                    & > * {
                        margin: 0 0.25rem;
                    }
                }
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
    private readonly auth = inject(AuthService);
    private readonly modal = inject(NzModalService);
    private readonly router = inject(Router);

    vm$ = mergeToObject<AppViewModel>({
        isAuthorized: this.auth.isAuthorized$,
    });

    public async openParticipantPerformance() {
        const ref = this.modal.create({
            nzTitle: `Estadísticas`,
            nzContent: ParticipantPerformanceComponent,
            nzFooter: [{
                label: 'Cerrar',
                onClick: () => ref.close(),
            }],
            nzBodyStyle: {
                maxHeight: '65vh',
                overflowY: 'auto',
            },
        });
    }

    openInfoModal() {
        const ref = this.modal.create({
            nzTitle: 'Información de formato',
            nzContent: InformationContentComponent,
            nzCentered: true,
            nzFooter: [
                {
                    label: 'Cerrar',
                    type: 'default',
                    onClick: () => ref.close(),
                },
            ],
            nzBodyStyle: {
                maxHeight: '65vh',
                overflowY: 'auto',
            },
        });
    }

    openSettingsModal() {
        const ref = this.modal.create({
            nzTitle: 'Configuración',
            nzContent: SettingsComponent,
            nzFooter: [{
                label: 'Cerrar',
                onClick: () => ref.close(),
            }],
            nzBodyStyle: {
                maxHeight: '65vh',
                overflowY: 'auto',
            },
        });
    }
}
