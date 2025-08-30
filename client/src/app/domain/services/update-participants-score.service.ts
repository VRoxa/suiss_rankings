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

    /* SAVE PARTICIPANTS BACKUP for ROLLBACK */
    /* UPDATE PARTICIPANTS' SCORE BASED ON CURRENT ROUND RESULTS */
    const participants = await repository.disposable.getAll<Participant>(
        'participant'
    );

    const outdatedParticipants = participants
        .filter(({ eliminated }) => !eliminated)
        .filter(({ lastRoundScored }) => lastRoundScored !== currentRoundId)
        .map(x => ({...x}));

    if (outdatedParticipants.length === 0) {
        return;
    }

    const backup = {
        id: 0,
        value: JSON.stringify(participants),
    };

    await repository.update('backup', backup);

    for (const participant of outdatedParticipants) {
        const { difference } = resultsOfCurrentRound.find(
            ({ team }) => team === participant.id
        )!;
        participant.score += difference;
        participant.lastRoundScored = currentRoundId;
    }

    updateParticipantsImprovement(participants, outdatedParticipants);

    await Promise.all(
        outdatedParticipants.map((p) => repository.update('participant', p))
    );

    console.debug(
        `[UPDATE SCORES] Participants' score updated`,
        outdatedParticipants
    );
};

const updateParticipantsImprovement = (allParticipants: Participant[], participants: Participant[]) => {
    const originalOrder = allParticipants
        .filter(({ eliminated }) => !eliminated)
        .sort(({score: a}, {score: b}) => b - a);

    const currentOrder = participants.sort(({score: a}, {score: b}) => b - a);

    currentOrder.forEach((value, index) => {
        const getImprovement = () => {
            const previousIndex = originalOrder.findIndex(x => x.id === value.id);
            if (previousIndex === -1 || previousIndex === index) {
                return 0;
            }

            // The current participant position is above the previous.
            return index < previousIndex
                ? 1
                : -1;
        }

        value.improvement = getImprovement();
        console.log('improvement for participant', value.name, value.improvement);
    });
}
