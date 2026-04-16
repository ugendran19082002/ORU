import { Redirect } from 'expo-router';

export default function AdminIndex() {
  // Explicitly redirect to the tabs subgroup. 
  // Using 'as any' to bypass strict Href types which can be inconsistent with nested route groups.
  return <Redirect href={'/admin/(tabs)' as any} />;
}
