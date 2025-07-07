const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const mjml2html = require('mjml');

class EmailTemplateEngine {
  constructor() {
    this.templates = {};
    this.baseTemplate = null;
    this.helpers = {};
    this.loadHelpers();
  }

  // Load Handlebars helpers
  loadHelpers() {
    // Format date helper
    handlebars.registerHelper('formatDate', (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    // Uppercase helper
    handlebars.registerHelper('uppercase', (str) => {
      return str ? str.toUpperCase() : '';
    });

    // Conditional helper
    handlebars.registerHelper('ifEquals', (arg1, arg2, options) => {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });
  }

  // Load base template
  async loadBaseTemplate() {
    if (!this.baseTemplate) {
      const baseTemplatePath = path.join(__dirname, '../templates/email/layouts/base.mjml');
      const baseTemplateContent = await fs.readFile(baseTemplatePath, 'utf-8');
      this.baseTemplate = handlebars.compile(baseTemplateContent);
    }
    return this.baseTemplate;
  }

  // Load specific email template
  async loadTemplate(templateName) {
    if (!this.templates[templateName]) {
      const templatePath = path.join(__dirname, `../templates/email/${templateName}.mjml`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      this.templates[templateName] = handlebars.compile(templateContent);
    }
    return this.templates[templateName];
  }

  // Render email with template
  async render(templateName, data) {
    // Load templates
    const baseTemplate = await this.loadBaseTemplate();
    const contentTemplate = await this.loadTemplate(templateName);

    // Add default data
    const defaultData = {
      currentYear: new Date().getFullYear(),
      companyName: process.env.COMPANY_NAME || 'BiWillz Computers',
      companyAddress: process.env.COMPANY_ADDRESS || 'Your Company Address',
      supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      ...data
    };

    // Render content
    const content = contentTemplate(defaultData);

    // Render full template
    const fullMjml = baseTemplate({
      ...defaultData,
      content
    });

    // Convert MJML to HTML
    const { html, errors } = mjml2html(fullMjml, {
      validationLevel: 'soft',
      keepComments: false
    });

    if (errors.length > 0) {
      console.warn('MJML conversion warnings:', errors);
    }

    return html;
  }

  // Generate plain text version
  generatePlainText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = new EmailTemplateEngine();
