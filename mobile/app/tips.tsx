// Register the Expo Router entry for the tips route.
import { Redirect } from "expo-router";

export default function TipsRoute() {
  return <Redirect href="/quicktip" />;
}
