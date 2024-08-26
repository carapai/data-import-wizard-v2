import { Input, useToast } from "@chakra-ui/react";
import { GroupBase, Select } from "chakra-react-select";
import { Option, RealMapping } from "data-import-wizard-utils";
import { ChangeEvent } from "react";
import CustomColumn from "./CustomColumn";

export default function FieldMapper({
    isSpecific,
    onUpdate,
    isMulti,
    value,
    source,
    attribute,
    isCustom,
    customType = "",
    mappedValues = [],
}: {
    onUpdate: (attribute: string, key: keyof RealMapping, value: any) => void;
    isSpecific?: boolean;
    isMulti?: boolean;
    source: Option[];
    value: string | undefined;
    attribute: string;
    isCustom?: boolean;
    customType?: string;
    mappedValues?: string[];
}) {
    const toast = useToast();

    if (isCustom)
        return (
            <CustomColumn
                value={value}
                onTypeUpdate={(e) =>
                    onUpdate(attribute, "customType", e?.value)
                }
                onValueChange={(val) => onUpdate(attribute, "value", val)}
                customType={customType}
            />
        );

    if (isSpecific)
        return (
            <Input
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onUpdate(attribute, "value", e.target.value)
                }
            />
        );

    if (isMulti)
        return (
            <Select<Option, true, GroupBase<Option>>
                value={source.filter((val) =>
                    String(value)
                        .split(",")
                        .includes(val.value ?? ""),
                )}
                options={source}
                isClearable
                isMulti
                placeholder="Select column"
                onChange={(e) => {
                    onUpdate(
                        attribute,
                        "value",
                        e
                            .flatMap((a) => {
                                if (a) {
                                    return a.value;
                                }
                                return [];
                            })
                            .join(","),
                    );
                }}
            />
        );
    return (
        <Select<Option, false, GroupBase<Option>>
            value={source.find((val) => val.value === value)}
            options={source}
            isClearable
            placeholder="Select column"
            onChange={(e) => {
                onUpdate(attribute, "value", e?.value);
                if (e && e.value && mappedValues.indexOf(e.value) !== -1) {
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
}
