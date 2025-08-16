import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Participant } from '../../domain/entities/participant.entity';
import { SupabaseRepository } from '../../domain/repositories/supabase.service';
import { CommonModule } from '@angular/common';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { BehaviorSubject, from, map, of, shareReplay, switchMap } from 'rxjs';
import { Match } from '../../domain/entities/match.entity';
import { MatchCardComponent } from "../match-card.component";
import { dataFromQuery, mergeToObject, sswitch } from '../../utils/rx-utils';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Round } from '../../domain/entities/round.entity';
import { FormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { ExternalComponent } from '../../pages/abstractions/external';
import { Configuration } from '../models/configuration.model';
import { getConfiguration } from '../../domain/services/configuration.service';

type MatchWithRound = Omit<Match, 'round'> & {
    round: { name: string }
}

const groupMatchesByParticipant = (matches: MatchWithRound[]): {[key: number]: MatchWithRound[]} => {
    const add = (acc: {[key: number]: MatchWithRound[]}, match: MatchWithRound, participant: number) => {
        if (!acc[participant]) {
            acc[participant] = [];
        }

        acc[participant] = [...acc[participant], match];
    }

    return matches.reduce(
        (acc, curr) => {
            add(acc, curr, curr.team1);
            add(acc, curr, curr.team2);
            return acc;
        },
        {}
    );
}

type MatchViewModel = Omit<Match, 'team1 | team2 | round'> & {
    team1: Participant,
    team2: Participant,
    round: { name: string }
}

interface ParticipantPerformanceComponentViewModel {
    availableParticipants: Participant[], 
    selectedParticipants: Participant[],
    matches: ({
        participant: Participant,
        matches: MatchViewModel[],
    })[];
    chart: {
        data: ChartData,
        options: ChartOptions,
    }
}

@Component({
    selector: 'sr-participant-performance',
    imports: [
    CommonModule,
    FormsModule,
    MatchCardComponent,
    NzCollapseModule,
    NzSpinModule,
    NzSkeletonModule,
    NzSelectModule,
    NzTabsModule,
    BaseChartDirective,
],
    template: `
        @if (vm$ | async; as vm) {
            <nz-select
                nzMode="multiple"
                nzPlaceHolder="Selecciona parejas para filtrar"
                [ngModel]="vm.selectedParticipants"
                (ngModelChange)="selectedParticipants$$.next($event)"
            >
                @for (participant of vm.availableParticipants; track participant.id) {
                    <nz-option [nzLabel]="participant.name" [nzValue]="participant"/>
                }
            </nz-select>

            <canvas
                baseChart
                [data]="vm.chart.data"
                [options]="vm.chart.options"
                [type]="'line'"
                [height]="250"
            >
            </canvas>

            <nz-tabs>
                @for (group of vm.matches; track $index) {
                    <nz-tab [nzTitle]="group.participant.name">
                         <nz-collapse>
                            @for (match of group.matches; track match.id) {
                                <nz-collapse-panel [nzHeader]="match.round.name">
                                    <div style="margin: -1.5rem">
                                        <sr-match-card [match]="match" />
                                    </div>
                                </nz-collapse-panel>
                            }
                        </nz-collapse>
                    </nz-tab>
                }
            </nz-tabs>
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
            nz-select {
                width: 100%;
            }
        `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantPerformanceComponent extends ExternalComponent {
    private readonly repository = inject(SupabaseRepository);
    selectedParticipants$$ = new BehaviorSubject<Participant[]>([]);

    allParticipants$ = this.repository.getAll<Participant>('participant').pipe(dataFromQuery);
    allMatches$ = this.repository.getAll<Match>('match').pipe(dataFromQuery);
    allRounds$ = this.repository.getAll<Round>('round').pipe(dataFromQuery);
    configuration$ = from(this.toService<Configuration>(getConfiguration));

    selectedMatches$ = this.selectedParticipants$$.pipe(
        sswitch(
            (participants) => !!participants.length,
            (participants) => this.allMatches$.pipe(
                map((matches) => matches.filter(({ inProgress }) => !inProgress)),
                switchMap((matches) => this.allRounds$.pipe(
                    map((rounds) => matches.map((match) => ({
                        ...match,
                        round: { name: rounds.find(x => x.id === match.round)!.name },
                    } as MatchWithRound))),
                )),
                map((matches) => participants.map((participant) => ({
                    participant,
                    matches: matches.filter(({ team1, team2 }) => [team1, team2].includes(participant.id)),
                }))),
                switchMap((matches) => this.allParticipants$.pipe(
                    map((participants) => matches.map((x) => ({
                        ...x,
                        matches: x.matches.map((match) => ({
                            ...match,
                            team1: participants.find((x) => x.id === match.team1)!,
                            team2: participants.find((x) => x.id === match.team2)!,
                        } as MatchViewModel))
                    }))),
                )),
            ),
            () => of([]),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    chart$ = this.configuration$.pipe(
        switchMap(({ maxRounds }) => {
            return this.allMatches$.pipe(
                map((matches) => matches.filter(({ inProgress }) => !inProgress)),
                switchMap((matches) => this.allRounds$.pipe(
                    map((rounds) => matches.map((match) => ({
                        ...match,
                        round: { name: rounds.find(x => x.id === match.round)!.name },
                    } as MatchWithRound))),
                )),
                map(groupMatchesByParticipant),
                switchMap((groups) => this.selectedParticipants$$.pipe(
                    sswitch(
                        (participants) => !!participants.length,
                        (participants) => of(
                            participants.reduce(
                                (acc, curr) => {
                                    acc[curr.id] = groups[curr.id];
                                    return acc;
                                },
                                {} as {[key: number]: MatchWithRound[]}
                            ),
                        ),
                        () => of(groups),
                    ),
                )),
                map((groups) => Object.keys(groups).map((participant) => {
                    
                    // Select total scores
                    const totals = groups[+participant].map((match) => ({
                        round: match.round.name,
                        score: match.team1 === +participant
                            ? match.totalScore1
                            : match.totalScore2,
                    }));

                    // Fill missing rounds
                    const rounds = totals.length;
                    const missingRounds = Array.from({ length: maxRounds - rounds }, (_, i) => ({
                        round: `R${rounds + 1 + i}`,
                        score: 0,
                    }));

                    const withRounds = [...totals, ...missingRounds];

                    // Reduce all scores to total
                    const reducedScores = withRounds.reduce(
                        (acc, curr) => [
                            ...acc,
                            {
                                ...curr,
                                total: acc[acc.length - 1].total + curr.score
                            }
                        ],
                        [{ round: '', score: 0, total: 0 }],
                    );

                    // Dataset
                    const dataset = {
                        data: reducedScores.map(({ total }) => total),
                        label: participant
                    };

                    return dataset;
                })),
                switchMap((datasets) => this.allParticipants$.pipe(
                    map((participants) => datasets.map((dataset) => ({
                        ...dataset,
                        label: participants.find((participant) => participant.id === +dataset.label)!.name,
                    })))
                )),
                map((datasets) => ({
                    data: {
                        datasets,
                        labels: Array.from({length: maxRounds + 1}, (_, i) => !!i ? `R${i}` : ''), // First ghost round (R0) is an empty string
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                align: 'start' as const,
                                padding: 20
                            },
                        }
                    }
                })),
            );
        }),        
    );

    vm$ = mergeToObject<ParticipantPerformanceComponentViewModel>({
        availableParticipants: this.allParticipants$,
        selectedParticipants: this.selectedParticipants$$,
        matches: this.selectedMatches$,
        chart: this.chart$,
    });
}
