const { 
        fileFormatIS,
        publicacao,
        processo,
        origem,
        tipoIntimacao,
        perito,
        localPericia,
        reu,
        localAudiencia,
        prazoInicial,
        prazoFinal,
        horario,
        tarefaAvulsa
    } = document.querySelector("#configuration"),
    genTXT = document.querySelector("#genTXT"),
    btnSetor = document.querySelectorAll(".btn-exc"),
    seletor = document.querySelectorAll(".seletor"),
    focar = document.querySelectorAll(".focar"),
    btnPrazo = document.querySelectorAll(".prazo"),
    resetBtn = document.querySelector("#reset"),
    restoreBtn = document.querySelector("#restore"),
    secaoProcesso = document.querySelector('#processoCampos'),
    divPericia = document.querySelector('#divPericia'),
    divAudiencia = document.querySelector('#divAudiencia'),
    icon = document.querySelector('#iconCheckVerify'),
    iconOrigem = document.querySelector('#iconCheckVerifyOrigem'),
    processNumber = document.querySelector("#processNumber"),
    processId = document.querySelector("#processId"),
    processDefendant = document.querySelector("#processDefendant"),
    processPesponsible = document.querySelector("#processPesponsible"),
    processNature = document.querySelector("#processNature"),
    processMerit = document.querySelector("#processMerit"),
    processCity = document.querySelector("#processCity"),
    processState = document.querySelector("#processState"),
    processDistrict = document.querySelector("#processDistrict"),
    dataProcessDiv = document.querySelector("#dataProcess")

let portal = null

async function sendMessageInnerTabs (message, callback, queryOptions = {}) {

    chrome.tabs.query(queryOptions, tabs => {
        if(tabs.length > 1) {
            alert("Favor, manter aberto somente a página do portal da justiça que esteja analisando intimações no momento. Caso contrário, não será possível realizar o cálculo de datas.")
        } else {
            chrome.tabs.sendMessage(tabs[0].id, message, callback)
        }
    })
}

async function connectOnPortForSendMessage({ message, queryOptions = {}, connectInfo = null, onMessageCallback }) {
    chrome.tabs.query(queryOptions, function(tabs) {
        
        const port = chrome.tabs.connect(tabs[0].id, connectInfo)
        
        port.postMessage(message)
    
        port.onMessage.addListener(onMessageCallback)
    })
}

function resetIcons() {
    const addClasses = ['fa-refresh'],
        removeClasses = ['iconErroValidate', 'iconSucessValidate', 'fa-check-circle', 'fa-times-circle']

    icon.classList.remove(...removeClasses)
    iconOrigem.classList.remove(...removeClasses)
    icon.classList.add(...addClasses)
    iconOrigem.classList.add(...addClasses)
}

function sendMessageCheck(element, icon) {
    if (element.value.length || (!icon.classList.contains('iconCheck'))) {
        const addClasses = ['fa-refresh', 'iconCheck'],
            removeClasses = ['iconErroValidate', 'iconSucessValidate', 'fa-check-circle', 'fa-times-circle']
        icon.classList.remove(...removeClasses)
        icon.classList.add(...addClasses)
        limpartDataProcessList()
    }
    
    const message = element.value
    const queryOptions = { url: "http://fabioribeiro.eastus.cloudapp.azure.com/*" }
    const connectInfo = { name: 'check' }
    const onMessageCallback = (msg) => {
        atualizarDataProcessList(msg.result)
        atualizarIconCheck(msg.checked, icon, element)
    }

    connectOnPortForSendMessage({ message, queryOptions, connectInfo, onMessageCallback })
}

function limpartDataProcessList() {
    processNature.parentElement.classList.remove("fail")
    dataProcessDiv.style.display = "none"
    processNumber.innerHTML = ""
    processId.innerHTML = ""
    processDefendant.innerHTML = ""
    processPesponsible.innerHTML = ""
    processNature.innerHTML = ""
    processMerit.innerHTML = ""
    processCity.innerHTML = ""
    processState.innerHTML = ""
    processDistrict.innerHTML = ""
}

function atualizarDataProcessList(dataProcess) {
    
    if (dataProcess) {
        dataProcessDiv.style.display = "block"
        processNumber.innerHTML = dataProcess.processo.origem
        processId.innerHTML = dataProcess.processo.id
        processDefendant.innerHTML = dataProcess.processo.reu
        processPesponsible.innerHTML = dataProcess.processo.responsavel
        processNature.innerHTML = dataProcess.processo.natureza
        processMerit.innerHTML = dataProcess.processo.merito
        processCity.innerHTML = dataProcess.processo.cidade
        processState.innerHTML = dataProcess.processo.estado
        processDistrict.innerHTML = dataProcess.processo.vara
    }
}

function atualizarIconCheck (result, icon, target) {
    let addClasses = ['fa-times-circle', 'iconErroValidate'],
        removeClasses = ['fa-refresh', 'iconCheck']
    
    if (result) {
        addClasses = ['fa-check-circle', 'iconSucessValidate']
    }

    icon.classList.remove(...removeClasses)
    icon.classList.add(...addClasses)
    target.removeAttribute("readOnly")
}

function removeCaracteresProcesso(value) {
    return value.replace(/[^\d]/g, '')
}

async function sendMessage(prazo, parametro) {
    const message = {get: 'local'}
    const callback = async (response) => {
        portal = response.portal
        calcularPrazo(prazo,response.competencia, parametro)
        setAnalise(saveInfoAnalise())
    }
    const queryOptions = {
        url: [
            "https://www.tjse.jus.br/tjnet/portaladv/*",
            "https://pje.trt20.jus.br/pjekz/processo/*",
            "https://pje.trt15.jus.br/pjekz/processo/*",
        ]
    }

    sendMessageInnerTabs(message, callback, queryOptions)
}

function getLocalProcesso(prazo, parametro) {
    return sendMessage(prazo, parametro)
}

