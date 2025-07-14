import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { SupabaseRepository } from "../domain/repositories/supabase.service";
import { Match } from "../domain/entities/match.entity";
import { CommonModule } from "@angular/common";
import { combineLatest, filter, map, of, shareReplay, startWith, switchMap } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { Participant } from "../domain/entities/participant.entity";
import { loadingFromQuery, log, mergeToObject } from "../utils/rx-utils";
import { MatchViewModel, RoundPageViewModel } from "../components/models/rounds.view-model";
import { MatchesListComponent } from "../components/matches-list.component";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzIconModule } from "ng-zorro-antd/icon";
import { Round } from "../domain/entities/round.entity";
import { RoundsNavigatorComponent } from "../components/rounds-nav.component";

@Component({
    selector: 'sr-round',
    imports: [
        MatchesListComponent,
        RoundsNavigatorComponent,
        CommonModule,
        NzButtonModule,
        NzIconModule,
    ],
    template: `
        @if (vm$ | async; as vm) {
            <sw-rounds-nav></sw-rounds-nav>

            <div class="next-round">
                <button nz-button
                    nzType="primary"
                    nzShape="round"
                    class="next-round__btn"
                    [disabled]="!isRoundFinished(vm.matches)"
                >
                    Lanzar siguiente ronda
                    <nz-icon nzType="vertical-left"></nz-icon>
                </button>    
            </div>

            <sw-matches-list [vm]="vm"></sw-matches-list>
        }
    `,
    styles: [`
        .next-round {
            display: flex;
            flex-direction: row-reverse;
            margin: 0.5rem;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoundPage {
    private readonly repository = inject(SupabaseRepository);
    private readonly route = inject(ActivatedRoute);

    id$ = this.route.paramMap.pipe(
        map(params => params.get('id')),
        filter(id => !!id),
    );

    rounds$ = this.repository.getAll<Round>('round');

    matches$ = this.id$.pipe(
        switchMap(id =>
            this.repository.getAll<Match>('match').pipe(
                map((query) => ({
                    ...query,
                    data: query.data?.filter((match) => match.round === +id!) ?? null
                })),
            )
        ),
        shareReplay({bufferSize: 1, refCount: true}),
    );

    source$ = combineLatest([
        this.repository.getAll<Participant>('participant'),
        this.matches$,
    ]);

    vm$ = mergeToObject<RoundPageViewModel>({
        // rounds: this.rounds$.pipe(
        //     map(({ data }) => data),
        //     filter(x => !!x),
        // ),
        rounds: of<Round[]>([]),
        loading: loadingFromQuery(this.source$),
        matches: this.source$.pipe(
            map(([{data: participants}, {data: matches}]) => [participants, matches] as [Participant[], Match[]]),
            filter(([participants, matches]) => !!participants && !!matches),
            map(([participants, matches]) => {
                return matches.map((x) => ({
                    ...x,
                    team1: participants.find(({id}) => id === x.team1) ?? x.team1,
                    team2: participants.find(({id}) => id === x.team2) ?? x.team2,
                })) as MatchViewModel[];
            }),
            startWith([]),
        ),
    }).pipe(log('vm'));

    public isRoundFinished(matches: Match[]) {
        if (!matches.length) {
            return false;
        }

        return matches.every(({ score }) =>
            score.every((x) => x?.winner !== 0)
        );
    }
}
