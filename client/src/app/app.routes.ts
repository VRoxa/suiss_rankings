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
            const { data: rounds } = await repository.disposable.raw
                    .from('round')
                    .select('id')
                    .order('id', { ascending: false })
                    .limit(1);

            const [lastRound] = rounds ?? [];
            return `round/${lastRound?.id ?? 0}`;
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
