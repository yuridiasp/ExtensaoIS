function getCompetencia() {
    let texto, array, textoTrabalhista
    
    if (document.querySelector('#downFrame'))
        texto = document.querySelector('#downFrame').contentDocument.documentElement.querySelector('#mainFrame').contentDocument.documentElement.querySelector('body > form > table.table.table-striped > tbody > tr > td:nth-child(3)')
    else
        textoTrabalhista = document.querySelector("body > pje-root > mat-sidenav-container > mat-sidenav-content > pje-cabecalho > div > mat-toolbar > pje-cabecalho-processo > section > div > section.oj-cargo")

    if (texto) {
        array = texto.innerText.split('\n')
    
        return {competencia: array[1], portal: 'TJ'}
    } else if (textoTrabalhista) {
        array = textoTrabalhista.innerText.split('/')
    
        return {competencia: array[0], portal: 'TRT'}
    }
    
    return {competencia: null, portal: null}

}

function updateEvent() {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            let resultado = getCompetencia()
            sendResponse(resultado)
        }
    )
}


(function () {
    updateEvent()
})()