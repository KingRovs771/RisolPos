import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_ENDPOINT_URL_S3
  )
}

export function getStorageClient(): S3Client | null {
  if (!isStorageConfigured()) {
    return null
  }

  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true, // Neon storage gateway requires path-style addressing
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

export async function uploadAsset(
  bucketName: string,
  key: string,
  body: Uint8Array | Buffer | string,
  contentType: string = 'application/octet-stream'
): Promise<boolean> {
  const client = getStorageClient()
  if (!client) {
    console.warn('[Neon Storage] S3 client not configured, skipping cloud upload.')
    return false
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: typeof body === 'string' ? Buffer.from(body) : body,
        ContentType: contentType,
      })
    )
    return true
  } catch (error) {
    console.error('[Neon Storage] Upload failed:', error)
    return false
  }
}
