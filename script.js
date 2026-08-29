// COLOCAR ISTO BEM NO TOPO DO SCRIPT.JS
const firebaseConfig = {
    apiKey: "AIzaSyBR97HiVaf9kyywKoukzWArUSqp1maraUI",
    authDomain: "saints-panel.firebaseapp.com",
    projectId: "saints-panel",
    storageBucket: "saints-panel.firebasestorage.app",
    messagingSenderId: "260768238219",
    appId: "1:260768238219:web:49b3ba9753b51af46ba28e",
    measurementId: "G-QQ83NYBSTV"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ALTERNAR ABAS
function mudarAba(idAba, btn) {
    document.querySelectorAll('.aba-conteudo').forEach(el => el.classList.remove('ativa'));
    document.querySelectorAll('.btn-nav').forEach(el => el.classList.remove('ativo'));

    document.getElementById('aba-' + idAba).classList.add('ativa');
    btn.classList.add('ativo');

    if (idAba === 'pedidos-clientes') atualizarSelectProdutos();
    if (idAba === 'encomendas-pedidas') atualizarSelectArmas();
}

// RELÓGIO EM TEMPO REAL
function atualizarRelogio() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');
    
    document.getElementById('relogio').textContent = `${horas}:${minutos}:${segundos}`;
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

// GESTÃO DE TAREFAS
let tarefas = JSON.parse(localStorage.getItem('saints_t')) || [];

function renderTarefas() {
    const list = document.getElementById('lista-tarefas');
    list.innerHTML = '';
    
    tarefas.forEach((t, i) => {
        list.innerHTML += `
            <tr>
                <td>${t}</td>
                <td><button class="btn-apagar" onclick="delTarefa(${i})">✕</button></td>
            </tr>
        `;
    });

    document.getElementById('qtd-tarefas').textContent = tarefas.length;
    document.getElementById('msg-tarefas').textContent = tarefas.length === 0 ? 'Tudo concluído. 🎉' : `Existem ${tarefas.length} tarefas por fazer.`;
}

function addTarefa(e) {
    e.preventDefault();
    const inp = document.getElementById('input-tarefa');
    tarefas.push(inp.value);
    localStorage.setItem('saints_t', JSON.stringify(tarefas));
    inp.value = '';
    renderTarefas();
}

function delTarefa(i) {
    tarefas.splice(i, 1);
    localStorage.setItem('saints_t', JSON.stringify(tarefas));
    renderTarefas();
}

// SELECT DE PRODUTOS
function atualizarSelectProdutos() {
    const select = document.getElementById('pedido-produto-select');
    const produtos = JSON.parse(localStorage.getItem('saints_produtos')) || [];

    select.innerHTML = '<option value="">-- Seleciona um produto registrado --</option>';
    produtos.forEach((p, idx) => {
        const preco = parseFloat(p.detalhes) || 0;
        select.innerHTML += `<option value="${idx}">${p.nome} - ${preco.toFixed(2)}€ / un</option>`;
    });
}

// SELECT DE ARMAS
function atualizarSelectArmas() {
    const select = document.getElementById('enc-arma-select');
    const armas = JSON.parse(localStorage.getItem('saints_armas')) || [];

    select.innerHTML = '<option value="">-- Seleciona uma Arma / Munição cadastrada --</option>';
    armas.forEach((a, idx) => {
        const preco = parseFloat(a.detalhes) || 0;
        select.innerHTML += `<option value="${idx}">${a.nome} - ${preco.toFixed(2)}€ / un</option>`;
    });
}

// ABA PEDIDOS CLIENTES
function addPedidoCliente(e) {
    e.preventDefault();
    const cliente = document.getElementById('pedido-cliente').value.trim();
    const empresa = document.getElementById('pedido-empresa').value.trim();
    const prodIndex = document.getElementById('pedido-produto-select').value;
    const qtd = parseInt(document.getElementById('pedido-qtd').value);

    if (prodIndex === "") {
        alert("Regista primeiro um produto na aba 'Preços de Produtos'!");
        return;
    }

    const produtos = JSON.parse(localStorage.getItem('saints_produtos')) || [];
    const produtoSel = produtos[prodIndex];
    const precoUnitario = parseFloat(produtoSel.detalhes) || 0;
    const total = precoUnitario * qtd;

    const pedidos = JSON.parse(localStorage.getItem('saints_pedidos_clientes')) || [];
    pedidos.push({ cliente, empresa, item: produtoSel.nome, qtd, precoUnitario, total });

    localStorage.setItem('saints_pedidos_clientes', JSON.stringify(pedidos));
    e.target.reset();
    carregarPedidosClientes();
}

function carregarPedidosClientes() {
    const pedidos = JSON.parse(localStorage.getItem('saints_pedidos_clientes')) || [];
    const container = document.getElementById('grid-pedidos-clientes');
    if (!container) return;

    let totalGeral = 0;
    container.innerHTML = '';

    pedidos.forEach((item, index) => {
        totalGeral += item.total;
        container.innerHTML += `
            <div class="item-card fatura-card">
                <button class="btn-apagar-card" onclick="removerPedidoCliente(${index})">✕</button>
                <h4>👤 ${item.cliente}</h4>
                <div class="sub-info">🏢 ${item.empresa}</div>
                <p>📦 <strong>${item.qtd}x</strong> ${item.item}</p>
                <div class="sub-info">Preço Unit.: ${item.precoUnitario.toFixed(2)}€</div>
                <div class="total-destaque">TOTAL: ${item.total.toFixed(2)}€</div>
            </div>
        `;
    });

    // Atualiza o total de Pedidos Clientes na Visão Geral
    const elTotal = document.getElementById('qtd-pedidos-clientes');
    if (elTotal) elTotal.textContent = `${totalGeral.toFixed(2)} €`;
}

function removerPedidoCliente(index) {
    const pedidos = JSON.parse(localStorage.getItem('saints_pedidos_clientes')) || [];
    pedidos.splice(index, 1);
    localStorage.setItem('saints_pedidos_clientes', JSON.stringify(pedidos));
    carregarPedidosClientes();
}

// ABA ENCOMENDAS PEDIDAS (INTEGRADA COM ARMAS)
function addEncomendaArma(e) {
    e.preventDefault();
    const comprador = document.getElementById('enc-comprador').value.trim();
    const fornecedor = document.getElementById('enc-fornecedor').value.trim();
    const armaIndex = document.getElementById('enc-arma-select').value;
    const qtd = parseInt(document.getElementById('enc-qtd').value);

    if (armaIndex === "") {
        alert("Regista primeiro uma arma ou munição na aba 'Preços de Armas'!");
        return;
    }

    const armas = JSON.parse(localStorage.getItem('saints_armas')) || [];
    const armaSel = armas[armaIndex];
    const precoUnitario = parseFloat(armaSel.detalhes) || 0;
    const total = precoUnitario * qtd;

    const encomendas = JSON.parse(localStorage.getItem('saints_encomendas_pedidas')) || [];
    encomendas.push({ comprador, fornecedor, item: armaSel.nome, qtd, precoUnitario, total });

    localStorage.setItem('saints_encomendas_pedidas', JSON.stringify(encomendas));
    e.target.reset();
    carregarEncomendasPedidas();
}

function carregarEncomendasPedidas() {
    const encomendas = JSON.parse(localStorage.getItem('saints_encomendas_pedidas')) || [];
    const container = document.getElementById('grid-encomendas-pedidas');
    if (!container) return;

    let totalGeral = 0;
    container.innerHTML = '';

    encomendas.forEach((item, index) => {
        totalGeral += item.total;
        container.innerHTML += `
            <div class="item-card encomenda-card">
                <button class="btn-apagar-card" onclick="removerEncomendaPedida(${index})">✕</button>
                <h4>⚔️ ${item.item}</h4>
                <div class="sub-info">👤 Comprador: ${item.comprador}</div>
                <div class="sub-info">🏭 Fornecedor: ${item.fornecedor}</div>
                <p>Qtd: <strong>${item.qtd}x</strong> | Unit: ${item.precoUnitario.toFixed(2)}€</p>
                <div class="total-destaque">TOTAL: ${item.total.toFixed(2)}€</div>
            </div>
        `;
    });

    // Atualiza o total de Encomendas Pedidas na Visão Geral
    const elTotal = document.getElementById('qtd-encomendas');
    if (elTotal) elTotal.textContent = `${totalGeral.toFixed(2)} €`;
}

function removerEncomendaPedida(index) {
    const encomendas = JSON.parse(localStorage.getItem('saints_encomendas_pedidas')) || [];
    encomendas.splice(index, 1);
    localStorage.setItem('saints_encomendas_pedidas', JSON.stringify(encomendas));
    carregarEncomendasPedidas();
}

// GESTÃO DINÂMICA DE OUTRAS ABAS
const abasComCards = ['vendas', 'plantas', 'frutas', 'craft', 'produtos', 'armas', 'craft-saints', 'receitas', 'roupa'];

function carregarCards(categoria) {
    const dados = JSON.parse(localStorage.getItem(`saints_${categoria}`)) || [];
    const container = document.getElementById(`grid-${categoria}`);
    if (!container) return;

    container.innerHTML = '';
    dados.forEach((item, index) => {
        const imgHtml = item.imagem ? `<img src="${item.imagem}" alt="${item.nome}" onerror="this.style.display='none'">` : '';
        const linkHtml = item.link ? `<a href="${item.link}" target="_blank">🔗 Abrir Link / Mapa</a>` : '';
        
        let valorExibicao = item.detalhes;
        if (categoria === 'produtos' || categoria === 'armas') {
            const num = parseFloat(item.detalhes) || 0;
            valorExibicao = `${num.toFixed(2)} € / un`;
        }

        container.innerHTML += `
            <div class="item-card">
                <button class="btn-apagar-card" onclick="removerCardData('${categoria}', ${index})">✕</button>
                ${imgHtml}
                <h4>${item.nome}</h4>
                <p>${valorExibicao}</p>
                ${linkHtml}
            </div>
        `;
    });
}

function addCardData(e, categoria) {
    e.preventDefault();
    const nome = document.getElementById(`${categoria}-nome`).value.trim();
    const detalhes = document.getElementById(`${categoria}-detalhes`).value.trim();
    const imagem = document.getElementById(`${categoria}-imagem`) ? document.getElementById(`${categoria}-imagem`).value.trim() : '';
    const link = document.getElementById(`${categoria}-link`) ? document.getElementById(`${categoria}-link`).value.trim() : '';

    const dados = JSON.parse(localStorage.getItem(`saints_${categoria}`)) || [];
    dados.push({ nome, detalhes, imagem, link });
    localStorage.setItem(`saints_${categoria}`, JSON.stringify(dados));

    e.target.reset();
    carregarCards(categoria);
    if (categoria === 'produtos') atualizarSelectProdutos();
    if (categoria === 'armas') atualizarSelectArmas();
}

function removerCardData(categoria, index) {
    const dados = JSON.parse(localStorage.getItem(`saints_${categoria}`)) || [];
    dados.splice(index, 1);
    localStorage.setItem(`saints_${categoria}`, JSON.stringify(dados));
    carregarCards(categoria);
    if (categoria === 'produtos') atualizarSelectProdutos();
    if (categoria === 'armas') atualizarSelectArmas();
}

// INICIA E CARREGA TODOS OS DADOS
renderTarefas();
carregarPedidosClientes();
carregarEncomendasPedidas();
abasComCards.forEach(cat => carregarCards(cat));