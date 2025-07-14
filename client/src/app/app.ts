import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { SupabaseRepository } from './domain/repositories/supabase.service';
import { Round } from './domain/entities/round.entity';
import { filter, map } from 'rxjs';
import { log } from './utils/rx-utils';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    NzMenuModule,
  ],
  template: `
    <ul nz-menu nzMode="horizontal">
      <li nz-menu-item>
        <a routerLink="/participants">Clasificación</a>
      </li>
      <li nz-menu-item>
        <a routerLink="/round">Rondas</a>
      </li>
    </ul>

    <router-outlet></router-outlet>
  `,
  styles: [`
    html, body {
      margin: 0;
      padding: 0;
      height: 100vh;
      width: 100vw;
    }

    app-root {
      display: block;
      height: 100vh;
      width: 100vw;
      position: fixed;
      top: 0;
      left: 0;
    }

    router-outlet {
      height: 100%;
      width: 100%;
      box-sizing: border-box;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {

  private readonly repository = inject(SupabaseRepository);

  rounds$ = this.repository.getAll<Round>('round').pipe(
    map(({ data }) => data),
    filter((data) => !!data),
    log('menu rounds')
  );
}
