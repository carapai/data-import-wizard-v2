import { Stack, useDisclosure } from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import { AxiosInstance } from "axios";
import { convert } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { uniqBy } from "lodash";
import { useEffect, useState } from "react";
import { processedGoDataDataApi, processor } from "../../Events";
import {
    $attributeMapping,
    $data,
    $enrollmentMapping,
    $goData,
    $mapping,
    $metadata,
    $optionMapping,
    $organisationUnitMapping,
    $program,
    $programStageMapping,
    $remoteAPI,
    $tokens,
} from "../../Store";

import { $version } from "../../Store";
import GoDataPreview from "../GoDataPreview";
import Progress from "../Progress";
import SwitchComponent, { Case } from "../SwitchComponent";
import OtherSystemPreview from "./OtherSystemPreview";
import TrackerDataPreview from "./TrackerDataPreview";

export default function ProgramDataPreview() {
    const version = useStore($version);
    const metadata = useStore($metadata);
    const program = useStore($program);
    const tokens = useStore($tokens);
    const engine = useDataEngine();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const mapping = useStore($mapping);
    const programStageMapping = useStore($programStageMapping);
    const enrollmentMapping = useStore($enrollmentMapping);
    const organisationUnitMapping = useStore($organisationUnitMapping);
    const attributeMapping = useStore($attributeMapping);
    const optionMapping = useStore($optionMapping);
    const goData = useStore($goData);
    const data = useStore($data);
    const [message, setMessage] = useState<string>("");
    const remoteApi = useStore($remoteAPI);
    const process = async () => {
        processor.reset();
        processedGoDataDataApi.reset();
        let sourceApi: Partial<{ engine: any; axios: AxiosInstance }> = {};
        let destinationApi: Partial<{ engine: any; axios: AxiosInstance }> = {};
        if (mapping.isSource) {
            sourceApi = { engine };
            destinationApi = { axios: remoteApi };
        } else if (mapping.isCurrentInstance) {
            sourceApi = { engine };
            destinationApi = { engine };
        } else if (remoteApi) {
            sourceApi = { axios: remoteApi };
            destinationApi = { engine };
        } else {
            destinationApi = { engine };
        }
        onOpen();
        setMessage(() => "Fetching data");
        await convert({
            afterConversion: (converted) => {
                if (mapping.isSource) {
                } else {
                    const {
                        trackedEntityInstances,
                        enrollments,
                        events,
                        trackedEntityInstanceUpdates,
                        eventUpdates,
                        errors,
                        conflicts,
                    } = converted;
                    processor.addInstances(trackedEntityInstances);
                    processor.addEnrollments(enrollments);
                    processor.addEvents(events);
                    processor.addInstanceUpdated(trackedEntityInstanceUpdates);
                    processor.addEventUpdates(eventUpdates);
                    processor.addErrors(uniqBy(errors, "id"));
                    processor.addConflicts(uniqBy(conflicts, "id"));
                }
            },
            attributeMapping,
            programStageMapping,
            mapping,
            sourceApi,
            destinationApi,
            optionMapping,
            enrollmentMapping,
            version,
            additionalParams: {},
            setMessage,
            organisationUnitMapping,
            goData,
            data,
            tokens,
            program,
            metadata,
        });
        onClose();
    };

    useEffect(() => {
        process();
        return () => {};
    }, []);
    return (
        <Stack
            h="calc(100vh - 350px)"
            maxH="calc(100vh - 350px)"
            overflow="auto"
        >
            <SwitchComponent condition={mapping.isSource}>
                <Case value={true}>
                    <SwitchComponent condition={mapping.dataSource}>
                        <Case value="csv-line-list">CSV</Case>
                        <Case value="xlsx-line-list">XLSX</Case>
                        <Case value="go-data">
                            <GoDataPreview />
                        </Case>
                        <Case value="json">JSON</Case>
                        <Case value="api">
                            <OtherSystemPreview />
                        </Case>
                        <Case default>
                            <OtherSystemPreview />
                        </Case>
                    </SwitchComponent>
                </Case>
                <Case default>
                    <TrackerDataPreview />
                </Case>
            </SwitchComponent>
            <Progress
                onClose={onClose}
                isOpen={isOpen}
                message={message}
                onOpen={onOpen}
            />
        </Stack>
    );
}
