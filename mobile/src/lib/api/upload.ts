import type { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";

type WebImagePickerAsset = ImagePickerAsset & {
  file?: Blob | null;
};

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
  const mimeType = asset.mimeType || "image/jpeg";
  const fileName = asset.fileName || `${fallbackBaseName}.${getFallbackExtension(mimeType)}`;

  if (Platform.OS === "web") {
    const webAsset = asset as WebImagePickerAsset;
    const existingFile = webAsset.file as Blob | undefined;
    let blob: Blob;

    if (existingFile) {
      blob = existingFile;
    } else {
      blob = await fetch(asset.uri).then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to read the selected image for upload.");
        }

        return response.blob();
      });
    }

    formData.append(fieldName, blob, fileName);
    return;
  }

  formData.append(fieldName, {
    uri: asset.uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob, fileName);
}