function calculaPascoa(ano) {
    let X
    let Y

    if (ano >= 2020 && ano <= 2099) {
        X = 24
        Y = 5
    }
    if (ano >= 2100 && ano <= 2199) {
        X = 24
        Y = 6
    }
    if (ano >= 2200 && ano <= 2299) {
        X = 25
        Y = 7
    }

    let a = ano%19
    let b = ano%4
    let c = ano%7
    let d = (19*a + X)%30
    let e = (2*b+4*c+6*d+Y)%7
    let DIA
    let MES

    if (d+e > 9) {
        DIA = d+e-9
        MES = 3
    }
    else {
        DIA = d+e+22
        MES = 2
    }
    if (MES == 3 && DIA == 26)
        DIA = 19
    if (MES == 3 && DIA == 25 && d == 28 && a > 10)
        DIA = 18

    return new Date(ano,MES,DIA)
}

function FeriadosFixos (ano, competencia, parametro,) {
    
    const numero_processo = processo.value
    const idProcessoTrabalhista = "5"
    const indexIdProcessoNumeracaoUnica = 13
    const lengthNumeroProcessoNumeracaoUnica = 20
    const isTrabalhista = numero_processo.length === lengthNumeroProcessoNumeracaoUnica && numero_processo[indexIdProcessoNumeracaoUnica] === idProcessoTrabalhista
    let competenciaNormalizada = competencia ? competencia.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase() : null
    const tarefaContatar = (parametro == 1),
        tarefaAdvogado = (parametro == 2),
        indexDia = 1,
        indexMes = 0,
        indexJaneiro = 0,
        fimMesDezembro = 31,
        diaPrimeiro = 1,
        diaInicioForense = 20,
        mesInicioForense = 11,
        diaFimForense = 6,
        mesFimForense = 0,
        diaInicioFeriasAdvogados = 20,
        mesInicioFeriasAdvogados = 11,
        diaFimFeriasAdvogados = 20,
        mesFimFeriasAdvogados = 0

    const setIntervaloFeriadosJudiciario = (diaInicio, mesInicio, diaFinal, mesFinal) => {
        let feriados = [],
            condicao = true,
            dia = diaInicio,
            mes = mesInicio

        while(condicao) {
            feriados.push([mes, dia])
            dia++
            if (dia > fimMesDezembro) {
                dia = diaPrimeiro
                mes = indexJaneiro
            }
            if ((dia > diaFinal) && (mes == mesFinal)) {
                condicao = false
            }
        }

        return feriados
    }

    const resultados = []

    

    const forense = setIntervaloFeriadosJudiciario(diaInicioForense, mesInicioForense, diaFimForense, mesFimForense)

    const advogados = setIntervaloFeriadosJudiciario(diaInicioFeriasAdvogados, mesInicioFeriasAdvogados, diaFimFeriasAdvogados, mesFimFeriasAdvogados)

    const datas = { // [mes, dia] (indice do mes de 0 a 11)
        nacional: [
            [0,1], //CONFRATERNIZAÇÃO UNIVERSAL
            [3,21], //TIRADENTES
            [4,1], //DIA DO TRABALHO
            [8,7], //INDEPENDÊNCIA DO BRASIL
            [9,12], //DIA DAS CRIANÇAS - DIA DA PADROEIRA DO BRASIL
            [10,2], //FINADOS
            [10,15], //PROCLAMAÇÃO DA REPÚBLICA
            [10,20], //DIA DA CONSCIÊNCIA NEGRA
            [11,25], //NATAL
        ],
        recesso_forense : forense, //Recesso Forense 20/12 a 06/01
        ferias_advogados: advogados, //Recesso dos advogados 20/12 a 20/01 Art. 220 NCPC
        justica_nacional: [
            [7,11], //DIA DO MAGISTRADO
            [9, isTrabalhista ? 31 : 28], //DIA DO FUNCIONÁRIO PÚBLICO
            [10,1], //LEI FEDERAL Nº 5.010/66
            [11,8], //DIA DA JUSTIÇA
        ],
        TRF1: [],
        'SE': [
            [5,24], //SÃO JOÃO
            [6,8], //EMANCIPAÇÃO POLÍTICA DE SERGIPE
            [4,31] //Ponto Facultativo 2024
        ],
        'AQUIDABA': [
            [3,4], //EMANCIPAÇÃO POLÍTICA
            [6,26] //PADROEIRA
        ],
        'ARACAJU': [
            [11,8], //PADROEIRA
            [2,17] //ANIVERSÁRIO DE ARACAJU
        ],
        'ARAUA': [
            [3,9], //EMANCIPAÇÃO POLÍTICA
            [9,5], //SÃO BENEDITO
            [11,8] //PADROEIRA
        ],
        'AREIA BRANCA': [
            [10,11], //FUNDAÇÃO DA CIDADE
            [11,8] //PADROEIRA
        ],
        'BARRA DOS COQUEIROS': [
            [10,25], //EMANCIPAÇÃO POLÍTICA
            [11,13] //PADROEIRA
        ],
        'BOQUIM': [
            [2,21], //CRIAÇÃO DO MUNICÍPIO
            [6,26] //PADROEIRA
        ],
        'CAMPO DO BRITO': [
            [7,15], //PADROEIRA
            [9,29] //EMANCIPAÇÃO POLÍTICA
        ],
        'CANINDE DE SAO FRANCISCO': [
            [10,25], //EMANCIPAÇÃO POLÍTICA
            [11,8] //EMANCIPAÇÃO POLÍTICA
        ],
        'CAPELA': [
            [1,2], //PADROEIRO
            [7,28] //EMANCIPAÇÃO POLÍTICA
        ],
        'CARIRA': [
            [4,2], //PADROEIRA
            [10,25] //EMANCIPAÇÃO POLÍTICA
        ],
        'CARMOPOLIS': [
            [6,16], //PADROEIRA
            [9,16], //EMANCIPAÇÃO POLÍTICA
            [10,29] //DIA DO EVANGÉLICO
        ],
        'CEDRO DE SAO JOAO': [
            [5,24], //PADROEIRO
            [9,4] //EMANCIPAÇÃO POLÍTICA
        ],
        'CRISTINAPOLIS': [
            [3,24], //EMANCIPAÇÃO POLÍTICA
            [6,31], //FERIADO MUNICIPAL EVANGÉLICO
            [9,4] //PADROEIRO
        ],
        'DIVINA PASTORA': [
            [2,13] //EMANCIPAÇÃO POLÍTICA
        ],
        'ESTANCIA': [
            [4,4], //ANIVERSÁRIO DA CIDADE
            [11,12] //PADROEIRA
        ],
        'FREI PAULO': [
            [5,30], //PADROEIRO
            [9,23] //EMANCIPAÇÃO POLÍTICA
        ],
        'GARARU': [
            [2,15], //EMANCIPAÇÃO POLÍTICA
            [4,10], //FESTA DO CRUZEIRO
            [7,15] //DIA DA ASSUNÇÃO DE NOSSA SENHORA
        ],
        'INDIAROBA': [
            [2,28], //EMANCIPAÇÃO POLÍTICA
            [11,8] //PADROEIRA
        ],
        'ITABAIANA': [
            [0,27], //PADROEIRO
            [5,13], //EMANCIPAÇÃO POLÍTICA
            [7,28] //PADROEIRA
        ],
        'ITABAIANINHA': [
            [9,19], //EMANCIPAÇÃO POLÍTICA
            [11,8] //PADROEIRA
        ],
        'ITAPORANGA DAJUDA': [
            [1,2], //PADROEIRA
            [2,28] //EMANCIPAÇÃO POLÍTICA
        ],
        'JAPARATUBA': [
            [5,11], //EMANCIPAÇÃO POLÍTICA
            [11,8] //PADROEIRA
        ],
        'JAPOATA': [
            [10,23], //EMANCIPAÇÃO POLÍTICA
            [10,25] //PADROEIRA
        ],
        'LAGARTO': [
            [3,20], //EMANCIPAÇÃO POLÍTICA
            [8,8] //PADROEIRA
        ],
        'LARANJEIRAS': [
            [5,26], //PADROEIRA
            [7,7] //EMANCIPAÇÃO POLÍTICA
        ],
        'MALHADOR': [
            [2,19], //PADROEIRO
            [10,25] //EMANCIPAÇÃO POLÍTICA
        ],
        'MARUIM': [
            [0,21], //PADROEIRO
            [4,5], //EMANCIPAÇÃO POLÍTICA
            [7,15] //CO-PADROEIRA NOSSA SENHORA DA PAZ
        ],
        'MONTE ALEGRE DE SERGIPE': [
            [5,24], //PADROEIRO
            [10,25] //EMANCIPAÇÃO POLÍTICA
        ],
        'NEOPOLIS': [
            [5,13], //PADROEIRO
            [5,29], //SÃO PEDRO
            [9,7], //NOSSA SENHORA DO ROSÁRIO
            [9,18] //FUNDAÇÃO DA CIDADE
        ],
        'NOSSA SENHORA DA GLORIA': [
            [0,5], //FESTA DOS SANTOS REIS
            [7,15], //PADROEIRA
            [8,26] //EMANCIPAÇÃO POLÍTICA
        ],
        'NOSSA SENHORA DAS DORES': [
            [5,11], //EMANCIPAÇÃO POLÍTICA
            [8,15] //PADROEIRA
        ],
        'SOCORRO': [
            [1,2], //PADROEIRA
            [6,7], //EMANCIPAÇÃO POLÍTICA
            [7,15] //FESTA DE NOSSA SENHORA DO AMPARO
        ],
        'PACATUBA': [
            [10,20], //PADROEIRO
            [10,25] //EMANCIPAÇÃO POLÍTICA
        ],
        'PEDRINHAS': [
            [2,19], //PADROEIRO
            [10,25] //EMANCIPAÇÃO POLÍTICA
        ],
        'PIRAMBU': [
            [1,11], //PADROEIRA
            [10,26] //EMANCIPAÇÃO POLÍTICA
        ],
        'POCO REDONDO': [
            [7,15], //PADROEIRA
            [10,25] //EMANCIPAÇÃO POLÍTICA
        ],
        'POCO VERDE': [
            [0,21], //PADROEIRO
            [4,3], //CO-PADROEIRA
            [10,25] //EMANCIPAÇÃO POLÍTICA
        ],
        'PORTO DA FOLHA': [
            [1,19], //EMANCIPAÇÃO POLÍTICA
            [11,7] //PADROEIRA
        ],
        'PROPRIA': [
            [1,7], //EMANCIPAÇÃO POLÍTICA
            [5,13] //PADROEIRO
        ],
        'RIACHAO DO DANTAS': [
            [4,9], //EMANCIPAÇÃO POLÍTICA
            [10,21] //PADROEIRA
        ],
        'RIACHUELO': [
            [0,25], //EMANCIPAÇÃO POLÍTICA
            [5,11], //BATALHA NAVAL DE RIACHUELO
            [11,8] //PADROEIRA
        ],
        'RIBEIROPOLIS': [
            [9,30], //PADROEIRO
            [11,18] //EMANCIPAÇÃO POLÍTICA
        ],
        'SALGADO': [
            [0,22], //PADROEIRO
            [9,4] //EMANCIPAÇÃO POLÍTICA
        ],
        'SANTANA DO SAO FRANCISCO': [
            [3,6], //EMANCIPAÇÃO POLÍTICA
            [6,26] //PADROEIRA
        ],
        'SANTO AMARO DAS BROTAS': [
            [0,15], //PADROEIRA
            [11,15] //EMANCIPAÇÃO POLÍTICA
        ],
        'SAO CRISTOVAO': [
            [8,8] //PADROEIRA
        ],
        'SAO DOMINGOS': [
            [9,21], //EMANCIPAÇÃO POLÍTICA
            [7,8] //PADROEIRO
        ],
        'SIMAO DIAS': [
            [5,12], //EMANCIPAÇÃO POLÍTICA
            [6,26] //PADROEIRA
        ],
        'TOBIAS BARRETO': [
            [5,7], //ANIVERSÁRIO DE NASCIMENTO DE TOBIAS BARRETO DE MENEZES
            [7,15], //PADROEIRA
            [9,23] //EMANCIPAÇÃO POLÍTICA
        ],
        'UMBAUBA': [
            [1,2], //PADROEIRA
            [1,6] //EMANCIPAÇÃO POLÍTICA
        ]
    }

    datas.nacional.forEach(feriado => {
        resultados.push(new Date(ano, feriado[indexMes], feriado[indexDia]))
    })

    datas.SE.forEach(feriado => {
        resultados.push(new Date(ano, feriado[indexMes], feriado[indexDia]))
    })

    if (tarefaContatar) {
        datas.ARACAJU.forEach(feriado => {
            resultados.push(new Date(ano, feriado[indexMes], feriado[indexDia]))
        })
    }

    if (tarefaAdvogado) {
        datas.justica_nacional.forEach(feriado => {
            resultados.push(new Date(ano, feriado[indexMes], feriado[indexDia]))
        })

        datas.ferias_advogados.forEach(feriado => {
            if (feriado[indexMes] == indexJaneiro) {
                resultados.push(new Date(ano+1, feriado[indexMes], feriado[indexDia]))
                resultados.push(new Date(ano, feriado[indexMes], feriado[indexDia]))
            }
            else {
                resultados.push(new Date(ano, feriado[indexMes], feriado[indexDia]))
                resultados.push(new Date(ano-1, feriado[indexMes], feriado[indexDia]))
            }
        })
        
        const date = Object.entries(datas)

        if (competenciaNormalizada) {
            for (const [jurisdicao, feriados] of date) {
                    if (competenciaNormalizada.includes(jurisdicao)) {
                        feriados.forEach(feriado => {
                            resultados.push(new Date(ano, feriado[indexMes], feriado[indexDia]))
                        })
                    }
            }
        }
    }

    datas.recesso_forense.forEach(feriado => {
        if (feriado[indexMes] == indexJaneiro) {
            resultados.push(new Date(ano+1, feriado[indexMes], feriado[indexDia]))
            resultados.push(new Date(ano, feriado[indexMes], feriado[indexDia]))
        }
        else {
            resultados.push(new Date(ano, feriado[indexMes], feriado[indexDia]))
            resultados.push(new Date(ano-1, feriado[indexMes], feriado[indexDia]))
        }
    })
    
    return resultados
}

