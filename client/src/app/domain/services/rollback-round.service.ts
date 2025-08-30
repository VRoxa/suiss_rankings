import { inject } from "@angular/core";
import { SupabaseRepository } from "../repositories/supabase.service";
import { Participant } from "../entities/participant.entity";
import { Round } from "../entities/round.entity";
import { Match } from "../entities/match.entity";

interface Backup {
    id: number;
    value: string;
}

export const rollbackRound = async (
    repository?: SupabaseRepository
): Promise<void> => {
    repository ??= inject(SupabaseRepository);

    const { data } = await repository.disposable.raw
        .from('round')
        .select('*')
        .order('id', { ascending: false })
        .limit(1);

    const [lastRound] = data!;
    console.log('last round', lastRound);

    const [backup] = await repository.disposable.getAll<Backup>('backup');
    const lastParticipantsState = JSON.parse(backup.value) as Participant[];
    
    for (const participant of lastParticipantsState) {
        await repository.update<Participant>('participant', participant);
    }
    console.info('[ROLLBACK] participants updated');
    
    repository.delete<Round>('round', lastRound);
    console.info('[ROLLBACK] round deleted', lastRound);
    
    const allMatches = await repository.disposable.getAll<Match>('match');
    const lastRoundMatches = allMatches.filter(({ round }) => round === lastRound.id);
    
    for (const match of lastRoundMatches) {
        await repository.delete<Match>('match', match);
    }
    console.info('[ROLLBACK] last round matches deleted', lastRoundMatches);
}