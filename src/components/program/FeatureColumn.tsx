import { Box, Stack, Text } from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { Option } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { stageMappingApi } from "../../Events";
import { $metadata, $programStageMapping } from "../../Store";
export default function FeatureColumn({
    psId,
    featureType,
}: {
    psId: string;
    featureType: string;
}) {
    const programStageMapping = useStore($programStageMapping);
    const metadata = useStore($metadata);
    const geometryColumn =
        programStageMapping[psId]?.["info"]?.geometryColumn || "";

    if (featureType === "POINT") {
        return (
            <Stack alignItems="center" flex={1} direction="row" spacing="20px">
                <Text>Latitudes and Longitudes Column</Text>
                <Box flex={1}>
                    <Select<Option, true, GroupBase<Option>>
                        isMulti
                        value={metadata.sourceColumns.filter((pt) => {
                            return (
                                geometryColumn
                                    .split(",")
                                    .indexOf(pt.value ?? "") !== -1
                            );
                        })}
                        onChange={(e) => {
                            stageMappingApi.update({
                                attribute: "info",
                                key: "geometryColumn",
                                stage: psId,
                                value: e
                                    .map((ex) => String(ex.value))
                                    .join(","),
                            });
                        }}
                        options={metadata.sourceColumns}
                        isClearable
                        menuPlacement="auto"
                    />
                </Box>
            </Stack>
        );
    }
    return null;
}