function calculaFeriados(competencia, parametro) {
    const date = new Date(),
        ano = date.getFullYear(),
        fixos = FeriadosFixos(ano,competencia, parametro),
        pascoa = calculaPascoa(ano),
        date_1 = new Date(pascoa.valueOf()),
        date_2 = new Date(pascoa.valueOf()),
        date_3 = new Date(pascoa.valueOf()),
        date_4 = new Date(pascoa.valueOf()),
        date_5 = new Date(pascoa.valueOf()),
        date_6 = new Date(pascoa.valueOf()),
        date_7 = new Date(pascoa.valueOf()),
        quarta_santa = new Date (date_1.setDate(pascoa.getDate()-4)),
        quinta_santa = new Date (date_2.setDate(pascoa.getDate()-3)),
        paixao = new Date (date_3.setDate(pascoa.getDate()-2)),
        segunda_carnaval = new Date (date_4.setDate(pascoa.getDate()-48)),
        terca_carnaval = new Date (date_5.setDate(pascoa.getDate()-47)),
        quarta_cinzas = new Date (date_6.setDate(pascoa.getDate()-46)),
        corpus = new Date (date_7.setDate(pascoa.getDate()+60)),
        variaveis = [segunda_carnaval,terca_carnaval,quarta_cinzas,quarta_santa,quinta_santa,paixao,pascoa,corpus],
        feriados = []

    fixos.forEach(e => {
        feriados.push(e)
    })

    variaveis.forEach(e => {
        feriados.push(e)
    })

    return feriados
}

