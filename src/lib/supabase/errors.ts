interface SupabaseLikeError {
  code?: string;
  message?: string;
}

export function isMissingSupabaseSchemaError(error: SupabaseLikeError) {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST202" ||
    (message.includes("could not find the table") && message.includes("schema cache")) ||
    (message.includes("could not find the function") && message.includes("schema cache")) ||
    message.includes("relation") && message.includes("does not exist")
  );
}
