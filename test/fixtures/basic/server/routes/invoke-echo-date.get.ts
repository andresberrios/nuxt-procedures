import echoDate from '../procedures/echo-date'
import throwsError from '../procedures/throws-error'

// Calls procedures in-process: a plain Date in, a Date out, and the same
// error shape as the HTTP path.
export default defineEventHandler(async (event) => {
  const output = await invokeProcedure(echoDate, { input: new Date('2024-01-01T00:00:00.000Z'), event })
  let invalidStatus: number | undefined
  try {
    await invokeProcedure(echoDate, { input: 'not a date' as unknown as Date, event })
  }
  catch (err) {
    invalidStatus = (err as { statusCode?: number }).statusCode
  }
  let thrownStatus: number | undefined
  try {
    await invokeProcedure(throwsError, { event })
  }
  catch (err) {
    thrownStatus = (err as { statusCode?: number }).statusCode
  }
  return { isDate: output instanceof Date, iso: output.toISOString(), invalidStatus, thrownStatus }
})
