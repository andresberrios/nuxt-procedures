/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from 'zod'
import type { FetchContext } from 'ofetch'
import superjson from 'superjson'
import type { Procedure } from './define-procedure'
import { useFetch, useRequestHeaders } from '#imports'

// Only successful (2xx) responses are superjson-encoded by `defineProcedure` —
// error responses are thrown as plain H3Errors and rendered by h3's own
// `sendError` as ordinary JSON. `parseResponse` only ever sees the raw
// response text (no access to the status), so it can't tell the two apart.
// `onResponse` runs after ofetch's default JSON parsing but before it decides
// whether to throw for a >=400 status, and it does have the status — so we
// deserialize the already-parsed body here instead.
function deserializeSuccessResponse({ response }: Pick<FetchContext, 'response'>) {
  if (response && response.status >= 200 && response.status < 300) {
    response._data = superjson.deserialize(response._data)
  }
}

type InferProcedureInput<P> = P extends Procedure<infer I, any>
  ? I extends z.ZodUndefined
    ? unknown
    : z.infer<I>
  : never

type InferProcedureOutput<P> = P extends Procedure<any, infer O>
  ? O extends z.ZodTypeAny
    ? z.infer<O>
    : unknown
  : never

type Call<P extends Procedure<any, any>> = [unknown] extends [
  InferProcedureInput<P>,
]
  ? () => Promise<InferProcedureOutput<P>>
  : (input: InferProcedureInput<P>) => Promise<InferProcedureOutput<P>>

type UseCall<P extends Procedure<any, any>> = [unknown] extends [
  InferProcedureInput<P>,
]
  ? () => ReturnType<typeof useFetch<InferProcedureOutput<P>>>
  : (
      input: InferProcedureInput<P>
    ) => ReturnType<typeof useFetch<InferProcedureOutput<P>>>

export function createCaller<P extends Procedure<any, any>>(url: string) {
  return {
    call: ((input: unknown) => {
      return $fetch<InferProcedureOutput<P>>('/procedures' + url, {
        method: 'POST',
        body: superjson.serialize(input),
        onResponse: deserializeSuccessResponse,
        headers: useRequestHeaders(['cookie']),
      })
    }) as Call<P>,
    useCall: ((input: InferProcedureInput<P>) => {
      return useFetch<InferProcedureOutput<P>>('/procedures' + url, {
        key: `${url}: ${JSON.stringify(input)}`,
        method: 'POST',
        body: superjson.serialize(input),
        onResponse: deserializeSuccessResponse,
        headers: useRequestHeaders(['cookie']),
      } as any)
    }) as UseCall<P>,
  }
}
