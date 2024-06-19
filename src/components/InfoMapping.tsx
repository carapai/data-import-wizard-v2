import { Box, Checkbox, Input, Stack, Text } from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { Option, RealMapping, Update } from "data-import-wizard-utils";
import { Event } from "effector";
import { useStore } from "effector-react";

import { ChangeEvent } from "react";
import { $metadata } from "../Store";

export default function InfoMapping({
    title,
    isChecked,
    update,
    column,
    value,
    customColumn,
    title2,
}: {
    title: string;
    title2: string;
    isChecked: boolean | undefined;
    update: Event<Update>;
    column: keyof RealMapping;
    customColumn: keyof RealMapping;
    value: string | undefined | number | string[];
}) {
    const metadata = useStore($metadata);
    return (
        <Stack spacing="20px" direction="row" alignItems="center">
            <Text>{title}</Text>
            <Stack spacing="0">
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
                <Box w="500px">
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
                    ) : (
                        <Select<Option, false, GroupBase<Option>>
                            value={metadata.sourceColumns.find(
                                (val) => val.value === value
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
