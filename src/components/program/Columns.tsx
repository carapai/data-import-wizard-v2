import type { TabsProps } from "antd";
import { Table, TableColumnsType, Tabs } from "antd";
import { useStore } from "effector-react";
import { Key, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";
import { CQIDexie } from "../../db";
import { mappingApi } from "../../Events";
import { $mapping, $program } from "../../Store";

export default function Columns({ db }: { db: CQIDexie }) {
    const program = useStore($program);
    const mapping = useStore($mapping);
    const [active, setActive] = useState<string>("miscellaneous");

    const levels = useLiveQuery(() => db.levels.toArray());

    const columns: TableColumnsType<{ id: string; name: string }> = [
        {
            title: "Name",
            dataIndex: "name",
            render: (text: string) => <a>{text}</a>,
        },
    ];

    const onChange = (key: string) => {
        setActive(() => key);
    };
    const items: TabsProps["items"] = program.programStages?.map((stage) => ({
        key: stage.id,
        label: stage.name,
        children: (
            <Table<{ id: string; name: string }>
                rowSelection={{
                    type: "checkbox",
                    onSelect: (record) => {
                        let value = mapping.dhis2SourceOptions?.columns ?? [];
                        if (value.includes(record.id)) {
                            value = value.filter((key) => key !== record.id);
                        } else {
                            value = value.concat(record.id);
                        }
                        mappingApi.update({
                            attribute: "dhis2SourceOptions",
                            path: "columns",
                            value,
                        });
                    },
                    onSelectAll: (selected) => {
                        if (selected) {
                            let value =
                                mapping.dhis2SourceOptions?.columns ?? [];
                            value = value.concat(
                                stage.programStageDataElements.map(
                                    ({ dataElement: { id } }) =>
                                        `${stage.id}-${id}`,
                                ),
                                `${stage.id}-eventDate`,
                            );
                            mappingApi.update({
                                attribute: "dhis2SourceOptions",
                                path: "columns",
                                value,
                            });
                        } else {
                            let value =
                                mapping.dhis2SourceOptions?.columns ?? [];

                            const removeSet = stage.programStageDataElements
                                .map(
                                    ({ dataElement: { id } }) =>
                                        `${stage.id}-${id}` as Key,
                                )
                                .concat(`${stage.id}-eventDate`);
                            value = value.filter(
                                (id) => !removeSet.includes(id),
                            );
                            mappingApi.update({
                                attribute: "dhis2SourceOptions",
                                path: "columns",
                                value,
                            });
                        }
                    },
                    selectedRowKeys: mapping.dhis2SourceOptions?.columns ?? [],
                }}
                rowKey="id"
                columns={columns}
                dataSource={[
                    { id: `${stage.id}-eventDate`, name: "Event Date" },
                ].concat(
                    stage.programStageDataElements.map((a) => ({
                        id: `${stage.id}-${a.dataElement.id}`,
                        name: a.dataElement.name,
                    })),
                )}
                pagination={false}
                scroll={{ y: 55 * 10 }}
            />
        ),
    }));

    return (
        <Tabs
            items={[
                {
                    key: "miscellaneous",
                    label: "Miscellaneous",
                    children: (
                        <Table<{ id: string; name: string }>
                            rowSelection={{
                                type: "checkbox",
                                onSelect: (record) => {
                                    let value =
                                        mapping.dhis2SourceOptions?.columns ??
                                        [];
                                    if (value.includes(record.id)) {
                                        value = value.filter(
                                            (key) => key !== record.id,
                                        );
                                    } else {
                                        value = value.concat(record.id);
                                    }
                                    mappingApi.update({
                                        attribute: "dhis2SourceOptions",
                                        path: "columns",
                                        value,
                                    });
                                },
                                onSelectAll: (selected) => {
                                    if (selected) {
                                        let value =
                                            mapping.dhis2SourceOptions
                                                ?.columns ?? [];
                                        value = value.concat(
                                            program.programTrackedEntityAttributes?.map(
                                                ({
                                                    trackedEntityAttribute: {
                                                        id,
                                                    },
                                                }) => id,
                                            ) ?? [],
                                        );
                                        mappingApi.update({
                                            attribute: "dhis2SourceOptions",
                                            path: "columns",
                                            value,
                                        });
                                    } else {
                                        let value =
                                            mapping.dhis2SourceOptions
                                                ?.columns ?? [];

                                        const removeSet =
                                            program.programTrackedEntityAttributes?.map(
                                                ({ id }) => id as Key,
                                            ) ?? [];
                                        value = value.filter(
                                            (id) => !removeSet.includes(id),
                                        );
                                        mappingApi.update({
                                            attribute: "dhis2SourceOptions",
                                            path: "columns",
                                            value,
                                        });
                                    }
                                },
                                selectedRowKeys:
                                    mapping.dhis2SourceOptions?.columns ?? [],
                            }}
                            rowKey="id"
                            columns={columns}
                            dataSource={[
                                {
                                    id: `0-enrollment`,
                                    name: `Enrollment Id`,
                                },
                                {
                                    id: `0-enrollmentDate`,
                                    name: `Enrollment Date`,
                                },
                            ].concat(
                                levels?.flatMap(({ value, label }) => [
                                    {
                                        id: `level${value}id`,
                                        name: `${label} id`,
                                    },
                                    {
                                        id: `level${value}name`,
                                        name: `${label} name`,
                                    },
                                ]) ?? [],
                            )}
                            pagination={false}
                            scroll={{ y: 55 * 10 }}
                        />
                    ),
                },
                {
                    key: "attributes",
                    label: "Attributes",
                    children: (
                        <Table<{ id: string; name: string }>
                            rowSelection={{
                                type: "checkbox",
                                onSelect: (record) => {
                                    let value =
                                        mapping.dhis2SourceOptions?.columns ??
                                        [];
                                    if (value.includes(record.id)) {
                                        value = value.filter(
                                            (key) => key !== record.id,
                                        );
                                    } else {
                                        value = value.concat(record.id);
                                    }
                                    mappingApi.update({
                                        attribute: "dhis2SourceOptions",
                                        path: "columns",
                                        value,
                                    });
                                },
                                onSelectAll: (selected) => {
                                    if (selected) {
                                        let value =
                                            mapping.dhis2SourceOptions
                                                ?.columns ?? [];
                                        value = value.concat(
                                            program.programTrackedEntityAttributes?.map(
                                                ({
                                                    trackedEntityAttribute: {
                                                        id,
                                                    },
                                                }) => id,
                                            ) ?? [],
                                        );
                                        mappingApi.update({
                                            attribute: "dhis2SourceOptions",
                                            path: "columns",
                                            value,
                                        });
                                    } else {
                                        let value =
                                            mapping.dhis2SourceOptions
                                                ?.columns ?? [];

                                        const removeSet =
                                            program.programTrackedEntityAttributes?.map(
                                                ({ id }) => id as Key,
                                            ) ?? [];
                                        value = value.filter(
                                            (id) => !removeSet.includes(id),
                                        );
                                        mappingApi.update({
                                            attribute: "dhis2SourceOptions",
                                            path: "columns",
                                            value,
                                        });
                                    }
                                },
                                selectedRowKeys:
                                    mapping.dhis2SourceOptions?.columns ?? [],
                            }}
                            rowKey="id"
                            columns={columns}
                            dataSource={program.programTrackedEntityAttributes?.map(
                                (a) => ({
                                    id: a.trackedEntityAttribute.id,
                                    name: a.trackedEntityAttribute.name,
                                }),
                            )}
                            pagination={false}
                            scroll={{ y: 55 * 10 }}
                        />
                    ),
                },
                ...(items ?? []),
            ]}
            activeKey={active}
            onChange={onChange}
        />
    );
}
