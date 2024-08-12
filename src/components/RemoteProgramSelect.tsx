import { Box, Stack, useDisclosure } from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import Table, { ColumnsType } from "antd/es/table";
import { IProgram } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import {
    attributeMappingApi,
    dhis2ProgramApi,
    enrollmentMappingApi,
    mappingApi,
} from "../Events";
import { $mapping } from "../Store";

import { getDHIS2Resource, useDHIS2Resource } from "../Queries";
import { stepper } from "../Store";
import Loader from "./Loader";
import Progress from "./Progress";

export default function RemoteProgramSelect() {
    const engine = useDataEngine();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const programMapping = useStore($mapping);
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

    const { isError, isLoading, isSuccess, data, error } = useDHIS2Resource<{
        programs: IProgram[];
    }>({
        pageSize: 100,
        page: 1,
        resource: "programs.json",
        isCurrentDHIS2: programMapping.isCurrentInstance,
        auth: programMapping.authentication,
        q: "",
        fields: "id,name,displayName,lastUpdated,programType",
    });
    const onProgramSelect = async ({ id }: Partial<IProgram>) => {
        onOpen();
        const program = await getDHIS2Resource<IProgram>({
            engine,
            isCurrentDHIS2: programMapping.isCurrentInstance,
            resource: `programs/${id}`,
            auth: programMapping.authentication,
            params: {
                fields: "id,name,registration,trackedEntityType[id,featureType,trackedEntityTypeAttributes[id,trackedEntityAttribute[id,name,code,unique,generated,pattern,confidential,valueType,optionSetValue,displayFormName,optionSet[id,name,options[id,name,code]]]]],programType,featureType,organisationUnits[id,code,name,parent[name,parent[name,parent[name,parent[name,parent[name]]]]]],programStages[id,repeatable,featureType,name,code,programStageDataElements[id,compulsory,name,dataElement[id,name,code,valueType,optionSetValue,optionSet[id,name,options[id,name,code]]]]],programTrackedEntityAttributes[id,mandatory,sortOrder,allowFutureDate,trackedEntityAttribute[id,name,code,unique,generated,pattern,confidential,valueType,optionSetValue,displayFormName,optionSet[id,name,options[id,name,code]]]]",
            },
        });
        enrollmentMappingApi.updateMany({
            attribute: "info",
            update: {
                createEnrollments: true,
                updateEnrollments: true,
                enrollmentDateColumn: "enrollment.enrollmentDate",
                incidentDateColumn: "enrollment.incidentDate",
                enrollmentIdColumn: "enrollment.enrollment",
            },
        });
        attributeMappingApi.updateMany({
            attribute: "info",
            update: {
                createEntities: true,
                updateEntities: true,
                trackedEntityInstanceColumn: "trackedEntityInstance",
            },
        });
        mappingApi.updateMany({
            program: {
                ...programMapping.program,
                remoteProgram: id,
                remoteIsTracker: program.registration,
            },
        });
        dhis2ProgramApi.set(program);
        onClose();
        stepper.next();
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
                            dataSource={data.programs.map(
                                (p: Partial<IProgram>) => ({
                                    ...p,
                                    programType:
                                        p.programType === "WITH_REGISTRATION"
                                            ? "Tracker"
                                            : "Event",
                                }),
                            )}
                            rowKey="id"
                            rowSelection={{
                                type: "radio",
                                selectedRowKeys: programMapping.program
                                    ?.remoteProgram
                                    ? [programMapping.program?.remoteProgram]
                                    : [],

                                onSelect: (record) => onProgramSelect(record),
                            }}
                        />
                    )}
                    {isError && JSON.stringify(error)}
                </Box>
            </Box>

            <Progress
                onClose={onClose}
                isOpen={isOpen}
                message="Loading Selected Program"
                onOpen={onOpen}
            />
        </Stack>
    );
}
