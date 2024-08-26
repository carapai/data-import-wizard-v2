import { Box, Checkbox, Input, Stack, Text } from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { Option, RealMapping, Update } from "data-import-wizard-utils";
import { Event } from "effector";
import { useStore } from "effector-react";

import { ChangeEvent } from "react";
import { $mapping, $metadata } from "../Store";

export default function InfoMapping({
    title,
    isChecked,
    update,
    column,
    value,
    customColumn,
    title2,
    isMulti,
}: {
    title: string;
    title2: string;
    isChecked: boolean | undefined;
    update: Event<Update>;
    column: keyof RealMapping;
    customColumn: keyof RealMapping;
    value: string | undefined | number | string[];
    isMulti?: boolean;
}) {
    const metadata = useStore($metadata);
    const mapping = useStore($mapping);
    return (
        <Stack direction="column" flex={1}>
            <Text>{title}</Text>
            <Stack spacing="0" flex={1}>
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
                        isChecked={isChecked}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            update({
                                attribute: "info",
                                key: customColumn,
                                value: e.target.checked,
                            })
                        }
                    >
                        {title2}
                    </Checkbox>
                ) : null}
                <Box>
                    {isChecked ? (
                        <Input
                            value={value}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                update({
                                    attribute: "info",
                                    key: column,
                                    value: e.target.value,
                                })
                            }
                        />
                    ) : isMulti ? (
                        <Select<Option, true, GroupBase<Option>>
                            value={metadata.sourceColumns.filter((val) =>
                                String(value)
                                    .split(",")
                                    .includes(val.value ?? ""),
                            )}
                            options={metadata.sourceColumns}
                            isClearable
                            isMulti
                            placeholder="Select column"
                            onChange={(e) => {
                                update({
                                    attribute: "info",
                                    key: column,
                                    value: e
                                        .flatMap((a) => {
                                            if (a) {
                                                return a.value;
                                            }
                                            return [];
                                        })
                                        .join(","),
                                });
                            }}
                        />
                    ) : (
                        <Select<Option, false, GroupBase<Option>>
                            value={metadata.sourceColumns.find(
                                (val) => val.value === value,
                            )}
                            options={metadata.sourceColumns}
                            isClearable
                            placeholder="Select column"
                            onChange={(e) =>
                                update({
                                    attribute: "info",
                                    key: column,
                                    value: e?.value || "",
                                })
                            }
                        />
                    )}
                </Box>
            </Stack>
        </Stack>
    );
}
