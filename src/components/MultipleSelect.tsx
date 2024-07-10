import { Box, Stack } from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { Option } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { getOr } from "lodash/fp";
import { $metadata } from "../Store";

export default function MultipleSelect({
    value,
    mapping,
    onValueChange,
    title,
    placeholder = "Select column",
}: {
    value: string;
    mapping: any;
    onValueChange: (e: string) => void;
    title: React.ReactElement;
    placeholder?: string;
}) {
    const metadata = useStore($metadata);
    return (
        <Stack alignItems="center" direction="row" spacing="20px" flex={1}>
            {title}
            <Box flex={1}>
                <Select<Option, true, GroupBase<Option>>
                    value={metadata.sourceColumns.filter(
                        (pt) =>
                            getOr("", value, mapping)
                                .split(",")
                                .indexOf(String(pt.value)) !== -1
                    )}
                    isMulti
                    options={metadata.sourceColumns}
                    isClearable
                    placeholder={placeholder}
                    onChange={(e) =>
                        onValueChange(e.map((x) => x.value ?? "").join(","))
                    }
                />
            </Box>
        </Stack>
    );
}
