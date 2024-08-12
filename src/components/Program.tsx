import { Stack, useToast } from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import { useNavigate } from "@tanstack/react-location";
import { Option, Step } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { LocationGenerics } from "../Interfaces";

import { activeStepsApi, mappingApi, processor } from "../Events";
import {
    $action,
    $attributeMapping,
    $data,
    $dhis2Program,
    $disabled,
    $enrollmentMapping,
    $goData,
    $goDataOptions,
    $mapping,
    $name,
    $names,
    $optionMapping,
    $organisationUnitMapping,
    $otherName,
    $prevGoData,
    $processed,
    $processedGoDataData,
    $program,
    $programStageMapping,
    $programTypes,
    $steps,
    $token,
    $tokens,
    actionApi,
    stepper,
} from "../Store";
import { saveProgramMapping } from "../utils/utils";
import ImportExportOptions from "./ImportExportOptions";
import MappingDetails from "./MappingDetails";
import OrganisationUnitMapping from "./OrganisationUnitMapping";
import AttributeMapping from "./program/AttributeMapping";
import EnrollmentMapping from "./program/EnrollmentMapping";
import EventMapping from "./program/EventMapping";
import { OtherSystemMapping } from "./program/OtherSystemMapping";
import ImportSummary from "./program/ProgramImportSummary";
import ProgramSelect from "./program/ProgramSelect";
import RemoteOutbreaks from "./RemoteOutbreak";
import RemoteProgramSelect from "./RemoteProgramSelect";
import StepperButtons from "./StepperButtons";
import StepsDisplay from "./StepsDisplay";
import DataPreview from "./DataPreview";

const importTypes: Option[] = [
    { value: "dhis2-program", label: "dhis2-program" },
    { value: "api", label: "api" },
    { value: "json", label: "json" },
    { value: "go-data", label: "go-data" },
    { value: "csv-line-list", label: "csv-line-list" },
    { value: "xlsx-line-list", label: "xlsx-line-list" },
    { value: "fhir", label: "fhir" },
];

