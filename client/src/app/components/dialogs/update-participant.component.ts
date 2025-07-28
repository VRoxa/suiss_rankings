import { AfterViewInit, ChangeDetectionStrategy, Component, inject, TemplateRef, ViewChild } from "@angular/core";
import { NZ_MODAL_DATA, NzModalModule, NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { CommonModule } from "@angular/common";
import { NzInputModule } from "ng-zorro-antd/input";
import { FormsModule } from "@angular/forms";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzPopconfirmModule } from "ng-zorro-antd/popconfirm";
import { Participant } from "../../domain/entities/participant.entity";
import { NzIconModule } from "ng-zorro-antd/icon";
import { ParticipantPerformanceComponent } from "./participant-performance.component";

type UpdateParticipantAction = 'update' | 'delete' | 'none';

export interface UpdateParticipantResult {
    action: UpdateParticipantAction;
    participant: Participant;
}

@Component({
    selector: 'sr-update-participant',
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzButtonModule,
        NzIconModule,
        NzPopconfirmModule,
        NzModalModule,
    ],
    template: `
        <nz-input-group nzAddOnBefore="Nombre">
            <input nz-input
                type="text"
                placeholder="Nombre"
                [(ngModel)]="participant.name"
                [ngModelOptions]="{standalone: true}"
            />
        </nz-input-group>

        <nz-input-group nzAddOnAfter="pts">
            <input nz-input
                type="number"
                placeholder="Puntos"
                [(ngModel)]="participant.score"
                [ngModelOptions]="{standalone: true}"
            />
        </nz-input-group>

        <ng-template #footer>
            <div class="modal-footer">
                <div>
                    @if (participant.eliminated) {
                        <button nz-button
                            nzType="primary"
                            nzDanger
    
                            nz-popconfirm
                            nzPopconfirmTitle="¿Readmitir a {{ participant.name }}?"
                            nzPopconfirmPlacement="bottomLeft"
                            (nzOnConfirm)="close('delete')"
                        >
                            Readmitir
                        </button>
                    }
                    @else {
                        <button nz-button
                            nzType="primary"
                            nzDanger
    
                            nz-popconfirm
                            nzPopconfirmTitle="¿Eliminar a {{ participant.name }}?"
                            nzPopconfirmPlacement="bottomLeft"
                            (nzOnConfirm)="close('delete')"
                            [nzOkButtonProps]="{nzDanger: true}"
                        >
                            Eliminar
                        </button>
                    }
                </div>

                <div>
                    <button nz-button
                        (click)="close('none')"
                    >
                        Cancelar
                    </button>
                    <button nz-button
                        nzType="primary"
                        (click)="close('update')"
                    >
                        Aceptar
                    </button>
                </div>
                
            </div>
        </ng-template>
    `,
    styles: [`
        .modal-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateParticipantComponent implements AfterViewInit {

    readonly modal = inject(NzModalService);
    readonly participant = inject<Participant>(NZ_MODAL_DATA);
    readonly ref = inject<NzModalRef<UpdateParticipantComponent, UpdateParticipantResult>>(NzModalRef);

    @ViewChild('footer')
    footer!: TemplateRef<any>;

    ngAfterViewInit(): void {
        this.ref.updateConfig({
            nzFooter: this.footer
        });
    }

    public openParticipantPerformance() {
        this.close('none');

        const ref = this.modal.create<
            ParticipantPerformanceComponent,
            Participant,
            void
        >({
            nzTitle: `Estadísticas de '${this.participant.name}'`,
            nzContent: ParticipantPerformanceComponent,
            nzData: {...this.participant},
            nzFooter: [{
                label: 'Cerrar',
                onClick: () => ref.close(),
            }],
        });
    }

    public close(action: UpdateParticipantAction) {
        const result = action === 'none'
            ? void 0
            : {
                action,
                participant: this.participant
            };

        this.ref.close(result);
    }
}