<template>
  <div>
    <div>basic</div>
    <pre id="success-result">{{ successResult }}</pre>
    <pre id="error-result">{{ errorResult }}</pre>
  </div>
</template>

<script setup>
// `{{ }}` HTML-escapes quotes, so the raw JSON can't round-trip through
// text content as-is — URI-encode it, and decode + parse on the test side.
const echoedDate = await apiClient.echoDate.call(new Date('2024-01-01T00:00:00.000Z'))
const successResult = encodeURIComponent(JSON.stringify({
  isDate: echoedDate instanceof Date,
  iso: echoedDate instanceof Date ? echoedDate.toISOString() : null,
}))

let errorResult
try {
  await apiClient.throwsError.call()
  errorResult = encodeURIComponent(JSON.stringify({ threw: false }))
}
catch (err) {
  errorResult = encodeURIComponent(JSON.stringify({
    threw: true,
    statusCode: err.statusCode,
    data: err.data,
  }))
}
</script>
