function setPanel() {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
}

function chromeRuntimeOnInstalledAddListener(listener) {
    chrome.runtime.onInstalled.addListener(listener)
}

function onExtensionInstalled(listener) {
    chromeRuntimeOnInstalledAddListener(listener)
}

function getAnalise() {
    return chromeStorageLocalGet('is')
}

function setAnalise(processoValue) {
    return chromeStorageLocalSet({ is: processoValue })
}

function getAnaliseOld() {
    return chromeStorageLocalGet('isOld')
}

function setAnaliseOld(processoValue) {
    return chromeStorageLocalSet({ isOld: processoValue })
}

function chromeStorageLocalGet(key) {
    return new Promise((resolve) => chrome.storage.local.get([key], (result) => {
        resolve(result[key])
    }))
}

function chromeStorageLocalSet(object) {
    return new Promise((resolve) => chrome.storage.local.set(object, resolve))
}