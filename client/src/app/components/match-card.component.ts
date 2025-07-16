import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    Injector,
    input,
} from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { PadTextPipe } from '../pipes/pad-text.pipe';
import { CommonModule } from '@angular/common';
import { MatchViewModel } from './models/rounds.view-model';
import {
    calculateScore,
    CountFor,
} from '../domain/services/score-calculator.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { log, mergeToObject, takeElementAt } from '../utils/rx-utils';
import { combineLatest, map } from 'rxjs';
import { isPromise } from 'rxjs/internal/util/isPromise';

interface MatchCardComponentViewModel {
    match: MatchViewModel;
    score1: number;
    score2: number;
    winner: 0 | 1 | 2;
}

@Component({
    selector: 'sr-match-card',
    imports: [CommonModule, NzCardModule, NzDividerModule, PadTextPipe],
    template: `
        @if (vm$ | async; as vm) {
            <div
                class="round-card"
                [ngClass]="{ 'finished-match': !vm.match.inProgress }"
            >
                <div class="round-card__teams">
                    <div class="teams__team1" [ngClass]="{ winner: vm.winner === 1 }">
                        @if (!vm.match.inProgress) {
                            <span class="team-score">{{ vm.score1 }}</span>
                        }
                        <span>
                            {{ vm.match.team1.name }}
                        </span>
                    </div>
                    <nz-divider nzType="horizontal"></nz-divider>
                    <div class="teams__team2" [ngClass]="{ winner: vm.winner === 2 }">
                        @if (!vm.match.inProgress) {
                            <span class="team-score">{{ vm.score2 }}</span>
                        }
                        <span>
                            {{ vm.match.team2.name }}
                        </span>
                    </div>
                </div>

                <nz-divider nzType="vertical"></nz-divider>

                <div class="round-card__scores">
                    <div class="scores__team1">
                        @for (score of vm.match.score; track $index; let i = $index) {
                            <div
                                [class]="[
                                    'scores__team1__' + i,
                                    score?.winner === 1 ? 'winner' : ''
                                ]"
                            >
                                <span>{{ score?.score1 ?? '' | pad }}</span>
                            </div>
                        }
                    </div>
                    <nz-divider nzType="horizontal"></nz-divider>
                    <div class="scores__team2">
                        @for (score of vm.match.score; track $index; let i = $index) {
                            <div
                                [class]="[
                                    'scores__team1__' + i,
                                    score?.winner === 2 ? 'winner' : ''
                                ]"
                            >
                                <span>{{ score?.score2 ?? '' | pad }}</span>
                            </div>
                        }
                    </div>
                </div>
            </div>
        }
        
    `,
    styles: [
        `
            .winner {
                color: var(--sr-primary);
                font-weight: bold;
            }

            .finished-match {
                background-color: var(--sr-lightgrey);
            }

            .round-card {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                margin: 0.5rem;
                border: 1px solid var(--sr-grey);
                border-radius: 0.5rem;

                &__teams {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 65%;
                    flex-grow: 1;

                    div[class^='teams__team'] {
                        padding: 0.5rem 0.5rem;
                        position: relative;
                        width: 100%;

                        .team-score {
                            position: absolute;
                            right: 0.5rem;
                        }
                    }
                }

                &__scores {
                    display: flex;
                    flex-direction: column;
                    width: 35%;

                    div[class^='scores__team'] {
                        display: flex;
                        justify-content: space-around;
                        align-items: center;

                        & > * {
                            padding: 0.25rem 0.5rem;
                            white-space: pre;
                        }
                    }
                }

                .ant-divider {
                    margin: 0 !important;
                    border-color: var(--sr-grey) !important;

                    &-vertical {
                        height: 5rem;
                    }
                }
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchCardComponent {
    private readonly injector = inject(Injector);
    readonly match = input.required<MatchViewModel>();
    match$ = toObservable(this.match, { injector: this.injector });

    scores$ = this.match$.pipe(
        map(({score}) => [
            calculateScore(score, CountFor.One),
            calculateScore(score, CountFor.Two),
        ]),
    );

    vm$ = mergeToObject<MatchCardComponentViewModel>({
        match: this.match$,
        score1: this.scores$.pipe(takeElementAt(0)),
        score2: this.scores$.pipe(takeElementAt(1)),
        winner: combineLatest([
            this.match$.pipe(map(({inProgress}) => inProgress)),
            this.scores$,
        ]).pipe(
            map(([inProgress, [score1, score2]]) => {
                if (inProgress) {
                    return 0;
                }

                // TODO - review for best loser and worst winner.
                return score1 > score2 ? 1 : 2;
            }),
        )
    }).pipe(log('match card'));
}
