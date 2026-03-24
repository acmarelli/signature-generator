// Signature Generator Engine
(function () {
  let config = null;
  let formData = {};

  // Load config and initialize
  async function init() {
    try {
      const resp = await fetch('config.json');
      config = await resp.json();
      applyTheme(config.colors);
      renderForm(config);
      renderPreview();
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  }

  // Apply CSS custom properties from config colors
  function applyTheme(colors) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--text-color', colors.text);
    root.style.setProperty('--accent-color', colors.accent);
    root.style.setProperty('--secondary-color', colors.secondary);
  }

  // Build form fields from config
  function renderForm(cfg) {
    const container = document.getElementById('form-fields');
    container.innerHTML = '';

    cfg.fields.forEach(field => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = field.label + (field.required ? ' *' : '');
      label.setAttribute('for', field.id);
      group.appendChild(label);

      let input;
      if (field.type === 'select') {
        input = document.createElement('select');
        const options = field.options === 'locations' ? cfg.locations : field.options;
        options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
        formData[field.id] = options[0]; // default to first
      } else {
        input = document.createElement('input');
        input.type = 'text';
        if (field.placeholder) input.placeholder = field.placeholder;
      }

      input.id = field.id;
      input.name = field.id;

      input.addEventListener('input', (e) => {
        formData[field.id] = e.target.value;
        renderPreview();
      });

      if (field.type === 'select') {
        input.addEventListener('change', (e) => {
          formData[field.id] = e.target.value;
          renderPreview();
        });
      }

      group.appendChild(input);
      container.appendChild(group);
    });
  }

  // Generate signature HTML based on template
  function generateSignatureHTML() {
    const template = config.template || 'default';
    if (templates[template]) {
      return templates[template](config, formData);
    }
    return templates.default(config, formData);
  }

  // Render preview
  function renderPreview() {
    const preview = document.getElementById('signature-preview');
    preview.innerHTML = generateSignatureHTML();
  }

  // Copy signature to clipboard as rich HTML
  async function copyToClipboard() {
    const html = generateSignatureHTML();
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([item]);
      showToast('Signature copied to clipboard!');
    } catch (e) {
      // Fallback: copy via textarea for plain text
      const temp = document.createElement('textarea');
      temp.value = html;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      showToast('Signature HTML copied!');
    }
  }

  // Download as HTML file
  function downloadHTML() {
    const html = generateSignatureHTML();
    const fullHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Email Signature</title></head>
<body>
${html}
</body>
</html>`;
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = formData.fullName || 'signature';
    a.download = `${name.replace(/\s+/g, '-')}-signature.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Signature downloaded!');
  }

  // Toast notification
  function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // Instruction tabs
  function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });
  }

  // ─── Signature Templates ────────────────────────────

  const templates = {
    // Sesma law firm template
    sesma: function (cfg, data) {
      const name = data.fullName || 'Full Name';
      const title = data.jobTitle || 'Job Title';
      const phone = data.phone || '';
      const email = data.email || 'email@sesmalaw.com.mx';
      const primaryCity = data.primaryCity || cfg.locations[0];
      const website = cfg.website;
      const logoPath = cfg.logo;

      const locationHTML = cfg.locations.map(loc => {
        if (loc === primaryCity) {
          return `<span style="color:${cfg.colors.primary};font-weight:bold;">${loc}</span>`;
        }
        return `<span>${loc}</span>`;
      }).join(' <span style="color:#999;margin:0 2px;">&middot;</span> ');

      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${cfg.colors.text};line-height:1.5;">
  <tr><td colspan="2" style="border-top:2px solid ${cfg.colors.accent};padding-bottom:12px;"></td></tr>
  <tr>
    <td style="vertical-align:top;padding-right:18px;width:110px;">
      <img src="${logoPath}" alt="${cfg.company}" style="width:100px;height:auto;" />
    </td>
    <td style="vertical-align:top;">
      <div style="font-size:16px;font-weight:bold;color:${cfg.colors.text};margin-bottom:1px;">${name}</div>
      <div style="font-size:13px;color:${cfg.colors.secondary};margin-bottom:8px;">${title}</div>
      <div style="font-size:12px;color:${cfg.colors.secondary};margin-bottom:3px;">${locationHTML}</div>
      ${phone ? `<div style="font-size:12px;color:${cfg.colors.secondary};margin-bottom:2px;">T. ${phone}</div>` : ''}
      <div style="margin-bottom:2px;"><a href="mailto:${email}" style="font-size:12px;color:${cfg.colors.primary};text-decoration:none;">${email}</a></div>
      <div><a href="https://${website}" style="font-size:12px;color:${cfg.colors.secondary};text-decoration:none;">${website}</a></div>
    </td>
  </tr>
</table>`;
    },

    // Alom infrastructure template
    alom: function (cfg, data) {
      const name = data.fullName || 'Full Name';
      const title = data.jobTitle || '';
      const email = data.email || 'email@alominfra.com';
      const phoneOffice = data.phoneOffice || '';
      const phoneDirect = data.phoneDirect || '';
      const website = cfg.website;
      const logoPath = cfg.logo;

      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${cfg.colors.text};line-height:1.5;">
  <tr>
    <td style="vertical-align:middle;padding-right:14px;border-right:2px solid ${cfg.colors.primary};">
      <img src="${logoPath}" alt="${cfg.company}" style="width:120px;height:auto;" />
    </td>
    <td style="vertical-align:top;padding-left:14px;">
      <div style="font-size:15px;font-weight:bold;color:${cfg.colors.text};margin-bottom:1px;">${name}</div>
      ${title ? `<div style="font-size:12px;color:${cfg.colors.secondary};margin-bottom:4px;">${title}</div>` : ''}
      <div style="margin-bottom:1px;"><a href="mailto:${email}" style="font-size:12px;color:${cfg.colors.primary};text-decoration:none;">${email}</a></div>
      <div><a href="https://${website}" style="font-size:12px;color:${cfg.colors.primary};text-decoration:none;font-weight:bold;">${website}</a></div>
    </td>
  </tr>
  ${(phoneOffice || phoneDirect) ? `<tr>
    <td colspan="2" style="padding-top:8px;">
      ${phoneOffice ? `<div style="font-size:12px;color:${cfg.colors.secondary};">T: ${phoneOffice}</div>` : ''}
      ${phoneDirect ? `<div style="font-size:12px;color:${cfg.colors.secondary};">D: <a href="tel:${phoneDirect.replace(/\s/g,'')}" style="color:${cfg.colors.primary};text-decoration:none;">${phoneDirect}</a></div>` : ''}
    </td>
  </tr>` : ''}
</table>`;
    },

    // MIBP law firm template
    mibp: function (cfg, data) {
      const name = data.fullName || 'Full Name';
      const title = data.jobTitle || cfg.company;
      const phone = data.phone || '';
      const email = data.email || 'email@mibp.com.mx';
      const website = cfg.website;
      const logoPath = cfg.logo;
      const linkColor = cfg.colors.links || cfg.colors.primary;

      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${cfg.colors.text};line-height:1.6;">
  <tr>
    <td style="vertical-align:top;padding-right:18px;width:90px;">
      <img src="${logoPath}" alt="${cfg.companyShort || cfg.company}" style="width:80px;height:auto;" />
    </td>
    <td style="vertical-align:top;">
      <div style="font-size:15px;font-weight:bold;color:${cfg.colors.primary};margin-bottom:1px;">${name}</div>
      <div style="font-size:13px;color:${cfg.colors.secondary};margin-bottom:4px;">${title}</div>
      ${phone ? `<div style="margin-bottom:2px;"><a href="tel:${phone.replace(/\s/g,'')}" style="font-size:13px;color:${linkColor};text-decoration:none;">${phone}</a></div>` : ''}
      <div style="margin-bottom:2px;"><a href="mailto:${email}" style="font-size:13px;color:${linkColor};text-decoration:none;">${email}</a></div>
      <div><a href="https://${website}" style="font-size:13px;color:${linkColor};text-decoration:none;">${website}</a></div>
    </td>
  </tr>
</table>`;
    },

    // Generic default template
    default: function (cfg, data) {
      const name = data.fullName || 'Full Name';
      const title = data.jobTitle || 'Job Title';
      const phone = data.phone || '';
      const email = data.email || 'email@company.com';
      const website = cfg.website || '';

      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${cfg.colors.text};line-height:1.5;">
  <tr><td style="border-top:2px solid ${cfg.colors.accent};padding-bottom:10px;"></td></tr>
  <tr>
    <td>
      <div style="font-size:16px;font-weight:bold;margin-bottom:2px;">${name}</div>
      <div style="font-size:13px;color:${cfg.colors.secondary};margin-bottom:6px;">${title} | ${cfg.company}</div>
      ${phone ? `<div style="font-size:12px;color:${cfg.colors.secondary};">T. ${phone}</div>` : ''}
      <div><a href="mailto:${email}" style="font-size:12px;color:${cfg.colors.primary};text-decoration:none;">${email}</a></div>
      ${website ? `<div><a href="https://${website}" style="font-size:12px;color:${cfg.colors.secondary};text-decoration:none;">${website}</a></div>` : ''}
    </td>
  </tr>
</table>`;
    }
  };

  // ─── Expose globals ─────────────────────────────────
  window.SignatureApp = { init, copyToClipboard, downloadHTML, initTabs };

  // Auto-init on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    init();
    initTabs();
  });
})();
