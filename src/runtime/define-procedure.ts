/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type EventHandler,
  type H3Event,
  defineEventHandler,
  readBody,
  createError,
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
    handler: Handler<I, O>
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
  const procedure = defineEventHandler(async (event) => {
    const inputRaw = superjson.deserialize(await readBody(event))
    const output = await runProcedure(procedure, inputRaw, event)
    return superjson.serialize(output)
  }) as any
  procedure.__procedureMetadata = { inputSchema, outputSchema, handler }

  return procedure
}

const voidSchema = z.void()

/**
 * Validates the input, runs the handler and validates its output, throwing
 * the same 400/500 errors as the HTTP path. Shared by the HTTP handler and
 * `invokeProcedure`; serialization stays in the HTTP path.
 */
async function runProcedure(procedure: Procedure<any, any>, inputRaw: unknown, event: H3Event) {
  const { inputSchema, outputSchema, handler } = procedure.__procedureMetadata
  const parseResult = (inputSchema ?? voidSchema).safeParse(inputRaw)
  if (!parseResult.success) {
    throw createError({
      status: 400,
      message: 'Invalid procedure input',
      data: parseResult.error,
    })
  }
  const input = parseResult.data

  const outputRaw = await handler(inputSchema ? { input, event } : { event })
  const outputParseResult = outputSchema.safeParse(outputRaw)
  if (!outputParseResult.success) {
    throw createError({
      status: 500,
      message: 'Invalid procedure output',
      data: {
        error: outputParseResult.error,
        received: outputRaw,
      },
    })
  }
  return outputParseResult.data
}

/**
 * Calls a procedure from server code without going through HTTP or superjson:
 * `input` is a plain value checked against the procedure's input schema, the
 * handler runs with the given event, and the parsed output is returned as is
 * (a `Date` stays a `Date`). Errors are the same as on the HTTP path.
 */
export function invokeProcedure<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
  procedure: Procedure<I, O>,
  args: { event: H3Event } & (I extends z.ZodUndefined ? { input?: undefined } : { input: z.input<I> }),
): Promise<z.output<O>> {
  return runProcedure(procedure, (args as { input?: unknown }).input, args.event)
}
