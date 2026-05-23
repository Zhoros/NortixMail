export function post(path, data, callback) {

		fetch(path, {

			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)

		})
		.then(response => {

			if (!response.ok) {
				throw new Error('Network response != OK: ' + response.statusText);
			}

			return response.text();

		})
		.then(res => {

			try {
				callback(JSON.parse(res));
			} catch (e) {
				callback(res);
			}

		})
		.catch(error => {
			console.error(error);
		});

	}

export function copyToClipboard(text) {
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(text)
	} else {
		// sometimes clipboard api has problems on mobile browsers or won't work unless https connection, fallback
		// into this method instead
		const element = document.createElement('textarea')
		element.value = text
		document.body.appendChild(element)
		element.select()
		document.execCommand('copy')
		document.body.removeChild(element)

	}
}
