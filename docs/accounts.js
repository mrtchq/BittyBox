document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const userTierDisplay = document.getElementById('user-tier-display');
  const keysCountDisplay = document.getElementById('keys-count-display');
  const linksCountDisplay = document.getElementById('links-count-display');
  const keysListContainer = document.getElementById('keys-list-container');
  const linksListContainer = document.getElementById('links-list-container');

  const openNewKeyModalBtn = document.getElementById('open-new-key-modal-btn');
  const newKeyModal = document.getElementById('new-key-modal');
  const closeNewKeyModal = document.getElementById('close-new-key-modal');
  const cancelNewKeyBtn = document.getElementById('cancel-new-key-btn');
  const newKeyForm = document.getElementById('new-key-form');
  const keyLabelInput = document.getElementById('key-label-input');
  const scopeCreate = document.getElementById('scope-create');
  const scopeRead = document.getElementById('scope-read');

  const keyCreatedModal = document.getElementById('key-created-modal');
  const revealedApiKey = document.getElementById('revealed-api-key');
  const copyRevealedKeyBtn = document.getElementById('copy-revealed-key-btn');
  const doneRevealedKeyBtn = document.getElementById('done-revealed-key-btn');

  const switchUserBtn = document.getElementById('switch-user-btn');
  const switchUserModal = document.getElementById('switch-user-modal');
  const closeSwitchModal = document.getElementById('close-switch-modal');
  const cancelSwitchBtn = document.getElementById('cancel-switch-btn');
  const switchUserForm = document.getElementById('switch-user-form');
  const loginEmailInput = document.getElementById('login-email-input');
  const loginNameInput = document.getElementById('login-name-input');

  const clearHistoryBtn = document.getElementById('clear-history-btn');

  let currentUser = null;

  // Fetch and Load Account Data
  async function loadAccountData() {
    try {
      const res = await fetch('/api/accounts/me');
      const data = await res.json();

      if (data && data.success && data.user) {
        currentUser = data.user;
        renderAccountState();
      }
    } catch (err) {
      console.error('Error loading account:', err);
    }
  }

  function renderAccountState() {
    if (!currentUser) return;

    if (userTierDisplay) {
      userTierDisplay.innerText = (currentUser.tier || 'PRO').toUpperCase() + ' • ' + (currentUser.displayName || currentUser.email);
    }

    const keys = currentUser.apiKeys || [];
    if (keysCountDisplay) {
      keysCountDisplay.innerText = keys.length;
    }

    // Render Keys List
    if (keys.length === 0) {
      keysListContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-dim);">
          No API keys created yet. Click <strong>Generate New API Key</strong> above to create one.
        </div>
      `;
    } else {
      keysListContainer.innerHTML = keys.map(key => `
        <div class="key-item-card" data-key-id="${key.id}">
          <div class="key-meta-left">
            <div class="key-label-text">${escapeHtml(key.label || 'API Key')}</div>
            <div class="key-prefix-code">${escapeHtml(key.prefix)}••••••••</div>
            <div class="key-date">Created on ${new Date(key.createdAt).toLocaleDateString()} &bull; Scopes: ${(key.scopes || ['all']).join(', ')}</div>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button class="neu-btn neu-btn-danger revoke-key-btn" data-id="${key.id}" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
              Revoke
            </button>
          </div>
        </div>
      `).join('');

      // Wire revoke buttons
      document.querySelectorAll('.revoke-key-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const keyId = e.currentTarget.getAttribute('data-id');
          if (confirm('Are you sure you want to revoke this API key? Any applications or AI agents using it will immediately lose access.')) {
            await revokeKey(keyId);
          }
        });
      });

      // Update snippet placeholder with active key prefix if available
      const placeholders = document.querySelectorAll('.active-key-placeholder');
      if (keys.length > 0) {
        placeholders.forEach(el => {
          el.innerText = keys[0].prefix + '••••••••';
        });
      }
    }

    // Render Link History
    renderLinksHistory();
  }

  function renderLinksHistory() {
    const localLinks = JSON.parse(localStorage.getItem('bittybox_history') || '[]');
    const serverLinks = currentUser?.linkHistory || [];
    
    // Merge local and server links by URL uniqueness
    const mergedMap = new Map();
    localLinks.forEach(l => mergedMap.set(l.url, l));
    serverLinks.forEach(l => {
      if (!mergedMap.has(l.url)) {
        mergedMap.set(l.url, {
          url: l.url,
          title: l.title || 'API Capsule',
          format: l.format || 'html',
          created: l.createdAt || new Date().toISOString(),
          byteLength: l.byteLength || l.url.length
        });
      }
    });

    const allLinks = Array.from(mergedMap.values()).sort((a, b) => new Date(b.created) - new Date(a.created));

    if (linksCountDisplay) {
      linksCountDisplay.innerText = allLinks.length;
    }

    if (allLinks.length === 0) {
      linksListContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-dim);">
          No capsules recorded in history. Generate a link in the <a href="/edit" style="color: var(--accent-gold);">editor</a> or via the API!
        </div>
      `;
    } else {
      linksListContainer.innerHTML = allLinks.map((link, idx) => `
        <div class="link-item-card">
          <div>
            <div class="link-title">
              <span class="format-badge">${escapeHtml((link.format || 'HTML').toUpperCase())}</span>
              <span>${escapeHtml(link.title || 'Untitled Capsule')}</span>
              <span style="font-size: 0.75rem; color: var(--text-dim); font-weight: normal;">(${link.byteLength || link.url.length} bytes)</span>
            </div>
            <div class="link-url-text">${escapeHtml(link.url)}</div>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button class="neu-btn copy-link-btn" data-url="${escapeHtml(link.url)}" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
              Copy Link
            </button>
            <a href="${escapeHtml(link.url)}" target="_blank" class="neu-btn neu-btn-primary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; text-decoration: none;">
              Open
            </a>
          </div>
        </div>
      `).join('');

      // Wire copy link buttons
      document.querySelectorAll('.copy-link-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const url = e.currentTarget.getAttribute('data-url');
          navigator.clipboard.writeText(url).then(() => {
            const originalText = btn.innerText;
            btn.innerText = 'Copied!';
            setTimeout(() => { btn.innerText = originalText; }, 2000);
          });
        });
      });
    }
  }

  // Generate Key Form
  newKeyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const label = (keyLabelInput.value || '').trim();
    if (!label) return;

    const scopes = [];
    if (scopeCreate.checked) scopes.push('bitty:create');
    if (scopeRead.checked) scopes.push('bitty:read');

    try {
      const res = await fetch('/api/accounts/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, scopes })
      });
      const data = await res.json();

      if (data && data.success && data.key) {
        newKeyModal.style.display = 'none';
        keyLabelInput.value = '';

        // Show revealed key modal
        revealedApiKey.innerText = data.key.rawKey;
        keyCreatedModal.style.display = 'flex';

        // Reload user info
        await loadAccountData();
      } else {
        alert('Error creating API key: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  });

  // Revoke Key
  async function revokeKey(keyId) {
    try {
      const res = await fetch(`/api/accounts/keys/${keyId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data && data.success) {
        await loadAccountData();
      } else {
        alert('Failed to revoke key: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error revoking key: ' + err.message);
    }
  }

  // Switch User Form
  switchUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (loginEmailInput.value || '').trim();
    const displayName = (loginNameInput.value || '').trim();
    if (!email) return;

    try {
      const res = await fetch('/api/accounts/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName })
      });
      const data = await res.json();
      if (data && data.success) {
        switchUserModal.style.display = 'none';
        currentUser = data.user;
        renderAccountState();
      }
    } catch (err) {
      alert('Error switching user: ' + err.message);
    }
  });

  // Modal Triggers
  openNewKeyModalBtn.addEventListener('click', () => { newKeyModal.style.display = 'flex'; keyLabelInput.focus(); });
  closeNewKeyModal.addEventListener('click', () => { newKeyModal.style.display = 'none'; });
  cancelNewKeyBtn.addEventListener('click', () => { newKeyModal.style.display = 'none'; });

  switchUserBtn.addEventListener('click', () => { switchUserModal.style.display = 'flex'; loginEmailInput.focus(); });
  closeSwitchModal.addEventListener('click', () => { switchUserModal.style.display = 'none'; });
  cancelSwitchBtn.addEventListener('click', () => { switchUserModal.style.display = 'none'; });

  copyRevealedKeyBtn.addEventListener('click', () => {
    const key = revealedApiKey.innerText;
    navigator.clipboard.writeText(key).then(() => {
      copyRevealedKeyBtn.innerText = 'Copied!';
      setTimeout(() => { copyRevealedKeyBtn.innerText = 'Copy Key'; }, 2000);
    });
  });

  doneRevealedKeyBtn.addEventListener('click', () => {
    keyCreatedModal.style.display = 'none';
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear local capsule history on this device?')) {
      localStorage.removeItem('bittybox_history');
      renderLinksHistory();
    }
  });

  // Code Tab Switching
  document.querySelectorAll('.code-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.code-tab-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const tab = e.currentTarget.getAttribute('data-tab');
      ['mcp', 'curl', 'js', 'python'].forEach(t => {
        const el = document.getElementById(`code-content-${t}`);
        if (el) el.style.display = (t === tab) ? 'block' : 'none';
      });
    });
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Initial Load
  loadAccountData();
});
