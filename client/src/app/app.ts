import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AdminAccessButtonComponent } from './components/admin-access-button.component';
import { SettingsComponent } from './components/dialogs/settings.component';

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
                    (click)="openInfoModal()"
                >
                    <nz-icon nzType="question-o"></nz-icon>
                </button>

                <button
                    nz-button
                    nzSize="small"
                    nzShape="circle"
                    (click)="openSettingsModal()"
                >
                    <nz-icon nzType="setting"></nz-icon>
                </button>

                <sr-admin-access-button />
            </div>
        </div>

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
    readonly modal = inject(NzModalService);
    readonly router = inject(Router);

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
                maxHeight: '70vh',
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
            }]
        });
    }
}

@Component({
    imports: [CommonModule, NzCollapseModule, NzTableModule],
    template: `
        El <b>sistema suizo</b> es un formato de torneo donde cada pareja
        compite en rondas. En lugar de eliminar a los jugadores después de un
        cruce, se emparejan en cada ronda según su rendimiento previo.<br />
        El principal objetivo es
        <i>que jugadores con resultados similares se enfrenten entre sí</i
        >.<br /><br />

        <h4><b>Rondas</b></h4>
        Se jugarán un total de seis rondas.<br />
        Después de cada ronda, las parejas se clasificarán según su resultado
        (ver sección <a>Puntuación</a>).<br /><br />

        Al finalizar la cuarta ronda, las cuatro parejas con menor puntuación
        serán eliminadas por <i>knockout</i>.<br /><br />
        
        Al finalizar la sexta ronda se
        determinará la clasificación del torneo en base a los puntos acumulados
        de cada pareja.<br /><br />

        <h4><b>Emparejamientos</b></h4>
        Una vez establecida la clasificación después de cada ronda, se
        emparejará a la pareja en la posición #1 con la pareja en la
        posición #2, #3 con #4, #5 con #6, etc.<br /><br />

        Los enfrentamientos de la primera ronda son decididos completamente
        al azar.<br /><br />

        <h4><b>Puntuación</b></h4>
        Cada ronda puntuará según el resultado, siguiendo los siguientes
        criterios:<br />

        <nz-table
            #points
            [nzData]="pointsCriteria"
            [nzShowPagination]="false"
            nzBordered
        >
            <thead></thead>
            <tbody>
                @for (criteria of points.data; track criteria.id) {
                <tr>
                    <td>{{ criteria.label }}</td>
                    <td>
                        <code>{{ criteria.value }}</code>
                    </td>
                </tr>
                }
            </tbody>
        </nz-table>

        <nz-collapse>
            <nz-collapse-panel nzHeader="Ejemplo de puntuación (1)">
                La pareja gana <code>10-4</code>, <code>8-10</code>,
                <code>10-7</code>.<br />

                <div class="addition">
                    <div class="addition__line">
                        <div class="addition__line-number">
                            <code>+100</code> (<code>50 * 2</code>)
                        </div>
                        <div class="addition__line-explanation">
                            partidas ganadas
                        </div>
                    </div>

                    <div class="addition__line">
                        <div class="addition__line-number">
                            <code>-50</code>
                        </div>
                        <div class="addition__line-explanation">
                            partida perdida
                        </div>
                    </div>

                    <div class="addition__line">
                        <div class="addition__line-number">
                            <code>+70</code> (<code>10 * [+6 -2 +3]</code>)
                        </div>
                        <div class="addition__line-explanation">
                            diferencia de goles
                        </div>
                    </div>

                    <div class="addition__line">
                        <div class="addition__line-number">
                            <code>+60</code>
                        </div>
                        <div class="addition__line-explanation">
                            cruce ganado
                        </div>
                    </div>

                    <div class="addition__result">
                        <code>+180</code>
                    </div>
                </div>
            </nz-collapse-panel>

            <nz-collapse-panel nzHeader="Ejemplo de puntuación (2)">
                La pareja pierde <code>8-10</code>, <code>6-10</code>.<br />

                <div class="addition">
                    <div class="addition__line">
                        <div class="addition__line-number">
                            <code>-100</code> (<code>-50 * 2</code>)
                        </div>
                        <div class="addition__line-explanation">
                            partidas perdidas
                        </div>
                    </div>

                    <div class="addition__line">
                        <div class="addition__line-number">
                            <code>-60</code> (<code>10 * [-2 -4]</code>)
                        </div>
                        <div class="addition__line-explanation">
                            diferencia de goles
                        </div>
                    </div>

                    <div class="addition__result">
                        <code>-160</code>
                    </div>
                </div>
            </nz-collapse-panel>
        </nz-collapse>

        En caso de <code>9-9</code> en la partida decisiva, la victoria se
        decidirá a diferencia de dos goles. El resultado final computará como
        <code>10-9</code>.
    `,
    styles: [
        `
            .addition {
                margin-top: 0.5rem;
                display: flex;
                flex-direction: column;

                &__line {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    &-explanation {
                        font-style: italic;
                        font-size: 0.6rem;
                        
                    }
                }

                &__result {
                    border-top: 1px solid black;
                    font-weight: bold;
                }
            }
        `,
    ],
})
export class InformationContentComponent {
    pointsCriteria = [
        {
            id: 'win-match',
            label: 'Ganar cruce',
            value: '+60',
        },
        {
            id: 'win-game',
            label: 'Ganar partida',
            value: '+50',
        },
        {
            id: 'lose-game',
            label: 'Perder partida',
            value: '-50',
        },
        {
            id: 'difference',
            label: 'Diferencia de goles',
            value: '±10',
        },
    ];
}
