import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Participant } from '../../domain/entities/participant.entity';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { SupabaseRepository } from '../../domain/repositories/supabase.service';
import { CommonModule } from '@angular/common';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { from, map, shareReplay } from 'rxjs';
import { Match } from '../../domain/entities/match.entity';
import { MatchCardComponent } from "../match-card.component";
import { mergeToObject } from '../../utils/rx-utils';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';

type MatchViewModel = Omit<Match, 'team1 | team2'> & {
    team1: Participant,
    team2: Participant,
    round: { name: string }
}

interface ParticipantPerformanceComponentViewModel {
    matches: MatchViewModel[];
    chartData: ChartData
}

@Component({
    selector: 'sr-participant-performance',
    imports: [
    CommonModule,
    MatchCardComponent,
    NzCollapseModule,
    BaseChartDirective,
],
    template: `
        @if (vm$ | async; as vm) {
            <canvas
                baseChart
                [data]="vm.chartData"
                [type]="'line'"
                [legend]="false"
            >
            </canvas>

            <nz-collapse>
                @for (match of vm.matches; track match.id) {
                    <nz-collapse-panel [nzHeader]="match.round.name">
                        <div style="margin: -1.5rem">
                            <sr-match-card [match]="match" />
                        </div>
                    </nz-collapse-panel>
                }
            </nz-collapse>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantPerformanceComponent {
    private readonly repository = inject(SupabaseRepository);
    participant = inject<Participant>(NZ_MODAL_DATA);

    matches$ = from(
        this.repository.disposable.raw
            .from('match')
            .select('*, round (name), team1:participant!team1 (name, id), team2:participant!team2 (name, id)')
            .or(`team1.eq.${this.participant.id},team2.eq.${this.participant.id}`)
    ).pipe(
        map(({ data }) => data as MatchViewModel[]),
        map(matches => matches.filter(({ inProgress}) => !inProgress)),
        shareReplay(1),
    );

    chartData$ = this.matches$.pipe(
        map(data => data.map((x) => {
            return {
                round: x.round.name,
                score: x.team1.id === this.participant.id
                    ? x.totalScore1
                    : x.totalScore2
            };
        })),
        map(data => {
            const rounds = data.length;
            const missingRounds = Array.from({length: 6 - rounds}, (_, i) => {
                return {
                    round: `R${rounds + 1 + i}`,
                    score: 0,
                }
            });

            return [...data, ...missingRounds];
        }),
        map(data => data.reduce(
            (acc, curr) => [
                ...acc,
                {
                    ...curr,
                    total: acc[acc.length - 1].total + curr.score
                }
            ],
            [{ round: '', score: 0, total: 0 }]
        )),
        map(data => {
            return {
                datasets: [{
                    data: data.map(x => x.total),
                    borderColor: '#1890ff' // TODO - see how to use :root variable
                }],
                labels: data.map(x => x.round)
            }
        }),
    );

    vm$ = mergeToObject<ParticipantPerformanceComponentViewModel>({
        matches: this.matches$,
        chartData: this.chartData$,
    })
}
