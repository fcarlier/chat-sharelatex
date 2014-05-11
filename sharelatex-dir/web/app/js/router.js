(function() {
  var AdminController, AuthenticationController, AuthorizationManager, CollaboratorsController, CompileController, CompileManager, DocumentController, DropboxUserController, EditorController, EditorUpdatesController, FileStoreController, HealthCheckController, HomeController, InfoController, ProjectApiController, ProjectController, ProjectDownloadsController, ReferalController, ReferalMiddleware, RestoreController, Router, SecurityManager, Settings, SpellingController, SubscriptionRouter, TagsController, TemplatesController, TemplatesMiddlewear, TpdsController, TrackChangesController, UploadsRouter, UserController, ChatController, UserInfoController, UserPagesController, dropboxHandler, httpAuth, logger, metrics, versioningController, _,
    __slice = [].slice;

  AdminController = require('./Features/ServerAdmin/AdminController');

  HomeController = require('./Features/StaticPages/HomeController');

  ProjectController = require("./Features/Project/ProjectController");

  ProjectApiController = require("./Features/Project/ProjectApiController");

  InfoController = require('./Features/StaticPages/InfoController');

  SpellingController = require('./Features/Spelling/SpellingController');

  SecurityManager = require('./managers/SecurityManager');

  AuthorizationManager = require('./Features/Security/AuthorizationManager');

  versioningController = require("./Features/Versioning/VersioningApiController");

  EditorController = require("./Features/Editor/EditorController");

  EditorUpdatesController = require("./Features/Editor/EditorUpdatesController");

  Settings = require('settings-sharelatex');

  TpdsController = require('./Features/ThirdPartyDataStore/TpdsController');

  dropboxHandler = require('./Features/Dropbox/DropboxHandler');

  SubscriptionRouter = require('./Features/Subscription/SubscriptionRouter');

  UploadsRouter = require('./Features/Uploads/UploadsRouter');

  metrics = require('./infrastructure/Metrics');

  ReferalController = require('./Features/Referal/ReferalController');

  ReferalMiddleware = require('./Features/Referal/ReferalMiddleware');

  TemplatesController = require('./Features/Templates/TemplatesController');

  TemplatesMiddlewear = require('./Features/Templates/TemplatesMiddlewear');

  AuthenticationController = require('./Features/Authentication/AuthenticationController');

  TagsController = require("./Features/Tags/TagsController");

  CollaboratorsController = require('./Features/Collaborators/CollaboratorsController');

  UserInfoController = require('./Features/User/UserInfoController');

  UserController = require("./Features/User/UserController");
  
  ChatController = require("./Features/Chat/ChatController");

  UserPagesController = require('./Features/User/UserPagesController');

  DocumentController = require('./Features/Documents/DocumentController');

  CompileManager = require("./Features/Compile/CompileManager");

  CompileController = require("./Features/Compile/CompileController");

  HealthCheckController = require("./Features/HealthCheck/HealthCheckController");

  ProjectDownloadsController = require("./Features/Downloads/ProjectDownloadsController");

  FileStoreController = require("./Features/FileStore/FileStoreController");

  TrackChangesController = require("./Features/TrackChanges/TrackChangesController");

  DropboxUserController = require("./Features/Dropbox/DropboxUserController");

  RestoreController = require("./Features/Restore/RestoreController");

  logger = require("logger-sharelatex");

  _ = require("underscore");

  httpAuth = require('express').basicAuth(function(user, pass) {
    var isValid;
    isValid = Settings.httpAuthUsers[user] === pass;
    if (!isValid) {
      logger.err({
        user: user,
        pass: pass
      }, "invalid login details");
    }
    return isValid;
  });

  module.exports = Router = (function() {
    function Router(app, io, socketSessions) {
      app.use(app.router);
      app.get('/', HomeController.index);
      app.get('/login', UserPagesController.loginPage);
      app.post('/login', AuthenticationController.login);
      app.get('/logout', UserController.logout);
      app.get('/restricted', SecurityManager.restricted);
      app.get('/resources', HomeController.externalPage("resources", "LaTeX Resources"));
      app.get('/tos', HomeController.externalPage("tos", "Terms of Service"));
      app.get('/about', HomeController.externalPage("about", "About Us"));
      app.get('/attribution', HomeController.externalPage("attribution", "Attribution"));
      app.get('/security', HomeController.externalPage("security", "Security"));
      app.get('/privacy_policy', HomeController.externalPage("privacy", "Privacy Policy"));
      app.get('/planned_maintenance', HomeController.externalPage("planned_mainteance", "Planned Maintenance"));
      app.get('/themes', InfoController.themes);
      app.get('/advisor', InfoController.advisor);
      app.get('/dropbox', InfoController.dropbox);
      app.get('/register', UserPagesController.registerPage);
      app.post('/register', UserController.register);
      app.get('/chat/login', AuthenticationController.requireLogin(), ChatController.proxyRequestToChatApi);
      SubscriptionRouter.apply(app);
      UploadsRouter.apply(app);
      if (Settings.enableSubscriptions) {
        app.get('/user/bonus', AuthenticationController.requireLogin(), ReferalMiddleware.getUserReferalId, ReferalController.bonus);
      }
      app.get('/user/settings', AuthenticationController.requireLogin(), UserPagesController.settingsPage);
      app.post('/user/settings', AuthenticationController.requireLogin(), UserController.updateUserSettings);
      app.post('/user/password/update', AuthenticationController.requireLogin(), UserController.changePassword);
      app.get('/user/passwordreset', UserPagesController.passwordResetPage);
      app.post('/user/passwordReset', UserController.doRequestPasswordReset);
      app.del('/user/newsletter/unsubscribe', AuthenticationController.requireLogin(), UserController.unsubscribe);
      app.del('/user', AuthenticationController.requireLogin(), UserController.deleteUser);
      app.get("/restore", AuthenticationController.requireLogin(), RestoreController.restore);
      app.get("/project/:Project_id/zip", SecurityManager.requestCanAccessProject, RestoreController.getZip);
      app.get('/dropbox/beginAuth', DropboxUserController.redirectUserToDropboxAuth);
      app.get('/dropbox/completeRegistration', DropboxUserController.completeDropboxRegistration);
      app.get('/dropbox/unlink', DropboxUserController.unlinkDropbox);
      app.get('/user/auth_token', AuthenticationController.requireLogin(), AuthenticationController.getAuthToken);
      app.get('/user/personal_info', AuthenticationController.requireLogin({
        allow_auth_token: true
      }), UserInfoController.getLoggedInUsersPersonalInfo);
      app.get('/user/:user_id/personal_info', httpAuth, UserInfoController.getPersonalInfo);
      app.get('/project', AuthenticationController.requireLogin(), ProjectController.projectListPage);
      app.post('/project/new', AuthenticationController.requireLogin(), ProjectController.newProject);
      app.get('/project/new/template', TemplatesMiddlewear.saveTemplateDataInSession, AuthenticationController.requireLogin(), TemplatesController.createProjectFromZipTemplate);
      app.get('/Project/:Project_id', SecurityManager.requestCanAccessProject, ProjectController.loadEditor);
      app.get('/Project/:Project_id/file/:File_id', SecurityManager.requestCanAccessProject, FileStoreController.getFile);
      app.get('/Project/:Project_id/output/output.pdf', SecurityManager.requestCanAccessProject, CompileController.downloadPdf);
      app.get(/^\/project\/([^\/]*)\/output\/(.*)$/, (function(req, res, next) {
        var params;
        params = {
          "Project_id": req.params[0],
          "file": req.params[1]
        };
        req.params = params;
        return next();
      }), SecurityManager.requestCanAccessProject, CompileController.getFileFromClsi);
      app.del("/project/:Project_id/output", SecurityManager.requestCanAccessProject, CompileController.deleteAuxFiles);
      app.get("/project/:Project_id/sync/code", SecurityManager.requestCanAccessProject, CompileController.proxySync);
      app.get("/project/:Project_id/sync/pdf", SecurityManager.requestCanAccessProject, CompileController.proxySync);
      app.del('/Project/:Project_id', SecurityManager.requestIsOwner, ProjectController.deleteProject);
      app.post('/Project/:Project_id/clone', SecurityManager.requestCanAccessProject, ProjectController.cloneProject);
      app.post('/Project/:Project_id/snapshot', SecurityManager.requestCanModifyProject, versioningController.takeSnapshot);
      app.get('/Project/:Project_id/version', SecurityManager.requestCanAccessProject, versioningController.listVersions);
      app.get('/Project/:Project_id/version/:Version_id', SecurityManager.requestCanAccessProject, versioningController.getVersion);
      app.get('/Project/:Project_id/version', SecurityManager.requestCanAccessProject, versioningController.listVersions);
      app.get('/Project/:Project_id/version/:Version_id', SecurityManager.requestCanAccessProject, versioningController.getVersion);
      app.get("/project/:Project_id/updates", SecurityManager.requestCanAccessProject, TrackChangesController.proxyToTrackChangesApi);
      app.get("/project/:Project_id/doc/:doc_id/diff", SecurityManager.requestCanAccessProject, TrackChangesController.proxyToTrackChangesApi);
      app.post("/project/:Project_id/doc/:doc_id/version/:version_id/restore", SecurityManager.requestCanAccessProject, TrackChangesController.proxyToTrackChangesApi);
      app.post('/project/:project_id/leave', AuthenticationController.requireLogin(), CollaboratorsController.removeSelfFromProject);
      app.get('/project/:Project_id/collaborators', SecurityManager.requestCanAccessProject({
        allow_auth_token: true
      }), CollaboratorsController.getCollaborators);
      app.get('/Project/:Project_id/download/zip', SecurityManager.requestCanAccessProject, ProjectDownloadsController.downloadProject);
      app.get('/tag', AuthenticationController.requireLogin(), TagsController.getAllTags);
      app.post('/project/:project_id/tag', AuthenticationController.requireLogin(), TagsController.processTagsUpdate);
      app.get('/project/:project_id/details', httpAuth, ProjectApiController.getProjectDetails);
      app.get('/internal/project/:Project_id/zip', httpAuth, ProjectDownloadsController.downloadProject);
      app.get('/internal/project/:project_id/compile/pdf', httpAuth, CompileController.compileAndDownloadPdf);
      app.get('/project/:Project_id/doc/:doc_id', httpAuth, DocumentController.getDocument);
      app.post('/project/:Project_id/doc/:doc_id', httpAuth, DocumentController.setDocument);
      app.ignoreCsrf('post', '/project/:Project_id/doc/:doc_id');
      app.post('/user/:user_id/update/*', httpAuth, TpdsController.mergeUpdate);
      app.del('/user/:user_id/update/*', httpAuth, TpdsController.deleteUpdate);
      app.ignoreCsrf('post', '/user/:user_id/update/*');
      app.ignoreCsrf('delete', '/user/:user_id/update/*');
      app.get('/enableversioning/:Project_id', function(req, res) {
        return versioningController.enableVersioning(req.params.Project_id, function() {
          return res.send();
        });
      });
      app.get(/^\/project\/([^\/]*)\/version\/([^\/]*)\/file\/(.*)$/, (function(req, res, next) {
        var params;
        params = {
          "Project_id": req.params[0],
          "Version_id": req.params[1],
          "File_id": req.params[2]
        };
        req.params = params;
        return next();
      }), SecurityManager.requestCanAccessProject, versioningController.getVersionFile);
      app.post("/spelling/check", AuthenticationController.requireLogin(), SpellingController.proxyRequestToSpellingApi);
      app.post("/spelling/learn", AuthenticationController.requireLogin(), SpellingController.proxyRequestToSpellingApi);
      app.get('/admin', SecurityManager.requestIsAdmin, AdminController.index);
      app.post('/admin/closeEditor', SecurityManager.requestIsAdmin, AdminController.closeEditor);
      app.post('/admin/dissconectAllUsers', SecurityManager.requestIsAdmin, AdminController.dissconectAllUsers);
      app.post('/admin/writeAllDocsToMongo', SecurityManager.requestIsAdmin, AdminController.writeAllToMongo);
      app.post('/admin/addquote', SecurityManager.requestIsAdmin, AdminController.addQuote);
      app.post('/admin/syncUserToSubscription', SecurityManager.requestIsAdmin, AdminController.syncUserToSubscription);
      app.post('/admin/flushProjectToTpds', SecurityManager.requestIsAdmin, AdminController.flushProjectToTpds);
      app.post('/admin/pollUsersWithDropbox', SecurityManager.requestIsAdmin, AdminController.pollUsersWithDropbox);
      app.post('/admin/updateProjectCompiler', SecurityManager.requestIsAdmin, AdminController.updateProjectCompiler);
      app.get('/perfTest', function(req, res) {
        res.send("hello");
        return req.session.destroy();
      });
      app.get('/status', function(req, res) {
        res.send("websharelatex is up");
        return req.session.destroy();
      });
      app.get('/health_check', HealthCheckController.check);
      app.get("/status/compiler/:Project_id", SecurityManager.requestCanAccessProject, function(req, res) {
        var sendRes;
        sendRes = _.once(function(statusCode, message) {
          res.writeHead(statusCode);
          return res.end(message);
        });
        CompileManager.compile(req.params.Project_id, "test-compile", {}, function() {
          return sendRes(200, "Compiler returned in less than 10 seconds");
        });
        setTimeout((function() {
          return sendRes(500, "Compiler timed out");
        }), 10000);
        return req.session.destroy();
      });
      app.get('/test', function(req, res) {
        return res.render("tests", {
          privilegeLevel: "owner",
          project: {
            name: "test"
          },
          date: Date.now(),
          layout: false,
          userCanSeeDropbox: true,
          languages: []
        });
      });
      app.get('/oops-express', function(req, res, next) {
        return next(new Error("Test error"));
      });
      app.get('/oops-internal', function(req, res, next) {
        throw new Error("Test error");
      });
      app.get('/oops-mongo', function(req, res, next) {
        return require("./models/Project").Project.findOne({}, function() {
          throw new Error("Test error");
        });
      });
      app.post('/error/client', function(req, res, next) {
        logger.error({
          err: req.body.error,
          meta: req.body.meta
        }, "client side error");
        return res.send(204);
      });
      app.get('*', HomeController.notFound);
      socketSessions.on('connection', function(err, client, session) {
        var user;
        metrics.inc('socket-io.connection');
        if (!session || (session.user == null)) {
          user = {
            _id: "anonymous-user"
          };
        } else {
          user = session.user;
        }
        client.on('joinProject', function(data, callback) {
          return EditorController.joinProject(client, user, data.project_id, callback);
        });
        client.on('disconnect', function() {
          metrics.inc('socket-io.disconnect');
          return EditorController.leaveProject(client, user);
        });
        client.on('reportError', function(error, callback) {
          return EditorController.reportError(client, error, callback);
        });
        client.on('sendUpdate', function(doc_id, windowName, change) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorUpdatesController.applyAceUpdate(client, project_id, doc_id, windowName, change);
            };
          })(this));
        });
        client.on('applyOtUpdate', function(doc_id, update) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorUpdatesController.applyOtUpdate(client, project_id, doc_id, update);
            };
          })(this));
        });
        client.on('clientTracking.updatePosition', function(cursorData) {
          return AuthorizationManager.ensureClientCanViewProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.updateClientPosition(client, cursorData);
            };
          })(this));
        });
        client.on('addUserToProject', function(email, newPrivalageLevel, callback) {
          return AuthorizationManager.ensureClientCanAdminProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.addUserToProject(project_id, email, newPrivalageLevel, callback);
            };
          })(this));
        });
        client.on('removeUserFromProject', function(user_id, callback) {
          return AuthorizationManager.ensureClientCanAdminProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.removeUserFromProject(project_id, user_id, callback);
            };
          })(this));
        });
        client.on('setSpellCheckLanguage', function(compiler, callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.setSpellCheckLanguage(project_id, compiler, callback);
            };
          })(this));
        });
        client.on('setCompiler', function(compiler, callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.setCompiler(project_id, compiler, callback);
            };
          })(this));
        });
        client.on('leaveDoc', function(doc_id, callback) {
          return AuthorizationManager.ensureClientCanViewProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.leaveDoc(client, project_id, doc_id, callback);
            };
          })(this));
        });
        client.on('joinDoc', function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return AuthorizationManager.ensureClientCanViewProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.joinDoc.apply(EditorController, [client, project_id].concat(__slice.call(args)));
            };
          })(this));
        });
        client.on('addDoc', function(folder_id, docName, callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.addDoc(project_id, folder_id, docName, [""], callback);
            };
          })(this));
        });
        client.on('addFolder', function(folder_id, folderName, callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.addFolder(project_id, folder_id, folderName, callback);
            };
          })(this));
        });
        client.on('deleteEntity', function(entity_id, entityType, callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.deleteEntity(project_id, entity_id, entityType, callback);
            };
          })(this));
        });
        client.on('renameEntity', function(entity_id, entityType, newName, callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.renameEntity(project_id, entity_id, entityType, newName, callback);
            };
          })(this));
        });
        client.on('moveEntity', function(entity_id, folder_id, entityType, callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.moveEntity(project_id, entity_id, folder_id, entityType, callback);
            };
          })(this));
        });
        client.on('setProjectName', function(newName, callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.renameProject(project_id, newName, callback);
            };
          })(this));
        });
        client.on('setRootDoc', function(newRootDocID, callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.setRootDoc(project_id, newRootDocID, callback);
            };
          })(this));
        });
        client.on('deleteProject', function(callback) {
          return AuthorizationManager.ensureClientCanAdminProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.deleteProject(project_id, callback);
            };
          })(this));
        });
        client.on('setPublicAccessLevel', function(newAccessLevel, callback) {
          return AuthorizationManager.ensureClientCanAdminProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.setPublicAccessLevel(project_id, newAccessLevel, callback);
            };
          })(this));
        });
        client.on('pdfProject', function(opts, callback) {
          return AuthorizationManager.ensureClientCanViewProject(client, (function(_this) {
            return function(error, project_id) {
              return CompileManager.compile(project_id, user._id, opts, callback);
            };
          })(this));
        });
        client.on('enableversioningController', function(callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return versioningController.enableVersioning(project_id, callback);
            };
          })(this));
        });
        client.on('getRootDocumentsList', function(callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.getListOfDocPaths(project_id, callback);
            };
          })(this));
        });
        client.on('forceResyncOfDropbox', function(callback) {
          return AuthorizationManager.ensureClientCanAdminProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.forceResyncOfDropbox(project_id, callback);
            };
          })(this));
        });
        client.on('getUserDropboxLinkStatus', function(owner_id, callback) {
          return AuthorizationManager.ensureClientCanAdminProject(client, (function(_this) {
            return function(error, project_id) {
              return dropboxHandler.getUserRegistrationStatus(owner_id, callback);
            };
          })(this));
        });
        client.on('publishProjectAsTemplate', function(user_id, callback) {
          return AuthorizationManager.ensureClientCanAdminProject(client, (function(_this) {
            return function(error, project_id) {
              return TemplatesController.publishProject(user_id, project_id, callback);
            };
          })(this));
        });
        client.on('unPublishProjectAsTemplate', function(user_id, callback) {
          return AuthorizationManager.ensureClientCanAdminProject(client, (function(_this) {
            return function(error, project_id) {
              return TemplatesController.unPublishProject(user_id, project_id, callback);
            };
          })(this));
        });
        client.on('updateProjectDescription', function(description, callback) {
          return AuthorizationManager.ensureClientCanEditProject(client, (function(_this) {
            return function(error, project_id) {
              return EditorController.updateProjectDescription(project_id, description, callback);
            };
          })(this));
        });
        client.on("getLastTimePollHappned", function(callback) {
          return EditorController.getLastTimePollHappned(callback);
        });
        return client.on("getPublishedDetails", function(user_id, callback) {
          return AuthorizationManager.ensureClientCanViewProject(client, (function(_this) {
            return function(error, project_id) {
              return TemplatesController.getTemplateDetails(user_id, project_id, callback);
            };
          })(this));
        });
      });
    }

    return Router;

  })();

}).call(this);
