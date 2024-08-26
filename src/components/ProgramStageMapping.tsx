import { SearchIcon } from "@chakra-ui/icons";
import {
    Box,
    Checkbox,
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    Spacer,
    Stack,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { GroupBase, Select } from "chakra-react-select";
import {
    IProgramStageDataElement,
    Mapping,
    Option,
    RealMapping,
} from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { ChangeEvent, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { $mapping, $metadata, $names, $programStageMapping } from "../Store";

import { stageMappingApi } from "../Events";
import { createMapping } from "../utils/utils";
import DestinationIcon from "./DestinationIcon";
import FieldMapper from "./FieldMapper";
import OptionSetMapping from "./OptionSetMapping";
import ColumnMapping from "./program/ColumnMapping";
import FeatureColumn from "./program/FeatureColumn";
import SourceIcon from "./SourceIcon";
import Progress from "./Progress";
import InfoMapping from "./InfoMapping";

export default function ProgramStageMapping({
    psId,
    programStageDataElements,
    featureType,
}: {
    psId: string;
    programStageDataElements: IProgramStageDataElement[];
    repeatable: boolean;
    featureType: string;
}) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [message, setMessage] = useState<string>("");
    const mapping = useStore($mapping);
    const programStageMapping = useStore($programStageMapping);
    const metadata = useStore($metadata);
    const { source, destination } = useStore($names);
    const updateStage = (
        attributes: { attribute: string; value: any; key: keyof RealMapping }[],
        stage: string,
    ) => {
        for (const { attribute, value, key } of attributes) {
            stageMappingApi.update({
                key,
                attribute,
                stage,
                value,
            });
        }
    };

    const stageMapping: Mapping = programStageMapping[psId] ?? { info: {} };

    const { info = {}, ...rest } = stageMapping;
    const {
        createEvents = false,
        updateEvents = false,
        uniqueEventDate = false,
        createEmptyEvents = false,
        customEventIdColumn = false,
        customEventDateColumn = false,
        customDueDateColumn = false,
        completeEvents = false,
        eventDateColumn = "",
        eventIdColumn = "",
        stage,
    } = info;

    const [searchString, setSearchString] = useState<string>("");
    const [currentElements, setCurrentElements] = useState(
        programStageDataElements,
    );

    const columns: ColumnsType<Partial<IProgramStageDataElement>> = [
        {
            title: (
                <Stack direction="row" alignItems="center">
                    <DestinationIcon mapping={mapping} />
                    <Text> Destination Data Element</Text>
                    <Text>{destination}</Text>
                </Stack>
            ),
            render: (_, { dataElement }) => {
                return dataElement?.name;
            },
            key: "dataElement.name",
        },
        {
            title: "Compulsory",
            key: "manual",
            width: "100px",
            align: "center",
            render: (_, { dataElement }) => {
                if (dataElement) {
                    const { id } = dataElement;

                    const isMandatory =
                        programStageMapping[psId]?.[id]?.mandatory || false;

                    return (
                        <Checkbox
                            isChecked={isMandatory}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                stageMappingApi.update({
                                    attribute: id,
                                    key: "mandatory",
                                    stage: psId,
                                    value: e.target.checked,
                                })
                            }
                        />
                    );
                }
                return null;
            },
        },
        {
            title: "Custom",
            align: "center",
            key: "custom",
            render: (_, { dataElement }) => {
                if (dataElement) {
                    const { id } = dataElement;
                    const isCustom =
                        programStageMapping[psId]?.[id]?.isCustom || false;
                    return (
                        <Checkbox
                            isChecked={isCustom}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                stageMappingApi.update({
                                    attribute: id,
                                    key: "isCustom",
                                    stage: psId,
                                    value: e.target.checked,
                                })
                            }
                        />
                    );
                }
                return null;
            },
        },

        {
            title: "Specific",
            align: "center",
            key: "specific",
            render: (_, { dataElement }) => {
                if (dataElement) {
                    const { id } = dataElement;
                    const isSpecific =
                        programStageMapping[psId]?.[id]?.isSpecific || false;
                    return (
                        <Checkbox
                            isChecked={isSpecific}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                stageMappingApi.update({
                                    attribute: id,
                                    key: "isSpecific",
                                    stage: psId,
                                    value: e.target.checked,
                                })
                            }
                        />
                    );
                }
                return null;
            },
        },

        {
            title: (
                <Stack direction="row" alignItems="center">
                    <SourceIcon mapping={mapping} />
                    <Text> Source Data Element</Text>
                    <Text>{source}</Text>
                </Stack>
            ),
            key: "source",
            render: (_, { dataElement, compulsory }) => {
                if (dataElement) {
                    const { id } = dataElement;

                    return (
                        <FieldMapper
                            source={metadata.sourceColumns}
                            onUpdate={(attribute, key, value) =>
                                updateStage(
                                    [
                                        {
                                            attribute,
                                            key,
                                            value,
                                        },
                                    ],
                                    psId,
                                )
                            }
                            isSpecific={
                                programStageMapping[psId]?.[id]?.isSpecific
                            }
                            isCustom={programStageMapping[psId]?.[id]?.isCustom}
                            attribute={id}
                            value={stageMapping?.[id]?.value}
                            customType={stageMapping?.[id]?.customType}
                            mappedValues={[]}
                        />
                    );
                }
                return null;
            },
        },

        {
            title: "Unique",
            align: "center",
            key: "unique",
            render: (_, { dataElement }) => {
                if (dataElement) {
                    const { id } = dataElement;

                    const isUnique =
                        programStageMapping[psId]?.[id]?.unique || false;

                    return (
                        <Checkbox
                            isChecked={isUnique}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                stageMappingApi.update({
                                    attribute: id,
                                    key: "unique",
                                    stage: psId,
                                    value: e.target.checked,
                                })
                            }
                        />
                    );
                }
            },
        },
        {
            title: "Options",
            key: "options",
            align: "center",
            width: "100px",
            render: (text, { dataElement }) => {
                if (dataElement) {
                    const { id, optionSetValue, optionSet } = dataElement;
                    const value = programStageMapping[psId]?.[id]?.value || "";
                    if (optionSetValue) {
                        return (
                            <OptionSetMapping
                                value={value}
                                destinationOptions={optionSet?.options.map(
                                    ({ code, name }) => ({
                                        label: name,
                                        value: code,
                                    }),
                                )}
                                disabled={value === ""}
                                mapping={programStageMapping[psId]}
                            />
                        );
                    }
                }
                return null;
            },
        },

        {
            title: "Mapped",
            align: "center",
            width: "100px",
            render: (text, { dataElement }) => {
                if (dataElement) {
                    const { id } = dataElement;
                    if (rest[id]?.value) {
                        return (
                            <Icon
                                as={FiCheck}
                                color="green.400"
                                fontSize="2xl"
                            />
                        );
                    }
                }
                return null;
            },
            key: "mapped",
        },
    ];

    const filterUnits = (checked: boolean) => {
        const mapped = Object.keys(rest);
        if (checked) {
            setCurrentElements(() =>
                programStageDataElements.filter(
                    ({ dataElement: { id } }) => mapped.indexOf(id) !== -1,
                ),
            );
        } else {
            setCurrentElements(programStageDataElements);
        }
    };

    const searchOus = (search: string) => {
        setSearchString(() => search);
        setCurrentElements(() =>
            programStageDataElements.filter(({ dataElement: { id, name } }) =>
                name.toLowerCase().includes(search.toLowerCase()),
            ),
        );
    };

    const onCreateEvents = (e: ChangeEvent<HTMLInputElement>) => {
        stageMappingApi.update({
            stage: psId,
            attribute: "info",
            key: "createEvents",
            value: e.target.checked,
        });
    };

    const onUpdateEvents = (e: ChangeEvent<HTMLInputElement>) => {
        stageMappingApi.update({
            stage: psId,
            attribute: "info",
            key: "updateEvents",
            value: e.target.checked,
        });
    };

    const autoMap = async (map: boolean) => {
        onOpen();
        setMessage(() => "Trying to automatically map");
        createMapping({
            map,
            destinationOptions: programStageDataElements.map(
                ({ dataElement: { id, name, code } }) => ({
                    code: code,
                    label: name,
                    value: id,
                }),
            ),
            sourceOptions: metadata.sourceColumns,
            mapping: stageMapping,
            onMap(destinationValue, search) {
                if (search !== undefined) {
                    stageMappingApi.update({
                        stage: psId,
                        attribute: destinationValue,
                        key: "value",
                        value: search.value,
                    });
                }
            },
            onUnMap(destinationValue) {
                stageMappingApi.remove({
                    attribute: destinationValue,
                    stage: psId,
                });
            },
        });
        onClose();
    };

    return (
        <Stack key={psId} spacing="20px">
            <Stack direction="row" spacing="20px" alignItems="center">
                {mapping.dataSource === "dhis2-program" && (
                    <Stack flex={1} h="100%">
                        <Text>Specific Stage</Text>
                        <Box flex={1}>
                            <Select<Option, false, GroupBase<Option>>
                                value={metadata.destinationStages.find(
                                    (val) => val.value === stage,
                                )}
                                options={metadata.destinationStages}
                                isClearable
                                onChange={(e) => {
                                    stageMappingApi.update({
                                        stage: psId,
                                        attribute: "info",
                                        key: "stage",
                                        value: e?.value || "",
                                    });

                                    if (e) {
                                        updateStage(
                                            [
                                                {
                                                    attribute: "info",
                                                    key: "eventDateColumn",
                                                    value: `${e.value}.eventDate`,
                                                },
                                                {
                                                    attribute: "info",
                                                    key: "dueDateColumn",
                                                    value: `${e.value}.dueDate`,
                                                },
                                                {
                                                    attribute: "info",
                                                    key: "eventIdColumn",
                                                    value: `${e.value}.event`,
                                                },
                                            ],
                                            psId,
                                        );
                                    }
                                }}
                            />
                        </Box>
                    </Stack>
                )}

                <ColumnMapping
                    title="Event Date Column"
                    customColumn="customEventDateColumn"
                    value={eventDateColumn}
                    isCustom={customEventDateColumn}
                    psId={psId}
                    valueColumn="eventDateColumn"
                />
                <ColumnMapping
                    title="Due Date Column"
                    customColumn="customDueDateColumn"
                    value={eventDateColumn}
                    isCustom={customDueDateColumn}
                    psId={psId}
                    valueColumn="dueDateColumn"
                />

                <ColumnMapping
                    title="Event Id Column"
                    customColumn="customEventIdColumn"
                    value={eventIdColumn}
                    isCustom={customEventIdColumn}
                    psId={psId}
                    valueColumn="eventIdColumn"
                />
            </Stack>
            <Stack spacing={[1, 5]} direction={["column", "row"]}>
                <Checkbox
                    colorScheme="green"
                    isChecked={createEvents}
                    onChange={onCreateEvents}
                >
                    Create Events
                </Checkbox>

                <Checkbox
                    colorScheme="green"
                    isChecked={updateEvents}
                    onChange={onUpdateEvents}
                >
                    Update Events
                </Checkbox>

                <Checkbox
                    colorScheme="green"
                    isChecked={completeEvents}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        stageMappingApi.update({
                            stage: psId,
                            attribute: "info",
                            key: "completeEvents",
                            value: e.target.checked,
                        })
                    }
                >
                    Complete Events
                </Checkbox>
                <Checkbox
                    colorScheme="green"
                    isChecked={uniqueEventDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        stageMappingApi.update({
                            stage: psId,
                            attribute: "info",
                            key: "uniqueEventDate",
                            value: e.target.checked,
                        })
                    }
                >
                    Mark Event Date As Unique
                </Checkbox>
                <Checkbox
                    colorScheme="green"
                    isChecked={createEmptyEvents}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        stageMappingApi.update({
                            stage: psId,
                            attribute: "info",
                            key: "createEmptyEvents",
                            value: e.target.checked,
                        })
                    }
                >
                    Create Empty Events
                </Checkbox>
                <Checkbox
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        autoMap(e.target.checked)
                    }
                >
                    Auto Map
                </Checkbox>
            </Stack>

            <FeatureColumn featureType={featureType} psId={psId} />

            <Stack direction="row">
                <Checkbox
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        filterUnits(e.target.checked)
                    }
                >
                    <Text>Show Mapped Data Elements Only</Text>
                </Checkbox>
                <Spacer />
                <Box w="35%">
                    <InputGroup>
                        <InputLeftElement>
                            <SearchIcon color="gray.300" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search data elements"
                            value={searchString}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                searchOus(e.target.value)
                            }
                        />
                    </InputGroup>
                </Box>
            </Stack>

            <Table
                columns={columns}
                dataSource={currentElements}
                rowKey={({ dataElement }) => dataElement?.id ?? ""}
                pagination={{ pageSize: 5, hideOnSinglePage: true }}
                size="middle"
                footer={() => (
                    <Text textAlign="right">
                        Mapped{" "}
                        {
                            Object.values(rest).filter(({ value }) => !!value)
                                .length
                        }{" "}
                        of {currentElements.length}
                    </Text>
                )}
            />

            <Progress
                onClose={onClose}
                isOpen={isOpen}
                message={message}
                onOpen={onOpen}
            />
        </Stack>
    );
}
