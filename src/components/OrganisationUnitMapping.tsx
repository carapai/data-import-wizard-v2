import {
    Box,
    Button,
    Checkbox,
    Icon,
    Stack,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import Table, { ColumnsType } from "antd/es/table";
import { Option, RealMapping } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";
import {
    mappingApi,
    metadataApi,
    ouMappingApi,
    remoteOrganisationsApi,
} from "../Events";
import { getDHIS2Resource } from "../Queries";
import {
    $mapping,
    $metadata,
    $names,
    $organisationUnitMapping,
    $remoteOrganisationApi,
} from "../Store";
import { createMapping, findMapped, isMapped } from "../utils/utils";
import { APICredentialsModal } from "./APICredentialsModal";
import DestinationIcon from "./DestinationIcon";
import FieldMapper from "./FieldMapper";
import InfoMapping from "./InfoMapping";
import Progress from "./Progress";
import Search from "./Search";
import SourceIcon from "./SourceIcon";
export default function OrganisationUnitMapping() {
    const {
        info: { customOrgUnitColumn, orgUnitColumn } = {
            customOrgUnitColumn: false,
            orgUnitColumn: "",
        },
        ...organisationUnitMapping
    } = useStore($organisationUnitMapping);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const engine = useDataEngine();
    const {
        isOpen: isOpenModal,
        onOpen: onOpenModal,
        onClose: onCloseModal,
    } = useDisclosure();
    const { source, destination } = useStore($names);
    const remoteOrganisationApi = useStore($remoteOrganisationApi);
    const [fetching, setFetching] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");
    const mapping = useStore($mapping);
    const metadata = useStore($metadata);
    const [querying, setQuerying] = useState<string | undefined>(orgUnitColumn);
    const inputRef = useRef<HTMLInputElement>(null);
    const [currentOrganisations, setCurrentOrganisations] = useState(
        metadata.destinationOrgUnits,
    );
    const [ouSearch, setOuSearch] = useState<string>("");
    const mapManually = (
        attribute: string,
        key: keyof RealMapping,
        value: string,
    ) => {
        ouMappingApi.update({
            attribute,
            key,
            value,
        });
        ouMappingApi.update({ attribute, key: "isManual", value: true });
    };
    const columns: ColumnsType<Partial<Option>> = [
        {
            title: (
                <Stack direction="row" alignItems="center">
                    <DestinationIcon mapping={mapping} />
                    <Text>Destination Organization</Text>
                    <Text>{destination}</Text>
                </Stack>
            ),
            dataIndex: "label",
            key: "label",
        },
        {
            title: "Specific Value",
            key: "manual",
            width: "200px",
            align: "center",
            render: (text, { value }) => (
                <Checkbox
                    isDisabled={mapping.orgUnitsUploaded}
                    isChecked={organisationUnitMapping[value ?? ""]?.isCustom}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        ouMappingApi.update({
                            attribute: `${value}`,
                            key: "isCustom",
                            value: e.target.checked,
                        })
                    }
                />
            ),
        },

        {
            title: (
                <Stack direction="row" alignItems="center">
                    <SourceIcon mapping={mapping} />
                    <Text>Source Organization</Text>
                    <Text>{source}</Text>
                </Stack>
            ),
            key: "source",
            render: (_, { value = "" }) => (
                <FieldMapper
                    source={metadata.sourceOrgUnits}
                    onUpdate={(attribute, key, value) =>
                        mapManually(attribute, key, value)
                    }
                    isMulti
                    isSpecific={organisationUnitMapping[value]?.isSpecific}
                    attribute={value}
                    value={organisationUnitMapping[value]?.value}
                />
            ),
        },

        {
            title: "Mapped",
            width: "100px",
            render: (text, { value }) => {
                if (isMapped(value, organisationUnitMapping)) {
                    return (
                        <Icon as={FiCheck} color="green.400" fontSize="2xl" />
                    );
                }
                return null;
            },
            key: "mapped",
        },
    ];

    const fetchOrganisationsByLevel = async () => {
        onOpen();
        if (mapping.aggregate?.indicatorGenerationLevel) {
            setMessage(() => "Fetching organisations by level");
            const { organisationUnits: units } = await getDHIS2Resource<{
                organisationUnits: Array<Option>;
            }>({
                isCurrentDHIS2: mapping.isCurrentInstance,
                engine,
                resource: "organisationUnits.json",
                params: {
                    fields: "id~rename(value),name~rename(label)",
                    level: mapping.aggregate.indicatorGenerationLevel,
                    paging: "false",
                },
                auth: mapping.authentication,
            });
            metadataApi.set({ key: "sourceOrgUnits", value: units });
            setQuerying(() => "querying");
        }
        onClose();
    };

    useEffect(() => {
        if (mapping.dataSource === "dhis2-program") {
            ouMappingApi.update({
                attribute: "info",
                key: "orgUnitColumn",
                value: "orgUnit",
            });
        }

        return () => {};
    }, []);

    useEffect(() => {
        fetchOrganisationsByLevel();
        return () => {};
    }, []);

    const autoMap = async (map: boolean) => {
        onOpen();
        setMessage(() => "Trying to automatically map");
        createMapping({
            map,
            destinationOptions: metadata.destinationOrgUnits,
            sourceOptions: metadata.sourceOrgUnits,
            mapping: organisationUnitMapping,
            onMap(destinationValue, search) {
                if (search !== undefined) {
                    ouMappingApi.updateMany({
                        [destinationValue]: {
                            value: search.value,
                            isManual: false,
                        },
                    });
                }
            },
            onUnMap(destinationValue) {
                ouMappingApi.remove(destinationValue);
            },
        });
        onClose();
    };

    const onOK = async () => {
        setFetching(() => true);
        const { data } = await remoteOrganisationApi.get("");
        remoteOrganisationsApi.set(data);
        setFetching(() => false);
        onCloseModal();
    };
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const fileObj = event.target.files && event.target.files[0];
        if (!fileObj) {
            return;
        }
        event.target.value = "";
    };

    return (
        <Stack
            h="calc(100vh - 350px)"
            maxH="calc(100vh - 350px)"
            overflow="auto"
            spacing="20px"
        >
            <Stack direction="row" alignItems="center" spacing="30px">
                {[
                    "dhis2-program-indicators",
                    "dhis2-indicators",
                    "dhis2-data-set",
                    "dhis2-program",
                    "manual-dhis2-program-indicators",
                    "fhir",
                ].indexOf(mapping.dataSource ?? "") === -1 && (
                    <InfoMapping
                        customColumn="customOrgUnitColumn"
                        value={orgUnitColumn}
                        column="orgUnitColumn"
                        isChecked={customOrgUnitColumn}
                        update={ouMappingApi.update}
                        title="Organisation Column"
                        title2="Custom Organisation Column"
                    />
                )}
                {mapping.dataSource === "api" && (
                    <Stack direction="row" spacing="20px">
                        <Button onClick={() => inputRef.current?.click()}>
                            Upload Organisation Metadata List
                        </Button>
                        <Button
                            onClick={() => {
                                mappingApi.update({
                                    attribute: "orgUnitSource",
                                    value: "api",
                                });
                                onOpenModal();
                            }}
                        >
                            Query Metadata from API
                        </Button>
                        <APICredentialsModal
                            isOpen={isOpenModal}
                            onClose={onCloseModal}
                            updateMapping={mappingApi.update}
                            onOK={onOK}
                            mapping={mapping}
                            accessor="orgUnitApiAuthentication"
                            fetching={fetching}
                            labelField="remoteOrgUnitLabelField"
                            valueField="remoteOrgUnitValueField"
                        />
                        <input
                            style={{ display: "none" }}
                            ref={inputRef}
                            type="file"
                            onChange={handleFileChange}
                        />
                    </Stack>
                )}
            </Stack>
            <Checkbox
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    autoMap(e.target.checked)
                }
            >
                Auto Map
            </Checkbox>
            <Stack direction="row">
                <Box flex={1}>
                    <Search
                        options={metadata.destinationOrgUnits}
                        action={setCurrentOrganisations}
                        source={metadata.sourceOrgUnits}
                        searchString={ouSearch}
                        setSearchString={setOuSearch}
                        mapping={organisationUnitMapping}
                        label="Show Mapped Organisations Only"
                        label2="Show Unmapped Organisations Only"
                        placeholder="Search organisation units"
                    />
                </Box>
            </Stack>
            <Table
                columns={columns}
                dataSource={currentOrganisations}
                rowKey="value"
                pagination={{ pageSize: 8 }}
                size="small"
                footer={() => (
                    <Text textAlign="right">
                        Mapped{" "}
                        {findMapped(
                            organisationUnitMapping,
                            metadata.sourceOrgUnits,
                        )}{" "}
                        of {metadata.destinationOrgUnits?.length ?? 0}
                    </Text>
                )}
            />
            <Progress
                onClose={onClose}
                isOpen={isOpen}
                message={message}
                onOpen={onOpen}
            />
        </Stack>
    );
}
