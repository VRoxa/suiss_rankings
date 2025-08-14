import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { NzCollapseModule } from "ng-zorro-antd/collapse";
import { NzTableModule } from "ng-zorro-antd/table";
import { ExternalComponent } from "../../pages/abstractions/external";
import { from, map } from "rxjs";
import { Configuration } from "../models/configuration.model";
import { getConfiguration } from "../../domain/services/configuration.service";
import { mergeToObject } from "../../utils/rx-utils";

interface PointsTableValue {
    id: string;
    label: string;
    value: string;
}

interface InformationContentComponentViewModel {
    configuration: Configuration;
    pointsTableValues: PointsTableValue[];
}

@Component({
    imports: [CommonModule, NzCollapseModule, NzTableModule],
    template: `
        @if (vm$ | async; as vm) {
            El <b>sistema suizo</b> es un formato de torneo donde cada pareja
            compite en rondas. En lugar de eliminar a los jugadores después de un
            cruce, se emparejan en cada ronda según su rendimiento previo.<br />
            El principal objetivo es
            <i>que jugadores con resultados similares se enfrenten entre sí</i
            >.<br /><br />

            <h4><b>Rondas</b></h4>
            Se jugarán un total de ({{ vm.configuration.maxRounds }}) rondas.<br />
            Después de cada ronda, las parejas se clasificarán según su resultado
            (ver sección <a>Puntuación</a>).<br /><br />

            Al finalizar la ({{ vm.configuration.knockoutRound }}) ronda, 
            las ({{ vm.configuration.participantsToKnockout }}) parejas con menor puntuación
            serán eliminadas por <i>knockout</i>.<br /><br />
            
            Al finalizar la última ronda se
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
                [nzData]="vm.pointsTableValues"
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
                                <code>+{{vm.configuration.scorePoints.winGame * 2}}</code> 
                                (<code>{{vm.configuration.scorePoints.winGame}} * 2</code>)
                            </div>
                            <div class="addition__line-explanation">
                                partidas ganadas
                            </div>
                        </div>

                        <div class="addition__line">
                            <div class="addition__line-number">
                                <code>{{ vm.configuration.scorePoints.loseGame }}</code>
                            </div>
                            <div class="addition__line-explanation">
                                partida perdida
                            </div>
                        </div>

                        <div class="addition__line">
                            <div class="addition__line-number">
                                <code>+{{ vm.configuration.scorePoints.goalDifference * (6 - 2 + 3) }}</code> 
                                (<code>{{ vm.configuration.scorePoints.goalDifference }} * [+6 -2 +3]</code>)
                            </div>
                            <div class="addition__line-explanation">
                                diferencia de goles
                            </div>
                        </div>

                        <div class="addition__line">
                            <div class="addition__line-number">
                                <code>+{{ vm.configuration.scorePoints.fullWin }}</code>
                            </div>
                            <div class="addition__line-explanation">
                                cruce ganado
                            </div>
                        </div>

                        <div class="addition__result">
                            <code>+{{
                                (vm.configuration.scorePoints.winGame * 2) +
                                (vm.configuration.scorePoints.goalDifference * (6 - 2 + 3)) +
                                (vm.configuration.scorePoints.fullWin) +
                                (vm.configuration.scorePoints.loseGame)
                            }}</code>
                        </div>
                    </div>
                </nz-collapse-panel>

                <nz-collapse-panel nzHeader="Ejemplo de puntuación (2)">
                    La pareja pierde <code>8-10</code>, <code>6-10</code>.<br />

                    <div class="addition">
                        <div class="addition__line">
                            <div class="addition__line-number">
                                <code>{{ vm.configuration.scorePoints.loseGame * 2 }}</code>
                                (<code>{{ vm.configuration.scorePoints.loseGame }} * 2</code>)
                            </div>
                            <div class="addition__line-explanation">
                                partidas perdidas
                            </div>
                        </div>

                        <div class="addition__line">
                            <div class="addition__line-number">
                                <code>{{ vm.configuration.scorePoints.goalDifference * (-6) }}</code>
                                (<code>{{ vm.configuration.scorePoints.goalDifference }} * [-2 -4]</code>)
                            </div>
                            <div class="addition__line-explanation">
                                diferencia de goles
                            </div>
                        </div>

                        <div class="addition__result">
                            <code>{{
                                (vm.configuration.scorePoints.loseGame * 2) +
                                (vm.configuration.scorePoints.goalDifference * (-6))
                            }}</code>
                        </div>
                    </div>
                </nz-collapse-panel>
            </nz-collapse>

        }

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
export class InformationContentComponent extends ExternalComponent {

    configuration$ = from(this.toService<Configuration>(getConfiguration));

    vm$ = mergeToObject<InformationContentComponentViewModel>({
        configuration: this.configuration$,
        pointsTableValues: this.configuration$.pipe(
            map(({ scorePoints }) => [
                {
                    id: 'win-match',
                    label: 'Ganar cruce',
                    value: `+${scorePoints.fullWin}`,
                },
                {
                    id: 'win-game',
                    label: 'Ganar partida',
                    value: `+${scorePoints.winGame}`,
                },
                {
                    id: 'lose-game',
                    label: 'Perder partida',
                    value: `${scorePoints.loseGame}`,
                },
                {
                    id: 'difference',
                    label: 'Diferencia de goles',
                    value: `±${scorePoints.goalDifference}`,
                },
            ]),
        ),
    });
}
