# Production Security Checklist

## Pre-Deployment Security Measures

### 1. Remove Development Files
- [ ] Delete `/src/seeders` directory
- [ ] Remove any `.seed.js` or `.seeder.js` files
- [ ] Delete test data scripts
- [ ] Remove development-only dependencies

### 2. Environment Variables
- [ ] All secrets in environment variables (never in code)
- [ ] Strong, unique passwords for all services
- [ ] Database credentials secured
- [ ] JWT secrets are randomly generated and strong
- [ ] API keys are production-specific

### 3. Code Security
- [ ] No hardcoded passwords or secrets
- [ ] No console.log statements with sensitive data
- [ ] Error messages don't expose system details
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using ORM properly)

### 4. Authentication & Authorization
- [ ] Password complexity requirements enforced
- [ ] Rate limiting on login attempts
- [ ] Session timeout configured
- [ ] RBAC properly implemented
- [ ] JWT expiration times appropriate

### 5. Database Security
- [ ] Production database separate from development
- [ ] Database user has minimal required permissions
- [ ] Regular automated backups configured
- [ ] Encryption at rest enabled
- [ ] SSL/TLS for database connections

### 6. Network Security
- [ ] HTTPS enforced (SSL/TLS certificates)
- [ ] CORS properly configured
- [ ] Security headers implemented (Helmet.js)
- [ ] Firewall rules configured
- [ ] Only necessary ports exposed

### 7. Deployment Specific
- [ ] NODE_ENV set to 'production'
- [ ] Debug mode disabled
- [ ] Error logging configured (not exposing sensitive data)
- [ ] Health check endpoints don't expose sensitive info
- [ ] Monitoring and alerting configured

### 8. Initial Setup Commands

```bash
# For production initialization (run once)
npm run init:admin

# Never run these in production:
# npm run seed
# npm run seed:dev
```

### 9. Post-Deployment
- [ ] Delete initialization scripts after first admin created
- [ ] Regular security audits scheduled
- [ ] Dependency vulnerability scanning enabled
- [ ] Backup restoration tested
- [ ] Incident response plan in place

## Security Commands

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## Emergency Contacts
- Security Team: [FILL IN]
- DevOps Lead: [FILL IN]
- Database Admin: [FILL IN]
