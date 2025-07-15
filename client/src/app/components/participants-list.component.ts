import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzListModule } from 'ng-zorro-antd/list';
import {
    ParticipantsPageViewModel,
    ParticipantViewModel,
} from './models/participants.view-model';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
    selector: 'sr-participants-list',
    imports: [NzListModule, NzIconModule, CommonModule, NzTypographyModule],
    template: `
        <nz-list nzSize="large" nzBordered [nzLoading]="vm().loading">
            @for (participant of vm().data; track participant.id; let i = $index) {
                <nz-list-item
                    [ngClass]="{ eliminated: participant.eliminated }"
                    (click)="onParticipantClicked.emit(participant)"
                >
                    <span nz-typography>
                        <span class="position-mark">#{{ i + 1 }}</span>
                        @if (participant.eliminated) {
                            <del>{{ participant.name }}</del>
                        }
                        @else {
                            <strong>{{ participant.name }}</strong>
                        }
                    </span>
                    <span class="score">{{ participant.score }}</span>
                    <nz-icon
                        nzType="{{ ICONS[participant.difference] }}"
                        [class]="[participant.difference]"
                    ></nz-icon>
                </nz-list-item>
            }
            
            @if (!vm().data.length) {
                <nz-list-empty />
            }
        </nz-list>
    `,
    styles: [
        `
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

                .position-mark {
                    width: 2.5rem !important;
                    display: inline-block;
                    color: var(--sr-primary);
                }
            }

            .up {
                color: var(--sr-primary);
            }
            .down {
                color: var(--sr-danger);
            }

            .eliminated {
                background-color: var(--sr-lightgrey);
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantsListComponent {
    readonly vm = input.required<ParticipantsPageViewModel>();
    onParticipantClicked = output<ParticipantViewModel>();

    public ICONS: { [K in ParticipantViewModel['difference']]: string } = {
        up: 'up',
        down: 'down',
        equal: 'minus',
    };
}
