// =========================================
// == SEGURANÇA ============================
// =========================================
document.addEventListener("contextmenu", e => e.preventDefault());
document.onkeydown = function(e) {
    if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
        // Para realmente bloquear, você precisaria adicionar:
        // e.preventDefault();
        // return false;
        // No entanto, para fins de desenvolvimento, muitas vezes é melhor não bloquear completamente.
    }
};

// =========================================
// == VARIÁVEIS GLOBAIS DE CONFIGURAÇÃO ====
// =========================================
let LARGURA_CHAPA = 2750; // Largura da chapa em milímetros (agora pode ser configurada pelo usuário)
let ALTURA_CHAPA = 1850; // Altura da chapa em milímetros (agora pode ser configurada pelo usuário)
let PRECO_CHAPA = 250.00; // Preço unitário de uma chapa (agora pode ser configurado pelo usuário)
let ESPESSURA_MADEIRA = 15; // Espessura da madeira em milímetros (NOVO, configurável pelo usuário)
let TIPO_MATERIAL = 'MDF'; // Tipo de material (NOVO, configurável pelo usuário)
const ESPACO_MM = 5; // Espaçamento mínimo entre peças (corte da serra)

let pecas = [];
let chapas = [];
let chapasIndexAtual = 0;

const $ = id => document.getElementById(id);

// =========================================
// == FUNÇÕES AUXILIARES DE ENCAIXE ========
// =========================================
function verificaEspaco(g, x, y, w, h) {
    const x0 = Math.max(0, x - ESPACO_MM);
    const y0 = Math.max(0, y - ESPACO_MM);
    const x1 = Math.min(LARGURA_CHAPA - 1, x + w + ESPACO_MM - 1);
    const y1 = Math.min(ALTURA_CHAPA - 1, y + h + ESPACO_MM - 1);

    for (let i = y0; i <= y1; i++) {
        for (let j = x0; j <= x1; j++) {
            if (i >= 0 && i < ALTURA_CHAPA && j >= 0 && j < LARGURA_CHAPA && g[i] && g[i][j]) {
                return false;
            }
        }
    }
    return true;
}

function marcaEspaco(g, x, y, w, h) {
    const x0 = Math.max(0, x - ESPACO_MM);
    const y0 = Math.max(0, y - ESPACO_MM);
    const x1 = Math.min(LARGURA_CHAPA - 1, x + w + ESPACO_MM - 1);
    const y1 = Math.min(ALTURA_CHAPA - 1, y + h + ESPACO_MM - 1);

    for (let i = y0; i <= y1; i++) {
        for (let j = x0; j <= x1; j++) {
            if (i >= 0 && i < ALTURA_CHAPA && j >= 0 && j < LARGURA_CHAPA && g[i]) {
                g[i][j] = true;
            }
        }
    }
}

// =========================================
// == GERENCIAMENTO DE PEÇAS GERAL =========
// =========================================
function adicionarPecaGenerica() {
    const tipoPeca = $('tipoPeca').value;
    let largura, altura, quantidade;
    let pecaData = { _tipo: tipoPeca };

    switch (tipoPeca) {
        case 'retangular':
            largura = parseInt($('largura').value);
            altura = parseInt($('altura').value);
            quantidade = parseInt($('quantidade').value);
            if (isNaN(largura) || largura <= 0 || isNaN(altura) || altura <= 0 || isNaN(quantidade) || quantidade <= 0) {
                alert('Valores inválidos para largura, altura ou quantidade.');
                return;
            }
            pecaData = { ...pecaData, largura, altura, quantidade };
            break;

        case 'semicirculo':
            const L = parseInt($('curva-L').value);
            quantidade = parseInt($('curva-quantidade').value);
            const orient = $('curva-orient').value;
            

            if (isNaN(L) || L <= 0 || isNaN(quantidade) || quantidade <= 0) {
                alert('Valores inválidos para o lado reto (L) ou quantidade.');
                return;
            }

            const R_semi = L / 2;

            // Ajuste aqui: Como "Curva à direita" e "Curva à esquerda" foram removidas,
            // as orientações possíveis agora são apenas 'top' e 'bottom'.
            // A largura e altura da caixa de contorno de um semicirculo dependem da sua orientação.
            // Se a curva for 'top' ou 'bottom', a largura é L e a altura é R_semi.
            // Se a curva fosse 'left' ou 'right', a largura seria R_semi e a altura L.
            // Como agora só temos 'top' e 'bottom', a lógica simplifica.
            largura = L;
            altura = R_semi;
            
            pecaData = { ...pecaData, largura, altura, quantidade, L, R: R_semi, orient };
            break;

        case 'circulo':
            const diametro = parseInt($('circulo-diametro').value);
            quantidade = parseInt($('circulo-quantidade').value);
            if (isNaN(diametro) || diametro <= 0 || isNaN(quantidade) || quantidade <= 0) {
                alert('Valores inválidos para o diâmetro ou quantidade.');
                return;
            }
            largura = diametro;
            altura = diametro;
            const R_circ = diametro / 2;
            pecaData = { ...pecaData, largura, altura, quantidade, diametro, R: R_circ };
            break;
    }

    if (largura > LARGURA_CHAPA || altura > ALTURA_CHAPA) {
        alert(`A peça (${largura}x${altura}mm) excede as dimensões máximas da chapa (${LARGURA_CHAPA}x${ALTURA_CHAPA}mm).`);
        return;
    }
    pecas.push(pecaData);
    atualizarListaPecas();
    limparCamposPeca();
}

