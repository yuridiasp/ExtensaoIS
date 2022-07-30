
function getCompetencia() {
    let texto = document.querySelector('#downFrame').contentDocument.documentElement.querySelector('#mainFrame').contentDocument.documentElement.querySelector('body > form > table.table.table-striped > tbody > tr > td:nth-child(3)').innerText
    let array = texto.split('\n')
    console.log(texto,array)
    return array[1]
}

function updateEvent() {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            let competencia = getCompetencia()
            sendResponse({competencia: competencia})
        }
    )
}


(function () {
    updateEvent()
})()