(function () {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('contact-message-status');
    if (!form || !status || typeof fetch !== 'function' || typeof FormData !== 'function' || typeof AbortController !== 'function') return;

    let sending = false;
    const uncertain = 'We could not confirm whether your message was accepted. Your text is still here. Sending again may create a duplicate.';

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (sending || !form.reportValidity()) return;
        sending = true;

        const controls = Array.from(form.querySelectorAll('input, textarea, button, select'));
        const disabled = controls.map(control => control.disabled);
        const button = form.querySelector('button[type="submit"]');
        const label = button.textContent;
        let timer;

        try {
            const body = new FormData(form);
            controls.forEach(control => { control.disabled = true; });
            form.setAttribute('aria-busy', 'true');
            button.textContent = 'Sending...';
            status.textContent = 'Sending your message...';
            status.style.color = '';

            const controller = new AbortController();
            timer = setTimeout(() => controller.abort(), 20000);
            const response = await fetch(form.action, {
                method: 'POST',
                body,
                headers: { Accept: 'application/json' },
                signal: controller.signal
            });
            const data = await response.json().catch(() => null);
            const errors = data && Array.isArray(data.errors)
                ? data.errors.filter(error => error && typeof error.message === 'string').map(error => error.message)
                : [];
            if (data && typeof data.error === 'string' && data.error) errors.push(data.error);

            const confirmed = data && typeof data.next === 'string'
                && data.error === undefined
                && (data.errors === undefined || (Array.isArray(data.errors) && data.errors.length === 0));
            if (response.ok && confirmed) {
                form.reset();
                status.textContent = 'Formspree accepted your message. Thank you.';
                status.style.color = 'var(--success)';
            } else {
                status.textContent = errors.length
                    ? errors.join(' ') + ' Your message is still here. Review it before trying again.'
                    : response.ok ? uncertain : 'The form service reported an error. Your text is still here. Please try again later.';
                status.style.color = 'var(--danger, #c0392b)';
            }
        } catch (error) {
            status.textContent = uncertain;
            status.style.color = 'var(--danger, #c0392b)';
        } finally {
            clearTimeout(timer);
            controls.forEach((control, index) => { control.disabled = disabled[index]; });
            form.removeAttribute('aria-busy');
            button.textContent = label;
            sending = false;
            status.focus();
        }
    });
}());