async function copiar() {
    const message = {texto: genTXT.innerHTML}
    const queryOptions = { active: true, currentWindow: true }
    const callback = async (response) => {
        if (!chrome.runtime.lastError) {
            console.log("Copiado! Mensagem: " + response.resposta)
        } else {
            console.log("Houve um erro: " + chrome.runtime.lastError.message)
        }
    }

    sendMessageInnerTabs(message, callback, queryOptions)
}

async function restore() {
    const restored = await getAnaliseOld()

    loadInfoAnalise(restored)
}

function reset () {
    const resetar = document.querySelectorAll(".reset")

    resetar.forEach(e => {
        e.value = ""
    })
    genTXT.innerText = ""
    tarefaAvulsa.checked = false
    updateSection()
    resetIcons()
    limpartDataProcessList()
    processo.focus()
}

function existeOrigem() {
    debugger
    const processoValue = processo.value.length ? "'" + processo.value : '-'
    const origemValue = origem.value.length ? "'" + origem.value : '-'
    //dependente origem
    if (origem.value.length)
        return [origemValue, processoValue]
    return [processoValue, origemValue]
}

async function gerarTxt (executor) {
    const init = `${prazoInicial.value.slice(8,10)}/${prazoInicial.value.slice(5,7)}`,
        final = `${prazoFinal.value.slice(8,10)}/${prazoFinal.value.slice(5,7)}`

    if (fileFormatIS.value === 'excel') {
        if (executor !== "OK") {
            const dataInicial = new Date(prazoInicial.value + 'T00:00:00')
            const prazoInterno = dataInicial.toLocaleDateString()
            const dataFinal = new Date(prazoFinal.value + 'T00:00:00')
            const prazoFatal = dataFinal.toLocaleDateString()
            const [processoOrigem, processoDependente] = existeOrigem()
            const description = tipoIntimacao.value
            const peritoReu = perito.value || reu.value
            const local = localPericia.value || localAudiencia.value
            
            genTXT.innerHTML = `<table>
                                    <tbody>
                                        <tr style="text-align: center;">
                                            <td>${processoOrigem}</td>
                                            <td>${processoDependente}</td>
                                            <td>${description.length ? description : "-"}</td>
                                            <td>${prazoInterno.length ? prazoInterno : "-"}</td>
                                            <td>${prazoFatal.length ? prazoFatal : "-"}</td>
                                            <td>${horario.value.length ? horario.value : "-"}</td>
                                            <td>${peritoReu.length ? peritoReu : "-"}</td>
                                            <td>${local.length ? local : "-"}</td>
                                            <td>${executor}</td>
                                            <td>${tarefaAvulsa.checked ? "SIM" : "NÃO"}</td>
                                            <td>-</td>
                                        </tr>
                                    </tbody>
                                </table>`
            // Processo	Dependente	Descrição	Prazo Interno	Prazo Fatal	Horário	Perito/Réu	Local	Executor	Tarefa Avulsa	Justificativa`
        } else {
            genTXT.innerHTML = `<table>
                <tbody>
                    <tr style="text-align: center;">
                        <td>-</td>
                        <td>-</td>
                        <td>OK</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>`
        }
    } else {
        if (tarefaAvulsa.checked && executor !== "OK")
            executor += " (TAREFA AVULSA)"
    
        let data
    
        if (init == final)
            if (horario.value.length)
                data = `(${init} ÀS ${horario.value})`
            else
                data = `(${init})`
        else
            data = `(${init} - ${final})`
    
        if ((localPericia.value.length || perito.value.length) && executor !== "OK")
            if (origem.value.length && executor !== "OK")
                genTXT.innerHTML = `<strong>${processo.value} (ORIGEM ${origem.value}) - ${tipoIntimacao.value} - ${data} - ${executor}</strong><br>PERITO: ${perito.value}<br>LOCAL: ${localPericia.value}`
            else
                if (executor !== "OK")
                    genTXT.innerHTML = `<strong>${processo.value} - ${tipoIntimacao.value} - ${data} - ${executor}</strong><br>PERITO: ${perito.value}<br>LOCAL: ${localPericia.value}`
                else
                    genTXT.innerHTML = `<strong>${executor}</strong>`
        else
            if (localAudiencia.value.length || reu.value.length)
                if (origem.value.length && executor !== "OK")
                    genTXT.innerHTML = `<strong>${processo.value} (ORIGEM ${origem.value}) - ${tipoIntimacao.value} - ${data} - ${executor}</strong><br>RÉU: ${reu.value}<br>LOCAL: ${localAudiencia.value}`
                else
                    if (executor !== "OK")
                        genTXT.innerHTML = `<strong>${processo.value} - ${tipoIntimacao.value} - ${data} - ${executor}</strong><br>RÉU: ${reu.value}<br>LOCAL: ${localAudiencia.value}`
                    else
                        genTXT.innerHTML = `<strong>${executor}</strong>`
            else
                if (origem.value.length && executor !== "OK")
                    genTXT.innerHTML = `<strong>${processo.value} (ORIGEM ${origem.value}) - ${tipoIntimacao.value} - ${data} - ${executor}</strong>`
                else
                    if (executor !== "OK")
                        genTXT.innerHTML = `<strong>${processo.value} - ${tipoIntimacao.value} - ${data} - ${executor}</strong>`
                    else
                        genTXT.innerHTML = `<strong>${executor}</strong>`
    }


    await copiar()
    
}

