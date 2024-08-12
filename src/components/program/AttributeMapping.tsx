import {
    Box,
    Checkbox,
    Icon,
    Input,
    Stack,
    Text,
    useToast,
} from "@chakra-ui/react";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { GroupBase, Select } from "chakra-react-select";
import { Option } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { FiCheck } from "react-icons/fi";

import { ChangeEvent, useEffect, useState } from "react";
import { attributeMappingApi } from "../../Events";
import { $attributeMapping, $mapping, $metadata, $names } from "../../Store";
import { findMapped, isMapped } from "../../utils/utils";
import CustomColumn from "../CustomColumn";
import DestinationIcon from "../DestinationIcon";
import MultipleSelect from "../MultipleSelect";
import OptionSetMapping from "../OptionSetMapping";
import Search from "../Search";
import SourceIcon from "../SourceIcon";
import InfoMapping from "../InfoMapping";

export default function AttributeMapping() {
    const {
        info: {
            customTrackedEntityInstanceColumn,
            trackedEntityInstanceColumn,
            customGeometryColumn,
            createEntities,
            updateEntities,
            geometryColumn,
        } = {
            customTrackedEntityInstanceColumn: false,
            customGeometryColumn: false,
            trackedEntityInstanceColumn: "",
            createEntities: false,
            updateEntities: false,
            geometryColumn: "",
        },
        ...attributeMapping
    } = useStore($attributeMapping);
    const programMapping = useStore($mapping);
    const toast = useToast();
    const metadata = useStore($metadata);
    const { source, destination } = useStore($names);
    const [attributes, setCurrentAttributes] = useState(
        metadata.destinationAttributes,
    );

    const [searchString, setSearchString] = useState<string>("");

    const currentMappingValues = Object.values(attributeMapping).map(
        ({ value }) => value,
    );

    const columns: ColumnsType<Partial<Option>> = [
        {
            title: (
                <Stack direction="row" alignItems="center">
                    <DestinationIcon mapping={programMapping} />
                    <Text> Destination Attribute</Text>
                    <Text>{destination}</Text>
                </Stack>
            ),
            dataIndex: "label",
            key: "label",
        },
        {
            title: "Mandatory",
            key: "mandatory",
            width: "100px",
            align: "center",
            render: (text, { value, mandatory }) => (
                <Checkbox
                    isChecked={
                        attributeMapping[value ?? ""]?.mandatory || mandatory
                    }
                    isReadOnly={mandatory}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        attributeMappingApi.update({
                            attribute: value ?? "",
                            key: "mandatory",
                            value: e.target.checked,
                        })
                    }
                />
            ),
        },
        {
            title: "Unique",
            key: "unique",
            width: "100px",
            align: "center",
            render: (text, { value, unique }) => (
                <Checkbox
                    isChecked={attributeMapping[value ?? ""]?.unique || unique}
                    isReadOnly={unique}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        attributeMappingApi.update({
                            attribute: value ?? "",
                            key: "unique",
                            value: e.target.checked,
                        });
                    }}
                />
            ),
        },
        {
            title: "Custom",
            key: "manual",
            width: "100px",
            align: "center",
            render: (text, { value }) => (
                <Checkbox
                    isChecked={attributeMapping[value ?? ""]?.isCustom}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setCustom(value ?? "", e.target.checked)
                    }
                />
            ),
        },
        {
            title: "Specific",
            key: "specific",
            width: "100px",
            align: "center",
            render: (text, { value }) => (
                <Checkbox
                    isChecked={attributeMapping[value ?? ""]?.isSpecific}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSpecific(value ?? "", e.target.checked)
                    }
                />
            ),
        },
        {
            title: (
                <Stack direction="row" alignItems="center">
                    <SourceIcon mapping={programMapping} />
                    <Text>Source Attribute</Text>
                    <Text>{source}</Text>
                </Stack>
            ),
            key: "source",
            render: (text, { value, valueType, unique }) => {
                if (attributeMapping[value ?? ""]?.isCustom) {
                    return (
                        <CustomColumn
                            mapping={attributeMapping}
                            onTypeUpdate={(e) =>
                                attributeMappingApi.update({
                                    attribute: `${value}`,
                                    key: "customType",
                                    value: e?.value,
                                })
                            }
                            onValueChange={(val) =>
                                attributeMappingApi.update({
                                    attribute: `${value}`,
                                    key: "value",
                                    value: val,
                                })
                            }
                            value={value ?? ""}
                        />
                    );
                }

                if (attributeMapping[value ?? ""]?.isSpecific) {
                    return (
                        <Input
                            value={attributeMapping[value ?? ""]?.value}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                attributeMappingApi.update({
                                    attribute: `${value}`,
                                    key: "value",
                                    value: e.target.value,
                                })
                            }
                        />
                    );
                }
                return (
                    <Select<Option, false, GroupBase<Option>>
                        value={metadata.sourceColumns?.find(
                            (val) =>
                                val.value ===
                                attributeMapping[value ?? ""]?.value,
                        )}
                        options={metadata.sourceColumns}
                        isClearable
                        size="md"
                        onChange={(e) => {
                            attributeMappingApi.updateMany({
                                attribute: value ?? "",
                                update: {
                                    value: e?.value || "",
                                    unique:
                                        attributeMapping[value ?? ""]?.unique ||
                                        unique,
                                    valueType,
                                },
                            });
                            if (
                                e &&
                                e.value &&
                                currentMappingValues.indexOf(e.value) !== -1
                            ) {
                                toast({
                                    title: "Variable reused",
                                    description: `Variable ${e.label} already used`,
                                    status: "warning",
                                    duration: 9000,
                                    isClosable: true,
                                });
                            }
                        }}
                    />
                );
            },
        },
        {
            title: "Options",
            key: "value",
            width: "200px",
            render: (text, { value, optionSetValue, availableOptions }) => {
                const current = value ?? "";
                if (optionSetValue) {
                    return (
                        <OptionSetMapping
                            value={current}
                            disabled={current === ""}
                            destinationOptions={availableOptions || []}
                            mapping={attributeMapping}
                        />
                    );
                }
                return null;
            },
        },
        {
            title: "Mapped",
            width: "100px",
            render: (text, { value }) => {
                if (isMapped(value, attributeMapping)) {
                    return (
                        <Icon as={FiCheck} color="green.400" fontSize="2xl" />
                    );
                }
                return null;
            },
            key: "mapped",
        },
    ];

    useEffect(() => {
        for (const {
            value: destinationValue,
            unique,
            label: destinationLabel,
            mandatory,
        } of metadata.destinationAttributes) {
            if (attributeMapping[destinationValue ?? ""] === undefined) {
                const search = metadata.sourceColumns.find(
                    ({ value }) =>
                        value &&
                        destinationValue &&
                        value.includes(destinationValue),
                );
                if (search) {
                    attributeMappingApi.updateMany({
                        attribute: `${destinationValue}`,
                        update: {
                            value: search.value,
                            unique,
                            mandatory,
                        },
                    });
                } else {
                    const search2 = metadata.sourceColumns.find(
                        ({ label }) =>
                            label &&
                            destinationLabel &&
                            label.includes(destinationLabel),
                    );
                    if (search2) {
                        attributeMappingApi.updateMany({
                            attribute: `${destinationValue}`,
                            update: {
                                value: search2.value,
                                unique,
                                mandatory,
                            },
                        });
                    }
                }
            }
        }
    }, []);

    const setCustom = (attribute: string, manual: boolean) => {
        const isSpecific = attributeMapping[attribute]?.isSpecific;
        attributeMappingApi.update({
            attribute,
            key: "isCustom",
            value: manual,
        });

        if (isSpecific) {
            attributeMappingApi.update({
                attribute,
                key: "isSpecific",
                value: !isSpecific,
            });
        }
    };

    const setSpecific = (attribute: string, isSpecific: boolean) => {
        attributeMappingApi.update({
            attribute,
            key: "isSpecific",
            value: isSpecific,
        });
        const isManual = attributeMapping[attribute]?.isCustom;

        if (isManual) {
            attributeMappingApi.update({
                attribute,
                key: "isCustom",
                value: !isManual,
            });
        }
    };

    return (
        <Stack
            h="calc(100vh - 350px)"
            maxH="calc(100vh - 350px)"
            overflow="auto"
            spacing="25px"
        >
            <Stack direction="row" spacing="20px">
                <InfoMapping
                    customColumn="customTrackedEntityInstanceColumn"
                    value={trackedEntityInstanceColumn}
                    column="trackedEntityInstanceColumn"
                    isChecked={customTrackedEntityInstanceColumn}
                    update={attributeMappingApi.update}
                    title="Track Entity Column"
                    title2="Custom Track Entity Column"
                />
                <InfoMapping
                    customColumn="customGeometryColumn"
                    value={geometryColumn}
                    column="geometryColumn"
                    isChecked={customGeometryColumn}
                    update={attributeMappingApi.update}
                    title="Geometry Column"
                    title2="Custom Geometry Column"
                    isMulti
                />
            </Stack>
            <Stack spacing={[1, 5]} direction={["column", "row"]}>
                <Checkbox
                    colorScheme="green"
                    isChecked={createEntities}
                    onChange={(e) => {
                        attributeMappingApi.update({
                            attribute: "info",
                            key: "createEntities",
                            value: e.target.checked,
                        });
                    }}
                >
                    Create Entities
                </Checkbox>

                <Checkbox
                    colorScheme="green"
                    isChecked={updateEntities}
                    onChange={(e) => {
                        attributeMappingApi.update({
                            attribute: "info",
                            key: "updateEntities",
                            value: e.target.checked,
                        });
                    }}
                >
                    Update Entities
                </Checkbox>
            </Stack>
            <Search
                options={metadata.destinationAttributes}
                source={metadata.sourceAttributes}
                mapping={attributeMapping}
                searchString={searchString}
                setSearchString={setSearchString}
                action={setCurrentAttributes}
                placeholder="Search attributes"
                label="Show Mapped Attributes Only"
                label2="Show Unmapped Attributes Only"
            />

            <Table
                columns={columns}
                dataSource={attributes}
                rowKey="value"
                pagination={{ pageSize: 8, hideOnSinglePage: true }}
                size="middle"
                footer={() => (
                    <Text textAlign="right">
                        Mapped{" "}
                        {findMapped(attributeMapping, metadata.sourceColumns)}{" "}
                        of {metadata.destinationAttributes?.length || 0}
                    </Text>
                )}
            />
        </Stack>
    );
}
