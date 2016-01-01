var google = require('googleapis');
var path = require('path');
var fs = require('fs');

var SCOPES = ['https://www.googleapis.com/auth/drive.file'];
var OAUTH;

var OAuth2 = google.auth.OAuth2;


module.exports = function(SupinBot) {
	var config = require('./config.js')(SupinBot.config);

	function getToken() {
		var url = OAUTH.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES
		});

		SupinBot.postMessage(config.get('channel'), 'New token requested, enter the OAuth2 code with the !redeemdocscode <OAuth2 Code> command.\n' + url);
	}

	function saveToken(token) {
		config.set('token', token.refresh_token);
		getOAuth();

		var configDir = path.dirname(path.resolve(process.cwd(), SupinBot.config.get('config_file')));
		fs.writeFile(path.resolve(configDir, 'google-docs.json'), JSON.stringify(config.getProperties(), null, '\t'), function(err) {
			if (err) {
				SupinBot.log.error('[google-docs] Failed to save the refresh token.', err);
				return;
			}

			SupinBot.log.info('[google-docs] Refresh token saved.');
		});
	}

	function getOAuth() {
		OAUTH = new OAuth2(config.get('client_id'), config.get('client_secret'), config.get('redirect_uri'));

		if (config.get('token')) {
			OAUTH.setCredentials({refresh_token: config.get('token')});
		} else {
			getToken();
		}
	}

	getOAuth();


	SupinBot.CommandManager.addCommand('redeemdocscode', function(user, channel, args, argsStr) {
		OAUTH.getToken(args[0], function(err, token) {
			if (err) {
				SupinBot.log.error('Google Drive API error: ' + err);
				SupinBot.postMessage(config.get('channel'), 'An error occured while redeeming the OAuth2 code.\n' + err);
				return;
			}

			saveToken(token);
			SupinBot.postMessage(config.get('channel'), 'Token successfully redeemed.');
		});
	})
	.setDescription('Uses the given code to get a Google Drive access token.')
	.addArgument('OAuth2 Code', 'string')
	.channelRestriction(['dev'])
	.ownerOnly();


	SupinBot.CommandManager.addCommand('shownotes', function(user, channel, args, argsStr) {
		google.drive('v3').files.list({
			auth: OAUTH,
			q: '\'' + config.get('folder') + '\' in parents',
			fields: 'files(name,webViewLink)'
		}, function(err, res) {
			if (err) {
				SupinBot.log.error('Google Drive API: ' + err);
				SupinBot.postMessage(channel.id, 'Google Drive API: ' + err);
				return;
			}

			if (res.files.length === 0) {
				SupinBot.postMessage(channel.id, null, {
					attachments: [
						{
							title: 'No notes found.',
							color: '#EA4335'
						}
					]
				});
			} else {
				var message = '';

				res.files.forEach(function(file) {
					message = message + '\n<' + file.webViewLink + '|' + file.name + '>';
				});

				SupinBot.postMessage(channel.id, null, {
					attachments: [
						{
							title: 'Google Drive Notes',
							title_link: 'https://drive.google.com/open?id=' + config.get('folder'),
							text: message,
							color: '#4688F4'
						}
					]
				});
			}
		});
	})
	.setDescription('Shows all created notes.');


	SupinBot.CommandManager.addCommand('createnote', function(user, channel, args, argsStr) {
		google.drive('v3').files.create({
			auth: OAUTH,
			resource: {
				name: args[0],
				parents: [config.get('folder')],
				mimeType: 'application/vnd.google-apps.document'
			},
			fields: 'id,webViewLink'
		}, function(err, file) {
			if (err) {
				SupinBot.log.error('Google Drive API: ' + err);
				SupinBot.postMessage(channel.id, 'Google Drive API: ' + err);
				return;
			}

			google.drive('v3').permissions.create({
				auth: OAUTH,
				fileId: file.id,
				resource: {
					role: 'writer',
					type: 'anyone',
					allowFileDiscovery: false
				}
			}, function(err, permission) {
				if (err) {
					SupinBot.log.error('Google Drive API: ' + err);
					SupinBot.postMessage(channel.id, 'Google Drive API: ' + err);
					return;
				}

				SupinBot.log.info(args[0] + ' Created with ID: ' + file.id);
				SupinBot.postMessage(channel.id, null, {
					attachments: [
						{
							title: args[0] + ' Created',
							text: '<' + file.webViewLink + '|Click here to view it>.',
							color: '#34A853'
						}
					]
				});
			});
		});
	})
	.setDescription('Creates a new note.')
	.addArgument('Note Name', 'string')
	.adminOnly();
};
