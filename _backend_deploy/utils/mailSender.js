const MailSender = () => {
    const nodemailer = require('nodemailer');
    require('dotenv').config({ path: __dirname + '/../../.env' });

    // 🧪 Test email configuration
    const TEST_EMAIL_REDIRECT = 'romaingiovanni@gmail.com';
    const TEST_EMAIL_DOMAIN = '@swiftapp.test';

    // 🎨 Brand Colors — Cobbr Design System
    const BRAND = {
        // Primary
        primary: '#4361ee',
        primaryHover: '#3a56d4',
        primaryLight: '#8b9df7',
        primaryBg: '#f0f4ff',

        // Text
        textPrimary: '#1a1a2e',
        textSecondary: '#495057',
        textMuted: '#6c757d',

        // Backgrounds
        background: '#f8f9fa',
        surface: '#FFFFFF',
        surfaceAlt: '#f0f4ff',

        // Borders & Accents
        border: '#e5e7eb',
        success: '#22C55E',
        info: '#3B82F6',
        warning: '#F59E0B',

        // Footer
        footerBg: '#1a1a2e',
        footerText: '#adb5bd',
    };

    const FROM_ADDRESS = '"Cobbr" <contact@cobbr-app.com>';

    /**
     * Resolve email destination — redirects test emails
     */
    const resolveEmailAddress = (email) => {
        if (email && email.toLowerCase().endsWith(TEST_EMAIL_DOMAIN)) {
            console.log(`📧 [MailSender] Test email detected: ${email} -> redirecting to ${TEST_EMAIL_REDIRECT}`);
            return TEST_EMAIL_REDIRECT;
        }
        return email;
    };

    /**
     * 🎨 Generate base HTML email template
     */
    const generateEmailTemplate = ({ title, preheader, content, footerExtra = '' }) => {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: ${BRAND.background};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        .preheader {
            display: none !important;
            visibility: hidden;
            opacity: 0;
            color: transparent;
            height: 0;
            width: 0;
            max-height: 0;
            max-width: 0;
            overflow: hidden;
            mso-hide: all;
        }
        .email-container { max-width: 600px; margin: 0 auto; }
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
            .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
            .code-box { font-size: 28px !important; letter-spacing: 6px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.background};">
    <span class="preheader">${preheader}</span>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.background};">
        <tr>
            <td style="padding: 40px 20px;">
                <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto;">
                    <!-- HEADER -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryHover} 100%); border-radius: 16px 16px 0 0; padding: 32px 40px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <div style="font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                                            <span style="display: inline-block; margin-right: 8px;">📦</span>
                                            Cobbr
                                        </div>
                                        <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.85); font-weight: 400;">
                                            Moving Made Simple
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- BODY -->
                    <tr>
                        <td style="background-color: ${BRAND.surface}; padding: 0;">
                            ${content}
                        </td>
                    </tr>
                    <!-- FOOTER -->
                    <tr>
                        <td style="background-color: ${BRAND.footerBg}; border-radius: 0 0 16px 16px; padding: 32px 40px; text-align: center;">
                            <p style="margin: 0 0 16px 0; font-size: 14px; color: ${BRAND.footerText}; line-height: 1.6;">
                                Need help? Contact our support team at<br>
                                <a href="mailto:support@cobbr-app.com" style="color: ${BRAND.primaryLight}; text-decoration: none; font-weight: 500;">support@cobbr-app.com</a>
                            </p>
                            ${footerExtra}
                            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
                            <p style="margin: 0; font-size: 12px; color: rgba(173,181,189,0.6);">
                                &copy; ${new Date().getFullYear()} Cobbr. All rights reserved.<br>
                                Sydney, Australia
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    };

    /**
     * 🔢 Generate verification code digit boxes
     */
    const generateCodeBlock = (code) => {
        const codeDigits = code.toString().split('');
        const digitBoxes = codeDigits.map(digit => `
            <td style="width: 48px; height: 56px; background-color: ${BRAND.surfaceAlt}; border: 2px solid ${BRAND.border}; border-radius: 12px; text-align: center; vertical-align: middle;">
                <span style="font-size: 28px; font-weight: 700; color: ${BRAND.textPrimary}; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${digit}</span>
            </td>
        `).join(`<td style="width: 8px;"></td>`);

        return `
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                    ${digitBoxes}
                </tr>
            </table>
        `;
    };

    /**
     * 📨 Core send function
     */
    const sendMail = async (to, subject, text, html = null) => {
        try {
            const actualRecipient = resolveEmailAddress(to);

            const transporter = nodemailer.createTransport({
                host: 'smtp.ionos.fr',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
            });

            const mailOptions = {
                from: FROM_ADDRESS,
                to: actualRecipient,
                subject: to !== actualRecipient ? `[TEST: ${to}] ${subject}` : subject,
                text,
                ...(html && { html }),
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`📧 Email sent to ${actualRecipient}` + (to !== actualRecipient ? ` (original: ${to})` : '') + ': ' + info.response);
            return { success: true, info };
        } catch (error) {
            console.error('📧 Error sending email:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * ✉️ Verification email with code
     */
    const verificationMail = async (to, code) => {
        const subject = '🔐 Verify your email — Cobbr';

        const text = `
Welcome to Cobbr!

You're just one step away from completing your registration.

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't create an account with Cobbr, please ignore this email.

Best regards,
The Cobbr Team
        `.trim();

        const content = `
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 48px 40px 24px 40px; text-align: center;">
                        <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, ${BRAND.primaryBg} 0%, #FFF 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">
                            ✉️
                        </div>
                        <h1 style="margin: 16px 0 8px; font-size: 24px; font-weight: 700; color: ${BRAND.textPrimary};">
                            Verify your email
                        </h1>
                        <p style="margin: 0; font-size: 16px; color: ${BRAND.textSecondary}; line-height: 1.6;">
                            You're just one step away from completing<br>your registration with Cobbr
                        </p>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 24px 40px;">
                        <p style="margin: 0 0 16px; font-size: 13px; font-weight: 600; color: ${BRAND.textMuted}; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                            Your verification code
                        </p>
                        <div style="background-color: ${BRAND.surfaceAlt}; border: 2px solid ${BRAND.border}; border-radius: 16px; padding: 32px 24px; text-align: center;">
                            ${generateCodeBlock(code)}
                            <p style="margin: 20px 0 0; font-size: 13px; color: ${BRAND.textMuted};">
                                ⏱️ This code expires in <strong style="color: ${BRAND.textSecondary};">10 minutes</strong>
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 24px 40px 48px;">
                        <div style="background-color: ${BRAND.primaryBg}; border-left: 4px solid ${BRAND.primary}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
                            <p style="margin: 0; font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.6;">
                                <strong style="color: ${BRAND.textPrimary};">💡 Tip:</strong> Enter this code in the Cobbr app to verify your email address and complete your registration.
                            </p>
                        </div>
                        <p style="margin: 24px 0 0; font-size: 13px; color: ${BRAND.textMuted}; text-align: center; line-height: 1.6;">
                            If you didn't create an account with Cobbr,<br>you can safely ignore this email.
                        </p>
                    </td>
                </tr>
            </table>
        `;

        const html = generateEmailTemplate({
            title: 'Verify your email — Cobbr',
            preheader: `Your verification code is ${code}. Enter this code to complete your Cobbr registration.`,
            content,
        });

        return await sendMail(to, subject, text, html);
    };

    /**
     * 🎉 Welcome email after verification
     */
    const welcomeMail = async (to, firstName) => {
        const subject = '🎉 Welcome to Cobbr!';

        const text = `
Welcome to Cobbr, ${firstName}!

Your email has been verified successfully. You're now ready to start using Cobbr.

Get started by:
1. Complete your profile
2. Set up your business details
3. Start managing your jobs

If you have any questions, our support team is here to help.

Best regards,
The Cobbr Team
        `.trim();

        const content = `
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 48px 40px 24px; text-align: center;">
                        <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #DCFCE7 0%, #FFF 100%); border-radius: 50%; line-height: 80px; font-size: 36px; margin-bottom: 24px;">
                            🎉
                        </div>
                        <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: ${BRAND.textPrimary};">
                            Welcome aboard, ${firstName}!
                        </h1>
                        <p style="margin: 0; font-size: 16px; color: ${BRAND.textSecondary}; line-height: 1.6;">
                            Your email has been verified successfully.<br>You're ready to start using Cobbr!
                        </p>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 24px 40px 48px;">
                        <p style="margin: 0 0 20px; font-size: 14px; font-weight: 600; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 1px;">
                            Get started in 3 easy steps
                        </p>
                        <!-- Step boxes using table layout for email compatibility -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
                            <tr>
                                <td style="width: 48px; vertical-align: top; padding: 16px 0 16px 16px;">
                                    <div style="width: 32px; height: 32px; background: ${BRAND.primary}; border-radius: 50%; text-align: center; line-height: 32px; color: white; font-weight: 700; font-size: 14px;">1</div>
                                </td>
                                <td style="vertical-align: top; padding: 16px 16px 16px 8px; background: ${BRAND.surfaceAlt}; border-radius: 12px;">
                                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: ${BRAND.textPrimary};">Complete your profile</p>
                                    <p style="margin: 4px 0 0; font-size: 13px; color: ${BRAND.textMuted};">Add your details and preferences</p>
                                </td>
                            </tr>
                        </table>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
                            <tr>
                                <td style="width: 48px; vertical-align: top; padding: 16px 0 16px 16px;">
                                    <div style="width: 32px; height: 32px; background: ${BRAND.primary}; border-radius: 50%; text-align: center; line-height: 32px; color: white; font-weight: 700; font-size: 14px;">2</div>
                                </td>
                                <td style="vertical-align: top; padding: 16px 16px 16px 8px; background: ${BRAND.surfaceAlt}; border-radius: 12px;">
                                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: ${BRAND.textPrimary};">Set up your business</p>
                                    <p style="margin: 4px 0 0; font-size: 13px; color: ${BRAND.textMuted};">Add your ABN, banking & insurance</p>
                                </td>
                            </tr>
                        </table>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td style="width: 48px; vertical-align: top; padding: 16px 0 16px 16px;">
                                    <div style="width: 32px; height: 32px; background: ${BRAND.primary}; border-radius: 50%; text-align: center; line-height: 32px; color: white; font-weight: 700; font-size: 14px;">3</div>
                                </td>
                                <td style="vertical-align: top; padding: 16px 16px 16px 8px; background: ${BRAND.surfaceAlt}; border-radius: 12px;">
                                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: ${BRAND.textPrimary};">Start managing jobs</p>
                                    <p style="margin: 4px 0 0; font-size: 13px; color: ${BRAND.textMuted};">Create, assign and track your work</p>
                                </td>
                            </tr>
                        </table>
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="https://cobbr-app.com" style="display: inline-block; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryHover} 100%); color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 16px; padding: 16px 48px; border-radius: 12px; box-shadow: 0 4px 14px rgba(67, 97, 238, 0.4);">
                                Open Cobbr
                            </a>
                        </div>
                    </td>
                </tr>
            </table>
        `;

        const html = generateEmailTemplate({
            title: 'Welcome to Cobbr!',
            preheader: `Welcome aboard, ${firstName}! Your email has been verified. Start using Cobbr now.`,
            content,
        });

        return await sendMail(to, subject, text, html);
    };

    /**
     * 🔑 Password reset email with code
     */
    const passwordResetMail = async (to, code, firstName) => {
        const subject = '🔑 Reset your password — Cobbr';

        const text = `
Password Reset Request

You requested to reset your password for your Cobbr account.

Your password reset code is: ${code}

This code will expire in 15 minutes.

If you didn't request this, please ignore this email or contact support.

Best regards,
The Cobbr Team
        `.trim();

        const content = `
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 48px 40px 24px; text-align: center;">
                        <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #FEF3C7 0%, #FFF 100%); border-radius: 50%; line-height: 64px; font-size: 28px; margin-bottom: 24px;">
                            🔑
                        </div>
                        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: ${BRAND.textPrimary};">
                            Reset your password
                        </h1>
                        <p style="margin: 0; font-size: 16px; color: ${BRAND.textSecondary}; line-height: 1.6;">
                            ${firstName ? `Hi <strong>${firstName}</strong>, we` : 'We'} received a request to reset the password<br>for your Cobbr account
                        </p>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 24px 40px;">
                        <p style="margin: 0 0 16px; font-size: 13px; font-weight: 600; color: ${BRAND.textMuted}; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                            Your reset code
                        </p>
                        <div style="background-color: ${BRAND.surfaceAlt}; border: 2px solid ${BRAND.border}; border-radius: 16px; padding: 32px 24px; text-align: center;">
                            ${generateCodeBlock(code)}
                            <p style="margin: 20px 0 0; font-size: 13px; color: ${BRAND.textMuted};">
                                ⏱️ This code expires in <strong style="color: ${BRAND.textSecondary};">15 minutes</strong>
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 24px 40px 48px;">
                        <div style="background-color: #FEF3C7; border-left: 4px solid ${BRAND.warning}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
                            <p style="margin: 0; font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.6;">
                                <strong style="color: ${BRAND.textPrimary};">⚠️ Security notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
        `;

        const html = generateEmailTemplate({
            title: 'Reset your password — Cobbr',
            preheader: `Your password reset code is ${code}. This code expires in 15 minutes.`,
            content,
        });

        return await sendMail(to, subject, text, html);
    };

    /**
     * 📋 Invoice notification email (sent by cron when invoice is generated)
     * @param {Object} options
     * @param {string} options.to - recipient email
     * @param {string} options.companyName - company display name
     * @param {string} options.invoiceNumber - e.g. INV-202604-00001
     * @param {string} options.periodLabel - e.g. "March 2026"
     * @param {number} options.totalAmount - total in AUD
     * @param {number} options.totalJobs - number of jobs
     * @param {string} [options.dueDate] - formatted due date
     * @param {string} [options.logoUrl] - signed GCS logo URL
     * @param {string} [options.primaryColor] - company brand color
     */
    const invoiceNotificationMail = async ({
        to,
        companyName,
        invoiceNumber,
        periodLabel,
        totalAmount,
        totalJobs,
        dueDate,
        logoUrl,
        primaryColor,
    }) => {
        const brandColor = primaryColor || BRAND.primary;
        const brandColorLight = brandColor + '1A';
        const subject = `📋 Your ${periodLabel} invoice is ready — ${invoiceNumber}`;

        const text = `
Hi ${companyName},

Your monthly invoice for ${periodLabel} is now available.

Invoice: ${invoiceNumber}
Amount: $${Number(totalAmount).toFixed(2)} AUD
Jobs: ${totalJobs} completed
${dueDate ? `Due: ${dueDate}` : ''}

Open the Cobbr app to view the full breakdown and download your invoice.

Best regards,
The Cobbr Team
        `.trim();

        const logoHtml = logoUrl
            ? `<img src="${logoUrl}" alt="${companyName}" style="max-height:50px;max-width:180px;object-fit:contain;margin-bottom:12px;" /><br>`
            : '';

        const content = `
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 48px 40px 24px; text-align: center;">
                        <!-- Company branding -->
                        ${logoHtml}
                        <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: ${BRAND.textPrimary};">
                            Monthly Invoice Ready
                        </h1>
                        <p style="margin: 0; font-size: 16px; color: ${BRAND.textSecondary}; line-height: 1.6;">
                            Hi <strong>${companyName}</strong>, your invoice for <strong>${periodLabel}</strong> is now available.
                        </p>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 24px 40px;">
                        <div style="background: ${brandColorLight}; border: 2px solid ${brandColor}22; border-radius: 16px; padding: 28px; text-align: center;">
                            <p style="margin: 0 0 4px; font-size: 13px; color: ${BRAND.textMuted}; text-transform: uppercase; letter-spacing: 1px;">${invoiceNumber}</p>
                            <p style="margin: 0; font-size: 2.2rem; font-weight: 700; color: ${brandColor};">$${Number(totalAmount).toFixed(2)}</p>
                            <p style="margin: 4px 0 0; font-size: 14px; color: ${BRAND.textSecondary};">AUD &mdash; ${totalJobs} job${totalJobs > 1 ? 's' : ''} completed</p>
                            ${dueDate ? `<p style="margin: 12px 0 0; font-size: 13px; color: ${BRAND.textMuted};">Due: <strong>${dueDate}</strong></p>` : ''}
                        </div>
                    </td>
                </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 24px 40px 48px; text-align: center;">
                        <p style="margin: 0 0 24px; font-size: 14px; color: ${BRAND.textMuted}; line-height: 1.6;">
                            Open the Cobbr app to view the full breakdown,<br>download or send this invoice to your client.
                        </p>
                        <a href="https://cobbr-app.com" style="display: inline-block; background: linear-gradient(135deg, ${brandColor} 0%, ${brandColor}DD 100%); color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 40px; border-radius: 12px; box-shadow: 0 4px 14px ${brandColor}40;">
                            View Invoice
                        </a>
                    </td>
                </tr>
            </table>
        `;

        const html = generateEmailTemplate({
            title: `Invoice ${invoiceNumber} — ${periodLabel}`,
            preheader: `Your ${periodLabel} invoice ($${Number(totalAmount).toFixed(2)} AUD) is ready. Open Cobbr to view details.`,
            content,
        });

        return await sendMail(to, subject, text, html);
    };

    /**
     * 📋 Detailed invoice email (sent manually from the app via "Send Invoice")
     * Builds a full branded invoice with line items table
     * @param {Object} options
     * @param {string} options.to - recipient email
     * @param {Object} options.invoice - invoice row from DB
     * @param {Array}  options.items - invoice line items
     * @param {string} [options.logoUrl] - signed GCS logo URL
     */
    const invoiceDetailMail = async ({ to, invoice, items, logoUrl }) => {
        const brandColor = invoice.company_primary_color || BRAND.primary;
        const brandColorLight = brandColor + '1A';
        const periodLabel = formatPeriod(invoice.period_start);
        const companyName = invoice.company_display_name || invoice.company_name || 'Your Company';
        const subject = `📋 Invoice ${invoice.invoice_number} — ${periodLabel}`;

        const text = `
Invoice ${invoice.invoice_number}
${companyName}
Period: ${periodLabel}

${items.map(item => `${item.job_code || '#' + item.job_id} — $${Number(item.amount).toFixed(2)}`).join('\n')}

Subtotal: $${Number(invoice.subtotal).toFixed(2)}
${invoice.commission_amount > 0 ? `Commission (${invoice.commission_rate}%): -$${Number(invoice.commission_amount).toFixed(2)}` : ''}
GST (10%): $${Number(invoice.tax_amount).toFixed(2)}
Total: $${Number(invoice.total_amount).toFixed(2)} ${invoice.currency}
${invoice.due_date ? `Due: ${new Date(invoice.due_date).toLocaleDateString('en-AU')}` : ''}

Powered by Cobbr — Moving Made Simple
        `.trim();

        const logoHtml = logoUrl
            ? `<img src="${logoUrl}" alt="${companyName}" style="max-height:60px;max-width:200px;object-fit:contain;margin-bottom:12px;" />`
            : '';

        const itemsHtml = items.map(item => `
            <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:0.9rem;color:${BRAND.textPrimary};">${item.job_code || '#' + item.job_id}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:0.9rem;color:${BRAND.textSecondary};">${item.job_date ? new Date(item.job_date).toLocaleDateString('en-AU') : '—'}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:0.9rem;color:${BRAND.textSecondary};">${item.billing_mode === 'flat_rate' ? 'Flat rate' : item.hours_worked ? item.hours_worked + 'h' : '—'}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:0.9rem;text-align:right;font-weight:600;color:${BRAND.textPrimary};">$${Number(item.amount).toFixed(2)}</td>
            </tr>
        `).join('');

        const content = `
            <!-- Company Header -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 40px 40px 20px; text-align: center; border-bottom: 3px solid ${brandColor};">
                        ${logoHtml}
                        <h1 style="margin: 0; font-size: 1.4rem; color: ${brandColor}; font-weight: 700;">${companyName}</h1>
                        <p style="margin: 4px 0 16px; font-size: 0.9rem; color: ${BRAND.textMuted};">Monthly Invoice &mdash; ${invoice.invoice_number}</p>
                    </td>
                </tr>
            </table>

            <!-- Invoice meta -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 20px 40px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td style="font-size: 0.9rem; color: ${BRAND.textSecondary}; line-height: 1.6;">
                                    ${invoice.company_abn ? 'ABN: ' + invoice.company_abn + '<br/>' : ''}
                                    Period: ${periodLabel}
                                </td>
                                <td style="text-align: right; font-size: 0.9rem; color: ${BRAND.textSecondary};">
                                    Due: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-AU') : '—'}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Items table -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 0 40px;">
                        <table style="width:100%;border-collapse:collapse;">
                            <thead>
                                <tr style="background:${brandColorLight};">
                                    <th style="padding:10px 12px;text-align:left;font-size:0.85rem;color:${brandColor};font-weight:600;">Job</th>
                                    <th style="padding:10px 12px;text-align:left;font-size:0.85rem;color:${brandColor};font-weight:600;">Date</th>
                                    <th style="padding:10px 12px;text-align:left;font-size:0.85rem;color:${brandColor};font-weight:600;">Hours/Type</th>
                                    <th style="padding:10px 12px;text-align:right;font-size:0.85rem;color:${brandColor};font-weight:600;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Totals -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td class="mobile-padding" style="padding: 24px 40px 40px;">
                        <div style="border-top:2px solid #e5e7eb;padding-top:16px;">
                            <table style="width:100%;font-size:0.95rem;">
                                <tr>
                                    <td style="padding:4px 0;color:${BRAND.textMuted};">Subtotal (${invoice.total_jobs} jobs)</td>
                                    <td style="padding:4px 0;text-align:right;color:${BRAND.textPrimary};">$${Number(invoice.subtotal).toFixed(2)}</td>
                                </tr>
                                ${invoice.commission_amount > 0 ? `
                                <tr>
                                    <td style="padding:4px 0;color:${BRAND.textMuted};">Platform commission (${invoice.commission_rate}%)</td>
                                    <td style="padding:4px 0;text-align:right;color:#EF4444;">-$${Number(invoice.commission_amount).toFixed(2)}</td>
                                </tr>` : ''}
                                <tr>
                                    <td style="padding:4px 0;color:${BRAND.textMuted};">GST (10%)</td>
                                    <td style="padding:4px 0;text-align:right;color:${BRAND.textPrimary};">$${Number(invoice.tax_amount).toFixed(2)}</td>
                                </tr>
                                <tr style="font-weight:bold;font-size:1.1rem;">
                                    <td style="padding:8px 0;border-top:2px solid ${brandColor};">Total</td>
                                    <td style="padding:8px 0;border-top:2px solid ${brandColor};text-align:right;color:${brandColor};">$${Number(invoice.total_amount).toFixed(2)} ${invoice.currency}</td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>
        `;

        const html = generateEmailTemplate({
            title: `Invoice ${invoice.invoice_number} — ${periodLabel}`,
            preheader: `Invoice ${invoice.invoice_number} for ${periodLabel} — $${Number(invoice.total_amount).toFixed(2)} ${invoice.currency}`,
            content,
            footerExtra: `<p style="margin: 0 0 8px; font-size: 12px; color: rgba(173,181,189,0.6);">This invoice was generated by ${companyName} via Cobbr.</p>`,
        });

        return await sendMail(to, subject, text, html);
    };

    /**
     * Format period label from date
     */
    function formatPeriod(periodStart) {
        const d = new Date(periodStart);
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];
        return `${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    return {
        sendMail,
        verificationMail,
        welcomeMail,
        passwordResetMail,
        invoiceNotificationMail,
        invoiceDetailMail,
        generateEmailTemplate,
        formatPeriod,
        BRAND,
    };
};

module.exports = MailSender;
module.exports.MailSender = MailSender;
