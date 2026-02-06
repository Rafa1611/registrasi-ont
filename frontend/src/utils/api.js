/**
 * API Helper untuk authenticated requests
 */

export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  return response;
};

export const apiGet = (url) => apiRequest(url);

export const apiPost = (url, data) => 
  apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiPut = (url, data) => 
  apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiDelete = (url) => 
  apiRequest(url, {
    method: 'DELETE',
  });