function getExecutor (setor) {
    const intimacao = tipoIntimacao.value.toUpperCase()
    let numero_processo = processo.value,
        digito_indice,
        digito

    if (origem.value.length) {
        digito_indice = origem.value.length-1
        digito = origem.value[digito_indice]
        numero_processo = origem.value
    }
    else {
        digito_indice = processo.value.length-1
        digito = processo.value[digito_indice]
    }

    /* if (setor == "BANCÁRIO") {
        const rodrigo = ['5']
        const gabriel = ['1','4','9']
        if (rodrigo.includes(digito) || intimacao.search("PAUTA") > -1 || intimacao.search("AUDIÊNCIA") == 0){
            return "RODRIGO"
        }
        if (gabriel.includes(digito)) {
            return "GABRIEL"
        }
        return "LAIS"
    } */
    if (setor == "CÍVEL") {
        const ala = ['0','1', '8']
        const gabriel = ['2','3', '4', '6']
        //const rodrigo = ['5','7','9','4','6','8']
        if (intimacao.search("AUDIÊNCIA") != 0 && numero_processo.length === 12) {
            if (gabriel.includes(digito))
                return "GABRIEL"
            if (ala.includes(digito))
                return "ALÃ"   
        }
        return "RODRIGO"
    }

    if (setor == "PREVIDENCIÁRIA")
        return "KEVEN"

    if (setor == "ADM")
        return "(ADM)"

    if (setor == "FINANCEIRA")
        return "(FINANCEIRO)"

    if (setor == "TRABALHISTA")
        return "FELIPE"

    return "OK"
}

async function loadInfoAnalise (getIS) {
    
    if (getIS.fileFormatIS)
        fileFormatIS.value = getIS.fileFormatIS

    if (getIS.publicacao)
        publicacao.value = getIS.publicacao

    if (getIS.processo)
        processo.value = getIS.processo

    if (getIS.origem)
        origem.value = getIS.origem

    if (getIS.tipoIntimacao)
        tipoIntimacao.value = getIS.tipoIntimacao

    if (getIS.prazoInicial)
        prazoInicial.value = getIS.prazoInicial

    if (getIS.prazoFinal)
        prazoFinal.value = getIS.prazoFinal

    if (getIS.horario)
        horario.value = getIS.horario

    if (getIS.tarefaAvulsa)
        tarefaAvulsa.checked = true

    if (getIS.infoPericia.perito)
        perito.value = getIS.infoPericia.perito

    if (getIS.infoPericia.local)
        localPericia.value = getIS.infoPericia.local

    if (getIS.infoAudiencia.reu)
        reu.value = getIS.infoAudiencia.reu

    if (getIS.infoAudiencia.local)
        localAudiencia.value = getIS.infoAudiencia.local
    
    updateSection(tipoIntimacao.value)
    atualizaFocus()
}

