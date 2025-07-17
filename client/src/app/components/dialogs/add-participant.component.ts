import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NzInputModule } from "ng-zorro-antd/input";
import { Participant } from "../../domain/entities/participant.entity";
import { AddingEntity } from "../../domain/repositories/types/supabase.types";
import { NzModalRef } from "ng-zorro-antd/modal";

@Component({
    selector: 'sr-add-participant',
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
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
                placeholder="Puntos iniciales"
                [(ngModel)]="participant.score"
                [ngModelOptions]="{standalone: true}"
            />
        </nz-input-group>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddParticipantComponent {
    readonly ref = inject(NzModalRef);

    participant: AddingEntity<Participant> = {
        name: '',
        score: 0,
        eliminated: false,
        lastRoundScored: 0,
    };

    constructor() {
        this.ref.updateConfig({
            nzOnOk: () => this.ref.close(this.participant),
        });
    }
}
