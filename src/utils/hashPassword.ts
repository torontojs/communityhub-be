export async function hashPasswordPBKDF2(password: string, salt: Uint8Array): Promise<string> {
	const encoder = new TextEncoder();
	const passwordBuffer = encoder.encode(password);

	// Import password as key material
	const key = await crypto.subtle.importKey(
		'raw',
		passwordBuffer,
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	// Derive key using PBKDF2-HMAC-SHA256
	const derivedKey = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt,
			iterations: 600000,
			hash: 'SHA-256'
		},
		key,
		256
	);

	// Convert derived key to Base64
	const derivedKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(derivedKey)));
	return derivedKeyBase64;
}
