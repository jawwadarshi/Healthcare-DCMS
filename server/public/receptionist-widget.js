(function () {
    "use strict";

    var API_URL = window.RECEPTIONIST_API_URL || "http://localhost:5005";
    var CLINIC_NAME = window.RECEPTIONIST_CLINIC_NAME || "Dental Clinic";
    var SESSION_ID = generateSessionId();

    function generateSessionId() {
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var result = "";
        for (var i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result + "_" + Date.now();
    }

    // --- Inject styles ---
    var style = document.createElement("style");
    style.textContent =
        "#rc-widget * { box-sizing: border-box; margin: 0; padding: 0; }" +
        "#rc-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }" +
        "#rc-btn { position: fixed; bottom: 20px; right: 20px; z-index: 9999; width: 60px; height: 60px; border-radius: 50%; background: #2563eb; color: #fff; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.25); font-size: 28px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }" +
        "#rc-btn:hover { transform: scale(1.1); }" +
        "#rc-btn::after { content: 'Chat with us'; position: absolute; right: 70px; background: #1e293b; color: #fff; font-size: 13px; padding: 6px 12px; border-radius: 6px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; }" +
        "#rc-btn:hover::after { opacity: 1; }" +
        "#rc-panel { position: fixed; bottom: 90px; right: 20px; z-index: 9999; width: 350px; height: 500px; background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.18); display: none; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0; }" +
        "#rc-panel.open { display: flex; }" +
        "#rc-header { background: #2563eb; color: #fff; padding: 14px 16px; font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: space-between; }" +
        "#rc-close { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; line-height: 1; opacity: 0.8; }" +
        "#rc-close:hover { opacity: 1; }" +
        "#rc-messages { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; background: #f8fafc; }" +
        ".rc-msg { max-width: 80%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.4; word-wrap: break-word; }" +
        ".rc-msg.bot { align-self: flex-start; background: #e2e8f0; color: #0f172a; border-bottom-left-radius: 4px; }" +
        ".rc-msg.user { align-self: flex-end; background: #2563eb; color: #fff; border-bottom-right-radius: 4px; }" +
        ".rc-msg.loading { align-self: flex-start; background: #e2e8f0; color: #64748b; font-style: italic; }" +
        "#rc-input-area { display: flex; border-top: 1px solid #e2e8f0; padding: 10px 12px; background: #fff; }" +
        "#rc-input { flex: 1; border: 1px solid #cbd5e1; border-radius: 20px; padding: 8px 14px; font-size: 14px; outline: none; }" +
        "#rc-input:focus { border-color: #2563eb; }" +
        "#rc-send { margin-left: 8px; background: #2563eb; color: #fff; border: none; border-radius: 20px; padding: 8px 18px; font-size: 14px; cursor: pointer; font-weight: 500; }" +
        "#rc-send:hover { background: #1d4ed8; }" +
        "#rc-send:disabled { opacity: 0.5; cursor: not-allowed; }";

    document.head.appendChild(style);

    // --- Create DOM ---
    var container = document.createElement("div");
    container.id = "rc-widget";
    container.innerHTML =
        '<button id="rc-btn" aria-label="Chat with us">\uD83D\uDCAC</button>' +
        '<div id="rc-panel">' +
        '<div id="rc-header">' +
        '<span>' + CLINIC_NAME + ' Assistant</span>' +
        '<button id="rc-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div id="rc-messages"></div>' +
        '<div id="rc-input-area">' +
        '<input id="rc-input" type="text" placeholder="Type a message..." />' +
        '<button id="rc-send">Send</button>' +
        '</div>' +
        '</div>';

    document.body.appendChild(container);

    var btn = document.getElementById("rc-btn");
    var panel = document.getElementById("rc-panel");
    var closeBtn = document.getElementById("rc-close");
    var messagesEl = document.getElementById("rc-messages");
    var inputEl = document.getElementById("rc-input");
    var sendBtn = document.getElementById("rc-send");
    var isOpen = false;

    function addMessage(text, type) {
        var div = document.createElement("div");
        div.className = "rc-msg " + type;
        div.textContent = text;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
    }

    function showWelcome() {
        addMessage("Hi! I'm the virtual assistant for " + CLINIC_NAME + ". How can I help you today?", "bot");
    }

    function openPanel() {
        isOpen = true;
        panel.classList.add("open");
        btn.style.display = "none";
        if (messagesEl.children.length === 0) {
            showWelcome();
        }
        inputEl.focus();
    }

    function closePanel() {
        isOpen = false;
        panel.classList.remove("open");
        btn.style.display = "flex";
    }

    function sendMessage() {
        var text = inputEl.value.trim();
        if (!text) return;
        inputEl.value = "";
        sendBtn.disabled = true;

        addMessage(text, "user");

        var loadingBubble = addMessage("...", "loading");

        fetch(API_URL + "/api/v1/receptionist/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, sessionId: SESSION_ID }),
        })
            .then(function (res) {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
            })
            .then(function (data) {
                var reply = data && data.data && data.data.reply;
                if (!reply) throw new Error("Empty reply");
                messagesEl.removeChild(loadingBubble);
                addMessage(reply, "bot");
            })
            .catch(function () {
                messagesEl.removeChild(loadingBubble);
                addMessage("Sorry, I couldn't connect. Please call the clinic.", "bot");
            })
            .finally(function () {
                sendBtn.disabled = false;
                inputEl.focus();
            });
    }

    // --- Event listeners ---
    btn.addEventListener("click", openPanel);
    closeBtn.addEventListener("click", closePanel);
    sendBtn.addEventListener("click", sendMessage);
    inputEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter") sendMessage();
    });
})();