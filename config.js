module.exports = function(config) {
	return config.loadConfig('google-docs.json', {
		client_id: {
			doc: 'Your Google OAuth2 client id',
			format: String,
			default: null
		},
		client_secret: {
			doc: 'Your Google OAuth2 client secret',
			format: String,
			default: null
		},
		redirect_uri: {
			doc: 'Your Google OAuth2 redirect uri',
			format: String,
			default: 'urn:ietf:wg:oauth:2.0:oob'
		},
		token: {
			doc: 'Your Google refresh token',
			format: '*',
			default: null
		},
		channel: {
			doc: 'The channel where OAuth2 auth links will be posted',
			format: String,
			default: '#dev'
		},
		folder: {
			doc: 'The ID of the folder in which docs are saved',
			format: String,
			default: null
		}
	});
};
