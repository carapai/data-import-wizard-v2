import { Checkbox, Input, Stack, Text } from "@chakra-ui/react";
import { DisabledPeriod } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { getOr } from "lodash/fp";
import { ChangeEvent, useEffect } from "react";
import { mappingApi } from "../../Events";
import { $mapping } from "../../Store";
import OUTree from "../OuTree";
import PeriodPicker from "../PeriodPicker";
import SwitchComponent, { Case } from "../SwitchComponent";
export default function DHIS2AsSourceOptions() {
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
            {/* <SwitchComponent condition={mapping.dataSource}>
                <Case value="dhis2-program">
                    <Stack>
                        <Text>Specific program stage</Text>
                        <Box>
                            <Select<Option, true, GroupBase<Option>>
                                options={metadata.sourceStages}
                                isClearable
                                isMulti
                                value={metadata.sourceStages.filter((value) => {
                                    const available =
                                        mapping.dhis2SourceOptions
                                            ?.programStage ?? [];
                                    return (
                                        available.indexOf(value?.value!) !== -1
                                    );
                                })}
                                onChange={(e) =>
                                    mappingApi.update({
                                        attribute: "dhis2SourceOptions",
                                        path: "programStage",
                                        value: e.map((ee) => ee.value),
                                    })
                                }
                            />
                        </Box>
                    </Stack>
                </Case>
                <Case default>{null}</Case>
            </SwitchComponent> */}
            <Stack>
                <Text>Period</Text>
                <PeriodPicker
                    selectedPeriods={mapping.dhis2SourceOptions?.period ?? []}
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
            </Stack>

            <SwitchComponent
                condition={
                    mapping.dataSource === "dhis2-program" || mapping.isSource
                }
            >
                <Case value={true}>
                    <Stack>
                        <Text>Period Applies To</Text>
                        <Stack spacing={5} direction="row">
                            <Checkbox
                                isChecked={
                                    mapping.dhis2SourceOptions?.searchPeriod ===
                                    "enrollmentDate"
                                }
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    mappingApi.update({
                                        attribute: "dhis2SourceOptions",
                                        path: "searchPeriod",
                                        value: "enrollmentDate",
                                    })
                                }
                            >
                                Enrollment Date
                            </Checkbox>
                            <Checkbox
                                isChecked={
                                    mapping.dhis2SourceOptions?.searchPeriod ===
                                    "eventDate"
                                }
                                isDisabled={
                                    !mapping.dhis2SourceOptions?.programStage
                                        ?.length
                                }
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    mappingApi.update({
                                        attribute: "dhis2SourceOptions",
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
            <Stack>
                <Text>Organisation</Text>
                <OUTree
                    value={mapping.dhis2SourceOptions?.ous ?? []}
                    onChange={(ous) =>
                        mappingApi.update({
                            attribute: "dhis2SourceOptions",
                            path: "ous",
                            value: ous,
                        })
                    }
                />
            </Stack>

            {mapping.program?.isTracker && (
                <Stack>
                    <Text>Tracked Entities</Text>
                    <Input
                        value={
                            mapping.dhis2SourceOptions?.trackedEntityInstance ??
                            ""
                        }
                        onChange={(value) =>
                            mappingApi.update({
                                attribute: "dhis2SourceOptions",
                                path: "trackedEntityInstance",
                                value: value.target.value,
                            })
                        }
                    />
                </Stack>
            )}

            {/* <Checkbox
                isChecked={mapping.dhis2SourceOptions?.useAnalytics}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    mappingApi.update({
                        attribute: "dhis2SourceOptions",
                        path: "useAnalytics",
                        value: e.target.checked,
                    })
                }
            >
                Use Analytics Aggregate
            </Checkbox> */}
        </Stack>
    );
}
