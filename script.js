// Autor: Guilherme Geisler
document.addEventListener('DOMContentLoaded', function() {
    // Cache Elementos
    const form = document.getElementById('meuFormulario');
    const tableBody = document.getElementById('tabela-body');
    const liveRegion = document.getElementById('live-region');
    const exportModal = document.getElementById('export-modal');

    /* MÁSCARAS CAMPOS */
    // Máscara telefone: (00) 00000-0000
    document.getElementById('telefone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        e.target.value = value;
    });

    // Máscara CPF: 000.000.000-00
    document.getElementById('cpf').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });

    /* GERENCIAMENTO DO FORMULÁRIO */
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Coleta dados formulário
        const formData = new FormData(form);
        
        // Cria linha tabela
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sanitizeHTML(formData.get('nome'))}</td>
            <td>${sanitizeHTML(formData.get('email'))}</td>
            <td>${sanitizeHTML(formData.get('data-nascimento'))}</td>
            <td>${sanitizeHTML(formData.get('telefone'))}</td>
            <td>${sanitizeHTML(formData.get('endereco'))}</td>
            <td class="actions">
                <button class="delete-btn" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        // Adiciona a linha à tabela
        tableBody.appendChild(row);
        
        form.reset();
        
        saveData();
        
        // Feedback leitor tela
        announceChange('Novo registro adicionado');
        
        // Adiciona evento clique botão deletar
        row.querySelector('.delete-btn').addEventListener('click', function() {
            if(confirm('Deseja realmente excluir este registro?')) {
                row.remove();
                saveData();
                announceChange('Registro removido');
            }
        });
    });

    /* BOTÃO LIMPAR TABELA */
    document.querySelector('.reset-table-btn').addEventListener('click', function() {
        if(tableBody.children.length > 0 && confirm('Tem certeza que deseja limpar toda a tabela?')) {
            tableBody.innerHTML = '';
            localStorage.removeItem('dadosFormulario');
            announceChange('Tabela limpa');
        }
    });

    /* GERENCIAMENTO MODAL EXPORTAÇÃO */
    const exportCSVBtn = document.getElementById('export-csv');
    const exportExcelBtn = document.getElementById('export-excel');
    const cancelExportBtn = document.getElementById('cancel-export');

    // Abre modal exportação
    document.querySelector('.download-btn').addEventListener('click', function() {
        if (tableBody.children.length === 0) {
            alert('A tabela está vazia!');
            return;
        }
        exportModal.style.display = 'block';
    });

    // Fecha modal
    const closeModal = function() {
        exportModal.style.display = 'none';
    };

    // Eventos fechar modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    cancelExportBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        if (e.target === exportModal) {
            closeModal();
        }
    });

    /* EXPORTAÇÃO DADOS */
    exportCSVBtn.addEventListener('click', function() {
        closeModal();
        exportToCSV();
    });

    exportExcelBtn.addEventListener('click', function() {
        closeModal();
        exportToExcel();
    });

    // Função exportar CSV
    function exportToCSV() {
        const rows = Array.from(tableBody.querySelectorAll('tr'));
        const headers = Array.from(document.querySelectorAll('thead th'))
            .map(th => th.textContent)
            .slice(0, -1); // Remove a coluna "Ações"
        
        // Cria CSV
        let csvContent = headers.join(';') + '\n';

        rows.forEach(row => {
            const cells = Array.from(row.cells)
                .slice(0, -1) // Remove a coluna de ações
                .map(cell => `"${cell.textContent.replace(/"/g, '""')}"`);
            csvContent += cells.join(';') + '\n';
        });

        // Download
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dados_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        announceChange('Dados exportados para CSV');
    }

    // Função exportar Excel
    function exportToExcel() {
        const table = document.querySelector('table');
        const workbook = XLSX.utils.table_to_book(table, {
            raw: true,
            sheet: "Dados",
            ignoreElements: (element) => element.classList.contains('delete-btn')
        });

        XLSX.writeFile(workbook, `dados_${new Date().toISOString().slice(0, 10)}.xlsx`);
        announceChange('Dados exportados para Excel');
    }

    /* FUNÇÕES AUXILIARES */
    // Sanitiza conteúdo HTML previne XSS
    function sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Salva dados localStorage
    function saveData() {
        const rows = Array.from(tableBody.querySelectorAll('tr')).map(row => {
            return {
                nome: row.cells[0].textContent,
                email: row.cells[1].textContent,
                dataNascimento: row.cells[2].textContent,
                telefone: row.cells[3].textContent,
                endereco: row.cells[4].textContent
            };
        });
        localStorage.setItem('dadosFormulario', JSON.stringify(rows));
    }

    // Carrega dados localStorage
    function loadData() {
        const data = JSON.parse(localStorage.getItem('dadosFormulario')) || [];
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sanitizeHTML(item.nome)}</td>
                <td>${sanitizeHTML(item.email)}</td>
                <td>${sanitizeHTML(item.dataNascimento)}</td>
                <td>${sanitizeHTML(item.telefone)}</td>
                <td>${sanitizeHTML(item.endereco)}</td>
                <td class="actions">
                    <button class="delete-btn" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
            
            row.querySelector('.delete-btn').addEventListener('click', function() {
                if(confirm('Deseja realmente excluir este registro?')) {
                    row.remove();
                    saveData();
                    announceChange('Registro removido');
                }
            });
        });
    }

    // Feedback tela
    function announceChange(message) {
        liveRegion.textContent = message;
        setTimeout(() => liveRegion.textContent = '', 1000);
    }

    loadData();

    // Previne perda acidental dados
    window.addEventListener('beforeunload', function(e) {
        if (tableBody.children.length > 0) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});