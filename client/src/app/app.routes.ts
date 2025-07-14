import { Routes } from '@angular/router';
import { ParticipantsPage } from './pages/participants.page';
import { RoundPage } from './pages/round.page';
import { inject } from '@angular/core';
import { SupabaseRepository } from './domain/repositories/supabase.service';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'participants',
        pathMatch: 'full'
    },
    {
        path: 'participants',
        component: ParticipantsPage,
    },
    {
        path: 'round',
        redirectTo: async () => {
            const repository = inject(SupabaseRepository);
            const { data: lastRound } = await repository.disposable.raw
                    .from('round')
                    .select('id')
                    .order('id', { ascending: false })
                    .limit(1);

            console.info('last round', lastRound);

            return `round/${lastRound![0].id}`;
        },
    },
    {
        path: 'round/:id',
        component: RoundPage,
    },
    {
        path: '**',
        redirectTo: 'participants',
    }
];
