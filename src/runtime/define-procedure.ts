/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type EventHandler,
  type H3Event,
  defineEventHandler,
  readBody,
} from 'h3'
import z from 'zod'
import superjson from 'superjson'

export interface Procedure<
  I extends z.ZodTypeAny = z.ZodUndefined,
  O extends z.ZodTypeAny = z.ZodVoid,
> extends EventHandler {
  __procedureMetadata: {
    inputSchema: I
    outputSchema: O
  }
}

type Awaitable<T> = T | Promise<T>

type HandlerArgs<I> = I extends undefined
  ? { event: H3Event }
  : { input: I, event: H3Event }

// type Handler<
//   I extends z.ZodTypeAny = z.ZodUndefined,
//   O extends z.ZodTypeAny = z.ZodVoid,
// > = (args: HandlerArgs<z.infer<I>>) => O extends z.ZodVoid
//   ? Awaitable<void>
//   : Awaitable<z.infer<O>>
type Handler<
  I extends z.ZodTypeAny = z.ZodUndefined,
  O extends z.ZodTypeAny = z.ZodVoid,
> = (args: HandlerArgs<z.infer<I>>) => Awaitable<z.infer<O>>

export function defineProcedure<
  I extends z.ZodTypeAny = z.ZodUndefined,
  O extends z.ZodTypeAny = z.ZodVoid,
>(
  args: { input?: I, output?: O, handler: Handler<I, O> },
): Procedure<I, O>
export function defineProcedure(
  {
    input: inputSchema,
    output: outputSchema = z.void(),
    handler,
  }: {
    input?: z.ZodTypeAny
    output?: z.ZodTypeAny
    handler: (args: any) => any
  },
) {
  const h = defineEventHandler(async (event) => {
    // For now we ignore the provided inputs if there is no inputSchema
    // In the future we might want to throw an error to make it more strict
    const input = inputSchema
      ? inputSchema.parse(superjson.deserialize(await readBody(event)))
      : undefined

    const outputRaw = await handler(inputSchema ? { input, event } : { event })
    const output = outputSchema.parse(outputRaw)
    return superjson.serialize(output)
  })

  const procedure = h as any
  procedure.__procedureMetadata = { inputSchema, outputSchema }

  return procedure
}
