import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SupabaseRepository } from '../domain/repositories/supabase.service';
import { Match } from '../domain/entities/match.entity';
import { CommonModule } from '@angular/common';
import {
    BehaviorSubject,
    combineLatest,
    filter,
    firstValueFrom,
    from,
    map,
    merge,
    of,
    shareReplay,
    startWith,
    Subject,
    switchMap,
} from 'rxjs';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Participant } from '../domain/entities/participant.entity';
import {
    loadingFromQuery,
    mergeToObject,
    sswitch,
} from '../utils/rx-utils';
import {
    MatchViewModel,
    RoundPageViewModel,
} from '../components/models/rounds.view-model';
import { MatchesListComponent } from '../components/matches-list.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RoundsNavigatorComponent } from '../components/rounds-nav.component';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { UpdateMatchComponent } from '../components/dialogs/update-match.component';
import { ExternalComponent } from './abstractions/external';
import { updateMatch } from '../domain/services/update-match.service';
import { nextRound } from '../domain/services/next-round.service';
import { updateParticipantsScore } from '../domain/services/update-participants-score.service';
import { Round } from '../domain/entities/round.entity';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService } from '../auth/auth.service';
import { Configuration } from '../components/models/configuration.model';
import { getConfiguration } from '../domain/services/configuration.service';
import { knockoutParticipants } from '../domain/services/knockout-participants.service';
import { RollbackRoundButtonComponent } from "../components/rollback-round-button.component";

const orderMatches = <T extends Match>(matches: T[]) => {
    return [...matches].sort(({ order: a }, { order: b }) => a - b);
};

