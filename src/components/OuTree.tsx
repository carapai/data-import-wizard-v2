import { Stack } from "@chakra-ui/react";
import { useDataEngine } from "@dhis2/app-runtime";
import { TreeSelect } from "antd";
import arrayToTree from "array-to-tree";
import { useLiveQuery } from "dexie-react-hooks";
import { flatten } from "lodash";
import { db } from "../db";

const OUTree = ({
    value,
    onChange,
}: {
    value: string[];
    onChange: (value: string[]) => void;
}) => {
    const engine = useDataEngine();
    const organisations = useLiveQuery(() => db.organisations.toArray());
    const expandedKeys = useLiveQuery(() => db.expandedKeys.get("1"));

    const onLoadData = async ({ id, children }: any) => {
        if (children) {
            return;
        }
        try {
            const {
                units: { organisationUnits },
            }: any = await engine.query({
                units: {
                    resource: "organisationUnits.json",
                    params: {
                        filter: `id:in:[${id}]`,
                        paging: "false",
                        order: "shortName:desc",
                        fields: "children[id,name,path,leaf]",
                    },
                },
            });
            const found = organisationUnits.map((unit: any) => {
                return unit.children
                    .map((child: any) => {
                        return {
                            id: child.id,
                            pId: id,
                            value: child.id,
                            title: child.name,
                            key: child.id,
                            isLeaf: child.leaf,
                        };
                    })
                    .sort((a: any, b: any) => {
                        if (a.title > b.title) {
                            return 1;
                        }
                        if (a.title < b.title) {
                            return -1;
                        }
                        return 0;
                    });
            });
            await db.organisations.bulkPut(flatten(found));
        } catch (e) {
            console.log(e);
        }
    };
    return (
        <Stack spacing="20px" width="400px">
            {organisations !== undefined && (
                <TreeSelect
                    treeData={arrayToTree(organisations, {
                        parentProperty: "pId",
                    })}
                    loadData={onLoadData}
                    value={value}
                    onChange={(value) => {
                        onChange(value);
                    }}
                    multiple
                />
            )}
        </Stack>
    );
};

export default OUTree;
