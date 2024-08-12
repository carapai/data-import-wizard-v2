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
import { enrollmentMappingApi } from "../../Events";
import { $enrollmentMapping, $mapping, $metadata, $names } from "../../Store";
import { findMapped, isMapped } from "../../utils/utils";
import CustomColumn from "../CustomColumn";
import DestinationIcon from "../DestinationIcon";
import MultipleSelect from "../MultipleSelect";
import OptionSetMapping from "../OptionSetMapping";
import Search from "../Search";
import SourceIcon from "../SourceIcon";
import InfoMapping from "../InfoMapping";

export default function EnrollmentMapping() {
    const {
        info: {
            customEnrollmentDateColumn,
            enrollmentDateColumn,
            createEnrollments,
            updateEnrollments,
            enrollmentIdColumn,
            customEnrollmentIdColumn,
            incidentDateColumn,
            customIncidentDateColumn,
            customGeometryColumn,
            geometryColumn,
        } = {
            customEnrollmentDateColumn: false,
            enrollmentDateColumn: "",
            createEnrollments: false,
            updateEnrollments: false,
            enrollmentIdColumn: "",
            customEnrollmentIdColumn: false,
            customIncidentDateColumn: false,
            incidentDateColumn: "",
            customGeometryColumn: false,
            geometryColumn: "",
        },
        ...enrollmentMapping
    } = useStore($enrollmentMapping);
    const programMapping = useStore($mapping);
    const toast = useToast();
    const metadata = useStore($metadata);
    const { source, destination } = useStore($names);
    const [attributes, setCurrentAttributes] = useState(
        metadata.destinationEnrollmentAttributes,
    );

    const [searchString, setSearchString] = useState<string>("");

    const currentMappingValues = Object.values(enrollmentMapping).map(
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
                        enrollmentMapping[value ?? ""]?.mandatory || mandatory
                    }
                    isReadOnly={mandatory}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        enrollmentMappingApi.update({
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
                    isChecked={enrollmentMapping[value ?? ""]?.unique || unique}
                    isReadOnly={unique}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        enrollmentMappingApi.update({
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
                    isChecked={enrollmentMapping[value ?? ""]?.isCustom}
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
                    isChecked={enrollmentMapping[value ?? ""]?.isSpecific}
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
                if (enrollmentMapping[value ?? ""]?.isCustom) {
                    return (
                        <CustomColumn
                            mapping={enrollmentMapping}
                            onTypeUpdate={(e) =>
                                enrollmentMappingApi.update({
                                    attribute: `${value}`,
                                    key: "customType",
                                    value: e?.value,
                                })
                            }
                            onValueChange={(val) =>
                                enrollmentMappingApi.update({
                                    attribute: `${value}`,
                                    key: "value",
                                    value: val,
                                })
                            }
                            value={value ?? ""}
                        />
                    );
                }

                if (enrollmentMapping[value ?? ""]?.isSpecific) {
                    return (
                        <Input
                            value={enrollmentMapping[value ?? ""]?.value}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                enrollmentMappingApi.update({
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
                                enrollmentMapping[value ?? ""]?.value,
                        )}
                        options={metadata.sourceColumns}
                        isClearable
                        size="md"
                        onChange={(e) => {
                            enrollmentMappingApi.updateMany({
                                attribute: value ?? "",
                                update: {
                                    value: e?.value || "",
                                    unique:
                                        enrollmentMapping[value ?? ""]
                                            ?.unique || unique,
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
                const current = value || "";
                if (optionSetValue) {
                    return (
                        <OptionSetMapping
                            value={current}
                            disabled={current === ""}
                            destinationOptions={availableOptions || []}
                            mapping={enrollmentMapping}
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
                if (isMapped(value, enrollmentMapping)) {
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
        } of metadata.destinationEnrollmentAttributes) {
            if (enrollmentMapping[destinationValue ?? ""] === undefined) {
                const search = metadata.sourceColumns.find(
                    ({ value }) =>
                        value &&
                        destinationValue &&
                        value.includes(destinationValue),
                );
                if (search) {
                    enrollmentMappingApi.updateMany({
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
                        enrollmentMappingApi.updateMany({
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
        const isSpecific = enrollmentMapping[attribute]?.isSpecific;
        enrollmentMappingApi.update({
            attribute,
            key: "isCustom",
            value: manual,
        });

        if (isSpecific) {
            enrollmentMappingApi.update({
                attribute,
                key: "isSpecific",
                value: !isSpecific,
            });
        }
    };

    const setSpecific = (attribute: string, isSpecific: boolean) => {
        enrollmentMappingApi.update({
            attribute,
            key: "isSpecific",
            value: isSpecific,
        });
        const isManual = enrollmentMapping[attribute]?.isCustom;

        if (isManual) {
            enrollmentMappingApi.update({
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
                    customColumn="customEnrollmentIdColumn"
                    value={enrollmentIdColumn}
                    column="enrollmentIdColumn"
                    isChecked={customEnrollmentIdColumn}
                    update={enrollmentMappingApi.update}
                    title="Enrollment Column"
                    title2="Custom Enrollment Column"
                />

                <InfoMapping
                    customColumn="customEnrollmentDateColumn"
                    value={enrollmentDateColumn}
                    column="enrollmentDateColumn"
                    isChecked={customEnrollmentDateColumn}
                    update={enrollmentMappingApi.update}
                    title="Enrollment Date Column"
                    title2="Custom Enrollment Date Column"
                />
                <InfoMapping
                    customColumn="customIncidentDateColumn"
                    value={incidentDateColumn}
                    column="incidentDateColumn"
                    isChecked={customIncidentDateColumn}
                    update={enrollmentMappingApi.update}
                    title="Incident Date Column"
                    title2="Custom Incident Column"
                />
                <InfoMapping
                    customColumn="customGeometryColumn"
                    value={geometryColumn}
                    column="geometryColumn"
                    isChecked={customGeometryColumn}
                    update={enrollmentMappingApi.update}
                    title="Geometry Column"
                    title2="Custom Geometry Column"
                    isMulti
                />
            </Stack>
            <Stack spacing={[1, 5]} direction={["column", "row"]}>
                <Checkbox
                    colorScheme="green"
                    isChecked={createEnrollments}
                    onChange={(e) => {
                        enrollmentMappingApi.update({
                            attribute: "info",
                            key: "createEnrollments",
                            value: e.target.checked,
                        });
                    }}
                >
                    Create Enrollments
                </Checkbox>

                <Checkbox
                    colorScheme="green"
                    isChecked={updateEnrollments}
                    onChange={(e) => {
                        enrollmentMappingApi.update({
                            attribute: "info",
                            key: "updateEnrollments",
                            value: e.target.checked,
                        });
                    }}
                >
                    Update Enrollments
                </Checkbox>
            </Stack>
            <Search
                options={metadata.destinationEnrollmentAttributes}
                source={metadata.sourceAttributes}
                mapping={enrollmentMapping}
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
                        {findMapped(enrollmentMapping, metadata.sourceColumns)}{" "}
                        of{" "}
                        {metadata.destinationEnrollmentAttributes?.length || 0}
                    </Text>
                )}
            />
        </Stack>
    );
}
