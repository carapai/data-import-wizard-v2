import { Mapping, RealMapping } from "data-import-wizard-utils";
import { PromiseExtended } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import React from "react";

export function useOneLiveQuery(
    query: PromiseExtended<Partial<RealMapping>[]>,
    deps: any[] = [],
) {
    const tableQuery = useLiveQuery(() => query, deps);

    const result = React.useMemo(() => {
        if (!tableQuery) return null;

        return tableQuery?.reduce<Mapping>((a, b) => {
            if (b.destination) {
                a[b.destination] = b;
            }
            return a;
        }, {});
    }, [tableQuery]);

    return result;
}