const Program = () => {
    const toast = useToast();
    const activeStep = useStore($steps);
    const disabled = useStore($disabled);
    const programMapping = useStore($mapping);
    const organisationUnitMapping = useStore($organisationUnitMapping);
    const attributeMapping = useStore($attributeMapping);
    const programStageMapping = useStore($programStageMapping);
    const optionMapping = useStore($optionMapping);
    const enrollmentMapping = useStore($enrollmentMapping);
    const name = useStore($name);
    const otherName = useStore($otherName);
    const action = useStore($action);
    const engine = useDataEngine();
    const names = useStore($names);
    const navigate = useNavigate<LocationGenerics>();

    const steps: Step[] = [
        {
            label: "Mapping Details",
            content: <MappingDetails importTypes={importTypes} />,
            id: 2,
            nextLabel: "Next Step",
            lastLabel: "Go to Mappings",
        },
        {
            label: `${name} Program`,
            content: <ProgramSelect />,
            nextLabel: "Next Step",
            id: 3,
            lastLabel: "Go to Mappings",
        },
        {
            label: "Select Outbreak",
            content: <RemoteOutbreaks />,
            nextLabel: "Next Step",
            id: 5,
            lastLabel: "Go to Mappings",
        },
        {
            label: `${otherName} Program`,
            content: <RemoteProgramSelect />,
            nextLabel: "Next Step",
            id: 6,
            lastLabel: "Go to Mappings",
        },
        {
            label: "Organisation Mapping",
            content: <OrganisationUnitMapping />,
            nextLabel: "Next Step",
            id: 7,
            lastLabel: "Go to Mappings",
        },
        {
            label: "System Mapping",
            content: <OtherSystemMapping />,
            nextLabel: "Next Step",
            id: 8,
            lastLabel: "Go to Mappings",
        },
        {
            label: "Attribute Mapping",
            content: <AttributeMapping />,
            nextLabel: "Next Step",
            id: 9,
            lastLabel: "Go to Mappings",
        },
        {
            label: "Enrollment Mapping",
            content: <EnrollmentMapping />,
            nextLabel: "Next Step",
            id: 15,
            lastLabel: "Go to Mappings",
        },
        {
            label: "Events Mapping",
            content: <EventMapping />,
            nextLabel: "Next Step",
            id: 10,
            lastLabel: "Go to Mappings",
        },
        {
            label: "Import/Export Options",
            content: <ImportExportOptions />,
            nextLabel: "Next Step",
            id: 11,
            lastLabel: "Export Program",
        },
        {
            label: "Import Preview",
            content: <DataPreview />,
            nextLabel: "Import",
            id: 12,
            lastLabel: "Go to Mappings",
        },
        {
            label: "Import Summary",
            content: <ImportSummary />,
            nextLabel: "Go to Mappings",
            id: 13,
            lastLabel: "Go to Mappings",
        },
    ];

    const activeSteps = () => {
        const preview = programMapping.prefetch ? [12] : [];
        const noPreview = programMapping.prefetch ? [] : [12];
        const activeSteps = steps.filter(({ id }) => {
            if (
                programMapping.dataSource !== "dhis2-program" &&
                programMapping.isSource
            ) {
                if (programMapping.dataSource === "api") {
                    if (programMapping.prefetch) {
                        return [1, 2, 3, 7, 9, 10, 11, 15].indexOf(id) !== -1;
                    }
                    return [1, 2, 3, 7, 9, 11, 15].indexOf(id) !== -1;
                }
                if (programMapping.dataSource === "go-data") {
                    if (programMapping.isSource) {
                        return (
                            [1, 2, 3, 5, 7, 8, 11, 12, 13].indexOf(id) !== -1
                        );
                    } else {
                        return (
                            [1, 2, 3, 5, 7, 8, 13, 15, ...preview].indexOf(
                                id,
                            ) !== -1
                        );
                    }
                }
                if (
                    programMapping.dataSource &&
                    ["json", "csv-line-list", "xlsx-line-list"].indexOf(
                        programMapping.dataSource,
                    ) !== -1
                ) {
                    return [2, 3, 11, ...preview].indexOf(id) !== -1;
                }
                return [1, 2, 3, 11, ...preview].indexOf(id) !== -1;
            }

            if (programMapping.dataSource === "dhis2-program") {
                const remove = !programMapping.program?.isTracker
                    ? [9, 15]
                    : [];

                return [5, 8, ...remove, ...noPreview].indexOf(id) === -1;
            }
            if (programMapping.dataSource === "go-data") {
                if (!programMapping.program?.isTracker) {
                    return [6, 8, 9, 11, 15].indexOf(id) === -1;
                }
                return [6, 8, 11].indexOf(id) === -1;
            }
            const include = !programMapping.program?.isTracker ? [] : [9, 15];

            return [1, 2, 3, 7, 10, 11, 12, 13, ...include].indexOf(id) !== -1;
        });
        activeStepsApi.set(activeSteps);
        return activeSteps;
    };

    const onNext = () => {
        if (activeStep === activeSteps().length - 1) {
            processor.reset();
            stepper.reset();
        } else {
            stepper.next();
        }
    };

    const onSave = async () => {
        await saveProgramMapping({
            engine,
            mapping: {
                ...programMapping,
                ...names,
                type: "individual",
            },
            action,
            organisationUnitMapping,
            programStageMapping,
            attributeMapping,
            optionMapping,
            enrollmentMapping,
        });

        actionApi.edit();
        toast({
            title: "Mapping saved",
            description: "Mapping has been successfully saved",
            status: "success",
            duration: 9000,
            isClosable: true,
        });
    };
    const onFinish = async () => {
        if (
            programMapping.isSource &&
            programMapping.dataSource &&
            ["json", "csv-line-list", "xlsx-line-list"].indexOf(
                programMapping.dataSource,
            ) !== -1
        ) {
            console.log("We have finished");
        } else {
            mappingApi.reset({});
            $attributeMapping.reset();
            $mapping.reset();
            $program.reset();
            $optionMapping.reset();
            $organisationUnitMapping.reset();
            $programStageMapping.reset();
            $processed.reset();
            $prevGoData.reset();
            $data.reset();
            $goData.reset();
            $programTypes.reset();
            $tokens.reset();
            $processedGoDataData.reset();
            $token.reset();
            $goDataOptions.reset();
            $dhis2Program.reset();
            stepper.reset();
            navigate({ to: "/mappings" });
        }
    };

    return (
        <Stack p="20px" spacing="30px" flex={1}>
            <StepsDisplay
                activeStep={activeStep}
                activeSteps={activeSteps}
                disabled={disabled}
            />
            <StepperButtons
                disabled={disabled}
                steps={activeSteps()}
                onNext={onNext}
                onSave={onSave}
                onFinish={onFinish}
            />
        </Stack>
    );
};

export default Program;
