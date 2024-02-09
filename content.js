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

let data = {
    bsAdvProcessos: "s",
    org: "",
    bsAdvProcessosTexto: "",
    bsAdvProcessosData: "p.dataDistribuicao",
    bsAdvProcessosDataDe: "",
    bsAdvProcessosDataAte: "",
    bsAdvProcessosEstado: "",
    bsAdvProcessosCidade: "",
    bsAdvProcessosSemCidade: "",
    bsAdvProcessosCliente: "",
    bsAdvProcessosCpf: "",
    bsAdvProcessosReu: "",
    bsAdvProcessosCargo: "",
    bsAdvProcessosClienteComoChegou: "",
    bsAdvProcessosStatus: "",
    bsAdvProcessosNatureza: "",
    bsAdvProcessosMerito: "",
    bsAdvProcessosAutorPeticao: "",
    bsAdvProcessosResponsavel: "",
    bsAdvProcessosIncluidoPor: "",
    bsAdvProcessosSentenca: "",
    bsAdvProcessosDataSentenca: "p.dataSentenca",
    bsAdvProcessosDataSentencaDe: "",
    bsAdvProcessosDataSentencaAte: "",
    filtrar: "Filtrar"
}

function updateEvent() {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {

            
            if (request.texto) {
                // Cria um elemento de área de transferência temporário
                let tempInput = document.createElement("h2")
                let body = document.querySelector("body")
                //tempInput.style.position = 'fixed'
                //tempInput.style.opacity = 0
                tempInput.style.textAlign = "center"
                document.querySelector("*").style.removeProperty("font-family")
                document.querySelector("*").style.setProperty("font-family",  "Times New Roman, serif", "important")
                tempInput.style.fontSize = "16px"
                tempInput.style.fontFamily = "Times New Roman, serif"
                tempInput.style.color = "red"
                tempInput.style.background = "none"
                tempInput.style.fontWeight = "normal"
                tempInput.style.border = "none"
                console.log(tempInput)
                tempInput.innerHTML = request.texto.replaceAll("&lt;","<").replaceAll("&gt;",">")
                if (!body) {
                    body = document.createElement("body")
                    document.querySelector("html").appendChild(body)
                    document.querySelector("html body").appendChild(tempInput)
                } else {
                    body.appendChild(tempInput)
                }
                
                // Cria um objeto de seleção
                let range = document.createRange()
                range.selectNodeContents(tempInput)
                
                // Seleciona o conteúdo
                let selection = window.getSelection()
                selection.addRange(range)
                
                // Copia o texto selecionado
                document.execCommand('copy')
                
                // Limpa a seleção
                selection.removeAllRanges()

                //Remove tempInput
                //body.removeChild(tempInput)

                //Envia a resposta
                sendResponse({resposta: request.texto})
            } else {
                if (request.get) {
                    let resultado = getCompetencia()
                    sendResponse(resultado)
                } else {
                    
                }
            }
        }
    )
}

function autoSearchProcess(processo) {
    const urlAtual = document.URL
    const urlPageBuscaProcesso = 'http://fabioribeiro.eastus.cloudapp.azure.com/adv/processos/default.asp'
    
    if (urlAtual == urlPageBuscaProcesso) {
        const processoInput = document.querySelector("#bsAdvProcessosTexto")
        const btnFiltro = document.querySelector("#fdt-form > div:nth-child(6) > div:nth-child(4) > input") || document.querySelector("#fdt-form > div:nth-child(4) > div:nth-child(3) > input")

        processoInput.value = processo
        btnFiltro.click()
    }
}

function connectPort() {
    chrome.runtime.onConnect.addListener(function(port) {

        port.onMessage.addListener(function(request) {
            
            if (request) {
                data.bsAdvProcessosTexto = request

                let urlEncodedData = Object.keys(data)
                .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
                .join('&');

                fetch("http://fabioribeiro.eastus.cloudapp.azure.com/adv/processos/default.asp", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: urlEncodedData,
                }).then(response => {
                    if (!response.ok) {
                        throw new Error('Erro na requisição: ' + response.status);
                    }
                    return response.text();
                }).then(resposta => {
                    let parser = new DOMParser()
                    let doc = parser.parseFromString(resposta,'text/html')
                    const element = doc.documentElement.querySelector("body > section > section > div.fdt-espaco > div > div.fdt-pg-conteudo > div.table-responsive > table > tbody > tr > td:nth-child(3)")
                    
                    if (element) {
                        let verify = element.innerText.includes(request)
                        if (verify) {
                            autoSearchProcess(request)
                        }
                        port.postMessage({checked: verify})
                    }
                    else {
                        port.postMessage({checked: false})
                    }
                }).catch(err => {
                    alert(err)
                })
            }
        })
    })
}

(function () {
    updateEvent()
    connectPort()
})()