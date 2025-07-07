# Angular Version Upgrade Workflow

This document provides a comprehensive guide for upgrading the MSAL Angular SPA from Angular 17.0.9 to Angular 20.0.6 while maintaining MSAL authentication functionality.

## Current State Analysis

### Current Versions (Before Upgrade)
- **Angular Core**: 17.0.9
- **Angular CLI**: Not globally installed (requires installation)
- **MSAL Angular**: 3.0.23
- **MSAL Browser**: 3.21.0
- **TypeScript**: ~5.2.0
- **Bootstrap**: 5.3.1

### Target Versions (After Upgrade)
- **Angular Core**: 20.0.6
- **Angular CLI**: Latest (20.x)
- **MSAL Angular**: 4.0.14
- **MSAL Browser**: 4.14.0
- **TypeScript**: 5.4+ (as required by Angular 20)

### Key Files to Monitor During Upgrade
- `package.json` - Dependency versions
- `src/app/app.module.ts` - MSAL configuration and imports
- `src/app/app.component.ts` - Authentication logic
- `tsconfig.json` - TypeScript compiler options
- `angular.json` - Build configuration

## Prerequisites

### 1. Install Angular CLI Globally
Since the `ng` command is not available globally, install it first:

```bash
npm install -g @angular/cli@latest
```

**Verification:**
```bash
ng version
```

**Alternative (if global installation not preferred):**
```bash
npx @angular/cli@latest version
```

### 2. Verify Current Setup
Check current dependency versions:

```bash
npm list @angular/core @azure/msal-angular @azure/msal-browser typescript
```

### 3. Create Backup Branch
```bash
git checkout -b backup/pre-upgrade-angular-17
git push origin backup/pre-upgrade-angular-17
git checkout devin/1751915158-angular-upgrade-workflow
```

### 4. Test Baseline Functionality
Start the application and verify authentication works:

```bash
npm start
```

Test the following flows:
- Application loads at http://localhost:4200
- Login functionality works
- Logout functionality works
- Protected routes are accessible after login
- Microsoft Graph API calls work (if implemented)

## Incremental Upgrade Process

### Phase 1: Angular 17 → 18

#### Step 1: Update Angular Core and CLI to v18
```bash
ng update @angular/core@18 @angular/cli@18
```

**Expected Actions:**
- Angular will run migration scripts
- Follow any prompts for breaking changes
- Review migration output for manual changes needed

#### Step 2: Verify Build
```bash
ng build
```

**Troubleshooting:**
- If build fails, check for TypeScript errors
- Review migration logs for required manual changes
- Check for deprecated APIs that need updating

#### Step 3: Test Application
```bash
npm start
```

**Verification Checklist:**
- [ ] Application starts without errors
- [ ] No console errors in browser
- [ ] Authentication flows still work
- [ ] MSAL configuration loads correctly

#### Step 4: Commit Changes
```bash
git add package.json package-lock.json angular.json tsconfig.json src/
git commit -m "Upgrade Angular from 17 to 18"
```

### Phase 2: Angular 18 → 19

#### Step 1: Update to Angular 19
```bash
ng update @angular/core@19 @angular/cli@19
```

#### Step 2: Handle Breaking Changes
Review Angular 19 breaking changes:
- Check for deprecated APIs
- Update any changed imports
- Review TypeScript compatibility

#### Step 3: Verify Build and Test
```bash
ng build
npm start
```

**Additional Verification:**
- Test production build: `ng build --configuration production`
- Verify authentication flows work correctly
- Check for any new console warnings

#### Step 4: Commit Changes
```bash
git add package.json package-lock.json angular.json tsconfig.json src/
git commit -m "Upgrade Angular from 18 to 19"
```

### Phase 3: Angular 19 → 20

#### Step 1: Update to Angular 20
```bash
ng update @angular/core@20 @angular/cli@20
```

