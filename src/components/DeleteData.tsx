import { useDisclosure } from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import {
    fetchTrackedEntityInstances,
    TrackedEntityInstance,
} from "data-import-wizard-utils";
import { useState } from "react";
import ProgramSelect from "./program/ProgramSelect";

export default function DeleteData() {
    const engine = useDataEngine();
    const withoutEnrollment = (
        trackedEntityInstances: Array<Partial<TrackedEntityInstance>>,
    ) => {
        return trackedEntityInstances.flatMap(
            ({ trackedEntityInstance, enrollments }) => {
                if (enrollments?.length === 0) {
                    return { trackedEntityInstance };
                }
                return [];
            },
        );
    };
    const onProgramSelect = async (id?: string) => {
        await fetchTrackedEntityInstances(
            {
                api: { engine },
                program: id,
                withAttributes: false,
                additionalParams: {},
                trackedEntityInstances: [],
                uniqueAttributeValues: [],
                fields: "trackedEntityInstance",
            },
            async ({ trackedEntityInstances, pager }) => {
                const response = await engine.mutate({
                    resource: "trackedEntityInstances",
                    data: { trackedEntityInstances },
                    params: { strategy: "DELETE", async: "true" },
                    type: "create",
                });
            },
        );
    };

    return <ProgramSelect />;
}
