// ==UserScript==
// @name         goopy custom pfp
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  balls
// @author       goose
// @match        https://www.roblox.com/users/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    let settings = GM_getValue('settings', {});

    function getUserId() {
        const match = window.location.pathname.match(/\/users\/(\d+)/);
        return match ? match[1] : null;
    }

    async function fetchCustomImage(userId) {
        try {
            const response = await fetch(`https://goosecorner.xyz/api/get-avatar.php?userId=${userId}`);
            const data = await response.json();
            return data.url || null;
        } catch {
            return null;
        }
    }

    async function saveCustomImage(userId, url) {
        await fetch(`https://goosecorner.xyz/api/set-avatar.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, url })
        });
    }

    async function replaceProfilePicture(userId) {
        let customImageURL = await fetchCustomImage(userId);
        if (!customImageURL) {
            if (settings[userId]) customImageURL = settings[userId];
            else return;
        } else {
            settings[userId] = customImageURL;
            GM_setValue('settings', settings);
        }

        const profilePictureElement = document.querySelector('.profile-avatar-image img');
        if (profilePictureElement) {
            profilePictureElement.src = customImageURL;
        } else {
            setTimeout(() => replaceProfilePicture(userId), 100);
        }
    }

    function createUI(userId) {
        const ui = document.createElement('div');
        ui.style.position = 'fixed';
        ui.style.bottom = '0';
        ui.style.left = '0';
        ui.style.right = '0';
        ui.style.background = '#1e1e1e';
        ui.style.color = '#fff';
        ui.style.padding = '10px';
        ui.style.display = 'flex';
        ui.style.alignItems = 'center';
        ui.style.gap = '10px';
        ui.style.zIndex = '9999';
        ui.style.fontFamily = 'Arial';
        ui.style.fontSize = '14px';
        ui.style.borderTop = '2px solid #333';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Image url plz';
        input.value = settings[userId] || '';
        input.style.flex = '1';
        input.style.padding = '5px';

        const save = document.createElement('button');
        save.textContent = 'Save';
        save.onclick = async () => {
            settings[userId] = input.value;
            GM_setValue('settings', settings);
            await saveCustomImage(userId, input.value);
            replaceProfilePicture(userId);
        };

        const clear = document.createElement('button');
        clear.textContent = 'Clear';
        clear.onclick = () => {
            delete settings[userId];
            GM_setValue('settings', settings);
            location.reload();
        };

        const log = document.createElement('button');
        log.textContent = 'Log All';
        log.onclick = () => {
            console.log('== Saved Local Profile Images ==');
            Object.entries(settings).forEach(([id, url]) => {
                console.log(`UserID ${id}: ${url}`);
            });
        };

        ui.appendChild(document.createTextNode(`ID: ${userId}`));
        ui.appendChild(input);
        ui.appendChild(save);
        ui.appendChild(clear);
        ui.appendChild(log);
        document.body.appendChild(ui);
    }

    async function fetchAboutMe(userId) {
        try {
            const res = await fetch(`https://goosecorner.xyz/api/get-aboutme.php?userId=${userId}`);
            const json = await res.json();
            return json.about || '';
        } catch {
            return '';
        }
    }

    async function saveAboutMe(userId, html) {
        await fetch(`https://goosecorner.xyz/api/set-aboutme.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, about: html })
        });
    }

    async function replaceAboutMe(userId) {
        const aboutMeHTML = await fetchAboutMe(userId);
        const target = document.querySelector('.profile-about-content-text');
        if (target) {
            target.innerHTML = aboutMeHTML;
        } else {
            setTimeout(() => replaceAboutMe(userId), 100);
        }
    }

    function createAboutMeEditor(userId) {
        const editor = document.createElement('div');
        editor.style.position = 'fixed';
        editor.style.bottom = '60px';
        editor.style.left = '0';
        editor.style.right = '0';
        editor.style.padding = '10px';
        editor.style.background = '#1e1e1e';
        editor.style.color = '#fff';
        editor.style.zIndex = '9999';
        editor.style.display = 'flex';
        editor.style.flexDirection = 'column';
        editor.style.gap = '6px';
        editor.style.borderTop = '2px solid #333';

        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Enter custom HTML for About Me';
        textarea.style.width = '100%';
        textarea.style.height = '100px';
        textarea.style.padding = '8px';
        textarea.style.resize = 'vertical';
        textarea.style.fontFamily = 'monospace';

        const save = document.createElement('button');
        save.textContent = 'Save About Me';
        save.onclick = async () => {
            await saveAboutMe(userId, textarea.value);
            replaceAboutMe(userId);
        };

        const clear = document.createElement('button');
        clear.textContent = 'Clear';
        clear.onclick = async () => {
            textarea.value = '';
            await saveAboutMe(userId, '');
            location.reload();
        };

        editor.appendChild(textarea);
        editor.appendChild(save);
        editor.appendChild(clear);
        document.body.appendChild(editor);

        fetchAboutMe(userId).then((html) => {
            textarea.value = html;
        });
    }

    async function checkIfSelf(userId) {
        const url = `https://www.roblox.com/users/${userId}/profile`;
        const res = await fetch(`https://goosecorner.xyz/api/check-self.php?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        return json.self === true;
    }

    const userId = getUserId();

    function waitForProfileElements(callback) {
        const interval = setInterval(() => {
            const avatarReady = document.querySelector('.profile-avatar-image img');
            const aboutReady = document.querySelector('.profile-about-content-text');
            if (avatarReady && aboutReady) {
                clearInterval(interval);
                callback();
            }
        }, 100);
    }

if (userId) {
    waitForProfileElements(() => {
        replaceProfilePicture(userId);
        replaceAboutMe(userId);
        createUI(userId);
        createAboutMeEditor(userId);
    });
}
})();
