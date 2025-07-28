import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { SupabaseRepository } from "../domain/repositories/supabase.service";
import { Participant } from "../domain/entities/participant.entity";
import { filter, firstValueFrom, map, merge, startWith, Subject } from "rxjs";
import { loadingFromQuery, mergeToObject } from "../utils/rx-utils";
import { CommonModule } from "@angular/common";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzTypographyModule } from "ng-zorro-antd/typography";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzFlexModule } from "ng-zorro-antd/flex";
import { ParticipantsPageViewModel } from "../components/models/participants.view-model";
import { ParticipantsListComponent } from "../components/participants-list.component";
import { NzModalModule, NzModalService } from "ng-zorro-antd/modal";
import { NzPopconfirmModule } from "ng-zorro-antd/popconfirm";
import { UpdateParticipantComponent, UpdateParticipantResult } from "../components/dialogs/update-participant.component";
import { updateParticipant } from "../domain/services/update-participant.service";
import { ExternalComponent } from "./abstractions/external";
import { AddParticipantComponent } from "../components/dialogs/add-participant.component";
import { addParticipant } from "../domain/services/add-participant.service";
import { Round } from "../domain/entities/round.entity";
import { startingRound } from "../domain/services/next-round.service";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { ParticipantPerformanceComponent } from "../components/dialogs/participant-performance.component";

// TODO - What happens when a participant is eliminated during a knockout round,
// Then in future rounds, another participant has less score (bc score can substract).
// The participant that was early eliminated should go under the one who lasted for more rounds.
//
// In case of just one knockout round, this can't happen. But for more, that should be considered.
const orderByScoreDesc = <T extends Participant>(participants: T[]) => {
    return [...participants].sort((a, b) => {
        if (a.eliminated && !b.eliminated) {
            return 1;
        }
        if (!a.eliminated && b.eliminated) {
            return -1;
        }

        return b.score - a.score;
    });
}

@Component({
    selector: 'sr-participants',
    imports: [
        ParticipantsListComponent,
        CommonModule,
        RouterModule,
        NzModalModule,
        NzButtonModule,
        NzIconModule,
        NzFlexModule,
        NzPopconfirmModule,
        NzTypographyModule,
    ],
    template: `
        @if(vm$ | async; as vm) {
            <div nz-flex [nzVertical]="true" nzAlign="flex-end" class="container">

                @if (vm.isAuthorized && vm.canStart) {
                    <!-- Disabled when the # of participants is odd. -->
                    <button nz-button
                        nzType="primary"
                        nzShape="round"
                        class="next-round__btn"
                        [disabled]="vm.data.length === 0 || !!(vm.data.length % 2) || !vm.canStart"
                        
                        nz-popconfirm
                        nzPopconfirmTitle="¿Empezar torneo con ({{ vm.data.length }}) participantes?"
                        nzPopconfirmPlacement="bottomLeft"
                        nzIcon="question-circle-o"
                        (nzOnConfirm)="startTournament()"
                    >
                        Empezar torneo
                        <nz-icon nzType="vertical-left" />
                    </button>
                }

                <sr-participants-list
                    [vm]="vm"
                    (onParticipantClicked)="vm.isAuthorized && openUpdateParticipant($event)"
                />

                @if (vm.isAuthorized && vm.canStart) {
                    <button nz-button
                        nzType="primary" nzShape="round"
                        class="flex-item"
                        [disabled]="vm.loading || vm.data.length >= 12"
                        (click)="openAddParticipant()"
                    >
                        <nz-icon nzType="plus" />
                        Añadir pareja
                    </button>
                }
            </div>
        }
    `,
    styles: [`
        .container {
            & > * {
                width: 100%;
            }

            button {
                width: calc(100% - 2rem);
                margin: 1rem;
            }

            .next-round__btn {
                width: fit-content;
            }
        }

        :host {
            width: 100%;
            height: 100%;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantsPage extends ExternalComponent {
    private readonly auth = inject(AuthService);
    private readonly repository = inject(SupabaseRepository);
    private readonly modal = inject(NzModalService);
    private readonly router = inject(Router);
    
    manualLoading$$ = new Subject<boolean>();
    participants$ = this.repository.getAll<Participant>('participant');
    rounds$ = this.repository.getAll<Round>('round');
    
    vm$ = mergeToObject<ParticipantsPageViewModel>({
        isAuthorized: this.auth.isAuthorized$,
        loading: merge(
            loadingFromQuery(this.participants$),
            this.manualLoading$$,
        ),
        data: this.participants$.pipe(
            map(({ data }) => data),
            filter(data => !!data),
            map(orderByScoreDesc),
            startWith([]),
        ),
        canStart: this.rounds$.pipe(
            map(({ data }) => data),
            map((rounds) => (rounds?.length ?? -1) === 0),
            startWith(false),
        )
    });

    public async startTournament() {
        this.manualLoading$$.next(true);
        this.toService(async () => {
            const firstRoundId = await startingRound();
            this.router.navigate(['/round', firstRoundId]);
        });
    }

    public async openAddParticipant() {
        const ref = this.modal.create<
            AddParticipantComponent,
            never,
            Omit<Participant, 'id'>
        >({
            nzContent: AddParticipantComponent,
            nzTitle: 'Añadir pareja',
            nzOkText: 'Añadir',
        });

        const result = await firstValueFrom(ref.afterClose);
        if (!result) {
            return;
        }

        this.manualLoading$$.next(true);
        this.toService(async () => {
            await addParticipant(result);
        });
    }

    public async openUpdateParticipant(participant: Participant) {
        const ref = this.modal.create<
            UpdateParticipantComponent,
            Participant,
            UpdateParticipantResult
        >({
            nzTitle: 'Actualizar pareja',
            nzContent: UpdateParticipantComponent,
            nzData: {...participant},
        });

        const res = await firstValueFrom(ref.afterClose);
        if (!res) {
            return;
        }

        this.manualLoading$$.next(true);
        let { action, participant: result } = res;
        this.toService(async () => {
            if (action === 'delete') {
                result = {
                    ...participant,
                    eliminated: !participant.eliminated, // Toggle elimination
                };
            }

            // TODO - Unify all service calls into an decorator that try/catches
            // these calls and raises a pop message.
            // Use ExternalComponent for that??
            await updateParticipant(result);
        });
    }
}