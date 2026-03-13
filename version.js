const CONFIG = {
    version: "v1.0.1-BETA"
};

document.addEventListener("DOMContentLoaded", () => {
    const versionElement = document.getElementById("app-version");
    if (versionElement) {
        versionElement.textContent = CONFIG.version;
    }
});
