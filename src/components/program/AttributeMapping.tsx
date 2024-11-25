import { Checkbox, Stack } from "@chakra-ui/react";
import { useStore } from "effector-react";
import { CQIDexie } from "../../db";
import { attributeMappingApi, mappingApi } from "../../Events";
import { $attributeMapping, $mapping, $metadata, $program } from "../../Store";
import GenericMapping from "../GenericMapping";
import InfoMapping from "../InfoMapping";

export default function AttributeMapping({ db }: { db: CQIDexie }) {
    const metadata = useStore($metadata);
    const program = useStore($program);
    const mapping = useStore($mapping);
    const attributeMapping = useStore($attributeMapping);
    const {
        customTrackedEntityInstanceColumn = false,
        trackedEntityInstanceColumn = "",
        customGeometryColumn = false,
        createEntities = false,
        updateEntities = false,
        geometryColumn = "",
    } = mapping.trackedEntityMapping ?? {};

    return (
        <Stack
            h="calc(100vh - 350px)"
            maxH="calc(100vh - 350px)"
            overflow="auto"
            spacing="25px"
        >
            <Stack direction="row" spacing="20px">
                <InfoMapping
                    value={trackedEntityInstanceColumn}
                    isChecked={customTrackedEntityInstanceColumn}
                    title="Track Entity Column"
                    title2="Custom Track Entity Column"
                    onCustomChange={(customTrackedEntityInstanceColumn) => {
                        mappingApi.updateMany({
                            trackedEntityMapping: {
                                ...mapping.trackedEntityMapping,
                                customTrackedEntityInstanceColumn,
                            },
                        });
                    }}
                    onValueChange={(trackedEntityInstanceColumn) => {
                        mappingApi.updateMany({
                            trackedEntityMapping: {
                                ...mapping.trackedEntityMapping,
                                trackedEntityInstanceColumn,
                            },
                        });
                    }}
                />
                {program.trackedEntityType?.featureType !== "NONE" &&
                    program.trackedEntityType?.featureType !== undefined && (
                        <InfoMapping
                            value={geometryColumn}
                            isChecked={customGeometryColumn}
                            title="Geometry Column"
                            title2="Custom Geometry Column"
                            isMulti
                            onCustomChange={(customGeometryColumn) => {
                                mappingApi.updateMany({
                                    trackedEntityMapping: {
                                        ...mapping.trackedEntityMapping,
                                        customGeometryColumn,
                                    },
                                });
                            }}
                            onValueChange={(geometryColumn) => {
                                mappingApi.updateMany({
                                    trackedEntityMapping: {
                                        ...mapping.trackedEntityMapping,
                                        geometryColumn,
                                    },
                                });
                            }}
                        />
                    )}
            </Stack>
            <Stack spacing={[1, 5]} direction={["column", "row"]}>
                <Checkbox
                    colorScheme="green"
                    isChecked={createEntities}
                    onChange={(e) =>
                        mappingApi.updateMany({
                            trackedEntityMapping: {
                                ...mapping.trackedEntityMapping,
                                createEntities: e.target.checked,
                            },
                        })
                    }
                >
                    Create Entities
                </Checkbox>

                <Checkbox
                    colorScheme="green"
                    isChecked={updateEntities}
                    onChange={(e) => {
                        mappingApi.updateMany({
                            trackedEntityMapping: {
                                ...mapping.trackedEntityMapping,
                                updateEntities: e.target.checked,
                            },
                        });
                    }}
                >
                    Update Entities
                </Checkbox>
            </Stack>

            <GenericMapping
                destinationOptions={metadata.destinationAttributes}
                sourceOptions={metadata.sourceColumns}
                mapped={attributeMapping}
                updater={attributeMappingApi.updateMany}
                db={db}
                merger={attributeMappingApi.merge}
            />
        </Stack>
    );
}
