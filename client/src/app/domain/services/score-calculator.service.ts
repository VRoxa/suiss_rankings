import { Match } from "../entities/match.entity";

// TODO - Make these values configurable
const FULL_WIN = 60;
const WIN_MATCH = 50;
const LOSE_MATCH = -50;
const GOAL_DIFFERENCE = 10;

export enum CountFor { One = 1, Two = 2 }

export const calculateScore = (score: Match['score'], countFor: CountFor): number => {
    const arrangedScore = score
        .filter(x => !!x)
        .map(({ score1, score2, winner }) => ({
            inFavor: countFor === CountFor.One ? score1 : score2,
            against: countFor === CountFor.One ? score2 : score1,
            winner: winner === countFor
        }));

    const won = arrangedScore.filter(({ winner }) => winner).length === 2;
    return +won * FULL_WIN +
        arrangedScore.reduce(
            (acc, match) => {
                return acc +
                    (match.inFavor - match.against) * GOAL_DIFFERENCE +
                    (match.winner ? WIN_MATCH : LOSE_MATCH)
            },
            0
        );
}
