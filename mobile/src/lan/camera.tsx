import { CameraView, Camera } from 'expo-camera';

export const lanCamera = {
  async request() {
    const permission = await Camera.getCameraPermissionsAsync();
    const next = permission.granted || !permission.canAskAgain ? permission : await Camera.requestCameraPermissionsAsync();
    return { granted: next.granted, canAskAgain: next.canAskAgain };
  },
  View: CameraView,
};
