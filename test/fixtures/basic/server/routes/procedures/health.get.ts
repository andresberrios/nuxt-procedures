// A plain server route that lives under the `/procedures` prefix. It shares a
// radix router with the module's `/procedures/**` handler, and the more
// specific static route wins the lookup — so the module answering unmatched
// paths preemptively must not shadow it.
export default defineEventHandler(() => ({ ok: true }))
