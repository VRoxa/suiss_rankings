import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzListModule } from "ng-zorro-antd/list";
import { ParticipantsPageViewModel, ParticipantViewModel } from "./models/participants.view-model";
import { NzTypographyModule } from "ng-zorro-antd/typography";

@Component({
    selector: 'sr-participants-list',
    imports: [
        NzListModule,
        NzIconModule,
        CommonModule,
        NzTypographyModule,
    ],
    template: `
        <nz-list nzSize="large" nzBordered [nzLoading]="vm().loading">
            @for (participant of vm().data; track participant.id) {
                <nz-list-item [ngClass]="{eliminated: participant.eliminated}">
                    <span nz-typography>
                        @if (participant.eliminated) {
                            <del>{{ participant.name }}</del>
                        }
                        @else {
                            {{ participant.name }}
                        }
                    </span>
                    <span class="score">{{ participant.score }}</span>
                    <nz-icon nzType="{{ ICONS[participant.difference] }}" [class]="[participant.difference]"></nz-icon>
                </nz-list-item>
            }
            @if (!vm().data.length) {
                <nz-list-empty />
            }
        </nz-list>
    `,
    styles: [`
        nz-list-item {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;

            :first-child {
                flex-grow: 1;
            }

            .score {
                margin: 0 1rem;
            }
        }

        .up { color: green; }
        .down { color: red; }
        
        .eliminated {
            background-color: lightgrey;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantsListComponent {
    readonly vm = input.required<ParticipantsPageViewModel>();

    public ICONS: {[K in ParticipantViewModel['difference']]: string} = {
        'up': 'up',
        'down': 'down',
        'equal': 'minus',
    }
}