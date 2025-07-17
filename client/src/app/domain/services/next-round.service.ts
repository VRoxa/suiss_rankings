import { inject } from '@angular/core';
import { SupabaseRepository } from '../repositories/supabase.service';
import { Match, MatchScore } from '../entities/match.entity';
import { Participant } from '../entities/participant.entity';
import { calculateScore, CountFor } from './score-calculator.service';
import { Round } from '../entities/round.entity';
import { AddingEntity } from '../repositories/types/supabase.types';

const sortByScore = <T extends { score: number }>(participants: T[]): T[] =>
    [...participants].sort(({ score: a }, { score: b }) => b - a);

const pair = <T>(elements: T[]): T[][] => {
    return elements.reduce(
        (acc, current, index, arr) =>
            index % 2 === 0 ? [...acc, [current, arr[index + 1]]] : acc,
        [] as T[][]
    );
};

// Fisher-Yates (Knuth)
const shuffle = <T>(elements: T[]): T[] => {
    let currentIndex = elements.length;
    let randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [elements[currentIndex], elements[randomIndex]] = [
            elements[randomIndex],
            elements[currentIndex],
        ];
    }

    return elements;
};

export const startingRound = async (): Promise<void> => {
    const repository = inject(SupabaseRepository);

    /* SHUFFLE PARTICIPANTS RANDOMLY */
    const participants = await repository.disposable.getAll<Participant>(
        'participant'
    );

    const shuffledParticipants = shuffle(participants);
    const pairedParticipants = pair(shuffledParticipants);

    /* INSERT STARTING ROUND */
    const startingRoundId = await repository.add<Round>('round', {
        name: 'R1',
    });

    /* INSERT MATCHES FOR STARTING ROUND */
    await addMatchesForRound(
        repository,
        startingRoundId,
        pairedParticipants,
    );
};

export const nextRound = async (): Promise<void> => {
    const repository = inject(SupabaseRepository);

    const participants = await repository.disposable.getAll<Participant>(
        'participant'
    );

    const activeParticipants = participants.filter(
        ({ eliminated }) => !eliminated
    );

    /* INSERT NEXT ROUND */
    const { count } = await repository.disposable.raw
        .from('round')
        .select('*', { count: 'exact', head: true });
    const nextRoundName = `R${(count ?? 0) + 1}`;

    const nextRoundId = await repository.add<Round>('round', {
        name: nextRoundName,
    });

    console.info('[NEXT ROUND] Next round inserted', {
        nextRoundId,
        nextRoundName,
    });

    /* INSERT MATCHES FOR NEXT ROUND */
    const orderedParticipants = sortByScore(activeParticipants);
    const pairedParticipants = pair(orderedParticipants);
    await addMatchesForRound(repository, nextRoundId, pairedParticipants);
};

const addMatchesForRound = async (
    repository: SupabaseRepository,
    nextRoundId: number,
    pairedParticipants: Participant[][]
) => {
    const emptyScore: MatchScore = { winner: 0, score1: 0, score2: 0 };

    const matches = pairedParticipants.map(
        ([team1, team2], index): AddingEntity<Match> => ({
            round: nextRoundId,
            order: index,
            team1: team1.id,
            team2: team2.id,
            totalScore1: 0,
            totalScore2: 0,
            inProgress: true,
            score: [emptyScore, emptyScore, null],
        })
    );

    await repository.addAll('match', matches);

    console.info(`[NEXT ROUND]: Next round' matches inserted`);
};
