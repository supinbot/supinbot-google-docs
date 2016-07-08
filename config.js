module.exports = function(config) {
	return config.loadConfig({
		client_id: {
			doc: 'Your Google OAuth2 client id',
			format: String,
			default: null,
			env: 'SUPINBOT_GOOGLE_OAUTH_ID'
		},
		client_secret: {
			doc: 'Your Google OAuth2 client secret',
			format: String,
			default: null,
			env: 'SUPINBOT_GOOGLE_OAUTH_SECRET'
		},
		redirect_uri: {
			doc: 'Your Google OAuth2 redirect uri',
			format: String,
			default: 'urn:ietf:wg:oauth:2.0:oob',
			env: 'SUPINBOT_GOOGLE_OAUTH_REDIRECT'
		},
		token: {
			doc: 'Your Google refresh token',
			format: '*',
			default: null,
			env: 'SUPINBOT_GOOGLE_REFRESH_TOKEN'
		},
		channel: {
			doc: 'The channel where OAuth2 auth links will be posted',
			format: String,
			default: '#dev',
			env: 'SUPINBOT_GOOGLE_OAUTH_CHANNEL'
		},
		folder: {
			doc: 'The ID of the folder in which docs are saved',
			format: String,
			default: null,
			env: 'SUPINBOT_GOOGLE_DOC_FOLDER'
		}
	});
};
