import { Box, Stack, useDisclosure } from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import { Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { fetchRemote, IProgram } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { getOr } from "lodash/fp";
import { CQIDexie } from "../../db";
import { dataApi, mappingApi, programApi } from "../../Events";
import { loadProgram, usePrograms } from "../../Queries";
import { $mapping, stepper } from "../../Store";
import Loader from "../Loader";
import Progress from "../Progress";

const ProgramSelect = ({ db }: { db: CQIDexie }) => {
    const engine = useDataEngine();
    const mapping = useStore($mapping);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isLoading, isError, isSuccess, error, data } = usePrograms(1, 100);

    const columns: ColumnsType<Partial<IProgram>> = [
        {
            title: "Id",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Program Type",
            dataIndex: "programType",
            key: "programType",
        },
    ];

    const onProgramSelect = async (id?: string) => {
        await db.messages.put({ message: "Loading program", id: 1 });
        if (id) {
            onOpen();
            let data = await loadProgram<Partial<IProgram>>({
                engine,
                id,
                fields: "id,name,registration,featureType,trackedEntityType[id,featureType,trackedEntityTypeAttributes[id,trackedEntityAttribute[id,name,code,unique,generated,pattern,confidential,valueType,optionSetValue,displayFormName,optionSet[id,name,options[id,name,code]]]]],programType,featureType,organisationUnits[id,code,name,parent[name,parent[name,parent[name,parent[name,parent[name]]]]]],programStages[id,repeatable,featureType,name,code,programStageDataElements[id,compulsory,name,dataElement[id,name,code,valueType,optionSetValue,optionSet[id,name,options[id,name,code]]]]],programTrackedEntityAttributes[id,mandatory,sortOrder,allowFutureDate,trackedEntityAttribute[id,name,code,unique,generated,pattern,confidential,valueType,optionSetValue,displayFormName,optionSet[id,name,options[id,name,code]]]]",
                resource: "programs",
            });
            const other = mapping.isSource
                ? { source: data.name }
                : { destination: data.name };
            mappingApi.updateMany({
                program: {
                    ...mapping.program,
                    trackedEntityType: getOr("", "trackedEntityType.id", data),
                    program: id,
                    isTracker: data.registration,
                    ...other,
                },
            });
            programApi.set(data);

            if (
                !mapping.isSource &&
                mapping.dataSource === "api" &&
                mapping.prefetch
            ) {
                const data1 = await fetchRemote<any[]>(mapping.authentication);
                dataApi.changeData(data1);
            }
            onClose();
            stepper.next();
        }
    };

    return (
        <Stack>
            <Box m="auto" w="100%">
                <Box
                    overflow="auto"
                    whiteSpace="nowrap"
                    h="calc(100vh - 350px)"
                >
                    {isLoading && (
                        <Loader message="Loading DHIS2 programs..." />
                    )}
                    {isSuccess && (
                        <Table
                            columns={columns}
                            dataSource={data.programs}
                            rowKey="id"
                            rowSelection={{
                                type: "radio",
                                selectedRowKeys: mapping.program?.program
                                    ? [mapping.program?.program]
                                    : [],

                                onSelect: (record) =>
                                    onProgramSelect(record.id),
                            }}
                        />
                    )}
                    {isError && JSON.stringify(error)}
                </Box>
            </Box>

            <Progress onClose={onClose} isOpen={isOpen} db={db} />
        </Stack>
    );
};

export default ProgramSelect;
