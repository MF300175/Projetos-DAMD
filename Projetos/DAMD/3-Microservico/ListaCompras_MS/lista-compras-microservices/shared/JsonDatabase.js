// shared/JsonDatabase.js
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class JsonDatabase {
    constructor(dbPath, collectionName) {
        this.dbPath = path.resolve(dbPath);
        this.collectionName = collectionName;
        this.collectionFile = path.join(this.dbPath, `${collectionName}.json`);
        
        // Garantir que o diretório existe
        fs.ensureDirSync(this.dbPath);
        
        // Inicializar arquivo se não existir
        this.initializeFile();
        
        console.log(`JsonDatabase inicializado: ${this.collectionName} em ${this.collectionFile}`);
    }

    initializeFile() {
        if (!fs.existsSync(this.collectionFile)) {
            fs.writeJsonSync(this.collectionFile, [], { spaces: 2 });
        }
    }

    async readData() {
        try {
            const data = await fs.readJson(this.collectionFile);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Erro ao ler dados:', error);
            return [];
        }
    }

    async writeData(data) {
        try {
            await fs.writeJson(this.collectionFile, data, { spaces: 2 });
            return true;
        } catch (error) {
            console.error('Erro ao escrever dados:', error);
            return false;
        }
    }

    // CREATE - Criar novo documento
    async create(document) {
        const data = await this.readData();
        
        // Gerar ID se não fornecido
        if (!document.id) {
            document.id = uuidv4();
        }
        
        // Adicionar timestamps
        document.createdAt = new Date().toISOString();
        document.updatedAt = new Date().toISOString();
        
        data.push(document);
        await this.writeData(data);
        
        console.log(`Documento criado: ${document.id}`);
        return document;
    }

    // READ - Buscar documentos
    async find(query = {}) {
        const data = await this.readData();
        
        if (Object.keys(query).length === 0) {
            return data;
        }
        
        return data.filter(doc => this.matchesQuery(doc, query));
    }

    // READ - Buscar um documento
    async findOne(query) {
        const data = await this.readData();
        return data.find(doc => this.matchesQuery(doc, query));
    }

    // READ - Buscar por ID
    async findById(id) {
        const data = await this.readData();
        return data.find(doc => doc.id === id);
    }

    // UPDATE - Atualizar documento
    async update(id, updateData) {
        const data = await this.readData();
        const index = data.findIndex(doc => doc.id === id);
        
        if (index === -1) {
            throw new Error(`Documento não encontrado: ${id}`);
        }
        
        // Preservar ID e timestamps
        const updatedDoc = {
            ...data[index],
            ...updateData,
            id: data[index].id, // Preservar ID original
            createdAt: data[index].createdAt, // Preservar createdAt
            updatedAt: new Date().toISOString()
        };
        
        data[index] = updatedDoc;
        await this.writeData(data);
        
        console.log(`Documento atualizado: ${id}`);
        return updatedDoc;
    }

    // DELETE - Deletar documento
    async delete(id) {
        const data = await this.readData();
        const index = data.findIndex(doc => doc.id === id);
        
        if (index === -1) {
            throw new Error(`Documento não encontrado: ${id}`);
        }
        
        const deletedDoc = data.splice(index, 1)[0];
        await this.writeData(data);
        
        console.log(`Documento deletado: ${id}`);
        return deletedDoc;
    }

    // COUNT - Contar documentos
    async count(query = {}) {
        const data = await this.readData();
        
        if (Object.keys(query).length === 0) {
            return data.length;
        }
        
        return data.filter(doc => this.matchesQuery(doc, query)).length;
    }

    // SEARCH - Busca textual
    async search(searchTerm, fields = []) {
        const data = await this.readData();
        const term = searchTerm.toLowerCase();
        
        return data.filter(doc => {
            if (fields.length === 0) {
                // Buscar em todos os campos string
                return this.searchInObject(doc, term);
            } else {
                // Buscar apenas nos campos especificados
                return fields.some(field => {
                    const value = this.getNestedValue(doc, field);
                    return typeof value === 'string' && value.toLowerCase().includes(term);
                });
            }
        });
    }

    // Helper: Verificar se documento corresponde à query
    matchesQuery(doc, query) {
        for (const [key, value] of Object.entries(query)) {
            if (key.startsWith('$')) {
                // Operadores especiais
                if (key === '$or') {
                    if (!Array.isArray(value)) return false;
                    return value.some(condition => this.matchesQuery(doc, condition));
                }
                if (key === '$and') {
                    if (!Array.isArray(value)) return false;
                    return value.every(condition => this.matchesQuery(doc, condition));
                }
            } else {
                // Comparação simples
                const docValue = this.getNestedValue(doc, key);
                if (docValue !== value) {
                    return false;
                }
            }
        }
        return true;
    }

    // Helper: Obter valor aninhado
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    // Helper: Buscar termo em objeto
    searchInObject(obj, searchTerm) {
        for (const value of Object.values(obj)) {
            if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
                return true;
            }
            if (typeof value === 'object' && value !== null && this.searchInObject(value, searchTerm)) {
                return true;
            }
        }
        return false;
    }

    // Método para limpar todos os dados (útil para testes)
    async clear() {
        await this.writeData([]);
        console.log(`Coleção ${this.collectionName} limpa`);
    }

    // Método para obter estatísticas
    async stats() {
        const data = await this.readData();
        return {
            collection: this.collectionName,
            totalDocuments: data.length,
            fileSize: fs.existsSync(this.collectionFile) ? fs.statSync(this.collectionFile).size : 0,
            lastModified: fs.existsSync(this.collectionFile) ? fs.statSync(this.collectionFile).mtime : null
        };
    }
}

module.exports = JsonDatabase;

