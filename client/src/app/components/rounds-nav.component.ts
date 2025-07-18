import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { SupabaseRepository } from "../domain/repositories/supabase.service";
import { Round } from "../domain/entities/round.entity";
import { CommonModule } from "@angular/common";
import { filter, map } from "rxjs";
import { RouterModule } from "@angular/router";
import { NzTabsModule } from "ng-zorro-antd/tabs";

@Component({
    selector: 'sr-rounds-nav',
    imports: [
        CommonModule,
        RouterModule,
        NzTabsModule,
    ],
    template: `
        @if (rounds$ | async; as rounds) {
            <nz-tabs nzType="card" nzLinkRouter nzSize="small">
                @for (round of rounds; track round.id) {
                    <nz-tab>
                        <a *nzTabLink nz-tab-link [routerLink]="['/round', round.id]">
                            {{ round.name }}
                        </a>
                    </nz-tab>
                }
            </nz-tabs>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoundsNavigatorComponent {

    private readonly repository = inject(SupabaseRepository);

    rounds$ = this.repository.getAll<Round>('round').pipe(
        map(({ data }) => data),
        filter(x => !!x),
        // map(() => Array.from({length: 6}).map((_,i) => ({id: i, name: `R${i+1}`})))
    );
}