"use strict";
/**
 * cipher.gen — password generator
 * All generation happens client-side via crypto.getRandomValues.
 * Nothing is ever sent anywhere.
 */
const CHARSETS = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    digits: "0123456789",
    symbols: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
};
// Characters that are easy to misread in most fonts.
const AMBIGUOUS = new Set("Il1O0o|`'\".,;:");
const el = {
    password: document.getElementById("password"),
    scramble: document.getElementById("scramble"),
    length: document.getElementById("length"),
    lengthValue: document.getElementById("lengthValue"),
    entropyFill: document.getElementById("entropyFill"),
    entropyBits: document.getElementById("entropyBits"),
    entropyLabel: document.getElementById("entropyLabel"),
    generateBtn: document.getElementById("generateBtn"),
    copyBtn: document.getElementById("copyBtn"),
    copyStatus: document.getElementById("copyStatus"),
    toggles: Array.from(document.querySelectorAll("[data-charset]")),
    ambiguousToggle: document.getElementById("excludeAmbiguous"),
};
let currentPassword = "";
let scrambleTimer;
/** Cryptographically strong random integer in [0, max). */
function randomInt(max) {
    const array = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / max) * max;
    let value;
    do {
        crypto.getRandomValues(array);
        value = array[0];
    } while (value >= limit);
    return value % max;
}
function activeCharsets() {
    return el.toggles
        .filter((t) => t.checked)
        .map((t) => t.dataset.charset);
}
function buildPool(keys) {
    let pool = keys.map((k) => CHARSETS[k]).join("");
    if (el.ambiguousToggle.checked) {
        pool = Array.from(pool)
            .filter((c) => !AMBIGUOUS.has(c))
            .join("");
    }
    return pool;
}
function generatePassword(length, keys) {
    if (keys.length === 0)
        return "";
    const pool = buildPool(keys);
    if (pool.length === 0)
        return "";
    // Guarantee at least one character from each selected set for predictable strength.
    const required = keys.map((k) => {
        let set = CHARSETS[k];
        if (el.ambiguousToggle.checked) {
            set = Array.from(set)
                .filter((c) => !AMBIGUOUS.has(c))
                .join("");
        }
        return set[randomInt(set.length)];
    });
    const rest = Array.from({ length: Math.max(0, length - required.length) }, () => pool[randomInt(pool.length)]);
    const chars = [...required, ...rest];
    // Fisher–Yates shuffle so the guaranteed characters aren't always up front.
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.slice(0, length).join("");
}
function entropyBits(length, keys) {
    const pool = buildPool(keys);
    if (pool.length === 0)
        return 0;
    return Math.round(length * Math.log2(pool.length));
}
function strengthLabel(bits) {
    if (bits === 0)
        return { label: "PICK A CHARSET", ratio: 0, tone: "idle" };
    if (bits < 40)
        return { label: "WEAK", ratio: bits / 120, tone: "weak" };
    if (bits < 65)
        return { label: "FAIR", ratio: bits / 120, tone: "fair" };
    if (bits < 90)
        return { label: "STRONG", ratio: bits / 120, tone: "strong" };
    return { label: "VERY STRONG", ratio: 1, tone: "strong" };
}
const RANDOM_GLYPHS = "!@#$%^&*abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function randomGlyph() {
    return RANDOM_GLYPHS[randomInt(RANDOM_GLYPHS.length)];
}
/** The signature "decrypt" reveal: scrambles then locks in characters left to right. */
function revealPassword(target) {
    window.clearInterval(scrambleTimer);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || target.length === 0) {
        el.password.textContent = target || "—";
        updateEntropyDisplay();
        return;
    }
    const len = target.length;
    let frame = 0;
    const totalFrames = 14;
    const lockStep = totalFrames / len;
    scrambleTimer = window.setInterval(() => {
        frame++;
        const lockedCount = Math.min(len, Math.floor(frame / lockStep));
        let display = "";
        for (let i = 0; i < len; i++) {
            display += i < lockedCount ? target[i] : randomGlyph();
        }
        el.password.textContent = display;
        if (lockedCount >= len) {
            window.clearInterval(scrambleTimer);
            el.password.textContent = target;
            updateEntropyDisplay();
        }
    }, 28);
}
function updateEntropyDisplay() {
    const length = Number(el.length.value);
    const keys = activeCharsets();
    const bits = entropyBits(length, keys);
    const { label, ratio, tone } = strengthLabel(bits);
    el.entropyBits.textContent = keys.length === 0 ? "0" : String(bits);
    el.entropyLabel.textContent = label;
    el.entropyFill.style.setProperty("--fill", String(Math.min(1, ratio)));
    el.entropyFill.dataset.tone = tone;
}
function regenerate() {
    const length = Number(el.length.value);
    const keys = activeCharsets();
    if (keys.length === 0) {
        currentPassword = "";
        el.password.textContent = "SELECT A CHARACTER SET";
        updateEntropyDisplay();
        return;
    }
    currentPassword = generatePassword(length, keys);
    revealPassword(currentPassword);
}
async function copyPassword() {
    if (!currentPassword)
        return;
    const copied = currentPassword;
    try {
        await navigator.clipboard.writeText(copied);
        el.copyStatus.textContent = "COPIED";
    }
    catch {
        el.copyStatus.textContent = "COPY FAILED";
    }
    el.copyStatus.classList.add("visible");
    window.clearTimeout(copyPassword.t);
    copyPassword.t = window.setTimeout(() => {
        el.copyStatus.classList.remove("visible");
    }, 1600);
    // Best-effort: wipe the clipboard after 30s if it still holds this password.
    // Reduces exposure via OS/clipboard-manager history if the tab is left open.
    window.clearTimeout(copyPassword.c);
    copyPassword.c = window.setTimeout(async () => {
        try {
            const current = await navigator.clipboard.readText();
            if (current === copied) {
                await navigator.clipboard.writeText("");
            }
        }
        catch {
            // Clipboard read may be denied/unsupported — nothing we can do silently.
        }
    }, 30000);
}
el.length.addEventListener("input", () => {
    el.lengthValue.textContent = el.length.value;
    updateEntropyDisplay();
});
el.toggles.forEach((t) => t.addEventListener("change", () => {
    // Never allow the last charset to be unchecked — always leave one active.
    if (activeCharsets().length === 0) {
        t.checked = true;
    }
    updateEntropyDisplay();
}));
el.ambiguousToggle.addEventListener("change", updateEntropyDisplay);
el.generateBtn.addEventListener("click", regenerate);
el.copyBtn.addEventListener("click", copyPassword);
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && document.activeElement === document.body) {
        e.preventDefault();
        regenerate();
    }
});
// Initial state on load.
el.lengthValue.textContent = el.length.value;
regenerate();
