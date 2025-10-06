import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ----------------------------------------------------
// Configuração do Supabase
// ----------------------------------------------------
const SUPABASE_URL = 'https://muoduxqrobgjzbsxplef.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11b2R1eHFyb2Jnanpic3hwbGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzY2NTksImV4cCI6MjA3NTM1MjY1OX0.oy0hopfMMn9DQg2oNoCsFOyO9csI0OpaaT2oX79OOHs'; 
const BUCKET_NAME = 'fotos_desaparecidos'; // NOME CORRETO DO SEU BUCKET
const TABLE_NAME = 'desaparecidos'; // NOME DA SUA TABELA
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ------------------------------------------------------------------
// FUNÇÕES DE CADASTRO E UPLOAD (Para texte1ca.html)
// ------------------------------------------------------------------
async function handleFormSubmit(e) {
    e.preventDefault();

    // 1. Coleta de dados
    const nome = document.getElementById("nome")?.value;
    const idade = document.getElementById("idade")?.value;
    const local = document.getElementById("local")?.value;
    const data = document.getElementById("data")?.value;
    const ultimoContato = document.getElementById("ultimo-contato")?.value;
    const parentesco = document.getElementById("parentesco")?.value;
    const caracteristicasFisicas = document.getElementById("caracteristicas-fisicas")?.value;
    const roupas = document.getElementById("roupas")?.value;
    const telefoneContato = document.getElementById("telefone-contato")?.value;
    const descricao = document.getElementById("descricao")?.value;
    const fotoInput = document.getElementById("imagem"); 

    let fotoUrl = "";

    // 🔑 NOVO: Definição das variáveis necessárias para esconder/mostrar elementos
    const formElement = document.getElementById('desaparecido-form');
    const successMessage = document.getElementById('success-message');
    
    // 🔑 NOVO: Esconde a mensagem de sucesso antes de tentar o cadastro
    if (successMessage) successMessage.style.display = 'none';

    try {
        // --- 2. Upload da Imagem para o Supabase Storage (Corrigido!) ---
        if (fotoInput?.files.length > 0) {
            const file = fotoInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME) 
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from(BUCKET_NAME) 
                .getPublicUrl(fileName);

            fotoUrl = urlData.publicUrl;
        }

        // --- 3. Inserção dos dados no Banco de Dados (Tabela 'desaparecidos') ---
        const { error: insertError } = await supabase.from(TABLE_NAME)
            .insert([{
                nome, idade, local, data, foto: fotoUrl,
                ultimo_contato: ultimoContato, parentesco, 
                caracteristicas_fisicas: caracteristicasFisicas,
                roupas, telefone_contato: telefoneContato, descricao
            }]);

        if (insertError) throw insertError;

        // ** AÇÕES DE SUCESSO **
        
        // 1. Oculta o formulário
        if (formElement) formElement.style.display = 'none';
        
        // 2. Exibe a mensagem de sucesso do HTML
        if (successMessage) {
            successMessage.style.display = 'block'; 
        }

        // 3. Configura o botão para redirecionar
        const verListaBtn = document.getElementById('verListaBtn');
        if (verListaBtn) {
            verListaBtn.onclick = () => {
                window.location.href = 'texte2list.html';
            };
        }
        
    } catch (error) {
        console.error("Erro completo:", error);
        // Em caso de erro, o formulário permanece visível, e a mensagem de sucesso fica oculta.
        alert(`Erro ao cadastrar! Detalhe: ${error.message || "Verifique as Policies de segurança do Supabase para o bucket e a tabela."}`);
    }
}

// ------------------------------------------------------------------
// FUNÇÕES DE LISTAGEM, EXIBIÇÃO E BUSCA (Para texte2list.html)
// ------------------------------------------------------------------

// Função principal de carregamento da lista
async function loadDesaparecidos() {
    const { data: desaparecidos, error } = await supabase
        .from(TABLE_NAME) 
        .select('*');

    if (error) {
        console.error("Erro ao carregar dados:", error);
        return;
    }

    const desaparecidosList = document.getElementById('desaparecidos-list');
    if (!desaparecidosList) return; 
    desaparecidosList.innerHTML = ''; 

    desaparecidos.forEach(desaparecido => {
        const card = document.createElement('div');
        card.classList.add('card'); 
        card.setAttribute('data-descricao', desaparecido.descricao || '');

        card.innerHTML = `
            <img src="${desaparecido.foto || 'placeholder.jpg'}" alt="Foto de ${desaparecido.nome}" />
            <h3>${desaparecido.nome}</h3>
            <p><strong>Local:</strong> ${desaparecido.local || 'Não informado'}</p>
        `;

        // Ativa a função de exibição de detalhes (Modal)
        card.addEventListener('click', () => openModal(desaparecido));
        desaparecidosList.appendChild(card);
    });
}

// Função para exibir detalhes no Modal
function openModal(desaparecido) {
    const modal = document.getElementById('desaparecidoModal');
    if (!modal) return;
    
    // Preenche os dados do modal (garantindo que todos os elementos ID existam no seu HTML)
    document.getElementById('modalNome').textContent = desaparecido.nome;
    document.getElementById('modalFoto').src = desaparecido.foto || 'placeholder.jpg';
    document.getElementById('modalIdade').textContent = desaparecido.idade || 'Não informado';
    document.getElementById('modalLocal').textContent = desaparecido.local || 'Não informado';
    document.getElementById('modalData').textContent = new Date(desaparecido.data).toLocaleDateString();
    document.getElementById('modalUltimoContato').textContent = desaparecido.ultimo_contato || 'Não informado';
    document.getElementById('modalParentesco').textContent = desaparecido.parentesco || 'Não informado';
    document.getElementById('modalCaracteristicas').textContent = desaparecido.caracteristicas_fisicas || 'Não informado';
    document.getElementById('modalRoupas').textContent = desaparecido.roupas || 'Não informado';
    document.getElementById('modalTelefone').textContent = desaparecido.telefone_contato || 'Não informado';
    document.getElementById('modalDescricao').textContent = desaparecido.descricao || 'Sem descrição';

    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('desaparecidoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função de Busca
function searchDesaparecidos() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchText = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll(`#desaparecidos-list .card`);

    cards.forEach(card => {
        const nome = card.querySelector('h3').textContent.toLowerCase();
        const descricao = card.getAttribute('data-descricao') || '';
        
        const matches = nome.includes(searchText) || descricao.toLowerCase().includes(searchText);

        card.style.display = matches ? 'block' : 'none';
    });
}


// ------------------------------------------------------------------
// INICIALIZAÇÃO E EVENT LISTENERS
// ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Configuração para a Página de CADASTRO (texte1ca.html)
    const formCadastro = document.getElementById('desaparecido-form'); 
    if (formCadastro) {
        formCadastro.addEventListener('submit', handleFormSubmit);
    }
    
    // 2. Configuração para a Página de LISTAGEM (texte2list.html)
    const listaContainer = document.getElementById('desaparecidos-list');
    if (listaContainer) {
        loadDesaparecidos(); // Inicia o carregamento da lista
        
        // Configura o botão de fechar do modal
        const closeButton = document.querySelector('.close-btn');
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }
        
        // Configura a busca ao digitar
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', searchDesaparecidos);
        }
        
        // Fecha o modal ao clicar fora dele
        const modal = document.getElementById('desaparecidoModal');
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal();
                }
            });
        }
    }
});