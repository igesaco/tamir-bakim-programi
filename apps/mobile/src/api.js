const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  'https://tamir-bakim-api.onrender.com'
).replace(/\/+$/, '');

export async function apiRequest(
  path,
  {
    method = 'GET',
    token,
    body,
  } = {},
) {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type':
          'application/json',
        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      },
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    },
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message ||
          'İşlem başarısız oldu.';

    const error =
      new Error(message);

    error.status =
      response.status;

    throw error;
  }

  return data;
}

export { API_URL };
