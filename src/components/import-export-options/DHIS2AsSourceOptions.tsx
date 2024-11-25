import { Checkbox, Input, Stack, Text } from "@chakra-ui/react";
import { Tabs } from "antd";
import { DisabledPeriod } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { getOr } from "lodash/fp";
import { ChangeEvent, useEffect } from "react";
import { CQIDexie } from "../../db";
import { mappingApi } from "../../Events";
import { $mapping } from "../../Store";
import OUTree from "../OuTree";
import PeriodPicker from "../PeriodPicker";
import SwitchComponent, { Case } from "../SwitchComponent";
import AttributeFilters from "./AttributeFilters";
import DataElementFilters from "./DataElementFilters";
export default function DHIS2AsSourceOptions({ db }: { db: CQIDexie }) {
    const mapping = useStore($mapping);
    const findDisabled = (): DisabledPeriod[] => {
        if (mapping.dataSource === "dhis2-data-set") {
            return [0];
        }
        if (mapping.dataSource === "dhis2-program") {
            return [0, 1];
        }

        if (mapping.isSource) {
            return [0, 1];
        }
        return [];
    };

    const findActive = () => {
        if (mapping.dataSource === "dhis2-data-set") {
            return 1;
        }
        if (mapping.dataSource === "dhis2-program") {
            return 2;
        }

        if (mapping.isSource) {
            return 2;
        }

        return 0;
    };

    useEffect(() => {
        if (
            mapping.dataSource === "dhis2-program" &&
            !mapping.dhis2SourceOptions?.searchPeriod
        ) {
            mappingApi.update({
                attribute: "dhis2SourceOptions",
                path: "searchPeriod",
                value: "enrollmentDate",
            });
        }
        return () => {};
    }, []);

    return (
        <Stack flex={1} spacing="30px">
            <Stack spacing="20px">
                <Checkbox
                    isChecked={getOr(false, "prefetch", mapping)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        mappingApi.update({
                            attribute: "prefetch",
                            value: e.target.checked,
                        })
                    }
                >
                    Preview
                </Checkbox>
            </Stack>

            <Tabs
                items={[
                    {
                        key: "1",
                        label: "Period",
                        children: (
                            <Stack>
                                <PeriodPicker
                                    selectedPeriods={
                                        mapping.dhis2SourceOptions?.period ?? []
                                    }
                                    disabled={findDisabled()}
                                    active={findActive()}
                                    onChange={(periods) =>
                                        mappingApi.update({
                                            attribute: "dhis2SourceOptions",
                                            path: "period",
                                            value: periods,
                                        })
                                    }
                                />

                                <SwitchComponent
                                    condition={
                                        mapping.dataSource ===
                                            "dhis2-program" || mapping.isSource
                                    }
                                >
                                    <Case value={true}>
                                        <Stack>
                                            <Text>Period Applies To</Text>
                                            <Stack spacing={5} direction="row">
                                                <Checkbox
                                                    isChecked={
                                                        mapping
                                                            .dhis2SourceOptions
                                                            ?.searchPeriod ===
                                                        "enrollmentDate"
                                                    }
                                                    onChange={(
                                                        e: ChangeEvent<HTMLInputElement>,
                                                    ) =>
                                                        mappingApi.update({
                                                            attribute:
                                                                "dhis2SourceOptions",
                                                            path: "searchPeriod",
                                                            value: "enrollmentDate",
                                                        })
                                                    }
                                                >
                                                    Enrollment Date
                                                </Checkbox>
                                                <Checkbox
                                                    isChecked={
                                                        mapping
                                                            .dhis2SourceOptions
                                                            ?.searchPeriod ===
                                                        "eventDate"
                                                    }
                                                    isDisabled={
                                                        !mapping
                                                            .dhis2SourceOptions
                                                            ?.programStages
                                                            ?.length
                                                    }
                                                    onChange={(
                                                        e: ChangeEvent<HTMLInputElement>,
                                                    ) =>
                                                        mappingApi.update({
                                                            attribute:
                                                                "dhis2SourceOptions",
                                                            path: "searchPeriod",
                                                            value: "eventDate",
                                                        })
                                                    }
                                                >
                                                    Event Date
                                                </Checkbox>
                                            </Stack>
                                        </Stack>
                                    </Case>
                                    <Case default>{null}</Case>
                                </SwitchComponent>
                            </Stack>
                        ),
                    },
                    {
                        key: "2",
                        label: "Organisation",
                        children: (
                            <OUTree
                                value={mapping.dhis2SourceOptions?.ous ?? []}
                                onChange={(ous) =>
                                    mappingApi.update({
                                        attribute: "dhis2SourceOptions",
                                        path: "ous",
                                        value: ous,
                                    })
                                }
                                db={db}
                            />
                        ),
                    },
                    {
                        key: "3",
                        label: "Specific Tracked Entities",
                        children: (
                            <>
                                {mapping.program?.isTracker && (
                                    <Input
                                        value={
                                            mapping.dhis2SourceOptions
                                                ?.trackedEntityInstance ?? ""
                                        }
                                        onChange={(value) =>
                                            mappingApi.update({
                                                attribute: "dhis2SourceOptions",
                                                path: "trackedEntityInstance",
                                                value: value.target.value,
                                            })
                                        }
                                    />
                                )}
                            </>
                        ),
                    },
                    {
                        key: "4",
                        label: "Attribute Filters",
                        children: <AttributeFilters />,
                    },
                    {
                        key: "5",
                        label: "Data Element Filters",
                        children: <DataElementFilters />,
                    },
                ]}
            />
        </Stack>
    );
}
