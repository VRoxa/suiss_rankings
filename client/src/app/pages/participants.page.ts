import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { SupabaseRepository } from "../domain/repositories/supabase.service";
import { Participant } from "../domain/entities/participant.entity";
import { BehaviorSubject, filter, map, scan, startWith, tap } from "rxjs";
import { mergeToObject } from "../utils/rx-utils";
import { CommonModule } from "@angular/common";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzTypographyModule } from "ng-zorro-antd/typography";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzFlexModule } from "ng-zorro-antd/flex";
import { ParticipantsPageViewModel, ParticipantViewModel } from "../components/models/participants.view-model";
import { ParticipantsListComponent } from "../components/participants-list.component";
import { NzModalModule } from "ng-zorro-antd/modal";
import { NzPopconfirmModule } from "ng-zorro-antd/popconfirm";

const orderByScoreDesc = <T extends Participant>(participants: T[]) => {
    return [...participants].sort(({score: a}, {score: b}) =>
        b - a
    );
}

const toDifference = (diff: number) => {
    if (diff < 0) return 'up';
    return diff > 0 ? 'down' : 'equal';
}

@Component({
    selector: 'sr-participants',
    imports: [
        ParticipantsListComponent,
        NzIconModule,
        CommonModule,
        NzTypographyModule,
        NzButtonModule,
        NzFlexModule,
        NzPopconfirmModule,
        NzModalModule,
    ],
    template: `
        @if(vm$ | async; as vm) {
            <div nz-flex [nzVertical]="true" nzAlign="flex-end" class="container">
                <button nz-button
                    nzType="primary"
                    nzShape="round"
                    class="next-round__btn"

                    nz-popconfirm
                    nzPopconfirmTitle="¿Empezar torneo con ({{ vm.data.length }}) participantes?"
                    nzPopconfirmPlacement="bottomLeft"
                    nzIcon="question-circle-o"
                    (nzOnConfirm)="startTournament(vm.data)"
                >
                    Empezar torneo
                    <nz-icon nzType="vertical-left"></nz-icon>
                </button>   

                <sr-participants-list [vm]="vm"></sr-participants-list>

                <button nz-button
                    nzType="primary" nzShape="round"
                    class="flex-item"
                    (click)="showAddModal$$.next(true)"
                >
                    <nz-icon nzType="plus"></nz-icon>
                    Añadir participante
                </button>
            </div>

            <nz-modal
                [nzVisible]="vm.showAddModal"
                nzTitle="Añadir participante"
                (nzOnCancel)="showAddModal$$.next(false)"
            >
            </nz-modal>
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
export class ParticipantsPage {
    private readonly repository = inject(SupabaseRepository);
    
    showAddModal$$ = new BehaviorSubject<boolean>(false);
    participants$ = this.repository.getAll<Participant>('participant');
    
    vm$ = mergeToObject<ParticipantsPageViewModel>({
        showAddModal: this.showAddModal$$,
        loading: this.participants$.pipe(
            map(({ loading }) => loading),
            startWith(true),
        ),
        data: this.participants$.pipe(
            map(({ data }) => data),
            filter(data => !!data),
            map(data => data.map<ParticipantViewModel>(x => ({...x, difference: 'equal'}))),
            map(orderByScoreDesc),
            startWith([]),
            scan((acc, curr) => {
                if (!acc.length) {
                    return curr.map(x => ({...x, difference: 'equal'}));
                }
                
                return curr.map((x, i) => ({
                    ...x,
                    difference: toDifference(i - acc.findIndex(({ id }) => id === x.id)),
                }));
            }),
        ),
    });

    public startTournament(participants: Participant[]) {
        console.info('Starting tournament...', participants);
    }
}