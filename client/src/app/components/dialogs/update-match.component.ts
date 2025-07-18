import { Component, inject } from '@angular/core';
import { MatchViewModel } from '../models/rounds.view-model';
import { CommonModule } from '@angular/common';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormsModule } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalModule, NzModalRef } from 'ng-zorro-antd/modal';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { BehaviorSubject } from 'rxjs';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { MatchScore } from '../../domain/entities/match.entity';

@Component({
    selector: 'sr-update-match',
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzInputNumberModule,
        NzFormModule,
        NzModalModule,
        NzGridModule,
        NzCheckboxModule,
    ],
    template: `
        <form nz-form [nzLayout]="'horizontal'">
            <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzSpan]="8"> </nz-col>
                <nz-col [nzSpan]="8">
                    <div class="participant-title">{{ match.team1.name }}</div>
                </nz-col>
                <nz-col [nzSpan]="8">
                    <div class="participant-title">{{ match.team2.name }}</div>
                </nz-col>
            </nz-row>

            @for (gameScore of match.score; track i; let i = $index) {
                @if (gameScore) {
                    <nz-form-item [nzGutter]="16" nzAlign="middle">
                        <nz-form-control>
                            <nz-row [nzGutter]="16">
                                <nz-col [nzSpan]="8">
                                    <nz-form-label nzRequired nzFor="score-{{ i }}-1">
                                        Partida {{ i + 1 }}:
                                    </nz-form-label>
                                </nz-col>
                                <nz-col [nzSpan]="8">
                                    <nz-input-number
                                        id="score-{{ i }}-1"
                                        [(ngModel)]="gameScore.score1"
                                        nzMin="0"
                                        nzMax="10"
                                        [ngModelOptions]="{ standalone: true }"
                                        (ngModelChange)="onScoreChange(i, 'score1')"
                                    />
                                </nz-col>
                                <nz-col [nzSpan]="8">
                                    <nz-input-number
                                        id="score-{{ i }}-2"
                                        [(ngModel)]="gameScore.score2"
                                        nzMin="0"
                                        nzMax="10"
                                        [ngModelOptions]="{ standalone: true }"
                                        (ngModelChange)="onScoreChange(i, 'score2')"
                                    />
                                </nz-col>
                            </nz-row>
                        </nz-form-control>
                    </nz-form-item>
                }
            }

            <nz-form-item [nzGutter]="16" nzAlign="middle">
                <nz-form-control>
                    <nz-row [nzGutter]="16">
                        <!-- <nz-col [nzSpan]="8"> </nz-col> -->
                        <nz-col [nzSpan]="24">
                            <label nz-checkbox
                                [ngModel]="!match.inProgress"
                                (ngModelChange)="match.inProgress = !$event; checkMatchValidity()"
                                [ngModelOptions]="{ standalone: true }"
                            >
                                Cruce terminado
                            </label>
                        </nz-col>
                    </nz-row>
                </nz-form-control>
            </nz-form-item>
        </form>
    `,
    styles: [
        `
            nz-form-label {
                text-align: right;
                padding-right: 8px;
            }
            nz-input-number {
                width: 100%;
            }

            .participant-title {
                font-weight: bold;
                text-align: center;
                margin-bottom: 1rem;
            }
        `,
    ],
})
export class UpdateMatchComponent {
    match = inject<MatchViewModel>(NZ_MODAL_DATA);
    ref = inject<NzModalRef>(NzModalRef);
    disableOk$$ = new BehaviorSubject<boolean>(true);

    constructor() {
        this.ref.updateConfig({
            // Override the Ok handler, to include the match on callback
            nzOnOk: () => this.ref.close(this.match),
        });

        this.disableOk$$.subscribe((disabled) => {
            this.ref.updateConfig({
                nzOkDisabled: disabled,
            });
        });

        this.checkMatchValidity();
    }

    onScoreChange(gameIndex: number, scoreType: 'score1' | 'score2') {
        const currentScore = this.match.score[gameIndex];
        if (currentScore === null) {
            return;
        }

        // If user leave the input blank, it should count as 0.
        currentScore.score1 ??= 0;
        currentScore.score2 ??= 0;

        if (
            scoreType === 'score1' &&
            currentScore.score1 !== undefined &&
            currentScore.score1 >= 0 &&
            currentScore.score1 <= 9
        ) {
            currentScore.score2 = 10;
        } else if (
            scoreType === 'score2' &&
            currentScore.score2 !== undefined &&
            currentScore.score2 >= 0 &&
            currentScore.score2 <= 9
        ) {
            currentScore.score1 = 10;
        }

        if (
            currentScore.score1 !== undefined &&
            currentScore.score2 !== undefined &&
            (currentScore.score1 === 10 || currentScore.score2 === 10)
        ) {
            if (currentScore.score1 === 10 && currentScore.score2 !== 10) {
                currentScore.winner = 1;
            } else if (
                currentScore.score2 === 10 &&
                currentScore.score1 !== 10
            ) {
                currentScore.winner = 2;
            }
        }

        // Do not check for tie breaker in third game.
        if (gameIndex == 0 || gameIndex == 1) {
            this.checkTieBreaker();
        }

        this.checkMatchValidity();
    }

    checkTieBreaker() {
        const game1Winner = this.match.score[0].winner;
        const game2Winner = this.match.score[1].winner;

        if (game1Winner && game2Winner && game1Winner !== game2Winner) {
            this.match.score[2] = {
                winner: 0,
                score1: 0,
                score2: 0,
            };
        }
        else {
            this.match.score[2] = null;
        }
    }

    checkMatchValidity() {
        const isValid = (score: MatchScore | null): boolean => {
            if (!score) {
                // Null score is OK
                return true;
            }

            const { score1, score2 } = score;
            if (this.match.inProgress && score1 === 0 && score2 === 0) {
                return true;                
            }

            if (score1 === 10 && score2 === 10) {
                return false;
            }

            if (score1 !== 10 && score2 !== 10) {
                return false;
            }

            if (!this.match.inProgress && score.winner === 0) {
                return false;
            }

            return true;
        }

        const valid = this.match.score.every(isValid);
        this.disableOk$$.next(!valid);
    }
}
