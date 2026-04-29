import type { ImagePickerAsset } from "expo-image-picker";

function getFallbackExtension(mimeType?: string | null) {
  if (mimeType === "image/png") {
    return "png";
  }

  return "jpg";
}

export async function appendImageAsset(
  formData: FormData,
  fieldName: string,
  asset: ImagePickerAsset,
  fallbackBaseName: string,
) {
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const mimeType = asset.mimeType || blob.type || "image/jpeg";
  const normalizedBlob = blob.type === mimeType ? blob : blob.slice(0, blob.size, mimeType);
  const fileName = asset.fileName || `${fallbackBaseName}.${getFallbackExtension(mimeType)}`;

  formData.append(fieldName, normalizedBlob, fileName);
}
