import { Table, TableColumnsType } from "antd";
import { Option } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { maxBy, range } from "lodash";
import { CQIDexie } from "../../db";

import { $mapping, $processed, $program } from "../../Store";

const { Column, ColumnGroup } = Table;

export default function ExcelExportPreview({
    db,
    levels,
}: {
    db: CQIDexie;
    levels: Option[];
}) {
    const program = useStore($program);
    const mapping = useStore($mapping);
    const processed = useStore($processed);
    const columns = mapping.dhis2SourceOptions?.columns || [];

    if (!processed.processedData || processed.processedData.length === 0) {
        return <div>No data</div>;
    }
    const stagesMax =
        program.programStages?.reduce<Record<string, number>>((a, b) => {
            const stageData = maxBy(processed.processedData, `0-${b.id}-max`);
            a[b.id] = stageData?.[`0-${b.id}-max`] ?? 1;
            return a;
        }, {}) ?? {};

    const dataColumns: TableColumnsType<any> = columns.map((parent) => {
        const totalEvents = stagesMax[parent.column] ?? 1;
        let children: TableColumnsType<any> = [];
        if (parent.children.length > 0) {
            children = range(totalEvents).map((d) => {
                return {
                    title: `${d + 1}`,
                    key: parent.column,
                    children: parent.children.map((child) => ({
                        title: child.label,
                        dataIndex: `0-${parent.column}-${child.column}-${d}`,
                        key: child.column,
                    })),
                };
            });
        }
        return {
            title: parent.label,
            dataIndex: parent.column,
            key: parent.column,
            children,
        };
    });

    return (
        <Table
            dataSource={processed.processedData}
            bordered
            scroll={{ x: "max-content" }}
            rowKey="0-trackedEntityInstance"
            style={{ whiteSpace: "nowrap" }}
            columns={dataColumns}
        />
    );
}
