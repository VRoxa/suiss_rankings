import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";
import { NzDividerModule } from "ng-zorro-antd/divider";
import { NzCardModule } from "ng-zorro-antd/card";
import { PadTextPipe } from "../pipes/pad-text.pipe";
import { CommonModule } from "@angular/common";
import { MatchViewModel } from "./models/rounds.view-model";
import { calculateScore, CountFor } from "../domain/services/score-calculator.service";

@Component({
    selector: 'sr-match-card',
    imports: [
        CommonModule,
        NzCardModule,
        NzDividerModule,
        PadTextPipe,
    ],
    template: `
        <div class="round-card"
            [ngClass]="{'finished-match': !match().inProgress}"
        >
            <div class="round-card__teams">
                <div
                    class="teams__team1"
                    [ngClass]="{'winner': this.winner1}"
                >
                    <span>
                        {{ match().team1.name }}
                        @if (!match().inProgress) {
                            ({{score1()}})
                        }
                    </span>
                </div>
                <nz-divider nzType="horizontal"></nz-divider>
                <div 
                    class="teams__team2"
                    [ngClass]="{'winner': this.winner2}"
                >
                    <span>
                        {{ match().team2.name }}
                        @if (!match().inProgress) {
                            ({{score2()}})
                        }
                    </span>
                </div>
            </div>
            
            <nz-divider nzType="vertical"></nz-divider>
            
            <div class="round-card__scores">
                <div class="scores__team1">
                    <div
                        class="scores__team1__1"
                        [ngClass]="{'winner': match().score[0].winner === 1}"
                    >
                        <span>{{ match().score[0].score1 | pad }}</span>
                    </div>
                    <div
                        class="scores__team1__2"
                        [ngClass]="{'winner': match().score[1].winner === 1}"
                    >
                        <span>{{ match().score[1].score1 | pad }}</span>
                    </div>
                    <div 
                        class="scores__team1__3"
                        [ngClass]="{'winner': match().score[2]?.winner === 1}"
                    >
                        <span>{{ match().score[2]?.score1 ?? '' | pad }}</span>
                    </div>
                </div>
                <nz-divider nzType="horizontal"></nz-divider>
                <div class="scores__team2">
                    <div
                        class="scores__team2__1"
                        [ngClass]="{'winner': match().score[0].winner === 2}"
                    >
                        <span>{{ match().score[0].score2 | pad }}</span>
                    </div>
                    <div
                        class="scores__team2__2"
                        [ngClass]="{'winner': match().score[1].winner === 2}"
                    >
                        <span>{{ match().score[1].score2 | pad }}</span>
                    </div>
                    <div
                        class="scores__team2__3"
                        [ngClass]="{'winner': match().score[2]?.winner === 2}"
                    >
                        <span>{{ match().score[2]?.score2 ?? '' | pad }}</span>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .winner {
            color: green;
            font-weight: bold;
        }

        .finished-match {
            background-color: lightgray;
        }

        .round-card {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            margin: 0.5rem;
            border: 1px solid gray;
            border-radius: 0.5rem;

            &__teams {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 65%;
                flex-grow: 1;

                div[class^="teams__team"] {
                    padding: 0.5rem 0.5rem;
                }
            }

            &__scores {
                display: flex;
                flex-direction: column;
                width: 35%;

                div[class^="scores__team"] {
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
                border-color: grey !important;
                
                &-vertical {
                    height: 5rem;
                }
            }
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchCardComponent {
    readonly match = input.required<MatchViewModel>();

    score1 = computed(() => {
        return calculateScore(
            this.match().score,
            CountFor.One
        );
    });
    
    score2 = computed(() => {
        return calculateScore(
            this.match().score,
            CountFor.Two
        );
    });

    get winner1(): boolean {
        return this.match().score
            .filter(x => !!x)
            .filter(({ winner }) => winner === 1)
            .length === 2;
    }

    get winner2(): boolean {
        return this.match().score
            .filter(x => !!x)
            .filter(({ winner }) => winner === 2)
            .length === 2;
    }
}
