/**
 * Verification Page HTML (Inline Version)
 * Supports bilingual (English/Chinese)
 */
import { getMessages, type Language } from '../i18n';

/**
 * Get verification page HTML for specified language
 * @param lang - Language code ('en' or 'zh')
 * @param siteKey - Cloudflare Turnstile site key
 * @returns HTML string
 */
export function getVerifyInlineHtml(lang: Language, siteKey: string): string {
  const m = getMessages(lang);
  const htmlLang = lang === 'zh' ? 'zh-CN' : 'en';
  
  return `
<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${m.html.pageTitle}</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    h1 { color: #333; font-size: 28px; margin-bottom: 10px; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    p { color: #666; margin-bottom: 30px; line-height: 1.6; }
    .cf-turnstile { margin: 0 auto 20px; }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      width: 100%;
    }
    button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
    button:active { transform: translateY(0); }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }
    .message {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
      display: none;
    }
    .message.success { background: #d4edda; color: #155724; display: block; }
    .message.error { background: #f8d7da; color: #721c24; display: block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔒</div>
    <h1>${m.html.pageHeading}</h1>
    <p>${m.html.pageDescription}</p>
    
    <div class="cf-turnstile" data-sitekey="${siteKey}" data-callback="onTurnstileSuccess"></div>
    
    <button id="submitBtn" onclick="submitVerification()" disabled>
      ${m.html.submitButton}
    </button>
    
    <div id="message" class="message"></div>
  </div>

  <script>
    let turnstileToken = null;
    
    const messages = {
      noToken: "${m.html.errorNoToken}",
      loading: "${m.html.submitButtonLoading}",
      retry: "${m.html.submitButtonRetry}",
      success: "${m.html.successMessage}",
      verifyFailed: "${m.html.errorVerifyFailed}",
      networkError: "${m.html.errorNetwork}"
    };
    
    function onTurnstileSuccess(token) {
      turnstileToken = token;
      document.getElementById('submitBtn').disabled = false;
    }
    
    async function submitVerification() {
      if (!turnstileToken) {
        showMessage(messages.noToken, 'error');
        return;
      }
      
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = messages.loading;
      
      try {
        const response = await fetch(window.location.pathname, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken })
        });
        
        const result = await response.json();
        
        if (result.success) {
          showMessage(messages.success, 'success');
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          showMessage('❌ ' + (result.error || messages.verifyFailed), 'error');
          btn.disabled = false;
          btn.textContent = messages.retry;
          turnstileToken = null;
          if (window.turnstile) window.turnstile.reset();
        }
      } catch (error) {
        showMessage('❌ ' + messages.networkError, 'error');
        btn.disabled = false;
        btn.textContent = messages.retry;
      }
    }
    
    function showMessage(text, type) {
      const msgDiv = document.getElementById('message');
      msgDiv.textContent = text;
      msgDiv.className = 'message ' + type;
    }
  </script>
</body>
</html>
`;
}

/**
 * @deprecated Use getVerifyInlineHtml(lang, siteKey) instead
 * Kept for backward compatibility, defaults to Chinese
 */
export const verifyInlineHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Human Verification - Telegram Bot</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    h1 { color: #333; font-size: 28px; margin-bottom: 10px; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    p { color: #666; margin-bottom: 30px; line-height: 1.6; }
    .cf-turnstile { margin: 0 auto 20px; }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      width: 100%;
    }
    button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
    button:active { transform: translateY(0); }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }
    .message {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
      display: none;
    }
    .message.success { background: #d4edda; color: #155724; display: block; }
    .message.error { background: #f8d7da; color: #721c24; display: block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔒</div>
    <h1>Human Verification</h1>
    <p>First-time users need to complete human verification before using the bot.</p>
    
    <div class="cf-turnstile" data-sitekey="{{SITE_KEY}}" data-callback="onTurnstileSuccess"></div>
    
    <button id="submitBtn" onclick="submitVerification()" disabled>
      Complete Verification
    </button>
    
    <div id="message" class="message"></div>
  </div>

  <script>
    let turnstileToken = null;
    
    function onTurnstileSuccess(token) {
      turnstileToken = token;
      document.getElementById('submitBtn').disabled = false;
    }
    
    async function submitVerification() {
      if (!turnstileToken) {
        showMessage('Please complete human verification first', 'error');
        return;
      }
      
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      
      try {
        const response = await fetch(window.location.pathname, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken })
        });
        
        const result = await response.json();
        
        if (result.success) {
          showMessage('✅ Verification successful! Redirecting...', 'success');
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          showMessage('❌ ' + (result.error || 'Verification failed, please try again'), 'error');
          btn.disabled = false;
          btn.textContent = 'Retry';
          turnstileToken = null;
          if (window.turnstile) window.turnstile.reset();
        }
      } catch (error) {
        showMessage('❌ Network error, please check your connection and try again', 'error');
        btn.disabled = false;
        btn.textContent = 'Retry';
      }
    }
    
    function showMessage(text, type) {
      const msgDiv = document.getElementById('message');
      msgDiv.textContent = text;
      msgDiv.className = 'message ' + type;
    }
  </script>
</body>
</html>
`;
