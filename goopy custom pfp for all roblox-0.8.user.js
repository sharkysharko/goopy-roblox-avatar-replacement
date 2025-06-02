// ==UserScript==
// @name         goopy custom pfp for all roblox
// @namespace    http://tampermonkey.net/
// @version      0.8
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

    //
    const MY_USER_ID = 2975115602;

    async function fetchCustomImage(userId) {
        try {
            const response = await fetch(`https://goosecorner.xyz/api/get-avatar.php?userId=${userId}`);
            const data = await response.json();
            if (data.url) {
                console.log(`[goop] heres the fuckin avatar for ${userId}:`, data.url);
            } else {
                console.log(`[goop] hey retard theres no avatar here ${userId}`);
            }
            return data.url || null;
        } catch (e) {
            console.error("[goop] i dont know what happened:", e);
            return null;
        }
    }

    async function saveCustomImage(userId, url) {
        try {
            const res = await fetch(`https://goosecorner.xyz/api/set-avatar.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, url })
            });
            if (res.ok) {
                console.log(`[goop] thanks for the avatar for ${userId}:`, url);
            } else {
                console.warn(`[goop] not accepting that image for ${userId} (HTTP ${res.status})`);
            }
        } catch (e) {
            console.error("[goop] you retard, -> :", e);
        }
    }

    async function replaceProfilePicture(userId) {
        let customImageURL = await fetchCustomImage(userId);

        if (!customImageURL) {
            // 
            if (MY_USER_ID && userId === MY_USER_ID && settings[userId]) {
                console.log(`[goop] fallback, womp womp ${userId}`);
                customImageURL = settings[userId];
            } else {
                return;
            }
        } else {
            // 
            settings[userId] = customImageURL;
            GM_setValue('settings', settings);
        }

        const profilePictureElement = document.querySelector('.profile-avatar-image img');
        if (profilePictureElement) {
            profilePictureElement.src = customImageURL;
            console.log(`[goop] replaced avatar for ${userId} with:`, customImageURL);
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
            console.log(`[goop] saved the local image so no losey losey ${userId}:`, input.value);
            await saveCustomImage(userId, input.value);
            replaceProfilePicture(userId);
        };

        const clear = document.createElement('button');
        clear.textContent = 'Clear';
        clear.onclick = () => {
            delete settings[userId];
            GM_setValue('settings', settings);
            console.log(`[goop] no more pfp for ${userId}`);
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

    const userId = getUserId();
    if (userId) {
        replaceProfilePicture(userId);
        createUI(userId);
    }
})();
