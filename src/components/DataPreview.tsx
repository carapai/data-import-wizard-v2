import { useStore } from "effector-react";
import { $mapping } from "../Store";
import AggregateDataPreview from "./previews/AggregateDataPreview";
import ProgramDataPreview from "./previews/ProgramDataPreview";
import SwitchComponent, { Case } from "./SwitchComponent";

export default function DataPreview() {
    const mapping = useStore($mapping);
    return (
        <SwitchComponent condition={mapping.type}>
            <Case value="aggregate">
                <AggregateDataPreview />
            </Case>
            <Case default>
                <ProgramDataPreview />
            </Case>
        </SwitchComponent>
    );
}
