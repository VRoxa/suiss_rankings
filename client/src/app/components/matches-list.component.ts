import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RoundPageViewModel } from "./models/rounds.view-model";
import { MatchCardComponent } from "./match-card.component";
import { NzEmptyModule } from "ng-zorro-antd/empty";
import { NzListModule } from "ng-zorro-antd/list";

@Component({
    selector: 'sw-matches-list',
    imports: [
        MatchCardComponent,
        NzEmptyModule,
        NzListModule,
    ],
    template: `
        <nz-list nzSize="large" [nzLoading]="vm().loading">
            @for (match of vm().matches; track match.id) {
                <sw-match-card [match]="match"></sw-match-card>
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
}