import { Mapping, StageMapping } from "data-import-wizard-utils";
import { useLiveQuery } from "dexie-react-hooks";
import React from "react";
import { CQIDexie } from "../db";

export function useLiveQueries(db: CQIDexie) {
    const attributeMappingQuery = useLiveQuery(() =>
        db.attributeMapping.toArray(),
    );
    const attributionMappingQuery = useLiveQuery(() =>
        db.attributionMapping.toArray(),
    );
    const ouMappingQuery = useLiveQuery(() => db.organisationMapping.toArray());
    const stageMappingQuery = useLiveQuery(() =>
        db.organisationMapping.toArray(),
    );
    const optionMappingQuery = useLiveQuery(() => db.optionsMapping.toArray());
    const enrollmentMappingQuery = useLiveQuery(() =>
        db.enrollmentMapping.toArray(),
    );
    const result = React.useMemo(() => {
        if (
            !attributeMappingQuery ||
            !attributionMappingQuery ||
            !ouMappingQuery ||
            !optionMappingQuery ||
            !enrollmentMappingQuery ||
            !stageMappingQuery
        )
            return null;

        const attributeMapping = attributeMappingQuery?.reduce<Mapping>(
            (a, b) => {
                if (b.destination) {
                    a[b.destination] = b;
                }
                return a;
            },
            {},
        );
        const optionMapping = optionMappingQuery?.reduce<Mapping>((a, b) => {
            if (b.destination) {
                a[b.destination] = b;
            }
            return a;
        }, {});

        const attributionMapping = attributionMappingQuery?.reduce<Mapping>(
            (a, b) => {
                if (b.destination) {
                    a[b.destination] = b;
                }
                return a;
            },
            {},
        );

        const organisationUnitMapping: Mapping =
            ouMappingQuery?.reduce<Mapping>((a, b) => {
                if (b.destination) {
                    a[b.destination] = b;
                }
                return a;
            }, {}) ?? {};
        const enrollmentMapping: Mapping =
            enrollmentMappingQuery?.reduce<Mapping>((a, b) => {
                if (b.destination) {
                    a[b.destination] = b;
                }
                return a;
            }, {}) ?? {};

        const programStageMapping =
            stageMappingQuery?.reduce<StageMapping>((a, b) => {
                if (b.stage && b.destination && a[b.stage]) {
                    a[b.stage][b.destination] = b;
                } else if (b.stage && b.destination) {
                    a[b.stage] = {
                        [b.destination]: b,
                    };
                }
                return a;
            }, {}) ?? {};

        return {
            attributeMapping,
            optionMapping,
            programStageMapping,
            attributionMapping,
            organisationUnitMapping,
            enrollmentMapping,
        };
    }, [
        attributeMappingQuery,
        attributionMappingQuery,
        ouMappingQuery,
        stageMappingQuery,
        optionMappingQuery,
        enrollmentMappingQuery,
    ]);

    return result;
}
