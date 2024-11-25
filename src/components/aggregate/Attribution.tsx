import { Stack } from "@chakra-ui/react";
import { useStore } from "effector-react";
import { CQIDexie } from "../../db";
import { attributionMappingApi } from "../../Events";
import { $attributionMapping, $metadata } from "../../Store";
import GenericMapping from "../GenericMapping";

export default function Attribution({ db }: { db: CQIDexie }) {
    const metadata = useStore($metadata);
    const attributionMapping = useStore($attributionMapping);
    return (
        <GenericMapping
            destinationOptions={metadata.destinationCategoryOptionCombos}
            sourceOptions={metadata.sourceCategoryOptionCombos}
            isMulti
            updater={attributionMappingApi.updateMany}
            merger={attributionMappingApi.merge}
            mapped={attributionMapping}
            db={db}
        />
    );
}
