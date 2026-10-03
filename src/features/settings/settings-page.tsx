import { useUrlFilters } from "@/hooks/use-url-filters"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { FailedJobs } from "./failed-jobs"
import { TaxonomyEditor } from "./taxonomy-editor"

export function SettingsPage() {
  const { get, set } = useUrlFilters()
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col p-6">
      <Tabs
        value={get("tab", "lists")}
        onValueChange={(value) =>
          set("tab", value === "lists" ? "" : String(value))
        }
      >
        <TabsList variant="line">
          <TabsTrigger value="lists">Lists</TabsTrigger>
          <TabsTrigger value="jobs">Background jobs</TabsTrigger>
        </TabsList>
        <TabsContent value="lists" className="pt-4">
          <TaxonomyEditor />
        </TabsContent>
        <TabsContent value="jobs" className="pt-4">
          <FailedJobs />
        </TabsContent>
      </Tabs>
    </div>
  )
}
