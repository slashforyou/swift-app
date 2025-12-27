import { TranslationKeys } from '../types';

// Note: Chinese translations are partial - using type assertion
export const zhTranslations = {
    common: {
        save: '保存',
        cancel: '取消',
        delete: '删除',
        edit: '编辑',
        add: '添加',
        search: '搜索',
        loading: '加载中...',
        error: '错误',
        success: '成功',
        warning: '警告',
        info: '信息',
        yes: '是',
        no: '否',
        ok: '确定',
        close: '关闭',
        back: '返回',
        next: '下一个',
        previous: '上一个',
        done: '完成',
        continue: '继续',
        skip: '跳过',
        retry: '重试',
        refresh: '刷新',
        settings: '设置',
        language: '语言',
    },

    home: {
        title: '主页',
        welcome: '欢迎回来！',
        calendar: {
            title: '日历',
            description: '查看和管理您的日程',
        },
        business: {
            title: '业务',
            description: '账单、配置和管理',
        },
        jobs: {
            title: '工作',
            description: '管理您的工作任务',
        },
        profile: {
            title: '个人资料',
            description: '查看和编辑您的个人资料',
        },
        parameters: {
            title: '参数',
            description: '配置应用偏好设置',
        },
        connection: {
            title: '连接',
            description: '测试服务器连接',
            testConnection: '测试连接',
            status: {
                connected: '已连接',
                disconnected: '已断开',
                testing: '测试中...',
            },
        },
    },

    navigation: {
        home: '主页',
        calendar: '日历',
        jobs: '工作',
        profile: '个人资料',
        settings: '设置',
    },

    jobs: {
        title: '工作',
        status: {
            pending: '待处理',
            inProgress: '进行中',
            completed: '已完成',
            cancelled: '已取消',
        },
        timer: {
            start: '开始计时',
            stop: '停止计时',
            pause: '暂停',
            resume: '继续',
            break: '休息',
            endBreak: '结束休息',
            totalTime: '总时间',
            billableTime: '计费时间',
            breakTime: '休息时间',
            currentStep: '当前步骤',
        },
        details: {
            information: '信息',
            items: '项目',
            contacts: '联系人',
            timeline: '时间线',
            payment: '付款',
            summary: '摘要',
        },
    },

    calendar: {
        title: '日历',
        // Jours de la semaine (abréviations)
        days: {
            mon: '周一',
            tue: '周二',
            wed: '周三',
            thu: '周四',
            fri: '周五',
            sat: '周六',
            sun: '周日',
        },
        // Mois complets
        months: {
            january: '一月',
            february: '二月',
            march: '三月',
            april: '四月',
            may: '五月',
            june: '六月',
            july: '七月',
            august: '八月',
            september: '九月',
            october: '十月',
            november: '十一月',
            december: '十二月',
        },
        // Statistiques
        stats: {
            totalJobs: '总工作数',
            urgent: '紧急',
            completed: '已完成',
        },
        // Actions
        refresh: '刷新',
        goToDay: '转到日期',
        previousMonth: '上个月',
        nextMonth: '下个月',
        // Filtres et tri
        filters: {
            all: '全部',
            pending: '待处理',
            active: '进行中',
            done: '已完成',
        },
        sorting: {
            time: '时间',
            priority: '优先级',
            status: '状态',
        },
        // Navigation
        previousDay: '前一天',
        nextDay: '后一天',
        // Vue annuelle
        currentYear: '当前年份',
        years: '年份',
        selectFromRange: '选择范围',
        // États
        loading: '加载中...',
        noJobsScheduled: '未安排工作',
        freeDay: '您有空闲的一天',
        enjoyTimeOff: '享受您的空闲时间！',
        somethingWentWrong: '出现了问题',
        tryAgain: '重试',
        // Statut et priorité des jobs
        jobStatus: {
            pending: '待处理',
            inProgress: '进行中',
            completed: '已完成',
            cancelled: '已取消',
            unknown: '未知',
        },
        priority: {
            urgent: '紧急',
            high: '高',
            medium: '中',
            low: '低',
            normal: '正常',
        },
        // Client
        unknownClient: '未知客户',
        // Navigation
        navigation: {
            monthlyView: '月视图',
            yearlyView: '年视图',
            multiYearView: '多年视图',
            dailyView: '日视图',
            loadingCalendar: '加载日历中',
            authenticationError: '认证错误',
            goToLogin: '前往登录',
            loading: '加载中',
        },
        // Day Screen specific
        dayScreen: {
            stats: {
                total: '总计',
                pending: '待处理',
                completed: '已完成',
            },
            filtersTitle: '工作和筛选',
            sortBy: '排序方式：',
        },
    },

    profile: {
        title: '个人资料',
        personalInfo: '个人信息',
        preferences: '偏好设置',
        logout: '登出',
        version: '版本',
        level: '级别',
        experience: '经验',
        toNextLevel: '到下一级',
        defaultTitle: '司机',
    },

    jobDetails: {
        panels: {
            summary: '工作摘要',
            jobDetails: '工作详情',
            clientInfo: '客户信息',
            notes: '备注',
            payment: '付款',
        },
        errors: {
            invalidJobId: '无效的工作ID',
            cannotLoadDetails: '无法加载工作详情',
            loadingError: '加载错误',
        },
        steps: {
            pickup: '取货',
            intermediate: '中间站',
            dropoff: '送达',
            pickupDescription: '从客户处取货',
            intermediateDescription: '在中间位置存放',
            dropoffDescription: '在最终位置存放',
        },
        client: {
            firstTimeClient: '首次客户',
        },
        defaultNote: '备注',
        messages: {
            noteAdded: '已添加备注',
            noteAddedSuccess: '备注已成功保存',
            noteAddError: '错误',
            noteAddErrorMessage: '无法添加备注。请重试。',
            photoAdded: '已添加照片',
            photoAddedSuccess: '照片已成功上传',
            photoAddError: '错误',
            photoAddErrorMessage: '无法添加照片。请重试。',
            photoDescription: '工作照片',
            nextStep: '下一步',
            advancedToStep: '已进入步骤',
        },
    },

    settings: {
        title: '设置',
        language: {
            title: '语言',
            description: '选择您的首选语言',
            current: '当前语言',
            select: '选择语言',
        },
        theme: {
            title: '主题',
            light: '浅色',
            dark: '深色',
            auto: '自动',
        },
        notifications: {
            title: '通知',
            enabled: '已启用',
            disabled: '已禁用',
        },
    },

    business: {
        navigation: {
            loadingBusiness: '加载业务部分中...',
            authenticationError: '认证错误',
            goToLogin: '前往登录',
            businessInfo: '业务信息',
            staffCrew: '员工/团队',
            trucks: '车辆',
            jobsBilling: '工作/账单',
        },
        info: {
            title: '业务信息',
            placeholder: '本部分将包含您公司的信息：联系方式、配置、常规设置。',
        },
        staff: {
            title: '员工和团队',
            placeholder: '在此管理您的团队：添加成员、分配角色、跟踪技能和可用性。',
        },
        trucks: {
            title: '车辆和设备',
            placeholder: '管理您的车队和设备：添加卡车、跟踪维护、安排维修。',
        },
        jobs: {
            title: '工作和账单',
            placeholder: '创建新工作、生成发票并跟踪项目的盈利能力。',
        },
    },

    messages: {
        errors: {
            network: '网络连接错误',
            generic: '发生错误',
            notFound: '未找到资源',
            unauthorized: '未经授权的访问',
            serverError: '服务器错误',
            validation: '无效输入',
        },
        success: {
            saved: '成功保存',
            deleted: '成功删除',
            updated: '成功更新',
            created: '成功创建',
        },
    },
} as unknown as TranslationKeys;