import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { MatchViewModel, RoundPageViewModel } from "./models/rounds.view-model";
import { MatchCardComponent } from "./match-card.component";
import { NzEmptyModule } from "ng-zorro-antd/empty";
import { NzListModule } from "ng-zorro-antd/list";

@Component({
    selector: 'sr-matches-list',
    imports: [
        MatchCardComponent,
        NzEmptyModule,
        NzListModule,
    ],
    template: `
        <nz-list nzSize="large" [nzLoading]="vm().loading">
            @for (match of vm().matches; track match.id) {
                <sr-match-card
                    [match]="match"
                    (click)="onMatchClicked.emit(match)"
                ></sr-match-card>
            }

            @if (!vm().matches.length) {
                <nz-list-empty></nz-list-empty>
            }
        </nz-list>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchesListComponent {
    readonly vm = input.required<RoundPageViewModel>();
    onMatchClicked = output<MatchViewModel>();
}