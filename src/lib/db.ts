import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let cachedSql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> {
  if (cachedSql) return cachedSql
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error(
      'Environment variable DATABASE_URL belum dikonfigurasi di pengaturan hosting/server.'
    )
  }
  cachedSql = neon(databaseUrl)
  return cachedSql
}

export const sql = (
  strings: TemplateStringsArray,
  ...params: unknown[]
): ReturnType<NeonQueryFunction<false, false>> => {
  return getSql()(strings, ...params)
}
