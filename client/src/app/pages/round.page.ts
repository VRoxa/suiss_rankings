import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { SupabaseRepository } from "../domain/repositories/supabase.service";
import { Match } from "../domain/entities/match.entity";
import { CommonModule } from "@angular/common";
import { combineLatest, filter, firstValueFrom, map, merge, of, shareReplay, startWith, Subject, switchMap } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { Participant } from "../domain/entities/participant.entity";
import { loadingFromQuery, mergeToObject, sswitch } from "../utils/rx-utils";
import { MatchViewModel, RoundPageViewModel } from "../components/models/rounds.view-model";
import { MatchesListComponent } from "../components/matches-list.component";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzIconModule } from "ng-zorro-antd/icon";
import { RoundsNavigatorComponent } from "../components/rounds-nav.component";
import { NzModalModule, NzModalService } from "ng-zorro-antd/modal";
import { UpdateMatchComponent } from "../components/dialogs/update-match.component";

const orderMatches = <T extends Match>(matches: T[]) => {
    return [...matches].sort(({order: a}, {order: b}) =>
        a - b
    );
}

@Component({
    selector: 'sr-round',
    imports: [
        MatchesListComponent,
        RoundsNavigatorComponent,
        CommonModule,
        NzButtonModule,
        NzIconModule,
        NzModalModule,
    ],
    template: `
        @if (vm$ | async; as vm) {
            <sr-rounds-nav></sr-rounds-nav>

            <div class="next-round">
                <button nz-button
                    nzType="primary"
                    nzShape="round"
                    class="next-round__btn"
                    [disabled]="!vm.isRoundFinished"
                >
                    Lanzar siguiente ronda
                    <nz-icon nzType="vertical-left"></nz-icon>
                </button>    
            </div>

            <sr-matches-list
                [vm]="vm"
                (onMatchClicked)="openUpdateMatch($event)"
            ></sr-matches-list>
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
    private readonly modal = inject(NzModalService);
    private readonly manualLoading$$ = new Subject<boolean>();

    id$ = this.route.paramMap.pipe(
        map(params => params.get('id')),
        filter(id => !!id),
    );

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

    mappedMatches$ = this.source$.pipe(
        map(([{data: participants}, {data: matches}]) => [participants, matches] as [Participant[], Match[]]),
        filter(([participants, matches]) => !!participants && !!matches),
        map(([participants, matches]) => {
            return matches.map((x) => ({
                ...x,
                team1: participants.find(({id}) => id === x.team1) ?? x.team1,
                team2: participants.find(({id}) => id === x.team2) ?? x.team2,
            })) as MatchViewModel[];
        }),
        map((matches) => orderMatches(matches)),
        shareReplay(1),
        startWith([]),
    );

    vm$ = mergeToObject<RoundPageViewModel>({
        loading: merge(
            loadingFromQuery(this.source$),
            this.manualLoading$$,
        ),
        matches: this.mappedMatches$,
        isRoundFinished: this.mappedMatches$.pipe(
            sswitch(
                ({ length }) => !!length,
                matches => of(matches.every(({ inProgress }) => inProgress)),
                () => of(false),
            ),
        )
    });

    public async openUpdateMatch(match: MatchViewModel) {
        const copy = (m: MatchViewModel) => {
            return {
                ...m,
                score: m.score.map(x => ({...x})),
            };
        }

        const ref = this.modal.create({
            nzTitle: 'Actualizar cruce',
            nzContent: UpdateMatchComponent,
            nzData: copy(match),
        });

        const result = await firstValueFrom(ref.afterClose);
        console.log('update match result', result);
        if (!result) {
            // Canceled
            return;
        }

        // TODO - update match
        this.manualLoading$$.next(true);
        setTimeout(() => this.manualLoading$$.next(false), 1000);
    }
}