function limparCamposPeca() {
    $('largura').value = '';
    $('altura').value = '';
    $('quantidade').value = '';
    $('curva-L').value = '';
    $('curva-quantidade').value = '';
    $('curva-orient').value = 'top'; // Garantir que a opção padrão seja 'top'
    
    $('circulo-diametro').value = '';
    $('circulo-quantidade').value = '';
}

function atualizarListaPecas() {
    const ul = $('listaPecas');
    ul.innerHTML = '';

    if (!pecas.length) {
        ul.innerHTML = '<li>Nenhuma peça adicionada.</li>';
        return;
    }

    pecas.forEach((p, i) => {
        const li = document.createElement('li');
        let descr = `${p.quantidade}x `;
        if (p._tipo === 'retangular') {
            descr += `${p.largura}x${p.altura}mm (Retangular)`;
        } else if (p._tipo === 'semicirculo') {
            // A descrição agora reflete que só há 'top' e 'bottom'
            descr += `L=${p.L} R=${p.R}mm Semicírculo ${p.orient}`;
        } else if (p._tipo === 'circulo') {
            descr += `Ø=${p.diametro}mm (Círculo)`;
        }
        li.innerHTML = `${descr} <button onclick="removerPeca(${i})">🗑️</button>`;
        ul.appendChild(li);
    });
}

function removerPeca(index) {
    if (index >= 0 && index < pecas.length) {
        pecas.splice(index, 1);
        atualizarListaPecas();
    }
}

// =========================================
// == ALGORITMO DE CORTE ===================
// =========================================
function calcularCorte() {
    // Captura os valores de configuração da chapa antes de iniciar o cálculo
    LARGURA_CHAPA = parseInt($('chapaLargura').value) || LARGURA_CHAPA;
    ALTURA_CHAPA = parseInt($('chapaAltura').value) || ALTURA_CHAPA;
    PRECO_CHAPA = parseFloat($('chapaValor').value) || PRECO_CHAPA;
    ESPESSURA_MADEIRA = parseInt($('espessuraMadeira').value) || ESPESSURA_MADEIRA;
    TIPO_MATERIAL = $('tipoMaterial').value || TIPO_MATERIAL;

    const barCont = $('progressCont');
    const bar = $('progressBar');

    if (barCont && bar) {
        barCont.style.display = 'block';
        bar.style.width = '0%';
    }

    chapas = [];
    $('resultado').innerHTML = '';
    desenharChapa(-1); // Limpa o canvas principal
    atualizarResumoCorte([]); // Limpa e atualiza o resumo com os novos valores de config

    let fila = [];
    pecas.forEach(p => {
        for (let i = 0; i < p.quantidade; i++) {
            fila.push({ ...p, areaCaixaContorno: p.largura * p.altura });
        }
    });

    const totalPecas = fila.length;
    let alocadas = 0;

    fila.sort((a, b) => b.areaCaixaContorno - a.areaCaixaContorno);

    while (fila.length) {
        const grid = Array.from({ length: ALTURA_CHAPA }, () => Array(LARGURA_CHAPA).fill(false));
        const usados = [];
        const sobra = [];
        let areaChapaAtualReal = 0;

        fila.forEach(peca => {
            let encaixada = false;
            const orientacoes = [[peca.largura, peca.altura]];
            // Para semicírculos, agora só consideramos as orientações top/bottom
            // que resultam em uma caixa de contorno L x R_semi.
            // A rotação de 90 graus (para R_semi x L) ainda é válida para encaixe,
            // então mantemos essa opção para otimizar o espaço.
            if (peca._tipo === 'retangular' || peca._tipo === 'semicirculo') {
                if (peca.largura !== peca.altura) { // Permite rotação de 90 graus para retangulares e semicírculos
                    orientacoes.push([peca.altura, peca.largura]);
                }
            }


            outer: for (const [w, h] of orientacoes) {
                if (w > LARGURA_CHAPA || h > ALTURA_CHAPA) continue;

                for (let y = 0; y <= ALTURA_CHAPA - h; y++) {
                    for (let x = 0; x <= LARGURA_CHAPA - w; x++) {
                        if (verificaEspaco(grid, x, y, w, h)) {
                            marcaEspaco(grid, x, y, w, h);
                            usados.push({ ...peca, x, y, largura: w, altura: h });

                            let areaRealPeca;
                            if (peca._tipo === 'circulo') {
                                areaRealPeca = Math.PI * Math.pow(peca.R, 2);
                            } else if (peca._tipo === 'semicirculo') {
                                areaRealPeca = (Math.PI * Math.pow(peca.R, 2)) / 2;
                            } else {
                                areaRealPeca = w * h;
                            }
                            areaChapaAtualReal += areaRealPeca;

                            alocadas++;
                            if (bar) bar.style.width = `${Math.round(alocadas / totalPecas * 100)}%`;
                            encaixada = true;
                            break outer;
                        }
                    }
                }
            }
            if (!encaixada) {
                sobra.push(peca);
            }
        });

        chapas.push({ usados: usados, areaUsada: areaChapaAtualReal });
        fila = sobra;
    }

    if (bar) bar.style.width = '100%';
    setTimeout(() => {
        if (barCont) barCont.style.display = 'none';
    }, 500);

    chapasIndexAtual = 0;
    desenharChapa(0);
    mostrarResultado(chapas);
    atualizarResumoCorte(chapas);
}

