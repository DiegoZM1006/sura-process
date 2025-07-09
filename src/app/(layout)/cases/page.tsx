import { DataTable } from "@/components/data-table"
import { schema } from "@/components/data-table"
import data from "./data.json"
import { z } from "zod"

export default function Page() {
    // Validate and type the data
    const typedData = data as z.infer<typeof schema>[]
    
    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <DataTable data={typedData} />
                </div>
            </div>
        </div>
    )
}