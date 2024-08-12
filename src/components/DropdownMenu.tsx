import {
    IconButton,
    Input,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Stack,
    Text,
    useToast,
} from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import { useNavigate } from "@tanstack/react-location";
import { Modal } from "antd";
import {
    generateUid,
    getGoDataToken,
    getPreviousAggregateMapping,
    getPreviousProgramMapping,
    IMapping,
    loadPreviousGoData,
    loadPreviousMapping,
} from "data-import-wizard-utils";
import { useLiveQuery } from "dexie-react-hooks";
import { useStore } from "effector-react";
import { isEmpty } from "lodash";
import { ChangeEvent, useState } from "react";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { db } from "../db";
import {
    attributeMappingApi,
    attributionMappingApi,
    currentSourceOptionsApi,
    dataSetApi,
    dhis2DataSetApi,
    dhis2ProgramApi,
    enrollmentMappingApi,
    goDataApi,
    goDataOptionsApi,
    mappingApi,
    optionMappingApi,
    ouMappingApi,
    programApi,
    remoteOrganisationsApi,
    stageMappingApi,
    tokensApi,
} from "../Events";
import { LocationGenerics } from "../Interfaces";

import {
    $attributeMapping,
    $enrollmentMapping,
    $mapping,
    $metadata,
    $optionMapping,
    $organisationUnitMapping,
    $program,
    $programStageMapping,
    $version,
    actionApi,
    hasErrorApi,
} from "../Store";
import { saveProgramMapping } from "../utils/utils";
import DataImportSummary from "./DataImportSummary";
import DataPreview from "./DataPreview";
import ImportExportOptions from "./ImportExportOptions";
import SwitchComponent, { Case } from "./SwitchComponent";

