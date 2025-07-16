import { AfterViewInit, ChangeDetectionStrategy, Component, inject, TemplateRef, ViewChild } from "@angular/core";
import { NZ_MODAL_DATA, NzModalRef } from "ng-zorro-antd/modal";
import { CommonModule } from "@angular/common";
import { NzInputModule } from "ng-zorro-antd/input";
import { FormsModule } from "@angular/forms";
import { ParticipantViewModel } from "../models/participants.view-model";
import { NzButtonModule } from "ng-zorro-antd/button";

type UpdateParticipantAction = 'update' | 'delete' | 'none';

export interface UpdateParticipantResult {
    action: UpdateParticipantAction;
    participant: ParticipantViewModel;
}

@Component({
    selector: 'sr-update-participant',
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzButtonModule
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
                <!-- TODO - Add confirm popup -->
                <button nz-button
                    nzType="primary"
                    nzDanger
                >
                    Eliminar
                </button>

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
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateParticipantComponent implements AfterViewInit {

    readonly participant = inject<ParticipantViewModel>(NZ_MODAL_DATA);
    readonly ref = inject<NzModalRef<UpdateParticipantComponent, UpdateParticipantResult>>(NzModalRef);

    @ViewChild('footer')
    footer!: TemplateRef<any>;

    ngAfterViewInit(): void {
        console.log('footer', this.footer);
        this.ref.updateConfig({
            nzFooter: this.footer
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