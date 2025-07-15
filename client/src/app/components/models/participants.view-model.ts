import { Participant } from "../../domain/entities/participant.entity";

export type ParticipantViewModel = Participant & {
    difference: 'up' | 'down' | 'equal';
};

export type ParticipantsPageViewModel = {
    loading: boolean;
    data: ParticipantViewModel[];
}