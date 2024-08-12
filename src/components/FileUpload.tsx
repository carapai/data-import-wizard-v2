import { Stack } from "@chakra-ui/react";
import { Extraction, flattenBundle } from "data-import-wizard-utils";
import { useStore } from "effector-react";
import { ChangeEvent, useRef, useState } from "react";
import { read } from "xlsx";
import { dataApi, mappingApi } from "../Events";
import { $mapping, workbookApi } from "../Store";
import { getSheetData } from "../utils/utils";

export default function FileUpload({
    type,
    extraction,
}: {
    type: string;
    extraction: Extraction;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [hasFile, setHasFile] = useState<boolean>(false);
    const mapping = useStore($mapping);
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            let fileReader = new FileReader();
            const file = e.target.files[0];
            setHasFile(() => true);
            fileReader.onload = async (e) => {
                const result = e.target?.result;
                if (result && type === "json") {
                    if (mapping.dataSource === "fhir") {
                        const data = flattenBundle(JSON.parse(String(result)));
                        if (data) {
                            dataApi.changeData(data);
                        }
                    } else {
                        dataApi.changeData(JSON.parse(String(result)));
                    }
                } else {
                    const workbook = read(e.target?.result, {
                        type: "array",
                        cellDates: true,
                    });
                    workbookApi.set(workbook);
                    mappingApi.update({
                        attribute: "sheet",
                        value: workbook.SheetNames[0],
                    });

                    const sheetData = getSheetData(
                        workbook,
                        workbook.SheetNames[0],
                        mapping.headerRow,
                        mapping.dataStartRow,
                        extraction,
                    );
                    dataApi.changeData(sheetData);
                }
            };
            type === "json"
                ? fileReader.readAsText(file)
                : fileReader.readAsArrayBuffer(file);
        }
    };

    const resetFileInput = () => {
        if (inputRef && inputRef.current) {
            inputRef.current.value = "";
            setHasFile(() => false);
        }
    };
    if (mapping.isSource) return null;
    return (
        <Stack direction="row" alignItems="center">
            <input
                ref={inputRef}
                type="file"
                id="input"
                multiple
                onChange={handleFileChange}
            />
            {hasFile && (
                <button onClick={resetFileInput}>Reset file input</button>
            )}
        </Stack>
    );
}
