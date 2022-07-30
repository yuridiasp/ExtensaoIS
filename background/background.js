

onExtensionInstalled(setInitial)

function setInitial() {
    setInitialActive()
}

async function setInitialProcess() {
    let processo = await getProcesso()
    if (processo == undefined)
        await setActive(null)
}
