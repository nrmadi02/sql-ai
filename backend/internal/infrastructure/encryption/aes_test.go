package encryption

import "testing"

func TestEncryptDecryptRoundTrip(t *testing.T) {
	svc, err := NewService("enkripsi-sqlai-dev-key-32bytes!!")
	if err != nil {
		t.Fatalf("NewService: %v", err)
	}

	plaintext := "rahasia123"
	encrypted, err := svc.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("Encrypt: %v", err)
	}

	if encrypted == plaintext {
		t.Fatal("encrypted value should differ from plaintext")
	}

	decrypted, err := svc.Decrypt(encrypted)
	if err != nil {
		t.Fatalf("Decrypt: %v", err)
	}

	if decrypted != plaintext {
		t.Fatalf("expected %q, got %q", plaintext, decrypted)
	}
}