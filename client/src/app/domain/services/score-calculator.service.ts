import { Configuration } from "../../components/models/configuration.model";
import { Match } from "../entities/match.entity";

export enum CountFor { One = 1, Two = 2 }

const hasFinished = (score: Match['score'][number]): score is NonNullable<Match['score'][number]> => {
    return score?.winner !== undefined && score.winner !== 0;
}

export const calculateScore = async (
    configuration: Configuration['scorePoints'],
    score: Match['score'],
    countFor: CountFor
): Promise<number> => {

    const arrangedScore = score
        .filter(hasFinished)
        .map(({ score1, score2, winner }) => ({
            inFavor: countFor === CountFor.One ? score1 : score2,
            against: countFor === CountFor.One ? score2 : score1,
            winner: winner === countFor
        }));

    const won = arrangedScore.filter(({ winner }) => winner).length === 2;
    return +won * configuration.fullWin +
        arrangedScore.reduce(
            (acc, match) => {
                return acc +
                    (match.inFavor - match.against) * configuration.goalDifference +
                    (match.winner ? configuration.winGame : configuration.loseGame)
            },
            0
        );
}
