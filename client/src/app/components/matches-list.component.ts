import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";
import { MatchViewModel, RoundPageViewModel } from "./models/rounds.view-model";
import { MatchCardComponent } from "./match-card.component";
import { NzEmptyModule } from "ng-zorro-antd/empty";
import { NzListModule } from "ng-zorro-antd/list";
import { NzProgressModule } from "ng-zorro-antd/progress";

@Component({
    selector: 'sr-matches-list',
    imports: [
        MatchCardComponent,
        NzEmptyModule,
        NzListModule,
        NzProgressModule,
    ],
    template: `
        <div class="progress">
            <nz-progress [nzPercent]="progress()" [nzShowInfo]="true" />
        </div>

        <nz-list nzSize="large" [nzLoading]="vm().loading">
            @for (match of vm().matches; track match.id) {
                <sr-match-card
                    [match]="match"
                    (click)="onMatchClicked.emit(match)"
                />
            }

            @if (!vm().matches.length) {
                <nz-list-empty />
            }
        </nz-list>
    `,
    styles: [
        `
            .progress {
                margin: 0 1rem;
            }
        `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchesListComponent {
    readonly vm = input.required<RoundPageViewModel>();
    onMatchClicked = output<MatchViewModel>();

    progress = computed(() => {
        const matches = this.vm().matches;
        const total = matches.length;

        if (total === 0) {
            return 0;
        }

        const finished = matches.filter(x => !x.inProgress).length;
        return Math.floor(100 * finished / total);
    })
}