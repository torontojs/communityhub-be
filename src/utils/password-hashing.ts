const PBKDF2_ITERATIONS = 600000;
const PBKDF2_HASH = 'SHA-512';
const DERIVED_KEY_LENGTH = 512;

/**
 * Converts a Uint8Array to a Base64 string.
 */
function toBase64(buffer: Uint8Array): string {
	return btoa(String.fromCharCode(...buffer));
}

/**
 * Converts a Base64 string to a Uint8Array.
 */
function fromBase64(str: string): Uint8Array {
	return new Uint8Array([...atob(str)].map((char) => char.charCodeAt(0)));
}

/**
 * Derives a key using PBKDF2 with the given password and salt.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const passwordBuffer = encoder.encode(password);

	// Import the password as key material
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordBuffer,
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	// Derive key using PBKDF2-HMAC-SHA256
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: PBKDF2_HASH
		},
		keyMaterial,
		DERIVED_KEY_LENGTH
	);

	return new Uint8Array(derivedBits);
}

/**
 * Hashes a password using PBKDF2 and returns a string in the format "salt:hash".
 */
export async function hashPassword(password: string): Promise<string> {
	// Generate a 16-byte random salt
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const derivedKey = await deriveKey(password, salt);

	// Encode salt and hash as Base64 and concatenate with ':'
	return `${toBase64(salt)}:${toBase64(derivedKey)}`;
}

/**
 * Validates an input password against a stored hashed password.
 * Returns true if the password matches, otherwise false.
 */
export async function validatePassword(inputPassword: string, hashedPasswordWithSalt: string): Promise<boolean> {
	// Split the stored string into salt and hash components
	const [saltBase64, storedDerivedKeyBase64] = hashedPasswordWithSalt.split(':');
	if (!saltBase64 || !storedDerivedKeyBase64) {
		throw new Error('Invalid hashed password format');
	}

	const salt = fromBase64(saltBase64);
	const storedDerivedKey = fromBase64(storedDerivedKeyBase64);

	// Derive key using the input password and extracted salt
	const derivedKey = await deriveKey(inputPassword, salt);

	// Compare the derived key with the stored key byte by byte
	if (derivedKey.length !== storedDerivedKey.length) {
		return false;
	}
	for (let i = 0; i < derivedKey.length; i++) {
		if (derivedKey[i] !== storedDerivedKey[i]) {
			return false;
		}
	}

	return true;
}