export default function DropdownMenu({
    id,
    data,
    message,
    setMessage,
    isOpen,
    onOpen,
    onClose,
    afterDelete,
    afterClone,
    name,
}: {
    id: string;
    data: any[];
    message: string;
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    afterDelete: (id: string) => void;
    afterClone: (mapping: Partial<IMapping>) => void;
    name: string;
}) {
    const engine = useDataEngine();
    const toast = useToast();
    const navigate = useNavigate<LocationGenerics>();
    const [currentMapping, setCurrentMapping] = useState<string>("");
    const [currentName, setCurrentName] = useState<string>(`Copy of ${name}`);
    const version = useStore($version);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
    const workingMapping = useStore($mapping);
    const metadata = useStore($metadata);
    const organisationUnitMapping = useStore($organisationUnitMapping);
    const attributeMapping = useStore($attributeMapping);
    const optionMapping = useStore($optionMapping);
    const programStageMapping = useStore($programStageMapping);
    const enrollmentMapping = useStore($enrollmentMapping);
    const program = useStore($program);
    const [action, setAction] = useState<
        "configuring" | "previewing" | "uploading"
    >("configuring");

    const responses = useLiveQuery(() =>
        db.dataValueResponses.where({ completed: "false" }).toArray(),
    );

    const clone = async (id: string) => {
        const previousMappings = await loadPreviousMapping(
            { engine },
            ["iw-mapping"],
            id,
        );
        const mapping: Partial<IMapping> = previousMappings["iw-mapping"] ?? {};
        if (mapping.type === "individual") {
            const {
                programStageMapping,
                attributeMapping,
                organisationUnitMapping,
                optionMapping,
            } = await getPreviousProgramMapping(
                { engine },
                mapping,
                (message: string) => setMessage(() => message),
            );
            const programMapping = {
                ...mapping,
                id: generateUid(),
                name: currentName,
            };

            await saveProgramMapping({
                engine,
                mapping: programMapping,
                action: "creating",
                organisationUnitMapping,
                programStageMapping,
                attributeMapping,
                optionMapping,
                enrollmentMapping,
            });
            setLoading(() => false);
            setOpen(() => false);
            afterClone(programMapping);
            await loadMapping(programMapping.id);
        } else if (mapping.type === "aggregate") {
            // const { attributeMapping, organisationUnitMapping, dataSet } =
            //     await getPreviousAggregateMapping(mapping);
        }
    };

    const showModal = (id: string) => {
        setCurrentMapping(() => id);
        setOpen(() => true);
    };

    const handleOk = async () => {
        setLoading(() => true);
        await clone(currentMapping);
    };
    const handleOptionsOk = async () => {
        await runMapping(workingMapping);
    };

    const handleCancel = () => {
        setOpen(() => false);
    };
    const handleOptionsCancel = () => {
        setAction(() => "configuring");
        setOptionsDialogOpen(() => false);
    };
    const runDataSet = async (mapping: Partial<IMapping>) => {
        if (
            mapping.dataSource &&
            [
                "csv-line-list",
                "xlsx-line-list",
                "xlsx-tabular-data",
                "xlsx-form",
                "json",
            ].indexOf(mapping.dataSource) !== -1
        ) {
            setAction(() => "previewing");
        } else {
            if (mapping.prefetch) {
                setAction(() => "previewing");
            } else {
                setAction(() => "uploading");
            }
        }
    };

    const runProgram = async (mapping: Partial<IMapping>) => {
        if (
            mapping.dataSource &&
            [
                "csv-line-list",
                "xlsx-line-list",
                "xlsx-tabular-data",
                "xlsx-form",
                "json",
            ].indexOf(mapping.dataSource) !== -1
        ) {
            setAction(() => "previewing");
        } else {
            if (mapping.prefetch) {
                setAction(() => "previewing");
            } else {
                setAction(() => "uploading");
            }
        }
    };

    const run = async (id: string) => {
        onOpen();
        setMessage(() => "Loading previous mapping");
        const previousMappings = await loadPreviousMapping(
            { engine },
            ["iw-mapping"],
            id,
        );
        const mapping: Partial<IMapping> = previousMappings["iw-mapping"] ?? {};

        if (mapping.type === "individual") {
            const {
                programStageMapping,
                attributeMapping,
                organisationUnitMapping,
                optionMapping,
                program,
                remoteProgram,
                enrollmentMapping,
            } = await getPreviousProgramMapping(
                { engine },
                mapping,
                (message: string) => setMessage(() => message),
            );
            programApi.set(program);
            stageMappingApi.set(programStageMapping);
            attributeMappingApi.set(attributeMapping);
            ouMappingApi.set(organisationUnitMapping);
            mappingApi.set(mapping);
            optionMappingApi.set(optionMapping);
            dhis2ProgramApi.set(remoteProgram);
            enrollmentMappingApi.set(enrollmentMapping);

            if (!isEmpty(program)) {
                mappingApi.update({
                    attribute: "program",
                    path: "isTracker",
                    value: program.registration,
                });
            }

            if (!isEmpty(remoteProgram)) {
                mappingApi.update({
                    attribute: "program",
                    path: "remoteIsTracker",
                    value: remoteProgram.registration,
                });
            }
        } else if (mapping.type === "aggregate") {
            const {
                attributeMapping,
                attributionMapping,
                organisationUnitMapping,
                remoteDataSet,
                dataSet,
            } = await getPreviousAggregateMapping(
                { engine },
                mapping,
                (message: string) => setMessage(() => message),
            );
            mappingApi.set(mapping);
            attributeMappingApi.set(attributeMapping);
            ouMappingApi.set(organisationUnitMapping);
            attributionMappingApi.set(attributionMapping);
            dhis2DataSetApi.set(remoteDataSet);
            dataSetApi.set(dataSet);
        }
        onClose();
        setOptionsDialogOpen(() => true);
    };

    const runMapping = async (mapping: Partial<IMapping>) => {
        if (action === "configuring") {
            if (mapping.type === "aggregate") {
                await runDataSet(mapping);
            } else if (mapping.type === "individual") {
                await runProgram(mapping);
            }
        } else if (action === "previewing") {
            setAction(() => "uploading");
        } else if (action === "uploading") {
            setOptionsDialogOpen(() => false);
            setAction(() => "configuring");
        }
    };

    const loadMapping = async (id: string) => {
        onOpen();
        actionApi.edit();
        setMessage(() => "Loading previous mapping");
        const previousMappings = await loadPreviousMapping(
            { engine },
            ["iw-mapping"],
            id,
        );
        const mapping: Partial<IMapping> = previousMappings["iw-mapping"] ?? {};
        if (mapping.type === "individual") {
            const {
                programStageMapping,
                attributeMapping,
                organisationUnitMapping,
                optionMapping,
                program,
                remoteProgram,
                enrollmentMapping,
            } = await getPreviousProgramMapping(
                { engine },
                mapping,
                (message: string) => setMessage(() => message),
            );
            programApi.set(program);
            stageMappingApi.set(programStageMapping);
            attributeMappingApi.set(attributeMapping);
            ouMappingApi.set(organisationUnitMapping);
            mappingApi.set(mapping);
            optionMappingApi.set(optionMapping);
            dhis2ProgramApi.set(remoteProgram);
            enrollmentMappingApi.set(enrollmentMapping);

            if (!isEmpty(program)) {
                mappingApi.update({
                    attribute: "program",
                    path: "isTracker",
                    value: program.registration,
                });
            }

            if (!isEmpty(remoteProgram)) {
                mappingApi.update({
                    attribute: "program",
                    path: "remoteIsTracker",
                    value: remoteProgram.registration,
                });
            }

            if (mapping.dataSource === "go-data") {
                setMessage(() => "Getting Go.Data token");
                try {
                    const token = await getGoDataToken(mapping);
                    setMessage(() => "Loading previous data");
                    const {
                        options,
                        outbreak,
                        tokens,
                        goDataOptions,
                        hierarchy,
                    } = await loadPreviousGoData(token, mapping);
                    goDataApi.set(outbreak);
                    tokensApi.set(tokens);
                    goDataOptionsApi.set(goDataOptions);
                    currentSourceOptionsApi.set(options);
                    remoteOrganisationsApi.set(
                        hierarchy.flat().map(({ id, name, parentInfo }) => ({
                            id,
                            name: `${[
                                ...parentInfo.map(({ name }) => name),
                                name,
                            ].join("/")}`,
                        })),
                    );
                    onClose();
                    navigate({ to: "./individual" });
                } catch (error: any) {
                    toast({
                        title: "Something went wrong",
                        description: error?.message ?? "",
                        status: "error",
                        duration: 9000,
                        isClosable: true,
                    });
                    hasErrorApi.set(true);
                    onClose();
                }
            } else if (mapping.dataSource === "dhis2-program") {
                onClose();
                navigate({ to: "./individual" });
            } else {
                onClose();
                navigate({ to: "./individual" });
            }
        } else if (mapping.type === "aggregate") {
            const {
                attributeMapping,
                organisationUnitMapping,
                dataSet,
                attributionMapping,
                remoteDataSet,
            } = await getPreviousAggregateMapping(
                { engine },
                mapping,
                (message: string) => setMessage(() => message),
            );
            mappingApi.set(mapping);
            dataSetApi.set(dataSet);
            dhis2DataSetApi.set(remoteDataSet);
            attributeMappingApi.set(attributeMapping);
            ouMappingApi.set(organisationUnitMapping);
            attributionMappingApi.set(attributionMapping);
            onClose();
            navigate({ to: "./aggregate" });
        } else {
            onClose();
            navigate({ to: "./aggregate" });
        }
    };
    const deleteMapping = async (id: string) => {
        const mutation: any = {
            type: "delete",
            id,
            resource: "dataStore/iw-mapping",
        };
        const mutation2: any = {
            type: "delete",
            id,
            resource: "dataStore/iw-ou-mapping",
        };
        const mutation3: any = {
            type: "delete",
            id,
            resource: "dataStore/iw-attribute-mapping",
        };
        const mutation4: any = {
            type: "delete",
            id,
            resource: "dataStore/iw-stage-mapping",
        };
        const mutation5: any = {
            type: "delete",
            id,
            resource: "dataStore/iw-option-mapping",
        };

        try {
            engine.mutate(mutation);
        } catch (e: any) {
            console.log(e?.message);
        }
        try {
            engine.mutate(mutation2);
        } catch (e: any) {
            console.log(e?.message);
        }
        try {
            engine.mutate(mutation3);
        } catch (e: any) {
            console.log(e?.message);
        }
        try {
            engine.mutate(mutation4);
        } catch (e: any) {
            console.log(e?.message);
        }
        try {
            engine.mutate(mutation5);
        } catch (e: any) {
            console.log(e?.message);
        }
        afterDelete(id);
        toast({
            title: "Mapping deleted.",
            description: "Mapping has been deleted",
            status: "success",
            duration: 9000,
            isClosable: true,
        });
    };
    return (
        <>
            <Menu>
                <MenuButton
                    as={IconButton}
                    icon={
                        <BiDotsVerticalRounded
                            style={{
                                width: "20px",
                                height: "20px",
                            }}
                        />
                    }
                    bg="none"
                />
                <MenuList>
                    <MenuItem onClick={() => run(id)}>Run</MenuItem>
                    <MenuItem onClick={() => loadMapping(id)}>Edit</MenuItem>
                    <MenuItem onClick={() => showModal(id)}>Clone</MenuItem>
                    {/* <MenuItem>Download</MenuItem> */}
                    <MenuItem onClick={() => deleteMapping(id)}>
                        Delete
                    </MenuItem>
                </MenuList>
            </Menu>

            <Modal
                title="Basic Modal"
                open={optionsDialogOpen}
                onOk={handleOptionsOk}
                onCancel={handleOptionsCancel}
                width="75%"
            >
                <SwitchComponent condition={action}>
                    <Case value="previewing">
                        <DataPreview />
                    </Case>
                    <Case value="uploading">
                        <DataImportSummary />
                    </Case>
                    <Case default>
                        <ImportExportOptions showFileUpload />
                    </Case>
                </SwitchComponent>
            </Modal>

            <Modal
                title="Basic Modal"
                open={open}
                onOk={handleOk}
                onCancel={handleCancel}
                width="75%"
            >
                <Stack>
                    <Text>New name</Text>
                    <Input
                        value={currentName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            e.persist();
                            setCurrentName(() => e.target.value);
                        }}
                    />
                </Stack>
            </Modal>

            {/* <Modal
                isOpen={optionsDialogOpen}
                onClose={() => setOptionsDialogOpen(() => false)}
                isCentered
                autoFocus
                size="6xl"
                scrollBehavior="inside"
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Options</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody></ModalBody>

                    <ModalFooter>
                        <Stack
                            direction="row"
                            spacing="20px"
                            justifyContent="flex-end"
                            key="Buttons"
                        >
                            <Button
                                onClick={handleOptionsCancel}
                                colorScheme="red"
                            >
                                Cancel
                            </Button>
                            <Button
                                isLoading={
                                    action === "uploading" &&
                                    responses &&
                                    responses.length > 0
                                }
                                onClick={handleOptionsOk}
                                colorScheme="green"
                            >
                                OK
                            </Button>
                        </Stack>
                    </ModalFooter>
                </ModalContent>
            </Modal> */}

            {/* <Modal
                isOpen={open}
                onClose={() => setOpen(() => false)}
                isCentered
                autoFocus
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Set mapping name</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody></ModalBody>

                    <ModalFooter>
                        <Stack
                            direction="row"
                            spacing="20px"
                            justifyContent="flex-end"
                            key="Buttons"
                        >
                            <Button onClick={handleCancel} colorScheme="red">
                                Cancel
                            </Button>
                            <Button
                                isLoading={loading}
                                onClick={handleOk}
                                colorScheme="green"
                            >
                                Clone
                            </Button>
                        </Stack>
                    </ModalFooter>
                </ModalContent>
            </Modal> */}
        </>
    );
}
