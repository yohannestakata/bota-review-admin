import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ApiError } from "@/lib/api"

/** An API error, with field-level reasons listed when the server gives them. */
export function ApiErrorAlert({
  error,
  title,
}: {
  error: unknown
  title: string
}) {
  if (!error) return null
  const fields =
    error instanceof ApiError && error.fields ? Object.values(error.fields) : []
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {fields.length > 0 ? (
          <ul className="flex list-disc flex-col gap-0.5 pl-4">
            {fields.map((f) => (
              <li key={f.message}>{f.message}</li>
            ))}
          </ul>
        ) : error instanceof Error ? (
          error.message
        ) : (
          "Something went wrong."
        )}
      </AlertDescription>
    </Alert>
  )
}