#### Step 2: Handle Angular 20 Specific Changes
- Review TypeScript version requirements (likely 5.4+)
- Check for any new compilation options needed
- Update target/lib versions in tsconfig.json if required

#### Step 3: Update TypeScript (if needed)
```bash
npm install typescript@latest --save-dev
```

#### Step 4: Verify Build and Test
```bash
ng build --configuration production
npm start
```

#### Step 5: Commit Changes
```bash
git add package.json package-lock.json angular.json tsconfig.json src/
git commit -m "Upgrade Angular from 19 to 20"
```

## MSAL Dependencies Upgrade

### Phase 4: Update MSAL Packages

#### Step 1: Check MSAL v4 Compatibility
```bash
npm view @azure/msal-angular@4 peerDependencies
npm view @azure/msal-browser@4 peerDependencies
```

#### Step 2: Update MSAL Packages
```bash
npm install @azure/msal-angular@latest @azure/msal-browser@latest
```

#### Step 3: Review Configuration Changes
Check `src/app/app.module.ts` for any required changes:

**Key Areas to Review:**
- Import statements for MSAL modules
- MsalModule.forRoot() configuration
- Factory functions for MSAL instances
- Guard and interceptor configurations

**Common MSAL v3 → v4 Changes:**
- Updated import paths (if any)
- Configuration object structure changes
- New authentication flow options
- Updated error handling patterns

#### Step 4: Update Authentication Logic
Review `src/app/app.component.ts` for:
- Login/logout method signatures
- Event handling changes
- Token acquisition patterns
- Error handling updates

#### Step 5: Test MSAL Integration
```bash
npm start
```

**Comprehensive MSAL Testing:**
- [ ] Login flow works correctly
- [ ] Logout flow works correctly
- [ ] Protected routes are accessible after login
- [ ] Token acquisition works
- [ ] Silent token renewal works
- [ ] Error handling works for failed authentication
- [ ] Microsoft Graph API calls work (if implemented)

#### Step 6: Commit MSAL Updates
```bash
git add package.json package-lock.json src/app/
git commit -m "Update MSAL packages to v4.x and verify authentication flows"
```

## Additional Dependencies Update

### Phase 5: Update Other Dependencies

#### Step 1: Update All Dependencies
```bash
ng update
```

#### Step 2: Update Bootstrap (if needed)
```bash
npm install bootstrap@latest
```

#### Step 3: Final Verification
```bash
ng build --configuration production
npm start
```

## Comprehensive Testing Strategy

### Build Testing
```bash
# Development build
ng build

# Production build
ng build --configuration production

# Serve production build locally (optional)
npx http-server dist/angular-spa
```

### Authentication Flow Testing

#### Manual Testing Checklist
- [ ] Application loads without errors
- [ ] Login button is visible when not authenticated
- [ ] Login flow redirects to Microsoft authentication
- [ ] Successful login redirects back to application
- [ ] User information is displayed after login
- [ ] Protected routes are accessible after login
- [ ] Logout button works and clears authentication
- [ ] After logout, protected routes redirect to login
- [ ] Silent token renewal works (test by waiting for token expiry)
- [ ] Error handling works for authentication failures

#### Browser Console Verification
- [ ] No JavaScript errors in console
- [ ] No MSAL-related warnings
- [ ] No TypeScript compilation errors
- [ ] No deprecated API warnings

#### Cross-Browser Testing
Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Edge (latest)

## Troubleshooting Common Issues

### TypeScript Compilation Errors
**Issue:** TypeScript version incompatibility
**Solution:** Update TypeScript to version compatible with Angular 20
```bash
npm install typescript@~5.4.0 --save-dev
```

### MSAL Configuration Errors
**Issue:** MSAL v4 configuration changes
**Solutions:**
- Review MSAL v4 migration guide
- Check import statements in app.module.ts
- Verify configuration object structure
- Update factory functions if needed

