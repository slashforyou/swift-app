import { TranslationKeys } from '../types';

export const zhTranslations: TranslationKeys = {
    common: {
        save: '保存', cancel: '取消', delete: '删除', edit: '编辑', add: '添加',
        search: '搜索', loading: '加载中...', error: '错误', success: '成功',
        warning: '警告', info: '信息', yes: '是', no: '否', ok: '确定', close: '关闭',
        back: '返回', next: '下一步', previous: '上一步', done: '完成', continue: '继续',
        skip: '跳过', retry: '重试', refresh: '刷新', settings: '设置', language: '语言',
    },
    home: {
        title: '首页', welcome: '欢迎回来！',
        calendar: { title: '日历', description: '查看和管理您的日程' },
        jobs: { title: '工作', description: '管理您的工作任务' },
        profile: { title: '个人资料', description: '查看和编辑您的个人资料' },
        parameters: { title: '设置', description: '配置应用程序偏好' },
        connection: {
            title: '连接', description: '测试服务器连接', testConnection: '测试连接',
            status: { connected: '已连接', disconnected: '已断开', testing: '测试中...' },
        },
    },
    navigation: { home: '首页', calendar: '日历', jobs: '工作', profile: '个人资料', settings: '设置' },
    jobs: {
        title: '工作',
        status: { pending: '待处理', inProgress: '进行中', completed: '已完成', cancelled: '已取消' },
        timer: {
            start: '开始计时', stop: '停止计时', pause: '暂停', resume: '继续',
            break: '休息', endBreak: '结束休息', totalTime: '总时间',
            billableTime: '计费时间', breakTime: '休息时间', currentStep: '当前步骤',
        },
        details: { information: '信息', items: '项目', contacts: '联系人', timeline: '时间线', payment: '付款', summary: '摘要' },
    },
    profile: { title: '个人资料', personalInfo: '个人信息', preferences: '偏好设置', logout: '登出', version: '版本' },
    settings: {
        title: '设置',
        language: { title: '语言', description: '选择您的首选语言', current: '当前语言', select: '选择语言' },
        theme: { title: '主题', light: '浅色', dark: '深色', auto: '自动' },
        notifications: { title: '通知', enabled: '已启用', disabled: '已禁用' },
    },
    messages: {
        errors: { network: '网络连接错误', generic: '出现问题', notFound: '未找到资源', unauthorized: '未授权访问', serverError: '服务器错误', validation: '输入无效' },
        success: { saved: '保存成功', deleted: '删除成功', updated: '更新成功', created: '创建成功' },
    },
};