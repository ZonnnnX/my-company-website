# Private Company Website (Static)

A lightweight single-page private website template.

**Important:** This template is **front-end only** access control (client-side). Anyone can view the HTML/JS source unless you also add server-side authentication or restrict access at the hosting layer.

## How to run
Just open `index.html` in a browser.

- Windows: double-click `index.html`
- Or: open it with your preferred browser

## Private access (demo gate)
This template includes a **client-side** access-code gate using `sessionStorage`.

### 1) Set the access code
Edit this line in `index.html`:

```js
const ACCESS_CODE = "1234";
```

### 2) Understand how “privacy” works here
- Passing the code stores a flag in **this browser session** only (session-based).
- Closing the tab/window (or starting a new session) will require unlocking again.

### Recommended real security
For actual privacy, deploy behind **server-side authentication** (recommended) or restrict access at the hosting layer (VPN, IP allowlist, private hosting, etc.).

## Customize content
Replace placeholder copy directly inside `private-company-website/index.html`:

- **Hero text** (top section)
- **Quick facts**: `[Your industry]`, `[City, Country]`
- **Announcements**: `[Date]`, `[Details]`
- Sections: **About / Services / Team / Contact**

## Gate UX (built in)
The unlock gate includes:
- Clear error messages
- Lightweight attempt throttling (still not real security)
- A way to “re-lock” after viewing (logout / re-lock)

## Update contact email
Edit the mail link in the Contact section:

```html
<a class="btn primary" href="mailto:hello@company.com">hello@company.com</a>
```

Replace `hello@company.com` with your internal contact.

