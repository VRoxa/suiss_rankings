
export interface Configuration {
    maxRounds: number;
    knockoutRound: number;
    participantsToKnockout: number;
    goalsPerMatch: number;
    gamesPerMatch: number;

    scorePoints: {
        fullWin: number;
        winGame: number;
        loseGame: number;
        goalDifference: number;
    }
}
