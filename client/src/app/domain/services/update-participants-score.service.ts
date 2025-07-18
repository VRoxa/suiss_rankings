import { inject } from '@angular/core';
import { Match } from '../entities/match.entity';
import { SupabaseRepository } from '../repositories/supabase.service';
import { Participant } from '../entities/participant.entity';

export const updateParticipantsScore = async (
    currentRoundMatches: Match[]
): Promise<void> => {
    const repository = inject(SupabaseRepository);

    const resultsOfCurrentRound = currentRoundMatches.flatMap((match) => [
        {
            team: match.team1,
            difference: match.totalScore1,
        },
        {
            team: match.team2,
            difference: match.totalScore2,
        },
    ]);

    const { round: currentRoundId } = currentRoundMatches[0];

    /* UPDATE PARTICIPANTS' SCORE BASED ON CURRENT ROUND RESULTS */
    const participants = await repository.disposable.getAll<Participant>(
        'participant'
    );

    const outdatedParticipants = participants
        .filter(({ eliminated }) => !eliminated)
        .filter(({ lastRoundScored }) => lastRoundScored !== currentRoundId);

    for (const participant of outdatedParticipants) {
        const { difference } = resultsOfCurrentRound.find(
            ({ team }) => team === participant.id
        )!;
        participant.score += difference;
        participant.lastRoundScored = currentRoundId;
    }

    await Promise.all(
        outdatedParticipants.map((p) => repository.update('participant', p))
    );

    console.debug(
        `[UPDATE SCORES] Participants' score updated`,
        outdatedParticipants
    );
};
