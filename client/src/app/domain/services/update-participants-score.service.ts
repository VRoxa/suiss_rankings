import { inject } from '@angular/core';
import { Match } from '../entities/match.entity';
import { SupabaseRepository } from '../repositories/supabase.service';
import { Participant } from '../entities/participant.entity';
import { calculateScore, CountFor } from './score-calculator.service';

export const updateParticipantsScore = async (
    currentRoundMatches: Match[]
): Promise<void> => {
    const repository = inject(SupabaseRepository);

    /* UPDATE PARTICIPANTS' SCORE BASED ON CURRENT ROUND RESULTS */
    const participants = await repository.disposable.getAll<Participant>(
        'participant'
    );

    const resultsOfCurrentRound = currentRoundMatches.flatMap((match) => [
        {
            team: match.team1,
            difference: calculateScore(match.score, CountFor.One),
        },
        {
            team: match.team2,
            difference: calculateScore(match.score, CountFor.Two),
        },
    ]);

    for (const participant of participants) {
        const { difference } = resultsOfCurrentRound.find(
            ({ team }) => team === participant.id
        )!;
        participant.score += difference;
    }

    await Promise.all(
        participants.map((p) => repository.update('participant', p))
    );

    console.log(`[UPDATE SCORES] Participants' score updated`, participants);
};
