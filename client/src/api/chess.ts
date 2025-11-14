export async function getPing() {
  const res = await fetch("http://localhost:8000/");
  if (!res.ok) throw new Error("Failed to get ping");
  const data = res.json();
  return data;
}
