<template>
  <div>
    <h1>Nuxt module playground!</h1>
    Message: {{ message }}
  </div>
</template>

<script setup>
const { data: message } = await apiClient.hello.useCall('World')
</script>
