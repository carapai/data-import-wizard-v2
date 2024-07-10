import { Stack, useDisclosure, Text } from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import { Table, Tabs, Badge } from "antd";
import type { TabsProps } from "antd";

import { useStore } from "effector-react";
import { useEffect, useState } from "react";
import { invalidDataApi, processedDataApi } from "../../Events";
import {
    $attributeMapping,
    $attributionMapping,
    $data,
    $invalidData,
    $mapping,
    $organisationUnitMapping,
    $processedData,
} from "../../Store";
import {
    aggregateDataColumns,
    invalidDataColumns,
    processAggregateData,
} from "../../utils/utils";
import Progress from "../Progress";

export default function AggregateDataPreview() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [message, setMessage] = useState<string>("");
    const mapping = useStore($mapping);
    const organisationUnitMapping = useStore($organisationUnitMapping);
    const invalidData = useStore($invalidData);
    const dataMapping = useStore($attributeMapping);
    const attributionMapping = useStore($attributionMapping);
    const data = useStore($data);
    const processedData = useStore($processedData);
    const engine = useDataEngine();
    const queryData = async () => {
        onOpen();
        await processAggregateData({
            mapping,
            attributionMapping,
            dataMapping,
            data,
            dataCallback: async ({ validData, invalidData }) => {
                processedDataApi.add(validData);
                invalidDataApi.add(invalidData);
            },
            engine,
            organisationUnitMapping,
            setMessage,
        });
        onClose();
    };

    useEffect(() => {
        processedDataApi.set([]);
        invalidDataApi.set([]);
        queryData();
        return () => {};
    }, []);

    const items: TabsProps["items"] = [
        {
            key: "1",
            label: (
                <Badge count={processedData?.length} offset={[15, -5]}>
                    <Text>Data Values</Text>
                </Badge>
            ),
            children: (
                <Table
                    columns={aggregateDataColumns}
                    dataSource={processedData}
                    rowKey={(r) =>
                        `${r.dataElement}${r.orgUnit}${r.period}${r.categoryOptionCombo}${r.attributeOptionCombo}`
                    }
                    pagination={{ pageSize: 8 }}
                />
            ),
        },
        {
            key: "2",
            label: (
                <Badge count={invalidData?.length} offset={[15, -5]}>
                    <Text>Conflicts/Errors</Text>
                </Badge>
            ),
            children: (
                <Table
                    columns={invalidDataColumns(invalidData)}
                    dataSource={invalidData}
                    rowKey={(r) =>
                        `${r.dataElement}${r.orgUnit}${r.period}${r.categoryOptionCombo}${r.attributeOptionCombo}`
                    }
                    pagination={{ pageSize: 8 }}
                />
            ),
        },
    ];

    return (
        <Stack>
            <Tabs defaultActiveKey="1" items={items} />
            <Progress
                onClose={onClose}
                isOpen={isOpen}
                message={message}
                onOpen={onOpen}
            />
        </Stack>
    );
}
