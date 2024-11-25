import { Table } from "antd";
import { Option } from "data-import-wizard-utils";
import { useLiveQuery } from "dexie-react-hooks";
import { useStore } from "effector-react";
import { intersection, maxBy, range } from "lodash";
import { CQIDexie } from "../../db";

import { $mapping, $processed, $program } from "../../Store";
import { enrollmentOptions } from "../../utils/utils";

const { Column, ColumnGroup } = Table;

export default function ExcelExportPreview({ db }: { db: CQIDexie }) {
    const program = useStore($program);
    const mapping = useStore($mapping);
    const processed = useStore($processed);
    const columns = mapping.dhis2SourceOptions?.columns || [];
    const levels = useLiveQuery(() => db.levels.toArray());

    if (!processed.processedData || processed.processedData.length === 0) {
        return <div>No data</div>;
    }
    const stagesMax =
        program.programStages?.reduce<Record<string, number>>((a, b) => {
            const stageData = maxBy(processed.processedData, `0-${b.id}-max`);
            a[b.id] = stageData?.[`0-${b.id}-max`] ?? 1;
            return a;
        }, {}) ?? {};

    return (
        <Table
            dataSource={processed.processedData}
            bordered
            scroll={{ x: "max-content" }}
            rowKey="0-trackedEntityInstance"
            style={{ whiteSpace: "nowrap" }}
            sticky
            tableLayout="auto"
        >
            {program.programTrackedEntityAttributes?.flatMap(
                ({ trackedEntityAttribute: { id, name, displayFormName } }) => {
                    if (columns.includes(id)) {
                        return (
                            <Column
                                title={displayFormName || name}
                                dataIndex={id}
                                key={id}
                            />
                        );
                    }
                    return [];
                },
            )}

            {enrollmentOptions
                .map<Option>(({ label, value }) => ({
                    label,
                    value: `0-${value}`,
                }))
                .concat(
                    levels?.flatMap<Option>(({ value, label }) => [
                        { value: `level${value}id`, label: `${label} id` },
                        { value: `level${value}name`, label: `${label} name` },
                    ]) ?? [],
                )
                .flatMap(({ label, value = "" }) => {
                    if (columns.includes(value)) {
                        return (
                            <Column
                                title={label}
                                dataIndex={value}
                                key={value}
                            />
                        );
                    }
                    return [];
                })}
            {program.programStages?.flatMap(
                ({
                    id: stageId,
                    name,
                    programStageDataElements,
                    repeatable,
                }) => {
                    const common = intersection(
                        programStageDataElements
                            .map((a) => `${stageId}-${a.dataElement.id}`)
                            .concat(`${stageId}-eventDate`),
                        columns,
                    );
                    if (common.length > 0) {
                        return (
                            <ColumnGroup title={name} key={stageId}>
                                {repeatable
                                    ? range(stagesMax[stageId]).map((i) => (
                                          <ColumnGroup title={`Event ${i + 1}`}>
                                              {[
                                                  {
                                                      allowFutureDate: false,
                                                      compulsory: true,
                                                      dataElement: {
                                                          code: "eventDate",
                                                          id: "eventDate",
                                                          name: "Event Date",
                                                          displayName:
                                                              "eventDate",
                                                          optionSetValue: false,
                                                          zeroIsSignificant:
                                                              false,
                                                          valueType: "",
                                                          optionSet: {
                                                              id: "",
                                                              name: "",
                                                              options: [
                                                                  {
                                                                      code: "",
                                                                      id: "",
                                                                      name: "",
                                                                  },
                                                              ],
                                                          },
                                                      },
                                                  },
                                                  ...programStageDataElements,
                                              ].flatMap(
                                                  ({
                                                      dataElement: { id, name },
                                                  }) => {
                                                      if (
                                                          columns.includes(
                                                              `${stageId}-${id}`,
                                                          )
                                                      ) {
                                                          return (
                                                              <Column
                                                                  title={name}
                                                                  dataIndex={`0-${stageId}-${id}-${i}`}
                                                                  key={id}
                                                              />
                                                          );
                                                      }
                                                      return [];
                                                  },
                                              )}
                                          </ColumnGroup>
                                      ))
                                    : [
                                          {
                                              allowFutureDate: false,
                                              compulsory: true,
                                              dataElement: {
                                                  code: "eventDate",
                                                  id: "eventDate",
                                                  name: "Event Date",
                                                  displayName: "eventDate",
                                                  optionSetValue: false,
                                                  zeroIsSignificant: false,
                                                  valueType: "",
                                                  optionSet: {
                                                      id: "",
                                                      name: "",
                                                      options: [
                                                          {
                                                              code: "",
                                                              id: "",
                                                              name: "",
                                                          },
                                                      ],
                                                  },
                                              },
                                          },
                                          ...programStageDataElements,
                                      ].flatMap(
                                          ({ dataElement: { id, name } }) => {
                                              if (
                                                  columns.includes(
                                                      `${stageId}-${id}`,
                                                  )
                                              ) {
                                                  return (
                                                      <Column
                                                          title={name}
                                                          dataIndex={`0-${stageId}-${id}-0`}
                                                          key={id}
                                                      />
                                                  );
                                              }
                                              return [];
                                          },
                                      )}
                            </ColumnGroup>
                        );
                    }
                    return [];
                },
            )}
        </Table>
    );
}
