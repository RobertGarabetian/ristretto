import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to coffee shops screen by default
  return <Redirect href="/coffee-shops" />;
}