### Build Errors
**Issue:** Angular build fails after upgrade
**Solutions:**
- Check for deprecated APIs and update
- Review angular.json for deprecated build options
- Update polyfills if needed
- Check for TypeScript strict mode issues

### Authentication Flow Issues
**Issue:** Login/logout not working after MSAL upgrade
**Solutions:**
- Verify MSAL configuration in app.module.ts
- Check authentication logic in app.component.ts
- Review route guard configurations
- Test with browser developer tools network tab

## Rollback Procedures

### If Upgrade Fails
1. **Reset to previous state:**
   ```bash
   git reset --hard HEAD~1  # Reset last commit
   npm install  # Reinstall previous dependencies
   ```

2. **Use backup branch:**
   ```bash
   git checkout backup/pre-upgrade-angular-17
   npm install
   ```

3. **Selective rollback:**
   ```bash
   git checkout HEAD~1 -- package.json package-lock.json
   npm install
   ```

## Version Verification Commands

### After Complete Upgrade
```bash
# Verify Angular versions
ng version

# Verify all package versions
npm list

# Verify specific packages
npm list @angular/core @azure/msal-angular @azure/msal-browser typescript

# Check for outdated packages
npm outdated
```

## Performance Considerations

### Bundle Size Analysis
```bash
# Analyze bundle size
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/angular-spa/stats.json
```

### Runtime Performance
- Monitor application startup time
- Check for any performance regressions
- Verify lazy loading still works correctly
- Test on slower devices/networks

## Documentation Updates

### Update README.md
Update project README with:
- New Angular version requirements
- Updated development setup instructions
- Any new dependencies or tools required

### Update Package.json Scripts
Verify all npm scripts still work:
```bash
npm run build
npm run test
npm run lint
npm start
```

## Final Verification Checklist

### Pre-Deployment Checklist
- [ ] All builds pass (development and production)
- [ ] All authentication flows tested and working
- [ ] No console errors or warnings
- [ ] Cross-browser compatibility verified
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Git commits are clean and descriptive
- [ ] Backup branch created and pushed

### Success Criteria
✅ **Angular successfully upgraded from 17.0.9 to 20.0.6**
✅ **MSAL packages updated from 3.x to 4.x**
✅ **All authentication flows work correctly**
✅ **Production build works without errors**
✅ **No breaking changes in authentication functionality**
✅ **Application performance maintained or improved**

## Command Reference

### Complete Upgrade Command Sequence
```bash
# Prerequisites
npm install -g @angular/cli@latest
git checkout -b backup/pre-upgrade-angular-17
git push origin backup/pre-upgrade-angular-17
git checkout devin/1751915158-angular-upgrade-workflow

# Phase 1: Angular 17 → 18
ng update @angular/core@18 @angular/cli@18
ng build
npm start  # Test
git add . && git commit -m "Upgrade Angular 17 to 18"

# Phase 2: Angular 18 → 19
ng update @angular/core@19 @angular/cli@19
ng build
npm start  # Test
git add . && git commit -m "Upgrade Angular 18 to 19"

# Phase 3: Angular 19 → 20
ng update @angular/core@20 @angular/cli@20
ng build --configuration production
npm start  # Test
git add . && git commit -m "Upgrade Angular 19 to 20"

# Phase 4: MSAL Update
npm install @azure/msal-angular@latest @azure/msal-browser@latest
ng build
npm start  # Test authentication flows thoroughly
git add . && git commit -m "Update MSAL packages to v4.x"

# Phase 5: Final Updates
ng update
ng build --configuration production
npm start  # Final verification
git add . && git commit -m "Update remaining dependencies and final verification"
```

### Quick Verification Commands
```bash
# Version check
ng version && npm list @angular/core @azure/msal-angular @azure/msal-browser

# Build verification
ng build && ng build --configuration production

# Start application
npm start
```

---

**Note:** This workflow document should be updated based on actual upgrade experience and any specific issues encountered during the process. Always test thoroughly in a development environment before applying to production.
