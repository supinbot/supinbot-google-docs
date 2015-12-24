var google = require('googleapis');
var path = require('path');
var fs = require('fs');

var CONFIG_PATH = path.resolve(__dirname, 'config.json');
var CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH));
var SCOPES = ['https://www.googleapis.com/auth/drive.file'];
var OAUTH;

var OAuth2 = google.auth.OAuth2;


module.exports = function(SupinBot) {
	function getToken() {
		var url = OAUTH.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES
		});

		SupinBot.postMessage(CONFIG.CHANNEL, 'New token requested, enter the OAuth2 code with the !redeemdocscode <OAuth2 Code> command.\n' + url);
	}

	function saveToken(token) {
		CONFIG.TOKEN = token.refresh_token;
		getOAuth();

		fs.writeFile(CONFIG_PATH, JSON.stringify(CONFIG, null, '\t'), function(err) {
			if (err) {
				SupinBot.log.error('Failed to save the token.', err);
				return;
			}

			SupinBot.log.info('Token saved.');
		});
	}

	function getOAuth() {
		OAUTH = new OAuth2(CONFIG.CLIENT_ID, CONFIG.CLIENT_SECRET, CONFIG.REDIRECT_URI);

		if (CONFIG.TOKEN) {
			OAUTH.setCredentials({refresh_token: CONFIG.TOKEN});
		} else {
			getToken();
		}
	}

	getOAuth();


	SupinBot.CommandManager.addCommand('redeemdocscode', function(user, channel, args, argsStr) {
		OAUTH.getToken(args[0], function(err, token) {
			if (err) {
				SupinBot.log.error('Google Drive API error: ' + err);
				SupinBot.postMessage(CONFIG.CHANNEL, 'An error occured while redeeming the OAuth2 code.\n' + err);
				return;
			}

			saveToken(token);
			SupinBot.postMessage(CONFIG.CHANNEL, 'Token successfully redeemed.');
		});
	})
	.setDescription('Uses the given code to get a Google Drive access token.')
	.addArgument('OAuth2 Code', 'string')
	.channelRestriction(['dev'])
	.ownerOnly();


	SupinBot.CommandManager.addCommand('shownotes', function(user, channel, args, argsStr) {
		google.drive('v3').files.list({
			auth: OAUTH,
			q: '\'' + CONFIG.FOLDER + '\' in parents',
			fields: 'files(name,webViewLink)'
		}, function(err, res) {
			if (err) {
				SupinBot.log.error('Google Drive API: ' + err);
				SupinBot.postMessage(channel.id, 'Google Drive API: ' + err);
				return;
			}

			if (res.files.length === 0) {
				SupinBot.postMessage(channel.id, 'No notes found.');
			} else {
				var message = 'Google Drive Notes:';

				res.files.forEach(function(file) {
					message = message + '\n*' + file.name + '* - ' + file.webViewLink;
				});

				SupinBot.postMessage(channel.id, message);
			}
		});
	})
	.setDescription('Shows all created notes.');


	SupinBot.CommandManager.addCommand('createnote', function(user, channel, args, argsStr) {
		google.drive('v3').files.create({
			auth: OAUTH,
			resource: {
				name: args[0],
				parents: [CONFIG.FOLDER],
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
				SupinBot.postMessage(channel.id, '*' + args[0] + '* Created!\n' + file.webViewLink);
			});
		});
	})
	.setDescription('Creates a new note.')
	.addArgument('Note Name', 'string')
	.adminOnly();
};
