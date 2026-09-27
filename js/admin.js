(function () {
    'use strict';

    let csrfToken = '';
    let menuState = null;
    let overrideState = null;
    let selectedDay = 0;
    let hasUnsavedChanges = false;

    const loginCard = document.getElementById('loginCard');
    const adminApp = document.getElementById('adminApp');
    const loginMessage = document.getElementById('loginMessage');
    const globalMessage = document.getElementById('globalMessage');
    const daySelect = document.getElementById('daySelect');
    const overrideSelect = document.getElementById('overrideSelect');
    const menuForm = document.getElementById('menuForm');

    async function api(url, options = {}) {
        const headers = { Accept: 'application/json', ...(options.headers || {}) };
        if (csrfToken && options.method && options.method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
        const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
        if (response.status === 204) return null;
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Request failed.');
        return data;
    }

    function showApp() {
        loginCard.hidden = true;
        adminApp.hidden = false;
    }

    function fillEditor(resetDirty = false) {
        const item = menuState.daily[selectedDay];
        ['title', 'price', 'madra', 'khatta', 'note', 'emoji', 'image'].forEach(key => {
            menuForm.elements[key].value = item[key] || '';
        });
        menuForm.elements.highlight.checked = Boolean(item.highlight);
        if (resetDirty) hasUnsavedChanges = false;
    }

    function updateCurrentDay() {
        const item = menuState.daily[selectedDay];
        ['title', 'price', 'madra', 'khatta', 'note', 'emoji', 'image'].forEach(key => {
            item[key] = menuForm.elements[key].value.trim() || (key === 'image' ? null : '');
        });
        item.highlight = menuForm.elements.highlight.checked;
    }

    async function loadData() {
        const [{ menu, override }, enquiries] = await Promise.all([
            api('api/menu'),
            api('api/admin/enquiries')
        ]);
        menuState = menu;
        overrideState = override;
        daySelect.innerHTML = '';
        overrideSelect.querySelectorAll('option:not(:first-child)').forEach(option => option.remove());
        menu.daily.forEach((item, index) => {
            daySelect.add(new Option(item.day, index));
            overrideSelect.add(new Option(item.day, index));
        });
        overrideSelect.value = override == null ? '' : String(override);
        fillEditor(true);
        renderEnquiries(enquiries);
    }

    function renderEnquiries(enquiries) {
        const rows = document.getElementById('enquiryRows');
        rows.textContent = '';
        if (!enquiries.length) {
            const row = rows.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6;
            cell.textContent = 'No enquiries yet.';
            return;
        }
        enquiries.forEach(enquiry => {
            const row = rows.insertRow();
            row.insertCell().textContent = new Date(`${enquiry.created_at}Z`).toLocaleString('en-IN');
            const customer = row.insertCell();
            customer.textContent = `${enquiry.name}\n${enquiry.email}\n${enquiry.phone || ''}`;
            customer.style.whiteSpace = 'pre-line';
            row.insertCell().textContent = enquiry.service || enquiry.subject || enquiry.type;
            row.insertCell().textContent = enquiry.message || `Guests: ${enquiry.guests || '—'}`;
            const statusCell = row.insertCell();
            const select = document.createElement('select');
            ['new', 'contacted', 'closed'].forEach(status => select.add(new Option(status, status)));
            select.value = enquiry.status;
            select.addEventListener('change', async () => {
                try {
                    await api(`api/admin/enquiries/${enquiry.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: select.value })
                    });
                } catch (error) {
                    globalMessage.textContent = error.message;
                }
            });
            statusCell.appendChild(select);
            const actionCell = row.insertCell();
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'btn btn-outline';
            removeButton.textContent = 'Delete';
            removeButton.addEventListener('click', async () => {
                if (!confirm(`Delete the enquiry from ${enquiry.name}? This cannot be undone.`)) return;
                try {
                    await api(`api/admin/enquiries/${enquiry.id}`, { method: 'DELETE' });
                    row.remove();
                    globalMessage.textContent = 'Enquiry deleted.';
                } catch (error) {
                    globalMessage.textContent = error.message;
                }
            });
            actionCell.appendChild(removeButton);
        });
    }

    document.getElementById('loginForm').addEventListener('submit', async event => {
        event.preventDefault();
        loginMessage.textContent = '';
        try {
            const result = await api('api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: document.getElementById('adminPassword').value })
            });
            csrfToken = result.csrfToken;
            showApp();
            await loadData();
        } catch (error) {
            loginMessage.textContent = error.message;
        }
    });

    daySelect.addEventListener('change', () => {
        updateCurrentDay();
        selectedDay = Number(daySelect.value);
        fillEditor();
    });

    menuForm.addEventListener('submit', async event => {
        event.preventDefault();
        updateCurrentDay();
        globalMessage.textContent = 'Saving…';
        try {
            await api('api/admin/menu', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu: menuState, override: overrideSelect.value === '' ? null : Number(overrideSelect.value) })
            });
            overrideState = overrideSelect.value === '' ? null : Number(overrideSelect.value);
            globalMessage.textContent = 'Menu saved.';
            hasUnsavedChanges = false;
        } catch (error) {
            globalMessage.textContent = error.message;
        }
    });

    menuForm.addEventListener('input', () => {
        hasUnsavedChanges = true;
    });
    overrideSelect.addEventListener('change', () => {
        hasUnsavedChanges = true;
    });

    document.getElementById('passwordForm').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const currentPassword = form.elements.currentPassword.value;
        const newPassword = form.elements.newPassword.value;
        if (newPassword !== form.elements.confirmPassword.value) {
            globalMessage.textContent = 'New password confirmation does not match.';
            form.elements.confirmPassword.focus();
            return;
        }
        globalMessage.textContent = 'Updating password…';
        try {
            await api('api/admin/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            form.reset();
            globalMessage.textContent = 'Admin password updated.';
        } catch (error) {
            globalMessage.textContent = error.message;
        }
    });

    window.addEventListener('beforeunload', event => {
        if (!hasUnsavedChanges) return;
        event.preventDefault();
        event.returnValue = '';
    });

    document.getElementById('logoutButton').addEventListener('click', async () => {
        await api('api/admin/logout', { method: 'POST' });
        location.reload();
    });

    api('api/admin/session').then(async session => {
        csrfToken = session.csrfToken;
        showApp();
        await loadData();
    }).catch(() => {});
})();