function saveInfoAnalise () {

    const is = {
        fileFormatIS: null,
        publicacao: null,
        processo: null,
        origem: null,
        tipoIntimacao: null,
        prazoInicial: null,
        prazoFinal: null,
        horario: null,
        tarefaAvulsa: null,
        infoAudiencia: {
            reu: null,
            local: null
        },
        infoPericia: {
            perito: null,
            local: null
        }
    }

    if (fileFormatIS.value.length)
        is.fileFormatIS = fileFormatIS.value

    if (publicacao.value.length)
        is.publicacao = publicacao.value

    if (processo.value.length)
        is.processo = removeCaracteresProcesso(processo.value)

    if (origem.value.length)
        is.origem = removeCaracteresProcesso(origem.value)

    if (tipoIntimacao.value.length)
        is.tipoIntimacao = tipoIntimacao.value

    if (prazoInicial.value.length)
        is.prazoInicial = prazoInicial.value

    if (prazoFinal.value.length)
        is.prazoFinal = prazoFinal.value

    if (horario.value.length)
        is.horario = horario.value

    is.tarefaAvulsa = tarefaAvulsa.checked
    
    if (perito.value.length)
        is.infoPericia.perito = perito.value

    if (localPericia.value.length)
        is.infoPericia.local = localPericia.value

    if (reu.value.length)
        is.infoAudiencia.reu = reu.value

    if (localAudiencia.value.length)
        is.infoAudiencia.local = localAudiencia.value

    return is
}

function resetAnalise() {
    const is = {
        fileFormatIS: fileFormatIS.value,
        publicacao: publicacao.value,
        processo: null,
        origem: null,
        tipoIntimacao: null,
        prazoInicial: null,
        prazoFinal: null,
        horario: null,
        tarefaAvulsa: null,
        infoAudiencia: {
            reu: null,
            local: null
        },
        infoPericia: {
            perito: null,
            local: null
        }
    }

    return is
}

function removeAcentuacaoString (string) {
    return string.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
}

function isFeriado (date,competencia, parametro) {
    let feriado = false
    const feriados = calculaFeriados(competencia, parametro)

    feriados.forEach(e => {
        if (e.toDateString() == date.toDateString()) {
            feriado = true
        }
    })

    return feriado
}

function calcularPrazo (prazo, competencia, parametro) {

    const tarefaAdvogado = (parametro == 2),
        domingo = 0,
        sabado = 6,
        StringTipoIntimacao = removeAcentuacaoString(tipoIntimacao.value).toUpperCase(),
        isSentenca = (StringTipoIntimacao.search("SENTENCA") === 0),
        isDecisao = (StringTipoIntimacao.search("DECISAO") === 0),
        isAcordao = (StringTipoIntimacao.search("ACORDAO") === 0),
        isSentencaOrAcordaoOrDecisao = (isSentenca || isDecisao || isAcordao)

    let dataFinal = new Date(),
        dataInicial = new Date(),
        diasInterno = Number(prazo),
        diasFatal = Number(prazo),
        cont = 1,
        dayOfWeek

    if (publicacao.value.length && tarefaAdvogado) {
        const [ diaPublicacao, mesPublicacao, anoPublicacao] = publicacao.value.split('-')
        dataFinal = new Date(diaPublicacao, Number(mesPublicacao)-1, anoPublicacao)
        dataInicial = new Date(diaPublicacao, Number(mesPublicacao)-1, anoPublicacao)
    }

    while (diasFatal >= cont) {
        dataFinal.setDate(dataFinal.getDate() + 1)
        dayOfWeek = dataFinal.getDay()

        const notFimDeSemana = (dayOfWeek > domingo && dayOfWeek < sabado),
            isDiaUtil = notFimDeSemana && !isFeriado(dataFinal, competencia, parametro)

        if (isDiaUtil) {
            cont = cont + 1
        }
    }

    let ano = dataFinal.getFullYear(),
        mes = dataFinal.getMonth() + 1,
        dia =  dataFinal.getDate()

    prazoFinal.value = formataData(dia, mes, ano)


    if (isSentencaOrAcordaoOrDecisao) {
        if (diasFatal > 1)
            diasInterno = (portal == 'TJ' ? 3 : 2)
    } else {
        if (diasFatal != 5 && diasFatal > 5)
            diasInterno = diasFatal-3
        if (diasFatal == 5)
            diasInterno = (portal == 'TJ' ? 3 : 2)

    }

    cont = 1

    while (diasInterno >= cont) {
        dataInicial.setDate(dataInicial.getDate() + 1)
        dayOfWeek = dataInicial.getDay()

        const notFimDeSemana = (dayOfWeek > domingo && dayOfWeek < sabado)
        const dateIsFeriado = isFeriado(dataInicial,competencia, parametro)
        
        if (diasInterno >= cont) {
            if (!dateIsFeriado && notFimDeSemana) {
                cont = cont + 1
            }
        }
        else {
            if (dateIsFeriado && notFimDeSemana) {
                    dataInicial.setDate(dataInicial.getDate() - 1)
                    cont = cont + 1
            }
            else
                if (notFimDeSemana)
                    cont = cont + 1
        }
    }
    
    ano = dataInicial.getFullYear()
    mes = dataInicial.getMonth()+1
    dia = dataInicial.getDate()
    prazoInicial.value = formataData(dia, mes, ano)
}

function formataData (dia, mes, ano) {
    if (mes < 10)
        mes = `0${mes}`
    if (dia < 10)
        dia = `0${dia}`
    return `${ano}-${mes}-${dia}`
}

