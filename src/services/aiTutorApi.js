export async function sendTutorMessage(payload, fetchImpl = fetch) {
  let response;
  try {
    response = await fetchImpl('/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Nie udało się połączyć z backendem aplikacji. Sprawdź, czy serwer działa.');
  }

  let data;
  try { data = await response.json(); }
  catch { throw new Error('Backend zwrócił nieczytelną odpowiedź.'); }
  if (!response.ok || data?.ok !== true) throw new Error(data?.message || 'Nie udało się uzyskać odpowiedzi.');
  return data;
}
