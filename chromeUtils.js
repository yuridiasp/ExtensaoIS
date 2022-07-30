

function chromeRuntimeOnInstalledAddListener(listener) {
    chrome.runtime.onInstalled.addListener(listener)
}

function onExtensionInstalled(listener) {
    chromeRuntimeOnInstalledAddListener(listener)
}

function getProcesso() {
    return chromeStorageLocalGet('is')
}

function setProcesso(processoValue) {
    return chromeStorageLocalSet({ is: processoValue })
}

function getProcessoOld() {
    return chromeStorageLocalGet('isOld')
}

function setProcessoOld(processoValue) {
    return chromeStorageLocalSet({ isOld: processoValue })
}

function getDataPub() {
    return chromeStorageLocalGet('datePub')
}

function setDataPub(datePub) {
    return chromeStorageLocalSet({datePub: datePub})
}

function chromeStorageLocalGet(key) {
    return new Promise((resolve) => chrome.storage.local.get([key], (result) => {
        resolve(result[key])
    }))
}

function chromeStorageLocalSet(object) {
    return new Promise((resolve) => chrome.storage.local.set(object, resolve))
}