function atualizaFocus() {
    for (let index = 0; index < focar.length; index++) {
        if (focar[index].value.length == 0) {
            focar[index].focus()
            break
        }
    }
}

function updateSection (intimacao = null) {
    divAudiencia.classList.add('oculto')
    divPericia.classList.add('oculto')

    if (intimacao) {
        const intimacaoNormalizada = removeAcentuacaoString(intimacao),
            isAudiencia = (intimacaoNormalizada.search('PERICIA') === 0),
            isPericia = (intimacaoNormalizada.search('AUDIENCIA') === 0)
        if (isAudiencia){
            divPericia.classList.remove('oculto')
        }

        if (isPericia) {
            divAudiencia.classList.remove('oculto')
        }
    }

}

function autoComplete(tipo) {

    const tipo_intimacao = ['manifestaçao','sentença','decisão','pauta','emendar','acórdão','arquivo','audiência','perícia']
    
    return tipo_intimacao.filter((valor) => {
            const valor_maiusculo = valor.toUpperCase()
            const tipo_maiusculo = tipo.toUpperCase()

            return valor_maiusculo.includes(tipo_maiusculo)
        })
}

function addListeners () {
    let indice = -1
    const sugestoesTipoIntimacao = document.querySelector("#sugestoes"),
        sugestoesAudiencia = document.querySelector("#sugestoes-audiencia"),
        termosTiposIntimacao = ['MANIFESTAÇÃO','MANIFESTAÇÃO SOBRE DOCUMENTOS','MANIFESTAÇÃO SOBRE PERÍCIA','MANIFESTAÇÃO SOBRE ACORDO','MANIFESTAÇÃO SOBRE CÁLCULOS','MANIFESTAÇÃO SOBRE LAUDO', 'MANIFESTAÇÃO SOBRE LAUDO COMPLEMENTAR','AUDIÊNCIA DE CONCILIAÇÃO','AUDIÊNCIA INICIAL','AUDIÊNCIA DE INSTRUÇÃO','AUDIÊNCIA DE INSTRUÇÃO E JULGAMENTO','AUDIÊNCIA UNA','EMENDAR','DECISÃO','DECISÃO SUSPENSÃO','DECISÃO INCOMPETÊNCIA','DECISÃO + RECOLHER CUSTAS','PERÍCIA MÉDICA','PERÍCIA TÉCNICA','PERÍCIA GRAFOTÉCNICA','PERÍCIA PAPILOSCÓPICA','PERÍCIA PSIQUIÁTRICA','PERÍCIA PSICOLÓGICA','ACÓRDÃO','SENTENÇA','PAUTA','CONTRARRAZÕES','DESPACHO','ARQUIVO','INDICAR BENS','DADOS BANCÁRIOS','ALVARÁ','DESPACHO ALVARÁ','RPV','PROVAS','RÉPLICA','REMESSA','DESCIDA DOS AUTOS','TERMO DE AUDIÊNCIA','JULGAMENTO ANTECIPADO','MANIFESTAÇÃO SOBRE DEPÓSITO','QUESITOS + INDICAR TÉCNICOS','QUESITOS','MANIFESTAÇÃO SOBRE HONORÁRIOS','MANIFESTAÇÃO SOBRE ALVARÁ','PLANILHA','MANIFESTAÇÃO SOBRE SISBAJUD','RETIRADO DE PAUTA','RAZÕES FINAIS','MANIFESTAÇÃO SOBRE INFOJUD','DILAÇÃO','ATO ORDINATÓRIO','REMESSA CEJUSC','RECOLHER CUSTAS','AUDIÊNCIA DE INTERROGATÓRIO','MANIFESTAÇÃO SOBRE CERTIDÃO', 'MANIFESTAÇÃO SOBRE OFÍCIO', 'ANÁLISE CUMPRIMENTO', 'MANIFESTAÇÃO SOBRE CUMPRIMENTO', 'MANIFESTAÇÃO SOBRE CONCILIAÇÃO + PROVAS','MANIFESTAÇÃO SOBRE RENAJUD', 'MANIFESTAÇÃO SOBRE CNIB', 'MANIFESTAÇÃO SOBRE PERITO + INDICAR TÉCNICOS + QUESITOS', 'CONTRARRAZÕES + CONTRAMINUTA', 'ANÁLISE DE SENTENÇA', 'RECURSO DE REVISTA', 'RECURSO ORDINÁRIO', 'AGRAVO INTERNO', 'EMBARGOS À EXECUÇÃO', 'AGRAVO DE PETIÇÃO', 'RESPOSTA À EXCEÇÃO DE INCOMPETÊNCIA', 'MANIFESTAÇÃO SOBRE EMBARGOS', 'AGRAVO DE INSTRUMENTO', 'ANÁLISE DE ACÓRDÃO', 'ANÁLISE DE DESPACHO', 'INDICAR ENDEREÇO', 'PROMOVER EXECUÇÃO', 'PROSSEGUIR EXECUÇÃO', 'ACOMPANHAR CUMPRIMENTO', 'MANIFESTAÇÃO SOBRE PREVJUD', 'MANIFESTAÇÃO SOBRE SNIPER', 'MANIFESTAÇÃO SOBRE QUITAÇÃO', 'MANIFESTAÇÃO SOBRE PAGAMENTO', 'MANIFESTAÇÃO SOBRE LITISPENDÊNCIA', 'MANIFESTAÇÃO SOBRE AR', 'MANIFESTAÇÃO SOBRE MANDADO', 'MANIFESTAÇÃO SOBRE IMPUGNAÇÃO', 'MANIFESTAÇÃO SOBRE PENHORA', 'MANIFESTAÇÃO SOBRE REALIZAÇÃO DA PERÍCIA', 'MANIFESTAÇÃO SOBRE EXCEÇÃO DE PRÉ-EXECUTIVIDADE', 'PERÍCIA SOCIAL', 'MANIFESTAÇÃO SOBRE PRESCRIÇÃO', 'DECISÃO + QUESITOS', 'MANIFESTAÇÃO SOBRE BACENJUD', 'CONTRAMINUTA'],
        termosLocaisAudiencias = Object.keys(locaisAudiencias)

    const resetIndex = () => {
        indice = -1
    }
    
    const autocompleteMatch = (input, arrayTermos) => {
        const inputValueNormalizado = removeAcentuacaoString(input.value.trim()),
            regex = new RegExp(inputValueNormalizado)

        if (input.length)
            return []
        
        const sugestoes = arrayTermos.filter(termo => removeAcentuacaoString(termo).match(regex))

        return sugestoes
    }
    
    const mostrarResultados =  (input, arrayTermos, divSugestoes) => {

        const config = (divSugestoes) => {
            const lis = divSugestoes.querySelectorAll('ul li')
            
            lis.forEach(li => {
                li.addEventListener('mouseover', resetIndex)
                li.addEventListener('mouseleave', resetIndex)
                li.addEventListener('click', event => {
                    input.value = event.target.innerHTML
                    divSugestoes.style.display = 'none'
                    setAnalise(saveInfoAnalise())
                    updateSection(tipoIntimacao.value)
                    resetIndex()
                })
            })
        }

        const termos = autocompleteMatch(input, arrayTermos)
        
        const lista = termos.reduce((previous, current) => `${previous}<li>${current}</li>`, "")
        
        divSugestoes.innerHTML = `<ul>${lista}</ul>`

        if (input.value.length) {
            divSugestoes.style.display = 'block'
            config(divSugestoes)
        } else {
            divSugestoes.style.display = 'none'
        }
    }

    const numberProcessValidation = (target, icon) => {
        target.value = removeCaracteresProcesso(target.value)
        if (target.value) {
            target.setAttribute("readOnly",true)
            setTimeout(() => {
                sendMessageCheck(target, icon)
            }, 10)
        }
    }

    const delayForShowResults = (element, termosElement, sugestoesTiposElement) => {
        setTimeout(() => {
            mostrarResultados(element, termosElement, sugestoesTiposElement)
        }, 100)
    }

    const updateDisplayElement = (element) => {
        setTimeout(() => {
            element.style.display = 'none'
            resetIndex()
        }, 200)
    }

    processo.addEventListener('input', ({ target }) => numberProcessValidation(target, icon))

    origem.addEventListener('input', ({ target }) => numberProcessValidation(target, iconOrigem))

    tipoIntimacao.addEventListener('input', ({ target }) => delayForShowResults(target, termosTiposIntimacao, sugestoesTipoIntimacao))

    tipoIntimacao.addEventListener('focus', ({ target }) => delayForShowResults(target, termosTiposIntimacao, sugestoesTipoIntimacao))

    tipoIntimacao.addEventListener('blur', () => updateDisplayElement(sugestoesTipoIntimacao))
    
    localAudiencia.addEventListener('input', ({ target }) => delayForShowResults(target, termosLocaisAudiencias, sugestoesAudiencia))

    localAudiencia.addEventListener('focus', ({ target }) => delayForShowResults(target, termosLocaisAudiencias, sugestoesAudiencia))

    localAudiencia.addEventListener('blur', () => updateDisplayElement(sugestoesAudiencia))

    document.addEventListener('keydown', event => {
        let elements = document.querySelectorAll('#sugestoes > ul > li'),
            input = sugestoesTipoIntimacao

        if (document.activeElement === localAudiencia) {
            elements = document.querySelectorAll('#sugestoes-audiencia > ul > li')
            input = sugestoesAudiencia
        }

        if (input.style.display != "none") {
            if (event.key === "ArrowUp") {
                if (indice > 0) {
                    --indice
                    elements.forEach(e => {
                        e.style.background = 'none'
                    })
                    elements[indice].style.background = "rgba(172, 172, 172, 0.8)"
                }
            }
            if (event.key === "ArrowDown") {
                if (indice < elements.length-1) {
                    ++indice
                    elements.forEach(e => {
                        e.style.background = 'none'
                    })
                    elements[indice].style.background = "rgba(172, 172, 172, 0.8)"
                }
            }
            if (event.key === "Enter") {
                elements[indice].click()
            }

            if (document.activeElement === tipoIntimacao) {
                updateSection(tipoIntimacao.value)
            }
        }
    })

    fileFormatIS.forEach(radio => {
        radio.addEventListener('change', async () => {
            await setAnalise(saveInfoAnalise())
        })
    })
    
    seletor.forEach(element => {
        element.addEventListener('input', async event => {
            event.target.value = event.target.value.toUpperCase()
            if (event.target == tipoIntimacao) {
                updateSection(event.target.value)
            }
            if (event.target == prazoFinal)
                prazoInicial.value = prazoFinal.value

            await setAnalise(saveInfoAnalise())
        })
    })

    btnSetor.forEach(element => {
        element.addEventListener("click", event => {
            let setor = event.target.value
            let executor = getExecutor(setor)
            if (dataProcessDiv.style.display !== "none" || setor === "OK") {
                if (setor !== processNature.innerHTML) {
                    processNature.parentElement.classList.add("fail")
                } else {
                    processNature.parentElement.classList.remove("fail")
                }
                gerarTxt(executor)
                setAnaliseOld(saveInfoAnalise())
                setAnalise(resetAnalise())
            }
        })
    })

    btnPrazo.forEach(element => {
        element.addEventListener("click", event => {
            const { value } = event.target
            let prazo = value
            let parametro = 2
            
            if (value == "Contatar Cliente") {
                prazo = 1
                parametro = 1
            }

            getLocalProcesso(prazo, parametro)
        })
    })

    resetBtn.addEventListener("click", reset)

    restoreBtn.addEventListener("click", restore)

    publicacao.addEventListener('change', () => setAnalise(saveInfoAnalise()))
};


(async function () {
    addListeners()
    loadInfoAnalise(await getAnalise())
}) ()
