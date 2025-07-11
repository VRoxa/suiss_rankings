import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './domain/repositories/supabase.service';
import { Match } from './domain/entities/match.entity';
import { CommonModule } from '@angular/common';
import { Participant } from './domain/entities/participant.entity';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly repository = inject(SupabaseService);

  source$ = this.repository.get<Match>('participant');

  public async add() {
    this.repository.add<Participant>('participant', {
      name: 'Javi Hector',
      score: 0,
    });
  }
}
