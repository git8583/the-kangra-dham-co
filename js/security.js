(function () {
    'use strict';

    function secureExternalLinks() {
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            link.setAttribute('rel', 'noopener noreferrer');
        });
    }

    function addHoneypot(form) {
        if (form.elements.website_url_hp) return;
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'website_url_hp';
        input.tabIndex = -1;
        input.autocomplete = 'off';
        input.setAttribute('aria-hidden', 'true');
        input.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
        form.appendChild(input);
    }

    function showStatus(form, message, isError) {
        let status = form.querySelector('.form-status');
        if (!status) {
            status = document.createElement('p');
            status.className = 'form-status';
            status.setAttribute('role', 'status');
            status.style.marginTop = '0.75rem';
            form.appendChild(status);
        }
        status.textContent = message;
        status.style.color = isError ? '#b42318' : '#2C5E3B';
    }

    async function submitEnquiry(form) {
        const type = form.id === 'cateringForm' ? 'catering' : 'contact';
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Sending…';

        try {
            const payload = Object.fromEntries(new FormData(form).entries());
            const response = await fetch(`api/enquiries/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to send your enquiry.');
            form.reset();
            showStatus(form, result.message, false);
            button.textContent = '✓ Sent';
        } catch (error) {
            showStatus(form, error.message, true);
            button.textContent = originalText;
        } finally {
            setTimeout(() => {
                button.disabled = false;
                button.textContent = originalText;
            }, 2000);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        secureExternalLinks();
        ['contactForm', 'cateringForm'].forEach(id => {
            const form = document.getElementById(id);
            if (!form) return;
            addHoneypot(form);
            form.addEventListener('submit', event => {
                event.preventDefault();
                if (form.reportValidity()) submitEnquiry(form);
            });
        });
    });
})();
