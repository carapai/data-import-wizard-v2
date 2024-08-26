import { Checkbox, Icon, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { Option } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { FiCheck } from "react-icons/fi";

import { ChangeEvent, useState } from "react";
import { enrollmentMappingApi } from "../../Events";
import {
    $enrollmentMapping,
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

export default function EnrollmentMapping() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [message, setMessage] = useState<string>("");
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
    const program = useStore($program);
    const metadata = useStore($metadata);
    const { source, destination } = useStore($names);
    const [attributes, setCurrentAttributes] = useState(
        metadata.destinationEnrollmentAttributes,
    );
    const [searchString, setSearchString] = useState<string>("");

    const mappedValues = Object.values(enrollmentMapping).map(
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
            render: (_, { value, mandatory }) => (
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
            render: (_, { value, unique }) => (
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
            render: (_, { value }) => (
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
            render: (_, { value }) => (
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
            render: (_, { value = "" }) => {
                return (
                    <FieldMapper
                        source={metadata.sourceColumns}
                        onUpdate={(attribute, key, value) =>
                            enrollmentMappingApi.update({
                                attribute,
                                key,
                                value,
                            })
                        }
                        isSpecific={enrollmentMapping[value]?.isSpecific}
                        isCustom={enrollmentMapping[value]?.isCustom}
                        attribute={value}
                        value={enrollmentMapping[value]?.value}
                        customType={enrollmentMapping[value]?.customType}
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
                const mapping = enrollmentMapping[value]?.value || "";
                if (optionSetValue) {
                    return (
                        <OptionSetMapping
                            value={value}
                            disabled={mapping === ""}
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
    const autoMap = async (map: boolean) => {
        onOpen();
        setMessage(() => "Trying to automatically map");
        createMapping({
            map,
            destinationOptions: metadata.destinationEnrollmentAttributes,
            sourceOptions: metadata.sourceColumns,
            mapping: enrollmentMapping,
            onMap(destinationValue, search) {
                if (search !== undefined) {
                    enrollmentMappingApi.updateMany({
                        attribute: destinationValue,
                        update: {
                            value: search.value,
                            isManual: false,
                        },
                    });
                }
            },
            onUnMap(destinationValue) {
                enrollmentMappingApi.remove(destinationValue);
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
                {program.featureType !== "NONE" &&
                    program.featureType !== undefined && (
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
                    )}
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
                <Checkbox
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        autoMap(e.target.checked)
                    }
                >
                    Auto Map
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

            <Progress
                onClose={onClose}
                isOpen={isOpen}
                message={message}
                onOpen={onOpen}
            />
        </Stack>
    );
}
