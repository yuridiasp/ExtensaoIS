async function requestDataCliente(params) {
    
    const modules = {
        processos: {
            link: "http://fabioribeiro.eastus.cloudapp.azure.com/adv/processos/formulario.asp?idPK=",
            functionRequest: extrairDadosRequisicaoProcessoHtml
        }
    }
    
    const { link, functionRequest } = modules[params.module]
    const doc = await ajax(link, params.id)

    return await functionRequest(doc)
}

async function ajax(link, id) {
    
    const parser = new DOMParser()

    const urlRequest = `${link}${id}`

    return await fetch(urlRequest, {
        method: "GET",
        body: null,
        headers: new Headers({
            'Content-Type': 'application/x-www-form-urlencoded'
        })
    }).then(function (response) {
        return response.blob()
    }).catch((error) => {
        console.log(error)
        return null
    }).then(async (result) => parser.parseFromString(await result.text(),'text/html'))
}

function extrairDadosRequisicaoProcessoHtml(response) {
    if (!response)
        return response
    
    const dataClient = {
        idCliente: response.documentElement.querySelector("#fdt-form > input[type=hidden]:nth-child(2)").value.toUpperCase(),
        processo: {
            id: response.documentElement.querySelector("#fdt-form > input[type=hidden]:nth-child(1)").value.toUpperCase(),
            origem: response.documentElement.querySelector("#numero").value.toUpperCase(),
            reu: response.documentElement.querySelector("#nomeReu").value.toUpperCase(),
        }
    }

    const selectResponsavelProcesso = response.documentElement.querySelector("#idResponsavel")
    const indexResponsavelProcesso = selectResponsavelProcesso.selectedIndex
    dataClient.processo.responsavel = indexResponsavelProcesso === -1 ? "" : selectResponsavelProcesso.options[indexResponsavelProcesso].innerText.toUpperCase()
    

    const selectNaturezaProcesso = response.documentElement.querySelector("#idNatureza")
    const indexNaturezaProcesso = selectNaturezaProcesso.selectedIndex
    dataClient.processo.natureza = indexNaturezaProcesso === -1 ? 0 : selectNaturezaProcesso.options[indexNaturezaProcesso].innerText.toUpperCase()

    const selectMeritoProcesso = response.documentElement.querySelector("#idMerito")
    const indexMeritoProcesso = selectMeritoProcesso.selectedIndex
    dataClient.processo.merito = indexMeritoProcesso === -1 ? 0 : selectMeritoProcesso.options[indexMeritoProcesso].innerText.toUpperCase()

    const selectCidadeProcesso = response.documentElement.querySelector("#lstCidade")
    const indexCidadeProcesso = selectCidadeProcesso.selectedIndex
    dataClient.processo.cidade = indexCidadeProcesso === -1 ? 0 : selectCidadeProcesso.options[indexCidadeProcesso].innerText.toUpperCase()
    
    const selectEstadoProcesso = response.documentElement.querySelector("#lstEstado")
    const indexEstadoProcesso = selectEstadoProcesso.selectedIndex
    dataClient.processo.estado = indexEstadoProcesso === -1 ? 0 : selectEstadoProcesso.options[indexEstadoProcesso].value.toUpperCase()

    const selectVaraProcesso = response.documentElement.querySelector("#idVara")
    const indexVaraProcesso = selectVaraProcesso.selectedIndex
    dataClient.processo.vara = indexVaraProcesso === -1 ? 0 : selectVaraProcesso.options[indexVaraProcesso].innerText.toUpperCase()

    return dataClient
}