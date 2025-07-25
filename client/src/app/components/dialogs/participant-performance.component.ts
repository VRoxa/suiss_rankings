import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Participant } from '../../domain/entities/participant.entity';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { SupabaseRepository } from '../../domain/repositories/supabase.service';
import { CommonModule } from '@angular/common';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { from, map, Observable, shareReplay } from 'rxjs';
import { Match } from '../../domain/entities/match.entity';
import { MatchCardComponent } from "../match-card.component";
import { log, mergeToObject } from '../../utils/rx-utils';

type MatchViewModel = Omit<Match, 'team1 | team2'> & {
    team1: Participant,
    team2: Participant,
    round: { name: string }
}

type ChartDataViewModel = {
    round: string;
    score: number;
    total: number;
}[]

interface ParticipantPerformanceComponentViewModel {
    matches: MatchViewModel[];
    chartData: ChartDataViewModel
}

@Component({
    selector: 'sr-participant-performance',
    imports: [
    CommonModule,
    NzCollapseModule,
    MatchCardComponent
],
    template: `
        @if (vm$ | async; as vm) {
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
    // styles: [`.ant-collapse-content {padding: 0 !important;}`],
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
    );

    vm$ = mergeToObject<ParticipantPerformanceComponentViewModel>({
        matches: this.matches$,
        chartData: this.chartData$,
    }).pipe(
        log('chart')
    );
}
