const processo = document.querySelector("#processo")
const origem = document.querySelector("#origem")
const tipoIntimacao = document.querySelector("#tipoIntimacao")
const prazoInicial = document.querySelector("#prazoInicial")
const prazoFinal = document.querySelector("#prazoFinal")
const horario = document.querySelector("#horario")
const genTXT = document.querySelector("#genTXT")
const btnSetor = document.querySelectorAll(".btn-exc")
const seletor = document.querySelectorAll(".seletor")
const focar = document.querySelectorAll(".focar")
const btnPrazo = document.querySelectorAll(".prazo")
const resetBtn = document.querySelector("#reset")
const restoreBtn = document.querySelector("#restore")
const dataPub = document.querySelector('#publicacao')
const secaoProcesso = document.querySelector('#processoCampos')
const divPericia = document.querySelector('#divPericia')
const divAudiencia = document.querySelector('#divAudiencia')
const perito = document.querySelector('#perito')
const localPericia = document.querySelector('#localPericia')
const reu = document.querySelector('#reu')
const localAudiencia = document.querySelector('#localAudiencia')

async function sendMessage(prazo, parametro) {
    chrome.tabs.query({}, function(tabs) {
        let cont = 0
        for (let index = 0; index < tabs.length; index++) {
            
            if (tabs[index].url.search("https://www.tjse.jus.br/tjnet/portaladv/") == 0) {
                break
            }
            cont++   
        }
        chrome.tabs.sendMessage(tabs[cont].id, {get: 'local'}, async function(response) {
            console.log(response.competencia)
            calcularPrazo(prazo,response.competencia, parametro)
            setAnalise(saveInfoAnalise())
        })
    })
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
    let aux = competencia.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    const tarefaContatar = (parametro == 1)
    const tarefaAdvogado = (parametro == 2)
    const indexDia = 1
    const indexMes = 0
    const indexJaneiro = 0

    function setIntervaloFeriadosJudiciario(diaInicio, mesInicio, diaFinal, mesFinal) {
        let feriados = []
        let condicao = true
        let dia = diaInicio
        let mes = mesInicio
        const fimMesDezembro = 31
        const diaPrimeiro = 1

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

    let resultados = []

    const diaInicioForense = 20
    const mesInicioForense = 11
    const diaFimForense = 6
    const mesFimForense = 0

    const forense = setIntervaloFeriadosJudiciario(diaInicioForense, mesInicioForense, diaFimForense, mesFimForense)

    const diaInicioFeriasAdvogados = 20
    const mesInicioFeriasAdvogados = 11
    const diaFimFeriasAdvogados = 20
    const mesFimFeriasAdvogados = 0

    const advogados = setIntervaloFeriadosJudiciario(diaInicioFeriasAdvogados, mesInicioFeriasAdvogados, diaFimFeriasAdvogados, mesFimFeriasAdvogados)

    let datas = { // [mes, dia] (indice do mes de 0 a 11)
        nacional: [
            [0,1], //CONFRATERNIZA????O UNIVERSAL
            [3,21], //TIRADENTES
            [4,1], //DIA DO TRABALHO
            [8,7], //INDEPEND??NCIA DO BRASIL
            [9,12], //DIA DAS CRIAN??AS - DIA DA PADROEIRA DO BRASIL
            [10,2], //FINADOS
            [10,15], //PROCLAMA????O DA REP??BLICA
            [11,25], //NATAL
        ],
        recesso_forense : forense, //Recesso Forense 20/12 a 06/01
        ferias_advogados: advogados, //Recesso dos advogados 20/12 a 20/01 Art. 220 NCPC
        justica_nacional: [
            [7,11], //DIA DO MAGISTRADO
            [9,31], //DIA DO FUNCION??RIO P??BLICO
            [10,1], //LEI FEDERAL N?? 5.010/66
            [11,8] //DIA DA JUSTI??A
        ],
        TRF1: [
            [10,24], //Copa do mundo - Jogo do Brasil
            [10,28], //Copa do mundo - Jogo do Brasil
            [11,2] //Copa do mundo - Jogo do Brasil
        ],
        'SE': [
            [5,24], //S??O JO??O
            [6,8], //EMANCIPA????O POL??TICA DE SERGIPE
            [10,28] //JOGO DA COPA - PORTARIA GP1 72/2022 TJSE
        ],
        'AQUIDABA': [
            [3,4], //EMANCIPA????O POL??TICA
            [6,26] //PADROEIRA
        ],
        'ARACAJU': [
            [11,8], //PADROEIRA
            [2,17] //ANIVERS??RIO DE ARACAJU
        ],
        'ARAUA': [
            [3,9], //EMANCIPA????O POL??TICA
            [9,5], //S??O BENEDITO
            [11,8] //PADROEIRA
        ],
        'AREIA BRANCA': [
            [10,11], //FUNDA????O DA CIDADE
            [11,8] //PADROEIRA
        ],
        'BARRA DOS COQUEIROS': [
            [10,25], //EMANCIPA????O POL??TICA
            [11,13] //PADROEIRA
        ],
        'BOQUIM': [
            [2,21], //CRIA????O DO MUNIC??PIO
            [6,26] //PADROEIRA
        ],
        'CAMPO DO BRITO': [
            [7,15], //PADROEIRA
            [9,29] //EMANCIPA????O POL??TICA
        ],
        'CANINDE DE SAO FRANCISCO': [
            [10,25], //EMANCIPA????O POL??TICA
            [11,8] //EMANCIPA????O POL??TICA
        ],
        'CAPELA': [
            [1,2], //PADROEIRO
            [7,28] //EMANCIPA????O POL??TICA
        ],
        'CARIRA': [
            [4,2], //PADROEIRA
            [10,25] //EMANCIPA????O POL??TICA
        ],
        'CARMOPOLIS': [
            [6,16], //PADROEIRA
            [9,16], //EMANCIPA????O POL??TICA
            [10,29] //DIA DO EVANG??LICO
        ],
        'CEDRO DE SAO JOAO': [
            [5,24], //PADROEIRO
            [9,4] //EMANCIPA????O POL??TICA
        ],
        'CRISTINAPOLIS': [
            [3,24], //EMANCIPA????O POL??TICA
            [6,31], //FERIADO MUNICIPAL EVANG??LICO
            [9,4] //PADROEIRO
        ],
        'DIVINA PASTORA': [
            [2,13] //EMANCIPA????O POL??TICA
        ],
        'ESTANCIA': [
            [4,4], //ANIVERS??RIO DA CIDADE
            [11,12] //PADROEIRA
        ],
        'FREI PAULO': [
            [5,30], //PADROEIRO
            [9,23] //EMANCIPA????O POL??TICA
        ],
        'GARARU': [
            [2,15], //EMANCIPA????O POL??TICA
            [4,10], //FESTA DO CRUZEIRO
            [7,15] //DIA DA ASSUN????O DE NOSSA SENHORA
        ],
        'INDIAROBA': [
            [2,28], //EMANCIPA????O POL??TICA
            [11,8] //PADROEIRA
        ],
        'ITABAIANA': [
            [0,27], //PADROEIRO
            [5,13], //EMANCIPA????O POL??TICA
            [7,28] //PADROEIRA
        ],
        'ITABAIANINHA': [
            [9,19], //EMANCIPA????O POL??TICA
            [11,8] //PADROEIRA
        ],
        'ITAPORANGA DAJUDA': [
            [1,2], //PADROEIRA
            [2,28] //EMANCIPA????O POL??TICA
        ],
        'JAPARATUBA': [
            [5,11], //EMANCIPA????O POL??TICA
            [11,8] //PADROEIRA
        ],
        'JAPOATA': [
            [10,23], //EMANCIPA????O POL??TICA
            [10,25] //PADROEIRA
        ],
        'LAGARTO': [
            [3,20], //EMANCIPA????O POL??TICA
            [8,8] //PADROEIRA
        ],
        'LARANJEIRAS': [
            [5,26], //PADROEIRA
            [7,7] //EMANCIPA????O POL??TICA
        ],
        'MALHADOR': [
            [2,19], //PADROEIRO
            [10,25] //EMANCIPA????O POL??TICA
        ],
        'MARUIM': [
            [0,21], //PADROEIRO
            [4,5], //EMANCIPA????O POL??TICA
            [7,15] //CO-PADROEIRA NOSSA SENHORA DA PAZ
        ],
        'MONTE ALEGRE DE SERGIPE': [
            [5,24], //PADROEIRO
            [10,25] //EMANCIPA????O POL??TICA
        ],
        'NEOPOLIS': [
            [5,13], //PADROEIRO
            [5,29], //S??O PEDRO
            [9,7], //NOSSA SENHORA DO ROS??RIO
            [9,18] //FUNDA????O DA CIDADE
        ],
        'NOSSA SENHORA DA GLORIA': [
            [0,5], //FESTA DOS SANTOS REIS
            [7,15], //PADROEIRA
            [8,26] //EMANCIPA????O POL??TICA
        ],
        'NOSSA SENHORA DAS DORES': [
            [5,11], //EMANCIPA????O POL??TICA
            [8,15] //PADROEIRA
        ],
        'SOCORRO': [
            [1,2], //PADROEIRA
            [6,7], //EMANCIPA????O POL??TICA
            [7,15] //FESTA DE NOSSA SENHORA DO AMPARO
        ],
        'PACATUBA': [
            [10,20], //PADROEIRO
            [10,25] //EMANCIPA????O POL??TICA
        ],
        'PEDRINHAS': [
            [2,19], //PADROEIRO
            [10,25] //EMANCIPA????O POL??TICA
        ],
        'PIRAMBU': [
            [1,11], //PADROEIRA
            [10,26] //EMANCIPA????O POL??TICA
        ],
        'POCO REDONDO': [
            [7,15], //PADROEIRA
            [10,25] //EMANCIPA????O POL??TICA
        ],
        'POCO VERDE': [
            [0,21], //PADROEIRO
            [4,3], //CO-PADROEIRA
            [10,25] //EMANCIPA????O POL??TICA
        ],
        'PORTO DA FOLHA': [
            [1,19], //EMANCIPA????O POL??TICA
            [11,7] //PADROEIRA
        ],
        'PROPRIA': [
            [1,7], //EMANCIPA????O POL??TICA
            [5,13] //PADROEIRO
        ],
        'RIACHAO DO DANTAS': [
            [4,9], //EMANCIPA????O POL??TICA
            [10,21] //PADROEIRA
        ],
        'RIACHUELO': [
            [0,25], //EMANCIPA????O POL??TICA
            [5,11], //BATALHA NAVAL DE RIACHUELO
            [11,8] //PADROEIRA
        ],
        'RIBEIROPOLIS': [
            [9,30], //PADROEIRO
            [11,18] //EMANCIPA????O POL??TICA
        ],
        'SALGADO': [
            [0,22], //PADROEIRO
            [9,4] //EMANCIPA????O POL??TICA
        ],
        'SANTANA DO SAO FRANCISCO': [
            [3,6], //EMANCIPA????O POL??TICA
            [6,26] //PADROEIRA
        ],
        'SANTO AMARO DAS BROTAS': [
            [0,15], //PADROEIRA
            [11,15] //EMANCIPA????O POL??TICA
        ],
        'SAO CRISTOVAO': [
            [8,8] //PADROEIRA
        ],
        'SAO DOMINGOS': [
            [9,21], //EMANCIPA????O POL??TICA
            [7,8] //PADROEIRO
        ],
        'SIMAO DIAS': [
            [5,12], //EMANCIPA????O POL??TICA
            [6,26] //PADROEIRA
        ],
        'TOBIAS BARRETO': [
            [5,7], //ANIVERS??RIO DE NASCIMENTO DE TOBIAS BARRETO DE MENEZES
            [7,15], //PADROEIRA
            [9,23] //EMANCIPA????O POL??TICA
        ],
        'UMBAUBA': [
            [1,2], //PADROEIRA
            [1,6] //EMANCIPA????O POL??TICA
        ]
    }

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
        
        let date = Object.entries(datas)
        for (const [key,value] of date) {
            if (aux.toUpperCase().search(key) > -1){
                value.forEach(feriado => {
                    resultados.push(new Date(ano,feriado[indexMes],feriado[indexDia]))
                })
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

    console.log(resultados)

    return resultados
}

function calculaFeriados(competencia, parametro) {
    let date = new Date()
    let ano = date.getFullYear()
    let fixos = FeriadosFixos(ano,competencia, parametro)
    let pascoa = calculaPascoa(ano)
    let date_1 = new Date(pascoa.valueOf())
    let date_2 = new Date(pascoa.valueOf())
    let date_3 = new Date(pascoa.valueOf())
    let date_4 = new Date(pascoa.valueOf())
    let date_5 = new Date(pascoa.valueOf())
    let date_6 = new Date(pascoa.valueOf())
    let quarta_santa = new Date (date_1.setDate(pascoa.getDate()-4))
    let quinta_santa = new Date (date_2.setDate(pascoa.getDate()-3))
    let paixao = new Date (date_3.setDate(pascoa.getDate()-2))
    let segunda_carnaval = new Date (date_4.setDate(pascoa.getDate()-48))
    let terca_carnaval = new Date (date_5.setDate(pascoa.getDate()-47))
    let corpus = new Date (date_6.setDate(pascoa.getDate()+60))
    let variaveis = [segunda_carnaval,terca_carnaval,quarta_santa,quinta_santa,paixao,pascoa,corpus]
    let feriados = []

    fixos.forEach(e => {
        feriados.push(e)
    })
    variaveis.forEach(e => {
        feriados.push(e)
    })
    return feriados
}

function copiar() {

    navigator.clipboard.writeText(genTXT.value)
        .then(() => {
        console.log("Text copied to clipboard...")
    })
        .catch(err => {
        console.log('Something went wrong', err);
    })
}

async function restore() {
    let restored = await getAnaliseOld()
    loadInfoAnalise(restored)
}

function reset () {
    let resetar = document.querySelectorAll(".reset")
    resetar.forEach(e => {
        e.value = ""
    })
}

function gerarTxt (executor) {
    let init = `${prazoInicial.value.slice(8,10)}/${prazoInicial.value.slice(5,7)}`
    let final = `${prazoFinal.value.slice(8,10)}/${prazoFinal.value.slice(5,7)}`
    let data

    if (init == final)
        if (horario.value.length > 0)
            data = `(${init} ??S ${horario.value})`
        else
            data = `(${init})`
    else
        data = `(${init} - ${final})`
    if ((localPericia.value.length > 0 || perito.value.length > 0) && executor !== "OK") {
        if (origem.value.length > 0 && executor !== "OK")
genTXT.value = `${processo.value} (ORIGEM ${origem.value}) - ${tipoIntimacao.value} - ${data} - ${executor}
PERITO: ${perito.value}
LOCAL: ${localPericia.value}`.toUpperCase()
        else 
            if (executor !== "OK")
genTXT.value = `${processo.value} - ${tipoIntimacao.value} - ${data} - ${executor}
PERITO: ${perito.value}
LOCAL: ${localPericia.value}`.toUpperCase()
            else
                genTXT.value = executor
    }
    else {
        if (localAudiencia.value.length > 0 || reu.value.length > 0) 
            if (origem.value.length > 0 && executor !== "OK")
genTXT.value = `${processo.value} (ORIGEM ${origem.value}) - ${tipoIntimacao.value} - ${data} - ${executor}
R??U: ${reu.value}
LOCAL: ${localAudiencia.value}`.toUpperCase()
            else
genTXT.value = `${processo.value} - ${tipoIntimacao.value} - ${data} - ${executor}
R??U: ${reu.value}
LOCAL: ${localAudiencia.value}`.toUpperCase()
        else {
            if (origem.value.length > 0 && executor !== "OK")
                genTXT.value = `${processo.value} (ORIGEM ${origem.value}) - ${tipoIntimacao.value} - ${data} - ${executor}`.toUpperCase()
            else
                if (executor == "OK")
                    genTXT.value = executor
                else
                    genTXT.value = `${processo.value} - ${tipoIntimacao.value} - ${data} - ${executor}`.toUpperCase()
        }
    }

    copiar()
}

function getExecutor (setor) {
    let digito_indice
    let digito
    let intimacao = tipoIntimacao.value.toUpperCase()

    if (origem.value.length > 0) {
        digito_indice = origem.value.length-1
        digito = origem.value[digito_indice]
    }
    else {
        digito_indice = processo.value.length-1
        digito = processo.value[digito_indice]
    }

    if (setor == "BANC??RIO") {
        const rodrigo = ['5']
        const gabriel = ['1','4','9']
        if (rodrigo.includes(digito) || intimacao.search("PAUTA") > -1 || intimacao.search("AUDI??NCIA") == 0){
            return "RODRIGO"
        }
        if (gabriel.includes(digito)) {
            return "GABRIEL"
        }
        return "ANTONIO"
    }
    if (setor == "C??VIL") {
        let ala = ["0","1","4","6","8"]
        if (ala.includes(digito) && intimacao.search("PAUTA") == -1 && intimacao.search("AUDI??NCIA") != 0)
            return "AL??"
        return "RODRIGO"
    }
    if (setor == "PREVIDENCI??RIO")
        return "KEVEN"
    if (setor == "ADM")
        return "(ADM)"
    if (setor == "FINANCEIRO")
        return "(FINANCEIRO)"
    if (setor == "TRABALHISTA")
        return "VICTOR"
    return "OK"
}

async function loadInfoAnalise (getIS) {
    
    if (getIS.data_publicacao != null)
        dataPub.value = getIS.data_publicacao
    if (getIS.processo != null)
        processo.value = getIS.processo
    if (getIS.origem != null)
        origem.value = getIS.origem
    if (getIS.tipoIntimacao != null)
        tipoIntimacao.value = getIS.tipoIntimacao
    if (getIS.prazoInicial != null)
        prazoInicial.value = getIS.prazoInicial
    if (getIS.prazoFinal != null)
        prazoFinal.value = getIS.prazoFinal
    if (getIS.horario != null)
        horario.value = getIS.horario
    if (perito.value != null)
        perito.value = getIS.infoPericia.perito
    if (localPericia.value != null)
        localPericia.value = getIS.infoPericia.local
    if (reu.value != null)
        reu.value = getIS.infoAudiencia.reu
    if (localAudiencia.value != null)
        localAudiencia.value = getIS.infoAudiencia.local
    
    updateSection(tipoIntimacao.value)
    atualizaFocus()
}

function removeCaracteresProcesso(numeroProcesso) {
    
    let processoFormatado = ''

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    for (let index = 0; index < numeroProcesso.length; index++) {
        if (isNumber(numeroProcesso[index]))
            processoFormatado += numeroProcesso[index]
    }
    return processoFormatado
}

function saveInfoAnalise () {

    let is = {
        data_publicacao: null,
        processo: null,
        origem: null,
        tipoIntimacao: null,
        prazoInicial: null,
        prazoFinal: null,
        horario: null,
        infoAudiencia: {
            reu: null,
            local: null
        },
        infoPericia: {
            perito: null,
            local: null
        }
    }

    if (dataPub.value.length > 0)
        is.data_publicacao = dataPub.value
    if (processo.value.length > 0) {
        is.processo = removeCaracteresProcesso(processo.value)
    }
    if (origem.value.length > 0) {
        is.origem = removeCaracteresProcesso(origem.value)
    }
    if (tipoIntimacao.value.length > 0)
        is.tipoIntimacao = tipoIntimacao.value
    if (prazoInicial.value.length > 0)
        is.prazoInicial = prazoInicial.value
    if (prazoFinal.value.length > 0)
        is.prazoFinal = prazoFinal.value
    if (horario.value.length > 0)
        is.horario = horario.value
    if (perito.value.length > 0)
        is.infoPericia.perito = perito.value
    if (localPericia.value.length > 0)
        is.infoPericia.local = localPericia.value
    if (reu.value.length > 0)
        is.infoAudiencia.reu = reu.value
    if (localAudiencia.value.length > 0)
        is.infoAudiencia.local = localAudiencia.value

    return is
}

function resetAnalise() {
    let is = {
        data_publicacao: dataPub.value,
        processo: null,
        origem: null,
        tipoIntimacao: null,
        prazoInicial: null,
        prazoFinal: null,
        horario: null,
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

function isFeriado (date,competencia, parametro) {
    let feriado = false
    let feriados = calculaFeriados(competencia, parametro)

    feriados.forEach(e => {
        if (e.toDateString() == date.toDateString())
            feriado = true
    })
    return feriado
}

function calcularPrazo (prazo, competencia, parametro) {
    let date_final = new Date()
    let date_inicial = new Date()
    let dias_int = Number(prazo)
    let dias_fat = Number(prazo)
    let cont = 1
    let i
    const tarefaAdvogado = (parametro == 2)

    if ((dataPub.value.length > 0) && tarefaAdvogado) {
        let data = dataPub.value.split('-')
        date_final = new Date(data[0],Number(data[1])-1,Number(data[2]))
        date_inicial = new Date(data[0],Number(data[1])-1,Number(data[2]))
    }

    while (dias_fat >= cont) {
        date_final.setDate(date_final.getDate() + 1)
        i = date_final.getDay()

        if (i > 0 && i < 6 && !isFeriado(date_final,competencia, parametro)) {
            cont = cont + 1
        }
    }
    let ano = date_final.getFullYear()
    let mes = date_final.getMonth()+1
    let dia =  date_final.getDate()
    prazoFinal.value = formataData(dia, mes, ano)

    if (tipoIntimacao.value.toUpperCase() == "SENTEN??A" || tipoIntimacao.value.toUpperCase() == "DECIS??O" || tipoIntimacao.value.toUpperCase() == "AC??RD??O") {
        if (dias_fat > 1)
            dias_int = 3
    } else {
        if (dias_fat != 5 && dias_fat > 5)
            dias_int = dias_fat-3
        if (dias_fat == 5)
            dias_int = 3

    }

    cont = 1

    while (dias_int >= cont) {
        date_inicial.setDate(date_inicial.getDate() + 1)
        i = date_inicial.getDay()
        
        if (dias_int >= cont) {
            if (i > 0 && i < 6 && !isFeriado(date_inicial,competencia, parametro)) {
                cont = cont + 1
            }
        }
        else {
            if (isFeriado(date_inicial,competencia, parametro) && i > 0 && i < 6) {
                    date_inicial.setDate(date_inicial.getDate() - 1)
                    cont = cont + 1
            }
            else
                if (i > 0 && i < 6)
                    cont = cont + 1
        }
    }
    
    ano = date_inicial.getFullYear()
    mes = date_inicial.getMonth()+1
    dia = date_inicial.getDate()
    prazoInicial.value = formataData(dia, mes, ano)
}

function formataData (dia,mes,ano) {
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

function updateSection (intimacao) {
    divAudiencia.classList.add('oculto')
    divPericia.classList.add('oculto')
    if (intimacao != null) {
        if (intimacao.normalize('NFD').replace(/[\u0300-\u036f]/g, "").search('PER??CIA'.normalize('NFD').replace(/[\u0300-\u036f]/g, "")) == 0){
            divPericia.classList.remove('oculto')
        }
        else
            if (intimacao.normalize('NFD').replace(/[\u0300-\u036f]/g, "").search('AUDI??NCIA'.normalize('NFD').replace(/[\u0300-\u036f]/g, "")) == 0) {
                divAudiencia.classList.remove('oculto')
            }
    }

}

function autoComplete(tipo) {

    const tipo_intimacao = ['manifesta??ao','senten??a','decis??o','pauta','emendar','ac??rd??o','arquivo','audi??ncia','per??cia'];
            return tipo_intimacao.filter((valor) => {
                    const valor_maiusculo = valor.toUpperCase()
                    const tipo_maiusculo = tipo.toUpperCase()
    
                    return valor_maiusculo.includes(tipo_maiusculo)
              })
}

function addListeners () {
    let indice = -1
    const campo = document.querySelector('.campo')
    const sugestoes = document.querySelector('.sugestoes')

    styleSugestoes()

    function styleSugestoes() {
        sugestoes.style.position = 'absolute'
        sugestoes.style.border = '1px #ccc'
        sugestoes.style.alignItems = 'center'
        sugestoes.style.padding = '3px'
        sugestoes.style.background = 'rgba(255, 255, 255, 0.8)'
    }
    
    let termos = ['MANIFESTA????O','MANIFESTA????O SOBRE DOCUMENTOS','MANIFESTA????O SOBRE PER??CIA','MANIFESTA????O SOBRE ACORDO','MANIFESTA????O SOBRE C??LCULOS','MANIFESTA????O SOBRE LAUDO','AUDI??NCIA DE CONCILIA????O','AUDI??NCIA INICIAL','AUDI??NCIA DE INSTRU????O','AUDI??NCIA DE INSTRU????O E JULGAMENTO','AUDI??NCIA UNA','EMENDAR','DECIS??O','DECIS??O SUSPENS??O','DECIS??O INCOMPET??NCIA','DECIS??O + RECOLHER CUSTAS','PER??CIA M??DICA','P??RICIA T??CNICA','PER??CIA GRAFOT??CNICA','PER??CIA PAPILOSC??PICA','PER??CIA PSIQUI??TRICA','PER??CIA PSICOL??GICA','AC??RD??O','SENTEN??A','PAUTA','CONTRARRAZ??ES','DESPACHO','ARQUIVO','INDICAR BENS','DADOS BANC??RIOS','ALVAR??','DESPACHO ALVAR??','RPV','PROVAS','R??PLICA','REMESSA','DESCIDA DOS AUTOS','TERMO DE AUDI??NCIA','JULGAMENTO ANTECIPADO','MANIFESTA????O SOBRE DEP??SITO','QUESITOS + INDICAR T??CNICOS','QUESITOS','MANIFESTA????O SOBRE HONOR??RIOS','MANIFESTA????O SOBRE ALVAR??','PLANILHA','MANIFESTA????O SOBRE SISBAJUD','RETIRADO DE PAUTA','RAZ??ES FINAIS','MANIFESTA????O SOBRE INFOJUD','DILA????O','ATO ORDINAT??RIO','REMESSA CEJUSC','RECOLHER CUSTAS','AUDI??NCIA DE INTERROGAT??RIO','MANIFESTA????O SOBRE CERTID??O', 'MANIFESTA????O SOBRE OF??CIO', 'AN??LISE CUMPRIMENTO', 'MANIFESTA????O SOBRE CUMPRIMENTO', 'MANIFESTA????O SOBRE CONCILIA????O + PROVAS','MANIFESTA????O SOBRE RENAJUD', 'MANIFESTA????O SOBRE PERITO + INDICAR T??CNICOS + QUESITOS']
    
    function autocompleteMatch(input) {
        
        let reg = new RegExp(input.value.normalize('NFD').replace(/[\u0300-\u036f]/g, ""))

        if (input.length == 0)
            return []
        
        return termos.filter(termo => {
            if (termo.normalize('NFD').replace(/[\u0300-\u036f]/g, "").match(reg)){
                return termo
            }
        })
    }
    
    function mostrarResultados (input) {
        sugestoes.innerHTML = ''
        let lista = ''
        let termos = autocompleteMatch(input)
        for (i = 0; i < termos.length; i++) {
            lista += '<li>' + termos[i] + '</li>'
        }
        if (campo.value.length > 0) {
            sugestoes.innerHTML = '<ul>' + lista + '</ul>'
            sugestoes.style.display = 'block'
        }
        else
            sugestoes.style.display = 'none'


        
        function config () {
            let ul = document.querySelector('div.sugestoes ul')
            let li = document.querySelectorAll('div.sugestoes ul li')
            
            ul.style.listStyleType = "none"
            ul.style.padding = '0px'
            ul.style.margin = '0px'
            li.forEach(e => {
                e.style.cursor = 'pointer'
                e.style.padding = '5px 0'
                e.style.margin = '0px'
                e.addEventListener('mouseover', element => {
                    li.forEach (el => {
                        el.style.background = 'none'
                    })
                    element.target.style.background = '#eee'
                    indice = -1
                })
                e.addEventListener('mouseleave', () => {
                    li.forEach (el => {
                        el.style.background = 'none'
                    })
                    indice = -1
                })
                e.addEventListener('click', element => {
                    campo.value = element.target.innerHTML
                    sugestoes.style.display = 'none'
                    setAnalise(saveInfoAnalise())
                    updateSection(tipoIntimacao.value)
                })
            })
        }

        config()
    }
    campo.addEventListener('input', e => {
        setTimeout(() => {
            mostrarResultados(e.target)
        }, 100);
    })

    campo.addEventListener('focus', e => {
        setTimeout(() => {
            mostrarResultados(e.target)
        }, 100);
    })

    campo.addEventListener('blur', e => {
        setTimeout(() => {
            sugestoes.style.display = 'none'
        }, 200);
    })

    document.addEventListener('keydown', e => {
        let elements = document.querySelectorAll('#processoCampos > div:nth-child(1) > div:nth-child(2) > div.sugestoes > ul > li')
        console.log(e.key)
        if (sugestoes.style.display != "none") {
            if (e.key == "ArrowUp") {
                if (indice > 0) {
                    --indice
                    elements.forEach(e => {
                        e.style.background = 'none'
                    })
                    elements[indice].style.background = '#eee'
                }
            }
            if (e.key == "ArrowDown") {
                if (indice < elements.length-1) {
                    ++indice
                    elements.forEach(e => {
                        e.style.background = 'none'
                    })
                    elements[indice].style.background = '#eee'
                }
            }
            if (e.key == "Enter")
                elements[indice].click()
                updateSection(tipoIntimacao.value)
        }
            
    })
    
    seletor.forEach(element => {
        element.addEventListener('input', event => {
            event.target.value = event.target.value.toUpperCase()
            if (event.target == tipoIntimacao) {
                updateSection(event.target.value)
            }
            if (event.target == prazoFinal)
                prazoInicial.value = prazoFinal.value
            setAnalise(saveInfoAnalise())
        })
    })
    btnSetor.forEach(element => {
        element.addEventListener("click", event => {
            let setor = event.target.value
            let executor = getExecutor(setor)
            gerarTxt(executor)
            setAnaliseOld(saveInfoAnalise())
            setAnalise(resetAnalise())
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
    resetBtn.addEventListener("click",() => {
        reset()
        updateSection(tipoIntimacao.value)
    })
    restoreBtn.addEventListener("click",() => {
        restore()
    })
    dataPub.addEventListener('change', () => {
        setAnalise(saveInfoAnalise())
    })
}


(async function () {
    addListeners()
    loadInfoAnalise(await getAnalise())
}) ()

