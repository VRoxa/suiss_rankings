import { inject } from "@angular/core"
import { SupabaseRepository } from "../repositories/supabase.service"
import { ConfigurationValue } from "../entities/configuration-value.entity";
import { Configuration } from "../../components/models/configuration.model";

export const getConfiguration = async (repository?: SupabaseRepository): Promise<Configuration> => {
    repository ??= inject(SupabaseRepository);
    const values = await repository.disposable.getAll<ConfigurationValue>('configuration');

    const getValue = (name: string): number => {
        const value = values.find(x => x.name === name)!.value;
        return +value;
    }

    const configuration: Configuration = {
        maxRounds: getValue('maxRounds'),
        knockoutRound: getValue('knockoutRound'),
        participantsToKnockout: getValue('participantsToKnockout'),
        goalsPerMatch: getValue('goalsPerMatch'),
        gamesPerMatch: getValue('gamesPerMatch'),
        scorePoints: {
            fullWin: getValue('fullWin'),
            winGame: getValue('winGame'),
            loseGame: getValue('loseGame'),
            goalDifference: getValue('goalDifference'),
        },
    };

    return configuration;
}

export const saveConfiguration = async (configuration: Configuration): Promise<void> => {
    const repository = inject(SupabaseRepository);
    const flatConfiguration: Partial<Configuration> = {
        ...configuration,
        ...configuration.scorePoints
    };
    delete flatConfiguration.scorePoints;

    const saveValue = async (name: keyof Configuration): Promise<void> => {
        const record = {
            name,
            value: flatConfiguration[name],
        };

        const { error } = await repository.disposable.raw
            .from('configuration')
            .update(record)
            .eq('name', record.name);

        if (!!error) {
            throw new Error(`(${error.code}) Error updating configuration value ${name}. ${error.message}`)
        }
    }

    await Promise.all(
        (<(keyof Configuration)[]>Object.keys(flatConfiguration)).map(saveValue),
    );
}
