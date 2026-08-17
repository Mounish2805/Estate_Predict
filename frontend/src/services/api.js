import { API } from '../utils/constants';

async function parseResponse(res, defaultError = 'Request failed.') {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || defaultError);
    }
    return data;
  }
  if (!res.ok) {
    throw new Error(`${defaultError} (Server error: HTTP ${res.status})`);
  }
  throw new Error(`${defaultError} (Invalid response format from server)`);
}

export const authService = {
  async getCurrentUser() {
    try {
      const res = await fetch(`${API}/auth/user/`, { credentials: 'include' });
      return await parseResponse(res, 'Failed to fetch user session.');
    } catch {
      return { authenticated: false };
    }
  },

  async login(email, password) {
    const res = await fetch(`${API}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return parseResponse(res, 'Login failed.');
  },

  async register(username, email, password) {
    const res = await fetch(`${API}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password })
    });
    return parseResponse(res, 'Registration failed.');
  },

  async logout() {
    return fetch(`${API}/auth/logout/`, {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {});
  }
};

export const predictionService = {
  async predictPrice(payload) {
    const res = await fetch(`${API}/predict/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return parseResponse(res, 'Prediction failed.');
  }
};

export const valuationService = {
  async getValuations() {
    const res = await fetch(`${API}/predictions/`, { credentials: 'include' });
    const data = await parseResponse(res, 'Failed to load valuation history.');
    return data.predictions || [];
  },

  async toggleStar(predictionId, isStarred) {
    const res = await fetch(`${API}/predictions/${predictionId}/star/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_starred: isStarred })
    });
    return parseResponse(res, 'Failed to update star bookmark.');
  },

  async deleteValuation(predictionId) {
    const res = await fetch(`${API}/predictions/${predictionId}/`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete valuation.');
      }
      throw new Error(`Failed to delete valuation (HTTP ${res.status}).`);
    }
    return true;
  },

  async downloadPredictionPdf(predictionId) {
    const res = await fetch(`${API}/predictions/${predictionId}/download/`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to download prediction report.');
      }
      throw new Error(`Failed to download prediction report (HTTP ${res.status}).`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EstatePredict_Prediction_${predictionId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  async sendPredictionEmail(predictionId) {
    const res = await fetch(`${API}/predictions/${predictionId}/email/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return parseResponse(res, 'Failed to send prediction report to email.');
  }
};

export const marketService = {
  async getPriceInsights() {
    const res = await fetch(`${API}/price-insights/`, { credentials: 'include' });
    return parseResponse(res, 'Failed to load price insights.');
  },

  async getLocalityInsights(localityName) {
    const res = await fetch(`${API}/price-insights/${encodeURIComponent(localityName)}/`, {
      credentials: 'include'
    });
    return parseResponse(res, 'Failed to load locality insights.');
  }
};

export const localityService = {
  async getLocalities() {
    const res = await fetch(`${API}/localities/`, { credentials: 'include' });
    const data = await parseResponse(res, 'Failed to load localities directory.');
    return data.localities || [];
  },

  async getLocalityDetail(localityName) {
    const res = await fetch(`${API}/localities/${encodeURIComponent(localityName)}/`, {
      credentials: 'include'
    });
    return parseResponse(res, 'Failed to load locality details.');
  }
};

export const adminService = {
  async checkAdminAccess() {
    const res = await fetch(`${API}/admin/check/`, { credentials: 'include' });
    return parseResponse(res, 'Admin verification failed.');
  },

  async getModelMetrics() {
    const res = await fetch(`${API}/admin/model-metrics/`, { credentials: 'include' });
    return parseResponse(res, 'Failed to fetch model evaluation metrics.');
  },

  async getUsers() {
    const res = await fetch(`${API}/admin/users/`, { credentials: 'include' });
    return parseResponse(res, 'Failed to load user records.');
  },

  async getPredictions() {
    const res = await fetch(`${API}/admin/predictions/`, { credentials: 'include' });
    return parseResponse(res, 'Failed to load prediction activity records.');
  }
};




