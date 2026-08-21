import client from './client';

// Two-step upload: this gets a short-lived presigned S3 URL, then the
// caller does a plain PUT of the raw file bytes directly to that URL
// (not through our backend — straight to S3). publicUrl is what gets
// saved as the deal's photo_url afterward.
export async function getUploadUrl(contentType) {
  const { data } = await client.post('/upload', { contentType });
  return data; // { uploadUrl, publicUrl }
}

export async function uploadFileToS3(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error('Upload to S3 failed');
  }
}