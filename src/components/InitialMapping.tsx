import { DataSource } from "data-import-wizard-utils";
import APICredentials from "./APICredentials";
import FileUpload from "./FileUpload";
import ExcelUpload from "./mapping-fields/ExcelUpload";

export const InitialMapping = ({
    extraction,
    isSource,
    dataSource,
}: Partial<{
    isSource: boolean;
    extraction: "cell" | "column" | "json";
    dataSource: DataSource;
}>) => {
    const options: Record<DataSource, React.ReactElement> = {
        api: <APICredentials accessor="authentication" displayDHIS2Options />,
        "xlsx-line-list": (
            <ExcelUpload extraction={extraction ? extraction : "json"} />
        ),
        "csv-line-list": (
            <ExcelUpload extraction={extraction ? extraction : "json"} />
        ),
        "xlsx-tabular-data": (
            <ExcelUpload extraction={extraction ? extraction : "json"} />
        ),
        "xlsx-form": <ExcelUpload extraction="cell" />,

        json: <FileUpload type="json" extraction="json" />,
        "dhis2-data-set": (
            <APICredentials accessor="authentication" displayDHIS2Options />
        ),
        "dhis2-indicators": (
            <APICredentials accessor="authentication" displayDHIS2Options />
        ),
        "dhis2-program-indicators": (
            <APICredentials accessor="authentication" displayDHIS2Options />
        ),
        "manual-dhis2-program-indicators": (
            <APICredentials accessor="authentication" displayDHIS2Options />
        ),
        "dhis2-program": (
            <APICredentials accessor="authentication" displayDHIS2Options />
        ),
        "go-data": (
            <APICredentials accessor="authentication" displayDHIS2Options />
        ),
        fhir: <FileUpload type="json" extraction="json" />,
    };

    if (dataSource) {
        return options[dataSource];
    }
    return null;
};
