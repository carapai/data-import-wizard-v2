import { ColumnsType } from "antd/es/table";
import {
    AggDataValue,
    Authentication,
    convertToAggregate,
    Extraction,
    generateUid,
    IDataSet,
    IMapping,
    Mapping,
    MappingEvent,
    Option,
    StageMapping,
} from "data-import-wizard-utils";
import dayjs from "dayjs";
import { Workbook as WB } from "exceljs";
import { chunk, fromPairs, groupBy, orderBy, times, uniq } from "lodash";
import { uniqBy } from "lodash/fp";
import { Event } from "effector";
import { read, utils, WorkBook, WorkSheet } from "xlsx";
import { Column, Threshold } from "../Interfaces";
import { getDHIS2Resource } from "../Queries";

export function encodeToBinary(str: string): string {
    return btoa(
        encodeURIComponent(str).replace(
            /%([0-9A-F]{2})/g,
            function (match, p1) {
                return String.fromCharCode(parseInt(p1, 16));
            },
        ),
    );
}
export function decodeFromBinary(str: string): string {
    return decodeURIComponent(
        Array.prototype.map
            .call(atob(str), function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(""),
    );
}

export const convertDataToURL = (objs: any[]) => {
    return objs
        .map((s) => {
            return s.param + "=" + s.value;
        })
        .join("&");
};

export const getSheetData = (
    workbook: WorkBook,
    worksheet: string,
    headerRow: number = 1,
    dataStartRow: number = 2,
    extraction: Extraction = "json",
) => {
    const ws = workbook.Sheets[worksheet];
    if (extraction === "cell") {
        const {
            ["!cols"]: cols,
            ["!rows"]: rows,
            ["!merges"]: merges,
            ["!protect"]: protect,
            ["!autofilter"]: autofilter,
            ["!ref"]: ref,
            ["!margins"]: margins,
            ["!type"]: type,
            ...rest
        } = ws;

        const all = Object.entries(rest).map(([col, cell]) => {
            if (cell && cell.t === "d") {
                return [col, dayjs(cell.v).format("YYYY-MM-DD")];
            } else if (cell) {
                return [col, cell.v];
            } else {
                return [col, ""];
            }
        });
        return [fromPairs(all)];
    }

    let range = utils.decode_range(ws["!ref"] ?? "");
    let dense = ws["!data"] != null;
    const columns = times(range.e.c + 1, (c) => {
        let cell = dense
            ? ws["!data"]?.[headerRow - 1]?.[c]
            : ws[utils.encode_cell({ r: headerRow - 1, c })];
        if (cell) return cell.v;
        return "";
    });
    const data = [];

    for (let R = dataStartRow - 1; R <= range.e.r; ++R) {
        const currentRow: any[][] = [];
        for (let C = 0; C <= range.e.c; ++C) {
            let cell = dense
                ? ws["!data"]?.[R]?.[C]
                : ws[utils.encode_cell({ r: R, c: C })];
            const column: string =
                extraction === "column" ? utils.encode_col(C) : columns[C];
            if (cell && cell.t === "d") {
                currentRow.push([column, dayjs(cell.v).format("YYYY-MM-DD")]);
            } else if (cell) {
                currentRow.push([column, String(cell.v)]);
            } else {
                currentRow.push([column, ""]);
            }
        }
        data.push(fromPairs(currentRow));
    }
    return data;
};

export const generateData = (
    mapping: Partial<IMapping>,
    workbook: WorkBook,
    extraction: Extraction,
) => {
    const sheetData = workbook.Sheets[mapping.sheet ?? "Sheet 1"];
    if (extraction === "json") {
        if (mapping.headerRow === 1 && mapping.dataStartRow === 2) {
            return utils.sheet_to_json(sheetData, {
                raw: false,
                defval: "",
            });
        } else if (mapping.headerRow && mapping.dataStartRow) {
            const data: string[][] = utils.sheet_to_json(sheetData, {
                header: 1,
                defval: "",
            });
            const header = data[mapping.headerRow - 1];
            return data
                .slice(mapping.dataStartRow)
                .map((d) =>
                    fromPairs(d.map((dx, index) => [header[index], dx])),
                );
        }
        return [];
    } else if (extraction === "column") {
        const data = utils.sheet_to_json(sheetData, {
            raw: true,
            defval: "",
            header: "A",
        });
        return data;
    } else if (extraction === "cell") {
        const {
            ["!cols"]: cols,
            ["!rows"]: rows,
            ["!merges"]: merges,
            ["!protect"]: protect,
            ["!autofilter"]: autofilter,
            ["!ref"]: ref,
            ["!margins"]: margins,
            ["!type"]: type,
            ...rest
        } = sheetData;
        return [rest];
    }
    return [];
};
function padZero(str: string, len: number = 2) {
    var zeros = new Array(len).join("0");
    return (zeros + str).slice(-len);
}

export const findColor = (val: number, thresholds: Threshold[]) => {
    const withoutBaseline = orderBy(
        thresholds.flatMap((val) => {
            if (val.id !== "baseline") {
                return val;
            }
            return [];
        }),
        ["value"],
        ["asc"],
    );
    const baseline =
        thresholds.find(({ id }) => id === "baseline")?.color || "";
    const search = withoutBaseline.find(({ value }, index) => {
        if (index < withoutBaseline.length - 1) {
            return val >= value && val < withoutBaseline[index + 1].value;
        }
        return val >= value;
    });
    if (search) {
        return search.color;
    }
    return baseline;
};

const calculation = {
    count: (
        data: any[],
        thresholds: Threshold[],
        others: Partial<{
            aggregationColumn: string;
            col2: string;
            prevValue: number;
        }>,
    ) => {
        const value = data.length;
        const color = findColor(value, thresholds);
        return {
            bg: color,
            color: invertHex(color),
            value: value,
        };
    },
};

const findMerged = (
    list: string[],
    data: Array<any>,
    properties?: { [key: string]: any },
) => {
    if (data) {
        let finalColumns: Array<Array<Column>> = [];
        for (let index = 0; index < list.length; index++) {
            const col = list[index];
            let currentValues: Array<Column> = uniq(data.map((d) => d[col]))
                .filter((d) => !!d)
                .map((d) => {
                    return {
                        label: d,
                        value: d,
                        span: 1,
                        actual: d,
                        position: properties?.[`${d}.position`] || 1,
                        key: d,
                    };
                });
            currentValues = orderBy(currentValues, "value", "asc");
            if (index === 0) {
                finalColumns[0] = currentValues;
            } else {
                const prev = finalColumns[index - 1];
                let nextValues: Array<Column> = [];
                for (const v of prev) {
                    for (const p of currentValues) {
                        nextValues = [
                            ...nextValues,
                            {
                                label: `${v.label}${p.label}`,
                                value: `${v.value}${p.value}`,
                                key: `${v.key}--${p.value}`,
                                span: 1,
                                actual: p.value,
                                position:
                                    properties?.[`${p.value}.position`] || 1,
                            },
                        ];
                    }
                }
                nextValues = orderBy(nextValues, "value", "asc");
                finalColumns[index] = nextValues;
            }
        }

        return finalColumns.map((data, index, columns) => {
            if (index < columns.length - 1) {
                const last = columns[columns.length - 1].length;
                const current = columns[index].length;
                return data.map((x) => {
                    return { ...x, span: last / current };
                });
            }
            return data;
        });
    }
    return [];
};

export const processTable = ({
    data,
    rows,
    otherColumns,
    aggregation,
    columns,
    properties,
    dimensions,
    thresholds,
    aggregationColumn,
}: {
    data: any[];
    rows: string[];
    columns: string[];
    otherColumns: string[];
    aggregation: keyof typeof calculation;
    thresholds: Threshold[];
    aggregationColumn: string;
    dimensions?: { [key: string]: string[] };
    properties?: { [key: string]: any };
}) => {
    if (data) {
        const finalColumns = findMerged(columns, data, properties);
        const finalRows = findMerged(rows, data, properties);

        const groupedData = groupBy(data, (d) =>
            rows.map((r) => d[r]).join(""),
        );

        const allKeys = Object.keys(groupedData);

        const finalData = allKeys.sort().map((key) => {
            const values = groupedData[key] || [];
            let rows = values;
            if (aggregationColumn) {
                rows = uniqBy(aggregationColumn, values);
            }
            const groupedByColumn = groupBy(values, (d) =>
                columns.map((r) => d[r]).join(""),
            );
            let currentObj: any = fromPairs(
                otherColumns
                    .filter((d) => !!d)
                    .map((d) => [d, uniqBy("id", values).length]),
            );

            Object.entries(groupedByColumn).forEach(
                ([columnKey, columnData]) => {
                    const calculated = calculation[aggregation](
                        columnData,
                        thresholds,
                        {
                            aggregationColumn,
                            prevValue: rows.length,
                        },
                    );
                    currentObj = {
                        ...currentObj,
                        [`${columnKey}`]: calculated.value,
                        [`${columnKey}color`]: calculated.color,
                        [`${columnKey}bg`]: calculated.bg,
                        ...columnData[0],
                        key,
                    };
                },
            );
            return currentObj;
        });
        return {
            finalColumns,
            finalRows,
            finalData,
        };
    }
    return { finalColumns: [], finalRows: [], finalData: [] };
};

export function invertHex(hex: string, bw: boolean = true) {
    if (hex) {
        if (hex.indexOf("#") === 0) {
            hex = hex.slice(1);
        }
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            return "";
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        if (bw) {
            return r * 0.299 + g * 0.587 + b * 0.114 > 186
                ? "#000000"
                : "#FFFFFF";
        }
        const r1 = (255 - r).toString(16);
        const g1 = (255 - g).toString(16);
        const b1 = (255 - b).toString(16);
        return "#" + padZero(r1) + padZero(g1) + padZero(b1);
    }
    return "";
}

export function columnTree(
    list: Array<ColumnsType<any>>,
    properties: { [key: string]: any },
): Array<ColumnsType<any>> {
    if (list.length === 0) {
        return [];
    } else if (list.length === 1) {
        return [
            list[0].map((a) => {
                return {
                    ...a,
                    onHeaderCell: () => {
                        return {
                            style: {
                                backgroundColor: properties[`${a.key}.bg`],
                            },
                        };
                    },
                    onCell: (cell) => {
                        return {
                            style: {
                                backgroundColor: cell[`${a.key}bg`],
                                color: invertHex(cell[`${a.key}bg`], true),
                            },
                        };
                    },
                };
            }),
        ];
    } else if (list.length === 2) {
        return columnTree(
            [
                list[0].map((a) => {
                    return {
                        ...a,
                        children: list[1].map((b) => {
                            return {
                                ...b,
                                dataIndex: `${a.key}${b.key}`,
                                onHeaderCell: () => {
                                    return {
                                        style: {
                                            backgroundColor:
                                                properties[`${b.key}.bg`],
                                        },
                                    };
                                },
                                onCell: (cell) => {
                                    return {
                                        style: {
                                            backgroundColor: cell[`${a.key}bg`],
                                            color: invertHex(
                                                cell[`${a.key}bg`],
                                                true,
                                            ),
                                        },
                                    };
                                },
                            };
                        }),
                    };
                }),
            ],
            properties,
        );
    } else {
        return columnTree(
            [
                ...list.slice(0, list.length - 2),
                ...columnTree(list.slice(-2), properties),
            ],
            properties,
        );
    }
}

export const saveProgramMapping = async ({
    engine,
    mapping,
    organisationUnitMapping,
    attributeMapping,
    optionMapping,
    programStageMapping,
    enrollmentMapping,
    action,
}: {
    engine: any;
    mapping: Partial<IMapping>;
    organisationUnitMapping: Mapping;
    attributeMapping: Mapping;
    programStageMapping: StageMapping;
    optionMapping: Record<string, string>;
    action: "creating" | "editing";
    enrollmentMapping: Mapping;
}) => {
    const type = action === "creating" ? "create" : "update";
    const mutation: any = {
        type,
        resource: `dataStore/iw-mapping/${mapping.id}`,
        data: {
            ...mapping,
            lastUpdated: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
    };
    const mutation2: any = {
        type,
        resource: `dataStore/iw-ou-mapping/${mapping.id}`,
        data: organisationUnitMapping,
    };
    const mutation3: any = {
        type,
        resource: `dataStore/iw-attribute-mapping/${mapping.id}`,
        data: attributeMapping,
    };
    const mutation4: any = {
        type,
        resource: `dataStore/iw-stage-mapping/${mapping.id}`,
        data: programStageMapping,
    };
    const mutation5: any = {
        type,
        resource: `dataStore/iw-option-mapping/${mapping.id}`,
        data: optionMapping,
    };
    const mutation6: any = {
        type,
        resource: `dataStore/iw-enrollment-mapping/${mapping.id}`,
        data: enrollmentMapping,
    };

    return await Promise.all([
        engine.mutate(mutation),
        engine.mutate(mutation2),
        engine.mutate(mutation3),
        engine.mutate(mutation4),
        engine.mutate(mutation5),
        engine.mutate(mutation6),
    ]);
};

export const authentication: Partial<Authentication> =
    process.env.NODE_ENV === "development"
        ? {
              basicAuth: true,
              url: process.env.REACT_APP_URL,
              username: process.env.REACT_APP_USERNAME,
              password: process.env.REACT_APP_PASSWORD,
          }
        : {};

export const defaultMapping: Partial<IMapping> = {
    id: generateUid(),
    name: "AAAA",
    description: "BBB",
    isSource: false,
    authentication,
    dataStartRow: 2,
    headerRow: 1,
    dataSource: "dhis2-program-indicators",
    isCurrentInstance: true,
    aggregate: {},
    chunkSize: 5000,
    program: {},
    type: "aggregate",
};

export const findMapped = (mapping: Mapping, source: Option[]) => {
    return Object.entries(mapping).filter(([_, val]) => {
        return (
            val.value && source.find((current) => current.value === val.value)
        );
    }).length;
};
export const isMapped = (value: any, mapping: Mapping) => {
    if (value === undefined) return false;
    return mapping[value] && mapping[value].value;
};

export const processAggregateData = async ({
    mapping,
    organisationUnitMapping,
    dataMapping,
    data,
    attributionMapping,
    setMessage,
    engine,
    dataCallback,
}: {
    mapping: Partial<IMapping>;
    organisationUnitMapping: Mapping;
    dataMapping: Mapping;
    data: any[];
    attributionMapping: Mapping;
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    engine: any;
    dataCallback: ({
        validData,
    }: {
        validData: Array<AggDataValue>;
        invalidData: any[];
    }) => Promise<void>;
}) => {
    if (
        [
            "xlsx-line-list",
            "xlsx-tabular-data",
            "xlsx-form",
            "csv-line-list",
        ].indexOf(mapping.dataSource ?? "") !== -1
    ) {
        await dataCallback(
            convertToAggregate({
                mapping,
                organisationUnitMapping,
                dataMapping,
                data,
                attributionMapping,
            }),
        );
    } else if (mapping.dataSource === "dhis2-data-set") {
        for (const orgUnit of mapping.dhis2SourceOptions?.ous ?? []) {
            for (const p of mapping.dhis2SourceOptions?.period ?? []) {
                let params: Record<string, string> = {
                    dataSet: mapping.aggregate?.remote ?? "",
                    orgUnit,
                    children: "true",
                };
                if (p.type === "range" && p.startDate && p.endDate) {
                    params = {
                        ...params,
                        startDate: p.startDate,
                        endDate: p.endDate,
                    };
                }
                setMessage(
                    () =>
                        `Querying data orgUnit ${orgUnit} and period ${p.value}`,
                );
                const data = await getDHIS2Resource<any>({
                    isCurrentDHIS2: mapping.isCurrentInstance,
                    auth: mapping.authentication,
                    engine,
                    resource: "dataValueSets.json",
                    params,
                });

                if (data.dataValues) {
                    setMessage(
                        () =>
                            `Converting data for orgUnit ${orgUnit} and period ${p.value}`,
                    );
                    await dataCallback(
                        convertToAggregate({
                            mapping,
                            organisationUnitMapping,
                            dataMapping,
                            data: data.dataValues,
                            attributionMapping,
                        }),
                    );
                }
            }
        }
    } else if (
        ["dhis2-indicators", "dhis2-program-indicators"].indexOf(
            mapping.dataSource ?? "",
        ) !== -1
    ) {
        const allKeys = Object.values(dataMapping).flatMap((a) => {
            if (a.value) {
                return a.value;
            }
            return [];
        });

        if (allKeys.length > 0) {
            for (const indicators of chunk(allKeys, 25)) {
                setMessage(
                    () =>
                        `Querying data for orgUnit level ${
                            mapping.aggregate?.indicatorGenerationLevel
                        } and periods ${(
                            mapping.dhis2SourceOptions?.period?.map(
                                (p) => p.value,
                            ) ?? []
                        ).join(";")} for indicators ${indicators.join(";")}`,
                );
                const data = await getDHIS2Resource<{
                    headers: Array<{ name: string }>;
                    rows: string[][];
                }>({
                    isCurrentDHIS2: mapping.isCurrentInstance,
                    auth: mapping.authentication,
                    engine,
                    resource: `analytics.json?dimension=dx:${indicators.join(
                        ";",
                    )}&dimension=ou:LEVEL-${
                        mapping.aggregate?.indicatorGenerationLevel ?? []
                    }&dimension=pe:${(
                        mapping.dhis2SourceOptions?.period?.map(
                            (p) => p.value,
                        ) ?? []
                    ).join(";")}`,
                });

                setMessage(
                    () =>
                        `Processing and converting data for orgUnit level ${
                            mapping.aggregate?.indicatorGenerationLevel
                        } and periods ${(
                            mapping.dhis2SourceOptions?.period?.map(
                                (p) => p.value,
                            ) ?? []
                        ).join(";")} for indicators ${indicators.join(";")}`,
                );
                if (data.rows && data.rows.length > 0) {
                    const finalData = data.rows.map((row) =>
                        fromPairs(
                            row.map((r, index) => [
                                data.headers?.[index].name,
                                r,
                            ]),
                        ),
                    );
                    dataCallback(
                        convertToAggregate({
                            mapping,
                            organisationUnitMapping,
                            dataMapping,
                            data: finalData,
                            attributionMapping,
                        }),
                    );
                }
            }
        }
    }
};

export const aggregateDataColumns: ColumnsType<AggDataValue> = [
    {
        title: "Data Element",
        dataIndex: "dataElement",
        key: "dataElement",
    },
    {
        title: "Organisation",
        dataIndex: "orgUnit",
        key: "orgUnit",
    },
    {
        title: "Period",
        dataIndex: "period",
        key: "period",
    },
    {
        title: "Category OptionCombo",
        dataIndex: "categoryOptionCombo",
        key: "categoryOptionCombo",
    },
    {
        title: "Attribute OptionCombo",
        dataIndex: "attributeOptionCombo",
        key: "attributeOptionCombo",
    },
    {
        title: "Value",
        dataIndex: "value",
        key: "value",
    },
];

export const invalidDataColumns = (
    invalidData: any[] | undefined,
): ColumnsType<any> => {
    if (invalidData && invalidData.length > 0) {
        const keys = Object.keys(invalidData[0]);
        return keys.map((key) => {
            return {
                title: key,
                dataIndex: key,
                key,
            };
        });
    }
    return [];
};

export const hasAttribution = (dataSet: Partial<IDataSet>) => {
    const categories = dataSet.categoryCombo?.categories.filter(
        ({ name }) => name !== "default",
    );
    return categories && categories.length > 0;
};

export const findUniqueDataSetCompletions = (
    dataSet: string,
    values: AggDataValue[],
) => {
    return uniq(values.map((x) => `${x.orgUnit},${x.period}`)).map((a) => {
        const [organisationUnit, period] = a.split(",");
        return { organisationUnit, period, completed: true, dataSet };
    });
};

export const processProgramMapping = () => {};

export const searchMapping = ({
    destinationCode,
    destinationLabel,
    destinationValue,
    sourceOptions,
}: {
    destinationValue: string;
    destinationLabel: string;
    destinationCode: string;
    sourceOptions: Option[];
}) => {
    let search = sourceOptions.find(({ value }) => destinationValue === value);
    if (search === undefined) {
        search = sourceOptions.find(
            ({ code }) => code && code.includes(destinationCode),
        );
    }
    if (search === undefined) {
        search = sourceOptions.find(
            ({ code }) => code && code.includes(destinationValue),
        );
    }
    if (search === undefined) {
        search = sourceOptions.find(({ label }) =>
            label.includes(destinationValue),
        );
    }
    if (search === undefined) {
        search = sourceOptions.find(({ value }) => value === destinationLabel);
    }

    if (search === undefined) {
        search = sourceOptions.find(({ label }) => label === destinationLabel);
    }

    if (search === undefined) {
        search = sourceOptions.find(({ label }) => label === destinationLabel);
    }

    if (search === undefined) {
        search = sourceOptions.find(
            ({ code }) => code && code.includes(destinationLabel),
        );
    }
    return search;
};

export const createMapping = ({
    destinationOptions,
    map,
    mapping,
    sourceOptions,
    onMap,
    onUnMap,
}: {
    destinationOptions: Option[];
    sourceOptions: Option[];
    map: boolean;
    mapping: Mapping;
    onMap: (destinationValue: string, search: any) => void;
    onUnMap: (destinationValue: string) => void;
}) => {
    let i = 0;
    for (const {
        value: destinationValue = "",
        label: destinationLabel = "",
        code: destinationCode = "",
    } of destinationOptions) {
        const mapValue = mapping[destinationValue];
        if (map && mapValue === undefined) {
            const search = searchMapping({
                destinationCode,
                destinationLabel,
                destinationValue,
                sourceOptions,
            });
            onMap(destinationValue, search);
        } else if (!map && destinationValue && mapValue && !mapValue.isManual) {
            onUnMap(destinationValue);
        }
        if (i === destinationOptions.length) {
            // onEnd();
        }
        i++;
    }
};