@Component({
    selector: 'sr-round',
    imports: [
    MatchesListComponent,
    RoundsNavigatorComponent,
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzAlertModule,
    NzFlexModule,
    RollbackRoundButtonComponent
],
    providers: [
        NzNotificationService
    ],
    template: `
        @if (vm$ | async; as vm) {
            <sr-rounds-nav />

            @if (
                vm.isAuthorized &&
                vm.isCurrentRound &&
                !vm.fullRankingUpdated
            ) {
                <div class="rollback-button"
                    nz-flex nzJustify="end"
                    class="top-action__btn"
                >
                    <sr-rollback-button />
                </div>
            }

            @if (vm.isKnockoutRound) {
                <div class="knockout-disclaimer">
                    <nz-alert
                        nzType="error"
                        nzMessage="Knockout"
                        nzDescription="Las ({{ vm.configuration.participantsToKnockout }}) últimas parejas en la clasificación, después de esta ronda, serán eliminadas."
                        nzCloseable
                    />
                </div>
            }

            @if (vm.isAuthorized && vm.isCurrentRound) {
                <div nz-flex nzJustify="flex-end">
                    @if (!vm.fullRankingUpdated) {
                        <button
                            nz-button
                            nzType="primary"
                            nzShape="round"
                            class="top-action__btn"
                            [disabled]="!vm.isRoundFinished || vm.loading"
                            (click)="updateScores(vm.matches, vm.isKnockoutRound)"
                        >
                            Actualizar puntuación
                            <nz-icon nzType="reload-o"></nz-icon>
                        </button>
                    }
                    @else {
                        <button
                            nz-button
                            nzType="primary"
                            nzShape="round"
                            class="top-action__btn"
                            [disabled]="!vm.isRoundFinished || vm.loading"
                            (click)="nextRound()"
                        >
                            Lanzar siguiente ronda
                            <nz-icon nzType="vertical-left"></nz-icon>
                        </button>
                    }
                </div>
            }

            <div class="list">
                <sr-matches-list
                    [vm]="vm"
                    (onMatchClicked)="vm.isAuthorized && openUpdateMatch($event)"
                />
            </div>
        }
    `,
    styles: [
        `
            .top-action__btn {
                margin: 0.5rem 0.5rem 0 0.5rem;
            }

            .list {
                padding: 0.5rem 0;
            }

            .knockout-disclaimer {
                margin: 0 1rem;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoundPage extends ExternalComponent {

    private readonly auth = inject(AuthService);
    private readonly repository = inject(SupabaseRepository);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly modal = inject(NzModalService);
    private readonly notification = inject(NzNotificationService);

    private readonly manualLoading$$ = new Subject<boolean>();
    private readonly forceRefresh$$ = new BehaviorSubject<void>(void 0);

    roundId$ = this.route.paramMap.pipe(
        map((params) => params.get('id')),
        filter((id): id is string => !!id),
        map((id) => +id),
    );

    matches$ = this.roundId$.pipe(
        switchMap((id) =>
            this.repository.getAll<Match>('match').pipe(
                map((query) => ({
                    ...query,
                    data:
                        query.data?.filter((match) => match.round === id) ??
                        null,
                })),
            )
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    source$ = combineLatest([
        this.repository.getAll<Participant>('participant'),
        this.matches$,
    ]);

    mappedMatches$ = this.source$.pipe(
        map(
            ([{ data: participants }, { data: matches }]) =>
                [participants, matches] as [Participant[], Match[]]
        ),
        filter(([participants, matches]) => !!participants && !!matches),
        map(([participants, matches]) => {
            return matches.map((x) => ({
                ...x,
                team1: participants.find(({ id }) => id === x.team1) ?? x.team1,
                team2: participants.find(({ id }) => id === x.team2) ?? x.team2,
            })) as MatchViewModel[];
        }),
        map((matches) => orderMatches(matches)),
        shareReplay({ bufferSize: 1, refCount: true }),
        startWith([]),
    );

    allRounds$ = this.forceRefresh$$.pipe(
        switchMap(() =>
            this.repository.disposable.getAll<Round>('round')
        ),
    );

    configuration$ = this.toService<Configuration>(getConfiguration);

    vm$ = mergeToObject<RoundPageViewModel>({
        roundId: this.roundId$,
        isAuthorized: this.auth.isAuthorized$,
        loading: merge(
            loadingFromQuery(this.source$),
            this.manualLoading$$
        ),
        matches: this.mappedMatches$,
        isCurrentRound: combineLatest([
            this.roundId$,
            this.allRounds$,
        ]).pipe(
            map(([id, rounds]) => {
                const lastRound = Math.max(...rounds.map((x) => x.id));
                return id === lastRound;
            }),
        ),
        isRoundFinished: this.mappedMatches$.pipe(
            sswitch(
                ({ length }) => !!length,
                (matches) => of(matches.every(({ inProgress }) => !inProgress)),
                () => of(false),
            ),
            startWith(false),
        ),
        fullRankingUpdated: this.roundId$.pipe(
            switchMap((id) =>
                this.mappedMatches$.pipe(
                    map((matches) => matches.flatMap(({ team1, team2 }) => [team1, team2])),
                    map((participants) => participants.every(({lastRoundScored}) => lastRoundScored === id)),
                ),
            ),
        ),
        isKnockoutRound: from(this.configuration$).pipe(
            switchMap(({ knockoutRound }) =>
                combineLatest([
                    this.roundId$,
                    this.allRounds$,
                ]).pipe(
                    map(([id, rounds]) => {
                        const currentRoundIndex = rounds.findIndex((x) => x.id === id);
                        return currentRoundIndex === (knockoutRound - 1);
                    }),
                ),
            ),
        ),
        configuration: from(this.configuration$),
    });

    public async openUpdateMatch(match: MatchViewModel) {
        const copy = (m: MatchViewModel): MatchViewModel => {
            return {
                ...m,
                score: m.score.map((x) => !!x ? ({ ...x }) : null) as Match['score'],
            };
        };

        const ref = this.modal.create<
            UpdateMatchComponent,
            MatchViewModel,
            MatchViewModel
        >({
            nzTitle: 'Actualizar cruce',
            nzContent: UpdateMatchComponent,
            nzData: copy(match),
        });

        const result = await firstValueFrom(ref.afterClose);
        if (!result) {
            // Canceled
            return;
        }

        this.manualLoading$$.next(true);
        this.toService(async () => {
            await updateMatch(result);
            this.notification.success(
                'Cruce actualizado', '',
                { nzPlacement: 'bottom' }
            );
        });
    }

    public async updateScores(matches: MatchViewModel[], isKnockoutRound: boolean) {
        const rawMatches = matches.map((x): Match => ({
            ...x,
            team1: x.team1.id,
            team2: x.team2.id,
        }));

        this.manualLoading$$.next(true);
        await this.toService(async () => {
            await updateParticipantsScore(rawMatches);
            this.notification.success(
                'Clasificación actualizada', '',
                { nzPlacement: 'bottom' }
            );
        });

        if (isKnockoutRound) {
            this.toService(async () => {
                await knockoutParticipants();
            });
        }
    }

    public async nextRound() {
        this.manualLoading$$.next(true);
        this.toService(async () => {
            try {
                const nextRoundId = await nextRound();
                this.notification.success(
                    'Siguiente ronda creada', '',
                    { nzPlacement: 'bottom' }
                );
    
                this.router.navigate(['/round', nextRoundId]);
                
                // Refresh rounds, so that control flags are properly recomputed.
                this.forceRefresh$$.next();
            } catch {
                this.notification.error(
                    'Error lanzando ronda', '',
                    { nzPlacement: 'bottom' }
                )
            } finally {
                this.manualLoading$$.next(false);
            }
        });
    }
}
