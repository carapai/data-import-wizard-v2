import { Checkbox, Stack } from "@chakra-ui/react";
import { useStore } from "effector-react";
import { CQIDexie } from "../../db";
import { enrollmentMappingApi, mappingApi } from "../../Events";
import { $enrollmentMapping, $mapping, $metadata, $program } from "../../Store";
import GenericMapping from "../GenericMapping";
import InfoMapping from "../InfoMapping";

export default function EnrollmentMapping({ db }: { db: CQIDexie }) {
    const mapping = useStore($mapping);
    const enrollmentMapping = useStore($enrollmentMapping);
    const program = useStore($program);
    const metadata = useStore($metadata);
    const {
        customEnrollmentDateColumn = false,
        enrollmentDateColumn = "",
        createEnrollments = false,
        updateEnrollments = false,
        enrollmentIdColumn = "",
        customEnrollmentIdColumn = false,
        customIncidentDateColumn = false,
        incidentDateColumn = "",
        customGeometryColumn = false,
        geometryColumn = "",
    } = mapping.enrollmentMapping ?? {};

    return (
        <Stack
            h="calc(100vh - 350px)"
            maxH="calc(100vh - 350px)"
            overflow="auto"
            spacing="25px"
        >
            <Stack direction="row" spacing="20px">
                <InfoMapping
                    value={enrollmentIdColumn}
                    isChecked={customEnrollmentIdColumn}
                    title="Track Entity Column"
                    title2="Custom Track Entity Column"
                    onCustomChange={(customEnrollmentIdColumn) => {
                        mappingApi.updateMany({
                            enrollmentMapping: {
                                ...mapping.enrollmentMapping,
                                customEnrollmentIdColumn,
                            },
                        });
                    }}
                    onValueChange={(enrollmentIdColumn) => {
                        mappingApi.updateMany({
                            enrollmentMapping: {
                                ...mapping.enrollmentMapping,
                                enrollmentIdColumn,
                            },
                        });
                    }}
                />

                <InfoMapping
                    value={enrollmentDateColumn}
                    isChecked={customEnrollmentDateColumn}
                    title="Enrollment Column"
                    title2="Custom Enrollment Column"
                    onCustomChange={(customEnrollmentDateColumn) => {
                        mappingApi.updateMany({
                            enrollmentMapping: {
                                ...mapping.enrollmentMapping,
                                customEnrollmentDateColumn,
                            },
                        });
                    }}
                    onValueChange={(enrollmentDateColumn) => {
                        mappingApi.updateMany({
                            enrollmentMapping: {
                                ...mapping.enrollmentMapping,
                                enrollmentDateColumn,
                            },
                        });
                    }}
                />
                <InfoMapping
                    value={incidentDateColumn}
                    isChecked={customIncidentDateColumn}
                    title="Incident Column"
                    title2="Custom Incident Column"
                    onCustomChange={(customIncidentDateColumn) => {
                        mappingApi.updateMany({
                            enrollmentMapping: {
                                ...mapping.enrollmentMapping,
                                customIncidentDateColumn,
                            },
                        });
                    }}
                    onValueChange={(incidentDateColumn) => {
                        mappingApi.updateMany({
                            enrollmentMapping: {
                                ...mapping.enrollmentMapping,
                                incidentDateColumn,
                            },
                        });
                    }}
                />
                {program.featureType !== "NONE" &&
                    program.featureType !== undefined && (
                        <InfoMapping
                            value={geometryColumn}
                            isChecked={customGeometryColumn}
                            title="Geometry Column"
                            title2="Custom Geometry Column"
                            onCustomChange={(customGeometryColumn) => {
                                mappingApi.updateMany({
                                    enrollmentMapping: {
                                        ...mapping.enrollmentMapping,
                                        customGeometryColumn,
                                    },
                                });
                            }}
                            onValueChange={(geometryColumn) => {
                                mappingApi.updateMany({
                                    enrollmentMapping: {
                                        ...mapping.enrollmentMapping,
                                        geometryColumn,
                                    },
                                });
                            }}
                            isMulti
                        />
                    )}
            </Stack>
            <Stack spacing={[1, 5]} direction={["column", "row"]}>
                <Checkbox
                    colorScheme="green"
                    isChecked={createEnrollments}
                    onChange={(e) => {
                        mappingApi.updateMany({
                            enrollmentMapping: {
                                ...mapping.enrollmentMapping,
                                createEnrollments: e.target.checked,
                            },
                        });
                    }}
                >
                    Create Enrollments
                </Checkbox>

                <Checkbox
                    colorScheme="green"
                    isChecked={updateEnrollments}
                    onChange={(e) => {
                        mappingApi.updateMany({
                            enrollmentMapping: {
                                ...mapping.enrollmentMapping,
                                updateEnrollments: e.target.checked,
                            },
                        });
                    }}
                >
                    Update Enrollments
                </Checkbox>
            </Stack>

            <GenericMapping
                destinationOptions={metadata.destinationEnrollmentAttributes}
                sourceOptions={metadata.sourceColumns}
                mapped={enrollmentMapping}
                updater={enrollmentMappingApi.updateMany}
                db={db}
                merger={enrollmentMappingApi.merge}
            />
        </Stack>
    );
}
