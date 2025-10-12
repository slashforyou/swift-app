import { TranslationKeys } from '../types';

export const ptTranslations: TranslationKeys = {
    common: {
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar',
        add: 'Adicionar',
        search: 'Pesquisar',
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
        warning: 'Aviso',
        info: 'Info',
        yes: 'Sim',
        no: 'Não',
        ok: 'OK',
        close: 'Fechar',
        back: 'Voltar',
        next: 'Próximo',
        previous: 'Anterior',
        done: 'Concluído',
        continue: 'Continuar',
        skip: 'Pular',
        retry: 'Tentar novamente',
        refresh: 'Atualizar',
        settings: 'Configurações',
        language: 'Idioma',
    },

    home: {
        title: 'Início',
        welcome: 'Bem-vindo de volta!',
        calendar: {
            title: 'Calendário',
            description: 'Visualize e gerencie sua agenda',
        },
        jobs: {
            title: 'Trabalhos',
            description: 'Gerencie suas atribuições de trabalho',
        },
        profile: {
            title: 'Perfil',
            description: 'Visualize e edite seu perfil',
        },
        parameters: {
            title: 'Configurações',
            description: 'Configure as preferências do aplicativo',
        },
        connection: {
            title: 'Conexão',
            description: 'Teste a conectividade do servidor',
            testConnection: 'Testar Conexão',
            status: {
                connected: 'Conectado',
                disconnected: 'Desconectado',
                testing: 'Testando...',
            },
        },
    },

    navigation: {
        home: 'Início',
        calendar: 'Calendário',
        jobs: 'Trabalhos',
        profile: 'Perfil',
        settings: 'Configurações',
    },

    jobs: {
        title: 'Trabalhos',
        status: {
            pending: 'Pendente',
            inProgress: 'Em Andamento',
            completed: 'Concluído',
            cancelled: 'Cancelado',
        },
        timer: {
            start: 'Iniciar Cronômetro',
            stop: 'Parar Cronômetro',
            pause: 'Pausar',
            resume: 'Retomar',
            break: 'Fazer Pausa',
            endBreak: 'Terminar Pausa',
            totalTime: 'Tempo Total',
            billableTime: 'Tempo Faturável',
            breakTime: 'Tempo de Pausa',
            currentStep: 'Etapa Atual',
        },
        details: {
            information: 'Informações',
            items: 'Itens',
            contacts: 'Contatos',
            timeline: 'Linha do Tempo',
            payment: 'Pagamento',
            summary: 'Resumo',
        },
    },

    profile: {
        title: 'Perfil',
        personalInfo: 'Informações Pessoais',
        preferences: 'Preferências',
        logout: 'Sair',
        version: 'Versão',
    },

    settings: {
        title: 'Configurações',
        language: {
            title: 'Idioma',
            description: 'Escolha seu idioma preferido',
            current: 'Idioma atual',
            select: 'Selecionar idioma',
        },
        theme: {
            title: 'Tema',
            light: 'Claro',
            dark: 'Escuro',
            auto: 'Automático',
        },
        notifications: {
            title: 'Notificações',
            enabled: 'Ativadas',
            disabled: 'Desativadas',
        },
    },

    messages: {
        errors: {
            network: 'Erro de conexão de rede',
            generic: 'Algo deu errado',
            notFound: 'Recurso não encontrado',
            unauthorized: 'Acesso não autorizado',
            serverError: 'Erro do servidor',
            validation: 'Entrada inválida',
        },
        success: {
            saved: 'Salvo com sucesso',
            deleted: 'Excluído com sucesso',
            updated: 'Atualizado com sucesso',
            created: 'Criado com sucesso',
        },
    },
};