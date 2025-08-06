/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from 'zod'
import superjson from 'superjson'
import type { Procedure } from './define-procedure'
import { useFetch, useRequestHeaders } from '#imports'

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
      return $fetch<InferProcedureOutput<P>>('/api' + url, {
        method: 'POST',
        body: superjson.serialize(input),
        parseResponse: superjson.parse,
        headers: useRequestHeaders(['cookie']),
      })
    }) as Call<P>,
    useCall: ((input: InferProcedureInput<P>) => {
      return useFetch<InferProcedureOutput<P>>('/api' + url, {
        key: `${url}: ${JSON.stringify(input)}`,
        method: 'POST',
        body: superjson.serialize(input),
        parseResponse: superjson.parse,
        headers: useRequestHeaders(['cookie']),
      } as any)
    }) as UseCall<P>,
  }
}
