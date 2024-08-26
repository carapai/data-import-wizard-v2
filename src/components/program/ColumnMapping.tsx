import { Box, Checkbox, Input, Stack, Text } from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { Option, RealMapping } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { ChangeEvent } from "react";
import { $mapping, $metadata } from "../../Store";
import { stageMappingApi } from "../../Events";

export default function ColumnMapping({
    isCustom,
    psId,
    customColumn,
    valueColumn,
    value,
    title,
}: {
    isCustom: boolean;
    customColumn: keyof RealMapping;
    valueColumn: keyof RealMapping;
    value: string;
    psId: string;
    title: string;
}) {
    const metadata = useStore($metadata);
    const mapping = useStore($mapping);
    return (
        <Stack spacing="10px" flex={1}>
            <Text>{title}</Text>

            {[
                "csv-line-list",
                "xlsx-line-list",
                "xlsx-tabular-data",
                "xlsx-form",
                "dhis2-data-set",
                "dhis2-indicators",
                "dhis2-program-indicators",
                "dhis2-program",
                "manual-dhis2-program-indicators",
            ].indexOf(mapping.dataSource ?? "") === -1 ? (
                <Checkbox
                    isChecked={isCustom}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        stageMappingApi.update({
                            attribute: "info",
                            stage: psId,
                            key: customColumn,
                            value: e.target.checked,
                        })
                    }
                >
                    Custom {title}
                </Checkbox>
            ) : null}
            <Box>
                {isCustom ? (
                    <Input
                        value={value}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            stageMappingApi.update({
                                stage: psId,
                                attribute: "info",
                                key: valueColumn,
                                value: e.target.value,
                            })
                        }
                    />
                ) : (
                    <Select<Option, false, GroupBase<Option>>
                        value={metadata.sourceColumns.find(
                            (val) => val.value === value,
                        )}
                        options={metadata.sourceColumns}
                        placeholder="Select event date column"
                        isClearable
                        onChange={(e) =>
                            stageMappingApi.update({
                                stage: psId,
                                attribute: "info",
                                key: valueColumn,
                                value: e?.value,
                            })
                        }
                    />
                )}
            </Box>
        </Stack>
    );
}
