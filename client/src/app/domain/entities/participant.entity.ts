
export interface Participant {
    id: number;
    name: string;
    score: number;
    eliminated: boolean;

    // Foreign key to round::id
    lastRoundScored: number;
}
