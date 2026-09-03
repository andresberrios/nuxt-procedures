// Exercises the legitimately-empty path: no output schema, and a handler that
// returns nothing. Answering unmatched paths with a 404 must not turn a
// procedure that really does exist but has no result into an error.
export default defineProcedure({
  handler: () => {},
})