// =========================================
// == FUNÇÕES DE DESENHO NO CANVAS =========
// =========================================

/**
 * Função interna para desenhar uma única peça em um contexto de canvas específico.
 * Usada tanto pela função de visualização quanto pela de exportação.
 * @param {CanvasRenderingContext2D} ctx - O contexto 2D do canvas.
 * @param {Object} p - O objeto da peça a ser desenhada.
 * @param {number} s - O fator de escala.
 * @param {number} offsetX - Deslocamento X para o desenho (útil para margens, etc.).
 * @param {number} offsetY - O deslocamento Y para o desenho.
 * @param {boolean} hideText - Oculta o texto das dimensões (útil para exportação de alta res).
 */
function desenharPecaNoContexto(ctx, p, s, offsetX = 0, offsetY = 0, hideText = false) {
    // Coordenadas e dimensões da bounding box da peça no canvas, já escaladas
    const x = p.x * s + offsetX;
    const y = p.y * s + offsetY;
    const w = p.largura * s; // Largura da caixa de contorno da peça na orientação encaixada
    const h = p.altura * s; // Altura da caixa de contorno da peça na orientação encaixada

    // Define uma cor aleatória para a peça se ela ainda não tiver uma
    if (!p._color) {
        const hue = Math.floor(Math.random() * 360);
        p._color = `hsl(${hue}, 70%, 75%)`;
    }

    // --- DEBUG: Desenhar a caixa de contorno (o "retângulo invisível") ---
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"; // Borda azul semi-transparente
    ctx.lineWidth = 1;
    ctx.stroke();
    // --- FIM DEBUG ---

    ctx.fillStyle = p._color;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;

    ctx.beginPath(); // Inicia um novo caminho de desenho

    // Lógica para desenhar as diferentes formas de peça
    if (p._tipo === 'circulo') {
        const R_circ_s = p.R * s; // Raio do círculo escalado
        ctx.arc(x + w / 2, y + h / 2, R_circ_s, 0, 2 * Math.PI);
        ctx.closePath(); // Círculos são formas fechadas por natureza
    } else if (p._tipo === 'semicirculo') {
        let R_semi_s_drawing;
        let centerX, centerY, startAngle, endAngle;
        let baseStartX, baseStartY, baseEndX, baseEndY; // Coordenadas para a linha reta

        const isBaseHorizontal = (Math.abs(w / s - p.L) < 0.1 && Math.abs(h / s - p.R) < 0.1);
        const isBaseVertical = (Math.abs(w / s - p.R) < 0.1 && Math.abs(h / s - p.L) < 0.1);

        if (isBaseHorizontal) {
            R_semi_s_drawing = p.R * s;
            centerX = x + w / 2;

            if (p.orient === 'top') { // Curva para cima, base na parte inferior da bounding box
                centerY = y + h;
                baseStartX = x;
                baseStartY = y + h;
                baseEndX = x + w;
                baseEndY = y + h;
                startAngle = Math.PI; // Início do arco (180 deg)
                endAngle = 0;         // Fim do arco (0/360 deg)
            } else { // p.orient === 'bottom' - Curva para baixo, base na parte superior da bounding box
                centerY = y;
                baseStartX = x;
                baseStartY = y;
                baseEndX = x + w;
                baseEndY = y;
                startAngle = 0;         // Início do arco (0 deg)
                endAngle = Math.PI;   // Fim do arco (180 deg)
            }
            ctx.moveTo(baseStartX, baseStartY); // Mover para o início da linha reta
            ctx.lineTo(baseEndX, baseEndY);     // Desenhar a linha reta
            ctx.arc(centerX, centerY, R_semi_s_drawing, startAngle, endAngle, false); // Desenhar o arco
            ctx.closePath(); // Fecha o caminho (do final do arco para o início da linha reta)

        } else if (isBaseVertical) {
            R_semi_s_drawing = p.R * s;
            centerY = y + h / 2;

            if (p.orient === 'top') { // Originalmente curva para cima, rotacionado para apontar para a DIREITA
                // A base reta está na borda esquerda da bounding box
                centerX = x;
                baseStartX = x;
                baseStartY = y;
                baseEndX = x;
                baseEndY = y + h;
                startAngle = Math.PI * 0.5; // 90 deg (topo do arco)
                endAngle = Math.PI * 1.5;   // 270 deg (base do arco)
                // Usar true para counterClockwise para desenhar o arco para a direita
            } else { // p.orient === 'bottom' - Originalmente curva para baixo, rotacionado para apontar para a ESQUERDA
                // A base reta está na borda direita da bounding box
                centerX = x + w;
                baseStartX = x + w;
                baseStartY = y;
                baseEndX = x + w;
                baseEndY = y + h;
                startAngle = Math.PI * 1.5; // 270 deg (base do arco)
                endAngle = Math.PI * 0.5;   // 90 deg (topo do arco)
                // Usar true para counterClockwise para desenhar o arco para a esquerda
            }
            ctx.moveTo(baseStartX, baseStartY); // Mover para o início da linha reta
            ctx.lineTo(baseEndX, baseEndY);     // Desenhar a linha reta
            // A direção do arco (`counterClockwise` - true para anti-horário, false para horário) é crucial aqui.
            // Para "top" original (curva direita), de 90 a 270 anti-horário.
            // Para "bottom" original (curva esquerda), de 270 a 90 anti-horário.
            ctx.arc(centerX, centerY, R_semi_s_drawing, startAngle, endAngle, true); // O 'true' faz o arco ir no sentido anti-horário
            ctx.closePath(); // Fecha o caminho (do final do arco para o início da linha reta)

        } else {
            console.error("Erro: Dimensões do semicírculo não correspondem às formas esperadas. Desenhando como retângulo.", { p_data: p, current_w_s: w / s, current_h_s: h / s });
            ctx.rect(x, y, w, h); // Fallback
            ctx.closePath();
        }
    } else { // Retangular
        ctx.rect(x, y, w, h);
        ctx.closePath();
    }

    ctx.fill();   // Preenche a forma
    ctx.stroke(); // Desenha o contorno

    // Adiciona o texto das dimensões no centro da peça
    if (!hideText && w > 30 * s && h > 15 * s) {
        ctx.fillStyle = "#000";
        ctx.font = `${Math.max(8, Math.min(w, h) / 8)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let textContent;
        if (p._tipo === 'circulo') {
            textContent = `Ø${p.diametro}`;
        } else if (p._tipo === 'semicirculo') {
            textContent = `L=${p.L} R=${p.R}`;
        } else {
            textContent = `${p.largura}x${p.altura}`;
        }
        ctx.fillText(textContent, x + w / 2, y + h / 2);
    }
}


/**
* Desenha a chapa atual (ou limpa o canvas) com as peças encaixadas para visualização na tela.
* @param {number} idx - O índice da chapa a ser desenhada no array `chapas`.
*/
function desenharChapa(idx) {
    const canvas = $('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (idx < 0 || !chapas[idx]) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const parentWidth = canvas.parentElement.offsetWidth * 0.95;
    const scaleFactorW = parentWidth / LARGURA_CHAPA;
    const scaleFactorH = (window.innerHeight * 0.5) / ALTURA_CHAPA;
    const s = Math.min(scaleFactorW, scaleFactorH);

    canvas.width = LARGURA_CHAPA * s;
    canvas.height = ALTURA_CHAPA * s;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    chapas[idx].usados.forEach(p => {
        desenharPecaNoContexto(ctx, p, s); // Chamada para desenhar a peça
    });
}


/**
* Desenha uma chapa específica em um canvas temporário com alta resolução para exportação.
* @param {number} chapaIndex - O índice da chapa a ser desenhada.
* @returns {HTMLCanvasElement|null} - O canvas de alta resolução com a chapa desenhada, ou null se a chapa não existir.
*/
function desenharChapaParaExportacao(chapaIndex) {
    if (!chapas[chapaIndex]) {
        return null;
    }

    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');

    const EXPORT_WIDTH = 4000; // Define uma largura fixa para a exportação de alta resolução
    const s = EXPORT_WIDTH / LARGURA_CHAPA; // Calcula a escala baseada na largura da chapa

    exportCanvas.width = LARGURA_CHAPA * s;
    exportCanvas.height = ALTURA_CHAPA * s;

    exportCtx.fillStyle = "#f0f0f0"; // Cor de fundo da chapa
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.strokeStyle = '#333';
    exportCtx.lineWidth = 2 * s; // Linhas mais grossas para exportação de alta resolução
    exportCtx.strokeRect(0, 0, exportCanvas.width, exportCanvas.height); // Borda da chapa

    chapas[chapaIndex].usados.forEach(p => {
        // Mudar 'true' para 'false' para exibir o texto na exportação
        desenharPecaNoContexto(exportCtx, p, s, 0, 0, false);
    });

    return exportCanvas;
}


// =========================================
// == RELATÓRIOS E RESUMO FINAL ============
// =========================================
function mostrarResultado(chapasCalculadas) {
    const div = $('resultado');
    if (!div) return;
    div.innerHTML = '';

    chapasCalculadas.forEach((c, i) => {
        const d = document.createElement('div');
        d.className = 'chapa-resumo';
        const apv = ((c.areaUsada / (LARGURA_CHAPA * ALTURA_CHAPA)) * 100).toFixed(2);
        
        // Adicionar informações da chapa e material no resumo de cada chapa
        d.innerHTML = `<strong>Chapa ${i + 1}</strong><br>` +
                      `Dimensões da Chapa: ${LARGURA_CHAPA}x${ALTURA_CHAPA}mm<br>` +
                      `Material: ${TIPO_MATERIAL} (${ESPESSURA_MADEIRA}mm)<br>` +
                      `Valor Unitário: R$ ${PRECO_CHAPA.toFixed(2)}<br>` +
                      `Aproveitamento: ${apv}%<br>Peças:<ul>`;
        if (!c.usados.length) {
            d.innerHTML += '<li>Nenhuma peça encaixada.</li>';
        } else {
            c.usados.forEach(p => {
                let descr = '';
                if (p._tipo === 'retangular') {
                    descr = `${p.largura}x${p.altura}mm (Retangular)`;
                } else if (p._tipo === 'semicirculo') {
                     // A descrição agora reflete que só há 'top' e 'bottom'
                     descr = `L=${p.L} R=${p.R}mm Semicírculo ${p.orient}`;
                } else if (p._tipo === 'circulo') {
                    descr = `Ø=${p.diametro}mm (Círculo)`;
                }
                d.innerHTML += `<li>${descr}</li>`;
            });
        }
        d.innerHTML += '</ul>';
        div.appendChild(d);
    });
}

function atualizarResumoCorte(chs) {
    const total = chs.length;
    const area = chs.reduce((s, c) => s + c.areaUsada, 0);
    const areaTotalChapasDisponivel = total * LARGURA_CHAPA * ALTURA_CHAPA;

    const pct = (areaTotalChapasDisponivel > 0) ? ((area / areaTotalChapasDisponivel) * 100).toFixed(2) : (0).toFixed(2);

    const resumoChapasUtilizadas = $('resumoChapasUtilizadas');
    const resumoAreaUtilizada = $('resumoAreaUtilizada');
    const resumoCustoTotal = $('resumoCustoTotal');
    const resumoEspessura = $('resumoEspessura'); // NOVO
    const resumoTipoMaterial = $('resumoTipoMaterial'); // NOVO
    const resumoDimensaoChapa = $('resumoDimensaoChapa'); // NOVO
    const resumoValorUnitarioChapa = $('resumoValorUnitarioChapa'); // NOVO

    if (resumoChapasUtilizadas) resumoChapasUtilizadas.textContent = total;
    if (resumoAreaUtilizada) resumoAreaUtilizada.textContent = `${area.toFixed(2)} mm² (${pct}%)`;
    if (resumoCustoTotal) resumoCustoTotal.textContent = `R$ ${(total * PRECO_CHAPA).toFixed(2)}`;
    if (resumoEspessura) resumoEspessura.textContent = `${ESPESSURA_MADEIRA}mm`; // NOVO
    if (resumoTipoMaterial) resumoTipoMaterial.textContent = TIPO_MATERIAL; // NOVO
    if (resumoDimensaoChapa) resumoDimensaoChapa.textContent = `${LARGURA_CHAPA}x${ALTURA_CHAPA}mm`; // NOVO
    if (resumoValorUnitarioChapa) resumoValorUnitarioChapa.textContent = `R$ ${PRECO_CHAPA.toFixed(2)}`; // NOVO
}

// =========================================
// == CONTROLES DE NAVEGAÇÃO E EXPORTAÇÃO ==
// =========================================
function anteriorChapa() {
    if (chapasIndexAtual > 0) {
        chapasIndexAtual--;
        desenharChapa(chapasIndexAtual);
    }
}

function proximaChapa() {
    if (chapasIndexAtual < chapas.length - 1) {
        chapasIndexAtual++;
        desenharChapa(chapasIndexAtual);
    }
}

function exportarImagem() {
    if (chapas.length === 0 || chapasIndexAtual === -1) {
        alert('Não há chapas para exportar. Calcule os cortes primeiro.');
        return;
    }

    const exportCanvas = desenharChapaParaExportacao(chapasIndexAtual);
    if (exportCanvas) {
        const link = document.createElement('a');
        link.download = `chapa-${chapasIndexAtual + 1}-HR.png`; // HR para High Resolution
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    } else {
        alert('Erro ao gerar a imagem para exportação.');
    }
}

// =========================================
// == FUNÇÕES DE EXPORTAÇÃO DXF ============
// =========================================

// Função auxiliar para converter radianos para graus
function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

// Função para gerar a string DXF
function generateDxfString(chapa) {
    let dxf = "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n";
    dxf += "0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLTYPE\n70\n1\n0\nLTYPE\n2\nContinuous\n70\n64\n1\n\n0\nENDTAB\n0\nTABLE\n2\nLAYER\n70\n1\n0\nLAYER\n2\n0\n70\n0\n6\nContinuous\n62\n7\n0\nENDTAB\n0\nENDSEC\n";
    dxf += "0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n";
    dxf += "0\nSECTION\n2\nENTITIES\n";

    // Desenha a borda da chapa
    dxf += "0\nLINE\n8\n0\n10\n0\n20\n0\n30\n0\n11\n" + LARGURA_CHAPA + "\n21\n0\n31\n0\n";
    dxf += "0\nLINE\n8\n0\n10\n" + LARGURA_CHAPA + "\n20\n0\n30\n0\n11\n" + LARGURA_CHAPA + "\n21\n" + ALTURA_CHAPA + "\n31\n0\n";
    dxf += "0\nLINE\n8\n0\n10\n" + LARGURA_CHAPA + "\n20\n" + ALTURA_CHAPA + "\n30\n0\n11\n0\n21\n" + ALTURA_CHAPA + "\n31\n0\n";
    dxf += "0\nLINE\n8\n0\n10\n0\n20\n" + ALTURA_CHAPA + "\n30\n0\n11\n0\n21\n0\n31\n0\n";


    chapa.usados.forEach(p => {
        const x = p.x;
        const y = p.y;
        const w = p.largura; // Largura da bounding box da peça encaixada
        const h = p.altura; // Altura da bounding box da peça encaixada

        if (p._tipo === 'retangular') {
            // Retângulo: 4 linhas
            dxf += "0\nLINE\n8\n0\n10\n" + x + "\n20\n" + y + "\n30\n0\n11\n" + (x + w) + "\n21\n" + y + "\n31\n0\n"; // Topo
            dxf += "0\nLINE\n8\n0\n10\n" + (x + w) + "\n20\n" + y + "\n30\n0\n11\n" + (x + w) + "\n21\n" + (y + h) + "\n31\n0\n"; // Direita
            dxf += "0\nLINE\n8\n0\n10\n" + (x + w) + "\n20\n" + (y + h) + "\n30\n0\n11\n" + x + "\n21\n" + (y + h) + "\n31\n0\n"; // Base
            dxf += "0\nLINE\n8\n0\n10\n" + x + "\n20\n" + (y + h) + "\n30\n0\n11\n" + x + "\n21\n" + y + "\n31\n0\n"; // Esquerda
        } else if (p._tipo === 'circulo') {
            // Círculo: ARC com 360 graus
            const centerX = x + w / 2;
            const centerY = y + h / 2;
            const radius = p.R;

            dxf += "0\nCIRCLE\n8\n0\n10\n" + centerX + "\n20\n" + centerY + "\n30\n0\n40\n" + radius + "\n";
        } else if (p._tipo === 'semicirculo') {
            let R_semi = p.R; // O raio original da peça, não escalado
            let centerX, centerY, startAngleRad, endAngleRad;
            let baseStartX, baseStartY, baseEndX, baseEndY;

            const originalL = p.L; // Comprimento do lado reto original
            const originalR = p.R; // Raio original

            // Determinar se a peça foi rotacionada com base nas dimensões atuais da bounding box (w, h)
            // em relação às dimensões originais (originalL, originalR)
            const isCurrentlyHorizontal = (Math.abs(w - originalL) < 0.1 && Math.abs(h - originalR) < 0.1);
            const isCurrentlyVertical = (Math.abs(w - originalR) < 0.1 && Math.abs(h - originalL) < 0.1);

            if (isCurrentlyHorizontal) { // A base reta está ao longo da largura (topo/inferior da bounding box)
                centerX = x + w / 2;
                if (p.orient === 'top') { // Curva para cima (base embaixo da curva)
                    centerY = y + h;
                    baseStartX = x;
                    baseStartY = y + h;
                    baseEndX = x + w;
                    baseEndY = y + h;
                    startAngleRad = Math.PI; // 180 deg
                    endAngleRad = 0;         // 0 deg
                } else { // p.orient === 'bottom' - Curva para baixo (base em cima da curva)
                    centerY = y;
                    baseStartX = x;
                    baseStartY = y;
                    baseEndX = x + w;
                    baseEndY = y;
                    startAngleRad = 0;         // 0 deg
                    endAngleRad = Math.PI;   // 180 deg
                }
            } else if (isCurrentlyVertical) { // A base reta está ao longo da altura (lados esquerdo/direito da bounding box)
                centerY = y + h / 2;
                if (p.orient === 'top') { // Originalmente curva para cima, rotacionado 90 deg para a DIREITA
                    centerX = x;
                    baseStartX = x;
                    baseStartY = y;
                    baseEndX = x;
                    baseEndY = y + h;
                    startAngleRad = Math.PI * 0.5; // 90 deg
                    endAngleRad = Math.PI * 1.5;   // 270 deg
                } else { // p.orient === 'bottom' - Originalmente curva para baixo, rotacionado 90 deg para a ESQUERDA
                    centerX = x + w;
                    baseStartX = x + w;
                    baseStartY = y;
                    baseEndX = x + w;
                    baseEndY = y + h;
                    startAngleRad = Math.PI * 1.5; // 270 deg
                    endAngleRad = Math.PI * 0.5;   // 90 deg
                }
            } else {
                console.warn("Aviso: Semicírculo com dimensões inesperadas para exportação DXF. Gerando como retângulo. Peca:", p);
                // Fallback para retângulo se a orientação não for clara
                dxf += "0\nLINE\n8\n0\n10\n" + x + "\n20\n" + y + "\n30\n0\n11\n" + (x + w) + "\n21\n" + y + "\n31\n0\n";
                dxf += "0\nLINE\n8\n0\n10\n" + (x + w) + "\n20\n" + y + "\n30\n0\n11\n" + (x + w) + "\n21\n" + (y + h) + "\n31\n0\n";
                dxf += "0\nLINE\n8\n0\n10\n" + (x + w) + "\n20\n" + (y + h) + "\n30\n0\n11\n" + x + "\n21\n" + (y + h) + "\n31\n0\n";
                dxf += "0\nLINE\n8\n0\n10\n" + x + "\n20\n" + (y + h) + "\n30\n0\n11\n" + x + "\n21\n" + y + "\n31\n0\n";
                return; // Sai desta iteração
            }
            
            // Desenha a linha reta (base do semicírculo)
            dxf += "0\nLINE\n8\n0\n10\n" + baseStartX + "\n20\n" + baseStartY + "\n30\n0\n11\n" + baseEndX + "\n21\n" + baseEndY + "\n31\n0\n";

            // Desenha o arco
            let startDeg = toDegrees(startAngleRad);
            let endDeg = toDegrees(endAngleRad);

            // Ajuste para garantir que o arco DXF é desenhado no sentido anti-horário
            // e que endDeg é maior que startDeg para arcos que cruzam 0/360.
            if (endDeg < startDeg) {
                endDeg += 360;
            }
            // Se o arco foi originalmente definido no sentido horário (counterClockwise=false no canvas)
            // e startDeg > endDeg, o DXF precisa que endDeg seja maior que startDeg
            // para o sentido anti-horário.
            // Ex: de 180 a 0 (horário) no canvas, vira 180 a 360 no DXF (anti-horário).
            // Ex: de 270 a 90 (horário) no canvas, vira 270 a 450 no DXF (anti-horário).
            // NOTA: O comportamento do arco do canvas e do DXF para 'sentido' pode ser sutil.
            // A lógica acima com `endDeg += 360` é uma abordagem comum para DXF.

            dxf += "0\nARC\n8\n0\n10\n" + centerX + "\n20\n" + centerY + "\n30\n0\n40\n" + R_semi + "\n50\n" + startDeg + "\n51\n" + endDeg + "\n";
        }
    });

    dxf += "0\nENDSEC\n0\nEOF\n";
    return dxf;
}


function exportarDXF() {
    if (chapas.length === 0 || chapasIndexAtual === -1) {
        alert('Não há chapas para exportar. Calcule os cortes primeiro.');
        return;
    }

    const currentChapa = chapas[chapasIndexAtual];
    const dxfString = generateDxfString(currentChapa);

    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chapa-${chapasIndexAtual + 1}.dxf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Libera o URL do objeto
}


// =========================================
// == CONTROLE DE INTERFACE ================
// =========================================
function toggleCamposPeca() {
    const tipoPeca = $('tipoPeca').value;

    const retangularFields = $('retangularFields');
    const semicirculoFields = $('semicirculoFields');
    const circuloFields = $('circuloFields');

    retangularFields.classList.remove('active');
    semicirculoFields.classList.remove('active');
    circuloFields.classList.remove('active');

    if (tipoPeca === 'retangular') {
        retangularFields.classList.add('active');
    } else if (tipoPeca === 'semicirculo') {
        semicirculoFields.classList.add('active');
    } else if (tipoPeca === 'circulo') {
        circuloFields.classList.add('active');
    }
}

// =========================================
// == INICIALIZAÇÃO DA APLICAÇÃO ==========
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // Define valores padrão para os novos campos de entrada se estiverem vazios
    // ou garante que o valor inicial do input reflita a variável global
    $('espessuraMadeira').value = ESPESSURA_MADEIRA;
    $('chapaLargura').value = LARGURA_CHAPA;
    $('chapaAltura').value = ALTURA_CHAPA;
    $('chapaValor').value = PRECO_CHAPA.toFixed(2);
    $('tipoMaterial').value = TIPO_MATERIAL; // Garante que o select exibe o valor padrão

    atualizarListaPecas();
    atualizarResumoCorte([]);

    const addPecaBtn = $('addPecaBtn');
    if (addPecaBtn) {
        addPecaBtn.onclick = adicionarPecaGenerica;
    }

    const calcularCortesBtn = $('calcularCortesBtn');
    if (calcularCortesBtn) {
        calcularCortesBtn.onclick = calcularCorte;
    }

    const anteriorBtn = $('anteriorChapaBtn');
    if (anteriorBtn) {
        anteriorBtn.onclick = anteriorChapa;
    }

    const proximaBtn = $('proximaChapaBtn');
    if (proximaBtn) {
        proximaBtn.onclick = proximaChapa;
    }

    const exportarBtn = $('exportarImagemBtn');
    if (exportarBtn) {
        exportarBtn.onclick = exportarImagem;
    }

    const exportarDxfBtn = $('exportarDxfBtn'); // Vincula o novo botão
    if (exportarDxfBtn) {
        exportarDxfBtn.onclick = exportarDXF;
    }

    const tipoPecaSelect = $('tipoPeca');
    if (tipoPecaSelect) {
        tipoPecaSelect.addEventListener('change', toggleCamposPeca);
        toggleCamposPeca(); // Chama na inicialização para exibir os campos corretos
    }
});