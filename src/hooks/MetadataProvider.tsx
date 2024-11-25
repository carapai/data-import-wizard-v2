import {
    makeMetadata,
    Mapping,
    Metadata,
    StageMapping,
} from "data-import-wizard-utils";
import { useLiveQuery } from "dexie-react-hooks";
import { useStore } from "effector-react";
import { createContext, useContext, useMemo } from "react";
import { CQIDexie } from "../db";
import {
    $data,
    $dataSet,
    $dhis2DataSet,
    $dhis2Program,
    $goData,
    $goDataOptions,
    $indicators,
    $mapping,
    $program,
    $programIndicators,
    $remoteOrganisations,
    $tokens,
} from "../Store";

const MetadataContext = createContext<Metadata | undefined>(undefined);

export const MetadataProvider: React.FC<{
    children: React.ReactNode;
    db: CQIDexie;
}> = ({ children, db }) => {
    const mapping = useStore($mapping);
    const data = useStore($data);
    const dataSet = useStore($dataSet);
    const program = useStore($program);
    const dhis2DataSet = useStore($dhis2DataSet);
    const dhis2Program = useStore($dhis2Program);
    const goData = useStore($goData);
    const indicators = useStore($indicators);
    const programIndicators = useStore($programIndicators);
    const tokens = useStore($tokens);
    const remoteOrganisations = useStore($remoteOrganisations);
    const referenceData = useStore($goDataOptions);
    const unitsMapping =
        useLiveQuery(() => db.organisationMapping.toArray()) ?? [];
    const aMapping = useLiveQuery(() => db.attributeMapping.toArray()) ?? [];
    const eMapping = useLiveQuery(() => db.enrollmentMapping.toArray()) ?? [];
    const sMapping = useLiveQuery(() => db.programStageMapping.toArray()) ?? [];
    const atMapping = useLiveQuery(() => db.attributionMapping.toArray()) ?? [];
    const oMapping = useLiveQuery(() => db.optionsMapping.toArray()) ?? [];

    const isLoading =
        aMapping === undefined ||
        eMapping === undefined ||
        sMapping === undefined ||
        atMapping === undefined ||
        oMapping === undefined;

    const state = useMemo(() => {
        const attributionMapping = atMapping.reduce<Mapping>((a, b) => {
            if (b.destination) {
                a[b.destination] = b;
            }
            return a;
        }, {});
        const optionsMapping = oMapping.reduce<Mapping>((a, b) => {
            if (b.destination) {
                a[b.destination] = b;
            }
            return a;
        }, {});

        const organisationUnitMapping = unitsMapping.reduce<Mapping>((a, b) => {
            if (b.destination) {
                a[b.destination] = b;
            }
            return a;
        }, {});

        const attributeMapping = aMapping.reduce<Mapping>((a, b) => {
            if (b.destination) {
                a[b.destination] = b;
            }
            return a;
        }, {});
        const enrollmentMapping = eMapping.reduce<Mapping>((a, b) => {
            if (b.destination) {
                a[b.destination] = b;
            }
            return a;
        }, {});
        const programStageMapping = sMapping.reduce<StageMapping>((a, b) => {
            if (b.stage && b.destination && a[b.stage]) {
                a[b.stage][b.destination] = b;
            } else if (b.stage && b.destination) {
                a[b.stage] = {
                    [b.destination]: b,
                };
            }
            return a;
        }, {});
        return makeMetadata({
            attributeMapping,
            enrollmentMapping,
            programStageMapping,
            organisationUnitMapping,
            attributionMapping,
            optionsMapping,
            mapping,
            data,
            program,
            dataSet,
            dhis2DataSet,
            dhis2Program,
            goData,
            indicators,
            programIndicators,
            referenceData,
            remoteOrganisations,
            tokens,
        });
    }, [
        unitsMapping,
        aMapping,
        atMapping,
        oMapping,
        eMapping,
        sMapping,
        isLoading,
        data,
        program,
    ]);

    return (
        <MetadataContext.Provider value={state}>
            {children}
        </MetadataContext.Provider>
    );
};

export const useMetadata = () => {
    const context = useContext(MetadataContext);
    if (context === undefined) {
        throw new Error(
            "useGlobalState must be used within a GlobalStateProvider",
        );
    }
    return context;
};
