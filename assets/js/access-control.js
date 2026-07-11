(function () {
  "use strict";

  var config = window.COGNATES_ACCESS_CONFIG || {};
  var hashesByTopic = config.credentialHashes || {};
  var titlesByTopic = config.topicTitles || {};
  var storagePrefix = "cognates-topic-access:";
  var modalRoot = null;

  function normalizeTopic(value) {
    var raw = String(value || "").match(/\d+/);
    if (!raw) return "";
    return raw[0].padStart(2, "0");
  }

  function normalizeUser(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  }

  function normalizeCode(value) {
    return String(value || "").trim();
  }

  function topicFromHref(href) {
    var match = String(href || "").match(/session(\d+)/i);
    return normalizeTopic(match && match[1]);
  }

  function topicFromPage() {
    var declared = document.documentElement.getAttribute("data-topic-lock");
    if (declared) return normalizeTopic(declared);
    return topicFromHref(window.location.pathname);
  }

  function isLockedTopic(topic) {
    return Boolean(topic && hashesByTopic[topic] && hashesByTopic[topic].length);
  }

  function storageKey(topic) {
    return storagePrefix + topic;
  }

  function hasAccess(topic) {
    try {
      if (window.localStorage.getItem(storageKey(topic)) === "granted") return true;
    } catch (error) {
      /* Fall back to session storage when local storage is unavailable. */
    }

    try {
      return window.sessionStorage.getItem(storageKey(topic)) === "granted";
    } catch (error) {
      return false;
    }
  }

  function grantAccess(topic, username) {
    try {
      window.localStorage.setItem(storageKey(topic), "granted");
      window.localStorage.setItem(storageKey(topic) + ":user", username);
    } catch (error) {
      /* Session storage still lets the current tab unlock. */
    }

    try {
      window.sessionStorage.setItem(storageKey(topic), "granted");
      window.sessionStorage.setItem(storageKey(topic) + ":user", username);
    } catch (error) {
      /* Session storage may be disabled. The current page still unlocks. */
    }
  }

  function injectStyles() {
    if (document.getElementById("cognates-access-styles")) return;
    var style = document.createElement("style");
    style.id = "cognates-access-styles";
    style.textContent = [
      "html.access-checking body{visibility:hidden}",
      "html.access-locked body>:not(.access-modal-root){filter:blur(8px);pointer-events:none;user-select:none}",
      "html.access-locked .chassis-cursor{display:none!important}",
      "html.access-locked body.chassis-cursor-active,html.access-locked body.chassis-cursor-active *{cursor:auto!important}",
      ".access-modal-root{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:20px;background:rgba(5,6,10,.88);backdrop-filter:blur(12px);visibility:visible!important}",
      ".access-modal-root,.access-modal-root *{cursor:auto!important}",
      ".access-card{width:min(430px,100%);background:#15161c;color:#eceaf0;border:1px solid #303240;border-radius:8px;box-shadow:0 24px 80px rgba(0,0,0,.45);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden}",
      ".access-card__bar{height:4px;background:linear-gradient(90deg,#e63946,#f4a261,#2a9d8f)}",
      ".access-card__body{padding:24px}",
      ".access-card h2{font-size:22px;line-height:1.2;margin:0 0 8px;font-weight:800;letter-spacing:0}",
      ".access-card p{font-size:14px;line-height:1.55;margin:0;color:#a7a7b7}",
      ".access-topic{margin:16px 0 20px;padding:12px 14px;border:1px solid #2a2d3a;border-radius:8px;background:#101116;color:#d8d7df;font-size:13px;line-height:1.45}",
      ".access-topic strong{display:block;color:#ffffff;font-size:14px;margin-bottom:2px}",
      ".access-field{display:block;margin:0 0 14px}",
      ".access-field span{display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8c8ca0;margin-bottom:7px}",
      ".access-field input{width:100%;height:44px;border-radius:8px;border:1px solid #353848;background:#0d0e13;color:#fff;padding:0 12px;font:15px/1.2 Inter,system-ui,sans-serif;outline:none;cursor:text!important}",
      ".access-field input:focus{border-color:#e63946;box-shadow:0 0 0 3px rgba(230,57,70,.18)}",
      ".access-error{min-height:20px;margin:2px 0 14px;color:#ff7b86;font-size:13px}",
      ".access-actions{display:flex;gap:10px;justify-content:flex-end}",
      ".access-button{height:42px;border:0;border-radius:8px;padding:0 16px;font:700 14px/1 Inter,system-ui,sans-serif;cursor:pointer!important}",
      ".access-button.primary{background:#e63946;color:#fff}",
      ".access-button.primary:hover{background:#f04b57}",
      ".access-button.secondary{background:#252733;color:#d7d5dd}",
      ".access-button.secondary:hover{background:#303342}",
      ".access-note{margin-top:16px!important;font-size:12px!important;color:#777789!important}",
      "@media(max-width:520px){.access-card__body{padding:20px}.access-actions{flex-direction:column-reverse}.access-button{width:100%}}"
    ].join("");
    document.head.appendChild(style);
  }

  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  function sha256(ascii) {
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = "length";
    var i;
    var j;
    var result = "";
    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;
    var hash = (sha256.h = sha256.h || []);
    var k = (sha256.k = sha256.k || []);
    var primeCounter = k[lengthProperty];
    var isComposite = {};

    for (var candidate = 2; primeCounter < 64; candidate += 1) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        primeCounter += 1;
      }
    }

    ascii += "\x80";
    while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00";

    for (i = 0; i < ascii[lengthProperty]; i += 1) {
      j = ascii.charCodeAt(i);
      if (j >> 8) throw new Error("Access credentials must be ASCII.");
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }

    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;

    for (j = 0; j < words[lengthProperty]; ) {
      var w = words.slice(j, (j += 16));
      var oldHash = hash;
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i += 1) {
        var i2 = i + j;
        var w15 = w[i - 15];
        var w2 = w[i - 2];
        var a = hash[0];
        var e = hash[4];
        var temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);
        var temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i += 1) hash[i] = (hash[i] + oldHash[i]) | 0;
    }

    for (i = 0; i < 8; i += 1) {
      for (j = 3; j + 1; j -= 1) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? "0" : "") + b.toString(16);
      }
    }
    return result;
  }

  function credentialHash(topic, username, code) {
    return sha256([topic, normalizeUser(username), normalizeCode(code)].join(":"));
  }

  function verifyCredential(topic, username, code) {
    var list = hashesByTopic[topic] || [];
    var attempt = credentialHash(topic, username, code);
    return list.indexOf(attempt) !== -1;
  }

  function removeModal() {
    if (modalRoot) modalRoot.remove();
    modalRoot = null;
  }

  function showModal(topic, options) {
    injectStyles();
    removeModal();

    var opts = options || {};
    var root = document.createElement("div");
    root.className = "access-modal-root";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "access-title");

    var title = titlesByTopic[topic] || "Topic " + Number(topic);
    root.innerHTML =
      '<form class="access-card">' +
      '<div class="access-card__bar"></div>' +
      '<div class="access-card__body">' +
      '<h2 id="access-title">Access Required</h2>' +
      '<p>Enter the credentials assigned by your instructor.</p>' +
      '<div class="access-topic"><strong>Topic ' +
      Number(topic) +
      "</strong>" +
      escapeHtml(title) +
      "</div>" +
      '<label class="access-field"><span>Username</span><input name="username" autocomplete="username" required></label>' +
      '<label class="access-field"><span>Access Code</span><input name="code" type="password" autocomplete="current-password" required></label>' +
      '<div class="access-error" aria-live="polite"></div>' +
      '<div class="access-actions">' +
      (opts.allowCancel ? '<button class="access-button secondary" type="button" data-access-cancel>Cancel</button>' : "") +
      '<button class="access-button primary" type="submit">Unlock</button>' +
      "</div>" +
      '<p class="access-note">Access is topic-specific and stays available in this browser until site data is cleared.</p>' +
      "</div>" +
      "</form>";

    modalRoot = root;
    document.body.appendChild(root);
    document.documentElement.classList.add("access-locked");
    document.documentElement.classList.remove("access-checking");

    var form = root.querySelector("form");
    var username = root.querySelector('input[name="username"]');
    var code = root.querySelector('input[name="code"]');
    var error = root.querySelector(".access-error");
    var cancel = root.querySelector("[data-access-cancel]");

    username.focus();

    if (cancel) {
      cancel.addEventListener("click", function () {
        removeModal();
        document.documentElement.classList.remove("access-locked");
        if (typeof opts.onCancel === "function") opts.onCancel();
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var enteredUser = normalizeUser(username.value);
      var enteredCode = normalizeCode(code.value);

      if (!verifyCredential(topic, enteredUser, enteredCode)) {
        error.textContent = "Invalid username or access code for this topic.";
        code.value = "";
        code.focus();
        return;
      }

      grantAccess(topic, enteredUser);
      removeModal();
      document.documentElement.classList.remove("access-locked");
      document.documentElement.classList.remove("access-checking");
      if (typeof opts.onSuccess === "function") opts.onSuccess();
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function openTarget(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function wireIndexLinks() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("a.session-link[href]");
      if (!link) return;

      var topic = normalizeTopic(link.getAttribute("data-topic") || topicFromHref(link.getAttribute("href")));
      if (!isLockedTopic(topic) || hasAccess(topic)) return;

      event.preventDefault();
      showModal(topic, {
        allowCancel: true,
        onSuccess: function () {
          openTarget(link.href);
        }
      });
    });
  }

  function lockTopicPage() {
    var topic = topicFromPage();
    if (!isLockedTopic(topic)) {
      document.documentElement.classList.remove("access-checking");
      return;
    }

    if (hasAccess(topic)) {
      document.documentElement.classList.remove("access-checking");
      return;
    }

    showModal(topic);
  }

  document.addEventListener(
    "keydown",
    function (event) {
      if (event.ctrlKey && event.shiftKey && String(event.key).toLowerCase() === "a") {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  document.addEventListener("DOMContentLoaded", function () {
    wireIndexLinks();
    if (document.documentElement.hasAttribute("data-topic-lock")) lockTopicPage();
  });
})();
