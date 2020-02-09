//Requires
const modulename = 'WebServer:Router';
const Router = require('@koa/router');
const KoaRateLimit = require('koa-ratelimit');

const { dir, log, logOk, logWarn, logError} = require('../../extras/console')(modulename);
const webRoutes = require('../../webroutes');
const {requestAuth} = require('./requestAuthenticator');


/**
 * Router factory
 * @param {object} config
 */
module.exports = router = (config) =>{
    const router = new Router();
    authLimiter = KoaRateLimit({
        driver: 'memory',
        db: new Map(),
        duration: config.limiterMinutes * 60 * 1000, // 15 minutes
        errorMessage: `Too many attempts, enjoy your ${config.limiterMinutes} minutes of cooldown.`,
        max: config.limiterAttempts,
        disableHeader: true,
    });

    //FIXME: test only
    // router.post('/', async (ctx) => {
    //     // throw new Error('sdfsdf')
    //     // ctx.attachment('hello.txt')
    //     // dir(ctx._matchedRoute)
    //     dir(ctx.params.xxx) // for route parameters
    //     dir(ctx.query.xxx) // for query parameters
    //     dir(ctx.request.body) // for body data (x-www-form-urlencoded / json)
    //     ctx.body = {sdfsdf:'gggggggggggggg'};
    //     return;
    //     return ctx.utils.error(400, "Invalid Request");
    //     return ctx.send({aaa:false})
    //     return ctx.utils.render('login', {message: 'sdfsdfdfs'})
    // });

    //Authentication
    router.get('/auth', webRoutes.auth.get);
    router.all('/auth/addMaster/:action', authLimiter, webRoutes.auth.addMaster);
    router.get('/auth/:provider/redirect', authLimiter, webRoutes.auth.providerRedirect);
    router.get('/auth/:provider/callback', authLimiter, webRoutes.auth.providerCallback);
    router.post('/auth/password', authLimiter, webRoutes.auth.verifyPassword);
    router.post('/changePassword', requestAuth('web'), webRoutes.auth.changePassword);

    //Admin Manager
    router.get('/adminManager', requestAuth('web'), webRoutes.adminManager.get);
    router.post('/adminManager/:action', requestAuth('web'), webRoutes.adminManager.actions);

    //Settings
    router.get('/settings', requestAuth('web'), webRoutes.settings.get);
    router.post('/settings/save/:scope', requestAuth('web'), webRoutes.settings.save); //FIXME: não tinha que ser do tipo API?

    //FXServer
    router.get('/fxserver/controls/:action', requestAuth('api'), webRoutes.fxserver.controls);
    router.post('/fxserver/commands', requestAuth('web'), webRoutes.fxserver.commands); //FIXME: não tinha que ser do tipo API?

    //CFG Editor
    router.get('/cfgEditor', requestAuth('web'), webRoutes.cfgEditor.get);
    router.post('/cfgEditor/save', requestAuth('api'), webRoutes.cfgEditor.save);

    //Experiments
    router.get('/experiments/bans', requestAuth('web'), webRoutes.experiments.bans.get);
    router.all('/experiments/bans/actions/:action', requestAuth('web'), webRoutes.experiments.bans.actions);

    //Control routes
    router.get('/console', requestAuth('web'), webRoutes.liveConsole);
    router.post('intercom', requestAuth('intercom'), webRoutes.intercom);

    //Diagnostic routes
    router.get('/diagnostics', requestAuth('web'), webRoutes.diagnostics.get);
    router.get('/diagnostics/log', requestAuth('web'), webRoutes.diagnostics.getLog);

    //Data routes
    router.get('/actionLog', requestAuth('web'), webRoutes.actionLog);
    router.get('/serverLog', requestAuth('web'), webRoutes.serverLog);
    router.get('/status', requestAuth('api'), webRoutes.status);
    router.get('/getPlayerData/:id', requestAuth('api'), webRoutes.getPlayerData);
    router.get('/downFXServerLog', requestAuth('web'), webRoutes.downFXServerLog);

    //Index & generic
    router.get('/resources', requestAuth('web'), webRoutes.resources);
    router.get('/addExtension', requestAuth('web'), webRoutes.addExtension);
    router.get('/', requestAuth('web'), webRoutes.dashboard);

    //Return router
    return router;
};
