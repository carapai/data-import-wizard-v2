import { Checkbox, Icon, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { Option } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { FiCheck } from "react-icons/fi";

import { ChangeEvent, useState } from "react";
import { attributeMappingApi } from "../../Events";
import {
    $attributeMapping,
    $mapping,
    $metadata,
    $names,
    $program,
} from "../../Store";
import { createMapping, findMapped, isMapped } from "../../utils/utils";
import DestinationIcon from "../DestinationIcon";
import FieldMapper from "../FieldMapper";
import InfoMapping from "../InfoMapping";
import OptionSetMapping from "../OptionSetMapping";
import Progress from "../Progress";
import Search from "../Search";
import SourceIcon from "../SourceIcon";

export default function AttributeMapping() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [message, setMessage] = useState<string>("");

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
    const metadata = useStore($metadata);
    const { source, destination } = useStore($names);
    const program = useStore($program);
    const [attributes, setCurrentAttributes] = useState(
        metadata.destinationAttributes,
    );

    const [searchString, setSearchString] = useState<string>("");

    const mappedValues = Object.values(attributeMapping).map(
        ({ value = "" }) => value,
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
            render: (_, { value = "" }) => {
                return (
                    <FieldMapper
                        source={metadata.sourceColumns}
                        onUpdate={(attribute, key, value) =>
                            attributeMappingApi.update({
                                attribute,
                                key,
                                value,
                            })
                        }
                        isSpecific={attributeMapping[value]?.isSpecific}
                        isCustom={attributeMapping[value]?.isCustom}
                        attribute={value}
                        value={attributeMapping[value]?.value}
                        customType={attributeMapping[value]?.customType}
                        mappedValues={mappedValues}
                    />
                );
            },
        },
        {
            title: "Options",
            key: "value",
            width: "200px",
            render: (_, { value = "", optionSetValue, availableOptions }) => {
                const mapping = attributeMapping[value]?.value || "";
                if (optionSetValue) {
                    return (
                        <OptionSetMapping
                            value={value}
                            disabled={mapping === ""}
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

    const autoMap = async (map: boolean) => {
        onOpen();
        setMessage(() => "Trying to automatically map");
        createMapping({
            map,
            destinationOptions: metadata.destinationAttributes,
            sourceOptions: metadata.sourceColumns,
            mapping: attributeMapping,
            onMap(destinationValue, search) {
                if (search !== undefined) {
                    attributeMappingApi.updateMany({
                        attribute: destinationValue,
                        update: {
                            value: search.value,
                            isManual: false,
                        },
                    });
                }
            },
            onUnMap(destinationValue) {
                attributeMappingApi.remove(destinationValue);
            },
        });
        onClose();
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
                {program.trackedEntityType?.featureType !== "NONE" &&
                    program.trackedEntityType?.featureType !== undefined && (
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
                    )}
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
                <Checkbox
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        autoMap(e.target.checked)
                    }
                >
                    Auto Map
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
            <Progress
                onClose={onClose}
                isOpen={isOpen}
                message={message}
                onOpen={onOpen}
            />
        </Stack>
    );
}
